//! 2026-04 RAG 质量闭环 · Phase 2：LLM 评委桥
//!
//! 职责：把"单条或批量 code_sample"送到 Python agent 评委，回填
//! `quality_verdict / quality_reason / quality_judge_at / quality_judge_model`，
//! 并写一条 `action=judge, operator_kind=llm_judge` 的 audit。
//!
//! 核心纪律（源自 Plan agent 评审意见，全部默认保守）：
//!   - `rag.judge.mode = disabled` 时直接 skip（默认）
//!   - `rag.judge.budget_per_day` 日配额：超了返回 429-语义，并写 skip 审计
//!   - `rag.judge.batch_concurrency` semaphore：防一次性把 provider 压爆
//!   - 二元 verdict：`good / needs_review / bad`（而非 5 分制，LLM 5 分制方差大）
//!   - 跨 provider 推荐：在 llm_selector::select_for_quality_judge 的 fallback 链里已经提示 admin

use std::sync::{Arc, OnceLock};

use sea_orm::{ConnectionTrait, Statement};
use serde_json::{json, Value};
use tokio::sync::Semaphore;

use crate::entity::code_sample;
use crate::handlers::code_samples::record_audit;
use crate::handlers::system_settings::read_value_or;
use crate::AppState;

use sea_orm::{ActiveModelTrait, EntityTrait, IntoActiveModel, Set};

/// 全局 semaphore：限制同一时刻在飞的 LLM 评委调用数。
/// 第一次 `spawn_judge_for_sample` 读配置建立；之后 permits 不会再根据配置变化动态调整
/// （这是可接受的——admin 调高了并发上限需要重启进程生效，防止多轮变更踩踏）。
static JUDGE_SEMAPHORE: OnceLock<Arc<Semaphore>> = OnceLock::new();

async fn get_semaphore(state: &AppState) -> Arc<Semaphore> {
    if let Some(s) = JUDGE_SEMAPHORE.get() {
        return s.clone();
    }
    let n: usize = read_value_or(state, "rag.judge.batch_concurrency", "3")
        .await
        .trim()
        .parse()
        .unwrap_or(3);
    let sem = Arc::new(Semaphore::new(n.max(1)));
    let _ = JUDGE_SEMAPHORE.set(sem.clone());
    sem
}

/// 读 rag.judge.budget_per_day + 今日已评次数；超配额返回 true（=skip）。
/// 今日已评次数 = code_sample_audit WHERE action='judge' AND created_at >= today_start。
async fn is_over_budget(state: &AppState) -> bool {
    let budget: i64 = read_value_or(state, "rag.judge.budget_per_day", "50")
        .await
        .trim()
        .parse()
        .unwrap_or(50);
    if budget <= 0 {
        return true; // 配额 ≤ 0 视为禁用
    }
    // 当日开始时间：用 date_trunc('day', NOW()) 简化，不考虑时区（与其他 audit 时间戳一致）
    let stmt = Statement::from_string(
        state.db.get_database_backend(),
        "SELECT COUNT(*) AS n FROM code_sample_audit \
         WHERE action = 'judge' AND created_at >= date_trunc('day', NOW())"
            .to_string(),
    );
    match state.db.query_one(stmt).await {
        Ok(Some(row)) => {
            let used: i64 = row.try_get("", "n").unwrap_or(0);
            used >= budget
        }
        _ => false,
    }
}

/// 触发一条样例的 LLM 评委（fire-and-forget）。
/// - mode=disabled 或超预算 → 写 skip 审计（note 含原因）后返回
/// - 否则 acquire semaphore、调 Python、回填字段、写 judge 审计
pub fn spawn_judge_for_sample(state: AppState, sample_id: i32, trigger: &'static str) {
    tokio::spawn(async move {
        // 1. 模式门禁
        let mode = read_value_or(&state, "rag.judge.mode", "disabled")
            .await
            .trim()
            .to_lowercase();
        if mode == "disabled" {
            record_audit(
                &state.db,
                sample_id,
                None,
                "system",
                "judge",
                None,
                Some(json!({ "skipped": true, "reason": "rag.judge.mode=disabled" })),
                Some(format!("触发: {} · 已跳过（评委已关闭）", trigger)),
            )
            .await;
            return;
        }
        // 2. 预算门禁
        if is_over_budget(&state).await {
            record_audit(
                &state.db,
                sample_id,
                None,
                "system",
                "judge",
                None,
                Some(json!({ "skipped": true, "reason": "budget_exhausted" })),
                Some(format!("触发: {} · 已跳过（今日评委预算用完）", trigger)),
            )
            .await;
            return;
        }

        // 3. 并发闸 + Python 调用
        let sem = get_semaphore(&state).await;
        let _permit = match sem.acquire_owned().await {
            Ok(p) => p,
            Err(_) => {
                tracing::warn!("judge semaphore closed, sample_id={}", sample_id);
                return;
            }
        };

        // 4. 挑选模型信息（仅作 judge_model 记录用，Python 那边实际读 task_type 决定）
        let (task_type, judge_model) = {
            let tt =
                read_value_or(&state, "rag.judge.task_type", "quality_judge").await;
            // 尝试拿出 fallback chain 的首个命中（只用它的 model_name 做标记）
            let decision = crate::services::llm_selector::select_for_quality_judge(&state).await;
            let model = decision
                .map(|d| d.config.model.clone())
                .unwrap_or_else(|_| "unknown".to_string());
            (tt, model)
        };

        // 5. 读 sample 摘要 + 代码（截断防 prompt 超长）
        let sample = match code_sample::Entity::find_by_id(sample_id)
            .one(&state.db)
            .await
        {
            Ok(Some(m)) => m,
            _ => {
                tracing::warn!("judge: sample {} not found", sample_id);
                return;
            }
        };

        // 6. 调 Python /internal/judge-code-sample
        let agent_url =
            std::env::var("AGENT_URL").unwrap_or_else(|_| "http://localhost:8000".to_string());
        let internal_key = std::env::var("INTERNAL_API_KEY").unwrap_or_default();
        let resp = state
            .http_client
            .post(format!("{}/internal/judge-code-sample", agent_url))
            .header("X-Internal-Key", &internal_key)
            .json(&json!({
                "sample_id": sample_id,
                "task_type": task_type,
                "amis_json_summary": sample.amis_json_summary,
                "code_summary": sample.code_summary,
                // 8000 字截断：4000 仅够装 4-5 个基础设施文件，会切掉真正的业务页面 .vue
                // （collect 阶段已把 src/pages/**.vue 排在最前，所以前 8000 字几乎一定能覆盖关键页面）。
                "full_code": sample.full_code.chars().take(8000).collect::<String>(),
            }))
            .timeout(std::time::Duration::from_secs(90))
            .send()
            .await;

        let body: Value = match resp {
            Ok(r) if r.status().is_success() => match r.json().await {
                Ok(v) => v,
                Err(e) => {
                    tracing::warn!("judge {} parse body failed: {}", sample_id, e);
                    return;
                }
            },
            Ok(r) => {
                tracing::warn!("judge {} non-2xx: {}", sample_id, r.status());
                record_audit(
                    &state.db,
                    sample_id,
                    None,
                    "system",
                    "judge",
                    None,
                    Some(json!({ "skipped": true, "reason": format!("agent {}", r.status()) })),
                    None,
                )
                .await;
                return;
            }
            Err(e) => {
                tracing::warn!("judge {} http err: {}", sample_id, e);
                return;
            }
        };

        // 7. 规整 verdict（LLM 可能输出混乱；只接受 good/needs_review/bad）
        let verdict_raw = body
            .get("verdict")
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .to_lowercase();
        let verdict = match verdict_raw.as_str() {
            "good" => "good",
            "needs_review" | "needs review" | "review" => "needs_review",
            "bad" => "bad",
            _ => {
                tracing::warn!(
                    "judge {} invalid verdict '{}', skip",
                    sample_id,
                    verdict_raw
                );
                return;
            }
        };
        let reason = body
            .get("reason")
            .and_then(|v| v.as_str())
            .map(|s| s.chars().take(500).collect::<String>())
            .unwrap_or_default();
        let model_used = body
            .get("model_used")
            .and_then(|v| v.as_str())
            .map(String::from)
            .unwrap_or(judge_model);

        // 8. 回填 code_samples
        let old_verdict = sample.quality_verdict.clone();
        let mut active = sample.into_active_model();
        active.quality_verdict = Set(Some(verdict.to_string()));
        active.quality_reason = Set(Some(reason.clone()));
        active.quality_judge_at = Set(Some(chrono::Local::now().naive_local()));
        active.quality_judge_model = Set(Some(model_used.clone()));
        active.updated_at = Set(chrono::Local::now().naive_local());
        if let Err(e) = active.update(&state.db).await {
            tracing::warn!("judge {} persist failed: {}", sample_id, e);
            return;
        }

        // 9. audit
        record_audit(
            &state.db,
            sample_id,
            None,
            "llm_judge",
            "judge",
            Some(json!({ "quality_verdict": old_verdict })),
            Some(json!({
                "quality_verdict": verdict,
                "model": model_used,
            })),
            Some(format!(
                "触发: {} · verdict={} · reason={}",
                trigger,
                verdict,
                reason.chars().take(120).collect::<String>()
            )),
        )
        .await;
    });
}
