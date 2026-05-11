//! 任务级 LLM 选择器：对外统一入口 `select_for_task`，按 mode 分三路
//!   - manual : 用户显式指定 provider + model，仅做校验
//!   - auto   : 按复杂度 + 历史成功率自动分档
//!   - default: 沿用老 model_configs 中 code_generation / generation 的活跃配置（向后兼容）
//!
//! 另外暴露 `preview_auto` 给前端「新建任务」页面预览 auto 将选中的 provider/model，
//! 以及 `score_amis_complexity` 给单元测试直接验证评分逻辑。

use std::collections::HashMap;

use chrono::Duration;
use sea_orm::{
    ColumnTrait, ConnectionTrait, DatabaseConnection, DbBackend, EntityTrait, QueryFilter,
    Statement,
};
use serde_json::Value;

use crate::entity::{llm_provider, model_config};
use crate::services::claw_agent_client::LlmConfig;
use crate::AppState;

/// 选择结果（决策出的 provider / model 和审计字段）
#[derive(Debug, Clone)]
pub struct LlmDecision {
    pub mode: String,
    pub provider_id: i32,
    pub provider_name: String,
    pub config: LlmConfig,
    pub capability_tier: Option<String>,
    pub complexity_score: Option<f32>,
    pub reason: String,
}

/// 本模块对外的主入口：根据 mode 选出 provider + model。
///
/// 1.4 A.2：可选传 `category` + `category_confidence`，让 auto 模式按业务类别覆盖 score 决策
/// （例如 oa_form → strong，static_page → fast）。category=None 或 confidence<0.5 时保持原逻辑。
/// 1.4 A.3：可选传 `force_tier`，over_budget 降级时强制锁定档位（如 Some("fast")）。
/// 1.5 W3：可选传 `ab_variant`，B 组用 `_json_b` 覆盖表（None / "a" → 默认 `_json`）。
pub async fn select_for_task(
    state: &AppState,
    user_id: i32,
    amis_json: &str,
    payload_mode: Option<&str>,
    manual_provider_id: Option<i32>,
    manual_model: Option<&str>,
    category: Option<&str>,
    category_confidence: Option<f32>,
    force_tier: Option<&str>,
    ab_variant: Option<&str>,
) -> Result<LlmDecision, String> {
    let mode = payload_mode.unwrap_or("default");
    match mode {
        "manual" => select_manual(state, manual_provider_id, manual_model).await,
        "auto" => {
            decide_auto(state, user_id, amis_json, category, category_confidence, force_tier, ab_variant).await
        }
        _ => select_default(state).await,
    }
}

/// 「新建任务」页面的预览：不落库，纯粹跑一次 auto 决策返回结果
pub async fn preview_auto(
    state: &AppState,
    user_id: i32,
    amis_json: &str,
    category: Option<&str>,
    category_confidence: Option<f32>,
) -> Result<LlmDecision, String> {
    // 预览不参与 A/B（A/B 仅影响真实任务），传 None 让 decide_auto 走 A 组默认
    decide_auto(state, user_id, amis_json, category, category_confidence, None, None).await
}

// ============================================================
//  manual / default 分支
// ============================================================

async fn select_manual(
    state: &AppState,
    provider_id: Option<i32>,
    model_name: Option<&str>,
) -> Result<LlmDecision, String> {
    let provider_id = provider_id.ok_or_else(|| "manual 模式必须指定 provider_id".to_string())?;
    let model = model_name
        .filter(|s| !s.is_empty())
        .ok_or_else(|| "manual 模式必须指定 model_name".to_string())?;

    let provider = llm_provider::Entity::find_by_id(provider_id)
        .one(&state.db)
        .await
        .map_err(|e| format!("查询供应商失败: {}", e))?
        .ok_or_else(|| format!("供应商 {} 不存在", provider_id))?;

    if !provider.is_active {
        return Err(format!("供应商「{}」未启用", provider.name));
    }

    Ok(LlmDecision {
        mode: "manual".to_string(),
        provider_id: provider.id,
        provider_name: provider.name.clone(),
        config: LlmConfig {
            base_url: Some(provider.base_url.clone()),
            api_key: Some(provider.api_key.clone()),
            model: model.to_string(),
            protocol: provider.protocol.clone(),
        },
        capability_tier: Some(provider.capability_tier.clone()),
        complexity_score: None,
        reason: format!("manual: {}/{}", provider.name, model),
    })
}

/// 旧 model_configs 逻辑：先 code_generation，fallback 到 generation。
/// Synthetic Honey：调用方可通过 preferred_task_type 先试一个更特化的 task_type
/// （如 "skill_authoring"），miss 后再回退到现有默认顺序。
async fn select_default(state: &AppState) -> Result<LlmDecision, String> {
    for task_type in ["code_generation", "generation"] {
        if let Some(decision) = fetch_default_for_task_type(state, task_type).await {
            return Ok(decision);
        }
    }
    Err("无可用的系统默认 LLM 配置，请先在「系统设置 → 供应商管理」激活一个供应商".to_string())
}

/// Synthetic Honey：Skill 起草专用的 LLM 选择入口——带 task_type fallback 链。
/// 优先 skill_authoring → code_generation → generation，都 miss 就返回错误。
///
/// 当前实施：agent 侧直接调 `skill_authoring` task_type 走 Python `get_llm_config`；
/// 这个 Rust 入口预留给"将来 backend 自己触发 LLM 决策（比如 dry-run / 元数据探测）"的场景。
#[allow(dead_code)]
pub async fn select_for_skill_authoring(state: &AppState) -> Result<LlmDecision, String> {
    for task_type in ["skill_authoring", "code_generation", "generation"] {
        if let Some(decision) = fetch_default_for_task_type(state, task_type).await {
            return Ok(decision);
        }
    }
    Err("无可用的 LLM 配置，请先在「系统设置 → LLM 供应商」激活一个供应商".to_string())
}

/// 2026-04-25：通用 AI 对话页（左侧菜单「AI 对话」）专用 LLM 选择入口。
/// 优先 chat task_type，miss 则回落 generation。
pub async fn select_for_chat(state: &AppState) -> Result<LlmDecision, String> {
    for task_type in ["chat", "generation"] {
        if let Some(decision) = fetch_default_for_task_type(state, task_type).await {
            return Ok(decision);
        }
    }
    Err(
        "无可用的 LLM 配置，请在「系统设置 → 模型配置」给「通用对话」槽位选一个供应商和模型"
            .to_string(),
    )
}

/// 2026-04 RAG 质量闭环 Phase 2：LLM 评委专用 LLM 选择入口。
///
/// **评审建议**：quality_judge **故意**跳过 code_generation，直接 fallback 到 generation，
/// 鼓励 admin 配跨 provider 的模型（避"评委是选手"的同族偏见）。
/// 如果 admin 没配 quality_judge task_type，则用 generation 通用模型兜底。
pub async fn select_for_quality_judge(state: &AppState) -> Result<LlmDecision, String> {
    for task_type in ["quality_judge", "generation"] {
        if let Some(decision) = fetch_default_for_task_type(state, task_type).await {
            return Ok(decision);
        }
    }
    Err(
        "无可用的 LLM 配置。建议在「系统设置 → LLM 供应商」给 task_type=quality_judge 绑一个与 generation 不同 provider 的模型（跨 provider 避同族偏见）。"
            .to_string(),
    )
}

async fn fetch_default_for_task_type(state: &AppState, task_type: &str) -> Option<LlmDecision> {
    let config = model_config::Entity::find()
        .filter(model_config::Column::TaskType.eq(task_type))
        .filter(model_config::Column::IsActive.eq(true))
        .one(&state.db)
        .await
        .ok()
        .flatten()?;

    let provider = llm_provider::Entity::find_by_id(config.provider_id)
        .one(&state.db)
        .await
        .ok()
        .flatten()?;

    if !provider.is_active {
        return None;
    }

    Some(LlmDecision {
        mode: "default".to_string(),
        provider_id: provider.id,
        provider_name: provider.name.clone(),
        config: LlmConfig {
            base_url: Some(provider.base_url.clone()),
            api_key: Some(provider.api_key.clone()),
            model: config.model_name.clone(),
            protocol: provider.protocol.clone(),
        },
        capability_tier: Some(provider.capability_tier.clone()),
        complexity_score: None,
        reason: format!("default(task_type={}): {}/{}", task_type, provider.name, config.model_name),
    })
}

// ============================================================
//  auto 决策
// ============================================================

async fn decide_auto(
    state: &AppState,
    user_id: i32,
    amis_json: &str,
    category: Option<&str>,
    category_confidence: Option<f32>,
    force_tier: Option<&str>,
    ab_variant: Option<&str>,
) -> Result<LlmDecision, String> {
    let score = score_amis_complexity(amis_json);
    let mut target_tier = tier_from_score(score);

    // 1.4 A.2 / 1.5 W3：category override
    // 读 system_settings.llm.routing.category_tier_overrides_json[_b]，按 category 命中覆盖 tier
    // 置信度 < 0.5 时不参与（信号不足）；命中 __other__ / 未配置时保持原 score 决策
    // 1.5 W3：ab_variant="b" 时读 _json_b（admin 可配置成与 A 组不同），让 routing 决策按 variant 分桶
    let setting_key = if ab_variant == Some("b") {
        "llm.routing.category_tier_overrides_json_b"
    } else {
        "llm.routing.category_tier_overrides_json"
    };
    let mut override_applied: Option<(String, String)> = None; // (category, override_tier)
    if let (Some(cat), Some(conf)) = (category, category_confidence) {
        if conf >= 0.5 && cat != "__other__" {
            let raw =
                crate::handlers::system_settings::read_value_or(state, setting_key, "{}").await;
            if let Ok(map) = serde_json::from_str::<HashMap<String, String>>(&raw) {
                if let Some(override_tier) = map.get(cat) {
                    if !override_tier.is_empty() && override_tier != &target_tier {
                        override_applied =
                            Some((cat.to_string(), override_tier.clone()));
                        target_tier = match override_tier.as_str() {
                            "fast" => "fast",
                            "balanced" => "balanced",
                            "strong" => "strong",
                            "frontier" => "frontier",
                            _ => target_tier, // 容错：非法值不覆盖
                        };
                    }
                }
            }
        }
    }

    // 1.4 A.3：force_tier override（quota over_budget 时降级 fast）
    // 优先级最高，覆盖 score + category override
    if let Some(forced) = force_tier {
        match forced {
            "fast" | "balanced" | "strong" | "frontier" => {
                if forced != target_tier {
                    override_applied =
                        Some(("quota_force".to_string(), forced.to_string()));
                    target_tier = forced;
                }
            }
            _ => {} // 容错：非法值忽略
        }
    }

    let providers: Vec<llm_provider::Model> = llm_provider::Entity::find()
        .filter(llm_provider::Column::IsActive.eq(true))
        .all(&state.db)
        .await
        .map_err(|e| format!("查询供应商失败: {}", e))?;

    if providers.is_empty() {
        return Err("没有启用的 LLM 供应商，auto 模式无法决策，请先在「系统设置」里启用供应商".to_string());
    }

    let history = fetch_history_success_rates(&state.db, user_id).await.unwrap_or_default();

    // 候选：先取 target_tier 完全匹配的，若空则扩到 ±1 档
    let mut candidates: Vec<&llm_provider::Model> = providers
        .iter()
        .filter(|p| p.capability_tier == target_tier)
        .collect();

    if candidates.is_empty() {
        candidates = providers
            .iter()
            .filter(|p| tier_distance(&p.capability_tier, target_tier) <= 1)
            .collect();
    }

    if candidates.is_empty() {
        // 还是没有 → 直接取成功率最高的已启用供应商
        candidates = providers.iter().collect();
    }

    // 排序：历史成功率（未知给中性 0.6）减去与目标档位的距离惩罚
    candidates.sort_by(|a, b| {
        let sa = score_candidate(a, target_tier, &history);
        let sb = score_candidate(b, target_tier, &history);
        sb.partial_cmp(&sa).unwrap_or(std::cmp::Ordering::Equal)
    });

    let best = candidates.first().copied().ok_or_else(|| "候选供应商为空".to_string())?;

    let model_name = best.preferred_model.clone().ok_or_else(|| {
        format!(
            "供应商「{}」未配置 preferred_model；请到「供应商管理」填写默认模型",
            best.name
        )
    })?;

    let success_rate = history.get(&best.id).copied();
    let override_note = match override_applied {
        Some((cat, override_tier)) => format!(", override(category={}→{})", cat, override_tier),
        None => String::new(),
    };
    let reason = format!(
        "auto: complexity={:.1}, target_tier={}{}, picked={}({}), history_sr={}",
        score,
        target_tier,
        override_note,
        best.name,
        best.capability_tier,
        success_rate.map(|r| format!("{:.2}", r)).unwrap_or_else(|| "无历史".to_string()),
    );

    Ok(LlmDecision {
        mode: "auto".to_string(),
        provider_id: best.id,
        provider_name: best.name.clone(),
        config: LlmConfig {
            base_url: Some(best.base_url.clone()),
            api_key: Some(best.api_key.clone()),
            model: model_name,
            protocol: best.protocol.clone(),
        },
        capability_tier: Some(best.capability_tier.clone()),
        complexity_score: Some(score),
        reason,
    })
}

fn score_candidate(
    p: &llm_provider::Model,
    target_tier: &str,
    history: &HashMap<i32, f32>,
) -> f32 {
    let sr = history.get(&p.id).copied().unwrap_or(0.6);
    let penalty = tier_distance(&p.capability_tier, target_tier) as f32 * 0.15;
    sr - penalty
}

/// 档位距离：同档 0，相邻 1，跨两档 2 ...
fn tier_distance(a: &str, b: &str) -> i32 {
    let rank = |s: &str| -> i32 {
        match s {
            "fast" => 0,
            "balanced" => 1,
            "strong" => 2,
            "frontier" => 3,
            _ => 1,
        }
    };
    (rank(a) - rank(b)).abs()
}

/// 最近 30 天、status='succeeded'、llm_provider_id 非空的任务按 provider 聚合成功率；样本 <3 忽略
async fn fetch_history_success_rates(
    db: &DatabaseConnection,
    user_id: i32,
) -> Result<HashMap<i32, f32>, sea_orm::DbErr> {
    let since = chrono::Utc::now().naive_utc() - Duration::days(30);

    // 直接 SQL 聚合：同一用户、30 天内、有 llm_provider_id 的任务
    let stmt = Statement::from_sql_and_values(
        DbBackend::Postgres,
        r#"
        SELECT llm_provider_id AS provider_id,
               SUM(CASE WHEN status = 'succeeded' THEN 1 ELSE 0 END)::float / COUNT(*)::float AS success_rate,
               COUNT(*) AS total
        FROM project_generation_task
        WHERE user_id = $1
          AND created_at >= $2
          AND llm_provider_id IS NOT NULL
        GROUP BY llm_provider_id
        HAVING COUNT(*) >= 3
        "#,
        [user_id.into(), since.into()],
    );

    let rows = db.query_all(stmt).await?;
    let mut map = HashMap::new();
    for row in rows {
        let provider_id: i32 = row.try_get::<i32>("", "provider_id")?;
        let success_rate: f64 = row.try_get::<f64>("", "success_rate")?;
        map.insert(provider_id, success_rate as f32);
    }
    Ok(map)
}

// ============================================================
//  复杂度评分
// ============================================================

/// 由 amis_json 评估任务复杂度。解析失败时给一个保守中等分。
pub fn score_amis_complexity(amis_json: &str) -> f32 {
    let value: Value = match serde_json::from_str(amis_json) {
        Ok(v) => v,
        Err(_) => return 25.0,
    };

    let mut ctx = ComplexityCtx::default();
    walk(&value, 0, &mut ctx);

    (ctx.page as f32) * 5.0
        + (ctx.widget as f32) * 0.3
        + (ctx.max_depth as f32) * 2.0
        + (ctx.form as f32) * 1.5
        + (ctx.table as f32) * 2.5
        + (ctx.api as f32) * 1.0
}

#[derive(Default)]
struct ComplexityCtx {
    page: u32,
    widget: u32,
    max_depth: u32,
    form: u32,
    table: u32,
    api: u32,
}

fn walk(v: &Value, depth: u32, ctx: &mut ComplexityCtx) {
    if depth > ctx.max_depth {
        ctx.max_depth = depth;
    }
    match v {
        Value::Object(map) => {
            if let Some(Value::String(t)) = map.get("type") {
                ctx.widget += 1;
                if matches!(t.as_str(), "page" | "wizard" | "tab") {
                    ctx.page += 1;
                }
                if t == "form" || t.starts_with("input-") || t == "select" || t == "picker" {
                    ctx.form += 1;
                }
                if matches!(t.as_str(), "table" | "crud" | "list") {
                    ctx.table += 1;
                }
            }
            for (k, child) in map {
                if matches!(k.as_str(), "api" | "initApi" | "saveApi") {
                    ctx.api += 1;
                }
                walk(child, depth + 1, ctx);
            }
        }
        Value::Array(arr) => {
            for child in arr {
                walk(child, depth + 1, ctx);
            }
        }
        _ => {}
    }
}

pub fn tier_from_score(score: f32) -> &'static str {
    if score < 20.0 {
        "fast"
    } else if score < 50.0 {
        "balanced"
    } else if score < 100.0 {
        "strong"
    } else {
        "frontier"
    }
}

// ============================================================
//  单元测试
// ============================================================

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn tier_thresholds() {
        assert_eq!(tier_from_score(0.0), "fast");
        assert_eq!(tier_from_score(19.9), "fast");
        assert_eq!(tier_from_score(20.0), "balanced");
        assert_eq!(tier_from_score(49.9), "balanced");
        assert_eq!(tier_from_score(50.0), "strong");
        assert_eq!(tier_from_score(99.9), "strong");
        assert_eq!(tier_from_score(100.0), "frontier");
    }

    #[test]
    fn tier_distance_matrix() {
        assert_eq!(tier_distance("fast", "fast"), 0);
        assert_eq!(tier_distance("fast", "balanced"), 1);
        assert_eq!(tier_distance("balanced", "strong"), 1);
        assert_eq!(tier_distance("fast", "frontier"), 3);
    }

    #[test]
    fn simple_form_is_fast() {
        let json = r#"{
            "type": "page",
            "body": {
                "type": "form",
                "api": "/api/save",
                "body": [
                    {"type": "input-text", "name": "a"},
                    {"type": "input-text", "name": "b"}
                ]
            }
        }"#;
        let score = score_amis_complexity(json);
        let tier = tier_from_score(score);
        assert_eq!(tier, "fast", "expected fast, got score={} tier={}", score, tier);
    }

    #[test]
    fn medium_crud_is_balanced_or_strong() {
        let json = r#"{
            "type": "page",
            "body": {
                "type": "crud",
                "api": "/api/list",
                "initApi": "/api/init",
                "saveApi": "/api/save",
                "columns": [
                    {"type": "text", "name": "a"},
                    {"type": "text", "name": "b"},
                    {"type": "text", "name": "c"}
                ],
                "headerToolbar": [
                    {"type": "form", "body": [
                        {"type": "input-text", "name": "keyword"},
                        {"type": "select", "name": "status"}
                    ]}
                ]
            }
        }"#;
        let score = score_amis_complexity(json);
        let tier = tier_from_score(score);
        assert!(
            matches!(tier, "balanced" | "strong"),
            "expected balanced/strong, got score={} tier={}",
            score, tier,
        );
    }

    #[test]
    fn malformed_json_returns_default() {
        let score = score_amis_complexity("{not json");
        assert_eq!(score, 25.0);
    }
}

