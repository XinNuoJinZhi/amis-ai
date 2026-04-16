use crate::docker::CreateOpts;
use crate::state::{DevStatus, Sandbox, SharedState};
use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use serde::Deserialize;
use serde_json::json;
use uuid::Uuid;

#[derive(Debug, Deserialize)]
pub struct CreateSandboxRequest {
    pub task_id: String,
}

pub async fn create_sandbox(
    State(state): State<SharedState>,
    Json(payload): Json<CreateSandboxRequest>,
) -> impl IntoResponse {
    let port = match state.port_pool.allocate() {
        Ok(p) => p,
        Err(_) => {
            return (
                StatusCode::TOO_MANY_REQUESTS,
                Json(json!({"error": "端口池已耗尽，请稍后"})),
            )
                .into_response()
        }
    };

    let workdir = format!("{}/{}", state.workdir_root, payload.task_id);
    // 保证宿主机工作目录存在
    if let Err(e) = tokio::fs::create_dir_all(&workdir).await {
        let _ = state.port_pool.release(port);
        return (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({"error": format!("创建工作目录失败: {e}")})),
        )
            .into_response();
    }

    let container_id = match state
        .docker
        .create_and_start(CreateOpts {
            task_id: &payload.task_id,
            host_workdir: &workdir,
            preview_port: port,
        })
        .await
    {
        Ok(id) => id,
        Err(e) => {
            let _ = state.port_pool.release(port);
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({"error": format!("启动容器失败: {e}")})),
            )
                .into_response();
        }
    };

    let sb = Sandbox {
        id: Uuid::new_v4().to_string(),
        task_id: payload.task_id.clone(),
        container_id,
        preview_port: port,
        workdir,
        dev_status: DevStatus::NotStarted,
        recent_logs: vec![],
        created_at: chrono::Utc::now(),
    };

    let sandbox_id = sb.id.clone();
    state.sandboxes.write().await.insert(sandbox_id.clone(), sb.clone());

    (StatusCode::CREATED, Json(sb)).into_response()
}

pub async fn delete_sandbox(
    State(state): State<SharedState>,
    Path(id): Path<String>,
) -> impl IntoResponse {
    let sb = {
        let mut map = state.sandboxes.write().await;
        map.remove(&id)
    };

    let sb = match sb {
        Some(s) => s,
        None => {
            return (StatusCode::NOT_FOUND, Json(json!({"error": "沙箱不存在"})))
                .into_response();
        }
    };

    if let Err(e) = state.docker.remove(&sb.container_id).await {
        tracing::warn!("删除容器失败（忽略并继续回收端口）: {}", e);
    }
    let _ = state.port_pool.release(sb.preview_port);

    Json(json!({"message": "已销毁", "sandbox_id": id})).into_response()
}
