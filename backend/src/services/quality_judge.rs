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

use crate::entity::{code_sample, project_task_page};
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
        active.quality_judge_at = Set(Some(chrono::Utc::now().naive_utc()));
        active.quality_judge_model = Set(Some(model_used.clone()));
        active.updated_at = Set(chrono::Utc::now().naive_utc());
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

        // 10. 1.4 B.3a · 自动回流：verdict=bad 且 rag.judge.auto_negative_on_bad=true
        //     → 标 is_negative=true / negative_kind='structural' / status='rejected'
        //     是反向飞轮的最后一公里：bad 样例自动变反面教材，被 search_negative_samples
        //     反向召回，不再污染正向召回（search_code_samples 永远过滤 is_negative=FALSE）
        if verdict == "bad" {
            let auto_neg = read_value_or(&state, "rag.judge.auto_negative_on_bad", "false")
                .await
                .trim()
                .eq_ignore_ascii_case("true");
            if auto_neg {
                if let Ok(Some(s)) = code_sample::Entity::find_by_id(sample_id)
                    .one(&state.db)
                    .await
                {
                    let old_neg = s.is_negative;
                    let old_kind = s.negative_kind.clone();
                    let old_status = s.status.clone();
                    if !old_neg {
                        let auto_reason = format!(
                            "[auto] LLM 评委 verdict=bad → 自动回流：{}",
                            reason.chars().take(200).collect::<String>()
                        );
                        let mut a = s.into_active_model();
                        a.is_negative = Set(true);
                        a.negative_kind = Set(Some("structural".to_string()));
                        a.rejection_reason = Set(Some(auto_reason.clone()));
                        a.status = Set("rejected".to_string());
                        a.updated_at = Set(chrono::Utc::now().naive_utc());
                        match a.update(&state.db).await {
                            Ok(_) => {
                                record_audit(
                                    &state.db,
                                    sample_id,
                                    None,
                                    "system",
                                    "mark_negative",
                                    Some(json!({
                                        "is_negative": old_neg,
                                        "negative_kind": old_kind,
                                        "status": old_status,
                                    })),
                                    Some(json!({
                                        "is_negative": true,
                                        "negative_kind": "structural",
                                        "status": "rejected",
                                        "trigger": "auto_negative_on_bad",
                                    })),
                                    Some(auto_reason),
                                )
                                .await;
                            }
                            Err(e) => {
                                tracing::warn!(
                                    "auto mark_negative {} failed: {}",
                                    sample_id,
                                    e
                                );
                            }
                        }
                    }
                }
            }
        }
    });
}

// ─────────────────────── 1.4 B.3b · page 级评委 ───────────────────────

/// 触发一条 project_task_page 的 LLM 评委（fire-and-forget）。
///
/// 与 spawn_judge_for_sample 的差异：
///   - 评的是 amis JSON 设计本身（与代码无关），不需要拉 full_code
///   - 复用同一个 mode/budget/semaphore（共享 rag.judge.* 配额）
///   - 多读一个 `rag.judge.page_mode` 总闸（默认 disabled，独立于 sample mode）
///   - 结果回填 project_task_page.page_quality_*
///   - 不写 code_sample_audit（page 级评委是过程指标，不进飞轮历史）
///
/// 用途（admin 手动 / scheduler 完成 page 后触发）：
///   1. 累积「页通过率」评测维度（与 dev_start 成功率交叉验证）
///   2. bad page 让 admin 决定是否回流为 is_negative=true 的 code_sample（手动操作，不自动）
///
/// W3 接通：multipage_scheduler 在 page 完成时 fire-and-forget 调用本函数。
pub fn spawn_judge_for_page(state: AppState, page_id: i32, trigger: &'static str) {
    tokio::spawn(async move {
        // 1. 总闸：page_mode = disabled 时直接 skip（不写 audit，page 级评是过程指标）
        let mode = read_value_or(&state, "rag.judge.page_mode", "disabled")
            .await
            .trim()
            .to_lowercase();
        if mode == "disabled" {
            tracing::debug!("page judge skipped: page_mode=disabled, page_id={}", page_id);
            return;
        }
        // 2. 复用 sample 评委的预算闸（同一个 budget 池，避免双重预算管理）
        if is_over_budget(&state).await {
            tracing::warn!("page judge skipped: budget exhausted, page_id={}", page_id);
            return;
        }

        // 3. 并发闸
        let sem = get_semaphore(&state).await;
        let _permit = match sem.acquire_owned().await {
            Ok(p) => p,
            Err(_) => {
                tracing::warn!("page judge semaphore closed, page_id={}", page_id);
                return;
            }
        };

        // 4. 读 page + 关联 task 拿技术栈/UI（送评委 prompt 用）
        let page = match project_task_page::Entity::find_by_id(page_id)
            .one(&state.db)
            .await
        {
            Ok(Some(p)) => p,
            _ => {
                tracing::warn!("page judge: page {} not found", page_id);
                return;
            }
        };
        let task_opt = crate::entity::project_generation_task::Entity::find_by_id(page.task_id)
            .one(&state.db)
            .await
            .ok()
            .flatten();
        let (tech_stack, ui_lib) = task_opt
            .as_ref()
            .map(|t| (t.tech_stack.clone(), t.ui_library.clone()))
            .unwrap_or_default();

        // 5. 挑选模型信息（用于回填 judge_model 字段）
        let task_type = read_value_or(&state, "rag.judge.task_type", "quality_judge").await;
        let judge_model = crate::services::llm_selector::select_for_quality_judge(&state)
            .await
            .map(|d| d.config.model.clone())
            .unwrap_or_else(|_| "unknown".to_string());

        // 6. 调 Python /internal/judge-page-schema
        let agent_url =
            std::env::var("AGENT_URL").unwrap_or_else(|_| "http://localhost:8000".to_string());
        let internal_key = std::env::var("INTERNAL_API_KEY").unwrap_or_default();
        let resp = state
            .http_client
            .post(format!("{}/internal/judge-page-schema", agent_url))
            .header("X-Internal-Key", &internal_key)
            .json(&json!({
                "page_id": page_id,
                "task_type": task_type,
                "route_path": page.route_path,
                "amis_json": page.amis_json,
                "tech_stack": tech_stack,
                "ui_lib": ui_lib,
            }))
            .timeout(std::time::Duration::from_secs(90))
            .send()
            .await;

        let body: Value = match resp {
            Ok(r) if r.status().is_success() => match r.json().await {
                Ok(v) => v,
                Err(e) => {
                    tracing::warn!("page judge {} parse body failed: {}", page_id, e);
                    return;
                }
            },
            Ok(r) => {
                tracing::warn!("page judge {} non-2xx: {}", page_id, r.status());
                return;
            }
            Err(e) => {
                tracing::warn!("page judge {} http err: {}", page_id, e);
                return;
            }
        };

        // 7. 规整 verdict + reason（容错 LLM 输出抖动）
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
                    "page judge {} invalid verdict '{}', skip",
                    page_id,
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

        // 8. 回填 project_task_page.page_quality_*
        // 1.6 W1 · A：先把后面自动入库要用的字段克隆出来（into_active_model 会消费 page）
        let page_task_id = page.task_id;
        let page_route_path = page.route_path.clone();
        let page_amis_json = page.amis_json.clone();
        let mut active = page.into_active_model();
        active.page_quality_verdict = Set(Some(verdict.to_string()));
        active.page_quality_reason = Set(Some(reason.clone()));
        active.page_quality_judge_at = Set(Some(chrono::Utc::now().naive_utc()));
        active.page_quality_judge_model = Set(Some(model_used.clone()));
        active.updated_at = Set(chrono::Utc::now().naive_utc());
        if let Err(e) = active.update(&state.db).await {
            tracing::warn!("page judge {} persist failed: {}", page_id, e);
            return;
        }

        tracing::info!(
            "page judge done: page_id={} verdict={} model={} trigger={}",
            page_id,
            verdict,
            model_used,
            trigger,
        );

        // 9. 1.6 W1 · A：bad page 自动入库 code_samples（pending_review + is_negative）
        //    总闸默认 false（与 1.5 行为完全一致）；admin 显式开启后才生效。
        //    confidence 低于阈值不入库（避免低质负例污染召回）。
        if verdict == "bad" {
            let auto_on = read_value_or(&state, "rag.judge.auto_page_negative", "false")
                .await
                .trim()
                .eq_ignore_ascii_case("true");
            if auto_on {
                let confidence = body
                    .get("confidence")
                    .and_then(|v| v.as_f64())
                    .unwrap_or(0.5) // 旧模型不返回 → 0.5（< 默认阈值 0.85，不入库）
                    .clamp(0.0, 1.0);
                let min_conf: f64 = read_value_or(
                    &state,
                    "rag.judge.auto_page_negative_min_confidence",
                    "0.85",
                )
                .await
                .trim()
                .parse()
                .unwrap_or(0.85);
                if confidence < min_conf {
                    tracing::info!(
                        "page judge {} verdict=bad but confidence {:.2} < threshold {:.2}, skip auto negative",
                        page_id,
                        confidence,
                        min_conf,
                    );
                } else {
                    let neg_kind = read_value_or(
                        &state,
                        "rag.judge.auto_page_negative_kind",
                        "structural",
                    )
                    .await
                    .trim()
                    .to_string();
                    auto_insert_page_negative(
                        &state,
                        page_id,
                        page_task_id,
                        &page_route_path,
                        &page_amis_json,
                        task_opt.as_ref(),
                        verdict,
                        &reason,
                        confidence,
                        &neg_kind,
                        &model_used,
                    )
                    .await;
                }
            }
        }
    });
}

/// 1.6 W1 · A：把 bad page 作为反面教材入库（pending_review + is_negative=true）
/// 失败仅日志，不抛——评委已经把 verdict 写回，这里失败不能反着回滚 verdict。
async fn auto_insert_page_negative(
    state: &AppState,
    page_id: i32,
    task_id: i32,
    route_path: &str,
    page_amis_json: &str,
    task_opt: Option<&crate::entity::project_generation_task::Model>,
    verdict: &str,
    reason: &str,
    confidence: f64,
    negative_kind: &str,
    judge_model: &str,
) {
    let (tech_stack, platforms, tech_stacks, ui_libs) = task_opt
        .map(|t| {
            (
                t.tech_stack.clone(),
                t.platforms.clone(),
                t.tech_stacks.clone(),
                t.ui_libs.clone(),
            )
        })
        .unwrap_or_else(|| (String::new(), vec![], vec![], vec![]));

    // 摘要：让 admin 在 list 页一眼看出是 page-bad 自动来的
    let summary = format!(
        "[auto page-bad] route={} · conf={:.2} · {}",
        route_path,
        confidence,
        reason.chars().take(180).collect::<String>(),
    );

    // text[] 写入：用 SQL ARRAY[..] 字面量（避免 SeaORM 多维数组列的支持坑）
    // 这里我们用 query/exec_unprepared 走 raw SQL，绕过 ActiveModel
    fn pg_text_array(items: &[String]) -> String {
        let escaped: Vec<String> = items
            .iter()
            .map(|s| format!("'{}'", s.replace('\'', "''")))
            .collect();
        format!("ARRAY[{}]::text[]", escaped.join(","))
    }

    let stmt = Statement::from_sql_and_values(
        state.db.get_database_backend(),
        format!(
            "INSERT INTO code_samples (\
                tech_stack, source_team, amis_json_summary, code_summary, \
                full_amis_json, full_code, status, hit_count, \
                source_task_id, source_page_id, \
                platforms, tech_stacks, ui_libs, tags, \
                is_negative, negative_kind, rejection_reason, \
                quality_verdict, quality_reason, quality_judge_at, quality_judge_model, \
                keyword_index, \
                created_at, updated_at\
             ) VALUES (\
                $1, 'amis-ai', $2, NULL, \
                $3, '', 'pending_review', 0, \
                $4, $5, \
                {platforms}, {tech_stacks}, {ui_libs}, ARRAY[]::text[], \
                TRUE, $6, $7, \
                $8, $9, NOW(), $10, \
                ARRAY[]::text[], \
                NOW(), NOW()\
             ) RETURNING id",
            platforms = pg_text_array(&platforms),
            tech_stacks = pg_text_array(&tech_stacks),
            ui_libs = pg_text_array(&ui_libs),
        ),
        vec![
            tech_stack.into(),
            summary.clone().into(),
            page_amis_json.to_string().into(),
            task_id.into(),
            page_id.into(),
            negative_kind.to_string().into(),
            reason.to_string().into(),
            verdict.to_string().into(),
            reason.to_string().into(),
            judge_model.to_string().into(),
        ],
    );

    let inserted_id: Option<i32> = match state.db.query_one(stmt).await {
        Ok(Some(row)) => row.try_get("", "id").ok(),
        Ok(None) => None,
        Err(e) => {
            tracing::warn!(
                "auto_insert_page_negative {} INSERT failed: {}",
                page_id,
                e
            );
            return;
        }
    };
    let sample_id = match inserted_id {
        Some(id) => id,
        None => {
            tracing::warn!(
                "auto_insert_page_negative {} INSERT no id returned",
                page_id
            );
            return;
        }
    };

    tracing::info!(
        "auto inserted page-bad sample: sample_id={} from page_id={} task_id={} conf={:.2}",
        sample_id,
        page_id,
        task_id,
        confidence,
    );

    // audit：用 llm_judge 操作类型，action 用新值 auto_create_negative 便于追溯
    record_audit(
        &state.db,
        sample_id,
        None,
        "llm_judge",
        "auto_create_negative",
        None,
        Some(json!({
            "status": "pending_review",
            "is_negative": true,
            "negative_kind": negative_kind,
            "source_page_id": page_id,
            "source_task_id": task_id,
            "verdict": verdict,
            "confidence": confidence,
            "judge_model": judge_model,
        })),
        Some(format!(
            "[auto] page judge verdict=bad (conf={:.2}) → 待 admin 复核",
            confidence
        )),
    )
    .await;

    // fire-and-forget 触发向量化 + keyword 提取
    let agent_url =
        std::env::var("AGENT_URL").unwrap_or_else(|_| "http://localhost:8000".to_string());
    let internal_key = std::env::var("INTERNAL_API_KEY").unwrap_or_default();
    let http_client = state.http_client.clone();
    let summary_clone = summary.clone();
    tokio::spawn(async move {
        let resp = http_client
            .post(format!("{}/internal/index-code-sample", agent_url))
            .header("X-Internal-Key", &internal_key)
            .json(&json!({
                "sample_id": sample_id,
                "summary_text": summary_clone,
            }))
            .timeout(std::time::Duration::from_secs(30))
            .send()
            .await;
        match resp {
            Ok(r) if r.status().is_success() => {
                tracing::info!("auto page-bad sample {} 向量化已提交", sample_id);
            }
            Ok(r) => tracing::warn!(
                "auto page-bad sample {} 向量化非 2xx: {}",
                sample_id,
                r.status()
            ),
            Err(e) => tracing::warn!(
                "auto page-bad sample {} 向量化调用失败: {}",
                sample_id,
                e
            ),
        }
    });
}
