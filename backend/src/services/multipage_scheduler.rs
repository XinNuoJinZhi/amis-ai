//! 多页任务调度器：5 种策略统一入口
//!
//! - unified：1 个 claw-agent session 跑全部 N 页
//! - isolated + r1_skeleton：骨架→各页→收尾 三阶段
//! - isolated + r2_prompt：N 页并发，全局 prompt 注入
//! - isolated + r3_refactor：N 页并发→重构 session
//! - isolated + r4_none：纯 N 页并发 baseline

use crate::entity::{project_generation_task, project_task_event, project_task_page};
use crate::services::claw_agent_client::{ClawAgentClient, CreateTaskRequest};
use crate::services::llm_selector;
use crate::AppState;
use chrono::Utc;
use sea_orm::{ActiveModelTrait, ColumnTrait, EntityTrait, QueryFilter, QueryOrder, Set};
use std::sync::Arc;
use tokio::sync::Semaphore;
use tokio::task::JoinSet;

#[derive(Debug)]
pub enum SchedulerError {
    Db(sea_orm::DbErr),
    ClawAgent(String),
    Sandbox(String),
    InvalidStrategy(String),
}

impl std::fmt::Display for SchedulerError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Db(e) => write!(f, "DB 错误：{e}"),
            Self::ClawAgent(s) => write!(f, "claw-agent 错误：{s}"),
            Self::Sandbox(s) => write!(f, "sandbox 错误：{s}"),
            Self::InvalidStrategy(s) => write!(f, "策略错误：{s}"),
        }
    }
}

impl std::error::Error for SchedulerError {}

pub type SchedulerResult<T> = Result<T, SchedulerError>;

/// 调度器入口：按 task 的 execution_strategy + reuse_strategy 分派到对应实现
pub async fn dispatch(
    state: &AppState,
    task_id: i32,
) -> SchedulerResult<()> {
    let task = project_generation_task::Entity::find_by_id(task_id)
        .one(&state.db)
        .await
        .map_err(SchedulerError::Db)?
        .ok_or_else(|| SchedulerError::InvalidStrategy(format!("task {task_id} 不存在")))?;

    let pages = project_task_page::Entity::find()
        .filter(project_task_page::Column::TaskId.eq(task_id))
        .order_by_asc(project_task_page::Column::PageIdx)
        .all(&state.db)
        .await
        .map_err(SchedulerError::Db)?;

    if pages.is_empty() {
        // 单页旧路径，调度器跳过（让现有 single-page 逻辑处理）
        return Ok(());
    }

    match task.execution_strategy.as_str() {
        "unified" => run_unified(state, &task, &pages).await,
        "isolated" => match task.reuse_strategy.as_deref() {
            Some("r1_skeleton") => run_r1_skeleton(state, &task, &pages).await,
            Some("r2_prompt") => run_r2_prompt(state, &task, &pages).await,
            Some("r3_refactor") => run_r3_refactor(state, &task, &pages).await,
            Some("r4_none") | None => run_r4_baseline(state, &task, &pages).await,
            Some(other) => Err(SchedulerError::InvalidStrategy(format!(
                "未知 reuse_strategy: {other}"
            ))),
        },
        other => Err(SchedulerError::InvalidStrategy(format!(
            "未知 execution_strategy: {other}"
        ))),
    }
}

// ─── 5 个策略 stub（每个在后续 Task 里替换为真实实现）

async fn run_unified(
    _state: &AppState,
    _task: &project_generation_task::Model,
    _pages: &[project_task_page::Model],
) -> SchedulerResult<()> {
    Err(SchedulerError::InvalidStrategy(
        "unified 待 W5 实现".to_string(),
    ))
}

async fn run_r1_skeleton(
    _state: &AppState,
    _task: &project_generation_task::Model,
    _pages: &[project_task_page::Model],
) -> SchedulerResult<()> {
    Err(SchedulerError::InvalidStrategy(
        "r1_skeleton 待 W4 实现".to_string(),
    ))
}

async fn run_r2_prompt(
    _state: &AppState,
    _task: &project_generation_task::Model,
    _pages: &[project_task_page::Model],
) -> SchedulerResult<()> {
    Err(SchedulerError::InvalidStrategy(
        "r2_prompt 待 W3 实现".to_string(),
    ))
}

async fn run_r3_refactor(
    _state: &AppState,
    _task: &project_generation_task::Model,
    _pages: &[project_task_page::Model],
) -> SchedulerResult<()> {
    Err(SchedulerError::InvalidStrategy(
        "r3_refactor 待 W5 实现".to_string(),
    ))
}

async fn run_r4_baseline(
    state: &AppState,
    task: &project_generation_task::Model,
    pages: &[project_task_page::Model],
) -> SchedulerResult<()> {
    run_isolated_pages_with_shared_context(state, task, pages, None).await
}

/// 独立模式公共跑法（R4 baseline 使用；R2 / 将来 R1 各页阶段也可复用）
/// `shared_context` = Some(s) 时把 s 注入每页 prompt 头作为「全局组件清单」硬约束
async fn run_isolated_pages_with_shared_context(
    state: &AppState,
    task: &project_generation_task::Model,
    pages: &[project_task_page::Model],
    shared_context: Option<&str>,
) -> SchedulerResult<()> {
    // --- 前置校验 ---
    let sandbox_id = task
        .sandbox_id
        .as_deref()
        .ok_or_else(|| SchedulerError::Sandbox("task.sandbox_id 为空".to_string()))?;
    let workdir = task
        .workdir_path
        .as_deref()
        .ok_or_else(|| SchedulerError::Sandbox("task.workdir_path 为空".to_string()))?;

    // --- 复用 task 本次已选的 LLM 配置 ---
    let llm_decision = llm_selector::select_for_task(
        state,
        task.user_id,
        &task.amis_json,
        Some(&task.llm_mode),
        task.llm_provider_id,
        task.llm_model_name.as_deref(),
    )
    .await
    .map_err(|e| SchedulerError::ClawAgent(format!("llm_selector 失败: {e}")))?;

    // --- 并发限流 ---
    let max_concurrent = std::env::var("MAX_CONCURRENT_SESSIONS")
        .ok()
        .and_then(|s| s.parse::<usize>().ok())
        .unwrap_or(3);
    let semaphore = Arc::new(Semaphore::new(max_concurrent));

    // --- 为每页 spawn 任务 ---
    type PageResult = (i32, i32, Result<String, String>); // (page_id, page_idx, session_id|err)
    let mut joinset: JoinSet<PageResult> = JoinSet::new();

    for page in pages {
        let page_id = page.id;
        let page_idx = page.page_idx;

        // 更新 page 状态为 running + started_at（在 spawn 前同步完成，避免竞态）
        let now = Utc::now().naive_utc();
        let _ = project_task_page::ActiveModel {
            id: Set(page_id),
            status: Set("running".to_string()),
            started_at: Set(Some(now)),
            updated_at: Set(now),
            ..Default::default()
        }
        .update(&state.db)
        .await;

        // 记录 page_started 事件
        record_page_event(
            state,
            task.id,
            &format!("page_started:{page_idx}"),
            serde_json::json!({
                "page_id": page_id,
                "route": page.route_path,
            }),
        )
        .await;

        // 准备 spawn 所需的 owned 值
        let permit = semaphore
            .clone()
            .acquire_owned()
            .await
            .map_err(|e| SchedulerError::ClawAgent(format!("semaphore acquire 失败: {e}")))?;
        let prompt = build_page_prompt(task, page, shared_context);
        let workdir_owned = workdir.to_string();
        let sandbox_id_owned = sandbox_id.to_string();
        let claw_url = state.claw_agent_url.clone();
        let http = state.http_client.clone();
        let llm_cfg = llm_decision.config.clone();
        let tech_stack = task.tech_stack.clone();
        let platform = task.platform.clone();
        let tech_stacks = task.tech_stacks.clone();
        let ui_libs = task.ui_libs.clone();

        joinset.spawn(async move {
            let _permit = permit; // 持有 permit 直到本页完成
            let claw = ClawAgentClient::new(http, claw_url);
            let req = CreateTaskRequest {
                workdir: workdir_owned,
                sandbox_id: sandbox_id_owned,
                initial_message: prompt,
                model: Some(llm_cfg.model.clone()),
                tech_stack: Some(tech_stack),
                platform: Some(platform),
                tech_stacks: Some(tech_stacks),
                ui_libs: Some(ui_libs),
                llm_config: Some(llm_cfg),
                ..Default::default()
            };
            let result = claw
                .create_task(req)
                .await
                .map(|r| r.id)
                .map_err(|e| e.to_string());
            (page_id, page_idx, result)
        });
    }

    // --- 收集结果，更新 page 状态 ---
    while let Some(joined) = joinset.join_next().await {
        let (page_id, page_idx, result) =
            joined.map_err(|e| SchedulerError::ClawAgent(format!("JoinSet panic: {e}")))?;
        let now = Utc::now().naive_utc();
        let event_type = match &result {
            Ok(session_id) => {
                let _ = project_task_page::ActiveModel {
                    id: Set(page_id),
                    claw_session_id: Set(Some(session_id.clone())),
                    status: Set("done".to_string()),
                    finished_at: Set(Some(now)),
                    updated_at: Set(now),
                    ..Default::default()
                }
                .update(&state.db)
                .await;
                format!("page_done:{page_idx}")
            }
            Err(err) => {
                let _ = project_task_page::ActiveModel {
                    id: Set(page_id),
                    status: Set("failed".to_string()),
                    error_msg: Set(Some(err.clone())),
                    finished_at: Set(Some(now)),
                    updated_at: Set(now),
                    ..Default::default()
                }
                .update(&state.db)
                .await;
                format!("page_failed:{page_idx}")
            }
        };
        record_page_event(
            state,
            task.id,
            &event_type,
            serde_json::json!({"page_id": page_id}),
        )
        .await;
    }

    Ok(())
}

/// 构建单页生成 prompt
fn build_page_prompt(
    task: &project_generation_task::Model,
    page: &project_task_page::Model,
    shared_context: Option<&str>,
) -> String {
    let mut out = String::new();
    if let Some(s) = shared_context {
        out.push_str(s);
        out.push_str("\n---\n\n");
    }
    if let Some(extra) = task.extra_prompt.as_deref() {
        if !extra.is_empty() {
            out.push_str(extra);
            out.push('\n');
        }
    }
    out.push_str(&format!(
        "请基于以下 amis JSON 在 src/pages{route} 路径下生成对应的 UniApp Vue 页面文件，\
         并在 src/pages.json 注册路由。\n\namis JSON：\n{amis}",
        route = page.route_path,
        amis = page.amis_json,
    ));
    out
}

/// 写入任务事件（失败时 fire-and-forget，不阻塞主流程）
async fn record_page_event(
    state: &AppState,
    task_id: i32,
    event_type: &str,
    payload: serde_json::Value,
) {
    let now = Utc::now().naive_utc();
    let payload_str = serde_json::to_string(&payload).unwrap_or_else(|_| "{}".to_string());
    let active = project_task_event::ActiveModel {
        task_id: Set(task_id),
        event_type: Set(event_type.to_string()),
        payload: Set(payload_str),
        created_at: Set(now),
        ..Default::default()
    };
    let _ = active.insert(&state.db).await; // 事件丢失可接受，不返回错误
}
