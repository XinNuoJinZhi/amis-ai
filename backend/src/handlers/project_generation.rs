use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use sea_orm::{ActiveModelTrait, ColumnTrait, EntityTrait, QueryFilter, QueryOrder, Set};
use serde::{Deserialize, Serialize};
use serde_json::json;

use crate::entity::{
    code_sample, project_generation_task, project_task_event, project_task_message, user,
};
use crate::services::{
    claw_agent_client::ClawAgentClient,
    llm_selector::{self, LlmDecision},
    sandbox_client::SandboxClient,
};
use crate::utils::jwt;
use crate::AppState;

#[derive(Debug, Deserialize)]
pub struct CreateTaskPayload {
    pub amis_json: String,
    pub tech_stack: Option<String>,
    pub ui_library: Option<String>,
    pub extra_prompt: Option<String>,
    pub source_history_id: Option<i32>,
    pub permission_config: Option<serde_json::Value>,
    /// "manual" | "auto" | "default"；缺省为 default（读旧 model_configs）
    pub llm_mode: Option<String>,
    /// manual 模式下必填
    pub llm_provider_id: Option<i32>,
    /// manual 模式下必填
    pub llm_model_name: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct LlmPreviewPayload {
    pub amis_json: String,
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

    // 0. 先决策本次任务用哪个 LLM（manual / auto / default）
    let decision = match llm_selector::select_for_task(
        &state,
        user.id,
        &payload.amis_json,
        payload.llm_mode.as_deref(),
        payload.llm_provider_id,
        payload.llm_model_name.as_deref(),
    )
    .await
    {
        Ok(d) => d,
        Err(e) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(json!({"error": format!("LLM 选择失败: {}", e)})),
            )
                .into_response();
        }
    };

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
        llm_mode: Set(decision.mode.clone()),
        llm_provider_id: Set(Some(decision.provider_id)),
        llm_model_name: Set(Some(decision.config.model.clone())),
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

    // 2.5 把脚手架种子项目 copy 到工作目录（Agent 开始工作时就有素材）
    match copy_scaffold_to_workdir(&tech_stack, &sandbox_info.workdir).await {
        Ok(_) => {
            // 事件：底座复制完成（前端 Onboarding 进度条消费此信号）
            // payload 里带 type 字段，前端 history 回放时能直接识别
            let _ = project_task_event::ActiveModel {
                task_id: Set(task_id),
                event_type: Set("scaffold_copied".to_owned()),
                payload: Set(
                    json!({ "type": "scaffold_copied", "data": { "tech_stack": tech_stack } })
                        .to_string(),
                ),
                created_at: Set(chrono::Local::now().naive_local()),
                ..Default::default()
            }
            .insert(&state.db)
            .await;
        }
        Err(e) => {
            tracing::warn!("copy 种子项目失败（Agent 将从空目录开始）: {}", e);
            let _ = project_task_event::ActiveModel {
                task_id: Set(task_id),
                event_type: Set("scaffold_copy_failed".to_owned()),
                payload: Set(
                    json!({
                        "type": "scaffold_copy_failed",
                        "data": { "tech_stack": tech_stack, "error": format!("{}", e) }
                    })
                    .to_string(),
                ),
                created_at: Set(chrono::Local::now().naive_local()),
                ..Default::default()
            }
            .insert(&state.db)
            .await;
        }
    }

    // B.5：先做 RAG 检索，把同栈 Top-K 已审核样例拼成额外 system_prompt 段。
    // 失败/没数据 → 返回空 vec，不阻断任务创建。
    let extra_system_sections =
        fetch_rag_extra_sections(&state, &tech_stack, &payload.amis_json).await;

    // 3. 调 claw-agent-server 创建会话
    let claw = ClawAgentClient::new(state.http_client.clone(), state.claw_agent_url.clone());
    let initial_message = build_initial_prompt(&payload.amis_json, payload.extra_prompt.as_deref());

    let llm_config = decision.config.clone();
    let claw_req = crate::services::claw_agent_client::CreateTaskRequest {
        workdir: sandbox_info.workdir.clone(),
        sandbox_id: sandbox_info.id.clone(),
        initial_message,
        model: Some(llm_config.model.clone()),
        tech_stack: Some(tech_stack.clone()),
        llm_config: Some(llm_config),
        permission_config: payload.permission_config.clone(),
        extra_system_sections: if extra_system_sections.is_empty() {
            None
        } else {
            Some(extra_system_sections)
        },
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

    // 4.5 后台监控 sandbox dev_status：
    //    - ready → task.status = succeeded
    //    - failed 且 fix_attempts < 5 → 把错误日志喂给 Agent 让它修复后重新 dev_start
    //    - fix_attempts >= 5 → task.status = failed
    spawn_dev_status_watcher(
        state.clone(),
        task_id,
        sandbox_info.id.clone(),
        claw_resp.id.clone(),
    );

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

    // 5.5 审计事件：记录本次任务的 LLM 决策，供事件流/未来的 auto 算法回溯
    let _ = project_task_event::ActiveModel {
        task_id: Set(task_id),
        event_type: Set("llm_selected".to_owned()),
        payload: Set(json!({
            "mode": decision.mode,
            "provider_id": decision.provider_id,
            "provider_name": decision.provider_name,
            "model": decision.config.model,
            "protocol": decision.config.protocol,
            "capability_tier": decision.capability_tier,
            "complexity_score": decision.complexity_score,
            "reason": decision.reason,
        }).to_string()),
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

/// dev_status 监控 + 自修复闭环（含 Ready 之后的运行时错误捕获）：
/// - 看到 starting / ready：更新 task 状态，**但继续轮询**（Ready 之后要持续监听运行时错误）
/// - 看到 failed（启动阶段错误，sandbox 还没进入 ready） 且 fix_attempts < 5 → 喂日志给 Agent，Agent 修复后再次 dev_start
/// - 看到 runtime_error（sandbox 已 Ready 后新出现的 import-analysis / HMR 错误） 且 fix_attempts < 5 → 喂日志给 Agent 修复
/// - fix_attempts >= 5 → task.status = failed，退出
/// - 每 3 秒轮询一次，最多跑 30 分钟（600 次轮询，为覆盖 Ready 后的错误延长）
fn spawn_dev_status_watcher(state: AppState, task_id: i32, sandbox_id: String, claw_session_id: String) {
    tokio::spawn(async move {
        let sandbox = SandboxClient::new(state.http_client.clone(), state.sandbox_url.clone());
        let claw = crate::services::claw_agent_client::ClawAgentClient::new(
            state.http_client.clone(),
            state.claw_agent_url.clone(),
        );

        // 去重：
        //   - last_handled_failure：启动阶段的 failed 去重（配合 seen_starting 允许下一次 dev_start 触发的新 failure 被处理）
        //   - last_handled_runtime_error：Ready 之后的运行时错误去重（同一 reason 文本不再重复喂）
        let mut last_handled_failure: Option<String> = None;
        let mut seen_starting: bool = false;
        let mut last_handled_runtime_error: Option<String> = None;
        let mut marked_succeeded_once: bool = false;

        const MAX_FIX_ATTEMPTS: i32 = 5;
        const MAX_POLLS: usize = 600; // 30 分钟

        for _ in 0..MAX_POLLS {
            tokio::time::sleep(std::time::Duration::from_secs(3)).await;

            let Ok(resp) = sandbox.dev_status(&sandbox_id).await else {
                continue;
            };
            let dev_status = &resp["dev_status"];

            // dev_status 形态：
            //   - "not_started" / "starting"（字符串）
            //   - {"ready": {"url": "..."}}
            //   - {"failed": {"reason": "..."}}
            //   - {"runtime_error": {"reason": "...", "logs": [...]}}
            if dev_status == "starting" {
                seen_starting = true;
                // Agent 重新调了 dev_start，允许新一轮 runtime_error 被处理
                last_handled_runtime_error = None;
                continue;
            }

            if dev_status.get("ready").is_some() {
                // 首次进入 Ready：把 task 标记为 succeeded；但不退出循环，继续监听 runtime_error
                if !marked_succeeded_once {
                    if let Ok(Some(task)) = project_generation_task::Entity::find_by_id(task_id)
                        .one(&state.db)
                        .await
                    {
                        if task.status != "stopped" && task.status != "failed" {
                            let mut active: project_generation_task::ActiveModel = task.into();
                            active.status = Set("succeeded".to_string());
                            active.updated_at = Set(chrono::Local::now().naive_local());
                            let _ = active.update(&state.db).await;
                            tracing::info!("task {} dev ready → succeeded (continuing to watch runtime errors)", task_id);
                        } else {
                            return;
                        }
                    }
                    marked_succeeded_once = true;
                }
                continue;
            }

            if let Some(rt_obj) = dev_status.get("runtime_error") {
                let reason = rt_obj
                    .get("reason")
                    .and_then(|v| v.as_str())
                    .unwrap_or("unknown")
                    .to_string();

                // 同一 reason 文本已处理 → skip
                if last_handled_runtime_error.as_ref() == Some(&reason) {
                    continue;
                }

                let Ok(Some(task)) = project_generation_task::Entity::find_by_id(task_id)
                    .one(&state.db)
                    .await
                else {
                    return;
                };
                if task.status == "stopped" || task.status == "failed" {
                    return;
                }

                let attempts = task.fix_attempts;
                if attempts >= MAX_FIX_ATTEMPTS {
                    let mut active: project_generation_task::ActiveModel = task.into();
                    active.status = Set("failed".to_string());
                    active.updated_at = Set(chrono::Local::now().naive_local());
                    let _ = active.update(&state.db).await;
                    tracing::warn!(
                        "task {} runtime-error reached max fix attempts ({}), giving up",
                        task_id,
                        MAX_FIX_ATTEMPTS
                    );
                    return;
                }

                // 从 rt_obj.logs 拿最近日志
                let rt_logs: Vec<String> = rt_obj
                    .get("logs")
                    .and_then(|v| v.as_array())
                    .map(|arr| {
                        arr.iter()
                            .filter_map(|v| v.as_str().map(String::from))
                            .collect()
                    })
                    .unwrap_or_default();
                let log_tail = rt_logs.join("\n");

                let fix_message = format!(
                    "⚠️ Vite dev server 已启动成功，但浏览器访问时触发了**运行时错误**（第 {}/{} 次重试）。\n\n\
                     **错误信息**：{}\n\n\
                     **最近日志**：\n```\n{}\n```\n\n\
                     常见原因：\n\
                     - `import \"wot-design-uni/index.css\"` 等第三方库 CSS 路径不存在（Wot UI 样式自动注入，不要手动 import）\n\
                     - 页面里引用了不存在的 .vue 文件\n\
                     - `pages.json` 注册的 path 与实际 .vue 文件路径不匹配\n\
                     - API 请求路径或方法写错\n\n\
                     请用 read_file/edit_file/write_file 工具分析并修复，**无需再调用 dev_start**（Vite HMR 会自动热更新）。",
                    attempts + 1,
                    MAX_FIX_ATTEMPTS,
                    reason,
                    if log_tail.is_empty() { "(无日志)".into() } else { log_tail }
                );

                match claw.add_message(&claw_session_id, fix_message.clone()).await {
                    Ok(_) => {
                        tracing::info!(
                            "task {} runtime-error fix attempt {}/{} dispatched",
                            task_id,
                            attempts + 1,
                            MAX_FIX_ATTEMPTS
                        );
                    }
                    Err(e) => {
                        tracing::warn!(
                            "task {} failed to dispatch runtime-error fix: {}",
                            task_id,
                            e
                        );
                        continue;
                    }
                }

                // task.status 从 succeeded 降级回 running（表示"还在修"），fix_attempts++
                let mut active: project_generation_task::ActiveModel = task.into();
                active.status = Set("running".to_string());
                active.fix_attempts = Set(attempts + 1);
                active.updated_at = Set(chrono::Local::now().naive_local());
                let _ = active.update(&state.db).await;
                marked_succeeded_once = false; // 允许修复成功后重新标记 succeeded

                let _ = project_task_message::ActiveModel {
                    task_id: Set(task_id),
                    role: Set("system".to_owned()),
                    content: Set(fix_message),
                    created_at: Set(chrono::Local::now().naive_local()),
                    ..Default::default()
                }
                .insert(&state.db)
                .await;

                last_handled_runtime_error = Some(reason);
                continue;
            }

            if let Some(fail_obj) = dev_status.get("failed") {
                let reason = fail_obj
                    .get("reason")
                    .and_then(|v| v.as_str())
                    .unwrap_or("unknown")
                    .to_string();

                // 如果这个 failure 已经处理过且期间没看到新的 starting，跳过（sandbox 的 dev_status 会保持 Failed 直到下次 dev_start）
                if last_handled_failure.as_ref() == Some(&reason) && !seen_starting {
                    continue;
                }

                // 查 task 当前状态
                let Ok(Some(task)) = project_generation_task::Entity::find_by_id(task_id)
                    .one(&state.db)
                    .await
                else {
                    return;
                };
                if task.status == "stopped" || task.status == "failed" {
                    return;
                }

                let attempts = task.fix_attempts;
                if attempts >= MAX_FIX_ATTEMPTS {
                    // 到达上限：标记为 failed
                    let mut active: project_generation_task::ActiveModel = task.into();
                    active.status = Set("failed".to_string());
                    active.updated_at = Set(chrono::Local::now().naive_local());
                    let _ = active.update(&state.db).await;
                    tracing::warn!(
                        "task {} reached max fix attempts ({}), giving up",
                        task_id,
                        MAX_FIX_ATTEMPTS
                    );
                    return;
                }

                // 构造修复提示消息：带上失败原因 + 最近日志
                let recent_logs: Vec<String> = resp
                    .get("recent_logs")
                    .and_then(|v| v.as_array())
                    .map(|arr| {
                        arr.iter()
                            .filter_map(|v| v.as_str().map(String::from))
                            .collect()
                    })
                    .unwrap_or_default();
                let log_tail = recent_logs
                    .iter()
                    .rev()
                    .take(40)
                    .rev()
                    .cloned()
                    .collect::<Vec<_>>()
                    .join("\n");

                let fix_message = format!(
                    "⚠️ Vite dev server 启动失败（第 {}/{} 次重试）。\n\n\
                     **失败原因**：{}\n\n\
                     **最近日志**（tail 40 行）：\n```\n{}\n```\n\n\
                     请分析上述错误（常见原因：缺依赖、语法错误、路径写错、pages.json 配置错），\
                     用 read_file/edit_file/write_file 工具修复代码，然后**再次调用 dev_start 工具**重启 Vite。",
                    attempts + 1,
                    MAX_FIX_ATTEMPTS,
                    reason,
                    if log_tail.is_empty() { "(无日志)".into() } else { log_tail }
                );

                // 推给 Agent
                match claw.add_message(&claw_session_id, fix_message.clone()).await {
                    Ok(_) => {
                        tracing::info!(
                            "task {} fix attempt {}/{} dispatched to agent",
                            task_id,
                            attempts + 1,
                            MAX_FIX_ATTEMPTS
                        );
                    }
                    Err(e) => {
                        tracing::warn!("task {} failed to dispatch fix message: {}", task_id, e);
                        continue;
                    }
                }

                // 更新 fix_attempts
                let mut active: project_generation_task::ActiveModel = task.into();
                active.fix_attempts = Set(attempts + 1);
                active.updated_at = Set(chrono::Local::now().naive_local());
                let _ = active.update(&state.db).await;

                // 写入 task_message 作为 system 消息（方便前端看到修复轨迹）
                let _ = project_task_message::ActiveModel {
                    task_id: Set(task_id),
                    role: Set("system".to_owned()),
                    content: Set(fix_message),
                    created_at: Set(chrono::Local::now().naive_local()),
                    ..Default::default()
                }
                .insert(&state.db)
                .await;

                // 记录处理状态，重置 seen_starting（等下次 Agent 调 dev_start 产生 starting 后才会处理下一个 failure）
                last_handled_failure = Some(reason);
                seen_starting = false;
            }
        }

        tracing::info!("task {} dev_status watcher timeout (30 min)", task_id);
    });
}

/// 把指定 tech_stack 的脚手架种子项目复制到 workdir（让 Agent 启动时有素材可改）
async fn copy_scaffold_to_workdir(tech_stack: &str, workdir: &str) -> anyhow::Result<()> {
    let scaffold_root = std::env::var("SCAFFOLD_ROOT")
        .unwrap_or_else(|_| "/home/karl/Working/TianXing/amis-ai/scaffolds".to_string());
    let source = format!("{}/{}-template", scaffold_root, tech_stack);

    if !std::path::Path::new(&source).exists() {
        return Err(anyhow::anyhow!("scaffold not found: {}", source));
    }

    // 用 cp -r 把种子项目内容（不含 node_modules）复制到 workdir
    // 排除 node_modules / .git（体积大且没用）
    let output = tokio::process::Command::new("sh")
        .arg("-c")
        .arg(format!(
            "cp -r {}/. {}/ && rm -rf {}/node_modules {}/.git 2>/dev/null; true",
            source, workdir, workdir, workdir
        ))
        .output()
        .await?;

    if !output.status.success() {
        return Err(anyhow::anyhow!(
            "cp failed: {}",
            String::from_utf8_lossy(&output.stderr)
        ));
    }
    tracing::info!("scaffold copied to {}", workdir);
    Ok(())
}

/// POST /api/projects/tasks/llm-preview —— 前端 auto 模式下预览将选中的 provider/model
pub async fn llm_preview(
    State(state): State<AppState>,
    auth_user: jwt::AuthUser,
    Json(payload): Json<LlmPreviewPayload>,
) -> impl IntoResponse {
    let user = match resolve_user(&state, &auth_user).await {
        Ok(u) => u,
        Err(e) => return e.into_response(),
    };

    match llm_selector::preview_auto(&state, user.id, &payload.amis_json).await {
        Ok(d) => preview_to_json(&d).into_response(),
        Err(e) => (
            StatusCode::BAD_REQUEST,
            Json(json!({"error": format!("预览失败: {}", e)})),
        )
            .into_response(),
    }
}

fn preview_to_json(d: &LlmDecision) -> Json<serde_json::Value> {
    Json(json!({
        "provider_id": d.provider_id,
        "provider_name": d.provider_name,
        "model": d.config.model,
        "capability_tier": d.capability_tier,
        "complexity_score": d.complexity_score,
        "reason": d.reason,
    }))
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
        "请根据以下 Amis JSON 生成 UniApp + Wot UI H5 项目的**业务页面代码**。\n\n\
        ⚠️ **工作目录已预置了完整的种子项目**（package.json / pnpm-lock.yaml / vite.config.ts / tsconfig.json / \
        .npmrc / index.html / src/App.vue / src/main.ts / src/pages.json 等都已就绪）。\n\
        你只能**新增或修改** `src/pages/**`、`src/api/**`、`src/components/**`、`src/utils/**` 和 `src/pages.json`。\n\
        ❌ 严禁重新创建或修改底座文件（package.json / vite.config.ts / tsconfig.json / .npmrc / src/main.ts / src/App.vue）——\
        这些文件已被锁定，write_file / edit_file 会被拒绝。\n\
        ❌ 严禁 `import \"wot-design-uni/index.css\"` 或任何第三方库的 CSS——Wot UI 样式由 easycom 自动注入。\n\n\
        📂 **路径规则（极其重要，踩错必报权限错误）**：\n\
        - `bash` 工具在**容器内**执行，使用容器路径 `/workspace/...`，例如 `bash: ls /workspace/src`\n\
        - `write_file` / `edit_file` / `read_file` / `glob_search` / `grep_search` 工具在**宿主机**执行，请一律用**相对路径**，例如 `src/pages/foo/foo.vue`\n\
        - ❌ 不要给文件工具传 `/workspace/src/...` 或 `/var/amis-ai/workdirs/...` 这类绝对路径\n\
        - ✅ 正确示例：`write_file path=\"src/pages/user/user.vue\"` 或 `read_file path=\"src/pages.json\"`\n\n\
        推荐步骤：\n\
        1. 先 `bash: ls -la /workspace` 和 `bash: cat /workspace/src/pages.json` 核对种子项目当前状态\n\
        2. 分析 Amis JSON 的页面结构，规划要新增的页面 .vue 文件\n\
        3. `write_file` 创建 `src/pages/{{name}}/{{name}}.vue`（相对路径！）用 Wot UI 组件（wd-button / wd-form / wd-table 等）实现\n\
        4. `edit_file` 更新 `src/pages.json`（相对路径！）注册新路由\n\
        5. 所有页面完工后调用 `dev_start` 工具启动 Vite（不要 bash 里跑 `pnpm run dev:h5`）\n\n\
        Amis JSON:\n```json\n{}\n```",
        amis_json
    );

    if let Some(extra) = extra {
        format!("{}\n\n补充要求:\n{}", base, extra)
    } else {
        base
    }
}

// ─────────────────────── B.5：RAG 检索辅助 ───────────────────────

/// 调 Python agent 的 `/internal/search-code-samples`，把同栈 Top-K 已审核样例
/// 拼成一个 markdown section（追加到 system_prompt）。
///
/// 失败/超时/没数据 → 返回空 vec，不阻断任务创建。
/// 当前 top_k=3、only_approved=true、increment_hits=true（生产检索 → 累加 hit_count）。
async fn fetch_rag_extra_sections(
    state: &crate::AppState,
    tech_stack: &str,
    amis_json: &str,
) -> Vec<String> {
    let agent_url =
        std::env::var("AGENT_URL").unwrap_or_else(|_| "http://localhost:8000".to_string());
    let internal_key = std::env::var("INTERNAL_API_KEY").unwrap_or_default();

    // amis_json 太长会拖慢向量化；摘要用前 2KB 就够语义检索了
    let query_text: String = amis_json.chars().take(2000).collect();

    let resp = match state
        .http_client
        .post(format!("{}/internal/search-code-samples", agent_url))
        .header("X-Internal-Key", &internal_key)
        .json(&json!({
            "tech_stack": tech_stack,
            "query_text": query_text,
            "top_k": 3,
            "only_approved": true,
            "increment_hits": true,
        }))
        .timeout(std::time::Duration::from_secs(15))
        .send()
        .await
    {
        Ok(r) if r.status().is_success() => r,
        Ok(r) => {
            tracing::warn!("RAG search 返回非 2xx: {}", r.status());
            return Vec::new();
        }
        Err(e) => {
            tracing::warn!("RAG search 调用失败: {} （将不注入样例）", e);
            return Vec::new();
        }
    };

    let body: serde_json::Value = match resp.json().await {
        Ok(v) => v,
        Err(e) => {
            tracing::warn!("RAG search 响应解析失败: {}", e);
            return Vec::new();
        }
    };

    let results = match body.get("results").and_then(|v| v.as_array()) {
        Some(a) if !a.is_empty() => a,
        _ => {
            tracing::info!(
                "RAG search 命中 0 条 (tech_stack={}); system_prompt 不注入样例段",
                tech_stack
            );
            return Vec::new();
        }
    };

    let mut buf = String::new();
    buf.push_str("# RAG 参考样例（Top-3，仅供借鉴，不强制）\n\n");
    buf.push_str(
        "下面是当前技术栈下与本任务最相似的几条**已采纳**样例。\
         可以参考它们的写法（组件用法、路由组织、API 适配），\
         但不要照搬——需求不一样时优先按用户的 Amis JSON 来生成。\n\n",
    );
    for (i, r) in results.iter().enumerate() {
        let id = r.get("id").and_then(|v| v.as_i64()).unwrap_or(-1);
        let team = r.get("source_team").and_then(|v| v.as_str()).unwrap_or("?");
        let amis_summary = r
            .get("amis_json_summary")
            .and_then(|v| v.as_str())
            .unwrap_or("");
        let code_summary = r
            .get("code_summary")
            .and_then(|v| v.as_str())
            .unwrap_or("");
        let similarity = r
            .get("similarity")
            .and_then(|v| v.as_f64())
            .unwrap_or(0.0);
        let full_amis = r
            .get("full_amis_json")
            .and_then(|v| v.as_str())
            .unwrap_or("");
        let full_code = r.get("full_code").and_then(|v| v.as_str()).unwrap_or("");

        buf.push_str(&format!(
            "## 样例 {}（#{}, source: {}, similarity={:.3}）\n\n",
            i + 1,
            id,
            team,
            similarity
        ));
        if !amis_summary.is_empty() {
            buf.push_str(&format!("**Amis 摘要**：{}\n\n", amis_summary));
        }
        if !code_summary.is_empty() {
            buf.push_str(&format!("**代码摘要**：{}\n\n", code_summary));
        }
        // 完整内容用 fenced 代码块；摘要不全时也提供原 JSON / 代码作为参考
        buf.push_str("**完整 Amis JSON**：\n\n```json\n");
        buf.push_str(full_amis);
        buf.push_str("\n```\n\n");
        buf.push_str("**生成代码**：\n\n");
        buf.push_str(full_code);
        buf.push_str("\n\n");
    }

    let ids: Vec<i64> = results
        .iter()
        .filter_map(|r| r.get("id").and_then(|v| v.as_i64()))
        .collect();
    tracing::info!(
        "RAG Top-{} hit (tech_stack={}): ids={:?}",
        results.len(),
        tech_stack,
        ids
    );
    vec![buf]
}

// ─────────────────────── B.7：采纳→入库 ───────────────────────

#[derive(Debug, Deserialize)]
pub struct AdoptBody {
    /// 用户对本任务的"它做了什么"摘要（参与 RAG 向量化）。可空——backend 会用 amis_json 前缀兜底。
    pub amis_json_summary: Option<String>,
    /// 用户对生成代码做了什么的人话摘要（可选）
    pub code_summary: Option<String>,
    /// 完整代码（多文件拼成 markdown fenced）。可空——backend 自动从 sandbox 收集。
    pub full_code: Option<String>,
    /// 来源团队（默认 amis-ai）
    pub source_team: Option<String>,
}

/// 限制收集的文件总大小（避免 prompt 爆炸）：256 KB
const ADOPT_MAX_TOTAL_BYTES: usize = 256 * 1024;
/// 单文件读取上限（超过 → 截断 + 标注）
const ADOPT_MAX_FILE_BYTES: usize = 64 * 1024;
/// 收集的目录前缀（白名单）
const ADOPT_SCAN_DIRS: &[&str] = &["src/pages", "src/api", "src/components", "src/utils"];
/// 单独收集的文件
const ADOPT_SCAN_FILES: &[&str] = &["src/pages.json"];

/// `POST /api/projects/tasks/:id/adopt` —— 把任务的代码沉淀回 code_sample 表。
///
/// 流程：
/// 1. JWT 校验 + 任务归属
/// 2. 读 system_settings.adopt_default_status（默认 pending；admin 可在系统配置改成 approved）
/// 3. 收集代码：优先用 body.full_code；没传则自动从 sandbox 读 src/ 下文件
/// 4. INSERT code_samples 一行（含 amis_json + 收集的代码）
/// 5. 异步调 Python /internal/index-code-sample 向量化
/// 6. 标记任务 adopted_at
pub async fn adopt_task(
    State(state): State<AppState>,
    auth_user: jwt::AuthUser,
    Path(task_id): Path<i32>,
    Json(body): Json<AdoptBody>,
) -> impl IntoResponse {
    // 1. 任务归属校验
    let current = match user::Entity::find()
        .filter(user::Column::Username.eq(&auth_user.username))
        .one(&state.db)
        .await
    {
        Ok(Some(u)) => u,
        Ok(None) => {
            return (
                StatusCode::UNAUTHORIZED,
                Json(json!({"error": "用户不存在"})),
            )
                .into_response()
        }
        Err(e) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({"error": format!("DB error: {e}")})),
            )
                .into_response()
        }
    };
    let task = match project_generation_task::Entity::find_by_id(task_id)
        .one(&state.db)
        .await
    {
        Ok(Some(t)) => t,
        Ok(None) => {
            return (StatusCode::NOT_FOUND, Json(json!({"error": "任务不存在"}))).into_response()
        }
        Err(e) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({"error": format!("DB error: {e}")})),
            )
                .into_response()
        }
    };
    if task.user_id != current.id {
        return (StatusCode::FORBIDDEN, Json(json!({"error": "无权采纳他人任务"}))).into_response();
    }

    // 2. 读默认状态（D3 决策：默认 pending；管理员可在系统配置改 approved）
    let default_status =
        crate::handlers::system_settings::read_value_or(&state, "adopt_default_status", "pending")
            .await;
    let status = if matches!(
        default_status.as_str(),
        "pending" | "approved" | "rejected"
    ) {
        default_status
    } else {
        "pending".to_string()
    };

    // 3. 收集代码
    let (full_code, file_count, sandbox_warn) =
        if let Some(code) = body.full_code.as_ref().filter(|s| !s.trim().is_empty()) {
            (code.clone(), 0, None)
        } else if let Some(sandbox_id) = task.sandbox_id.as_ref() {
            match collect_code_from_sandbox(&state, sandbox_id).await {
                Ok((code, n)) => (code, n, None),
                Err(e) => (
                    String::new(),
                    0,
                    Some(format!(
                        "自动收集代码失败（{}）。请手动在 body.full_code 提供代码。",
                        e
                    )),
                ),
            }
        } else {
            (
                String::new(),
                0,
                Some("任务无 sandbox_id 且未提供 full_code，无法采纳".to_string()),
            )
        };

    if full_code.trim().is_empty() {
        return (
            StatusCode::BAD_REQUEST,
            Json(json!({
                "error": sandbox_warn.unwrap_or_else(|| "无可入库代码".to_string()),
            })),
        )
            .into_response();
    }

    // 4. INSERT code_sample
    let now = chrono::Local::now().naive_local();
    let amis_summary = body.amis_json_summary.clone().or_else(|| {
        // 兜底：用 amis_json 前 200 字
        Some(task.amis_json.chars().take(200).collect())
    });
    let active = code_sample::ActiveModel {
        tech_stack: Set(task.tech_stack.clone()),
        source_team: Set(body.source_team.clone().unwrap_or_else(|| "amis-ai".to_string())),
        amis_json_summary: Set(amis_summary),
        code_summary: Set(body.code_summary.clone()),
        full_amis_json: Set(task.amis_json.clone()),
        full_code: Set(full_code.clone()),
        status: Set(status.clone()),
        hit_count: Set(0),
        source_task_id: Set(Some(task_id)),
        created_at: Set(now),
        updated_at: Set(now),
        ..Default::default()
    };
    let inserted = match active.insert(&state.db).await {
        Ok(m) => m,
        Err(e) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({"error": format!("入库失败: {e}")})),
            )
                .into_response()
        }
    };

    // 5. 异步向量化
    let summary_for_vec = inserted
        .amis_json_summary
        .clone()
        .unwrap_or_else(|| inserted.full_amis_json.chars().take(1000).collect());
    spawn_vectorize_for_adopt(&state, inserted.id, summary_for_vec);

    // 6. 标记 adopted_at
    let mut t_active: project_generation_task::ActiveModel = task.into();
    t_active.adopted_at = Set(Some(now));
    let _ = t_active.update(&state.db).await;

    Json(json!({
        "ok": true,
        "sample_id": inserted.id,
        "status": status,
        "file_count": file_count,
        "sandbox_warn": sandbox_warn,
        "notice": format!(
            "已入库（status={status}）。{}",
            if status == "approved" {
                "立即参与下次任务的检索召回"
            } else {
                "等管理员在「知识库 → RAG 样例库」审核通过才进入飞轮"
            }
        ),
    }))
    .into_response()
}

/// 从 sandbox 收集 src/ 下的关键代码文件，拼成 markdown fenced 长文本。
async fn collect_code_from_sandbox(
    state: &AppState,
    sandbox_id: &str,
) -> anyhow::Result<(String, usize)> {
    let sandbox = SandboxClient::new(state.http_client.clone(), state.sandbox_url.clone());
    let mut buf = String::new();
    let mut count = 0usize;
    let mut total_bytes = 0usize;

    // 1) 单独的关键文件（pages.json 等）
    for path in ADOPT_SCAN_FILES {
        if total_bytes >= ADOPT_MAX_TOTAL_BYTES {
            break;
        }
        if let Ok(json) = sandbox.fs_read(sandbox_id, path).await {
            if let Some(content) = json.get("content").and_then(|v| v.as_str()) {
                let snippet: String = content.chars().take(ADOPT_MAX_FILE_BYTES).collect();
                let lang = lang_for_file(path);
                buf.push_str(&format!("## {path}\n\n```{lang}\n{snippet}\n```\n\n"));
                total_bytes += snippet.len();
                count += 1;
            }
        }
    }

    // 2) 目录递归（depth 4 已经够覆盖 src/pages/{name}/index.vue）
    let tree_root = sandbox.fs_tree(sandbox_id, Some(4)).await?;
    let mut files: Vec<String> = Vec::new();
    walk_tree_collect_files(&tree_root, "", &mut files);
    // 仅保留白名单目录里的文件
    files.retain(|p| {
        ADOPT_SCAN_DIRS
            .iter()
            .any(|prefix| p.starts_with(prefix))
            && (p.ends_with(".vue")
                || p.ends_with(".ts")
                || p.ends_with(".js")
                || p.ends_with(".css")
                || p.ends_with(".scss")
                || p.ends_with(".json"))
    });
    files.sort();
    for path in files {
        if total_bytes >= ADOPT_MAX_TOTAL_BYTES {
            buf.push_str("\n\n_(后续文件超过 256KB 总量上限被截断)_\n");
            break;
        }
        if let Ok(json) = sandbox.fs_read(sandbox_id, &path).await {
            if let Some(content) = json.get("content").and_then(|v| v.as_str()) {
                let snippet: String = content.chars().take(ADOPT_MAX_FILE_BYTES).collect();
                let lang = lang_for_file(&path);
                buf.push_str(&format!("## {path}\n\n```{lang}\n{snippet}\n```\n\n"));
                total_bytes += snippet.len();
                count += 1;
            }
        }
    }
    Ok((buf, count))
}

fn lang_for_file(path: &str) -> &'static str {
    if path.ends_with(".vue") {
        "vue"
    } else if path.ends_with(".ts") {
        "ts"
    } else if path.ends_with(".js") {
        "js"
    } else if path.ends_with(".css") {
        "css"
    } else if path.ends_with(".scss") {
        "scss"
    } else if path.ends_with(".json") {
        "json"
    } else {
        ""
    }
}

/// 递归遍历 fs_tree 输出，收集所有 type=file 节点的 path（相对 sandbox workdir）
fn walk_tree_collect_files(
    node: &serde_json::Value,
    base: &str,
    out: &mut Vec<String>,
) {
    if let Some(arr) = node.as_array() {
        for n in arr {
            walk_tree_collect_files(n, base, out);
        }
        return;
    }
    let name = node.get("name").and_then(|v| v.as_str()).unwrap_or("");
    let ty = node.get("type").and_then(|v| v.as_str()).unwrap_or("");
    let path = if base.is_empty() {
        name.to_string()
    } else {
        format!("{}/{}", base, name)
    };
    if ty == "file" {
        out.push(path);
    } else if ty == "dir" {
        if let Some(children) = node.get("children") {
            walk_tree_collect_files(children, &path, out);
        }
    }
}

fn spawn_vectorize_for_adopt(state: &AppState, sample_id: i32, summary_text: String) {
    let agent_url =
        std::env::var("AGENT_URL").unwrap_or_else(|_| "http://localhost:8000".to_string());
    let internal_key = std::env::var("INTERNAL_API_KEY").unwrap_or_default();
    let http_client = state.http_client.clone();
    tokio::spawn(async move {
        let _ = http_client
            .post(format!("{}/internal/index-code-sample", agent_url))
            .header("X-Internal-Key", &internal_key)
            .json(&json!({
                "sample_id": sample_id,
                "summary_text": summary_text,
            }))
            .timeout(std::time::Duration::from_secs(30))
            .send()
            .await;
    });
}
