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
    ActiveModelTrait, ColumnTrait, EntityTrait, IntoActiveModel, PaginatorTrait, QueryFilter,
    QueryOrder, QuerySelect, Set,
};
use serde::Deserialize;
use serde_json::json;

use crate::entity::{code_sample, user};
use crate::utils::jwt;
use crate::AppState;

// ───────────────────────────── helpers

async fn require_admin(
    state: &AppState,
    auth_user: &jwt::AuthUser,
) -> Result<(), (StatusCode, Json<serde_json::Value>)> {
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
    Ok(())
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
    if let Err(e) = require_admin(&state, &auth).await {
        return e.into_response();
    }
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
    if let Err(e) = require_admin(&state, &auth).await {
        return e.into_response();
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

async fn set_status(
    state: &AppState,
    id: i32,
    new_status: &str,
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
    let mut active = existing.into_active_model();
    active.status = Set(new_status.to_string());
    active.updated_at = Set(chrono::Local::now().naive_local());
    active
        .update(&state.db)
        .await
        .map_err(|e| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({"error": format!("update failed: {e}")})),
            )
        })
}

pub async fn approve_code_sample(
    State(state): State<AppState>,
    auth: jwt::AuthUser,
    Path(id): Path<i32>,
) -> impl IntoResponse {
    if let Err(e) = require_admin(&state, &auth).await {
        return e.into_response();
    }
    match set_status(&state, id, "approved").await {
        Ok(m) => Json(json!({"ok": true, "sample": m})).into_response(),
        Err(e) => e.into_response(),
    }
}

pub async fn reject_code_sample(
    State(state): State<AppState>,
    auth: jwt::AuthUser,
    Path(id): Path<i32>,
) -> impl IntoResponse {
    if let Err(e) = require_admin(&state, &auth).await {
        return e.into_response();
    }
    match set_status(&state, id, "rejected").await {
        Ok(m) => Json(json!({"ok": true, "sample": m})).into_response(),
        Err(e) => e.into_response(),
    }
}
