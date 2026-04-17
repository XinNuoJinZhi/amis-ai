use crate::state::{AgentTask, AppState, SharedState, TaskStatus};
use crate::task_loop::{spawn_task_loop, TaskLoopConfig};
use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::sync::{broadcast, mpsc};

#[derive(Debug, Deserialize)]
pub struct CreateTaskRequest {
    pub workdir: String,
    pub sandbox_id: String,
    pub initial_message: String,
    pub model: Option<String>,
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

    let task_id = uuid::Uuid::new_v4().to_string();
    let model = req.model.unwrap_or_else(|| state.default_model.clone());

    let task = AgentTask {
        id: task_id.clone(),
        status: TaskStatus::Pending,
        workdir: req.workdir.clone(),
        sandbox_id: Some(req.sandbox_id.clone()),
        tx: event_tx.clone(),
        msg_tx,
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
        event_tx,
        msg_rx,
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
    let task = tasks.get_mut(&id).ok_or_else(|| {
        (
            StatusCode::NOT_FOUND,
            Json(serde_json::json!({"error": "Task not found"})),
        )
    })?;

    task.status = TaskStatus::Stopped;
    let _ = task.tx.send(crate::state::TaskEvent::StatusChange(TaskStatus::Stopped));

    Ok(Json(serde_json::json!({"status": "stopped"})))
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
