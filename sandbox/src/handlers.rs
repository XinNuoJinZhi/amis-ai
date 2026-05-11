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
    /// 2026-04：由 backend 根据 template_registry 下发的 dev server 命令（可选）
    #[serde(default)]
    pub dev_command: Option<String>,
    /// 1.3 引入：由 backend 根据 template_registry 下发的 sandbox 镜像 tag（可选）；
    /// None 走 sandbox-service 启动时默认镜像。
    #[serde(default)]
    pub image: Option<String>,
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
            image: payload.image.as_deref(),
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
        dev_command: payload.dev_command.clone(),
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

use crate::dev_runner::{classify, classify_runtime_error, LogSignal};
use std::hash::{Hash, Hasher};

pub async fn dev_start(
    State(state): State<SharedState>,
    Path(id): Path<String>,
) -> impl IntoResponse {
    let (container_id, _port, dev_command) = {
        let map = state.sandboxes.read().await;
        match map.get(&id) {
            Some(sb) => (sb.container_id.clone(), sb.preview_port, sb.dev_command.clone()),
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
        // pnpm install 硬超时 180s（3 分钟），超时则 Failed 上报
        let install_timeout = std::time::Duration::from_secs(180);
        let install_fut = state_bg.docker.exec(
            &container_id,
            vec!["sh".into(), "-c".into(), "cd /workspace && pnpm install --prefer-offline 2>&1".into()],
            None,
        );
        let install_res = match tokio::time::timeout(install_timeout, install_fut).await {
            Ok(r) => r,
            Err(_) => {
                // 超时：标记失败并退出
                let mut map = state_bg.sandboxes.write().await;
                if let Some(sb) = map.get_mut(&sandbox_id) {
                    sb.dev_status = DevStatus::Failed {
                        reason: "pnpm install 超时 (>180s)。请检查网络、代理或预装 node_modules 到镜像里".to_string(),
                    };
                    sb.push_log("[sandbox] pnpm install timeout after 180s".to_string());
                }
                return;
            }
        };
        match install_res {
            Ok(r) if r.exit_code == 0 => {
                let state_probe = state_bg.clone();
                let sid = sandbox_id.clone();
                let cid = container_id.clone();
                let dev_cmd_inner = dev_command.clone();
                tokio::spawn(async move {
                    // 2026-04：dev_command 由 backend 根据 template_registry 在 create 时下发，
                    // 未指定时 fallback 到 `pnpm run dev:h5`（保持 uniapp legacy 任务不退化）。
                    let cmd = dev_cmd_inner
                        .unwrap_or_else(|| "pnpm run dev:h5".to_string());
                    let shell = format!(
                        "cd /workspace && nohup sh -c '{} > /tmp/vite.log 2>&1' &",
                        cmd.replace('\'', "'\\''")
                    );
                    let _ = state_probe
                        .docker
                        .exec(
                            &cid,
                            vec!["sh".into(), "-c".into(), shell],
                            None,
                        )
                        .await;

                    // 持续长驻轮询 /tmp/vite.log：
                    //   - 启动阶段：识别 Ready / Failed（沿用 classify）
                    //   - Ready 之后：持续扫描运行时错误（classify_runtime_error），命中即切 RuntimeError
                    //   - 沙箱被删除 / 超过 2 小时上限 → 退出任务
                    //   - 去重：同一行文本（hash）只处理一次
                    let mut seen: std::collections::HashSet<u64> = std::collections::HashSet::new();
                    let mut is_ready = false;
                    let mut startup_wait = 0u32;
                    // 2 小时 = 7200 秒，按 1 秒一次轮询
                    for _ in 0..7200u32 {
                        tokio::time::sleep(std::time::Duration::from_millis(1000)).await;

                        // 沙箱已被 delete 则退出
                        let still_exists = state_probe.sandboxes.read().await.contains_key(&sid);
                        if !still_exists {
                            break;
                        }

                        let tail = state_probe
                            .docker
                            .exec(
                                &cid,
                                vec![
                                    "sh".into(),
                                    "-c".into(),
                                    "tail -n 200 /tmp/vite.log 2>/dev/null || true".into(),
                                ],
                                None,
                            )
                            .await;
                        let Ok(r) = tail else { continue; };

                        let mut map = state_probe.sandboxes.write().await;
                        let Some(sb) = map.get_mut(&sid) else { break; };

                        for line in r.stdout.lines() {
                            let trimmed = line.trim();
                            if trimmed.is_empty() {
                                continue;
                            }
                            // 行文本 hash 去重
                            let mut h = std::collections::hash_map::DefaultHasher::new();
                            trimmed.hash(&mut h);
                            if !seen.insert(h.finish()) {
                                continue;
                            }

                            sb.push_log(line.to_string());

                            if !is_ready {
                                // 启动阶段：用 classify 判定 Ready / Failed
                                match classify(line) {
                                    LogSignal::Ready(_url) => {
                                        is_ready = true;
                                        sb.dev_status = DevStatus::Ready {
                                            url: format!("http://localhost:{}/", sb.preview_port),
                                        };
                                    }
                                    LogSignal::Failed(reason) => {
                                        sb.dev_status = DevStatus::Failed { reason };
                                    }
                                    LogSignal::Neutral => {}
                                }
                            } else {
                                // Ready 之后：只扫运行时错误，避免 classify 里的 RE_ERROR 再误判为启动 Failed
                                if let Some(reason) = classify_runtime_error(line) {
                                    let recent_logs: Vec<String> = sb
                                        .recent_logs
                                        .iter()
                                        .rev()
                                        .take(30)
                                        .cloned()
                                        .collect::<Vec<_>>()
                                        .into_iter()
                                        .rev()
                                        .collect();
                                    sb.dev_status = DevStatus::RuntimeError {
                                        reason,
                                        logs: recent_logs,
                                    };
                                }
                            }
                        }
                        // 启动阶段 Failed（非 Ready 就 Failed）后给 3 秒缓冲让调用方看到日志，然后退出循环
                        // （避免 Ready 之前的 Failed 态还继续扫 runtime 错误造成混淆）
                        if !is_ready {
                            if matches!(sb.dev_status, DevStatus::Failed { .. }) {
                                startup_wait += 1;
                                if startup_wait >= 3 {
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
                    // stderr 可能为空（pnpm 习惯把 warning 写 stdout），合并 stdout 兜底
                    let combined = if r.stderr.is_empty() { r.stdout.clone() } else { r.stderr.clone() };
                    sb.dev_status = DevStatus::Failed {
                        reason: format!(
                            "pnpm install 失败 (exit={}): {}",
                            r.exit_code,
                            combined.chars().take(2000).collect::<String>()
                        ),
                    };
                    // 把 install 的完整输出也 push 到 recent_logs，前端能看到
                    for line in combined.lines().rev().take(50).collect::<Vec<_>>().into_iter().rev() {
                        sb.push_log(line.to_string());
                    }
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
