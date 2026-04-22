use axum::{
    extract::{
        ws::{Message, WebSocket, WebSocketUpgrade},
        Path, State,
    },
    response::IntoResponse,
    Json,
};
use futures_util::{SinkExt, StreamExt};
use sea_orm::{ActiveModelTrait, ColumnTrait, EntityTrait, QueryFilter, QueryOrder, Set};
use tokio_tungstenite::tungstenite::Message as WsMessage;

use crate::entity::{project_generation_task, project_task_event, project_task_message, user};
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

    // 转发上游 → 客户端，同时持久化到 project_task_event
    let db = state.db.clone();
    let forward = tokio::spawn(async move {
        while let Some(msg) = upstream_rx.next().await {
            match msg {
                Ok(WsMessage::Text(text)) => {
                    // 先持久化（fire-and-forget，不阻塞转发）
                    persist_event(&db, task_id, &text).await;

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

/// 把一条 WS 事件持久化到 project_task_event 表。
/// 事件 JSON 格式如 {"type":"text_delta","data":"..."}，我们抽 type 作为 event_type，整条作为 payload。
async fn persist_event(db: &sea_orm::DatabaseConnection, task_id: i32, json_text: &str) {
    let event_type = match serde_json::from_str::<serde_json::Value>(json_text) {
        Ok(v) => v
            .get("type")
            .and_then(|t| t.as_str())
            .unwrap_or("unknown")
            .to_string(),
        Err(_) => "raw".to_string(),
    };

    let record = project_task_event::ActiveModel {
        task_id: Set(task_id),
        event_type: Set(event_type),
        payload: Set(json_text.to_string()),
        created_at: Set(chrono::Local::now().naive_local()),
        ..Default::default()
    };

    if let Err(e) = record.insert(db).await {
        tracing::warn!("failed to persist event for task {}: {}", task_id, e);
    }
}

/// REST 端点：GET /api/projects/tasks/:id/pages
/// 读取 task workdir 下的 src/pages.json，返回所有注册页面列表
/// 供前端"页面切换器"使用
pub async fn list_task_pages(
    State(state): State<AppState>,
    auth_user: jwt::AuthUser,
    Path(id): Path<i32>,
) -> impl IntoResponse {
    let Some(user) = user::Entity::find()
        .filter(user::Column::Username.eq(&auth_user.username))
        .one(&state.db)
        .await
        .ok()
        .flatten()
    else {
        return (axum::http::StatusCode::UNAUTHORIZED, Json(serde_json::json!({"error":"用户不存在"}))).into_response();
    };

    let Some(task) = project_generation_task::Entity::find_by_id(id)
        .filter(project_generation_task::Column::UserId.eq(user.id))
        .one(&state.db)
        .await
        .ok()
        .flatten()
    else {
        return (axum::http::StatusCode::NOT_FOUND, Json(serde_json::json!({"error":"任务不存在"}))).into_response();
    };

    let Some(workdir) = task.workdir_path else {
        return Json(serde_json::json!({"pages": []})).into_response();
    };

    let pages_file = format!("{}/src/pages.json", workdir);
    let Ok(content) = std::fs::read_to_string(&pages_file) else {
        return Json(serde_json::json!({"pages": []})).into_response();
    };

    // pages.json 是带注释的 jsonc，先剥离 // 注释再解析
    let stripped: String = content
        .lines()
        .map(|l| {
            if let Some(idx) = l.find("//") {
                // 简单处理：字符串里 "://..." 也会被干掉，但 pages.json 通常不含 URL
                &l[..idx]
            } else {
                l
            }
        })
        .collect::<Vec<_>>()
        .join("\n");

    let parsed: serde_json::Value = match serde_json::from_str(&stripped) {
        Ok(v) => v,
        Err(e) => {
            return Json(serde_json::json!({
                "pages": [],
                "error": format!("pages.json 解析失败: {}", e)
            }))
            .into_response();
        }
    };

    // 提取 pages 数组里的每个 path + navigationBarTitleText
    let pages = parsed
        .get("pages")
        .and_then(|v| v.as_array())
        .map(|arr| {
            arr.iter()
                .filter_map(|p| {
                    let path = p.get("path").and_then(|v| v.as_str())?;
                    let title = p
                        .get("style")
                        .and_then(|s| s.get("navigationBarTitleText"))
                        .and_then(|v| v.as_str())
                        .unwrap_or(path);
                    Some(serde_json::json!({
                        "path": path,
                        "title": title,
                    }))
                })
                .collect::<Vec<_>>()
        })
        .unwrap_or_default();

    Json(serde_json::json!({ "pages": pages })).into_response()
}

/// REST 端点：GET /api/projects/tasks/:id/dev-status
/// 前端在 Vite dev server 启动中轮询此接口，展示实时启动日志。
/// 代理到 sandbox-service 的 GET /sandboxes/:sandbox_id/dev-status。
pub async fn get_dev_status(
    State(state): State<AppState>,
    auth_user: jwt::AuthUser,
    Path(id): Path<i32>,
) -> impl IntoResponse {
    let Some(user) = user::Entity::find()
        .filter(user::Column::Username.eq(&auth_user.username))
        .one(&state.db)
        .await
        .ok()
        .flatten()
    else {
        return (axum::http::StatusCode::UNAUTHORIZED, Json(serde_json::json!({"error":"用户不存在"}))).into_response();
    };

    let Some(task) = project_generation_task::Entity::find_by_id(id)
        .filter(project_generation_task::Column::UserId.eq(user.id))
        .one(&state.db)
        .await
        .ok()
        .flatten()
    else {
        return (axum::http::StatusCode::NOT_FOUND, Json(serde_json::json!({"error":"任务不存在"}))).into_response();
    };

    let Some(sandbox_id) = task.sandbox_id else {
        return (axum::http::StatusCode::BAD_REQUEST, Json(serde_json::json!({"error":"任务尚未分配 sandbox"}))).into_response();
    };

    let sandbox = crate::services::sandbox_client::SandboxClient::new(
        state.http_client.clone(),
        state.sandbox_url.clone(),
    );
    match sandbox.dev_status(&sandbox_id).await {
        Ok(resp) => Json(resp).into_response(),
        Err(e) => (
            axum::http::StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({"error": format!("查询 dev_status 失败: {}", e)})),
        )
            .into_response(),
    }
}

/// REST 端点：POST /api/projects/tasks/:id/permission-decision
/// 前端响应权限审批弹窗后调用，代理到 claw-agent-server
pub async fn post_permission_decision(
    State(state): State<AppState>,
    auth_user: jwt::AuthUser,
    Path(id): Path<i32>,
    Json(payload): Json<serde_json::Value>,
) -> impl IntoResponse {
    let Some(user) = user::Entity::find()
        .filter(user::Column::Username.eq(&auth_user.username))
        .one(&state.db)
        .await
        .ok()
        .flatten()
    else {
        return (axum::http::StatusCode::UNAUTHORIZED, Json(serde_json::json!({"error":"用户不存在"}))).into_response();
    };

    let Some(task) = project_generation_task::Entity::find_by_id(id)
        .filter(project_generation_task::Column::UserId.eq(user.id))
        .one(&state.db)
        .await
        .ok()
        .flatten()
    else {
        return (axum::http::StatusCode::NOT_FOUND, Json(serde_json::json!({"error":"任务不存在"}))).into_response();
    };

    let Some(claw_session) = task.claw_session_id else {
        return (axum::http::StatusCode::BAD_REQUEST, Json(serde_json::json!({"error":"任务未初始化 claw-agent 会话"}))).into_response();
    };

    let claw = crate::services::claw_agent_client::ClawAgentClient::new(
        state.http_client.clone(),
        state.claw_agent_url.clone(),
    );
    match claw.send_permission_decision(&claw_session, payload).await {
        Ok(_) => Json(serde_json::json!({"status":"ok"})).into_response(),
        Err(e) => (
            axum::http::StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({"error": format!("发送决策失败: {}", e)})),
        )
            .into_response(),
    }
}

/// REST 端点：GET /api/projects/tasks/:id/events/history
/// 拉取一个任务的所有已存事件（用于浏览器刷新后恢复会话）
pub async fn list_events_history(
    State(state): State<AppState>,
    auth_user: jwt::AuthUser,
    Path(id): Path<i32>,
) -> impl IntoResponse {
    // 验证任务所属权
    let Some(user) = user::Entity::find()
        .filter(user::Column::Username.eq(&auth_user.username))
        .one(&state.db)
        .await
        .ok()
        .flatten()
    else {
        return (axum::http::StatusCode::UNAUTHORIZED, Json(serde_json::json!({"error":"用户不存在"}))).into_response();
    };

    let task = project_generation_task::Entity::find_by_id(id)
        .filter(project_generation_task::Column::UserId.eq(user.id))
        .one(&state.db)
        .await
        .ok()
        .flatten();
    if task.is_none() {
        return (axum::http::StatusCode::NOT_FOUND, Json(serde_json::json!({"error":"任务不存在"}))).into_response();
    }

    let events = project_task_event::Entity::find()
        .filter(project_task_event::Column::TaskId.eq(id))
        .order_by_asc(project_task_event::Column::Id)
        .all(&state.db)
        .await
        .unwrap_or_default();

    // 返回原 payload JSON 串数组，前端按顺序回放即可
    let payloads: Vec<serde_json::Value> = events
        .into_iter()
        .filter_map(|e| serde_json::from_str::<serde_json::Value>(&e.payload).ok())
        .collect();

    Json(payloads).into_response()
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

/// REST 端点：POST /api/projects/tasks/:id/runtime-error
///
/// 前端 iframe 捕获到浏览器运行时错误（Vite import-analysis、模块解析、HMR error、
/// window.onerror、unhandledrejection 等）后上报。这些错误 Vite 只通过 WebSocket 推
/// 浏览器的 error overlay，**不会写到 /tmp/vite.log**，所以服务端 tail 方案抓不到，
/// 必须走本端点。
///
/// 行为与 `spawn_dev_status_watcher` 的 runtime_error 分支一致：
/// - fix_attempts < 5：把错误喂给 Agent 让它修（task.status 从 succeeded 降级回 running）
/// - fix_attempts >= 5：task.status = failed
/// - 同一 message 的重复上报由前端节流（1 秒窗口），这里只做 fix_attempts 硬上限
#[derive(Debug, serde::Deserialize)]
pub struct RuntimeErrorPayload {
    pub source: String,         // window.onerror / unhandledrejection / vite:error
    pub message: String,
    #[serde(default)]
    pub stack: Option<String>,
    #[serde(default)]
    pub href: Option<String>,
}

const RUNTIME_ERROR_MAX_FIX_ATTEMPTS: i32 = 5;

pub async fn post_runtime_error(
    State(state): State<AppState>,
    auth_user: jwt::AuthUser,
    Path(id): Path<i32>,
    Json(payload): Json<RuntimeErrorPayload>,
) -> impl IntoResponse {
    let Some(user) = user::Entity::find()
        .filter(user::Column::Username.eq(&auth_user.username))
        .one(&state.db)
        .await
        .ok()
        .flatten()
    else {
        return (
            axum::http::StatusCode::UNAUTHORIZED,
            Json(serde_json::json!({"error":"用户不存在"})),
        )
            .into_response();
    };

    let Some(task) = project_generation_task::Entity::find_by_id(id)
        .filter(project_generation_task::Column::UserId.eq(user.id))
        .one(&state.db)
        .await
        .ok()
        .flatten()
    else {
        return (
            axum::http::StatusCode::NOT_FOUND,
            Json(serde_json::json!({"error":"任务不存在"})),
        )
            .into_response();
    };

    // 终止态不再受理
    if task.status == "stopped" || task.status == "failed" {
        return (
            axum::http::StatusCode::CONFLICT,
            Json(serde_json::json!({"error": format!("任务已 {}，无法继续修复", task.status)})),
        )
            .into_response();
    }

    let Some(claw_session) = task.claw_session_id.clone() else {
        return (
            axum::http::StatusCode::BAD_REQUEST,
            Json(serde_json::json!({"error":"任务未初始化 claw-agent 会话"})),
        )
            .into_response();
    };

    // fix_attempts 上限
    let attempts = task.fix_attempts;
    if attempts >= RUNTIME_ERROR_MAX_FIX_ATTEMPTS {
        // 超上限：标记 failed
        let mut active: project_generation_task::ActiveModel = task.into();
        active.status = Set("failed".to_string());
        active.updated_at = Set(chrono::Local::now().naive_local());
        let _ = active.update(&state.db).await;
        return (
            axum::http::StatusCode::TOO_MANY_REQUESTS,
            Json(serde_json::json!({"error": format!("已达修复上限 {} 次", RUNTIME_ERROR_MAX_FIX_ATTEMPTS)})),
        )
            .into_response();
    }

    // 构造修复 prompt
    let stack_block = payload
        .stack
        .as_deref()
        .filter(|s| !s.is_empty())
        .map(|s| format!("\n\n**调用栈**：\n```\n{}\n```", s))
        .unwrap_or_default();
    let href_line = payload
        .href
        .as_deref()
        .filter(|s| !s.is_empty())
        .map(|s| format!("\n**触发页面**：{}", s))
        .unwrap_or_default();
    let fix_message = format!(
        "⚠️ 浏览器端捕获到运行时错误（来源：`{}`，第 {}/{} 次重试）。\n\n\
         **错误信息**：{}{}{}\n\n\
         常见原因：\n\
         - `import \"wot-design-uni/xxx\"` 之类的第三方库 CSS / 组件内部文件路径不存在（Wot UI 组件由 easycom 自动注入，不要手动 import）\n\
         - 显式 `import __easycom_0 from 'wot-design-uni/components/wd-xxx/wd-xxx.vue'` 与 easycom 自动注入冲突\n\
         - 页面引用了不存在的 .vue 文件或 API 路径写错\n\
         - `pages.json` 注册的 path 与实际 .vue 路径不匹配\n\n\
         请用 read_file / edit_file / write_file 工具分析并修复，**无需再调用 dev_start**（Vite HMR 自动热更新）。",
        payload.source,
        attempts + 1,
        RUNTIME_ERROR_MAX_FIX_ATTEMPTS,
        payload.message,
        href_line,
        stack_block,
    );

    // 推给 Agent
    let claw = crate::services::claw_agent_client::ClawAgentClient::new(
        state.http_client.clone(),
        state.claw_agent_url.clone(),
    );
    if let Err(e) = claw.add_message(&claw_session, fix_message.clone()).await {
        tracing::warn!("runtime-error 推送 Agent 失败 task={}: {}", id, e);
        return (
            axum::http::StatusCode::BAD_GATEWAY,
            Json(serde_json::json!({"error": format!("转发给 Agent 失败: {}", e)})),
        )
            .into_response();
    }

    // 更新任务状态：succeeded → running（表示又在修），fix_attempts++
    let mut active: project_generation_task::ActiveModel = task.into();
    active.status = Set("running".to_string());
    active.fix_attempts = Set(attempts + 1);
    active.updated_at = Set(chrono::Local::now().naive_local());
    let _ = active.update(&state.db).await;

    // 写 system 消息（前端能看到修复轨迹）
    let _ = project_task_message::ActiveModel {
        task_id: Set(id),
        role: Set("system".to_owned()),
        content: Set(fix_message.clone()),
        created_at: Set(chrono::Local::now().naive_local()),
        ..Default::default()
    }
    .insert(&state.db)
    .await;

    tracing::info!(
        "task {} runtime-error (iframe) fix attempt {}/{} dispatched",
        id,
        attempts + 1,
        RUNTIME_ERROR_MAX_FIX_ATTEMPTS
    );

    Json(serde_json::json!({
        "status":"ok",
        "fix_attempts": attempts + 1,
        "max_attempts": RUNTIME_ERROR_MAX_FIX_ATTEMPTS
    }))
    .into_response()
}
