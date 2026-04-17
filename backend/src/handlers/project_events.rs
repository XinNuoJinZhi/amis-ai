use axum::{
    extract::{
        ws::{Message, WebSocket, WebSocketUpgrade},
        Path, State,
    },
    response::IntoResponse,
};
use futures_util::{SinkExt, StreamExt};
use sea_orm::{ColumnTrait, EntityTrait, QueryFilter};
use tokio_tungstenite::tungstenite::Message as WsMessage;

use crate::entity::{project_generation_task, user};
use crate::utils::jwt;
use crate::AppState;

// WebSocket 端点：聚合转发 claw-agent-server 的事件流
pub async fn ws_events(
    State(state): State<AppState>,
    Path(id): Path<i32>,
    ws: WebSocketUpgrade,
) -> impl IntoResponse {
    ws.on_upgrade(move |socket| handle_ws(socket, state, id))
}

async fn handle_ws(socket: WebSocket, state: AppState, task_id: i32) {
    // 查询任务，获取 claw_session_id
    let task = match project_generation_task::Entity::find_by_id(task_id)
        .one(&state.db)
        .await
    {
        Ok(Some(t)) => t,
        _ => {
            let _ = send_error(socket, "Task not found").await;
            return;
        }
    };

    let claw_session = match task.claw_session_id {
        Some(ref s) => s.clone(),
        None => {
            let _ = send_error(socket, "Claw session not initialized").await;
            return;
        }
    };

    let claw_ws_url = format!(
        "{}/tasks/{}/events",
        state
            .claw_agent_url
            .replace("http://", "ws://")
            .replace("https://", "wss://"),
        claw_session
    );

    tracing::info!("Connecting to upstream WS: {}", claw_ws_url);

    // 连接 claw-agent-server 的 WebSocket
    let (upstream, _) = match tokio_tungstenite::connect_async(&claw_ws_url).await {
        Ok(r) => r,
        Err(e) => {
            tracing::error!("Failed to connect to claw-agent WS: {}", e);
            let _ = send_error(socket, &format!("Upstream WS error: {}", e)).await;
            return;
        }
    };

    // 拆分前后端 socket
    let (mut client_tx, mut client_rx) = socket.split();
    let (mut upstream_tx, mut upstream_rx) = upstream.split();

    // 转发上游 → 客户端
    let forward = tokio::spawn(async move {
        while let Some(msg) = upstream_rx.next().await {
            match msg {
                Ok(WsMessage::Text(text)) => {
                    if client_tx.send(Message::Text(text)).await.is_err() {
                        break;
                    }
                }
                Ok(WsMessage::Close(_)) | Err(_) => break,
                _ => {}
            }
        }
    });

    // 监听客户端消息（心跳或断开）
    let client_task = tokio::spawn(async move {
        while let Some(msg) = client_rx.next().await {
            match msg {
                Ok(Message::Close(_)) | Err(_) => {
                    let _ = upstream_tx.send(WsMessage::Close(None)).await;
                    break;
                }
                Ok(Message::Ping(data)) => {
                    let _ = upstream_tx.send(WsMessage::Ping(data)).await;
                }
                _ => {}
            }
        }
    });

    // 任一方向关闭就终止
    tokio::select! {
        _ = forward => {},
        _ = client_task => {},
    }
}

async fn send_error(mut socket: WebSocket, msg: &str) -> Result<(), axum::Error> {
    let body = serde_json::json!({"error": msg}).to_string();
    socket.send(Message::Text(body)).await
}

// 允许未登录调试：若需要认证，可用 auth_user: jwt::AuthUser 并通过 query 传 token
#[allow(dead_code)]
async fn verify_task_ownership(
    state: &AppState,
    auth_user: &jwt::AuthUser,
    task_id: i32,
) -> Option<project_generation_task::Model> {
    let user = user::Entity::find()
        .filter(user::Column::Username.eq(&auth_user.username))
        .one(&state.db)
        .await
        .ok()
        .flatten()?;

    project_generation_task::Entity::find_by_id(task_id)
        .filter(project_generation_task::Column::UserId.eq(user.id))
        .one(&state.db)
        .await
        .ok()
        .flatten()
}
