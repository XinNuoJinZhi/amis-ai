use axum::{
    routing::{get, post},
    Router,
};
use std::{net::SocketAddr, sync::Arc};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

mod api_bridge;
mod http;
mod openai_stream;
mod permission_prompter;
mod sandbox_client;
mod skills;
mod state;
mod task_loop;
mod tool_executor;
mod ws;

use state::AppState;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    dotenvy::dotenv().ok();

    tracing_subscriber::registry()
        .with(tracing_subscriber::EnvFilter::new(
            std::env::var("RUST_LOG").unwrap_or_else(|_| "info,claw_agent_server=debug".to_string()),
        ))
        .with(tracing_subscriber::fmt::layer())
        .init();

    // A.5：Skills 发现机制 env 兜底 + HOME 隔离
    //
    // claw-code 的 commands::discover_skill_roots 会扫这些路径：
    //   - $CLAW_CONFIG_HOME/skills（必须）
    //   - $HOME/.claude/skills、$HOME/.claw/skills 等（**有副作用**：会拉宿主机用户的私人 skill）
    //
    // 所以这里做两件事：
    //   1. 如果 CLAW_CONFIG_HOME 没设，兜底到 amis-ai 仓库根（生产环境应由启动脚本显式设）
    //   2. 把 HOME 重写到一个不存在 .claude/.claw 子目录的地方，
    //      阻断"扫描宿主机用户私人 skill"的副作用。
    //      注意：HOME 影响范围广（dotenvy 已读、其他库可能也用），所以放在所有 dotenvy 之后。
    init_skills_env();

    let port = std::env::var("CLAW_AGENT_PORT")
        .unwrap_or_else(|_| "8090".to_string())
        .parse::<u16>()?;

    let sandbox_url = std::env::var("SANDBOX_SERVICE_URL")
        .unwrap_or_else(|_| "http://localhost:8091".to_string());

    let default_model = std::env::var("CLAW_AGENT_API_MODEL")
        .unwrap_or_else(|_| "claude-haiku-4-5-20251001".to_string());

    let state = Arc::new(AppState::new(sandbox_url, default_model));

    let app = Router::new()
        .route("/health", get(health))
        .route("/debug/state", get(http::debug_state))
        .route("/tasks", post(http::create_task))
        .route("/tasks/:id/messages", post(http::add_message))
        .route("/tasks/:id/stop", post(http::stop_task))
        .route("/tasks/:id/permission-decision", post(http::post_permission_decision))
        .route("/tasks/:id/events", get(ws::ws_events))
        .with_state(state);

    let addr = SocketAddr::from(([0, 0, 0, 0], port));
    let listener = tokio::net::TcpListener::bind(addr).await?;
    tracing::info!("🤖 claw-agent-server 已启动，监听 {}", addr);
    axum::serve(listener, app).await?;
    Ok(())
}

async fn health() -> &'static str {
    "ok"
}

/// 准备 Skills 加载所需的环境变量。
///
/// **CLAW_CONFIG_HOME**：如果启动脚本没设，兜底到 amis-ai 仓库根（开发/单机部署默认）。
/// 路径来源优先级：env CLAW_CONFIG_HOME > env AMIS_AI_ROOT > 硬编码 /home/karl/Working/TianXing/amis-ai
///
/// **HOME 隔离**：claw-code 的 discover_skill_roots 会扫 `$HOME/.claude/skills`、
/// `$HOME/.claw/skills` 等，把宿主机用户的私人 skill 混入业务上下文（A.0 PoC 里
/// 暴露过 `agent-reach` 这个误入）。这里把 HOME 临时重写到一个**不存在 .claude / .claw**
/// 子目录的地方，阻断这条副作用。**只影响子进程内的环境**，对宿主机 shell 无影响。
///
/// 即便 HOME 重写不彻底（比如有 symlink 残留），tool_executor 的 enforce_skill_path_whitelist
/// 还是第二道闸 —— 任何路径不在 CLAW_CONFIG_HOME/skills 或 SKILLS_PLUGIN_PATHS 下的
/// SKILL.md 都会被拒绝加载。
fn init_skills_env() {
    if std::env::var("CLAW_CONFIG_HOME").is_err() {
        let fallback = std::env::var("AMIS_AI_ROOT")
            .unwrap_or_else(|_| "/home/karl/Working/TianXing/amis-ai".to_string());
        tracing::warn!(
            "CLAW_CONFIG_HOME 未设置，兜底为 {} （生产环境应在 start-services.sh 显式设置）",
            fallback
        );
        std::env::set_var("CLAW_CONFIG_HOME", &fallback);
    }

    // HOME 隔离：把 HOME 改到一个目标目录已知不会有 .claude / .claw / .codex 子目录的位置。
    // 用 tempdir 比"指向 /var/empty"等系统目录更稳，因为我们还要保证它存在且可读。
    match tempfile::Builder::new()
        .prefix("claw-agent-server-isolated-home-")
        .tempdir()
    {
        Ok(temp) => {
            // 把 tempdir 的所有权"泄漏"给进程生命周期（drop 时会被自动清理也无所谓，
            // 因为 HOME 此时只用于 discover_skill_roots 这种**启动时扫描**类用途）。
            let path = temp.into_path();
            tracing::info!("HOME 已隔离到 {}（阻断宿主机 .claude/.claw 私人 skill 污染）", path.display());
            std::env::set_var("HOME", path);
        }
        Err(e) => {
            tracing::warn!("HOME 隔离失败 ({}); discover_skill_roots 可能扫到宿主机用户的私人 skill", e);
        }
    }

    // 打印最终生效的发现配置，便于排查
    let claw_home = std::env::var("CLAW_CONFIG_HOME").unwrap_or_default();
    let plugins = std::env::var("SKILLS_PLUGIN_PATHS").unwrap_or_default();
    tracing::info!(
        "Skills discovery: CLAW_CONFIG_HOME={}, SKILLS_PLUGIN_PATHS=[{}]",
        claw_home,
        plugins
    );

    // C.1：把 SKILLS_PLUGIN_PATHS 下的桶 symlink 到 $CLAW_CONFIG_HOME/skills/，
    // 让 claw-code 内置的 `Skill` 工具（discover_skill_roots 只看 CLAW_CONFIG_HOME）也能找到。
    if let Err(e) = mount_plugin_packs() {
        tracing::warn!("插件包挂载失败（不阻塞启动）: {}", e);
    }
}

/// 把 SKILLS_PLUGIN_PATHS 配置的每个根目录下的桶 symlink 到 CLAW_CONFIG_HOME/skills/。
///
/// 行为：
/// - 已存在的同名 symlink → 删旧建新（每次启动以 env 为准，避免脏数据）
/// - 已存在的同名**普通目录或文件** → 跳过 + 警告（不破坏用户/同名插件桶）
/// - 插件目录里只挑包含 `SKILL.md` 的子目录作为桶（其它如 .git / docs 自动忽略）
fn mount_plugin_packs() -> std::io::Result<()> {
    let plugin_paths = std::env::var("SKILLS_PLUGIN_PATHS").unwrap_or_default();
    if plugin_paths.trim().is_empty() {
        return Ok(());
    }
    let skills_root = match std::env::var("CLAW_CONFIG_HOME") {
        Ok(h) => std::path::PathBuf::from(h).join("skills"),
        Err(_) => {
            tracing::warn!("SKILLS_PLUGIN_PATHS 已设但 CLAW_CONFIG_HOME 缺失，跳过挂载");
            return Ok(());
        }
    };
    if !skills_root.exists() {
        std::fs::create_dir_all(&skills_root)?;
    }

    for raw in plugin_paths.split(',') {
        let raw = raw.trim();
        if raw.is_empty() {
            continue;
        }
        let plugin_root = std::path::PathBuf::from(raw);
        if !plugin_root.is_dir() {
            tracing::warn!("插件路径不存在或非目录: {}", plugin_root.display());
            continue;
        }
        let entries = match std::fs::read_dir(&plugin_root) {
            Ok(rd) => rd,
            Err(e) => {
                tracing::warn!("插件路径 {} 读取失败: {}", plugin_root.display(), e);
                continue;
            }
        };
        for entry in entries.flatten() {
            let bucket_dir = entry.path();
            if !bucket_dir.is_dir() {
                continue;
            }
            let bucket_name = match bucket_dir.file_name().and_then(|n| n.to_str()) {
                Some(n) if !n.starts_with('.') => n.to_string(),
                _ => continue,
            };
            // 只挂载真正的 skill 包：必须含 SKILL.md
            if !bucket_dir.join("SKILL.md").exists() {
                tracing::debug!(
                    "跳过 {}: 不含 SKILL.md，不像是 skill 包",
                    bucket_dir.display()
                );
                continue;
            }
            let target = skills_root.join(&bucket_name);

            // 解析现有 target 的状态
            match std::fs::symlink_metadata(&target) {
                Ok(md) if md.file_type().is_symlink() => {
                    // 旧 symlink → 删了重建（启动时 env 是 source of truth）
                    if let Err(e) = std::fs::remove_file(&target) {
                        tracing::warn!(
                            "删除旧 symlink {} 失败: {} —— 跳过此插件桶",
                            target.display(),
                            e
                        );
                        continue;
                    }
                }
                Ok(_) => {
                    // 普通目录/文件 → 不动用户内容
                    tracing::warn!(
                        "插件桶 {} 已被同名非符号链接占用（{}），跳过挂载——请改插件桶名或移走旧目录",
                        bucket_name,
                        target.display()
                    );
                    continue;
                }
                Err(_) => { /* 不存在 → 直接建 */ }
            }

            #[cfg(unix)]
            let result = std::os::unix::fs::symlink(&bucket_dir, &target);
            #[cfg(not(unix))]
            let result: std::io::Result<()> = Err(std::io::Error::new(
                std::io::ErrorKind::Unsupported,
                "插件 symlink 仅支持 Unix（Windows 需 Developer Mode 或管理员）",
            ));

            match result {
                Ok(_) => tracing::info!(
                    "插件桶已挂载: {} -> {}",
                    target.display(),
                    bucket_dir.display()
                ),
                Err(e) => tracing::warn!(
                    "插件桶 symlink 失败 {} -> {}: {}",
                    target.display(),
                    bucket_dir.display(),
                    e
                ),
            }
        }
    }
    Ok(())
}
