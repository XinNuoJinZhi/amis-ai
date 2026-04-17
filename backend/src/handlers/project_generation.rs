use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use sea_orm::{ActiveModelTrait, ColumnTrait, EntityTrait, QueryFilter, QueryOrder, Set};
use serde::{Deserialize, Serialize};
use serde_json::json;

use crate::entity::{project_generation_task, project_task_message, project_task_event, user};
use crate::services::{claw_agent_client::ClawAgentClient, sandbox_client::SandboxClient};
use crate::utils::jwt;
use crate::AppState;

#[derive(Debug, Deserialize)]
pub struct CreateTaskPayload {
    pub amis_json: String,
    pub tech_stack: Option<String>,
    pub ui_library: Option<String>,
    pub extra_prompt: Option<String>,
    pub source_history_id: Option<i32>,
}

#[derive(Debug, Serialize)]
pub struct TaskBrief {
    pub id: i32,
    pub status: String,
    pub tech_stack: String,
    pub ui_library: String,
    pub preview_port: Option<i32>,
    pub sandbox_id: Option<String>,
    pub workdir_path: Option<String>,
    pub created_at: chrono::NaiveDateTime,
}

async fn resolve_user(
    state: &AppState,
    auth_user: &jwt::AuthUser,
) -> Result<user::Model, (StatusCode, Json<serde_json::Value>)> {
    user::Entity::find()
        .filter(user::Column::Username.eq(&auth_user.username))
        .one(&state.db)
        .await
        .map_err(|e| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({"error": format!("DB error: {}", e)})),
            )
        })?
        .ok_or_else(|| {
            (
                StatusCode::UNAUTHORIZED,
                Json(json!({"error": "用户不存在"})),
            )
        })
}

pub async fn create_task(
    State(state): State<AppState>,
    auth_user: jwt::AuthUser,
    Json(payload): Json<CreateTaskPayload>,
) -> impl IntoResponse {
    let user = match resolve_user(&state, &auth_user).await {
        Ok(u) => u,
        Err(e) => return e.into_response(),
    };

    let tech_stack = payload.tech_stack.unwrap_or_else(|| "uniapp-wot-h5".to_string());
    let ui_library = payload.ui_library.unwrap_or_else(|| "wot-ui".to_string());

    // 1. 先在 DB 创建任务记录（pending）
    let now = chrono::Local::now().naive_local();
    let task_record = project_generation_task::ActiveModel {
        user_id: Set(user.id),
        source_history_id: Set(payload.source_history_id),
        amis_json: Set(payload.amis_json.clone()),
        tech_stack: Set(tech_stack.clone()),
        ui_library: Set(ui_library.clone()),
        extra_prompt: Set(payload.extra_prompt.clone()),
        status: Set("pending".to_owned()),
        fix_attempts: Set(0),
        created_at: Set(now),
        updated_at: Set(now),
        ..Default::default()
    };

    let saved = match task_record.insert(&state.db).await {
        Ok(t) => t,
        Err(e) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({"error": format!("创建任务失败: {}", e)})),
            )
                .into_response()
        }
    };

    let task_id = saved.id;
    let task_id_str = format!("task-{}", task_id);

    // 2. 拉起 sandbox
    let sandbox = SandboxClient::new(state.http_client.clone(), state.sandbox_url.clone());
    let sandbox_info = match sandbox.create(&task_id_str).await {
        Ok(s) => s,
        Err(e) => {
            mark_task_failed(&state, task_id, &format!("sandbox 创建失败: {}", e)).await;
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({"error": format!("sandbox 创建失败: {}", e)})),
            )
                .into_response();
        }
    };

    // 3. 调 claw-agent-server 创建会话
    let claw = ClawAgentClient::new(state.http_client.clone(), state.claw_agent_url.clone());
    let initial_message = build_initial_prompt(&payload.amis_json, payload.extra_prompt.as_deref());

    let claw_req = crate::services::claw_agent_client::CreateTaskRequest {
        workdir: sandbox_info.workdir.clone(),
        sandbox_id: sandbox_info.id.clone(),
        initial_message,
        model: None,
    };

    let claw_resp = match claw.create_task(claw_req).await {
        Ok(r) => r,
        Err(e) => {
            // 尝试清理 sandbox
            let _ = sandbox.delete(&sandbox_info.id).await;
            mark_task_failed(&state, task_id, &format!("claw-agent 启动失败: {}", e)).await;
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({"error": format!("claw-agent 启动失败: {}", e)})),
            )
                .into_response();
        }
    };

    // 4. 更新 DB 记录：挂载 sandbox/claw session 信息
    let active = project_generation_task::ActiveModel {
        id: Set(task_id),
        sandbox_id: Set(Some(sandbox_info.id.clone())),
        preview_port: Set(Some(sandbox_info.preview_port as i32)),
        workdir_path: Set(Some(sandbox_info.workdir.clone())),
        claw_session_id: Set(Some(claw_resp.id.clone())),
        status: Set("running".to_owned()),
        updated_at: Set(chrono::Local::now().naive_local()),
        ..Default::default()
    };

    if let Err(e) = active.update(&state.db).await {
        tracing::error!("更新任务状态失败: {}", e);
    }

    // 5. 写入初始消息
    let _ = project_task_message::ActiveModel {
        task_id: Set(task_id),
        role: Set("user".to_owned()),
        content: Set(payload.amis_json),
        created_at: Set(chrono::Local::now().naive_local()),
        ..Default::default()
    }
    .insert(&state.db)
    .await;

    (
        StatusCode::CREATED,
        Json(json!({
            "id": task_id,
            "status": "running",
            "sandbox_id": sandbox_info.id,
            "preview_port": sandbox_info.preview_port,
            "claw_session_id": claw_resp.id,
        })),
    )
        .into_response()
}

pub async fn list_tasks(
    State(state): State<AppState>,
    auth_user: jwt::AuthUser,
) -> impl IntoResponse {
    let user = match resolve_user(&state, &auth_user).await {
        Ok(u) => u,
        Err(e) => return e.into_response(),
    };

    let tasks = project_generation_task::Entity::find()
        .filter(project_generation_task::Column::UserId.eq(user.id))
        .order_by_desc(project_generation_task::Column::CreatedAt)
        .all(&state.db)
        .await
        .unwrap_or_default();

    let briefs: Vec<TaskBrief> = tasks
        .into_iter()
        .map(|t| TaskBrief {
            id: t.id,
            status: t.status,
            tech_stack: t.tech_stack,
            ui_library: t.ui_library,
            preview_port: t.preview_port,
            sandbox_id: t.sandbox_id,
            workdir_path: t.workdir_path,
            created_at: t.created_at,
        })
        .collect();

    Json(briefs).into_response()
}

pub async fn get_task(
    State(state): State<AppState>,
    auth_user: jwt::AuthUser,
    Path(id): Path<i32>,
) -> impl IntoResponse {
    let user = match resolve_user(&state, &auth_user).await {
        Ok(u) => u,
        Err(e) => return e.into_response(),
    };

    let task = project_generation_task::Entity::find_by_id(id)
        .filter(project_generation_task::Column::UserId.eq(user.id))
        .one(&state.db)
        .await
        .unwrap_or_default();

    match task {
        Some(t) => Json(t).into_response(),
        None => (
            StatusCode::NOT_FOUND,
            Json(json!({"error": "任务不存在"})),
        )
            .into_response(),
    }
}

#[derive(Debug, Deserialize)]
pub struct AddMessagePayload {
    pub content: String,
}

pub async fn add_message(
    State(state): State<AppState>,
    auth_user: jwt::AuthUser,
    Path(id): Path<i32>,
    Json(payload): Json<AddMessagePayload>,
) -> impl IntoResponse {
    let user = match resolve_user(&state, &auth_user).await {
        Ok(u) => u,
        Err(e) => return e.into_response(),
    };

    let task = match project_generation_task::Entity::find_by_id(id)
        .filter(project_generation_task::Column::UserId.eq(user.id))
        .one(&state.db)
        .await
    {
        Ok(Some(t)) => t,
        _ => {
            return (
                StatusCode::NOT_FOUND,
                Json(json!({"error": "任务不存在"})),
            )
                .into_response()
        }
    };

    let claw_session = match task.claw_session_id {
        Some(ref s) => s.clone(),
        None => {
            return (
                StatusCode::BAD_REQUEST,
                Json(json!({"error": "任务未初始化 claw-agent 会话"})),
            )
                .into_response()
        }
    };

    let claw = ClawAgentClient::new(state.http_client.clone(), state.claw_agent_url.clone());
    if let Err(e) = claw.add_message(&claw_session, payload.content.clone()).await {
        return (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({"error": format!("追加消息失败: {}", e)})),
        )
            .into_response();
    }

    let _ = project_task_message::ActiveModel {
        task_id: Set(id),
        role: Set("user".to_owned()),
        content: Set(payload.content),
        created_at: Set(chrono::Local::now().naive_local()),
        ..Default::default()
    }
    .insert(&state.db)
    .await;

    Json(json!({"status": "queued"})).into_response()
}

pub async fn stop_task(
    State(state): State<AppState>,
    auth_user: jwt::AuthUser,
    Path(id): Path<i32>,
) -> impl IntoResponse {
    let user = match resolve_user(&state, &auth_user).await {
        Ok(u) => u,
        Err(e) => return e.into_response(),
    };

    let task = match project_generation_task::Entity::find_by_id(id)
        .filter(project_generation_task::Column::UserId.eq(user.id))
        .one(&state.db)
        .await
    {
        Ok(Some(t)) => t,
        _ => {
            return (
                StatusCode::NOT_FOUND,
                Json(json!({"error": "任务不存在"})),
            )
                .into_response()
        }
    };

    // 通知 claw-agent 停止
    if let Some(ref session) = task.claw_session_id {
        let claw = ClawAgentClient::new(state.http_client.clone(), state.claw_agent_url.clone());
        let _ = claw.stop_task(session).await;
    }

    // 销毁 sandbox
    if let Some(ref sandbox_id) = task.sandbox_id {
        let sandbox = SandboxClient::new(state.http_client.clone(), state.sandbox_url.clone());
        let _ = sandbox.delete(sandbox_id).await;
    }

    let mut active: project_generation_task::ActiveModel = task.into();
    active.status = Set("stopped".to_owned());
    active.updated_at = Set(chrono::Local::now().naive_local());
    let _ = active.update(&state.db).await;

    Json(json!({"status": "stopped"})).into_response()
}

async fn mark_task_failed(state: &AppState, task_id: i32, reason: &str) {
    tracing::error!("任务 {} 失败: {}", task_id, reason);

    if let Ok(Some(task)) = project_generation_task::Entity::find_by_id(task_id)
        .one(&state.db)
        .await
    {
        let mut active: project_generation_task::ActiveModel = task.into();
        active.status = Set("failed".to_owned());
        active.updated_at = Set(chrono::Local::now().naive_local());
        let _ = active.update(&state.db).await;
    }

    let _ = project_task_event::ActiveModel {
        task_id: Set(task_id),
        event_type: Set("status_change".to_owned()),
        payload: Set(json!({"status": "failed", "reason": reason}).to_string()),
        created_at: Set(chrono::Local::now().naive_local()),
        ..Default::default()
    }
    .insert(&state.db)
    .await;
}

fn build_initial_prompt(amis_json: &str, extra: Option<&str>) -> String {
    let base = format!(
        "请根据以下 Amis JSON 生成一个可运行的 UniApp + Wot UI H5 项目。\n\n\
        步骤：\n\
        1. 先 `bash: ls -la` 查看工作目录\n\
        2. 分析 Amis JSON 的页面结构\n\
        3. 创建 package.json、vite.config.ts、pages.json、页面 .vue 文件\n\
        4. 使用 Wot UI 组件（wd-button、wd-form、wd-table 等）替代 Amis 组件\n\n\
        Amis JSON:\n```json\n{}\n```",
        amis_json
    );

    if let Some(extra) = extra {
        format!("{}\n\n补充要求:\n{}", base, extra)
    } else {
        base
    }
}
