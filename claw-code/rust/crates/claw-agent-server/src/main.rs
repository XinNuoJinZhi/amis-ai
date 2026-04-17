use axum::{
    routing::{get, post},
    Router,
};
use std::{net::SocketAddr, sync::Arc};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

mod api_bridge;
mod http;
mod sandbox_client;
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
