use axum::{
    routing::{get, post, put},
    Router,
};
use sea_orm::{Database, DatabaseConnection, ConnectionTrait, EntityTrait, PaginatorTrait, Set, Schema, ActiveModelTrait};
use std::net::SocketAddr;
use std::sync::Arc;
use tower_http::cors::CorsLayer;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

mod entity;
mod utils;
mod handlers;
mod services;
use entity::{user, llm_provider, model_config, generation_history, amis_template,
    project_generation_task, project_task_message, project_task_event, code_sample, system_setting,
    skill_authoring_session, conversation_session, conversation_message};

#[derive(Clone)]
pub struct AppState {
    pub db: DatabaseConnection,
    pub http_client: reqwest::Client,
    pub sandbox_url: String,
    pub claw_agent_url: String,
    /// 1.2.0：multipage 任务收尾后调 agent /multipage/record 写 RAG。
    /// 由 env `AGENT_URL` 注入，默认 `http://localhost:8000`。
    pub agent_url: String,
    pub workdir_root: String,
    /// Skills 根目录（运行时读，与 claw-agent-server 共享）。
    /// A.6 引入：backend 不内置 skills（不用 include_str!），运行时直接读宿主机目录，
    /// 让前端管理界面能 list/tree/read/write，且任何编辑对**下一个新任务**立即生效。
    pub skills_root: String,
    /// 底座模板注册表（2026-04 技术栈解耦重构，从 scaffolds/registry.yaml 启动加载）
    pub template_registry: Arc<services::template_registry::TemplateRegistry>,
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
    // Synthetic Honey：Skill AI 起草会话表
    let _ = db.execute(builder.build(&schema.create_table_from_entity(skill_authoring_session::Entity))).await;
    // Synthetic Honey：常用索引
    let _ = db.execute_unprepared(
        "CREATE INDEX IF NOT EXISTS idx_sas_user_status
         ON skill_authoring_session (user_id, status)"
    ).await;
    let _ = db.execute_unprepared(
        "CREATE INDEX IF NOT EXISTS idx_sas_expires
         ON skill_authoring_session (expires_at)"
    ).await;
    // 通用 AI 对话：会话 + 消息（左侧菜单「AI 对话」用）
    let _ = db.execute(builder.build(&schema.create_table_from_entity(conversation_session::Entity))).await;
    let _ = db.execute(builder.build(&schema.create_table_from_entity(conversation_message::Entity))).await;
    let _ = db.execute_unprepared(
        "CREATE INDEX IF NOT EXISTS idx_conv_session_user_updated
         ON conversation_session (user_id, updated_at DESC)"
    ).await;
    let _ = db.execute_unprepared(
        "CREATE INDEX IF NOT EXISTS idx_conv_message_session
         ON conversation_message (session_pk, created_at)"
    ).await;
    // B.7：插入默认 adopt_default_status=pending（D3 决策默认 pending）
    let _ = db.execute_unprepared(
        "INSERT INTO system_settings (key, value, description, updated_at)
         VALUES ('adopt_default_status', 'pending', '采纳后入库默认状态：pending=待审，approved=直接进飞轮', NOW())
         ON CONFLICT (key) DO NOTHING"
    ).await;
    // Synthetic Honey：Skill 起草相关的默认配置
    let _ = db.execute_unprepared(
        "INSERT INTO system_settings (key, value, description, updated_at) VALUES
         ('skill_authoring.draft_ttl_hours', '24', 'Skill 起草会话保留时长（小时），过期自动清理草稿目录', NOW()),
         ('skill_authoring.max_reference_buckets', '3', 'Skill 起草向导允许勾选的参考桶数量上限', NOW()),
         ('skill_authoring.max_extra_context_chars', '8000', 'Skill 起草意图表单中 extra_context 字符上限', NOW()),
         ('skill_authoring.max_file_bytes', '262144', 'Skill 起草单文件字节上限（默认 256KB）', NOW()),
         ('skill_authoring.max_bucket_bytes', '2097152', 'Skill 起草整桶字节上限（默认 2MB）', NOW()),
         ('skill_authoring.max_files_per_bucket', '10', 'Skill 起草整桶文件数量上限', NOW()),
         ('skill_authoring.fewshot_inline_refs', '2', 'Few-shot 打包时每个参考桶除 SKILL.md 外再附几份最短 references 全文', NOW())
         ON CONFLICT (key) DO NOTHING"
    ).await;

    // 2026-04-25 模型配置改"按功能槽位"：每个 task_type 只允许一条 active 记录。
    //   1. 先把同 task_type 的 active 重复行收敛成"id 最大那条 active，其它 inactive"
    //   2. 再加部分唯一索引兜底（防止后续 API 写入重复）
    // 用户表态"随便清理，改完手动配置"，这里走最保守路径：不删历史行，只把多余 active 设 false。
    let _ = db.execute_unprepared(
        "UPDATE model_configs SET is_active = FALSE
         WHERE is_active = TRUE AND id NOT IN (
             SELECT MAX(id) FROM model_configs WHERE is_active = TRUE GROUP BY task_type
         )"
    ).await;
    let _ = db.execute_unprepared(
        "CREATE UNIQUE INDEX IF NOT EXISTS uniq_model_configs_active_task_type
           ON model_configs (task_type) WHERE is_active = TRUE"
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

    // 2026-04-25 修：amis_templates.created_at 历史上 NOT NULL 但没默认值，
    // 导致 agent loader.py 写种子模板时报 "null value in column created_at"。
    // 这里加默认值兜底；agent 端 INSERT 也补显式 created_at（双保险）。
    let _ = db.execute_unprepared(
        "ALTER TABLE amis_templates ALTER COLUMN created_at SET DEFAULT NOW()"
    ).await;
    let _ = db.execute_unprepared(
        "ALTER TABLE code_samples ALTER COLUMN created_at SET DEFAULT NOW()"
    ).await;
    // B.5 检索时按 (tech_stack, status) 做候选过滤，建组合索引（兼容期继续保留）
    let _ = db.execute_unprepared(
        "CREATE INDEX IF NOT EXISTS idx_code_samples_stack_status
         ON code_samples (tech_stack, status)"
    ).await;

    // 技术栈解耦（2026-04）：code_samples 加 4 个 text[] 列 + GIN 索引
    let _ = db.execute_unprepared(
        "ALTER TABLE code_samples
            ADD COLUMN IF NOT EXISTS platforms   text[] NOT NULL DEFAULT '{}',
            ADD COLUMN IF NOT EXISTS tech_stacks text[] NOT NULL DEFAULT '{}',
            ADD COLUMN IF NOT EXISTS ui_libs     text[] NOT NULL DEFAULT '{}',
            ADD COLUMN IF NOT EXISTS tags        text[] NOT NULL DEFAULT '{}'"
    ).await;
    // 回填旧数据（幂等：仅对空数组的行回填，已有多维标签的不覆盖）
    let _ = db.execute_unprepared(
        "UPDATE code_samples
            SET tech_stacks = ARRAY[tech_stack]
            WHERE tech_stacks = '{}' AND tech_stack IS NOT NULL AND tech_stack <> ''"
    ).await;
    let _ = db.execute_unprepared(
        "UPDATE code_samples SET platforms = CASE
            WHEN tech_stack LIKE 'uniapp%' OR tech_stack LIKE 'rn-%' THEN ARRAY['mobile']
            WHEN tech_stack LIKE 'react%' OR tech_stack LIKE 'vue%'  THEN ARRAY['web']
            ELSE ARRAY[]::text[]
        END
        WHERE platforms = '{}' AND tech_stack IS NOT NULL"
    ).await;
    let _ = db.execute_unprepared(
        "UPDATE code_samples SET ui_libs = CASE
            WHEN tech_stack = 'uniapp-wot-h5' THEN ARRAY['wot']
            WHEN tech_stack LIKE '%-antd'     THEN ARRAY['antd']
            WHEN tech_stack LIKE '%-element'  THEN ARRAY['element-plus']
            WHEN tech_stack LIKE '%-element-plus' THEN ARRAY['element-plus']
            ELSE ARRAY[]::text[]
        END
        WHERE ui_libs = '{}' AND tech_stack IS NOT NULL"
    ).await;
    // GIN 索引（支持 && / <@ / @> 数组操作符）
    let _ = db.execute_unprepared(
        "CREATE INDEX IF NOT EXISTS idx_code_samples_platforms   ON code_samples USING GIN (platforms)"
    ).await;
    let _ = db.execute_unprepared(
        "CREATE INDEX IF NOT EXISTS idx_code_samples_tech_stacks ON code_samples USING GIN (tech_stacks)"
    ).await;
    let _ = db.execute_unprepared(
        "CREATE INDEX IF NOT EXISTS idx_code_samples_ui_libs     ON code_samples USING GIN (ui_libs)"
    ).await;
    let _ = db.execute_unprepared(
        "CREATE INDEX IF NOT EXISTS idx_code_samples_tags        ON code_samples USING GIN (tags)"
    ).await;

    // 1.4 B.1 双路召回：code_samples 加 keyword_index text[] + GIN 索引
    // 入库时由 Python keyword_extractor 从 amis_json 提关键字（type/subType/api）
    // 召回时与 query_amis_json 提取的关键字做交集，每命中 +0.06，上限 +0.3
    let _ = db.execute_unprepared(
        "ALTER TABLE code_samples
            ADD COLUMN IF NOT EXISTS keyword_index text[] NOT NULL DEFAULT '{}'"
    ).await;
    let _ = db.execute_unprepared(
        "CREATE INDEX IF NOT EXISTS idx_code_samples_keyword_index ON code_samples USING GIN (keyword_index)"
    ).await;

    // 2026-04 RAG 质量闭环：code_samples 加反馈/评分/评委/负例列（全部可空，幂等）
    //   - thumbs_up/down：admin 双向反馈计数（Phase 1 埋点 only，默认不进 ranking）
    //   - rating / rating_note / rating_by / rating_at：人工 0-5 主观评分（null=未评）
    //   - quality_verdict / quality_reason / quality_judge_at / quality_judge_model：LLM 二元评委（good/needs_review/bad）
    //   - is_negative / negative_kind / rejection_reason：反向飞轮（kind: structural/stylistic/full）
    let _ = db.execute_unprepared(
        "ALTER TABLE code_samples
            ADD COLUMN IF NOT EXISTS thumbs_up        INT       NOT NULL DEFAULT 0,
            ADD COLUMN IF NOT EXISTS thumbs_down      INT       NOT NULL DEFAULT 0,
            ADD COLUMN IF NOT EXISTS rating           REAL      NULL,
            ADD COLUMN IF NOT EXISTS rating_note      TEXT      NULL,
            ADD COLUMN IF NOT EXISTS rating_by        INT       NULL,
            ADD COLUMN IF NOT EXISTS rating_at        TIMESTAMP NULL,
            ADD COLUMN IF NOT EXISTS quality_verdict  TEXT      NULL,
            ADD COLUMN IF NOT EXISTS quality_reason   TEXT      NULL,
            ADD COLUMN IF NOT EXISTS quality_judge_at TIMESTAMP NULL,
            ADD COLUMN IF NOT EXISTS quality_judge_model TEXT   NULL,
            ADD COLUMN IF NOT EXISTS is_negative      BOOLEAN   NOT NULL DEFAULT FALSE,
            ADD COLUMN IF NOT EXISTS negative_kind    TEXT      NULL,
            ADD COLUMN IF NOT EXISTS rejection_reason TEXT      NULL"
    ).await;
    // 高选择性索引（过滤用）
    let _ = db.execute_unprepared(
        "CREATE INDEX IF NOT EXISTS idx_code_samples_is_negative
         ON code_samples(is_negative) WHERE is_negative = TRUE"
    ).await;
    let _ = db.execute_unprepared(
        "CREATE INDEX IF NOT EXISTS idx_code_samples_rating
         ON code_samples(rating) WHERE rating IS NOT NULL"
    ).await;
    let _ = db.execute_unprepared(
        "CREATE INDEX IF NOT EXISTS idx_code_samples_quality_verdict
         ON code_samples(quality_verdict) WHERE quality_verdict IS NOT NULL"
    ).await;

    // 2026-04 RAG 质量闭环：code_sample_audit 审计 timeline 表
    //   - operator_kind: admin / system / llm_judge
    //   - action: create / approve / reject / rate / thumbs_up / thumbs_down
    //             / mark_negative / unmark_negative / judge / update / config_change
    //   - before/after：JSONB 存差异
    let _ = db.execute_unprepared(
        "CREATE TABLE IF NOT EXISTS code_sample_audit (
            id            SERIAL PRIMARY KEY,
            sample_id     INT       NOT NULL REFERENCES code_samples(id) ON DELETE CASCADE,
            operator_id   INT       NULL,
            operator_kind TEXT      NOT NULL,
            action        TEXT      NOT NULL,
            before_json   JSONB     NULL,
            after_json    JSONB     NULL,
            note          TEXT      NULL,
            created_at    TIMESTAMP NOT NULL DEFAULT NOW()
        )"
    ).await;
    let _ = db.execute_unprepared(
        "CREATE INDEX IF NOT EXISTS idx_sample_audit_sample
         ON code_sample_audit (sample_id, created_at DESC)"
    ).await;
    let _ = db.execute_unprepared(
        "CREATE INDEX IF NOT EXISTS idx_sample_audit_action_created
         ON code_sample_audit (action, created_at DESC)"
    ).await;

    // 2026-04 RAG 质量闭环：默认 system_settings（rag.* 前缀）。knob 默认保守：
    //   - weighting / quality_filter / judge / negative 全部默认 disabled，admin 按阶段激活
    //   - exclude_tags 默认 ["antipattern"] —— MVP 即生效的唯一硬过滤
    let _ = db.execute_unprepared(
        "INSERT INTO system_settings (key, value, description, updated_at) VALUES
         ('rag.weighting.enabled',           'false',         '主总闸：开启后 thumbs / hit_count 进入 ranking；先 OFF 2 周', NOW()),
         ('rag.weighting.thumbs_mode',       'tiebreaker',    'off / tiebreaker（cos_sim 差 <0.05 时 0.05 权重）/ boost（权重 0.2）', NOW()),
         ('rag.weighting.hit_count_enabled', 'false',         '启用 ln(1+hit/10) 权重 0.1；样本 N<100 时无意义', NOW()),
         ('rag.quality_filter.min_rating',   '',              '人工 rating 硬过滤下限（>=N 才召回；空串=不过滤）', NOW()),
         ('rag.quality_filter.min_verdict',  '',              'LLM verdict 硬过滤（good / needs_review；空串=不过滤）', NOW()),
         ('rag.quality_filter.exclude_tags', 'antipattern',   'tags 黑名单（逗号分隔，硬过滤）', NOW()),
         ('rag.judge.mode',                  'disabled',      'disabled / manual（admin 点按钮）/ auto_on_adopt', NOW()),
         ('rag.judge.task_type',             'quality_judge', 'LLM task_type key（建议绑与 generation 不同 provider 的模型）', NOW()),
         ('rag.judge.budget_per_day',        '50',            '每日 judge 调用上限', NOW()),
         ('rag.judge.batch_concurrency',     '3',             '批量评分并发', NOW()),
         ('rag.judge.auto_negative_on_bad',  'false',         '1.4 B.3a：评委 verdict=bad 时自动 mark is_negative（默认关闭，admin 评估后开启）', NOW()),
         ('rag.judge.page_mode',             'disabled',      '1.4 B.3b：page 级评委模式 disabled / manual / auto_on_complete', NOW()),
         ('rag.negative.enabled',            'false',         '总闸：RAG 召回是否额外注入负例', NOW()),
         ('rag.negative.top_k',              '1',             '最多注入几条负例', NOW()),
         ('rag.negative.only_structural',    'true',          '仅注入 negative_kind=structural 的（避 LLM negation blindness）', NOW()),
         ('rag.pending_badge.poll_interval_sec', '60',        '菜单 Badge 轮询周期（秒）', NOW())
         ON CONFLICT (key) DO NOTHING"
    ).await;

    // 2026-04-25 任务追踪日志（tracelog）默认配置 —— 默认 disabled，admin 在「系统设置 → 任务追踪日志」启
    let _ = db.execute_unprepared(
        "INSERT INTO system_settings (key, value, description, updated_at) VALUES
         ('tracelog.mode',           'disabled', '任务执行追踪日志模式：disabled / smart（仅失败任务详记）/ all_tasks（全记）', NOW()),
         ('tracelog.dir',            '/tmp/amis-ai/tracelogs', '归档根目录；prod 建议改 /var/amis-ai/tracelogs', NOW()),
         ('tracelog.retention_days', '30',       '超期自动清理（≤0 = 永久保留）', NOW()),
         ('tracelog.compress',       'true',     '任务终结后 tar.gz 压缩归档（省 70%+）', NOW())
         ON CONFLICT (key) DO NOTHING"
    ).await;

    // 技术栈解耦（2026-04）：project_generation_task 加多维字段
    let _ = db.execute_unprepared(
        "ALTER TABLE project_generation_task
            ADD COLUMN IF NOT EXISTS platform              VARCHAR(32) NOT NULL DEFAULT 'mobile',
            ADD COLUMN IF NOT EXISTS template_name         VARCHAR(64),
            ADD COLUMN IF NOT EXISTS selected_skill_buckets text[] NOT NULL DEFAULT '{}',
            ADD COLUMN IF NOT EXISTS platforms             text[] NOT NULL DEFAULT '{}',
            ADD COLUMN IF NOT EXISTS tech_stacks           text[] NOT NULL DEFAULT '{}',
            ADD COLUMN IF NOT EXISTS ui_libs               text[] NOT NULL DEFAULT '{}'"
    ).await;
    // 老任务回填（幂等：tech_stacks 为空数组的行才回填）
    let _ = db.execute_unprepared(
        "UPDATE project_generation_task SET
            platform      = CASE WHEN tech_stack LIKE 'uniapp%' THEN 'mobile' ELSE 'web' END,
            template_name = CASE WHEN template_name IS NULL THEN CONCAT(tech_stack, '-template') ELSE template_name END,
            tech_stacks   = ARRAY[tech_stack],
            ui_libs       = ARRAY[ui_library],
            platforms     = CASE WHEN tech_stack LIKE 'uniapp%' THEN ARRAY['mobile'] ELSE ARRAY['web'] END
         WHERE tech_stacks = '{}' AND tech_stack IS NOT NULL"
    ).await;

    // 1.2.0 多页扩展：执行策略 + 复用策略 + 页数
    let _ = db.execute_unprepared(
        "ALTER TABLE project_generation_task
            ADD COLUMN IF NOT EXISTS execution_strategy varchar(16) NOT NULL DEFAULT 'unified',
            ADD COLUMN IF NOT EXISTS reuse_strategy varchar(16),
            ADD COLUMN IF NOT EXISTS page_count integer NOT NULL DEFAULT 1"
    ).await;
    let _ = db.execute_unprepared(
        "CREATE INDEX IF NOT EXISTS idx_pgt_strategy
         ON project_generation_task (execution_strategy, reuse_strategy)
         WHERE execution_strategy = 'isolated'"
    ).await;

    // 1.2 多页面飞轮：项目任务页面表
    let _ = db.execute_unprepared(
        "CREATE TABLE IF NOT EXISTS project_task_page (
            id              SERIAL PRIMARY KEY,
            task_id         INT NOT NULL REFERENCES project_generation_task(id) ON DELETE CASCADE,
            page_idx        INT NOT NULL,
            route_path      VARCHAR(255) NOT NULL,
            amis_json       TEXT NOT NULL,
            claw_session_id VARCHAR(64),
            status          VARCHAR(16) NOT NULL DEFAULT 'pending',
            started_at      TIMESTAMP,
            finished_at     TIMESTAMP,
            error_msg       TEXT,
            created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
            updated_at      TIMESTAMP NOT NULL DEFAULT NOW(),
            UNIQUE (task_id, page_idx),
            UNIQUE (task_id, route_path)
        )"
    ).await;
    let _ = db.execute_unprepared(
        "CREATE INDEX IF NOT EXISTS idx_ptp_task_status
         ON project_task_page (task_id, status)"
    ).await;
    // 1.2 修复：早期建表用了 TIMESTAMPTZ 跟 entity DateTime(NaiveDateTime) 不兼容，
    // 转回 TIMESTAMP（PG 自动转换，UTC 时间保留，丢时区无影响因为项目惯例不用 TZ）
    let _ = db.execute_unprepared(
        "ALTER TABLE project_task_page
            ALTER COLUMN created_at TYPE TIMESTAMP,
            ALTER COLUMN updated_at TYPE TIMESTAMP,
            ALTER COLUMN started_at TYPE TIMESTAMP,
            ALTER COLUMN finished_at TYPE TIMESTAMP"
    ).await;
    // 1.4 B.3b：page 级 LLM 评委结果字段（4 列幂等，全部可空）
    //   - page_quality_verdict: good / needs_review / bad
    //   - page_quality_reason: LLM 评委说明（截断 500 字）
    //   - page_quality_judge_at: 评分时刻
    //   - page_quality_judge_model: 评分用的模型名
    let _ = db.execute_unprepared(
        "ALTER TABLE project_task_page
            ADD COLUMN IF NOT EXISTS page_quality_verdict  TEXT      NULL,
            ADD COLUMN IF NOT EXISTS page_quality_reason   TEXT      NULL,
            ADD COLUMN IF NOT EXISTS page_quality_judge_at TIMESTAMP NULL,
            ADD COLUMN IF NOT EXISTS page_quality_judge_model TEXT   NULL"
    ).await;
    // 高选择性索引：用于查询 bad pages 做评测分析
    let _ = db.execute_unprepared(
        "CREATE INDEX IF NOT EXISTS idx_ptp_quality_verdict
         ON project_task_page(page_quality_verdict) WHERE page_quality_verdict IS NOT NULL"
    ).await;

    // 任务级 LLM 选择 + 供应商能力分档的增量 migration
    let _ = db.execute_unprepared(
        "ALTER TABLE project_generation_task
            ADD COLUMN IF NOT EXISTS llm_mode VARCHAR(16) NOT NULL DEFAULT 'default',
            ADD COLUMN IF NOT EXISTS llm_provider_id INTEGER,
            ADD COLUMN IF NOT EXISTS llm_model_name TEXT"
    ).await;
    // 2026-04（性能优化）：为 auto 模式的 30 天历史成功率聚合 SQL + 常规 list_tasks 查询补复合索引
    //   - idx_pgt_user_created_provider：加速 llm_selector::fetch_history_success_rates 的
    //     `WHERE user_id=? AND created_at>=? AND llm_provider_id IS NOT NULL GROUP BY llm_provider_id`
    //   - idx_pgt_user_created：加速 list_tasks 的 `ORDER BY created_at DESC`
    // 注：幂等，小库瞬秒；大库 >10k 行可切 CONCURRENTLY 但需事务外执行，本阶段不需要。
    let _ = db.execute_unprepared(
        "CREATE INDEX IF NOT EXISTS idx_pgt_user_created_provider
           ON project_generation_task (user_id, created_at DESC, llm_provider_id)
           WHERE llm_provider_id IS NOT NULL"
    ).await;
    let _ = db.execute_unprepared(
        "CREATE INDEX IF NOT EXISTS idx_pgt_user_created
           ON project_generation_task (user_id, created_at DESC)"
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
    let agent_url = std::env::var("AGENT_URL")
        .unwrap_or_else(|_| "http://localhost:8000".to_string());
    let workdir_root = std::env::var("SANDBOX_WORKDIR_ROOT")
        .unwrap_or_else(|_| "/var/amis-ai/workdirs".to_string());

    // A.6：Skills 根目录（与 claw-agent-server 共享，由 start-services.sh 设 CLAW_CONFIG_HOME）
    // 优先级：SKILLS_ROOT > CLAW_CONFIG_HOME/skills > 硬编码兜底
    let skills_root = std::env::var("SKILLS_ROOT").unwrap_or_else(|_| {
        std::env::var("CLAW_CONFIG_HOME")
            .map(|h| format!("{}/skills", h))
            .unwrap_or_else(|_| "/home/karl/Working/TianXing/amis-ai/skills".to_string())
    });

    // 2026-04 技术栈解耦：启动时加载底座模板注册表
    let template_registry = services::template_registry::load_default();

    // 禁用系统代理，避免本地代理软件拦截对 LLM API 的请求
    // 2026-04（性能优化）：加连接池 + 超时 + TCP keepalive，避免 TCP 卡死拖 30s+、
    // 同时让 Python agent / sandbox-service / claw-agent-server 这三个内网调用复用连接。
    //   - 全局 timeout 60s 兜底；RAG 等调用点各自有更短的 per-call timeout 覆盖
    //   - connect_timeout 5s：本地服务通常 <50ms，>5s 基本代表挂了
    //   - pool_max_idle_per_host 32：单任务可能并发跑 sandbox + RAG + claw + IDE 透传
    //   - tcp_keepalive 60s：WSL / docker bridge 上防止闲置 conn 被静默断开
    let http_client = reqwest::Client::builder()
        .no_proxy()
        .pool_max_idle_per_host(32)
        .pool_idle_timeout(std::time::Duration::from_secs(90))
        .connect_timeout(std::time::Duration::from_secs(5))
        .timeout(std::time::Duration::from_secs(60))
        .tcp_keepalive(std::time::Duration::from_secs(60))
        .build()
        .expect("无法创建 HTTP 客户端");

    let state = AppState {
        db,
        http_client,
        sandbox_url,
        claw_agent_url,
        agent_url,
        workdir_root,
        skills_root,
        template_registry,
    };

    // Synthetic Honey：后台定时清理过期的 Skill 起草会话（每 30min 扫一次 expires_at < now）
    handlers::skill_authoring::spawn_ttl_cleanup(state.clone());

    // 2026-04-25 任务追踪日志后台清理（每 6 小时扫一次，超 retention_days 删）
    services::tracelog::spawn_cleanup(state.clone());

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
        // 2026-04-25：批量删除（必须排在 `:id` 之前，避免被 :id="batch-delete" 截胡）
        .route("/api/projects/tasks/batch-delete", post(handlers::project_generation::batch_delete_tasks))
        .route("/api/projects/tasks/:id", get(handlers::project_generation::get_task).delete(handlers::project_generation::delete_task))
        .route("/api/projects/tasks/:id/message", post(handlers::project_generation::add_message))
        .route("/api/projects/tasks/:id/stop", post(handlers::project_generation::stop_task))
        .route("/api/projects/tasks/:id/analyze", post(handlers::task_analyzer::analyze_task))
        .route("/api/projects/tasks/:id/events", get(handlers::project_events::ws_events))
        .route("/api/projects/tasks/:id/events/history", get(handlers::project_events::list_events_history))
        .route("/api/projects/tasks/:id/dev-status", get(handlers::project_events::get_dev_status))
        .route("/api/projects/tasks/:id/pages", get(handlers::project_events::list_task_pages))
        .route("/api/projects/tasks/:id/db-pages", get(handlers::project_pages::list_db_pages))
        .route("/api/projects/tasks/:id/reuse-rate", get(handlers::project_pages::get_reuse_rate))
        .route("/api/projects/tasks/:id/permission-decision", post(handlers::project_events::post_permission_decision))
        .route("/api/projects/tasks/:id/runtime-error", post(handlers::project_events::post_runtime_error))
        // 2026-04-25 任务追踪日志归档查询 + 下载（任务归属校验）
        .route("/api/projects/tasks/:id/tracelog", get(handlers::project_events::get_task_tracelog_info))
        .route("/api/projects/tasks/:id/tracelog/download", get(handlers::project_events::download_task_tracelog))
        // Phase E：在线浏览归档（不下载，admin 可在 IDE 直接 cat 文件内容）
        .route("/api/projects/tasks/:id/tracelog/ls", get(handlers::project_events::list_task_tracelog_files))
        .route("/api/projects/tasks/:id/tracelog/file", get(handlers::project_events::read_task_tracelog_file))
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

        // Synthetic Honey: Skill AI 起草（仅 admin，sessions 额外校验 user 归属）
        .route("/api/skills/authoring/sessions",
            post(handlers::skill_authoring::create_session))
        .route("/api/skills/authoring/sessions/:id",
            get(handlers::skill_authoring::get_session)
                .delete(handlers::skill_authoring::delete_session))
        .route("/api/skills/authoring/sessions/:id/generate",
            post(handlers::skill_authoring::generate_stream))
        .route("/api/skills/authoring/sessions/:id/draft",
            get(handlers::skill_authoring::read_draft)
                .put(handlers::skill_authoring::write_draft))
        .route("/api/skills/authoring/sessions/:id/adopt",
            post(handlers::skill_authoring::adopt_session))
        .route("/api/skills/:bucket/rewrite",
            post(handlers::skill_authoring::rewrite_fragment_stream))

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

        // 2026-04 RAG 质量闭环 — Phase 0：统计 / Badge / audit timeline
        .route("/api/code-samples/stats", get(handlers::code_samples::stats))
        .route("/api/code-samples/pending-count", get(handlers::code_samples::pending_count))
        .route("/api/code-samples/:id/audit", get(handlers::code_samples::list_audit))
        // 2026-04 RAG 质量闭环 — Phase 1：thumbs 反馈 + rating 评分（埋点 only，默认不进 ranking）
        .route("/api/code-samples/:id/feedback", post(handlers::code_samples::submit_feedback))
        .route("/api/code-samples/:id/rating", put(handlers::code_samples::submit_rating))
        // 2026-04 RAG 质量闭环 — Phase 4：负例标记（默认 OFF，admin 显式启用 rag.negative.enabled 才注入）
        .route("/api/code-samples/:id/mark-negative", post(handlers::code_samples::mark_negative))
        .route("/api/code-samples/:id/unmark-negative", post(handlers::code_samples::unmark_negative))
        // 2026-04 RAG 质量闭环 — Phase 2：LLM-judge（跨 provider 建议：绑 quality_judge task_type 到不同 provider）
        .route("/api/code-samples/:id/score-async", post(handlers::code_samples::score_sample_async))
        .route("/api/code-samples/batch-score", post(handlers::code_samples::batch_score))
        // 2026-04 RAG 质量闭环 — Phase 3/4 配置变更前后 A/B 对比（admin 用于决策是否保留 knob）
        .route("/api/code-samples/ab-report", get(handlers::code_samples::ab_report))

        // B.7: 系统配置（仅 admin）
        .route("/api/system-settings", get(handlers::system_settings::list_settings))
        .route("/api/system-settings/:key",
            get(handlers::system_settings::get_setting)
                .put(handlers::system_settings::upsert_setting))
        // 嵌入维度兼容性探测（探活 + 列维度对比）
        .route("/api/system/embedding-info", get(handlers::system_settings::embedding_info))

        // 2026-04 维度注册表（登录即可读，供 CreateTaskModal 渲染）
        .route("/api/registry/platforms", get(handlers::registry::list_platforms))
        .route("/api/registry/templates", get(handlers::registry::list_templates))
        .route("/api/registry/skills", get(handlers::registry::list_skill_buckets))
        .route("/api/registry/resolve-skills", post(handlers::registry::resolve_skills))

        // B.7: 任务采纳（用户级，写回 RAG 样例库）
        .route("/api/projects/tasks/:id/adopt", post(handlers::project_generation::adopt_task))
        // 通用 AI 对话页（左侧菜单「AI 对话」） - 走 task_type=chat 的模型
        // 多会话管理 + SSE 流式发送，会话与消息持久化到 conversation_session / conversation_message
        .route(
            "/api/conversation/sessions",
            get(handlers::conversation::list_sessions)
                .post(handlers::conversation::create_session),
        )
        .route(
            "/api/conversation/sessions/:id",
            get(handlers::conversation::get_session)
                .patch(handlers::conversation::rename_session)
                .delete(handlers::conversation::delete_session),
        )
        .route(
            "/api/conversation/sessions/:id/chat/stream",
            post(handlers::conversation::chat_stream),
        )

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
