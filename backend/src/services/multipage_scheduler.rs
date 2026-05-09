//! 多页任务调度器：5 种策略统一入口
//!
//! - unified：1 个 claw-agent session 跑全部 N 页
//! - isolated + r1_skeleton：骨架→各页→收尾 三阶段
//! - isolated + r2_prompt：N 页并发，全局 prompt 注入
//! - isolated + r3_refactor：N 页并发→重构 session
//! - isolated + r4_none：纯 N 页并发 baseline
//!
//! ## 1.2.0 多页 event_type vocab（写入 project_task_event 表）
//!
//! SSE/WS 转发层无白名单过滤（全转发），以下是各阶段约定的 event_type 字符串：
//!
//! | event_type | 说明 | 实现阶段 |
//! |---|---|---|
//! | `page_started:N` | 第 N 页 session 启动 | W2 R4（已落地） |
//! | `page_done:N` | 第 N 页 session 完成 | W2 R4（已落地） |
//! | `page_failed:N` | 第 N 页 session 失败 | W2 R4（已落地） |
//! | `skeleton_started` | R1 第 1 阶段骨架生成开始 | W4 实现 |
//! | `skeleton_done` | R1 第 1 阶段骨架生成完成 | W4 实现 |
//! | `skeleton_failed` | R1 第 1 阶段骨架生成失败 | W4 实现 |
//! | `cleanup_started` | R1 第 3 阶段收尾开始 | W4 实现 |
//! | `cleanup_done` | R1 第 3 阶段收尾完成 | W4 实现 |
//! | `cleanup_failed` | R1 第 3 阶段收尾失败 | W4 实现 |
//! | `refactor_started` | R3 第 2 阶段重构 session 开始 | W5 实现 |
//! | `refactor_done` | R3 第 2 阶段重构 session 完成 | W5 实现 |
//! | `refactor_failed` | R3 第 2 阶段重构 session 失败 | W5 实现 |
//! | `unified_started` | 统筹模式 session 开始 | W5 实现 |
//! | `unified_done` | 统筹模式 session 完成 | W5 实现 |
//! | `unified_failed` | 统筹模式 session 失败 | W5 实现 |
//! | `route_inferred:{page_idx}:{path}` | LLM 为用户未填路由推断并写回 | 可选 |
//! | `reuse_metric` | 完工后统计 shared/ import 次数/总组件数（百分比） | 可选 |
//!
//! > **注**：`page_started:N` / `page_done:N` / `page_failed:N` 带动态后缀 `:N`（页码）；
//! > 前端匹配时需用 `startsWith("page_started:")` 等前缀匹配，而非精确等值。

use crate::entity::{project_generation_task, project_task_event, project_task_page};
use crate::services::claw_agent_client::{ClawAgentClient, CreateTaskRequest};
use crate::services::llm_selector;
use crate::services::multipage_session_watcher::{wait_session_completed, SessionFinalStatus};
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

    let result = match task.execution_strategy.as_str() {
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
    };

    // 缺陷 4 闭环连线（W6.5）：5 种策略全部跑完才走 epilog —— 算复用率 + 写 reuse_metric event
    // + 调 agent /multipage/record 写 RAG。失败任务也写 reuse_metric（复用率 0 可作为对照样本），
    // 但**不**写 RAG（避免脏样本污染）。
    run_epilog(state, &task, &pages, result.is_ok()).await;

    // W6.5 收尾：epilog 写完后回写 task 主表 status，前端 IDE / 评测 runner 才知道真终态。
    // 多页路径没有 dev_status_watcher（那是单页路径独有的 dev server 健康监听），
    // task 主表的 status 更新就由这里兜底——已 status_change=succeeded 的各 page + epilog 都写完，
    // 就敢拍板 task succeeded 了。
    let task_id_for_log = task.id;
    let final_status = if result.is_ok() { "succeeded" } else { "failed" };
    let mut active: project_generation_task::ActiveModel = task.into();
    active.status = Set(final_status.to_owned());
    active.updated_at = Set(Utc::now().naive_utc());
    if let Err(e) = active.update(&state.db).await {
        tracing::warn!(
            "multipage scheduler: 回写 task={} 主表 status={} 失败: {}",
            task_id_for_log,
            final_status,
            e
        );
    }

    result
}

// ─── 5 个策略 stub（每个在后续 Task 里替换为真实实现）

async fn run_unified(
    state: &AppState,
    task: &project_generation_task::Model,
    pages: &[project_task_page::Model],
) -> SchedulerResult<()> {
    // 统筹模式建议 ≤ 5 页（避免 token 爆炸），超过强制 isolated
    if pages.len() > 5 {
        return Err(SchedulerError::InvalidStrategy(format!(
            "统筹模式建议页数 ≤ 5，当前 {}（请改用 isolated）",
            pages.len()
        )));
    }

    record_page_event(
        state,
        task.id,
        "unified_started",
        serde_json::json!({"page_count": pages.len()}),
    )
    .await;

    let template = include_str!(
        "../../../claw-code/rust/crates/claw-agent-server/prompts/multipage_unified.md"
    );
    let route_table = pages
        .iter()
        .map(|p| format!("- {}", p.route_path))
        .collect::<Vec<_>>()
        .join("\n");
    let amis_jsons = pages
        .iter()
        .enumerate()
        .map(|(i, p)| {
            format!(
                "### 页面 {} (路由 {})\n```json\n{}\n```",
                i + 1,
                p.route_path,
                p.amis_json
            )
        })
        .collect::<Vec<_>>()
        .join("\n\n");
    let prompt = template
        .replace("{{ROUTE_TABLE}}", &route_table)
        .replace("{{PAGE_AMIS_JSONS}}", &amis_jsons);

    let claw = ClawAgentClient::new(state.http_client.clone(), state.claw_agent_url.clone());
    let workdir = task
        .workdir_path
        .as_deref()
        .ok_or_else(|| SchedulerError::Sandbox("workdir 缺失".to_string()))?;
    let sandbox_id = task
        .sandbox_id
        .as_deref()
        .ok_or_else(|| SchedulerError::Sandbox("sandbox_id 缺失".to_string()))?;

    let req = build_stage_request(state, task, workdir, sandbox_id, prompt).await?;
    let resp = match claw.create_task(req).await {
        Ok(r) => r,
        Err(e) => {
            let err = e.to_string();
            record_page_event(
                state,
                task.id,
                "unified_failed",
                serde_json::json!({"error": err.clone()}),
            )
            .await;
            return Err(SchedulerError::ClawAgent(err));
        }
    };

    // W7+ 修：拿到 session_id 立刻落库（5 页共享同一个 session_id），方便任务还在跑时
    // 从 DB 反查 session_id 进行 stop / debug；之前只在 succeeded/failed 终态分支才回写。
    for page in pages {
        let _ = update_page_session_id_early(&state.db, page.id, &resp.id).await;
    }

    // 真完成等待：订阅 ws 等到 status_change 才决定是否标 done
    let final_status = wait_session_completed(state, task.id, &resp.id).await;
    let now = Utc::now().naive_utc();

    match final_status {
        SessionFinalStatus::Succeeded => {
            for page in pages {
                let active = project_task_page::ActiveModel {
                    id: Set(page.id),
                    status: Set("done".to_string()),
                    claw_session_id: Set(Some(resp.id.clone())),
                    finished_at: Set(Some(now)),
                    updated_at: Set(now),
                    ..Default::default()
                };
                let _ = active.update(&state.db).await;
            }
            record_page_event(
                state,
                task.id,
                "unified_done",
                serde_json::json!({"session_id": resp.id}),
            )
            .await;
            Ok(())
        }
        bad => {
            let err = format!("unified session {} 终态={}", resp.id, bad.as_str());
            for page in pages {
                let active = project_task_page::ActiveModel {
                    id: Set(page.id),
                    status: Set("failed".to_string()),
                    claw_session_id: Set(Some(resp.id.clone())),
                    error_msg: Set(Some(err.clone())),
                    finished_at: Set(Some(now)),
                    updated_at: Set(now),
                    ..Default::default()
                };
                let _ = active.update(&state.db).await;
            }
            record_page_event(
                state,
                task.id,
                "unified_failed",
                serde_json::json!({"session_id": resp.id, "error": err.clone()}),
            )
            .await;
            Err(SchedulerError::ClawAgent(err))
        }
    }
}

async fn run_skeleton_stage(
    state: &AppState,
    task: &project_generation_task::Model,
    pages: &[project_task_page::Model],
) -> SchedulerResult<String> {
    record_page_event(state, task.id, "skeleton_started", serde_json::json!({})).await;

    // 拼骨架 prompt（替换 PAGE_LIST_SUMMARY + ROUTE_TABLE）
    let template = include_str!(
        "../../../claw-code/rust/crates/claw-agent-server/prompts/scaffold_skeleton.md"
    );
    let page_summary = pages
        .iter()
        .map(|p| {
            let parsed: serde_json::Value =
                serde_json::from_str(&p.amis_json).unwrap_or(serde_json::Value::Null);
            let ptype = parsed.get("type").and_then(|v| v.as_str()).unwrap_or("?");
            let title = parsed.get("title").and_then(|v| v.as_str()).unwrap_or("");
            format!("- 路由 `{}`：type={} title={}", p.route_path, ptype, title)
        })
        .collect::<Vec<_>>()
        .join("\n");
    let route_table = pages
        .iter()
        .map(|p| format!("- {}", p.route_path))
        .collect::<Vec<_>>()
        .join("\n");
    let prompt = template
        .replace("{{PAGE_LIST_SUMMARY}}", &page_summary)
        .replace("{{ROUTE_TABLE}}", &route_table);

    let claw = ClawAgentClient::new(state.http_client.clone(), state.claw_agent_url.clone());
    let workdir = task
        .workdir_path
        .as_deref()
        .ok_or_else(|| SchedulerError::Sandbox("workdir 缺失".to_string()))?;
    let sandbox_id = task
        .sandbox_id
        .as_deref()
        .ok_or_else(|| SchedulerError::Sandbox("sandbox_id 缺失".to_string()))?;

    let req = build_stage_request(state, task, workdir, sandbox_id, prompt).await?;
    let resp = match claw.create_task(req).await {
        Ok(r) => r,
        Err(e) => {
            let err = e.to_string();
            record_page_event(
                state,
                task.id,
                "skeleton_failed",
                serde_json::json!({"error": err.clone()}),
            )
            .await;
            return Err(SchedulerError::ClawAgent(err));
        }
    };

    // 真完成等待：骨架 session 必须真跑完再让阶段 2 各页并发，否则 scan_sandbox 会扫到空骨架
    let final_status = wait_session_completed(state, task.id, &resp.id).await;
    match final_status {
        SessionFinalStatus::Succeeded => {
            record_page_event(
                state,
                task.id,
                "skeleton_done",
                serde_json::json!({"session_id": resp.id}),
            )
            .await;
            Ok(resp.id)
        }
        bad => {
            let err = format!("skeleton session {} 终态={}", resp.id, bad.as_str());
            record_page_event(
                state,
                task.id,
                "skeleton_failed",
                serde_json::json!({"session_id": resp.id, "error": err.clone()}),
            )
            .await;
            Err(SchedulerError::ClawAgent(err))
        }
    }
}

async fn run_cleanup_stage(
    state: &AppState,
    task: &project_generation_task::Model,
    pages: &[project_task_page::Model],
) -> SchedulerResult<()> {
    record_page_event(state, task.id, "cleanup_started", serde_json::json!({})).await;

    let route_list = pages
        .iter()
        .map(|p| format!("- {}", p.route_path))
        .collect::<Vec<_>>()
        .join("\n");
    let prompt = format!(
        "项目已完成 {} 页生成 + 骨架。请做静态质检（**只读检查，不要执行任何 dev / build / install 命令**）：\n\
         1. 跑 lint（如 eslint）—— 只读检查，不要 --fix\n\
         2. 检查所有 src/pages/*.vue 中的 uni.navigateTo / uni.switchTab 路径是否存在于 pages.json\n\
         3. 检查所有 import 路径是否能解析（不存在的文件路径报错）\n\
         \n\
         ⚠️ 严禁执行：`pnpm run dev:h5` / `pnpm dev` / `pnpm build` / `pnpm install` 等任何长时间或前台 blocking 命令。\n\
         dev server 由外部 watcher 自动启动 + 健康检查，**不需要你启动验证**。\n\
         如果你启动了 dev server，bash tool 会卡住等不到返回，整个 cleanup session 会超时失败。\n\
         \n\
         完成上述 3 项静态检查后，用一段话回复总结发现的问题（或确认全部 OK），就可以结束本轮对话。\n\
         \n\
         路由表：\n{}",
        pages.len(),
        route_list,
    );

    let claw = ClawAgentClient::new(state.http_client.clone(), state.claw_agent_url.clone());
    let workdir = task
        .workdir_path
        .as_deref()
        .ok_or_else(|| SchedulerError::Sandbox("workdir 缺失".to_string()))?;
    let sandbox_id = task
        .sandbox_id
        .as_deref()
        .ok_or_else(|| SchedulerError::Sandbox("sandbox_id 缺失".to_string()))?;

    let req = build_stage_request(state, task, workdir, sandbox_id, prompt).await?;
    let resp = match claw.create_task(req).await {
        Ok(r) => r,
        Err(e) => {
            let err = e.to_string();
            record_page_event(
                state,
                task.id,
                "cleanup_failed",
                serde_json::json!({"error": err.clone()}),
            )
            .await;
            return Err(SchedulerError::ClawAgent(err));
        }
    };

    let final_status = wait_session_completed(state, task.id, &resp.id).await;
    match final_status {
        SessionFinalStatus::Succeeded => {
            record_page_event(
                state,
                task.id,
                "cleanup_done",
                serde_json::json!({"session_id": resp.id}),
            )
            .await;
            Ok(())
        }
        bad => {
            let err = format!("cleanup session {} 终态={}", resp.id, bad.as_str());
            record_page_event(
                state,
                task.id,
                "cleanup_failed",
                serde_json::json!({"session_id": resp.id, "error": err.clone()}),
            )
            .await;
            Err(SchedulerError::ClawAgent(err))
        }
    }
}

async fn run_r1_skeleton(
    state: &AppState,
    task: &project_generation_task::Model,
    pages: &[project_task_page::Model],
) -> SchedulerResult<()> {
    use crate::services::global_prompt_builder::{render_prompt_section, scan_sandbox};

    // 阶段 1：骨架
    let _skeleton_session = run_skeleton_stage(state, task, pages).await?;

    // 阶段 2：扫骨架产物 → 拼带「骨架已生成」上下文的 shared 段 → N 页并发
    let workdir = task
        .workdir_path
        .as_deref()
        .ok_or_else(|| SchedulerError::Sandbox("workdir 缺失".to_string()))?;
    let ctx = scan_sandbox(std::path::Path::new(workdir));
    let mut shared = render_prompt_section(&ctx);
    shared.push_str(
        "\n\n**注意：** 上述清单是骨架阶段刚生成的，**必须 import 不准重复造**。\n",
    );
    run_isolated_pages_with_shared_context(state, task, pages, Some(&shared)).await?;

    // 阶段 3：收尾
    run_cleanup_stage(state, task, pages).await?;

    Ok(())
}

async fn run_r2_prompt(
    state: &AppState,
    task: &project_generation_task::Model,
    pages: &[project_task_page::Model],
) -> SchedulerResult<()> {
    use crate::services::global_prompt_builder::{render_prompt_section, scan_sandbox};

    let workdir = task
        .workdir_path
        .as_deref()
        .ok_or_else(|| SchedulerError::Sandbox("task.workdir_path 为空".to_string()))?;
    let ctx = scan_sandbox(std::path::Path::new(workdir));
    let global_section = render_prompt_section(&ctx);

    run_isolated_pages_with_shared_context(state, task, pages, Some(&global_section)).await
}

async fn run_r3_refactor(
    state: &AppState,
    task: &project_generation_task::Model,
    pages: &[project_task_page::Model],
) -> SchedulerResult<()> {
    // 阶段 1：N 页并发（同 R4 baseline，无共享）
    run_isolated_pages_with_shared_context(state, task, pages, None).await?;

    // 阶段 2：重构 session
    record_page_event(state, task.id, "refactor_started", serde_json::json!({})).await;

    let prompt = include_str!(
        "../../../claw-code/rust/crates/claw-agent-server/prompts/scaffold_refactor.md"
    )
    .to_string();

    let claw = ClawAgentClient::new(state.http_client.clone(), state.claw_agent_url.clone());
    let workdir = task
        .workdir_path
        .as_deref()
        .ok_or_else(|| SchedulerError::Sandbox("workdir 缺失".to_string()))?;
    let sandbox_id = task
        .sandbox_id
        .as_deref()
        .ok_or_else(|| SchedulerError::Sandbox("sandbox_id 缺失".to_string()))?;

    let req = build_stage_request(state, task, workdir, sandbox_id, prompt).await?;
    let resp = match claw.create_task(req).await {
        Ok(r) => r,
        Err(e) => {
            let err = e.to_string();
            record_page_event(
                state,
                task.id,
                "refactor_failed",
                serde_json::json!({"error": err.clone()}),
            )
            .await;
            return Err(SchedulerError::ClawAgent(err));
        }
    };

    let final_status = wait_session_completed(state, task.id, &resp.id).await;
    match final_status {
        SessionFinalStatus::Succeeded => {
            record_page_event(
                state,
                task.id,
                "refactor_done",
                serde_json::json!({"session_id": resp.id}),
            )
            .await;
            Ok(())
        }
        bad => {
            let err = format!("refactor session {} 终态={}", resp.id, bad.as_str());
            record_page_event(
                state,
                task.id,
                "refactor_failed",
                serde_json::json!({"session_id": resp.id, "error": err.clone()}),
            )
            .await;
            Err(SchedulerError::ClawAgent(err))
        }
    }
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
        let state_for_wait = state.clone();
        let task_id_for_wait = task.id;

        joinset.spawn(async move {
            let _permit = permit; // 持有 permit 直到本页完成 + wait 结束
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
                single_shot: Some(true),
                ..Default::default()
            };
            let session_id = match claw.create_task(req).await {
                Ok(r) => r.id,
                Err(e) => return (page_id, page_idx, Err(e.to_string())),
            };
            // W7+ 修：拿到 session_id 立刻落库，方便任务还在跑时从 DB 反查；
            // 之前只在 join 成功后才回写，failed/timeout 时永远 NULL。
            let _ =
                update_page_session_id_early(&state_for_wait.db, page_id, &session_id).await;
            // 真完成等待：订阅本 page session 的 ws，等到 status_change=succeeded/failed
            let final_status =
                wait_session_completed(&state_for_wait, task_id_for_wait, &session_id).await;
            let result = match final_status {
                SessionFinalStatus::Succeeded => Ok(session_id),
                bad => Err(format!("session {} 终态={}", session_id, bad.as_str())),
            };
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

/// W7+ 修：构造 stage 级 CreateTaskRequest（带完整 LLM 配置 + Skills 字段）。
/// 之前 unified / skeleton / cleanup / r3_refactor 4 处 stage 函数的 CreateTaskRequest
/// 都只传了 workdir / sandbox_id / initial_message / single_shot，
/// 缺 model / tech_stack / platform / tech_stacks / ui_libs / llm_config —— claw-agent
/// 拿不到 LLM 配置就立刻 status_change=failed（评测里看到 0 LLM 调用 + 极快失败的根因）。
/// 这个 helper 跟 isolated 各页 spawn 的 CreateTaskRequest 同款字段，统一收口。
async fn build_stage_request(
    state: &AppState,
    task: &project_generation_task::Model,
    workdir: &str,
    sandbox_id: &str,
    prompt: String,
) -> SchedulerResult<CreateTaskRequest> {
    let llm_decision = crate::services::llm_selector::select_for_task(
        state,
        task.user_id,
        &task.amis_json,
        Some(&task.llm_mode),
        task.llm_provider_id,
        task.llm_model_name.as_deref(),
    )
    .await
    .map_err(|e| SchedulerError::ClawAgent(format!("llm_selector 失败: {e}")))?;
    let llm_cfg = llm_decision.config;
    Ok(CreateTaskRequest {
        workdir: workdir.to_string(),
        sandbox_id: sandbox_id.to_string(),
        initial_message: prompt,
        model: Some(llm_cfg.model.clone()),
        tech_stack: Some(task.tech_stack.clone()),
        platform: Some(task.platform.clone()),
        tech_stacks: Some(task.tech_stacks.clone()),
        ui_libs: Some(task.ui_libs.clone()),
        llm_config: Some(llm_cfg),
        single_shot: Some(true),
        ..Default::default()
    })
}

/// W7+ 修：拿到 claw session_id 后立刻把它落到 page 表（不等任务结束）。
/// 之前 5 处 spawn 都是在终态分支才回写 claw_session_id，导致：
/// - 任务还在 running 时 page 表 claw_session_id=NULL，无法从 DB 反查 session 进行 stop / debug
/// - 任务 timeout / failed 时也永远 NULL
/// fire-and-forget 风格，DB 失败不影响主流程。
async fn update_page_session_id_early(
    db: &sea_orm::DatabaseConnection,
    page_id: i32,
    session_id: &str,
) {
    let _ = project_task_page::ActiveModel {
        id: Set(page_id),
        claw_session_id: Set(Some(session_id.to_string())),
        updated_at: Set(Utc::now().naive_utc()),
        ..Default::default()
    }
    .update(db)
    .await;
}

/// 缺陷 4 闭环连线（W6.5）：5 种策略全跑完后调一次 ——
/// 1. fs 扫 workdir 算 shared/ 复用率（backend 内联，无跨服务 HTTP）
/// 2. 写一条 `reuse_metric` 事件（前端可看 + 评测 runner 可读）
/// 3. 成功任务才调 agent `POST /multipage/record` 写 RAG（status=pending 等人审）
async fn run_epilog(
    state: &AppState,
    task: &project_generation_task::Model,
    pages: &[project_task_page::Model],
    success: bool,
) {
    let workdir = match task.workdir_path.as_deref() {
        Some(s) if !s.is_empty() => s,
        _ => {
            tracing::warn!("multipage epilog: task={} workdir 缺失，跳过收尾", task.id);
            return;
        }
    };

    let metric =
        crate::services::multipage_reuse::compute_reuse_rate(std::path::Path::new(workdir));
    record_page_event(
        state,
        task.id,
        "reuse_metric",
        serde_json::json!({
            "import_count": metric.import_count,
            "file_count": metric.file_count,
            "reuse_rate": metric.reuse_rate,
            "execution_strategy": task.execution_strategy,
            "reuse_strategy": task.reuse_strategy,
            "page_count": pages.len(),
        }),
    )
    .await;

    if !success {
        tracing::info!(
            "multipage epilog: task={} 任务失败，跳过 RAG record（避免脏样本）",
            task.id
        );
        return;
    }

    // POST agent /multipage/record（写 RAG，status=pending 等人审）
    let pages_payload: Vec<serde_json::Value> = pages
        .iter()
        .map(|p| {
            let full_code = read_page_full_code(workdir, &p.route_path).unwrap_or_default();
            serde_json::json!({
                "route_path": p.route_path,
                "amis_json": p.amis_json,
                "full_code": full_code,
            })
        })
        .collect();
    let body = serde_json::json!({
        "task_id": task.id,
        "execution_strategy": task.execution_strategy,
        "reuse_strategy": task.reuse_strategy,
        "page_count": pages.len(),
        "reuse_rate": metric.reuse_rate,
        "pages": pages_payload,
    });

    let url = format!("{}/multipage/record", state.agent_url.trim_end_matches('/'));
    match state.http_client.post(&url).json(&body).send().await {
        Ok(resp) if resp.status().is_success() => {
            let sample_id = resp
                .json::<serde_json::Value>()
                .await
                .ok()
                .and_then(|v| v.get("sample_id").and_then(|s| s.as_i64()))
                .unwrap_or(-1);
            record_page_event(
                state,
                task.id,
                "rag_recorded",
                serde_json::json!({"sample_id": sample_id, "reuse_rate": metric.reuse_rate}),
            )
            .await;
            tracing::info!(
                "multipage epilog: task={} 写 RAG 成功 sample_id={}",
                task.id,
                sample_id
            );
        }
        Ok(resp) => {
            let status = resp.status();
            let text = resp.text().await.unwrap_or_default();
            tracing::warn!(
                "multipage epilog: task={} 写 RAG 失败 status={} body={}",
                task.id,
                status,
                text
            );
            record_page_event(
                state,
                task.id,
                "rag_record_failed",
                serde_json::json!({"status": status.as_u16(), "body": text}),
            )
            .await;
        }
        Err(e) => {
            tracing::warn!("multipage epilog: task={} 写 RAG 异常: {}", task.id, e);
            record_page_event(
                state,
                task.id,
                "rag_record_failed",
                serde_json::json!({"error": e.to_string()}),
            )
            .await;
        }
    }
}

/// 按 route_path 在 workdir 下找该页生成的 .vue 文件全文。
/// 兼容 `src/pages/<route>.vue` 与 `src/pages/<route>/index.vue` 两种约定。
fn read_page_full_code(workdir: &str, route_path: &str) -> Option<String> {
    let normalized = route_path.trim_start_matches('/').trim_start_matches("pages/");
    let candidates = [
        format!("{workdir}/src/pages/{normalized}.vue"),
        format!("{workdir}/src/pages/{normalized}/index.vue"),
    ];
    for c in &candidates {
        if let Ok(s) = std::fs::read_to_string(c) {
            return Some(s);
        }
    }
    None
}
