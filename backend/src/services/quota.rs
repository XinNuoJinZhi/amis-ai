//! 1.4 A.3：LLM token 成本预算服务。
//!
//! 对外暴露：
//!   - `estimate_task_cost(amis_json, extra_prompt, complexity_score)` → 预估 token 成本
//!   - `check_and_consume_quota(state, user_id, estimated)` → 预扣消耗，返回 QuotaDecision
//!
//! 设计要点：
//!   - 用户首次访问时惰性 INSERT 默认配额行（daily_budget 从 system_settings 拉默认值）
//!   - `reset_at` 距今 ≥24h → 当场 used_today=0 + 更新 reset_at（无需定时任务）
//!   - 超额行为由 `llm.quota.over_budget_action` 配置：
//!       * `downgrade`：返回 over_budget=true，主流程降级到 fast tier
//!       * `reject`：返回 over_budget=true + reject=true，主流程返回 429
//!   - 总闸 `llm.quota.enabled=false` 时直接放行（不扣额，不写库）

use chrono::{Duration, NaiveDateTime, Utc};
use sea_orm::{ActiveModelTrait, ColumnTrait, EntityTrait, IntoActiveModel, QueryFilter, Set};

use crate::entity::user_token_quota;
use crate::handlers::system_settings::read_value_or;
use crate::AppState;

/// quota 检查结果
#[derive(Debug, Clone)]
pub struct QuotaDecision {
    /// 是否超额
    pub over_budget: bool,
    /// 超额时是否拒绝任务（vs 降级）
    pub reject: bool,
    /// 当日已用 token（含本次扣的）
    pub used_today: i32,
    /// 用户日预算
    pub daily_budget: i32,
    /// 用于审计/日志的人类可读说明
    pub reason: String,
}

/// 估算一个 task 的 token 成本（粗粒度，单位：token）。
///
/// 公式：
///   amis_json 长度 / 3      （prompt 输入，1 token ≈ 3 字符英文 / 1.5 字符中文，折中按 3）
///   + extra_prompt 长度 / 3
///   + complexity_score * 50  （complexity 越高 → 生成代码越长 → output token 越多）
///   + 500 基线              （system prompt + skills + RAG 注入）
///
/// 评估仅用于 quota 预扣，不要求精准（W4 接入实际 actual_cost_tokens 时校准）。
pub fn estimate_task_cost(
    amis_json: &str,
    extra_prompt: Option<&str>,
    complexity_score: Option<f32>,
) -> i32 {
    let amis_tokens = (amis_json.len() as f32 / 3.0) as i32;
    let extra_tokens = extra_prompt
        .map(|p| (p.len() as f32 / 3.0) as i32)
        .unwrap_or(0);
    let complexity_tokens = complexity_score.unwrap_or(20.0) * 50.0;
    (amis_tokens + extra_tokens + complexity_tokens as i32 + 500).max(500)
}

/// 检查并预扣用户 quota；返回 QuotaDecision 让 caller 决定后续动作。
pub async fn check_and_consume_quota(
    state: &AppState,
    user_id: i32,
    estimated: i32,
) -> Result<QuotaDecision, String> {
    // 总闸：未启用 → 直接放行
    let enabled = read_value_or(state, "llm.quota.enabled", "false")
        .await
        .trim()
        .eq_ignore_ascii_case("true");
    if !enabled {
        return Ok(QuotaDecision {
            over_budget: false,
            reject: false,
            used_today: 0,
            daily_budget: 0,
            reason: "quota disabled".to_string(),
        });
    }

    // 默认日预算（用户首次访问时初始化）
    let default_budget: i32 = read_value_or(state, "llm.quota.default_daily_budget", "100000")
        .await
        .trim()
        .parse()
        .unwrap_or(100_000);

    // 超额行为：downgrade / reject
    let over_budget_action = read_value_or(state, "llm.quota.over_budget_action", "downgrade")
        .await
        .trim()
        .to_lowercase();
    let reject_on_over = over_budget_action == "reject";

    let now = Utc::now().naive_utc();

    // 取或创建 quota 行
    let existing = user_token_quota::Entity::find()
        .filter(user_token_quota::Column::UserId.eq(user_id))
        .one(&state.db)
        .await
        .map_err(|e| format!("查询 quota 失败: {}", e))?;

    let quota = match existing {
        Some(m) => m,
        None => {
            // 首次访问，写默认行
            let new_row = user_token_quota::ActiveModel {
                user_id: Set(user_id),
                daily_budget: Set(default_budget),
                used_today: Set(0),
                reset_at: Set(now),
                created_at: Set(now),
                updated_at: Set(now),
            };
            new_row
                .insert(&state.db)
                .await
                .map_err(|e| format!("初始化 quota 行失败: {}", e))?
        }
    };

    // 惰性 reset：reset_at 距今 ≥24h → used_today 归零
    let needs_reset = (now - quota.reset_at) >= Duration::hours(24);
    let mut used_today = if needs_reset { 0 } else { quota.used_today };
    let new_reset_at: NaiveDateTime = if needs_reset { now } else { quota.reset_at };

    let proposed = used_today.saturating_add(estimated);
    let over = proposed > quota.daily_budget;

    // 决策：超额 + reject → 不扣额；超额 + downgrade → 扣额（让任务降级跑）
    if over && reject_on_over {
        return Ok(QuotaDecision {
            over_budget: true,
            reject: true,
            used_today,
            daily_budget: quota.daily_budget,
            reason: format!(
                "over_budget: used={} + estimated={} > daily={}, action=reject",
                used_today, estimated, quota.daily_budget
            ),
        });
    }

    // 扣额：即使超额（downgrade 模式）也扣，避免连续超额任务把 used_today 拉飞
    used_today = proposed;

    let mut active = quota.into_active_model();
    active.used_today = Set(used_today);
    active.reset_at = Set(new_reset_at);
    active.updated_at = Set(now);
    let saved = active
        .update(&state.db)
        .await
        .map_err(|e| format!("更新 quota 失败: {}", e))?;

    Ok(QuotaDecision {
        over_budget: over,
        reject: false,
        used_today: saved.used_today,
        daily_budget: saved.daily_budget,
        reason: if over {
            format!(
                "over_budget: used={} > daily={}, action=downgrade",
                saved.used_today, saved.daily_budget
            )
        } else {
            format!("ok: used={}/{}", saved.used_today, saved.daily_budget)
        },
    })
}
