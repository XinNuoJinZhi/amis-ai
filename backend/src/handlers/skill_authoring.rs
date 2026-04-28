//! Skill 桶 AI 起草（Synthetic Honey）
//!
//! 一次"向导"流程分 4 步：填意图 → 流式起草 → 审核编辑 → 入库。
//! 草稿正文不进 DB，落在 `${SKILLS_ROOT}/.drafts/<session_id>/`；
//! 会话元数据 + 用户意图进 `skill_authoring_session` 表。
//!
//! 本文件按任务推进逐步补齐：
//!   - Task 3：create_session / get_session / delete_session + TTL 清理后台任务（本文件当前提交）
//!   - Task 4：read_draft / write_draft（draft 读写）
//!   - Task 6：generate_stream（SSE 透传 agent）
//!   - Task 7：adopt_session（落库）
//!   - Task 8：rewrite_fragment_stream（单文件改写）
//!
//! RBAC：全部 admin only。session 接口额外校验 `session.user_id == auth_user.id`，
//! 即使 admin 也只能看自己的 session，防止 admin 互相翻草稿。

use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    response::{
        sse::{Event, KeepAlive, Sse},
        IntoResponse,
    },
    Json,
};
use chrono::Utc;
use sea_orm::{ActiveModelTrait, ColumnTrait, EntityTrait, QueryFilter, Set};
use serde::{Deserialize, Serialize};
use serde_json::json;
use std::convert::Infallible;
use tokio::sync::mpsc;

use crate::entity::{skill_authoring_session, system_setting, user};
use crate::handlers::skills_admin;
use crate::utils::jwt;
use crate::AppState;

const DRAFTS_DIR_NAME: &str = ".drafts";
// 整桶起草硬上限（防 LLM 失控，与系统配置互为兜底）
const GENERATE_MAX_DURATION: std::time::Duration = std::time::Duration::from_secs(300);

// ───────────────────────────── 系统配置读取（有 fallback 默认）

fn parse_setting_i64(state_value: &str, default_value: i64) -> i64 {
    state_value.trim().parse::<i64>().unwrap_or(default_value)
}

async fn read_setting_i64(state: &AppState, key: &str, default_value: i64) -> i64 {
    match system_setting::Entity::find()
        .filter(system_setting::Column::Key.eq(key))
        .one(&state.db)
        .await
    {
        Ok(Some(s)) => parse_setting_i64(&s.value, default_value),
        _ => default_value,
    }
}

// ───────────────────────────── 目录 helpers

fn drafts_root(state: &AppState) -> std::path::PathBuf {
    std::path::PathBuf::from(&state.skills_root).join(DRAFTS_DIR_NAME)
}

fn session_dir(state: &AppState, session_id: &str) -> std::path::PathBuf {
    drafts_root(state).join(session_id)
}

/// session_id 必须是合法 UUID v4（36 字符含 `-`），拒绝任何可能造成路径遍历的输入。
fn validate_session_id(
    session_id: &str,
) -> Result<(), (StatusCode, Json<serde_json::Value>)> {
    match uuid::Uuid::parse_str(session_id) {
        Ok(_) => Ok(()),
        Err(_) => Err((
            StatusCode::BAD_REQUEST,
            Json(json!({"error": format!("session_id 不是合法的 UUID: {session_id}")})),
        )),
    }
}

// ───────────────────────────── 意图表单

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct IntentForm {
    /// draft_bucket | clone_bucket
    pub mode: String,
    /// 目标桶目录名（未来落地的 target_bucket 默认取这个）
    pub dir_name: String,
    pub display_name: String,
    pub description: String,
    /// 目标技术栈字符串（如 "react-antd-web"）
    pub target_stack: String,
    /// 用户勾选的参考桶目录名，≤ max_reference_buckets
    #[serde(default)]
    pub reference_bucket_ids: Vec<String>,
    /// 追加的意图说明，≤ max_extra_context_chars
    #[serde(default)]
    pub extra_context: Option<String>,
}

fn validate_intent(
    state: &AppState,
    intent: &IntentForm,
    max_ref_buckets: i64,
    max_extra_chars: i64,
) -> Result<(), (StatusCode, Json<serde_json::Value>)> {
    // mode
    if intent.mode != "draft_bucket" && intent.mode != "clone_bucket" {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(json!({"error": format!("mode 必须为 draft_bucket 或 clone_bucket，收到: {}", intent.mode)})),
        ));
    }

    // dir_name：跟 skills_admin::bucket_dir 同规则（^[A-Za-z_][A-Za-z0-9_-]*$，≤ 64）
    let dn = intent.dir_name.trim();
    let dn_valid = !dn.is_empty()
        && dn.len() <= 64
        && dn
            .chars()
            .all(|c| c.is_ascii_alphanumeric() || c == '_' || c == '-')
        && !dn.starts_with('-');
    if !dn_valid {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(json!({"error": format!("非法 dir_name: {dn}")})),
        ));
    }

    // display_name / description 非空
    if intent.display_name.trim().is_empty() {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(json!({"error": "display_name 不能为空"})),
        ));
    }
    if intent.description.trim().is_empty() {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(json!({"error": "description 不能为空"})),
        ));
    }
    if intent.target_stack.trim().is_empty() {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(json!({"error": "target_stack 不能为空"})),
        ));
    }

    // reference_bucket_ids：长度上限 + 每个名都必须是合法桶名 + 实际存在
    if (intent.reference_bucket_ids.len() as i64) > max_ref_buckets {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(json!({"error": format!("参考桶数量超过上限 {}", max_ref_buckets)})),
        ));
    }
    if intent.mode == "clone_bucket" && intent.reference_bucket_ids.len() != 1 {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(json!({"error": "clone_bucket 模式必须恰好选择 1 个参考桶作为模板"})),
        ));
    }
    let root = std::path::PathBuf::from(&state.skills_root);
    for b in &intent.reference_bucket_ids {
        // 复用 skills_admin 的桶名校验
        if skills_admin::bucket_dir(state, b).is_err() {
            return Err((
                StatusCode::BAD_REQUEST,
                Json(json!({"error": format!("非法参考桶名: {b}")})),
            ));
        }
        if !root.join(b).is_dir() {
            return Err((
                StatusCode::BAD_REQUEST,
                Json(json!({"error": format!("参考桶不存在: {b}")})),
            ));
        }
    }

    // extra_context 长度
    if let Some(ec) = &intent.extra_context {
        if (ec.chars().count() as i64) > max_extra_chars {
            return Err((
                StatusCode::BAD_REQUEST,
                Json(json!({"error": format!("extra_context 字符数超过上限 {}", max_extra_chars)})),
            ));
        }
    }

    Ok(())
}

// ───────────────────────────── 用户查询（拿 user.id）

async fn fetch_user_by_username(
    state: &AppState,
    username: &str,
) -> Result<user::Model, (StatusCode, Json<serde_json::Value>)> {
    user::Entity::find()
        .filter(user::Column::Username.eq(username))
        .one(&state.db)
        .await
        .map_err(|e| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({"error": format!("DB error: {e}")})),
            )
        })?
        .ok_or_else(|| {
            (
                StatusCode::UNAUTHORIZED,
                Json(json!({"error": "用户不存在"})),
            )
        })
}

async fn load_session_for_owner(
    state: &AppState,
    session_id: &str,
    user_id: i32,
) -> Result<skill_authoring_session::Model, (StatusCode, Json<serde_json::Value>)> {
    let s = skill_authoring_session::Entity::find()
        .filter(skill_authoring_session::Column::SessionId.eq(session_id))
        .one(&state.db)
        .await
        .map_err(|e| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({"error": format!("DB error: {e}")})),
            )
        })?
        .ok_or_else(|| {
            (
                StatusCode::NOT_FOUND,
                Json(json!({"error": "会话不存在或已过期"})),
            )
        })?;
    if s.user_id != user_id {
        // 对外统一 NOT_FOUND 避免泄露存在性
        return Err((
            StatusCode::NOT_FOUND,
            Json(json!({"error": "会话不存在或已过期"})),
        ));
    }
    Ok(s)
}

// ───────────────────────────── 草稿目录枚举

#[derive(Debug, Serialize)]
pub struct DraftFile {
    pub path: String,
    pub size: u64,
    pub mtime_unix: i64,
    pub lines: usize,
}

/// 遍历 session 目录返回所有文件（路径对 session 根相对）。
/// 不存在目录时返回空 Vec（session 刚建、还没 generate 时正常）。
fn list_draft_files(session_dir: &std::path::Path) -> Vec<DraftFile> {
    let mut out = Vec::new();
    if !session_dir.is_dir() {
        return out;
    }
    for entry in walkdir::WalkDir::new(session_dir)
        .into_iter()
        .filter_map(|e| e.ok())
    {
        let p = entry.path();
        if !p.is_file() {
            continue;
        }
        let rel = match p.strip_prefix(session_dir) {
            Ok(r) => r.to_string_lossy().replace('\\', "/"),
            Err(_) => continue,
        };
        let meta = match std::fs::metadata(p) {
            Ok(m) => m,
            Err(_) => continue,
        };
        let mtime = meta
            .modified()
            .ok()
            .and_then(|m| m.duration_since(std::time::UNIX_EPOCH).ok())
            .map(|d| d.as_secs() as i64)
            .unwrap_or(0);
        let lines = std::fs::read_to_string(p)
            .map(|c| c.lines().count())
            .unwrap_or(0);
        out.push(DraftFile {
            path: rel,
            size: meta.len(),
            mtime_unix: mtime,
            lines,
        });
    }
    out.sort_by(|a, b| a.path.cmp(&b.path));
    out
}

// ───────────────────────────── handlers

/// `POST /api/skills/authoring/sessions`
///
/// body = `IntentForm`。成功后：
///   1. 生成 uuid v4 作为 session_id
///   2. 按系统配置计算 expires_at = now + draft_ttl_hours
///   3. 创建 `${SKILLS_ROOT}/.drafts/<session_id>/` 目录
///   4. INSERT DB（status=draft, llm_model/error_message 为空）
///   5. 返回 `{session_id, status, expires_at}`
pub async fn create_session(
    State(state): State<AppState>,
    auth: jwt::AuthUser,
    Json(intent): Json<IntentForm>,
) -> impl IntoResponse {
    if let Err(e) = skills_admin::require_admin(&state, &auth).await {
        return e.into_response();
    }
    let user = match fetch_user_by_username(&state, &auth.username).await {
        Ok(u) => u,
        Err(e) => return e.into_response(),
    };

    let max_ref_buckets = read_setting_i64(&state, "skill_authoring.max_reference_buckets", 3).await;
    let max_extra_chars = read_setting_i64(&state, "skill_authoring.max_extra_context_chars", 8000).await;
    if let Err(e) = validate_intent(&state, &intent, max_ref_buckets, max_extra_chars) {
        return e.into_response();
    }

    let session_id = uuid::Uuid::new_v4().to_string();
    let sdir = session_dir(&state, &session_id);
    if let Err(e) = std::fs::create_dir_all(&sdir) {
        return (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({"error": format!("创建草稿目录失败: {e}")})),
        )
            .into_response();
    }

    let ttl_hours = read_setting_i64(&state, "skill_authoring.draft_ttl_hours", 24).await;
    let now = Utc::now().naive_utc();
    let expires = now + chrono::Duration::hours(ttl_hours.max(1));

    let intent_json = match serde_json::to_string(&intent) {
        Ok(s) => s,
        Err(e) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({"error": format!("序列化 intent 失败: {e}")})),
            )
                .into_response();
        }
    };

    let am = skill_authoring_session::ActiveModel {
        session_id: Set(session_id.clone()),
        user_id: Set(user.id),
        status: Set("draft".to_string()),
        mode: Set(intent.mode.clone()),
        intent: Set(intent_json),
        llm_model: Set(None),
        error_message: Set(None),
        created_at: Set(now),
        updated_at: Set(now),
        expires_at: Set(expires),
        ..Default::default()
    };
    if let Err(e) = am.insert(&state.db).await {
        // 回滚目录，避免孤儿
        let _ = std::fs::remove_dir_all(&sdir);
        return (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({"error": format!("写会话失败: {e}")})),
        )
            .into_response();
    }

    Json(json!({
        "session_id": session_id,
        "status": "draft",
        "expires_at": expires.and_utc().to_rfc3339(),
        "draft_dir": sdir.display().to_string(),
    }))
    .into_response()
}

/// `GET /api/skills/authoring/sessions/:id`
/// 返回会话元数据 + 草稿文件列表。
pub async fn get_session(
    State(state): State<AppState>,
    auth: jwt::AuthUser,
    Path(session_id): Path<String>,
) -> impl IntoResponse {
    if let Err(e) = skills_admin::require_admin(&state, &auth).await {
        return e.into_response();
    }
    if let Err(e) = validate_session_id(&session_id) {
        return e.into_response();
    }
    let user = match fetch_user_by_username(&state, &auth.username).await {
        Ok(u) => u,
        Err(e) => return e.into_response(),
    };
    let s = match load_session_for_owner(&state, &session_id, user.id).await {
        Ok(s) => s,
        Err(e) => return e.into_response(),
    };

    let intent: serde_json::Value =
        serde_json::from_str(&s.intent).unwrap_or_else(|_| json!({}));
    let drafts = list_draft_files(&session_dir(&state, &session_id));

    Json(json!({
        "session_id": s.session_id,
        "status": s.status,
        "mode": s.mode,
        "intent": intent,
        "llm_model": s.llm_model,
        "error_message": s.error_message,
        "created_at": s.created_at.and_utc().to_rfc3339(),
        "updated_at": s.updated_at.and_utc().to_rfc3339(),
        "expires_at": s.expires_at.and_utc().to_rfc3339(),
        "drafts": drafts,
    }))
    .into_response()
}

/// `DELETE /api/skills/authoring/sessions/:id`
/// 删 DB 行 + 递归删草稿目录（幂等——已不存在时也返回 200）。
pub async fn delete_session(
    State(state): State<AppState>,
    auth: jwt::AuthUser,
    Path(session_id): Path<String>,
) -> impl IntoResponse {
    if let Err(e) = skills_admin::require_admin(&state, &auth).await {
        return e.into_response();
    }
    if let Err(e) = validate_session_id(&session_id) {
        return e.into_response();
    }
    let user = match fetch_user_by_username(&state, &auth.username).await {
        Ok(u) => u,
        Err(e) => return e.into_response(),
    };
    // load_session_for_owner 会过滤掉别人的 session；幂等化：NOT_FOUND 也当成功
    match load_session_for_owner(&state, &session_id, user.id).await {
        Ok(s) => {
            if let Err(e) = skill_authoring_session::Entity::delete_by_id(s.id)
                .exec(&state.db)
                .await
            {
                return (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(json!({"error": format!("删除会话失败: {e}")})),
                )
                    .into_response();
            }
        }
        Err((StatusCode::NOT_FOUND, _)) => {
            // 幂等：DB 里没有，继续去清理目录（可能残留）
        }
        Err(e) => return e.into_response(),
    }
    let sdir = session_dir(&state, &session_id);
    let _ = std::fs::remove_dir_all(&sdir);
    Json(json!({"ok": true, "session_id": session_id})).into_response()
}

// ───────────────────────────── 后台 TTL 清理

/// 后台循环：每 30 分钟扫一次 `expires_at < now()` 的会话，
/// 删对应 DB 行 + 递归删草稿目录。服务重启后第一次扫也会补清积压过期项。
pub fn spawn_ttl_cleanup(state: AppState) {
    tokio::spawn(async move {
        let mut interval = tokio::time::interval(std::time::Duration::from_secs(30 * 60));
        // 跳过第一次立即触发（服务刚启动时业务更重要）
        interval.tick().await;
        loop {
            interval.tick().await;
            if let Err(e) = purge_expired(&state).await {
                tracing::warn!("[skill_authoring] TTL 清理出错: {e}");
            }
        }
    });
}

async fn purge_expired(state: &AppState) -> Result<(), String> {
    let now = Utc::now().naive_utc();
    let expired = skill_authoring_session::Entity::find()
        .filter(skill_authoring_session::Column::ExpiresAt.lt(now))
        .all(&state.db)
        .await
        .map_err(|e| format!("查询过期会话失败: {e}"))?;
    if expired.is_empty() {
        return Ok(());
    }
    let count = expired.len();
    for s in expired {
        let sdir = session_dir(state, &s.session_id);
        let _ = std::fs::remove_dir_all(&sdir);
        let _ = skill_authoring_session::Entity::delete_by_id(s.id)
            .exec(&state.db)
            .await;
    }
    tracing::info!("[skill_authoring] TTL 清理 {count} 条过期会话");
    Ok(())
}

// ═════════════════════════════════════════════════════════════
//  Task 6：SSE 透传 + 草稿落盘
// ═════════════════════════════════════════════════════════════

/// Few-shot 打包策略（纯自动，对应 plan 拍板决策 #3）：
/// - `_common/SKILL.md` 全量（若存在）
/// - 用户勾选的每个参考桶：
///     · SKILL.md 全文
///     · `references/` 下**最短的 N 份** `.md` 全文（N = fewshot_inline_refs 配置）
///     · 其余 references 只放 `"<filename>(行数)"` 索引字符串
fn build_reference_skills_payload(
    state: &AppState,
    reference_bucket_ids: &[String],
    fewshot_inline_refs: usize,
) -> Vec<serde_json::Value> {
    let root = std::path::PathBuf::from(&state.skills_root);
    let mut result = Vec::new();
    // _common 永远打头（即使用户没勾，仍恒量注入产品哲学）
    let mut ordered: Vec<&str> = vec!["_common"];
    for b in reference_bucket_ids {
        if b != "_common" {
            ordered.push(b.as_str());
        }
    }

    for bucket in ordered {
        let bdir = root.join(bucket);
        if !bdir.is_dir() {
            continue;
        }
        let skill_md_path = bdir.join("SKILL.md");
        let skill_md = match std::fs::read_to_string(&skill_md_path) {
            Ok(c) => c,
            Err(_) => continue, // 没 SKILL.md 的桶跳过
        };

        // 扫 references/*.md
        let refs_dir = bdir.join("references");
        let mut all_refs: Vec<(String, u64)> = Vec::new();
        if refs_dir.is_dir() {
            for entry in std::fs::read_dir(&refs_dir).into_iter().flatten().flatten() {
                let p = entry.path();
                if !p.is_file() {
                    continue;
                }
                if p.extension().and_then(|e| e.to_str()) != Some("md") {
                    continue;
                }
                let name = match p.file_name().and_then(|n| n.to_str()) {
                    Some(n) => n.to_string(),
                    None => continue,
                };
                let size = std::fs::metadata(&p).map(|m| m.len()).unwrap_or(0);
                all_refs.push((name, size));
            }
        }
        all_refs.sort_by_key(|(_, sz)| *sz);

        let (inline_names, index_names): (Vec<_>, Vec<_>) = {
            let mut inline = Vec::new();
            let mut index = Vec::new();
            for (idx, (name, _)) in all_refs.iter().enumerate() {
                if idx < fewshot_inline_refs {
                    inline.push(name.clone());
                } else {
                    index.push(name.clone());
                }
            }
            (inline, index)
        };

        // 读 inline 全文
        let mut inline_refs = Vec::new();
        for name in &inline_names {
            let p = refs_dir.join(name);
            if let Ok(content) = std::fs::read_to_string(&p) {
                inline_refs.push(json!({
                    "path": name,
                    "content": content,
                }));
            }
        }
        // 索引字符串拼 "<filename>(N 行)"
        let index_refs: Vec<String> = index_names
            .iter()
            .map(|name| {
                let p = refs_dir.join(name);
                let line_count = std::fs::read_to_string(&p)
                    .map(|c| c.lines().count())
                    .unwrap_or(0);
                format!("{}({}行)", name, line_count)
            })
            .collect();

        result.push(json!({
            "bucket": bucket,
            "skill_md": skill_md,
            "inline_refs": inline_refs,
            "index_refs": index_refs,
        }));
    }
    result
}

/// 约束草稿 path：只允许 `SKILL.md` 或 `references/<name>.md` 或 `assets/<safe>`。
/// 防 LLM 输出越权路径（../ / 绝对路径 / 非 .md 文件在 references/ 下等）。
fn is_allowed_draft_path(rel: &str) -> bool {
    if rel.is_empty() || rel.contains("..") || rel.starts_with('/') || rel.starts_with('\\') {
        return false;
    }
    // 禁止 \ 入桶（Windows 风格）统一用 /
    if rel.contains('\\') {
        return false;
    }
    if rel == "SKILL.md" {
        return true;
    }
    if let Some(rest) = rel.strip_prefix("references/") {
        return !rest.contains('/') && rest.to_ascii_lowercase().ends_with(".md");
    }
    if let Some(rest) = rel.strip_prefix("assets/") {
        return !rest.is_empty() && !rest.contains("..");
    }
    false
}

/// 单个 SSE 事件（上游 agent → backend → frontend 之间的通用载荷）
#[derive(Debug, Clone)]
struct UpstreamEvent {
    event: String,
    data: String,
}

/// 从 reqwest Response 增量读取字节、解析 SSE 文本行，yield 每个 `event/data` 块。
/// 规则遵循 W3C SSE：空行作为 event 边界，`data:` 允许多行累加（\n 拼接）。
/// 不依赖 reqwest 的 "stream" feature —— 直接走 `Response::chunk()`。
async fn parse_sse_from_response(
    mut resp: reqwest::Response,
    tx: mpsc::Sender<UpstreamEvent>,
) {
    let mut buffer = String::new();
    let mut current_event = String::new();
    let mut current_data = String::new();

    async fn flush(tx: &mpsc::Sender<UpstreamEvent>, event: &mut String, data: &mut String) {
        if !data.is_empty() {
            let ev = if event.is_empty() { "message".to_string() } else { event.clone() };
            let _ = tx
                .send(UpstreamEvent {
                    event: ev,
                    data: std::mem::take(data),
                })
                .await;
        }
        event.clear();
    }

    loop {
        match resp.chunk().await {
            Ok(Some(bytes)) => {
                match std::str::from_utf8(&bytes) {
                    Ok(s) => buffer.push_str(s),
                    Err(_) => continue, // 丢弃非 UTF-8 分片
                }
                while let Some(idx) = buffer.find('\n') {
                    let line = {
                        let l = &buffer[..idx];
                        l.strip_suffix('\r').unwrap_or(l).to_string()
                    };
                    buffer.drain(..=idx);
                    if line.is_empty() {
                        flush(&tx, &mut current_event, &mut current_data).await;
                    } else if let Some(rest) = line.strip_prefix("event:") {
                        current_event = rest.trim().to_string();
                    } else if let Some(rest) = line.strip_prefix("data:") {
                        if !current_data.is_empty() {
                            current_data.push('\n');
                        }
                        current_data.push_str(rest.trim_start());
                    } // 其他 : 字段忽略（id / retry 等）
                }
            }
            Ok(None) => break,
            Err(e) => {
                let _ = tx
                    .send(UpstreamEvent {
                        event: "error".to_string(),
                        data: json!({"error": format!("上游流读取失败: {e}")}).to_string(),
                    })
                    .await;
                return;
            }
        }
    }
    // 流结束时 flush 一次（如果最后一块 data 后没空行）
    flush(&tx, &mut current_event, &mut current_data).await;
}

/// `POST /api/skills/authoring/sessions/:id/generate`
///
/// 前置：session 必须属于当前 admin，且 status 为 `draft`（避免重复触发生成）。
/// 流程：
///   1. 打包 few-shot → 调 agent `/skill-authoring/draft-bucket`（SSE）
///   2. spawn bridge 任务：边解析 SSE 边落盘到 `.drafts/<id>/<path>`
///   3. handler 返回 `axum::Sse`，stream 源来自 bridge 的 mpsc 接收端
///   4. bridge 结束时更新 session.status 为 `ready` 或 `failed`
pub async fn generate_stream(
    State(state): State<AppState>,
    auth: jwt::AuthUser,
    Path(session_id): Path<String>,
) -> axum::response::Response {
    if let Err(e) = skills_admin::require_admin(&state, &auth).await {
        return e.into_response();
    }
    if let Err(e) = validate_session_id(&session_id) {
        return e.into_response();
    }
    let user = match fetch_user_by_username(&state, &auth.username).await {
        Ok(u) => u,
        Err(e) => return e.into_response(),
    };
    let s = match load_session_for_owner(&state, &session_id, user.id).await {
        Ok(s) => s,
        Err(e) => return e.into_response(),
    };
    if s.status != "draft" {
        return (
            StatusCode::CONFLICT,
            Json(json!({
                "error": format!("会话当前状态为 {}，无法触发生成（仅 draft 状态允许）", s.status)
            })),
        )
            .into_response();
    }

    let intent: IntentForm = match serde_json::from_str(&s.intent) {
        Ok(v) => v,
        Err(e) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({"error": format!("意图反序列化失败: {e}")})),
            )
                .into_response();
        }
    };

    // 并发保护：把 session 状态推进到 streaming，防止同一 session 同时两次 generate
    let now = Utc::now().naive_utc();
    let mut am: skill_authoring_session::ActiveModel = s.clone().into();
    am.status = Set("streaming".to_string());
    am.updated_at = Set(now);
    am.error_message = Set(None);
    if let Err(e) = am.update(&state.db).await {
        return (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({"error": format!("更新会话状态失败: {e}")})),
        )
            .into_response();
    }

    // 打包 few-shot
    let fewshot_inline_refs = read_setting_i64(&state, "skill_authoring.fewshot_inline_refs", 2).await;
    let reference_skills = build_reference_skills_payload(
        &state,
        &intent.reference_bucket_ids,
        fewshot_inline_refs.max(0) as usize,
    );

    // 组装 agent 请求体
    let agent_body = json!({
        "mode": intent.mode,
        "dir_name": intent.dir_name,
        "display_name": intent.display_name,
        "description": intent.description,
        "target_stack": intent.target_stack,
        "extra_context": intent.extra_context,
        "reference_skills": reference_skills,
        "session_id": session_id,
    });

    let agent_url = format!(
        "{}/skill-authoring/draft-bucket",
        std::env::var("AGENT_URL").unwrap_or_else(|_| "http://localhost:8000".to_string())
    );

    let (tx, rx) = mpsc::channel::<Event>(64);

    // 备份 state 供 bridge 任务用
    let bridge_state = state.clone();
    let bridge_session_id = session_id.clone();
    let session_pk = s.id;

    tokio::spawn(async move {
        run_bridge(
            bridge_state,
            bridge_session_id,
            session_pk,
            agent_url,
            agent_body,
            tx,
        )
        .await;
    });

    let stream = futures::stream::unfold(rx, |mut rx| async move {
        rx.recv().await.map(|ev| (Ok::<Event, Infallible>(ev), rx))
    });

    Sse::new(stream).keep_alive(KeepAlive::default()).into_response()
}

/// 桥接任务：调 agent → 解析 SSE → 落盘 → 转给下游 → 更新 session 状态
async fn run_bridge(
    state: AppState,
    session_id: String,
    session_pk: i32,
    agent_url: String,
    agent_body: serde_json::Value,
    tx_downstream: mpsc::Sender<Event>,
) {
    let sdir = session_dir(&state, &session_id);
    // 清空目录（上次生成的残留可能还在）
    let _ = std::fs::remove_dir_all(&sdir);
    let _ = std::fs::create_dir_all(&sdir);

    let client = &state.http_client;
    let upstream = client
        .post(&agent_url)
        .header("accept", "text/event-stream")
        .json(&agent_body)
        .timeout(GENERATE_MAX_DURATION)
        .send()
        .await;

    let resp = match upstream {
        Ok(r) => r,
        Err(e) => {
            let _ = tx_downstream
                .send(
                    Event::default()
                        .event("error")
                        .data(json!({"error": format!("调 agent 失败: {e}")}).to_string()),
                )
                .await;
            mark_session_failed(&state, session_pk, &format!("agent 请求失败: {e}")).await;
            return;
        }
    };
    if !resp.status().is_success() {
        let status = resp.status();
        let body_text = resp.text().await.unwrap_or_default();
        let _ = tx_downstream
            .send(
                Event::default().event("error").data(
                    json!({"error": format!("agent 返回 {status}: {}", body_text.chars().take(500).collect::<String>())})
                        .to_string(),
                ),
            )
            .await;
        mark_session_failed(&state, session_pk, &format!("agent HTTP {status}")).await;
        return;
    }

    // 开一个内部通道把 SSE 解析和落盘/转发串起来
    let (up_tx, mut up_rx) = mpsc::channel::<UpstreamEvent>(128);
    tokio::spawn(parse_sse_from_response(resp, up_tx));

    let max_file_bytes = read_setting_i64(&state, "skill_authoring.max_file_bytes", 256 * 1024).await as u64;
    let max_bucket_bytes = read_setting_i64(&state, "skill_authoring.max_bucket_bytes", 2 * 1024 * 1024).await as u64;
    let max_files = read_setting_i64(&state, "skill_authoring.max_files_per_bucket", 10).await as usize;

    let mut current_path: Option<std::path::PathBuf> = None;
    let mut current_size: u64 = 0;
    let mut bucket_size: u64 = 0;
    let mut file_count: usize = 0;
    let mut rejected_paths: Vec<String> = Vec::new();
    let mut finalized_files: Vec<String> = Vec::new();
    let mut llm_model: Option<String> = None;
    let mut saw_error: Option<String> = None;
    let mut saw_done = false;

    while let Some(up) = up_rx.recv().await {
        // 解析 data JSON，用于副作用；原始事件还是要转给前端
        let data_json: serde_json::Value =
            serde_json::from_str(&up.data).unwrap_or(json!({}));

        match up.event.as_str() {
            "meta" => {
                if let Some(m) = data_json.get("model").and_then(|v| v.as_str()) {
                    llm_model = Some(m.to_string());
                }
            }
            "file-start" => {
                let path = data_json.get("path").and_then(|v| v.as_str()).unwrap_or("");
                if !is_allowed_draft_path(path) || file_count >= max_files {
                    rejected_paths.push(path.to_string());
                    current_path = None;
                    current_size = 0;
                    // 转发给前端让它也知道被拒（前端可以高亮警告）
                    let _ = tx_downstream
                        .send(
                            Event::default()
                                .event("file-rejected")
                                .data(json!({"path": path, "reason": "路径不在白名单或超过文件数上限"}).to_string()),
                        )
                        .await;
                    // 继续消化上游直到 file-end / done
                    continue;
                }
                let full = sdir.join(path);
                if let Some(parent) = full.parent() {
                    let _ = std::fs::create_dir_all(parent);
                }
                // 清空文件
                let _ = std::fs::write(&full, b"");
                current_path = Some(full);
                current_size = 0;
                file_count += 1;
            }
            "data" => {
                let delta = data_json.get("delta").and_then(|v| v.as_str()).unwrap_or("");
                if let Some(p) = &current_path {
                    let delta_len = delta.len() as u64;
                    if current_size + delta_len > max_file_bytes
                        || bucket_size + delta_len > max_bucket_bytes
                    {
                        // 超限：停止写入后续内容（但仍要继续消化上游直到 file-end，保持协议同步）
                        saw_error.get_or_insert_with(|| {
                            "生成内容超过单文件或整桶字节上限，已截断".to_string()
                        });
                    } else if let Ok(mut f) = std::fs::OpenOptions::new().append(true).open(p) {
                        use std::io::Write;
                        let _ = f.write_all(delta.as_bytes());
                        current_size += delta_len;
                        bucket_size += delta_len;
                    }
                }
            }
            "file-end" => {
                if let Some(p) = current_path.take() {
                    if let Some(rel) = p.strip_prefix(&sdir).ok().and_then(|r| r.to_str()) {
                        finalized_files.push(rel.replace('\\', "/"));
                    }
                }
                current_size = 0;
            }
            "error" => {
                saw_error.get_or_insert_with(|| {
                    data_json
                        .get("error")
                        .and_then(|v| v.as_str())
                        .unwrap_or("未知错误")
                        .to_string()
                });
            }
            "done" => {
                saw_done = true;
            }
            _ => {}
        }

        // 转发事件给前端（原样透传）
        let _ = tx_downstream
            .send(Event::default().event(&up.event).data(up.data))
            .await;
    }

    // 流结束——更新 DB 状态
    let final_status = if saw_error.is_some() {
        "failed"
    } else if !finalized_files.is_empty() && saw_done {
        "ready"
    } else if !finalized_files.is_empty() {
        "ready"
    } else {
        "failed"
    };

    // 推送 summary 事件（前端 done 已经收到过，这里是 backend 兜底信号）
    let summary = json!({
        "status": final_status,
        "files": finalized_files,
        "rejected": rejected_paths,
        "error": saw_error.clone(),
        "model_used": llm_model.clone(),
    });
    let _ = tx_downstream
        .send(Event::default().event("backend-summary").data(summary.to_string()))
        .await;

    update_session_after_stream(&state, session_pk, final_status, llm_model, saw_error).await;
}

async fn update_session_after_stream(
    state: &AppState,
    session_pk: i32,
    status: &str,
    llm_model: Option<String>,
    error_message: Option<String>,
) {
    let now = Utc::now().naive_utc();
    if let Ok(Some(s)) = skill_authoring_session::Entity::find_by_id(session_pk)
        .one(&state.db)
        .await
    {
        let mut am: skill_authoring_session::ActiveModel = s.into();
        am.status = Set(status.to_string());
        am.updated_at = Set(now);
        if let Some(m) = llm_model {
            am.llm_model = Set(Some(m));
        }
        if error_message.is_some() {
            am.error_message = Set(error_message);
        }
        let _ = am.update(&state.db).await;
    }
}

async fn mark_session_failed(state: &AppState, session_pk: i32, reason: &str) {
    update_session_after_stream(state, session_pk, "failed", None, Some(reason.to_string())).await;
}

// ═════════════════════════════════════════════════════════════
//  Task 4：草稿文件读写
// ═════════════════════════════════════════════════════════════

const DRAFT_READ_LIMIT: u64 = 512 * 1024;

#[derive(Debug, Deserialize)]
pub struct DraftPathQuery {
    pub path: String,
}

/// `GET /api/skills/authoring/sessions/:id/draft?path=X`
pub async fn read_draft(
    State(state): State<AppState>,
    auth: jwt::AuthUser,
    Path(session_id): Path<String>,
    Query(q): Query<DraftPathQuery>,
) -> impl IntoResponse {
    if let Err(e) = skills_admin::require_admin(&state, &auth).await {
        return e.into_response();
    }
    if let Err(e) = validate_session_id(&session_id) {
        return e.into_response();
    }
    let user = match fetch_user_by_username(&state, &auth.username).await {
        Ok(u) => u,
        Err(e) => return e.into_response(),
    };
    let _s = match load_session_for_owner(&state, &session_id, user.id).await {
        Ok(s) => s,
        Err(e) => return e.into_response(),
    };
    if !is_allowed_draft_path(&q.path) {
        return (
            StatusCode::BAD_REQUEST,
            Json(json!({"error": format!("非法草稿路径: {}", q.path)})),
        )
            .into_response();
    }
    let sdir = session_dir(&state, &session_id);
    let full = match skills_admin::resolve_in_bucket(&sdir, &q.path) {
        Ok(p) => p,
        Err(e) => return e.into_response(),
    };
    if !full.exists() {
        return (
            StatusCode::NOT_FOUND,
            Json(json!({"error": format!("草稿文件不存在: {}", q.path)})),
        )
            .into_response();
    }
    let meta = match std::fs::metadata(&full) {
        Ok(m) => m,
        Err(e) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({"error": format!("读 metadata 失败: {e}")})),
            )
                .into_response();
        }
    };
    let mut truncated = false;
    let content = if meta.len() > DRAFT_READ_LIMIT {
        truncated = true;
        // 读取前 DRAFT_READ_LIMIT 字节，不强求 UTF-8 边界——把无效字节替换
        use std::io::Read;
        let mut f = match std::fs::File::open(&full) {
            Ok(f) => f,
            Err(e) => {
                return (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(json!({"error": format!("打开文件失败: {e}")})),
                )
                    .into_response();
            }
        };
        let mut buf = vec![0u8; DRAFT_READ_LIMIT as usize];
        let n = f.read(&mut buf).unwrap_or(0);
        buf.truncate(n);
        String::from_utf8_lossy(&buf).into_owned()
    } else {
        match std::fs::read_to_string(&full) {
            Ok(c) => c,
            Err(e) => {
                return (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(json!({"error": format!("读文件失败: {e}")})),
                )
                    .into_response();
            }
        }
    };
    let mtime = meta
        .modified()
        .ok()
        .and_then(|m| m.duration_since(std::time::UNIX_EPOCH).ok())
        .map(|d| d.as_secs() as i64);

    Json(json!({
        "session_id": session_id,
        "path": q.path,
        "content": content,
        "size": meta.len(),
        "mtime_unix": mtime,
        "truncated": truncated,
    }))
    .into_response()
}

#[derive(Debug, Deserialize)]
pub struct WriteDraftBody {
    pub path: String,
    pub content: String,
    /// 乐观锁：前端带上打开时看到的 mtime_unix，后端对比当前值；不一致返回 409。
    pub base_mtime_unix: Option<i64>,
}

/// `PUT /api/skills/authoring/sessions/:id/draft`
pub async fn write_draft(
    State(state): State<AppState>,
    auth: jwt::AuthUser,
    Path(session_id): Path<String>,
    Json(body): Json<WriteDraftBody>,
) -> impl IntoResponse {
    if let Err(e) = skills_admin::require_admin(&state, &auth).await {
        return e.into_response();
    }
    if let Err(e) = validate_session_id(&session_id) {
        return e.into_response();
    }
    let user = match fetch_user_by_username(&state, &auth.username).await {
        Ok(u) => u,
        Err(e) => return e.into_response(),
    };
    let _s = match load_session_for_owner(&state, &session_id, user.id).await {
        Ok(s) => s,
        Err(e) => return e.into_response(),
    };
    if !is_allowed_draft_path(&body.path) {
        return (
            StatusCode::BAD_REQUEST,
            Json(json!({"error": format!("非法草稿路径: {}", body.path)})),
        )
            .into_response();
    }
    let max_file_bytes =
        read_setting_i64(&state, "skill_authoring.max_file_bytes", 256 * 1024).await as usize;
    if body.content.len() > max_file_bytes {
        return (
            StatusCode::PAYLOAD_TOO_LARGE,
            Json(json!({"error": format!("草稿内容超过上限 {} 字节", max_file_bytes)})),
        )
            .into_response();
    }
    let sdir = session_dir(&state, &session_id);
    let full = match skills_admin::resolve_in_bucket(&sdir, &body.path) {
        Ok(p) => p,
        Err(e) => return e.into_response(),
    };
    // 乐观锁：如果文件已存在且调用方传了 base_mtime_unix，就比对
    if let Some(base) = body.base_mtime_unix {
        if let Ok(meta) = std::fs::metadata(&full) {
            let current = meta
                .modified()
                .ok()
                .and_then(|m| m.duration_since(std::time::UNIX_EPOCH).ok())
                .map(|d| d.as_secs() as i64)
                .unwrap_or(0);
            if current != base {
                return (
                    StatusCode::CONFLICT,
                    Json(json!({
                        "error": "文件已被其他修改覆盖",
                        "current_mtime_unix": current,
                    })),
                )
                    .into_response();
            }
        }
    }
    if let Some(parent) = full.parent() {
        let _ = std::fs::create_dir_all(parent);
    }
    if let Err(e) = std::fs::write(&full, &body.content) {
        return (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({"error": format!("写文件失败: {e}")})),
        )
            .into_response();
    }
    let new_mtime = std::fs::metadata(&full)
        .ok()
        .and_then(|m| m.modified().ok())
        .and_then(|m| m.duration_since(std::time::UNIX_EPOCH).ok())
        .map(|d| d.as_secs() as i64);
    Json(json!({
        "ok": true,
        "session_id": session_id,
        "path": body.path,
        "size": body.content.len(),
        "mtime_unix": new_mtime,
    }))
    .into_response()
}

// ═════════════════════════════════════════════════════════════
//  Task 7：采纳落库
// ═════════════════════════════════════════════════════════════

#[derive(Debug, Deserialize)]
pub struct AdoptBody {
    /// new_bucket | merge_existing
    pub mode: String,
    /// 目标桶目录名（new_bucket 时必须跟 intent.dir_name 一致或为其他新名；merge 时必须已存在）
    pub target_bucket: String,
    /// 要采纳的草稿相对路径列表（必须在 `.drafts/<id>/` 下存在）
    pub selected_paths: Vec<String>,
    /// overwrite | skip | rename
    pub conflict_policy: String,
}

/// `POST /api/skills/authoring/sessions/:id/adopt`
pub async fn adopt_session(
    State(state): State<AppState>,
    auth: jwt::AuthUser,
    Path(session_id): Path<String>,
    Json(body): Json<AdoptBody>,
) -> impl IntoResponse {
    if let Err(e) = skills_admin::require_admin(&state, &auth).await {
        return e.into_response();
    }
    if let Err(e) = validate_session_id(&session_id) {
        return e.into_response();
    }
    let user = match fetch_user_by_username(&state, &auth.username).await {
        Ok(u) => u,
        Err(e) => return e.into_response(),
    };
    let s = match load_session_for_owner(&state, &session_id, user.id).await {
        Ok(s) => s,
        Err(e) => return e.into_response(),
    };
    if s.status == "adopted" {
        return (
            StatusCode::CONFLICT,
            Json(json!({"error": "该会话已采纳，不能重复"})),
        )
            .into_response();
    }

    // 基本校验
    if body.mode != "new_bucket" && body.mode != "merge_existing" {
        return (
            StatusCode::BAD_REQUEST,
            Json(json!({"error": format!("不支持的 mode: {}", body.mode)})),
        )
            .into_response();
    }
    if !["overwrite", "skip", "rename"].contains(&body.conflict_policy.as_str()) {
        return (
            StatusCode::BAD_REQUEST,
            Json(json!({"error": format!("不支持的 conflict_policy: {}", body.conflict_policy)})),
        )
            .into_response();
    }
    if body.selected_paths.is_empty() {
        return (
            StatusCode::BAD_REQUEST,
            Json(json!({"error": "selected_paths 不能为空"})),
        )
            .into_response();
    }

    // 目标桶目录
    let target_dir = match skills_admin::bucket_dir(&state, &body.target_bucket) {
        Ok(d) => d,
        Err(e) => return e.into_response(),
    };
    match body.mode.as_str() {
        "new_bucket" => {
            if target_dir.exists() {
                return (
                    StatusCode::CONFLICT,
                    Json(json!({"error": format!("桶 {} 已存在，不能再新建（合并请用 merge_existing）", body.target_bucket)})),
                )
                    .into_response();
            }
            if let Err(e) = std::fs::create_dir_all(target_dir.join("references")) {
                return (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(json!({"error": format!("创建 references/ 失败: {e}")})),
                )
                    .into_response();
            }
            if let Err(e) = std::fs::create_dir_all(target_dir.join("assets")) {
                return (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(json!({"error": format!("创建 assets/ 失败: {e}")})),
                )
                    .into_response();
            }
            let _ = std::fs::write(target_dir.join("references/.gitkeep"), "");
            let _ = std::fs::write(target_dir.join("assets/.gitkeep"), "");
        }
        _ => {
            if !target_dir.is_dir() {
                return (
                    StatusCode::NOT_FOUND,
                    Json(json!({"error": format!("目标桶 {} 不存在", body.target_bucket)})),
                )
                    .into_response();
            }
        }
    }

    // 大小 / 文件数上限
    let max_file_bytes =
        read_setting_i64(&state, "skill_authoring.max_file_bytes", 256 * 1024).await as u64;
    let max_bucket_bytes =
        read_setting_i64(&state, "skill_authoring.max_bucket_bytes", 2 * 1024 * 1024).await as u64;
    let max_files =
        read_setting_i64(&state, "skill_authoring.max_files_per_bucket", 10).await as usize;

    // 先把所有草稿读出来 + 白名单校验 + 单文件大小校验，失败就早退
    let sdir = session_dir(&state, &session_id);
    let mut payloads: Vec<(String, Vec<u8>)> = Vec::new();
    let mut cumulative: u64 = 0;
    for p in &body.selected_paths {
        if !is_allowed_draft_path(p) {
            return (
                StatusCode::BAD_REQUEST,
                Json(json!({"error": format!("非法草稿路径: {p}")})),
            )
                .into_response();
        }
        let full = match skills_admin::resolve_in_bucket(&sdir, p) {
            Ok(p) => p,
            Err(e) => return e.into_response(),
        };
        if !full.is_file() {
            return (
                StatusCode::NOT_FOUND,
                Json(json!({"error": format!("草稿文件不存在: {p}")})),
            )
                .into_response();
        }
        let data = match std::fs::read(&full) {
            Ok(d) => d,
            Err(e) => {
                return (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(json!({"error": format!("读草稿失败 {p}: {e}")})),
                )
                    .into_response();
            }
        };
        if (data.len() as u64) > max_file_bytes {
            return (
                StatusCode::PAYLOAD_TOO_LARGE,
                Json(json!({"error": format!("{p} 超过单文件上限 {} 字节", max_file_bytes)})),
            )
                .into_response();
        }
        cumulative += data.len() as u64;
        payloads.push((p.clone(), data));
    }
    if cumulative > max_bucket_bytes {
        return (
            StatusCode::PAYLOAD_TOO_LARGE,
            Json(json!({"error": format!("整桶字节总量 {} 超过上限 {}", cumulative, max_bucket_bytes)})),
        )
            .into_response();
    }

    // merge_existing 场景下要把"现有桶已有文件数"也算进来
    let existing_count = if body.mode == "merge_existing" {
        walkdir::WalkDir::new(&target_dir)
            .into_iter()
            .filter_map(|e| e.ok())
            .filter(|e| e.path().is_file())
            .count()
    } else {
        0
    };
    let projected = match body.conflict_policy.as_str() {
        // 乐观估计：skip 情况下新增数可能少于 payloads.len()；
        // 但 adopt 前无法完全预知，这里用最保守的上界校验
        _ => existing_count + payloads.len(),
    };
    if projected > max_files {
        return (
            StatusCode::PAYLOAD_TOO_LARGE,
            Json(json!({
                "error": format!("桶内文件总数预计 {projected} 会超过上限 {max_files}"),
                "existing": existing_count,
                "incoming": payloads.len(),
            })),
        )
            .into_response();
    }

    // 正式写入
    let mut written: Vec<String> = Vec::new();
    let mut skipped: Vec<String> = Vec::new();
    let mut renamed: Vec<serde_json::Value> = Vec::new();
    for (rel, data) in &payloads {
        let full = match skills_admin::resolve_in_bucket(&target_dir, rel) {
            Ok(p) => p,
            Err(e) => return e.into_response(),
        };
        let final_path = if full.exists() {
            match body.conflict_policy.as_str() {
                "overwrite" => full.clone(),
                "skip" => {
                    skipped.push(rel.clone());
                    continue;
                }
                "rename" => {
                    let candidate = next_rename_candidate(&full);
                    let rel_new = candidate
                        .strip_prefix(&target_dir)
                        .ok()
                        .and_then(|r| r.to_str())
                        .map(|s| s.replace('\\', "/"))
                        .unwrap_or_else(|| rel.clone());
                    renamed.push(json!({"from": rel, "to": rel_new}));
                    candidate
                }
                _ => unreachable!(),
            }
        } else {
            full
        };
        if let Some(parent) = final_path.parent() {
            let _ = std::fs::create_dir_all(parent);
        }
        if let Err(e) = std::fs::write(&final_path, data) {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({"error": format!("写入 {rel} 失败: {e}")})),
            )
                .into_response();
        }
        let rel_out = final_path
            .strip_prefix(&target_dir)
            .ok()
            .and_then(|r| r.to_str())
            .map(|s| s.replace('\\', "/"))
            .unwrap_or_else(|| rel.clone());
        written.push(rel_out);
    }

    // 更新 session 状态为 adopted
    let now = Utc::now().naive_utc();
    let mut am: skill_authoring_session::ActiveModel = s.into();
    am.status = Set("adopted".to_string());
    am.updated_at = Set(now);
    let _ = am.update(&state.db).await;

    Json(json!({
        "ok": true,
        "bucket": body.target_bucket,
        "written": written,
        "skipped": skipped,
        "renamed": renamed,
    }))
    .into_response()
}

// ═════════════════════════════════════════════════════════════
//  Task 8：单文件 AI 改写（SSE 透传，无 session）
// ═════════════════════════════════════════════════════════════

#[derive(Debug, Deserialize)]
pub struct RewriteFragmentBody {
    /// 要改写的 bucket 内文件路径（.md）
    pub path: String,
    /// 选中范围的起止行号（1-based，左右都含）
    pub selection_start_line: usize,
    pub selection_end_line: usize,
    /// 自然语言改写方向
    pub direction: String,
    /// 是否把全文一并发给 LLM 作为语境（文件 ≤ 60KB 时推荐 true）
    #[serde(default)]
    pub full_file_for_context: bool,
}

/// `POST /api/skills/:bucket/rewrite`
///
/// 透传 agent 的 `/skill-authoring/rewrite-fragment`，流式返回 `meta → data → done/error` 事件。
/// done.data.new_selection 由前端拿去替换本地选区后再调 `PUT /api/skills/:bucket/file` 落盘。
pub async fn rewrite_fragment_stream(
    State(state): State<AppState>,
    auth: jwt::AuthUser,
    Path(bucket): Path<String>,
    Json(body): Json<RewriteFragmentBody>,
) -> axum::response::Response {
    if let Err(e) = skills_admin::require_admin(&state, &auth).await {
        return e.into_response();
    }
    let dir = match skills_admin::bucket_dir(&state, &bucket) {
        Ok(d) => d,
        Err(e) => return e.into_response(),
    };
    if !dir.is_dir() {
        return (
            StatusCode::NOT_FOUND,
            Json(json!({"error": format!("桶 {bucket} 不存在")})),
        )
            .into_response();
    }
    let full = match skills_admin::resolve_in_bucket(&dir, &body.path) {
        Ok(p) => p,
        Err(e) => return e.into_response(),
    };
    if !full.is_file() {
        return (
            StatusCode::NOT_FOUND,
            Json(json!({"error": format!("文件不存在: {}", body.path)})),
        )
            .into_response();
    }
    if !skills_admin::extension_allowed(&full) {
        return (
            StatusCode::BAD_REQUEST,
            Json(json!({"error": "仅允许文本类文件（.md/.txt/.json/.yaml/.yml）改写"})),
        )
            .into_response();
    }
    if body.selection_end_line < body.selection_start_line || body.selection_start_line == 0 {
        return (
            StatusCode::BAD_REQUEST,
            Json(json!({"error": "selection_start_line / selection_end_line 非法"})),
        )
            .into_response();
    }
    if body.direction.trim().is_empty() {
        return (
            StatusCode::BAD_REQUEST,
            Json(json!({"error": "direction 不能为空"})),
        )
            .into_response();
    }

    let file_text = match std::fs::read_to_string(&full) {
        Ok(s) => s,
        Err(e) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({"error": format!("读文件失败: {e}")})),
            )
                .into_response();
        }
    };
    let lines: Vec<&str> = file_text.lines().collect();
    if body.selection_end_line > lines.len() {
        return (
            StatusCode::BAD_REQUEST,
            Json(json!({"error": format!(
                "selection_end_line {} 超出文件行数 {}",
                body.selection_end_line, lines.len()
            )})),
        )
            .into_response();
    }
    let selection: String = lines[(body.selection_start_line - 1)..body.selection_end_line]
        .join("\n");
    // 大小 sanity
    if selection.len() > 64 * 1024 {
        return (
            StatusCode::PAYLOAD_TOO_LARGE,
            Json(json!({"error": "选区超过 64KB，建议缩小范围"})),
        )
            .into_response();
    }

    let full_file_for_context = if body.full_file_for_context && file_text.len() <= 60 * 1024 {
        Some(file_text.clone())
    } else {
        None
    };

    let agent_body = json!({
        "bucket": bucket,
        "path": body.path,
        "full_file": full_file_for_context,
        "selection": selection,
        "direction": body.direction,
    });

    let agent_url = format!(
        "{}/skill-authoring/rewrite-fragment",
        std::env::var("AGENT_URL").unwrap_or_else(|_| "http://localhost:8000".to_string())
    );

    let (tx, rx) = mpsc::channel::<Event>(64);
    let bridge_state = state.clone();

    tokio::spawn(async move {
        let client = &bridge_state.http_client;
        let resp = client
            .post(&agent_url)
            .header("accept", "text/event-stream")
            .json(&agent_body)
            .timeout(GENERATE_MAX_DURATION)
            .send()
            .await;
        let resp = match resp {
            Ok(r) => r,
            Err(e) => {
                let _ = tx
                    .send(Event::default().event("error").data(
                        json!({"error": format!("调 agent 失败: {e}")}).to_string(),
                    ))
                    .await;
                return;
            }
        };
        if !resp.status().is_success() {
            let status = resp.status();
            let body_text = resp.text().await.unwrap_or_default();
            let _ = tx
                .send(Event::default().event("error").data(
                    json!({"error": format!("agent 返回 {status}: {}",
                        body_text.chars().take(300).collect::<String>())}).to_string(),
                ))
                .await;
            return;
        }

        let (up_tx, mut up_rx) = mpsc::channel::<UpstreamEvent>(128);
        tokio::spawn(parse_sse_from_response(resp, up_tx));
        while let Some(up) = up_rx.recv().await {
            let _ = tx
                .send(Event::default().event(&up.event).data(up.data))
                .await;
        }
    });

    let stream = futures::stream::unfold(rx, |mut rx| async move {
        rx.recv().await.map(|ev| (Ok::<Event, Infallible>(ev), rx))
    });
    Sse::new(stream)
        .keep_alive(KeepAlive::default())
        .into_response()
}

/// 找下一个可用的重命名路径，比如 `a.md` → `a.1.md` → `a.2.md`；无后缀文件 → 追加 `.1`。
fn next_rename_candidate(orig: &std::path::Path) -> std::path::PathBuf {
    let parent = orig.parent().unwrap_or_else(|| std::path::Path::new("."));
    let stem = orig
        .file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or("file")
        .to_string();
    let ext = orig.extension().and_then(|e| e.to_str()).unwrap_or("");
    for i in 1..1000 {
        let name = if ext.is_empty() {
            format!("{stem}.{i}")
        } else {
            format!("{stem}.{i}.{ext}")
        };
        let cand = parent.join(name);
        if !cand.exists() {
            return cand;
        }
    }
    // 极端情况下 1000 次都撞车——回退到时间戳
    let ts = Utc::now().timestamp_nanos_opt().unwrap_or(0);
    let name = if ext.is_empty() {
        format!("{stem}.{ts}")
    } else {
        format!("{stem}.{ts}.{ext}")
    };
    parent.join(name)
}
