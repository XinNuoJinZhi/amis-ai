//! 云端 IDE 后台透传：前端 → backend → sandbox-service。
//! 统一走 JWT 认证、任务归属校验，不让前端直连 :8091。

use axum::{
    extract::{
        ws::{Message, WebSocket, WebSocketUpgrade},
        Path, Query, State,
    },
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use futures_util::{SinkExt, StreamExt};
use sea_orm::{ColumnTrait, EntityTrait, QueryFilter};
use serde::Deserialize;
use serde_json::json;
use tokio_tungstenite::tungstenite::Message as WsMessage;

use crate::entity::{project_generation_task, user};
use crate::services::sandbox_client::SandboxClient;
use crate::utils::jwt;
use crate::AppState;

// ───────────────────────────── helpers

/// 校验 JWT → 查任务 → 归属检查 → 返回 sandbox_id
async fn resolve_task_sandbox(
    state: &AppState,
    auth_user: &jwt::AuthUser,
    task_id: i32,
) -> Result<String, (StatusCode, Json<serde_json::Value>)> {
    let current = user::Entity::find()
        .filter(user::Column::Username.eq(&auth_user.username))
        .one(&state.db)
        .await
        .map_err(|e| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({"error": format!("DB error: {}", e)})),
            )
        })?
        .ok_or_else(|| (StatusCode::UNAUTHORIZED, Json(json!({"error": "用户不存在"}))))?;

    let task = project_generation_task::Entity::find_by_id(task_id)
        .one(&state.db)
        .await
        .map_err(|e| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({"error": format!("DB error: {}", e)})),
            )
        })?
        .ok_or_else(|| (StatusCode::NOT_FOUND, Json(json!({"error": "任务不存在"}))))?;

    if task.user_id != current.id {
        return Err((
            StatusCode::FORBIDDEN,
            Json(json!({"error": "无权访问他人的任务"})),
        ));
    }

    task.sandbox_id.ok_or_else(|| {
        (
            StatusCode::CONFLICT,
            Json(json!({"error": "任务尚未创建沙箱"})),
        )
    })
}

/// WebSocket 场景下从 query 参数读 token 来做 JWT 验证。
/// 返回用户名，失败返回 None（WS 里不方便传 StatusCode，调用方需自行 close）。
async fn resolve_task_sandbox_ws(
    state: &AppState,
    token: Option<&str>,
    task_id: i32,
) -> Option<(String, String)> {
    let token = token?;
    let claims = jwt::verify(token).ok()?;
    let current = user::Entity::find()
        .filter(user::Column::Username.eq(&claims.sub))
        .one(&state.db)
        .await
        .ok()??;
    let task = project_generation_task::Entity::find_by_id(task_id)
        .one(&state.db)
        .await
        .ok()??;
    if task.user_id != current.id {
        return None;
    }
    let sandbox_id = task.sandbox_id?;
    Some((claims.sub, sandbox_id))
}

fn sandbox_client(state: &AppState) -> SandboxClient {
    SandboxClient::new(state.http_client.clone(), state.sandbox_url.clone())
}

// ───────────────────────────── REST handlers

#[derive(Debug, Deserialize)]
pub struct TreeQuery {
    pub depth: Option<usize>,
}

pub async fn fs_tree(
    State(state): State<AppState>,
    auth_user: jwt::AuthUser,
    Path(task_id): Path<i32>,
    Query(q): Query<TreeQuery>,
) -> impl IntoResponse {
    let sandbox_id = match resolve_task_sandbox(&state, &auth_user, task_id).await {
        Ok(s) => s,
        Err(e) => return e.into_response(),
    };
    match sandbox_client(&state).fs_tree(&sandbox_id, q.depth).await {
        Ok(v) => Json(v).into_response(),
        Err(e) => (
            StatusCode::BAD_GATEWAY,
            Json(json!({"error": format!("sandbox fs_tree 失败: {e}")})),
        )
            .into_response(),
    }
}

#[derive(Debug, Deserialize)]
pub struct PathQuery {
    pub path: String,
}

pub async fn fs_read(
    State(state): State<AppState>,
    auth_user: jwt::AuthUser,
    Path(task_id): Path<i32>,
    Query(q): Query<PathQuery>,
) -> impl IntoResponse {
    let sandbox_id = match resolve_task_sandbox(&state, &auth_user, task_id).await {
        Ok(s) => s,
        Err(e) => return e.into_response(),
    };
    match sandbox_client(&state).fs_read(&sandbox_id, &q.path).await {
        Ok(v) => Json(v).into_response(),
        Err(e) => (
            StatusCode::BAD_GATEWAY,
            Json(json!({"error": format!("sandbox fs_read 失败: {e}")})),
        )
            .into_response(),
    }
}

pub async fn fs_write(
    State(state): State<AppState>,
    auth_user: jwt::AuthUser,
    Path(task_id): Path<i32>,
    Json(body): Json<serde_json::Value>,
) -> impl IntoResponse {
    let sandbox_id = match resolve_task_sandbox(&state, &auth_user, task_id).await {
        Ok(s) => s,
        Err(e) => return e.into_response(),
    };
    match sandbox_client(&state).fs_write(&sandbox_id, &body).await {
        Ok((status, json_body)) => {
            let status_u16 = status.as_u16();
            let axum_status = StatusCode::from_u16(status_u16).unwrap_or(StatusCode::OK);
            (axum_status, Json(json_body)).into_response()
        }
        Err(e) => (
            StatusCode::BAD_GATEWAY,
            Json(json!({"error": format!("sandbox fs_write 失败: {e}")})),
        )
            .into_response(),
    }
}

pub async fn fs_delete(
    State(state): State<AppState>,
    auth_user: jwt::AuthUser,
    Path(task_id): Path<i32>,
    Query(q): Query<PathQuery>,
) -> impl IntoResponse {
    let sandbox_id = match resolve_task_sandbox(&state, &auth_user, task_id).await {
        Ok(s) => s,
        Err(e) => return e.into_response(),
    };
    match sandbox_client(&state).fs_delete(&sandbox_id, &q.path).await {
        Ok(v) => Json(v).into_response(),
        Err(e) => (
            StatusCode::BAD_GATEWAY,
            Json(json!({"error": format!("sandbox fs_delete 失败: {e}")})),
        )
            .into_response(),
    }
}

pub async fn fs_mkdir(
    State(state): State<AppState>,
    auth_user: jwt::AuthUser,
    Path(task_id): Path<i32>,
    Json(body): Json<serde_json::Value>,
) -> impl IntoResponse {
    let sandbox_id = match resolve_task_sandbox(&state, &auth_user, task_id).await {
        Ok(s) => s,
        Err(e) => return e.into_response(),
    };
    match sandbox_client(&state).fs_mkdir(&sandbox_id, &body).await {
        Ok(v) => Json(v).into_response(),
        Err(e) => (
            StatusCode::BAD_GATEWAY,
            Json(json!({"error": format!("sandbox fs_mkdir 失败: {e}")})),
        )
            .into_response(),
    }
}

// ───────────────────────────── Terminal WebSocket proxy

#[derive(Debug, Deserialize)]
pub struct TerminalQuery {
    pub token: Option<String>,
    pub cols: Option<u16>,
    pub rows: Option<u16>,
}

pub async fn terminal_ws(
    State(state): State<AppState>,
    Path(task_id): Path<i32>,
    Query(q): Query<TerminalQuery>,
    ws: WebSocketUpgrade,
) -> impl IntoResponse {
    ws.on_upgrade(move |socket| handle_terminal_ws(socket, state, task_id, q))
}

async fn handle_terminal_ws(socket: WebSocket, state: AppState, task_id: i32, q: TerminalQuery) {
    let (_username, sandbox_id) = match resolve_task_sandbox_ws(&state, q.token.as_deref(), task_id).await {
        Some(v) => v,
        None => {
            let (mut sink, _) = socket.split();
            let _ = sink
                .send(Message::Text(
                    serde_json::json!({"t":"error","message":"认证失败或任务不存在"}).to_string(),
                ))
                .await;
            return;
        }
    };

    // 拼 sandbox-service WS URL
    let ws_base = state
        .sandbox_url
        .replace("http://", "ws://")
        .replace("https://", "wss://");
    let mut upstream_url = format!("{}/sandboxes/{}/terminal", ws_base, sandbox_id);
    let mut qs = Vec::<String>::new();
    if let Some(c) = q.cols {
        qs.push(format!("cols={}", c));
    }
    if let Some(r) = q.rows {
        qs.push(format!("rows={}", r));
    }
    if !qs.is_empty() {
        upstream_url.push('?');
        upstream_url.push_str(&qs.join("&"));
    }

    let (upstream, _) = match tokio_tungstenite::connect_async(&upstream_url).await {
        Ok(r) => r,
        Err(e) => {
            let (mut sink, _) = socket.split();
            let _ = sink
                .send(Message::Text(
                    serde_json::json!({"t":"error","message":format!("连上沙箱终端失败: {}", e)}).to_string(),
                ))
                .await;
            return;
        }
    };

    let (mut client_tx, mut client_rx) = socket.split();
    let (mut upstream_tx, mut upstream_rx) = upstream.split();

    // upstream → client
    let to_client = tokio::spawn(async move {
        while let Some(msg) = upstream_rx.next().await {
            match msg {
                Ok(WsMessage::Text(text)) => {
                    if client_tx.send(Message::Text(text)).await.is_err() {
                        break;
                    }
                }
                Ok(WsMessage::Binary(b)) => {
                    if client_tx.send(Message::Binary(b)).await.is_err() {
                        break;
                    }
                }
                Ok(WsMessage::Close(_)) | Err(_) => break,
                _ => {}
            }
        }
    });

    // client → upstream
    let to_upstream = tokio::spawn(async move {
        while let Some(msg) = client_rx.next().await {
            match msg {
                Ok(Message::Text(text)) => {
                    if upstream_tx.send(WsMessage::Text(text)).await.is_err() {
                        break;
                    }
                }
                Ok(Message::Binary(b)) => {
                    if upstream_tx.send(WsMessage::Binary(b)).await.is_err() {
                        break;
                    }
                }
                Ok(Message::Close(_)) | Err(_) => {
                    let _ = upstream_tx.send(WsMessage::Close(None)).await;
                    break;
                }
                _ => {}
            }
        }
    });

    tokio::select! {
        _ = to_client => {},
        _ = to_upstream => {},
    }
}
