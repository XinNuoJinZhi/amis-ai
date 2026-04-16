use axum::{
    extract::State,
    routing::get,
    Json, Router,
};
use serde::Serialize;
use std::{net::SocketAddr, sync::Arc};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

mod sandbox_client;
mod state;

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

    let state = Arc::new(AppState {
        sandbox_url,
        default_model,
    });

    let app = Router::new()
        .route("/health", get(health))
        .route("/debug/state", get(debug_state))
        .with_state(state);

    let addr = SocketAddr::from(([0, 0, 0, 0], port));
    let listener = tokio::net::TcpListener::bind(addr).await?;
    tracing::info!("🤖 claw-agent-server 已启动，监听 {}", addr);
    axum::serve(listener, app).await?;
    Ok(())
}

#[derive(Clone)]
#[allow(dead_code)]
struct AppState {
    sandbox_url: String,
    default_model: String,
}

async fn health() -> &'static str {
    "ok"
}

#[derive(Serialize)]
struct DebugStateResponse {
    status: &'static str,
    message: &'static str,
}

async fn debug_state(State(_state): State<Arc<AppState>>) -> Json<DebugStateResponse> {
    Json(DebugStateResponse {
        status: "ok",
        message: "claw-agent-server is running",
    })
}
