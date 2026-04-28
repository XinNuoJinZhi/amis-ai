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

    // 2026-04-25 amis-translator 路径：task 没启 LLM session（translator fully_supported 时
    // 直接 fs_write + dev_start 跳过了 claw-agent），claw_session_id 为 None。
    // 不再当作错误关闭，而是进入「idle keep-alive」模式：发一条 translator_idle 通知，
    // 然后保持连接等客户端心跳/close。前端通过 REST history 拿到 translation_succeeded 等事件。
    let claw_session = match task.claw_session_id {
        Some(ref s) => s.clone(),
        None => {
            handle_ws_translator_idle(socket, task_id).await;
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

    // 转发上游 → 客户端，同时持久化到 project_task_event；
    // 2026-04-25 起还按 tracelog 配置写文件归档（mode=disabled 时是 no-op）。
    let state_for_forward = state.clone();
    let forward = tokio::spawn(async move {
        while let Some(msg) = upstream_rx.next().await {
            match msg {
                Ok(WsMessage::Text(text)) => {
                    // 先持久化到 DB + 文件归档（fire-and-forget，不阻塞转发）
                    persist_event(&state_for_forward.db, task_id, &text).await;
                    crate::services::tracelog::route_event(&state_for_forward, task_id, &text)
                        .await;

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
        // 2026-04：非 uniapp 底座没有 pages.json → 扫 src/pages/ 文件系统兜底
        let scanned = scan_pages_fs(&workdir);
        return Json(serde_json::json!({"pages": scanned})).into_response();
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

    // 返回原 payload JSON 串数组，前端按顺序回放即可。
    // 注：backend 自己 insert 的事件（如 llm_selected）payload 里**不含** type 字段，
    // 所以这里兜底把 row.event_type 注入到对象顶层，保证前端 normalizeHistoryItem 走正常分支。
    let payloads: Vec<serde_json::Value> = events
        .into_iter()
        .filter_map(|e| {
            let mut v = serde_json::from_str::<serde_json::Value>(&e.payload).ok()?;
            if let Some(obj) = v.as_object_mut() {
                if !obj.contains_key("type") {
                    obj.insert("type".to_string(), serde_json::Value::String(e.event_type.clone()));
                }
                if !obj.contains_key("data") {
                    // 兼容前端 ExecutionDetailsPanel 的 `details.llm?.data ?? details.llm` 取值：
                    // 把扁平字段也镜像一份到 data，保证 KeyValueList 能渲染。
                    let data_clone = serde_json::Value::Object(obj.clone());
                    obj.insert("data".to_string(), data_clone);
                }
            }
            Some(v)
        })
        .collect();

    Json(payloads).into_response()
}

/// GET /api/projects/tasks/:id/tracelog
/// 返回归档元数据：是否存在、大小、是否已打包。只有任务所属用户 + admin 才能看。
pub async fn get_task_tracelog_info(
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
    let task = project_generation_task::Entity::find_by_id(id)
        .filter(project_generation_task::Column::UserId.eq(user.id))
        .one(&state.db)
        .await
        .ok()
        .flatten();
    if task.is_none() {
        return (axum::http::StatusCode::NOT_FOUND, Json(serde_json::json!({"error":"任务不存在"}))).into_response();
    }

    let info = crate::services::tracelog::task_tracelog_info(&state, id).await;
    Json(info).into_response()
}

/// GET /api/projects/tasks/:id/tracelog/download
/// 直接流 tar.gz 给浏览器。仅任务归属 + admin 能下载（防数据外泄）。
pub async fn download_task_tracelog(
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
    let task = project_generation_task::Entity::find_by_id(id)
        .filter(project_generation_task::Column::UserId.eq(user.id))
        .one(&state.db)
        .await
        .ok()
        .flatten();
    if task.is_none() {
        return (axum::http::StatusCode::NOT_FOUND, Json(serde_json::json!({"error":"任务不存在"}))).into_response();
    }

    match crate::services::tracelog::task_tracelog_bytes(&state, id).await {
        Some((bytes, filename)) => {
            let headers = [
                (axum::http::header::CONTENT_TYPE, "application/gzip".to_string()),
                (
                    axum::http::header::CONTENT_DISPOSITION,
                    format!("attachment; filename=\"{}\"", filename),
                ),
            ];
            (headers, bytes).into_response()
        }
        None => (
            axum::http::StatusCode::NOT_FOUND,
            Json(serde_json::json!({"error": "本次任务没有 tracelog 归档（可能 tracelog.mode=disabled 或 smart 模式下成功任务只保留 manifest）"})),
        )
            .into_response(),
    }
}

/// GET /api/projects/tasks/:id/tracelog/ls
/// 列出归档里所有可读文件（白名单过滤后），供前端 Drawer 左侧文件树
pub async fn list_task_tracelog_files(
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
    let task = project_generation_task::Entity::find_by_id(id)
        .filter(project_generation_task::Column::UserId.eq(user.id))
        .one(&state.db)
        .await
        .ok()
        .flatten();
    if task.is_none() {
        return (axum::http::StatusCode::NOT_FOUND, Json(serde_json::json!({"error":"任务不存在"}))).into_response();
    }
    let files = crate::services::tracelog::task_tracelog_list_files(&state, id).await;
    Json(serde_json::json!({ "files": files })).into_response()
}

/// GET /api/projects/tasks/:id/tracelog/file?path=relative/path
/// 读单文件原文（路径白名单 + 1MB 截断）。供前端 Drawer 右侧 pre 预览。
#[derive(Debug, serde::Deserialize)]
pub struct TracelogFileQuery {
    pub path: String,
}

pub async fn read_task_tracelog_file(
    State(state): State<AppState>,
    auth_user: jwt::AuthUser,
    Path(id): Path<i32>,
    axum::extract::Query(q): axum::extract::Query<TracelogFileQuery>,
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
    let task = project_generation_task::Entity::find_by_id(id)
        .filter(project_generation_task::Column::UserId.eq(user.id))
        .one(&state.db)
        .await
        .ok()
        .flatten();
    if task.is_none() {
        return (axum::http::StatusCode::NOT_FOUND, Json(serde_json::json!({"error":"任务不存在"}))).into_response();
    }
    match crate::services::tracelog::task_tracelog_read_file(&state, id, &q.path).await {
        Some(bytes) => {
            // 给 markdown / json / jsonl 一律按 text/plain UTF-8 返回
            // 前端按 path 后缀决定渲染方式（pre + 复制按钮）
            let body = String::from_utf8_lossy(&bytes).to_string();
            Json(serde_json::json!({ "path": q.path, "content": body, "size": bytes.len() })).into_response()
        }
        None => (
            axum::http::StatusCode::NOT_FOUND,
            Json(serde_json::json!({"error": "文件不存在或路径越权（仅允许 manifest.json / analysis_input.md / system_prompt.md / events.jsonl / llm_calls/*.json / skills_snapshot/**.md / rag_snapshot/*）"})),
        )
            .into_response(),
    }
}

async fn send_error(mut socket: WebSocket, msg: &str) -> Result<(), axum::Error> {
    let body = serde_json::json!({"error": msg}).to_string();
    socket.send(Message::Text(body)).await
}

/// 2026-04-25：amis-translator 路径下没有 LLM session 时的 WS 处理。
///
/// 不连 claw-agent，仅发一条 translator_idle 通知 + 保持 keep-alive，
/// 让前端 useProjectEvents 把 WS 当成「连上了但无增量」处理（事件靠 REST history 拉）。
async fn handle_ws_translator_idle(socket: WebSocket, task_id: i32) {
    use futures_util::{SinkExt, StreamExt};
    let (mut client_tx, mut client_rx) = socket.split();

    // 发一条「translator_idle」事件，前端 normalizeHistoryItem 会按 type 识别
    let hello = serde_json::json!({
        "type": "translator_idle",
        "data": {
            "task_id": task_id,
            "reason": "task 由确定性翻译器生成，无 LLM session；事件流仅来自 REST history",
        }
    })
    .to_string();
    if client_tx.send(Message::Text(hello)).await.is_err() {
        return;
    }

    // 维持连接：转发 ping → pong，等客户端 close
    while let Some(msg) = client_rx.next().await {
        match msg {
            Ok(Message::Close(_)) | Err(_) => break,
            Ok(Message::Ping(data)) => {
                if client_tx.send(Message::Pong(data)).await.is_err() {
                    break;
                }
            }
            _ => {}
        }
    }
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

/// 2026-04：非 uniapp 底座（React / Vue3 / RN 等）没有 `pages.json`，改扫 `src/pages/**` 目录。
///
/// 返回 `[{ "path": "/pages/<stem>", "title": "<stem>" }]`。
/// `path` 仅作**页面切换下拉的标签**使用，实际 iframe URL 仍走 preview_port 根路径
/// （React/Vue 路由由前端 router 决定）。上限 50 个文件，防 Agent 失控生成一堆文件卡住 UI。
fn scan_pages_fs(workdir: &str) -> Vec<serde_json::Value> {
    let pages_dir = std::path::PathBuf::from(workdir).join("src").join("pages");
    if !pages_dir.is_dir() {
        return Vec::new();
    }
    let mut out: Vec<serde_json::Value> = Vec::new();
    let mut stack: Vec<std::path::PathBuf> = vec![pages_dir.clone()];
    while let Some(dir) = stack.pop() {
        let Ok(rd) = std::fs::read_dir(&dir) else { continue };
        for entry in rd.flatten() {
            if out.len() >= 50 {
                return out;
            }
            let path = entry.path();
            if path.is_dir() {
                stack.push(path);
                continue;
            }
            let ext = path.extension().and_then(|e| e.to_str()).unwrap_or("");
            if !matches!(ext, "tsx" | "jsx" | "vue" | "ts" | "js") {
                continue;
            }
            let Ok(rel) = path.strip_prefix(&pages_dir) else { continue };
            // "Home.tsx"       → path = "/Home"、title = "Home"
            // "user/detail.vue" → path = "/user/detail"、title = "user/detail"
            let rel_noext = rel.with_extension("");
            let rel_str = rel_noext.to_string_lossy().replace('\\', "/");
            if rel_str.is_empty() {
                continue;
            }
            // 过滤常见非页面文件（index.ts 路由注册文件 / 共享组件）
            let base = rel_noext
                .file_name()
                .and_then(|s| s.to_str())
                .unwrap_or("");
            if base.starts_with('_') || base.eq_ignore_ascii_case("index") && ext != "tsx" && ext != "vue" {
                continue;
            }
            out.push(serde_json::json!({
                "path": format!("/{}", rel_str),
                "title": rel_str,
            }));
        }
    }
    out.sort_by(|a, b| {
        a["path"]
            .as_str()
            .unwrap_or("")
            .cmp(b["path"].as_str().unwrap_or(""))
    });
    out
}
