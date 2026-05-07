//! B.3 反向飞轮 RAG 样例库 CRUD（仅 admin 可访问）
//!
//! 路由（main.rs 注册）：
//!   GET    /api/code-samples                列表（含 tech_stack / status / source_team / keyword / page 过滤）
//!   GET    /api/code-samples/:id            详情
//!   PUT    /api/code-samples/:id            编辑（含 status 流转）
//!   DELETE /api/code-samples/:id            删除（物理删，保留性诉求请用 reject）
//!   POST   /api/code-samples/:id/approve    审核通过（状态 → approved）
//!   POST   /api/code-samples/:id/reject     审核拒绝（状态 → rejected）
//!   POST   /api/code-samples                手动入库（冷启动种子用；自动调 Python agent 向量化）
//!
//! 入库 → 向量化流程：
//!   1. backend INSERT row（状态由 caller 决定，默认 pending）
//!   2. 异步 spawn 调 Python `/internal/index-code-sample`，传 sample_id + summary_text
//!   3. Python 把 summary embedding 写回 code_samples.embedding 列
//!
//! D4 决策：检索时不按 source_team 过滤，但管理界面允许按 source_team 筛
//! D3 决策：采纳→入库默认 pending（系统配置可切到 approved）；审核通过才进入飞轮检索

use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use sea_orm::{
    ActiveModelTrait, ColumnTrait, ConnectionTrait, DatabaseConnection, EntityTrait,
    IntoActiveModel, PaginatorTrait, QueryFilter, QueryOrder, QuerySelect, Set, Statement,
};
use serde::Deserialize;
use serde_json::{json, Value};

use crate::entity::{code_sample, code_sample_audit, user};
use crate::utils::jwt;
use crate::AppState;

// ───────────────────────────── helpers

/// 返回 user::Model，方便 handler 拿 id 写 audit（而不是再查一次 DB）。
async fn require_admin(
    state: &AppState,
    auth_user: &jwt::AuthUser,
) -> Result<user::Model, (StatusCode, Json<serde_json::Value>)> {
    let u = user::Entity::find()
        .filter(user::Column::Username.eq(&auth_user.username))
        .one(&state.db)
        .await
        .map_err(|e| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({"error": format!("DB error: {}", e)})),
            )
        })?
        .ok_or_else(|| (StatusCode::UNAUTHORIZED, Json(json!({"error": "用户不存在"}))))?;
    if !u.is_admin {
        return Err((
            StatusCode::FORBIDDEN,
            Json(json!({"error": "RAG 样例库管理仅限管理员", "required_role": "admin"})),
        ));
    }
    Ok(u)
}

/// 写一条 audit 日志。全部 Phase 0+ 的状态变更路径都走这里。
///
/// - 失败仅日志，不抛到 handler（审计表挂掉不应阻断业务）
/// - before/after 只存"本次动作相关的字段差异"，不存整行快照（防止 JSONB 膨胀）
/// - operator_kind: "admin"（人工）/ "system"（backend 自动）/ "llm_judge"（评委回调）
pub(crate) async fn record_audit(
    db: &DatabaseConnection,
    sample_id: i32,
    operator_id: Option<i32>,
    operator_kind: &str,
    action: &str,
    before: Option<Value>,
    after: Option<Value>,
    note: Option<String>,
) {
    let active = code_sample_audit::ActiveModel {
        sample_id: Set(sample_id),
        operator_id: Set(operator_id),
        operator_kind: Set(operator_kind.to_string()),
        action: Set(action.to_string()),
        before_json: Set(before),
        after_json: Set(after),
        note: Set(note),
        created_at: Set(chrono::Local::now().naive_local()),
        ..Default::default()
    };
    if let Err(e) = active.insert(db).await {
        tracing::warn!(
            "记录 code_sample_audit 失败 sample={} action={} err={}",
            sample_id,
            action,
            e
        );
    }
}

/// 拼接用于向量化的文本：amis 摘要在前（用户描述更重要），代码摘要其次。
fn build_summary_text(sample: &code_sample::Model) -> String {
    let parts: Vec<&str> = [
        sample.amis_json_summary.as_deref().unwrap_or("").trim(),
        sample.code_summary.as_deref().unwrap_or("").trim(),
    ]
    .into_iter()
    .filter(|s| !s.is_empty())
    .collect();
    if parts.is_empty() {
        // 最坏情况兜底：用 full_amis_json 截断
        sample.full_amis_json.chars().take(1000).collect()
    } else {
        parts.join("\n---\n")
    }
}

/// fire-and-forget：让 Python agent 把这条样例向量化（写回 embedding 列）。
/// 失败只打 warn 日志，不影响主流程（用户审核界面会显示 embedding 列为空）。
fn spawn_vectorize(state: &AppState, sample_id: i32, summary_text: String) {
    let agent_url =
        std::env::var("AGENT_URL").unwrap_or_else(|_| "http://localhost:8000".to_string());
    let internal_key = std::env::var("INTERNAL_API_KEY").unwrap_or_default();
    let http_client = state.http_client.clone();
    tokio::spawn(async move {
        let resp = http_client
            .post(format!("{}/internal/index-code-sample", agent_url))
            .header("X-Internal-Key", &internal_key)
            .json(&json!({
                "sample_id": sample_id,
                "summary_text": summary_text,
            }))
            .timeout(std::time::Duration::from_secs(30))
            .send()
            .await;
        match resp {
            Ok(r) if r.status().is_success() => {
                tracing::info!("code_sample {} 向量化已提交", sample_id);
            }
            Ok(r) => tracing::warn!(
                "code_sample {} 向量化返回非 2xx: {}",
                sample_id,
                r.status()
            ),
            Err(e) => tracing::warn!("code_sample {} 向量化调用失败: {}", sample_id, e),
        }
    });
}

// ───────────────────────────── list

#[derive(Debug, Deserialize)]
pub struct ListQuery {
    pub status: Option<String>,
    pub tech_stack: Option<String>,
    pub source_team: Option<String>,
    pub keyword: Option<String>,
    pub page: Option<u64>,
    pub page_size: Option<u64>,
}

pub async fn list_code_samples(
    State(state): State<AppState>,
    auth: jwt::AuthUser,
    Query(q): Query<ListQuery>,
) -> impl IntoResponse {
    if let Err(e) = require_admin(&state, &auth).await {
        return e.into_response();
    }
    let page = q.page.unwrap_or(1).max(1);
    let page_size = q.page_size.unwrap_or(20).clamp(1, 100);

    let mut select = code_sample::Entity::find();
    if let Some(s) = &q.status {
        if !s.is_empty() {
            select = select.filter(code_sample::Column::Status.eq(s));
        }
    }
    if let Some(ts) = &q.tech_stack {
        if !ts.is_empty() {
            select = select.filter(code_sample::Column::TechStack.eq(ts));
        }
    }
    if let Some(team) = &q.source_team {
        if !team.is_empty() {
            select = select.filter(code_sample::Column::SourceTeam.eq(team));
        }
    }
    if let Some(kw) = &q.keyword {
        let kw = kw.trim();
        if !kw.is_empty() {
            let pat = format!("%{}%", kw);
            select = select.filter(
                code_sample::Column::AmisJsonSummary
                    .like(&pat)
                    .or(code_sample::Column::CodeSummary.like(&pat)),
            );
        }
    }

    // 排序：pending 在前（待审优先），其次按 created_at desc
    let paginator = select
        .order_by_asc(code_sample::Column::Status) // approved < pending < rejected 字母序：approved 先；pending 在中
        .order_by_desc(code_sample::Column::CreatedAt)
        .paginate(&state.db, page_size);

    let total = match paginator.num_items().await {
        Ok(t) => t,
        Err(e) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({"error": format!("count failed: {e}")})),
            )
                .into_response()
        }
    };
    let rows = match paginator.fetch_page(page - 1).await {
        Ok(r) => r,
        Err(e) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({"error": format!("fetch failed: {e}")})),
            )
                .into_response()
        }
    };

    // 列表里不返回 full_amis_json / full_code（太大，详情页再拉）
    // Phase 0+：追加 thumbs/rating/verdict/negative 字段，前端可按需展示
    let items: Vec<serde_json::Value> = rows
        .into_iter()
        .map(|r| {
            json!({
                "id": r.id,
                "tech_stack": r.tech_stack,
                "source_team": r.source_team,
                "amis_json_summary": r.amis_json_summary,
                "code_summary": r.code_summary,
                "status": r.status,
                "hit_count": r.hit_count,
                "source_task_id": r.source_task_id,
                "created_at": r.created_at,
                "updated_at": r.updated_at,
                "thumbs_up": r.thumbs_up,
                "thumbs_down": r.thumbs_down,
                "rating": r.rating,
                "rating_at": r.rating_at,
                "quality_verdict": r.quality_verdict,
                "quality_judge_at": r.quality_judge_at,
                "quality_judge_model": r.quality_judge_model,
                "is_negative": r.is_negative,
                "negative_kind": r.negative_kind,
            })
        })
        .collect();

    Json(json!({
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
    }))
    .into_response()
}

// ───────────────────────────── detail

pub async fn get_code_sample(
    State(state): State<AppState>,
    auth: jwt::AuthUser,
    Path(id): Path<i32>,
) -> impl IntoResponse {
    if let Err(e) = require_admin(&state, &auth).await {
        return e.into_response();
    }
    match code_sample::Entity::find_by_id(id).one(&state.db).await {
        Ok(Some(m)) => Json(m).into_response(),
        Ok(None) => (StatusCode::NOT_FOUND, Json(json!({"error": "样例不存在"}))).into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({"error": format!("DB error: {e}")})),
        )
            .into_response(),
    }
}

// ───────────────────────────── create (手动入库 / 冷启动种子)

#[derive(Debug, Deserialize)]
pub struct CreateBody {
    pub tech_stack: String,
    #[serde(default = "default_source_team")]
    pub source_team: String,
    pub amis_json_summary: Option<String>,
    pub code_summary: Option<String>,
    pub full_amis_json: String,
    pub full_code: String,
    /// 默认 pending；冷启动可传 "approved" 直接入飞轮
    #[serde(default = "default_status")]
    pub status: String,
    pub source_task_id: Option<i32>,
}

fn default_source_team() -> String {
    "amis-ai".to_string()
}

fn default_status() -> String {
    "pending".to_string()
}

pub async fn create_code_sample(
    State(state): State<AppState>,
    auth: jwt::AuthUser,
    Json(body): Json<CreateBody>,
) -> impl IntoResponse {
    let admin_user = match require_admin(&state, &auth).await {
        Ok(u) => u,
        Err(e) => return e.into_response(),
    };
    if !matches!(body.status.as_str(), "pending" | "approved" | "rejected") {
        return (
            StatusCode::BAD_REQUEST,
            Json(json!({"error": "status 必须为 pending/approved/rejected"})),
        )
            .into_response();
    }
    let now = chrono::Local::now().naive_local();
    let active = code_sample::ActiveModel {
        tech_stack: Set(body.tech_stack.clone()),
        source_team: Set(body.source_team.clone()),
        amis_json_summary: Set(body.amis_json_summary.clone()),
        code_summary: Set(body.code_summary.clone()),
        full_amis_json: Set(body.full_amis_json.clone()),
        full_code: Set(body.full_code.clone()),
        status: Set(body.status.clone()),
        hit_count: Set(0),
        source_task_id: Set(body.source_task_id),
        created_at: Set(now),
        updated_at: Set(now),
        ..Default::default()
    };
    let inserted = match active.insert(&state.db).await {
        Ok(m) => m,
        Err(e) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({"error": format!("insert failed: {e}")})),
            )
                .into_response()
        }
    };

    // 异步向量化（与 history.rs 采纳模板的模式一致）
    let summary = build_summary_text(&inserted);
    spawn_vectorize(&state, inserted.id, summary);

    // 审计：手动入库起点
    record_audit(
        &state.db,
        inserted.id,
        Some(admin_user.id),
        "admin",
        "create",
        None,
        Some(json!({
            "status": inserted.status,
            "tech_stack": inserted.tech_stack,
            "source_team": inserted.source_team,
        })),
        Some("手动入库".to_string()),
    )
    .await;

    Json(json!({
        "ok": true,
        "id": inserted.id,
        "status": inserted.status,
        "notice": "已创建。向量化在后台进行（agent 日志可查），稍候刷新看 embedding 列。"
    }))
    .into_response()
}

// ───────────────────────────── update / delete

#[derive(Debug, Deserialize)]
pub struct UpdateBody {
    pub amis_json_summary: Option<String>,
    pub code_summary: Option<String>,
    pub full_amis_json: Option<String>,
    pub full_code: Option<String>,
    pub status: Option<String>,
    pub tech_stack: Option<String>,
    pub source_team: Option<String>,
    /// true 表示 summary 字段变化，需要重新向量化
    #[serde(default)]
    pub revectorize: bool,
}

pub async fn update_code_sample(
    State(state): State<AppState>,
    auth: jwt::AuthUser,
    Path(id): Path<i32>,
    Json(body): Json<UpdateBody>,
) -> impl IntoResponse {
    let admin_user = match require_admin(&state, &auth).await {
        Ok(u) => u,
        Err(e) => return e.into_response(),
    };
    let existing = match code_sample::Entity::find_by_id(id).one(&state.db).await {
        Ok(Some(m)) => m,
        Ok(None) => {
            return (StatusCode::NOT_FOUND, Json(json!({"error": "样例不存在"}))).into_response()
        }
        Err(e) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({"error": format!("DB error: {e}")})),
            )
                .into_response()
        }
    };

    // audit diff：用于 JSONB 仅存被改动的关键字段（不存 full_code，防止 audit 表爆）
    let before_status = existing.status.clone();
    let before_tech_stack = existing.tech_stack.clone();
    let before_source_team = existing.source_team.clone();

    let mut active = existing.into_active_model();
    if let Some(v) = body.amis_json_summary {
        active.amis_json_summary = Set(Some(v));
    }
    if let Some(v) = body.code_summary {
        active.code_summary = Set(Some(v));
    }
    if let Some(v) = body.full_amis_json {
        active.full_amis_json = Set(v);
    }
    if let Some(v) = body.full_code {
        active.full_code = Set(v);
    }
    if let Some(v) = body.status {
        if !matches!(v.as_str(), "pending" | "approved" | "rejected") {
            return (
                StatusCode::BAD_REQUEST,
                Json(json!({"error": "status 必须为 pending/approved/rejected"})),
            )
                .into_response();
        }
        active.status = Set(v);
    }
    if let Some(v) = body.tech_stack {
        active.tech_stack = Set(v);
    }
    if let Some(v) = body.source_team {
        active.source_team = Set(v);
    }
    active.updated_at = Set(chrono::Local::now().naive_local());

    let updated = match active.update(&state.db).await {
        Ok(m) => m,
        Err(e) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({"error": format!("update failed: {e}")})),
            )
                .into_response()
        }
    };

    if body.revectorize {
        let summary = build_summary_text(&updated);
        spawn_vectorize(&state, updated.id, summary);
    }

    // 审计：字段改动，仅记 status/tech_stack/source_team 三个稳定标识（全量 diff 太大）
    let before_diff = json!({
        "status": before_status,
        "tech_stack": before_tech_stack,
        "source_team": before_source_team,
    });
    let after_diff = json!({
        "status": updated.status,
        "tech_stack": updated.tech_stack,
        "source_team": updated.source_team,
    });
    // 仅当真有变更时记录，避免纯编辑正文时也刷审计
    let changed = before_diff != after_diff;
    record_audit(
        &state.db,
        updated.id,
        Some(admin_user.id),
        "admin",
        if changed { "update" } else { "update" },
        if changed { Some(before_diff) } else { None },
        Some(after_diff),
        if body.revectorize {
            Some("含重新向量化".to_string())
        } else {
            None
        },
    )
    .await;

    Json(json!({"ok": true, "sample": updated})).into_response()
}

pub async fn delete_code_sample(
    State(state): State<AppState>,
    auth: jwt::AuthUser,
    Path(id): Path<i32>,
) -> impl IntoResponse {
    if let Err(e) = require_admin(&state, &auth).await {
        return e.into_response();
    }
    match code_sample::Entity::delete_by_id(id).exec(&state.db).await {
        Ok(res) if res.rows_affected > 0 => {
            Json(json!({"ok": true, "id": id})).into_response()
        }
        Ok(_) => (StatusCode::NOT_FOUND, Json(json!({"error": "样例不存在"}))).into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({"error": format!("delete failed: {e}")})),
        )
            .into_response(),
    }
}

// ───────────────────────────── approve / reject

/// set_status 负责"状态变更 + audit 记录"，是 approve / reject 的统一后端。
///
/// action 传入："approve" / "reject" / "mark_negative" / "unmark_negative" 等，
/// 用于 audit 表区分语义（光看 status=rejected 分不清是审核拒还是标负例）。
async fn set_status(
    state: &AppState,
    id: i32,
    new_status: &str,
    operator_id: Option<i32>,
    action: &str,
    note: Option<String>,
) -> Result<code_sample::Model, (StatusCode, Json<serde_json::Value>)> {
    let existing = code_sample::Entity::find_by_id(id)
        .one(&state.db)
        .await
        .map_err(|e| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({"error": format!("DB error: {e}")})),
            )
        })?
        .ok_or_else(|| (StatusCode::NOT_FOUND, Json(json!({"error": "样例不存在"}))))?;
    let old_status = existing.status.clone();
    let mut active = existing.into_active_model();
    active.status = Set(new_status.to_string());
    active.updated_at = Set(chrono::Local::now().naive_local());
    let updated = active
        .update(&state.db)
        .await
        .map_err(|e| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({"error": format!("update failed: {e}")})),
            )
        })?;

    record_audit(
        &state.db,
        id,
        operator_id,
        "admin",
        action,
        Some(json!({ "status": old_status })),
        Some(json!({ "status": new_status })),
        note,
    )
    .await;

    Ok(updated)
}

pub async fn approve_code_sample(
    State(state): State<AppState>,
    auth: jwt::AuthUser,
    Path(id): Path<i32>,
) -> impl IntoResponse {
    let admin_user = match require_admin(&state, &auth).await {
        Ok(u) => u,
        Err(e) => return e.into_response(),
    };
    match set_status(&state, id, "approved", Some(admin_user.id), "approve", None).await {
        Ok(m) => Json(json!({"ok": true, "sample": m})).into_response(),
        Err(e) => e.into_response(),
    }
}

pub async fn reject_code_sample(
    State(state): State<AppState>,
    auth: jwt::AuthUser,
    Path(id): Path<i32>,
) -> impl IntoResponse {
    let admin_user = match require_admin(&state, &auth).await {
        Ok(u) => u,
        Err(e) => return e.into_response(),
    };
    match set_status(&state, id, "rejected", Some(admin_user.id), "reject", None).await {
        Ok(m) => Json(json!({"ok": true, "sample": m})).into_response(),
        Err(e) => e.into_response(),
    }
}

// ══════════════════════════════════════════════════════════════════════════════
// Phase 0 新增：/stats · /pending-count · /:id/audit
// Phase 1 新增：/:id/feedback · /:id/rating
// Phase 4 新增：/:id/mark-negative · /:id/unmark-negative
// ══════════════════════════════════════════════════════════════════════════════

// ─────────────────────── /stats（顶部统计卡片用）───────────────────────

/// 返回 `{pending, approved, rejected, negative, rated_count, avg_rating,
///        judge_covered, judge_good_pct, total}`。
///
/// 单条聚合查询直查 PG，毫秒级返回，不做服务端缓存。
pub async fn stats(
    State(state): State<AppState>,
    auth: jwt::AuthUser,
) -> impl IntoResponse {
    if let Err(e) = require_admin(&state, &auth).await {
        return e.into_response();
    }

    // 单条聚合查询（让 PG 一次扫完，避免多次 round-trip）
    let stmt = Statement::from_string(
        state.db.get_database_backend(),
        r#"
        SELECT
          COUNT(*) AS total,
          COUNT(*) FILTER (WHERE status='pending')        AS pending,
          COUNT(*) FILTER (WHERE status='approved')       AS approved,
          COUNT(*) FILTER (WHERE status='rejected')       AS rejected,
          COUNT(*) FILTER (WHERE is_negative = TRUE)      AS negative,
          COUNT(*) FILTER (WHERE rating IS NOT NULL)      AS rated_count,
          AVG(rating) FILTER (WHERE rating IS NOT NULL)   AS avg_rating,
          COUNT(*) FILTER (WHERE quality_verdict IS NOT NULL) AS judge_covered,
          COUNT(*) FILTER (WHERE quality_verdict='good') AS judge_good,
          SUM(thumbs_up)                                  AS thumbs_up_total,
          SUM(thumbs_down)                                AS thumbs_down_total
        FROM code_samples
        "#
        .to_string(),
    );
    match state.db.query_one(stmt).await {
        Ok(Some(row)) => {
            // try_get 对 COUNT/SUM 默认 i64；AVG 对 REAL 列返回 f64（Postgres 行为）
            let total: i64 = row.try_get("", "total").unwrap_or(0);
            let pending: i64 = row.try_get("", "pending").unwrap_or(0);
            let approved: i64 = row.try_get("", "approved").unwrap_or(0);
            let rejected: i64 = row.try_get("", "rejected").unwrap_or(0);
            let negative: i64 = row.try_get("", "negative").unwrap_or(0);
            let rated_count: i64 = row.try_get("", "rated_count").unwrap_or(0);
            let avg_rating: Option<f64> = row.try_get("", "avg_rating").ok();
            let judge_covered: i64 = row.try_get("", "judge_covered").unwrap_or(0);
            let judge_good: i64 = row.try_get("", "judge_good").unwrap_or(0);
            let thumbs_up_total: Option<i64> = row.try_get("", "thumbs_up_total").ok();
            let thumbs_down_total: Option<i64> = row.try_get("", "thumbs_down_total").ok();

            let judge_good_pct = if judge_covered > 0 {
                Some((judge_good as f64) / (judge_covered as f64))
            } else {
                None
            };
            Json(json!({
                "total": total,
                "pending": pending,
                "approved": approved,
                "rejected": rejected,
                "negative": negative,
                "rated_count": rated_count,
                "avg_rating": avg_rating,
                "judge_covered": judge_covered,
                "judge_good": judge_good,
                "judge_good_pct": judge_good_pct,
                "thumbs_up_total": thumbs_up_total.unwrap_or(0),
                "thumbs_down_total": thumbs_down_total.unwrap_or(0),
            }))
            .into_response()
        }
        Ok(None) => Json(json!({ "total": 0 })).into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({ "error": format!("stats failed: {e}") })),
        )
            .into_response(),
    }
}

/// 菜单 Badge 轻量接口：只返回 `{pending: N}`，前端按 rag.pending_badge.poll_interval_sec 轮询。
pub async fn pending_count(
    State(state): State<AppState>,
    auth: jwt::AuthUser,
) -> impl IntoResponse {
    if let Err(e) = require_admin(&state, &auth).await {
        return e.into_response();
    }
    let cnt = code_sample::Entity::find()
        .filter(code_sample::Column::Status.eq("pending"))
        .count(&state.db)
        .await
        .unwrap_or(0);
    Json(json!({ "pending": cnt })).into_response()
}

// ─────────────────────── /:id/audit（审计 timeline）───────────────────────

pub async fn list_audit(
    State(state): State<AppState>,
    auth: jwt::AuthUser,
    Path(id): Path<i32>,
) -> impl IntoResponse {
    if let Err(e) = require_admin(&state, &auth).await {
        return e.into_response();
    }
    match code_sample_audit::Entity::find()
        .filter(code_sample_audit::Column::SampleId.eq(id))
        .order_by_desc(code_sample_audit::Column::CreatedAt)
        .limit(200)
        .all(&state.db)
        .await
    {
        Ok(rows) => Json(json!({ "items": rows })).into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({ "error": format!("DB error: {e}") })),
        )
            .into_response(),
    }
}

// ─────────────────────── /:id/feedback（Phase 1 thumbs）───────────────────────

#[derive(Debug, Deserialize)]
pub struct FeedbackBody {
    /// "up" | "down"
    pub kind: String,
}

pub async fn submit_feedback(
    State(state): State<AppState>,
    auth: jwt::AuthUser,
    Path(id): Path<i32>,
    Json(body): Json<FeedbackBody>,
) -> impl IntoResponse {
    let admin_user = match require_admin(&state, &auth).await {
        Ok(u) => u,
        Err(e) => return e.into_response(),
    };
    // 原子 +1：用 SQL UPDATE 而不是 load→mutate→save，避免并发丢计数
    let (column, action) = match body.kind.as_str() {
        "up" => ("thumbs_up", "thumbs_up"),
        "down" => ("thumbs_down", "thumbs_down"),
        _ => {
            return (
                StatusCode::BAD_REQUEST,
                Json(json!({"error": "kind 必须为 up 或 down"})),
            )
                .into_response()
        }
    };
    let stmt = Statement::from_sql_and_values(
        state.db.get_database_backend(),
        &format!(
            "UPDATE code_samples SET {column} = {column} + 1, updated_at = NOW() WHERE id = $1 \
             RETURNING {column}"
        ),
        [id.into()],
    );
    match state.db.query_one(stmt).await {
        Ok(Some(row)) => {
            let new_val: i32 = row.try_get("", column).unwrap_or(0);
            record_audit(
                &state.db,
                id,
                Some(admin_user.id),
                "admin",
                action,
                None,
                Some(json!({ column: new_val })),
                None,
            )
            .await;
            Json(json!({ "ok": true, "column": column, "value": new_val })).into_response()
        }
        Ok(None) => (StatusCode::NOT_FOUND, Json(json!({ "error": "样例不存在" }))).into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({ "error": format!("update failed: {e}") })),
        )
            .into_response(),
    }
}

// ─────────────────────── /:id/rating（Phase 1 人工 0-5 星）───────────────────────

#[derive(Debug, Deserialize)]
pub struct RatingBody {
    /// 0-5 浮点；传 null 表示清除评分
    pub rating: Option<f32>,
    pub note: Option<String>,
}

pub async fn submit_rating(
    State(state): State<AppState>,
    auth: jwt::AuthUser,
    Path(id): Path<i32>,
    Json(body): Json<RatingBody>,
) -> impl IntoResponse {
    let admin_user = match require_admin(&state, &auth).await {
        Ok(u) => u,
        Err(e) => return e.into_response(),
    };
    if let Some(r) = body.rating {
        if !(0.0..=5.0).contains(&r) {
            return (
                StatusCode::BAD_REQUEST,
                Json(json!({"error": "rating 必须在 0-5 之间"})),
            )
                .into_response();
        }
    }
    let existing = match code_sample::Entity::find_by_id(id).one(&state.db).await {
        Ok(Some(m)) => m,
        Ok(None) => {
            return (StatusCode::NOT_FOUND, Json(json!({"error": "样例不存在"}))).into_response()
        }
        Err(e) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({"error": format!("DB error: {e}")})),
            )
                .into_response()
        }
    };
    let old_rating = existing.rating;
    let now = chrono::Local::now().naive_local();
    let mut active = existing.into_active_model();
    active.rating = Set(body.rating);
    active.rating_note = Set(body.note.clone());
    active.rating_by = Set(Some(admin_user.id));
    active.rating_at = Set(Some(now));
    active.updated_at = Set(now);
    let updated = match active.update(&state.db).await {
        Ok(m) => m,
        Err(e) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({"error": format!("update failed: {e}")})),
            )
                .into_response()
        }
    };
    record_audit(
        &state.db,
        id,
        Some(admin_user.id),
        "admin",
        "rate",
        Some(json!({ "rating": old_rating })),
        Some(json!({ "rating": updated.rating })),
        body.note.clone(),
    )
    .await;
    Json(json!({ "ok": true, "sample": updated })).into_response()
}

// ─────────────────────── /:id/mark-negative · /:id/unmark-negative（Phase 4）───────────────────────

#[derive(Debug, Deserialize)]
pub struct MarkNegativeBody {
    /// structural / stylistic / full；null 时 unmark
    pub negative_kind: Option<String>,
    pub rejection_reason: Option<String>,
    /// 同时把 status 置为 rejected（默认 true）
    #[serde(default = "default_true")]
    pub also_reject: bool,
}

fn default_true() -> bool {
    true
}

pub async fn mark_negative(
    State(state): State<AppState>,
    auth: jwt::AuthUser,
    Path(id): Path<i32>,
    Json(body): Json<MarkNegativeBody>,
) -> impl IntoResponse {
    let admin_user = match require_admin(&state, &auth).await {
        Ok(u) => u,
        Err(e) => return e.into_response(),
    };
    // 合法 kind：structural / stylistic / full（由前端下拉保证，后端兜底校验）
    if let Some(k) = &body.negative_kind {
        if !matches!(k.as_str(), "structural" | "stylistic" | "full") {
            return (
                StatusCode::BAD_REQUEST,
                Json(json!({"error": "negative_kind 必须为 structural/stylistic/full"})),
            )
                .into_response();
        }
    }
    let existing = match code_sample::Entity::find_by_id(id).one(&state.db).await {
        Ok(Some(m)) => m,
        Ok(None) => {
            return (StatusCode::NOT_FOUND, Json(json!({"error": "样例不存在"}))).into_response()
        }
        Err(e) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({"error": format!("DB error: {e}")})),
            )
                .into_response()
        }
    };
    let old_is_neg = existing.is_negative;
    let old_kind = existing.negative_kind.clone();
    let old_status = existing.status.clone();
    let mut active = existing.into_active_model();
    active.is_negative = Set(true);
    active.negative_kind = Set(body.negative_kind.clone());
    active.rejection_reason = Set(body.rejection_reason.clone());
    if body.also_reject {
        active.status = Set("rejected".to_string());
    }
    active.updated_at = Set(chrono::Local::now().naive_local());
    let updated = match active.update(&state.db).await {
        Ok(m) => m,
        Err(e) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({"error": format!("update failed: {e}")})),
            )
                .into_response()
        }
    };
    record_audit(
        &state.db,
        id,
        Some(admin_user.id),
        "admin",
        "mark_negative",
        Some(json!({
            "is_negative": old_is_neg,
            "negative_kind": old_kind,
            "status": old_status,
        })),
        Some(json!({
            "is_negative": updated.is_negative,
            "negative_kind": updated.negative_kind,
            "status": updated.status,
        })),
        body.rejection_reason.clone(),
    )
    .await;
    Json(json!({ "ok": true, "sample": updated })).into_response()
}

// ─────────────────────── /:id/score-async · /batch-score（Phase 2）───────────────────────

/// 手动触发单条样例的 AI 评分（异步，立刻返回 queued 状态）。
pub async fn score_sample_async(
    State(state): State<AppState>,
    auth: jwt::AuthUser,
    Path(id): Path<i32>,
) -> impl IntoResponse {
    let admin_user = match require_admin(&state, &auth).await {
        Ok(u) => u,
        Err(e) => return e.into_response(),
    };
    // 确认样例存在
    let exists = code_sample::Entity::find_by_id(id)
        .one(&state.db)
        .await
        .ok()
        .flatten()
        .is_some();
    if !exists {
        return (StatusCode::NOT_FOUND, Json(json!({ "error": "样例不存在" }))).into_response();
    }
    // 记一条"请求触发"的 audit（操作方是 admin；实际 judge 完成后还会再写一条 operator_kind=llm_judge）
    record_audit(
        &state.db,
        id,
        Some(admin_user.id),
        "admin",
        "judge",
        None,
        Some(json!({ "triggered": true, "mode": "manual" })),
        Some("admin 手动触发 AI 评分".to_string()),
    )
    .await;
    crate::services::quality_judge::spawn_judge_for_sample(state.clone(), id, "manual");
    Json(json!({
        "ok": true,
        "sample_id": id,
        "status": "queued",
        "notice": "已排队。完成后通过刷新或 /audit 查看结果；如配置 disabled/超预算 则 skip。",
    }))
    .into_response()
}

#[derive(Debug, Deserialize)]
pub struct BatchScoreBody {
    /// 指定 ID 列表；与 scope 二选一
    #[serde(default)]
    pub ids: Vec<i32>,
    /// "pending_only" / "all_unscored"
    pub scope: Option<String>,
    /// 本批最多处理多少条（兜底上限，防手抖把全库都排上）
    #[serde(default = "default_batch_limit")]
    pub limit: u64,
}

fn default_batch_limit() -> u64 {
    20
}

pub async fn batch_score(
    State(state): State<AppState>,
    auth: jwt::AuthUser,
    Json(body): Json<BatchScoreBody>,
) -> impl IntoResponse {
    let admin_user = match require_admin(&state, &auth).await {
        Ok(u) => u,
        Err(e) => return e.into_response(),
    };

    // 取待评样本 ID 列表
    let ids_to_score: Vec<i32> = if !body.ids.is_empty() {
        body.ids
            .iter()
            .take(body.limit as usize)
            .copied()
            .collect()
    } else {
        let mut select = code_sample::Entity::find();
        match body.scope.as_deref() {
            Some("pending_only") => {
                select = select.filter(code_sample::Column::Status.eq("pending"));
            }
            Some("all_unscored") => {
                select = select.filter(code_sample::Column::QualityVerdict.is_null());
            }
            _ => {
                return (
                    StatusCode::BAD_REQUEST,
                    Json(json!({"error": "必须传 ids 或 scope=pending_only/all_unscored"})),
                )
                    .into_response();
            }
        }
        match select
            .order_by_asc(code_sample::Column::Id)
            .limit(body.limit)
            .all(&state.db)
            .await
        {
            Ok(rows) => rows.into_iter().map(|r| r.id).collect(),
            Err(e) => {
                return (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(json!({"error": format!("DB error: {e}")})),
                )
                    .into_response();
            }
        }
    };

    // 逐条 spawn（内部 semaphore 限流；budget 超了自动 skip）
    for id in &ids_to_score {
        record_audit(
            &state.db,
            *id,
            Some(admin_user.id),
            "admin",
            "judge",
            None,
            Some(json!({ "triggered": true, "mode": "batch" })),
            Some("admin 批量触发 AI 评分".to_string()),
        )
        .await;
        crate::services::quality_judge::spawn_judge_for_sample(state.clone(), *id, "batch");
    }

    Json(json!({
        "ok": true,
        "queued": ids_to_score.len(),
        "sample_ids": ids_to_score,
        "notice": "已排队。预算上限由 rag.judge.budget_per_day 决定；超额的样本会 skip 审计不跑 LLM。",
    }))
    .into_response()
}

// ─────────────────────── /ab-report（Phase 3/4 配置开关 A/B 对比）───────────────────────

#[derive(Debug, Deserialize)]
pub struct AbReportQuery {
    /// A 段起止（ISO 8601，如 "2026-04-10T00:00:00"）
    pub from_a: String,
    pub to_a: String,
    /// B 段起止；不传时只返回 A 段单段指标
    pub from_b: Option<String>,
    pub to_b: Option<String>,
}

/// 时段指标聚合：从 project_generation_task 表算 task 总数 / 成功率 / 采纳率 / 平均修复次数。
/// 这是 Phase 3 (启权重 / verdict 硬过滤) 与 Phase 4 (启负例) 的核心 A/B 信号源。
async fn query_bucket(state: &AppState, from: &str, to: &str) -> Result<Value, String> {
    // 用参数化 SQL 防注入；时间字符串由 PG 自动解析为 timestamp（异常会返回 SQL 错误）
    let stmt = Statement::from_sql_and_values(
        state.db.get_database_backend(),
        r#"
        SELECT
          COUNT(*)                                                   AS total,
          COUNT(*) FILTER (WHERE status='succeeded')                 AS succeeded,
          COUNT(*) FILTER (WHERE status='failed')                    AS failed,
          COUNT(*) FILTER (WHERE status IN ('pending','running','waiting_user')) AS in_flight,
          COUNT(*) FILTER (WHERE adopted_at IS NOT NULL)             AS adopted,
          COALESCE(AVG(fix_attempts) FILTER (WHERE status IN ('succeeded','failed')), 0) AS avg_fix_attempts
        FROM project_generation_task
        WHERE created_at >= $1::timestamp
          AND created_at <  $2::timestamp
        "#,
        [from.into(), to.into()],
    );
    let row = state
        .db
        .query_one(stmt)
        .await
        .map_err(|e| format!("时段查询失败（请检查时间格式 ISO 8601）：{e}"))?
        .ok_or_else(|| "时段无数据".to_string())?;

    let total: i64 = row.try_get("", "total").unwrap_or(0);
    let succeeded: i64 = row.try_get("", "succeeded").unwrap_or(0);
    let failed: i64 = row.try_get("", "failed").unwrap_or(0);
    let in_flight: i64 = row.try_get("", "in_flight").unwrap_or(0);
    let adopted: i64 = row.try_get("", "adopted").unwrap_or(0);
    // AVG 在 SeaORM 里映射成 BigDecimal/f64 视驱动而异；用 try_get<f64> 兜底
    let avg_fix: f64 = row.try_get::<f64>("", "avg_fix_attempts").unwrap_or(0.0);

    let succeed_rate = if total > 0 { succeeded as f64 / total as f64 } else { 0.0 };
    let fail_rate = if total > 0 { failed as f64 / total as f64 } else { 0.0 };
    // adopt 率分母是"已成功的任务"（失败的任务无从采纳，算分母会污染信号）
    let adopt_rate = if succeeded > 0 { adopted as f64 / succeeded as f64 } else { 0.0 };

    Ok(json!({
        "from": from,
        "to": to,
        "total": total,
        "succeeded": succeeded,
        "failed": failed,
        "in_flight": in_flight,
        "adopted": adopted,
        "avg_fix_attempts": avg_fix,
        "succeed_rate": succeed_rate,
        "fail_rate": fail_rate,
        "adopt_rate": adopt_rate,
    }))
}

/// `GET /api/code-samples/ab-report?from_a=...&to_a=...&from_b=...&to_b=...`
///
/// 用途：比较"配置变更前 vs 后"两段时间窗的 RAG 飞轮 health。
///   - 单段（不传 b）：返回 `{a, b: null, diff: null}`
///   - 双段：返回 `{a, b, diff: {succeed_rate, adopt_rate, fail_rate, avg_fix_attempts}}`
///
/// 评审建议：这只是诊断工具，不能自动判定"开关是否值得保留"——admin 仍需结合定性观察。
pub async fn ab_report(
    State(state): State<AppState>,
    auth: jwt::AuthUser,
    Query(q): Query<AbReportQuery>,
) -> impl IntoResponse {
    if let Err(e) = require_admin(&state, &auth).await {
        return e.into_response();
    }
    let a = match query_bucket(&state, &q.from_a, &q.to_a).await {
        Ok(v) => v,
        Err(e) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(json!({ "error": e })),
            )
                .into_response()
        }
    };
    let b = if let (Some(fb), Some(tb)) = (q.from_b.as_ref(), q.to_b.as_ref()) {
        match query_bucket(&state, fb, tb).await {
            Ok(v) => Some(v),
            Err(e) => {
                return (
                    StatusCode::BAD_REQUEST,
                    Json(json!({ "error": e })),
                )
                    .into_response()
            }
        }
    } else {
        None
    };
    let diff = b.as_ref().map(|b_v| {
        let f = |key: &str| {
            (b_v.get(key).and_then(|v| v.as_f64()).unwrap_or(0.0))
                - (a.get(key).and_then(|v| v.as_f64()).unwrap_or(0.0))
        };
        // total / succeeded / 等也给个绝对差，前端做表格用
        let abs_i = |key: &str| {
            (b_v.get(key).and_then(|v| v.as_i64()).unwrap_or(0))
                - (a.get(key).and_then(|v| v.as_i64()).unwrap_or(0))
        };
        json!({
            "succeed_rate": f("succeed_rate"),
            "adopt_rate": f("adopt_rate"),
            "fail_rate": f("fail_rate"),
            "avg_fix_attempts": f("avg_fix_attempts"),
            "total_delta": abs_i("total"),
            "adopted_delta": abs_i("adopted"),
        })
    });
    Json(json!({
        "a": a,
        "b": b,
        "diff": diff,
        "notice": "diff 是 B − A（正数 = B 段更高）；adopt_rate 分母是 succeeded（避免失败任务污染信号）",
    }))
    .into_response()
}

pub async fn unmark_negative(
    State(state): State<AppState>,
    auth: jwt::AuthUser,
    Path(id): Path<i32>,
) -> impl IntoResponse {
    let admin_user = match require_admin(&state, &auth).await {
        Ok(u) => u,
        Err(e) => return e.into_response(),
    };
    let existing = match code_sample::Entity::find_by_id(id).one(&state.db).await {
        Ok(Some(m)) => m,
        Ok(None) => {
            return (StatusCode::NOT_FOUND, Json(json!({"error": "样例不存在"}))).into_response()
        }
        Err(e) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({"error": format!("DB error: {e}")})),
            )
                .into_response()
        }
    };
    let old_is_neg = existing.is_negative;
    let old_kind = existing.negative_kind.clone();
    let mut active = existing.into_active_model();
    active.is_negative = Set(false);
    active.negative_kind = Set(None);
    active.updated_at = Set(chrono::Local::now().naive_local());
    let updated = match active.update(&state.db).await {
        Ok(m) => m,
        Err(e) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({"error": format!("update failed: {e}")})),
            )
                .into_response()
        }
    };
    record_audit(
        &state.db,
        id,
        Some(admin_user.id),
        "admin",
        "unmark_negative",
        Some(json!({
            "is_negative": old_is_neg,
            "negative_kind": old_kind,
        })),
        Some(json!({
            "is_negative": updated.is_negative,
            "negative_kind": updated.negative_kind,
        })),
        None,
    )
    .await;
    Json(json!({ "ok": true, "sample": updated })).into_response()
}
