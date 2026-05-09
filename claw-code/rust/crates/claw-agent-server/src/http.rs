use crate::permission_prompter::PermissionDecisionPayload;
use crate::state::{AgentTask, SharedState, TaskStatus};
use crate::task_loop::{parse_permission_mode, spawn_task_loop, PermissionConfig, TaskLoopConfig};
use axum::{
    extract::{Path, State},
    http::StatusCode,
    Json,
};
use runtime::PermissionMode;
use serde::{Deserialize, Serialize};
use std::sync::mpsc as std_mpsc;
use std::sync::{Arc, Mutex};
use tokio::sync::{broadcast, mpsc};

#[derive(Debug, Deserialize, Clone)]
pub struct LlmConfigInput {
    pub base_url: Option<String>,
    pub api_key: Option<String>,
    pub model: String,
    /// 协议类型：openai / anthropic。缺省视为 openai。
    #[serde(default)]
    pub protocol: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct CreateTaskRequest {
    pub workdir: String,
    pub sandbox_id: String,
    pub initial_message: String,
    pub model: Option<String>,
    pub tech_stack: Option<String>,
    /// 2026-04 多维选桶字段（可选，缺省时走 tech_stack legacy 路径）
    #[serde(default)]
    pub platform: Option<String>,
    #[serde(default)]
    pub tech_stacks: Option<Vec<String>>,
    #[serde(default)]
    pub ui_libs: Option<Vec<String>>,
    #[serde(default)]
    pub template_name: Option<String>,
    #[serde(default)]
    pub explicit_buckets: Option<Vec<String>>,
    pub llm_config: Option<LlmConfigInput>,
    pub permission_config: Option<PermissionConfigInput>,
    /// B.5：可选的额外 system_prompt 段（最常见用途：backend 拼好的 RAG Top-K 样例段）。
    /// 这些段会在 Skills 索引之后被追加，不替换任何现有内容。
    #[serde(default)]
    pub extra_system_sections: Option<Vec<String>>,
    /// 1.2.0：single-shot 模式（默认 false = interactive）。
    /// true 时跑完 initial turn 立刻退出，不等 follow-up message——
    /// 适用于多页 / batch 等"一锤子买卖"用法，task_loop 自然走到 succeeded 终态。
    #[serde(default)]
    pub single_shot: Option<bool>,
}

#[derive(Debug, Deserialize, Clone, Default)]
pub struct PermissionConfigInput {
    pub mode: Option<String>,
    pub allowed_tools: Option<Vec<String>>,
}

#[derive(Debug, Serialize)]
pub struct CreateTaskResponse {
    pub id: String,
    pub status: TaskStatus,
}

pub async fn create_task(
    State(state): State<SharedState>,
    Json(req): Json<CreateTaskRequest>,
) -> Result<Json<CreateTaskResponse>, (StatusCode, Json<serde_json::Value>)> {
    let (event_tx, _) = broadcast::channel(200);
    let (msg_tx, msg_rx) = mpsc::channel(50);
    let (decision_tx, decision_rx) = std_mpsc::channel::<PermissionDecisionPayload>();

    let task_id = uuid::Uuid::new_v4().to_string();
    let model = req.model.unwrap_or_else(|| state.default_model.clone());

    // 解析前端传来的权限配置（没传 → 默认 DangerFullAccess）
    let pc_input = req.permission_config.clone().unwrap_or_default();
    let mode = pc_input
        .mode
        .as_deref()
        .and_then(parse_permission_mode)
        .unwrap_or(PermissionMode::DangerFullAccess);
    let permission_config = PermissionConfig {
        mode,
        allowed_tools: pc_input.allowed_tools,
    };

    // 启动期事件缓存：skills_loaded / system_prompt_built 这种一次性事件在 WS 订阅建立前发出，
    // 否则 tokio::broadcast 会丢消息。WS handler 订阅时先 replay 这份缓存。
    let initial_events = Arc::new(Mutex::new(Vec::new()));

    let task = AgentTask {
        id: task_id.clone(),
        status: TaskStatus::Pending,
        workdir: req.workdir.clone(),
        sandbox_id: Some(req.sandbox_id.clone()),
        tx: event_tx.clone(),
        msg_tx,
        decision_tx,
        initial_events: initial_events.clone(),
        created_at: chrono::Utc::now(),
    };

    {
        let mut tasks = state.tasks.write().await;
        tasks.insert(task_id.clone(), task);
    }

    spawn_task_loop(TaskLoopConfig {
        task_id: task_id.clone(),
        initial_message: req.initial_message,
        workdir: req.workdir,
        sandbox_id: req.sandbox_id,
        model,
        sandbox_url: state.sandbox_url.clone(),
        tech_stack: req.tech_stack.unwrap_or_else(|| "uniapp-wot-h5".to_string()),
        platform: req.platform,
        tech_stacks: req.tech_stacks.unwrap_or_default(),
        ui_libs: req.ui_libs.unwrap_or_default(),
        template_name: req.template_name,
        explicit_buckets: req.explicit_buckets.unwrap_or_default(),
        llm_config: req.llm_config.map(|c| crate::task_loop::LlmConfig {
            base_url: c.base_url,
            api_key: c.api_key,
            model: c.model,
            protocol: c.protocol.unwrap_or_else(|| "openai".to_string()),
        }),
        permission_config,
        decision_rx,
        event_tx,
        msg_rx,
        extra_system_sections: req.extra_system_sections.unwrap_or_default(),
        initial_events,
        single_shot: req.single_shot.unwrap_or(false),
    });

    Ok(Json(CreateTaskResponse {
        id: task_id,
        status: TaskStatus::Running,
    }))
}

#[derive(Debug, Deserialize)]
pub struct AddMessageRequest {
    pub content: String,
}

pub async fn add_message(
    State(state): State<SharedState>,
    Path(id): Path<String>,
    Json(req): Json<AddMessageRequest>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    let tasks = state.tasks.read().await;
    let task = tasks.get(&id).ok_or_else(|| {
        (
            StatusCode::NOT_FOUND,
            Json(serde_json::json!({"error": "Task not found"})),
        )
    })?;

    // 先 broadcast 一条 user_message：这样 backend WS 代理会立刻把它转给前端
    // （UX：用户一回车就能看到自己的话）并持久化到 project_task_event 表
    // （刷新页面回放时也能看到）。再丢进 msg_tx 让 task_loop 去 run_turn。
    let _ = task.tx.send(crate::state::TaskEvent::UserMessage(req.content.clone()));

    task.msg_tx.send(req.content).await.map_err(|_| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({"error": "Failed to queue message"})),
        )
    })?;

    Ok(Json(serde_json::json!({"status": "queued"})))
}

pub async fn stop_task(
    State(state): State<SharedState>,
    Path(id): Path<String>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    let mut tasks = state.tasks.write().await;
    let task = tasks.remove(&id).ok_or_else(|| {
        (
            StatusCode::NOT_FOUND,
            Json(serde_json::json!({"error": "Task not found"})),
        )
    })?;

    // 广播状态变更事件，然后 task 被 drop 时 msg_tx 也随之 drop，
    // task_loop 里的 blocking_recv 会收到 None 而退出循环
    let _ = task.tx.send(crate::state::TaskEvent::StatusChange(TaskStatus::Stopped));
    drop(task);

    Ok(Json(serde_json::json!({"status": "stopped"})))
}

#[derive(Debug, Deserialize)]
pub struct PermissionDecisionRequest {
    pub request_id: String,
    pub allow: bool,
    #[serde(default)]
    pub remember: bool,
    pub reason: Option<String>,
}

pub async fn post_permission_decision(
    State(state): State<SharedState>,
    Path(id): Path<String>,
    Json(req): Json<PermissionDecisionRequest>,
) -> Result<Json<serde_json::Value>, (StatusCode, Json<serde_json::Value>)> {
    let tasks = state.tasks.read().await;
    let task = tasks.get(&id).ok_or_else(|| {
        (
            StatusCode::NOT_FOUND,
            Json(serde_json::json!({"error": "Task not found"})),
        )
    })?;

    task.decision_tx
        .send(PermissionDecisionPayload {
            request_id: req.request_id,
            allow: req.allow,
            remember: req.remember,
            reason: req.reason,
        })
        .map_err(|_| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({"error": "failed to dispatch decision"})),
            )
        })?;

    Ok(Json(serde_json::json!({"status": "ok"})))
}

pub async fn debug_state(State(state): State<SharedState>) -> Json<serde_json::Value> {
    let tasks = state.tasks.read().await;
    let task_list: Vec<serde_json::Value> = tasks
        .values()
        .map(|t| {
            serde_json::json!({
                "id": t.id,
                "status": t.status,
                "workdir": t.workdir,
                "sandbox_id": t.sandbox_id,
                "created_at": t.created_at,
            })
        })
        .collect();

    Json(serde_json::json!({
        "tasks": task_list,
        "count": tasks.len(),
    }))
}
