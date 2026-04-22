use axum::{
    routing::{get, post, put},
    Router,
};
use sea_orm::{Database, DatabaseConnection, ConnectionTrait, EntityTrait, PaginatorTrait, Set, Schema, ActiveModelTrait};
use std::net::SocketAddr;
use tower_http::cors::CorsLayer;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

mod entity;
mod utils;
mod handlers;
mod services;
use entity::{user, llm_provider, model_config, generation_history, amis_template,
    project_generation_task, project_task_message, project_task_event, code_sample, system_setting};

#[derive(Clone)]
pub struct AppState {
    pub db: DatabaseConnection,
    pub http_client: reqwest::Client,
    pub sandbox_url: String,
    pub claw_agent_url: String,
    pub workdir_root: String,
    /// Skills 根目录（运行时读，与 claw-agent-server 共享）。
    /// A.6 引入：backend 不内置 skills（不用 include_str!），运行时直接读宿主机目录，
    /// 让前端管理界面能 list/tree/read/write，且任何编辑对**下一个新任务**立即生效。
    pub skills_root: String,
}

#[tokio::main]
async fn main() {
    dotenvy::dotenv().ok();

    tracing_subscriber::registry()
        .with(tracing_subscriber::EnvFilter::new("debug"))
        .with(tracing_subscriber::fmt::layer())
        .init();

    // 连接 PostgreSQL
    let db_url = std::env::var("DATABASE_URL")
        .unwrap_or_else(|_| "postgres://amis_ai:amis_ai_dev@localhost:5432/amis_ai".to_string());
    let db = Database::connect(&db_url).await.expect("无法连接到数据库");

    // 启用 pgvector 扩展
    let _ = db.execute_unprepared("CREATE EXTENSION IF NOT EXISTS vector").await;

    // 自动建表
    let builder = db.get_database_backend();
    let schema = Schema::new(builder);

    let _ = db.execute(builder.build(&schema.create_table_from_entity(user::Entity))).await;
    let _ = db.execute(builder.build(&schema.create_table_from_entity(llm_provider::Entity))).await;
    let _ = db.execute(builder.build(&schema.create_table_from_entity(model_config::Entity))).await;
    let _ = db.execute(builder.build(&schema.create_table_from_entity(generation_history::Entity))).await;
    let _ = db.execute(builder.build(&schema.create_table_from_entity(amis_template::Entity))).await;
    let _ = db.execute(builder.build(&schema.create_table_from_entity(project_generation_task::Entity))).await;
    let _ = db.execute(builder.build(&schema.create_table_from_entity(project_task_message::Entity))).await;
    let _ = db.execute(builder.build(&schema.create_table_from_entity(project_task_event::Entity))).await;
    // B.1：反向飞轮的 RAG 样例库
    let _ = db.execute(builder.build(&schema.create_table_from_entity(code_sample::Entity))).await;
    // B.7：系统配置 key/value
    let _ = db.execute(builder.build(&schema.create_table_from_entity(system_setting::Entity))).await;
    // B.7：插入默认 adopt_default_status=pending（D3 决策默认 pending）
    let _ = db.execute_unprepared(
        "INSERT INTO system_settings (key, value, description, updated_at)
         VALUES ('adopt_default_status', 'pending', '采纳后入库默认状态：pending=待审，approved=直接进飞轮', NOW())
         ON CONFLICT (key) DO NOTHING"
    ).await;

    // pgvector embedding 列（SeaORM 不支持 vector 类型，需要手动 DDL）。
    // 维度由 EMBEDDING_DIM env 决定（默认 2560，对齐 qwen3-embedding:4b）。
    // 不建 ivfflat 索引：pgvector 的 ivfflat / hnsw 都最大支持 2000 维，
    // 我们暂时用 sequential scan（飞轮起步阶段数据量小完全够用，>10K 条再考虑降维或换模型）。
    let embedding_dim: u32 = std::env::var("EMBEDDING_DIM")
        .ok()
        .and_then(|s| s.parse().ok())
        .unwrap_or(2560);
    for table in ["amis_templates", "code_samples"] {
        let _ = db
            .execute_unprepared(&format!(
                "DO $$ BEGIN
                    ALTER TABLE {table} ADD COLUMN IF NOT EXISTS embedding vector({embedding_dim});
                EXCEPTION WHEN others THEN NULL;
                END $$;"
            ))
            .await;
    }
    // B.5 检索时按 (tech_stack, status) 做候选过滤，建组合索引
    let _ = db.execute_unprepared(
        "CREATE INDEX IF NOT EXISTS idx_code_samples_stack_status
         ON code_samples (tech_stack, status)"
    ).await;

    // 任务级 LLM 选择 + 供应商能力分档的增量 migration
    let _ = db.execute_unprepared(
        "ALTER TABLE project_generation_task
            ADD COLUMN IF NOT EXISTS llm_mode VARCHAR(16) NOT NULL DEFAULT 'default',
            ADD COLUMN IF NOT EXISTS llm_provider_id INTEGER,
            ADD COLUMN IF NOT EXISTS llm_model_name TEXT"
    ).await;
    let _ = db.execute_unprepared(
        "ALTER TABLE llm_providers
            ADD COLUMN IF NOT EXISTS capability_tier VARCHAR(16) NOT NULL DEFAULT 'balanced',
            ADD COLUMN IF NOT EXISTS preferred_model TEXT"
    ).await;
    // A.6 RBAC：用户管理员标志（增量 migration）
    let _ = db.execute_unprepared(
        "ALTER TABLE users
            ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE"
    ).await;
    // 内置 admin 账号补回管理员权限（兼容已有数据库）
    let _ = db.execute_unprepared(
        "UPDATE users SET is_admin = TRUE WHERE username = 'admin'"
    ).await;

    // 种子数据
    seed_users(&db).await;
    seed_llm_configs(&db).await;

    // 内部服务 URL 配置
    let sandbox_url = std::env::var("SANDBOX_SERVICE_URL")
        .unwrap_or_else(|_| "http://localhost:8091".to_string());
    let claw_agent_url = std::env::var("CLAW_AGENT_URL")
        .unwrap_or_else(|_| "http://localhost:8090".to_string());
    let workdir_root = std::env::var("SANDBOX_WORKDIR_ROOT")
        .unwrap_or_else(|_| "/var/amis-ai/workdirs".to_string());

    // A.6：Skills 根目录（与 claw-agent-server 共享，由 start-services.sh 设 CLAW_CONFIG_HOME）
    // 优先级：SKILLS_ROOT > CLAW_CONFIG_HOME/skills > 硬编码兜底
    let skills_root = std::env::var("SKILLS_ROOT").unwrap_or_else(|_| {
        std::env::var("CLAW_CONFIG_HOME")
            .map(|h| format!("{}/skills", h))
            .unwrap_or_else(|_| "/home/karl/Working/TianXing/amis-ai/skills".to_string())
    });

    // 禁用系统代理，避免本地代理软件拦截对 LLM API 的请求
    let state = AppState {
        db,
        http_client: reqwest::Client::builder()
            .no_proxy()
            .build()
            .expect("无法创建 HTTP 客户端"),
        sandbox_url,
        claw_agent_url,
        workdir_root,
        skills_root,
    };

    // CORS（开发阶段全放开）
    let cors = CorsLayer::permissive();

    // 路由
    let app = Router::new()
        // 认证
        .route("/api/auth/register", post(handlers::auth::register))
        .route("/api/auth/login", post(handlers::auth::login))
        .route("/api/user/profile", get(handlers::auth::get_profile))
        // LLM 供应商管理
        .route("/api/llm/providers", get(handlers::llm_admin::list_providers).post(handlers::llm_admin::create_provider))
        .route("/api/llm/providers/:id", put(handlers::llm_admin::update_provider).delete(handlers::llm_admin::delete_provider))
        .route("/api/llm/providers/:id/test", post(handlers::llm_admin::test_provider))
        .route("/api/llm/providers/:id/models", get(handlers::llm_admin::list_provider_models))
        // LLM 模型配置管理
        .route("/api/llm/configs", get(handlers::llm_admin::list_model_configs).post(handlers::llm_admin::create_model_config))
        .route("/api/llm/configs/:id", put(handlers::llm_admin::update_model_config).delete(handlers::llm_admin::delete_model_config))
        // 生成历史管理
        .route("/api/history", get(handlers::history::list_history).post(handlers::history::create_history))
        .route("/api/history/:id", get(handlers::history::get_history).delete(handlers::history::delete_history))
        .route("/api/history/:id/adopt", put(handlers::history::adopt_history))
        // 模板库
        .route("/api/templates", get(handlers::template::list_templates))
        .route("/api/templates/:id", get(handlers::template::get_template))
        // 项目生成任务（反向代码生成飞轮）
        .route("/api/projects/tasks", get(handlers::project_generation::list_tasks).post(handlers::project_generation::create_task))
        .route("/api/projects/tasks/llm-preview", post(handlers::project_generation::llm_preview))
        .route("/api/projects/tasks/:id", get(handlers::project_generation::get_task))
        .route("/api/projects/tasks/:id/message", post(handlers::project_generation::add_message))
        .route("/api/projects/tasks/:id/stop", post(handlers::project_generation::stop_task))
        .route("/api/projects/tasks/:id/events", get(handlers::project_events::ws_events))
        .route("/api/projects/tasks/:id/events/history", get(handlers::project_events::list_events_history))
        .route("/api/projects/tasks/:id/dev-status", get(handlers::project_events::get_dev_status))
        .route("/api/projects/tasks/:id/pages", get(handlers::project_events::list_task_pages))
        .route("/api/projects/tasks/:id/permission-decision", post(handlers::project_events::post_permission_decision))
        .route("/api/projects/tasks/:id/runtime-error", post(handlers::project_events::post_runtime_error))
        // 云端 IDE：文件系统 / 终端 透传（前端走 backend → sandbox-service）
        .route("/api/projects/tasks/:id/ide/fs/tree", get(handlers::project_ide::fs_tree))
        .route("/api/projects/tasks/:id/ide/fs/file",
            get(handlers::project_ide::fs_read)
                .put(handlers::project_ide::fs_write)
                .delete(handlers::project_ide::fs_delete))
        .route("/api/projects/tasks/:id/ide/fs/mkdir", post(handlers::project_ide::fs_mkdir))
        .route("/api/projects/tasks/:id/ide/terminal", get(handlers::project_ide::terminal_ws))

        // A.6: Skills 知识库管理（仅 admin）
        .route("/api/skills",
            get(handlers::skills_admin::list_buckets)
                .post(handlers::skills_admin::create_bucket))
        .route("/api/skills/:bucket/tree", get(handlers::skills_admin::bucket_tree))
        .route("/api/skills/:bucket/file",
            get(handlers::skills_admin::read_file)
                .put(handlers::skills_admin::write_file)
                .delete(handlers::skills_admin::delete_path))
        .route("/api/skills/:bucket/mkdir", post(handlers::skills_admin::mkdir))
        .route("/api/skills/:bucket/rename", post(handlers::skills_admin::rename_path))

        // B.3: RAG 样例库 CRUD（仅 admin）
        .route("/api/code-samples",
            get(handlers::code_samples::list_code_samples)
                .post(handlers::code_samples::create_code_sample))
        .route("/api/code-samples/:id",
            get(handlers::code_samples::get_code_sample)
                .put(handlers::code_samples::update_code_sample)
                .delete(handlers::code_samples::delete_code_sample))
        .route("/api/code-samples/:id/approve", post(handlers::code_samples::approve_code_sample))
        .route("/api/code-samples/:id/reject", post(handlers::code_samples::reject_code_sample))

        // B.7: 系统配置（仅 admin）
        .route("/api/system-settings", get(handlers::system_settings::list_settings))
        .route("/api/system-settings/:key",
            get(handlers::system_settings::get_setting)
                .put(handlers::system_settings::upsert_setting))
        // 嵌入维度兼容性探测（探活 + 列维度对比）
        .route("/api/system/embedding-info", get(handlers::system_settings::embedding_info))

        // B.7: 任务采纳（用户级，写回 RAG 样例库）
        .route("/api/projects/tasks/:id/adopt", post(handlers::project_generation::adopt_task))
        // 内部 API（供 Python 服务调用）
        .route("/api/internal/llm/resolve/:task_type", get(handlers::llm_admin::resolve_llm_config))
        // 健康检查
        .route("/api/health", get(health_check))
        .layer(cors)
        .with_state(state);

    let addr = SocketAddr::from(([0, 0, 0, 0], 8080));

    let listener = match tokio::net::TcpListener::bind(addr).await {
        Ok(listener) => {
            tracing::info!("🚀 amis-ai 后台服务已启动，监听地址: {}", addr);
            listener
        }
        Err(e) => {
            tracing::error!("无法绑定到端口 {}: {}", addr, e);
            panic!("服务器启动失败");
        }
    };

    axum::serve(listener, app).await.unwrap();
}

async fn health_check() -> &'static str {
    "ok"
}

async fn seed_users(db: &DatabaseConnection) {
    let count = user::Entity::find().count(db).await.unwrap();
    if count == 0 {
        let admin = user::ActiveModel {
            username: Set("admin".to_owned()),
            password: Set(utils::hash::hash_password("admin123")),
            email: Set("admin@amis-ai.com".to_owned()),
            is_active: Set(true),
            is_admin: Set(true),
            created_at: Set(chrono::Local::now().naive_local()),
            ..Default::default()
        };

        user::Entity::insert(admin).exec(db).await.unwrap();
        tracing::info!("已初始化管理员账号 (admin/admin123)");
    }
}

async fn seed_llm_configs(db: &DatabaseConnection) {
    let count = llm_provider::Entity::find().count(db).await.unwrap();
    if count == 0 {
        let base_url = std::env::var("LLM_BASE_URL")
            .unwrap_or_else(|_| "http://localhost:8045/v1".to_string());
        let api_key = std::env::var("LLM_API_KEY")
            .unwrap_or_else(|_| "sk-placeholder".to_string());

        let provider = llm_provider::ActiveModel {
            name: Set("默认服务商".to_owned()),
            base_url: Set(base_url),
            api_key: Set(api_key),
            is_active: Set(true),
            created_at: Set(chrono::Local::now().naive_local()),
            protocol: Set("openai".to_owned()),
            capability_tier: Set("balanced".to_owned()),
            preferred_model: Set(None),
            ..Default::default()
        };
        let provider = provider.insert(db).await.unwrap();

        let configs = vec![
            ("generation", "deepseek-chat",          0.7_f32, Some(8192_i32)),
            ("embedding",  "text-embedding-3-small", 0.0,     None),
            ("chat",       "deepseek-chat",          0.7,     Some(4096)),
        ];

        for (task, model, temp, max_tok) in configs {
            model_config::ActiveModel {
                task_type: Set(task.to_owned()),
                provider_id: Set(provider.id),
                model_name: Set(model.to_owned()),
                temperature: Set(temp),
                max_tokens: Set(max_tok),
                is_active: Set(true),
                ..Default::default()
            }.insert(db).await.unwrap();
        }

        tracing::info!("已初始化 LLM 供应商和模型配置");
    }
}
