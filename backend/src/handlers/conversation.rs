//! 通用 AI 对话页（左侧菜单「AI 对话」）后端入口。
//!
//! 与「Amis 生成」（走 Python agent /generate）不同：
//! 这里是纯文本聊天，使用 model_configs 里 task_type=chat 的供应商+模型。
//! Selector 在 [`crate::services::llm_selector::select_for_chat`]，缺 chat 时 fallback generation。
//!
//! 模型 = task_type=chat。会话与消息全部入 PostgreSQL：
//!   - `conversation_session`：每个用户一份会话列表
//!   - `conversation_message` ：单条消息（user / assistant / system）
//! 流式接口走 SSE：先落库 user 消息 → 转发上游 OpenAI SSE → 累积完毕落库 assistant 消息。

use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::{
        sse::{Event, KeepAlive, Sse},
        IntoResponse,
    },
    Json,
};
use chrono::Utc;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, EntityTrait, QueryFilter, QueryOrder, QuerySelect, Set,
};
use serde::{Deserialize, Serialize};
use serde_json::json;
use std::convert::Infallible;
use tokio::sync::mpsc;

use crate::entity::{conversation_message, conversation_session, user};
use crate::services::llm_selector;
use crate::utils::jwt;
use crate::AppState;

// ────────────────────────────────────────────────────────────────────────────
// DTOs
// ────────────────────────────────────────────────────────────────────────────

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct ChatMessage {
    pub role: String,
    pub content: String,
}

#[derive(Debug, Serialize)]
pub struct SessionDTO {
    pub session_id: String,
    pub title: String,
    pub created_at: String,
    pub updated_at: String,
}

impl From<conversation_session::Model> for SessionDTO {
    fn from(m: conversation_session::Model) -> Self {
        Self {
            session_id: m.session_id,
            title: m.title,
            created_at: m.created_at.and_utc().to_rfc3339(),
            updated_at: m.updated_at.and_utc().to_rfc3339(),
        }
    }
}

#[derive(Debug, Serialize)]
pub struct MessageDTO {
    pub id: i32,
    pub role: String,
    pub content: String,
    pub model: Option<String>,
    pub provider: Option<String>,
    pub created_at: String,
}

impl From<conversation_message::Model> for MessageDTO {
    fn from(m: conversation_message::Model) -> Self {
        Self {
            id: m.id,
            role: m.role,
            content: m.content,
            model: m.model,
            provider: m.provider,
            created_at: m.created_at.and_utc().to_rfc3339(),
        }
    }
}

#[derive(Debug, Serialize)]
pub struct SessionDetail {
    #[serde(flatten)]
    pub session: SessionDTO,
    pub messages: Vec<MessageDTO>,
}

#[derive(Debug, Deserialize)]
pub struct PatchSessionPayload {
    pub title: String,
}

#[derive(Debug, Deserialize)]
pub struct ChatStreamPayload {
    pub content: String,
}

// ────────────────────────────────────────────────────────────────────────────
// 公共辅助
// ────────────────────────────────────────────────────────────────────────────

async fn fetch_user_id(
    state: &AppState,
    username: &str,
) -> Result<i32, (StatusCode, Json<serde_json::Value>)> {
    let u = user::Entity::find()
        .filter(user::Column::Username.eq(username))
        .one(&state.db)
        .await
        .map_err(|e| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({ "error": format!("DB error: {e}") })),
            )
        })?
        .ok_or_else(|| {
            (
                StatusCode::UNAUTHORIZED,
                Json(json!({ "error": "用户不存在" })),
            )
        })?;
    Ok(u.id)
}

async fn load_session_for_owner(
    state: &AppState,
    session_id: &str,
    user_id: i32,
) -> Result<conversation_session::Model, (StatusCode, Json<serde_json::Value>)> {
    let s = conversation_session::Entity::find()
        .filter(conversation_session::Column::SessionId.eq(session_id))
        .one(&state.db)
        .await
        .map_err(|e| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({ "error": format!("DB error: {e}") })),
            )
        })?
        .ok_or_else(|| {
            (
                StatusCode::NOT_FOUND,
                Json(json!({ "error": "会话不存在" })),
            )
        })?;
    if s.user_id != user_id {
        return Err((
            StatusCode::FORBIDDEN,
            Json(json!({ "error": "无权访问此会话" })),
        ));
    }
    Ok(s)
}

/// 取标题（用首条用户消息前 30 字，去掉换行/制表）。
fn derive_title(content: &str) -> String {
    let cleaned: String = content
        .chars()
        .map(|c| if c.is_whitespace() { ' ' } else { c })
        .collect();
    let trimmed = cleaned.trim();
    let mut title: String = trimmed.chars().take(30).collect();
    if trimmed.chars().count() > 30 {
        title.push('…');
    }
    if title.is_empty() {
        "新会话".to_string()
    } else {
        title
    }
}

// ────────────────────────────────────────────────────────────────────────────
// Sessions CRUD
// ────────────────────────────────────────────────────────────────────────────

/// `GET /api/conversation/sessions`：列当前用户的全部会话（最近更新在前）。
pub async fn list_sessions(
    State(state): State<AppState>,
    auth_user: jwt::AuthUser,
) -> impl IntoResponse {
    let user_id = match fetch_user_id(&state, &auth_user.username).await {
        Ok(id) => id,
        Err((s, j)) => return (s, j).into_response(),
    };
    match conversation_session::Entity::find()
        .filter(conversation_session::Column::UserId.eq(user_id))
        .order_by_desc(conversation_session::Column::UpdatedAt)
        .all(&state.db)
        .await
    {
        Ok(rows) => {
            let dtos: Vec<SessionDTO> = rows.into_iter().map(SessionDTO::from).collect();
            Json(json!({ "sessions": dtos })).into_response()
        }
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({ "error": format!("DB error: {e}") })),
        )
            .into_response(),
    }
}

/// `POST /api/conversation/sessions`：新建一条空会话。
pub async fn create_session(
    State(state): State<AppState>,
    auth_user: jwt::AuthUser,
) -> impl IntoResponse {
    let user_id = match fetch_user_id(&state, &auth_user.username).await {
        Ok(id) => id,
        Err((s, j)) => return (s, j).into_response(),
    };
    let now = Utc::now().naive_utc();
    let am = conversation_session::ActiveModel {
        session_id: Set(uuid::Uuid::new_v4().to_string()),
        user_id: Set(user_id),
        title: Set("新会话".to_string()),
        created_at: Set(now),
        updated_at: Set(now),
        ..Default::default()
    };
    match am.insert(&state.db).await {
        Ok(m) => Json(SessionDTO::from(m)).into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({ "error": format!("DB error: {e}") })),
        )
            .into_response(),
    }
}

/// `GET /api/conversation/sessions/:id`：拉取会话详情 + 全部消息（按创建时间升序）。
pub async fn get_session(
    State(state): State<AppState>,
    auth_user: jwt::AuthUser,
    Path(session_id): Path<String>,
) -> impl IntoResponse {
    let user_id = match fetch_user_id(&state, &auth_user.username).await {
        Ok(id) => id,
        Err((s, j)) => return (s, j).into_response(),
    };
    let s = match load_session_for_owner(&state, &session_id, user_id).await {
        Ok(s) => s,
        Err((sc, j)) => return (sc, j).into_response(),
    };
    let session_pk = s.id;
    let messages = match conversation_message::Entity::find()
        .filter(conversation_message::Column::SessionPk.eq(session_pk))
        .order_by_asc(conversation_message::Column::CreatedAt)
        .order_by_asc(conversation_message::Column::Id)
        .all(&state.db)
        .await
    {
        Ok(rows) => rows.into_iter().map(MessageDTO::from).collect(),
        Err(e) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({ "error": format!("DB error: {e}") })),
            )
                .into_response();
        }
    };
    Json(SessionDetail {
        session: SessionDTO::from(s),
        messages,
    })
    .into_response()
}

/// `PATCH /api/conversation/sessions/:id`：改标题（仅 title 字段）。
pub async fn rename_session(
    State(state): State<AppState>,
    auth_user: jwt::AuthUser,
    Path(session_id): Path<String>,
    Json(payload): Json<PatchSessionPayload>,
) -> impl IntoResponse {
    let user_id = match fetch_user_id(&state, &auth_user.username).await {
        Ok(id) => id,
        Err((s, j)) => return (s, j).into_response(),
    };
    let s = match load_session_for_owner(&state, &session_id, user_id).await {
        Ok(s) => s,
        Err((sc, j)) => return (sc, j).into_response(),
    };

    let title = payload.title.trim();
    if title.is_empty() {
        return (
            StatusCode::BAD_REQUEST,
            Json(json!({ "error": "title 不能为空" })),
        )
            .into_response();
    }
    let title = title.chars().take(80).collect::<String>();

    let mut am: conversation_session::ActiveModel = s.into();
    am.title = Set(title);
    am.updated_at = Set(Utc::now().naive_utc());
    match am.update(&state.db).await {
        Ok(m) => Json(SessionDTO::from(m)).into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({ "error": format!("DB error: {e}") })),
        )
            .into_response(),
    }
}

/// `DELETE /api/conversation/sessions/:id`：删会话连带消息。
pub async fn delete_session(
    State(state): State<AppState>,
    auth_user: jwt::AuthUser,
    Path(session_id): Path<String>,
) -> impl IntoResponse {
    let user_id = match fetch_user_id(&state, &auth_user.username).await {
        Ok(id) => id,
        Err((s, j)) => return (s, j).into_response(),
    };
    let s = match load_session_for_owner(&state, &session_id, user_id).await {
        Ok(s) => s,
        Err((sc, j)) => return (sc, j).into_response(),
    };
    let session_pk = s.id;

    if let Err(e) = conversation_message::Entity::delete_many()
        .filter(conversation_message::Column::SessionPk.eq(session_pk))
        .exec(&state.db)
        .await
    {
        return (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({ "error": format!("DB error: {e}") })),
        )
            .into_response();
    }
    if let Err(e) = conversation_session::Entity::delete_by_id(session_pk)
        .exec(&state.db)
        .await
    {
        return (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({ "error": format!("DB error: {e}") })),
        )
            .into_response();
    }
    Json(json!({ "ok": true })).into_response()
}

// ────────────────────────────────────────────────────────────────────────────
// 流式 chat：SSE
// ────────────────────────────────────────────────────────────────────────────

/// `POST /api/conversation/sessions/:id/chat/stream`
/// 请求体 `{ content }`：要发送的用户消息。
/// SSE 事件：
///   - `meta`  : `{ user_message: MessageDTO, model, provider, title }`（首字到来前先发，让前端把用户气泡和 assistant 占位钉好）
///   - `chunk` : `{ text }` 增量 assistant 文本
///   - `final` : `{ assistant_message: MessageDTO }` 流结束后落库的 assistant 消息
///   - `error` : `{ error }`
pub async fn chat_stream(
    State(state): State<AppState>,
    auth_user: jwt::AuthUser,
    Path(session_id): Path<String>,
    Json(payload): Json<ChatStreamPayload>,
) -> axum::response::Response {
    let user_id = match fetch_user_id(&state, &auth_user.username).await {
        Ok(id) => id,
        Err((s, j)) => return (s, j).into_response(),
    };
    let session = match load_session_for_owner(&state, &session_id, user_id).await {
        Ok(s) => s,
        Err((sc, j)) => return (sc, j).into_response(),
    };

    let content = payload.content.trim().to_string();
    if content.is_empty() {
        return (
            StatusCode::BAD_REQUEST,
            Json(json!({ "error": "content 不能为空" })),
        )
            .into_response();
    }

    // 选模型
    let decision = match llm_selector::select_for_chat(&state).await {
        Ok(d) => d,
        Err(e) => {
            return (
                StatusCode::SERVICE_UNAVAILABLE,
                Json(json!({ "error": e })),
            )
                .into_response();
        }
    };
    if decision.config.protocol != "openai" {
        return (
            StatusCode::BAD_REQUEST,
            Json(json!({
                "error": format!("暂不支持协议 `{}`，目前 AI 对话仅支持 OpenAI 兼容协议", decision.config.protocol)
            })),
        )
            .into_response();
    }
    let base_url = match decision.config.base_url.as_deref() {
        Some(u) => u.to_string(),
        None => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({ "error": "provider 缺 base_url" })),
            )
                .into_response();
        }
    };
    let api_key = decision.config.api_key.clone().unwrap_or_default();
    let model_name = decision.config.model.clone();
    let provider_name = decision.provider_name.clone();

    // 落库 user 消息 + 拉历史（用于 prompt） + 维护 title
    let session_pk = session.id;
    let now = Utc::now().naive_utc();

    let user_am = conversation_message::ActiveModel {
        session_pk: Set(session_pk),
        role: Set("user".to_string()),
        content: Set(content.clone()),
        model: Set(None),
        provider: Set(None),
        created_at: Set(now),
        ..Default::default()
    };
    let user_msg_model = match user_am.insert(&state.db).await {
        Ok(m) => m,
        Err(e) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({ "error": format!("写入用户消息失败: {e}") })),
            )
                .into_response();
        }
    };

    // 如果会话仍是默认标题，且这是首条用户消息：用前 30 字回填 title
    let need_title = session.title == "新会话" || session.title.trim().is_empty();
    let new_title = if need_title {
        let t = derive_title(&content);
        let mut am: conversation_session::ActiveModel = session.clone().into();
        am.title = Set(t.clone());
        am.updated_at = Set(now);
        let _ = am.update(&state.db).await;
        Some(t)
    } else {
        // 仅 bump updated_at
        let mut am: conversation_session::ActiveModel = session.clone().into();
        am.updated_at = Set(now);
        let _ = am.update(&state.db).await;
        None
    };

    // 取最近 20 条历史（含刚落库这条），按时间升序，转成 OpenAI messages
    let history_rows = match conversation_message::Entity::find()
        .filter(conversation_message::Column::SessionPk.eq(session_pk))
        .order_by_desc(conversation_message::Column::CreatedAt)
        .order_by_desc(conversation_message::Column::Id)
        .limit(Some(20))
        .all(&state.db)
        .await
    {
        Ok(mut rows) => {
            rows.reverse();
            rows
        }
        Err(e) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({ "error": format!("读取历史失败: {e}") })),
            )
                .into_response();
        }
    };
    let history_msgs: Vec<ChatMessage> = history_rows
        .into_iter()
        .map(|m| ChatMessage {
            role: m.role,
            content: m.content,
        })
        .collect();

    let url = format!("{}/chat/completions", base_url.trim_end_matches('/'));
    let body = json!({
        "model": model_name,
        "messages": history_msgs,
        "temperature": 0.7,
        "stream": true,
    });

    let (tx, rx) = mpsc::channel::<Event>(128);
    let http_client = state.http_client.clone();
    let db = state.db.clone();
    let user_msg_dto = MessageDTO::from(user_msg_model);

    tokio::spawn(async move {
        // meta 先到（前端拿来挂气泡 + 标题）
        let _ = tx
            .send(
                Event::default().event("meta").data(
                    json!({
                        "user_message": user_msg_dto,
                        "model": model_name,
                        "provider": provider_name,
                        "title": new_title,
                    })
                    .to_string(),
                ),
            )
            .await;

        let resp = match http_client
            .post(&url)
            .header("Authorization", format!("Bearer {}", api_key))
            .header("Content-Type", "application/json")
            .json(&body)
            .timeout(std::time::Duration::from_secs(180))
            .send()
            .await
        {
            Ok(r) => r,
            Err(e) => {
                let _ = tx
                    .send(
                        Event::default().event("error").data(
                            json!({ "error": format!("LLM 请求失败: {e}") }).to_string(),
                        ),
                    )
                    .await;
                return;
            }
        };

        if !resp.status().is_success() {
            let code = resp.status().as_u16();
            let text = resp.text().await.unwrap_or_default();
            let _ = tx
                .send(
                    Event::default().event("error").data(
                        json!({
                            "error": format!("LLM 返回 HTTP {}: {}", code,
                                text.chars().take(300).collect::<String>())
                        })
                        .to_string(),
                    ),
                )
                .await;
            return;
        }

        // 增量解析 OpenAI SSE，把 delta.content 累加 + 转发为 chunk 事件
        let mut accumulated = String::new();
        if let Err(e) = pump_openai_stream(resp, &tx, &mut accumulated).await {
            let _ = tx
                .send(
                    Event::default()
                        .event("error")
                        .data(json!({ "error": e }).to_string()),
                )
                .await;
            return;
        }

        // 落库 assistant 消息（即使为空也存，以便前端刷新后能看到失败痕迹）
        let final_content = if accumulated.is_empty() {
            "（模型返回了空内容）".to_string()
        } else {
            accumulated
        };
        let now2 = Utc::now().naive_utc();
        let assistant_am = conversation_message::ActiveModel {
            session_pk: Set(session_pk),
            role: Set("assistant".to_string()),
            content: Set(final_content.clone()),
            model: Set(Some(model_name.clone())),
            provider: Set(Some(provider_name.clone())),
            created_at: Set(now2),
            ..Default::default()
        };
        match assistant_am.insert(&db).await {
            Ok(m) => {
                // bump session.updated_at
                if let Ok(Some(s)) = conversation_session::Entity::find_by_id(session_pk)
                    .one(&db)
                    .await
                {
                    let mut am: conversation_session::ActiveModel = s.into();
                    am.updated_at = Set(now2);
                    let _ = am.update(&db).await;
                }
                let _ = tx
                    .send(Event::default().event("final").data(
                        json!({ "assistant_message": MessageDTO::from(m) }).to_string(),
                    ))
                    .await;
            }
            Err(e) => {
                let _ = tx
                    .send(Event::default().event("error").data(
                        json!({ "error": format!("写入 assistant 消息失败: {e}") }).to_string(),
                    ))
                    .await;
            }
        }
    });

    let stream = futures::stream::unfold(rx, |mut rx| async move {
        rx.recv()
            .await
            .map(|ev| (Ok::<Event, Infallible>(ev), rx))
    });
    Sse::new(stream)
        .keep_alive(KeepAlive::default())
        .into_response()
}

/// 解析上游 OpenAI `chat/completions` SSE 流：
/// 规则按 W3C SSE：空行作为事件边界，`data:` 允许多行累加（\n 拼接），`data: [DONE]` 结束。
/// 不依赖 reqwest 的 `stream` feature，直接走 `Response::chunk()`。
async fn pump_openai_stream(
    mut resp: reqwest::Response,
    tx: &mpsc::Sender<Event>,
    accumulated: &mut String,
) -> Result<(), String> {
    let mut buffer = String::new();
    let mut current_data = String::new();

    loop {
        match resp.chunk().await {
            Ok(Some(bytes)) => {
                match std::str::from_utf8(&bytes) {
                    Ok(s) => buffer.push_str(s),
                    Err(_) => continue, // 丢弃非 UTF-8 分片
                }
                while let Some(idx) = buffer.find('\n') {
                    let line = {
                        let l = &buffer[..idx];
                        l.strip_suffix('\r').unwrap_or(l).to_string()
                    };
                    buffer.drain(..=idx);

                    if line.is_empty() {
                        // 事件边界
                        if !current_data.is_empty() {
                            let data = std::mem::take(&mut current_data);
                            if data == "[DONE]" {
                                return Ok(());
                            }
                            if let Some(text) = extract_delta_content(&data) {
                                if !text.is_empty() {
                                    accumulated.push_str(&text);
                                    if tx
                                        .send(Event::default().event("chunk").data(
                                            json!({ "text": text }).to_string(),
                                        ))
                                        .await
                                        .is_err()
                                    {
                                        // 客户端已断开（用户点了停止 / 关页面）→ 不再读上游，
                                        // 已累积内容由调用方落库（保留中断时已生成的部分）。
                                        return Ok(());
                                    }
                                }
                            }
                        }
                    } else if let Some(rest) = line.strip_prefix("data:") {
                        if !current_data.is_empty() {
                            current_data.push('\n');
                        }
                        current_data.push_str(rest.trim_start());
                    }
                    // 其他字段（id / event / retry）忽略
                }
            }
            Ok(None) => {
                // 流末尾若残留 data 块（无空行结束）也尝试 flush
                if !current_data.is_empty() {
                    let data = std::mem::take(&mut current_data);
                    if data != "[DONE]" {
                        if let Some(text) = extract_delta_content(&data) {
                            if !text.is_empty() {
                                accumulated.push_str(&text);
                                let _ = tx
                                    .send(Event::default().event("chunk").data(
                                        json!({ "text": text }).to_string(),
                                    ))
                                    .await;
                                // 末尾这块即使 send 失败也无所谓——后面 caller 直接落库
                            }
                        }
                    }
                }
                return Ok(());
            }
            Err(e) => return Err(format!("上游流读取失败: {e}")),
        }
    }
}

/// 从单条 OpenAI SSE `data:` JSON 提取 `choices[0].delta.content`。
fn extract_delta_content(data: &str) -> Option<String> {
    let v: serde_json::Value = serde_json::from_str(data).ok()?;
    v.pointer("/choices/0/delta/content")
        .and_then(|s| s.as_str())
        .map(|s| s.to_string())
}
