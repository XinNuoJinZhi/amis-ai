//! 多页任务调度器：5 种策略统一入口
//!
//! - unified：1 个 claw-agent session 跑全部 N 页
//! - isolated + r1_skeleton：骨架→各页→收尾 三阶段
//! - isolated + r2_prompt：N 页并发，全局 prompt 注入
//! - isolated + r3_refactor：N 页并发→重构 session
//! - isolated + r4_none：纯 N 页并发 baseline

use crate::entity::{project_generation_task, project_task_page};
use crate::AppState;
use sea_orm::{ColumnTrait, EntityTrait, QueryFilter, QueryOrder};

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
    _state: &AppState,
    _task: &project_generation_task::Model,
    _pages: &[project_task_page::Model],
) -> SchedulerResult<()> {
    Err(SchedulerError::InvalidStrategy(
        "r4_baseline 待 W2.2 实现".to_string(),
    ))
}
