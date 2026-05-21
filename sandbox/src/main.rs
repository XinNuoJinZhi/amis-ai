use axum::{extract::State, routing::get, Json, Router};
use std::net::SocketAddr;
use std::sync::Arc;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

mod dev_runner;
mod docker;
mod fs_handlers;
mod handlers;
mod port_pool;
mod reuse_metrics;
mod state;
mod terminal_handlers;

use state::{AppState, SharedState};

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    dotenvy::dotenv().ok();

    tracing_subscriber::registry()
        .with(tracing_subscriber::EnvFilter::new(
            std::env::var("RUST_LOG").unwrap_or_else(|_| "info,sandbox=debug".to_string()),
        ))
        .with(tracing_subscriber::fmt::layer())
        .init();

    let image = std::env::var("SANDBOX_IMAGE")
        .unwrap_or_else(|_| "amis-ai-sandbox:uniapp-node20".to_string());
    let pnpm_store = std::env::var("SANDBOX_PNPM_STORE")
        .unwrap_or_else(|_| "/var/amis-ai/pnpm-store".to_string());
    let workdir_root = std::env::var("SANDBOX_WORKDIR_ROOT")
        .unwrap_or_else(|_| "/var/amis-ai/workdirs".to_string());
    let port_start: u16 = std::env::var("SANDBOX_PORT_RANGE_START")
        .ok()
        .and_then(|s| s.parse().ok())
        .unwrap_or(20000);
    let port_end: u16 = std::env::var("SANDBOX_PORT_RANGE_END")
        .ok()
        .and_then(|s| s.parse().ok())
        .unwrap_or(21000);

    let docker = docker::DockerClient::connect(image, pnpm_store)?;
    let port_pool = Arc::new(port_pool::PortPool::new(port_start, port_end));

    let state: SharedState = Arc::new(AppState {
        docker,
        port_pool,
        workdir_root,
        sandboxes: Default::default(),
    });

    let app = Router::new()
        .route("/health", get(health))
        .route("/debug/state", get(debug_state))
        .route("/sandboxes", axum::routing::post(handlers::create_sandbox))
        .route("/sandboxes/:id", axum::routing::delete(handlers::delete_sandbox))
        .route("/sandboxes/:id/exec", axum::routing::post(handlers::exec_command))
        .route("/sandboxes/:id/dev-start", axum::routing::post(handlers::dev_start))
        .route("/sandboxes/:id/dev-status", axum::routing::get(handlers::dev_status))
        // 文件系统接口（直读宿主 workdir）
        .route("/sandboxes/:id/fs/tree", axum::routing::get(fs_handlers::fs_tree))
        .route("/sandboxes/:id/fs/file", axum::routing::get(fs_handlers::fs_read))
        .route("/sandboxes/:id/fs/file", axum::routing::put(fs_handlers::fs_write))
        .route("/sandboxes/:id/fs/file", axum::routing::delete(fs_handlers::fs_delete))
        .route("/sandboxes/:id/fs/mkdir", axum::routing::post(fs_handlers::fs_mkdir))
        // 终端 WebSocket（bollard exec TTY 转接）
        .route("/sandboxes/:id/terminal", axum::routing::get(terminal_handlers::terminal_ws))
        .with_state(state);

    let addr: SocketAddr = "0.0.0.0:8091".parse()?;
    let listener = tokio::net::TcpListener::bind(addr).await?;
    tracing::info!("🧪 sandbox-service 已启动，监听 {}", addr);
    axum::serve(listener, app).await?;
    Ok(())
}

/// 1.6 W3：返回带 service 字段的 JSON，让 start-services.sh status 能区分
/// 「真 sandbox-service」vs 「别的进程占用同端口」。
async fn health() -> Json<serde_json::Value> {
    Json(serde_json::json!({
        "service": "sandbox-service",
        "status": "ok",
    }))
}

async fn debug_state(State(state): State<SharedState>) -> Json<serde_json::Value> {
    let sandboxes = state.sandboxes.read().await;
    let ports_used = state.port_pool.in_use();
    Json(serde_json::json!({
        "sandboxes": sandboxes.values().collect::<Vec<_>>(),
        "ports_used": ports_used,
    }))
}
