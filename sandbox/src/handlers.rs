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

#[derive(Debug, Deserialize)]
pub struct ExecRequest {
    pub cmd: Vec<String>,
    pub cwd: Option<String>,
}

pub async fn exec_command(
    State(state): State<SharedState>,
    Path(id): Path<String>,
    Json(payload): Json<ExecRequest>,
) -> impl IntoResponse {
    let container_id = {
        let map = state.sandboxes.read().await;
        match map.get(&id) {
            Some(sb) => sb.container_id.clone(),
            None => {
                return (StatusCode::NOT_FOUND, Json(json!({"error": "沙箱不存在"})))
                    .into_response();
            }
        }
    };

    match state.docker.exec(&container_id, payload.cmd, payload.cwd).await {
        Ok(res) => Json(res).into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({"error": format!("exec 失败: {e}")})),
        )
            .into_response(),
    }
}

use crate::dev_runner::{classify, LogSignal};

pub async fn dev_start(
    State(state): State<SharedState>,
    Path(id): Path<String>,
) -> impl IntoResponse {
    let (container_id, _port) = {
        let map = state.sandboxes.read().await;
        match map.get(&id) {
            Some(sb) => (sb.container_id.clone(), sb.preview_port),
            None => {
                return (StatusCode::NOT_FOUND, Json(json!({"error": "沙箱不存在"})))
                    .into_response();
            }
        }
    };

    // 标记为 starting
    {
        let mut map = state.sandboxes.write().await;
        if let Some(sb) = map.get_mut(&id) {
            sb.dev_status = DevStatus::Starting;
            sb.recent_logs.clear();
        }
    }

    // 后台任务：跑 pnpm install && pnpm run dev:h5
    let state_bg = state.clone();
    let sandbox_id = id.clone();
    tokio::spawn(async move {
        let install_res = state_bg
            .docker
            .exec(
                &container_id,
                vec!["sh".into(), "-c".into(), "cd /workspace && pnpm install --prefer-offline 2>&1".into()],
                None,
            )
            .await;
        match install_res {
            Ok(r) if r.exit_code == 0 => {
                let state_probe = state_bg.clone();
                let sid = sandbox_id.clone();
                let cid = container_id.clone();
                tokio::spawn(async move {
                    // nohup 起 vite，重定向日志到文件
                    let _ = state_probe
                        .docker
                        .exec(
                            &cid,
                            vec![
                                "sh".into(),
                                "-c".into(),
                                "cd /workspace && nohup sh -c 'pnpm run dev:h5 --host 0.0.0.0 --port 5173 > /tmp/vite.log 2>&1' &".into(),
                            ],
                            None,
                        )
                        .await;

                    // 轮询 /tmp/vite.log
                    for _ in 0..120 {
                        tokio::time::sleep(std::time::Duration::from_millis(1000)).await;
                        let tail = state_probe
                            .docker
                            .exec(
                                &cid,
                                vec!["sh".into(), "-c".into(), "tail -n 50 /tmp/vite.log 2>/dev/null || true".into()],
                                None,
                            )
                            .await;
                        if let Ok(r) = tail {
                            let mut map = state_probe.sandboxes.write().await;
                            if let Some(sb) = map.get_mut(&sid) {
                                for line in r.stdout.lines() {
                                    sb.push_log(line.to_string());
                                    match classify(line) {
                                        LogSignal::Ready(_url) => {
                                            sb.dev_status = DevStatus::Ready {
                                                url: format!("http://localhost:{}/", sb.preview_port),
                                            };
                                        }
                                        LogSignal::Failed(reason) => {
                                            sb.dev_status = DevStatus::Failed { reason };
                                        }
                                        LogSignal::Neutral => {}
                                    }
                                }
                                if matches!(sb.dev_status, DevStatus::Ready { .. } | DevStatus::Failed { .. }) {
                                    break;
                                }
                            }
                        }
                    }
                });
            }
            Ok(r) => {
                let mut map = state_bg.sandboxes.write().await;
                if let Some(sb) = map.get_mut(&sandbox_id) {
                    sb.dev_status = DevStatus::Failed {
                        reason: format!("pnpm install 失败 (exit={}): {}", r.exit_code, r.stderr.chars().take(500).collect::<String>()),
                    };
                }
            }
            Err(e) => {
                let mut map = state_bg.sandboxes.write().await;
                if let Some(sb) = map.get_mut(&sandbox_id) {
                    sb.dev_status = DevStatus::Failed {
                        reason: format!("pnpm install exec 错误: {e}"),
                    };
                }
            }
        }
    });

    Json(json!({"message": "已触发 dev-start", "sandbox_id": id})).into_response()
}

pub async fn dev_status(
    State(state): State<SharedState>,
    Path(id): Path<String>,
) -> impl IntoResponse {
    let map = state.sandboxes.read().await;
    match map.get(&id) {
        Some(sb) => Json(json!({
            "dev_status": sb.dev_status,
            "recent_logs": sb.recent_logs,
            "preview_port": sb.preview_port,
        }))
        .into_response(),
        None => (StatusCode::NOT_FOUND, Json(json!({"error": "沙箱不存在"}))).into_response(),
    }
}
