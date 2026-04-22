//! Skills 知识层管理 API（A.6）。
//!
//! 设计：
//! - 直接读写宿主机的 `amis-ai/skills/` 目录（**不内置**到二进制，所以编辑保存即对**下一个新任务**生效）
//! - 路由风格对齐 [`crate::handlers::project_ide`]：JWT 认证 + 路径越权校验 + 大小上限
//! - 写权限：D1 决策——任何登录用户均可（团队信任内网）
//! - 不做版本/历史：D5 决策——简单先跑
//!
//! 路由：
//! - `GET /api/skills` 列出所有桶（含 frontmatter name+description 概要）
//! - `GET /api/skills/:bucket/tree` 桶内文件树（递归）
//! - `GET /api/skills/:bucket/file?path=X` 读单文件
//! - `PUT /api/skills/:bucket/file` 写单文件（body 含 base_mtime_unix 防覆盖）
//!
//! 安全：
//! - bucket 名必须匹配 `^[A-Za-z_][A-Za-z0-9_-]*$`，绝不允许 `..` 或 `/`
//! - 文件路径必须**规范化后落在桶目录子树内**，越权返回 403
//! - 单文件读上限 512 KB，写上限 1 MB（超过返回 413）
//! - 只接受文本扩展名（.md / .txt / .json / .yaml / .yml）

use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use sea_orm::{ColumnTrait, EntityTrait, QueryFilter};
use serde::Deserialize;
use serde_json::json;

use crate::entity::user;
use crate::utils::jwt;
use crate::AppState;

const READ_SIZE_LIMIT: u64 = 512 * 1024;
const WRITE_SIZE_LIMIT: usize = 1024 * 1024;
const ALLOWED_EXTENSIONS: &[&str] = &["md", "txt", "json", "yaml", "yml"];

// ───────────────────────────── helpers

fn skills_root_path(state: &AppState) -> std::path::PathBuf {
    std::path::PathBuf::from(&state.skills_root)
}

/// RBAC：所有 Skills 管理接口仅 admin 可用。
/// 普通用户拿到 token 也只能在自己任务范围内操作（参见 project_ide.rs）。
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
            Json(json!({"error": "Skills 管理仅限管理员", "required_role": "admin"})),
        ));
    }
    Ok(())
}

/// 校验 bucket 名合法 + 返回桶根目录（不要求其存在，list 场景需要枚举）。
fn bucket_dir(
    state: &AppState,
    bucket: &str,
) -> Result<std::path::PathBuf, (StatusCode, Json<serde_json::Value>)> {
    let valid = !bucket.is_empty()
        && bucket.len() <= 64
        && bucket
            .chars()
            .all(|c| c.is_ascii_alphanumeric() || c == '_' || c == '-')
        && !bucket.starts_with('-');
    if !valid {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(json!({"error": format!("非法 bucket 名: {bucket}")})),
        ));
    }
    Ok(skills_root_path(state).join(bucket))
}

/// 把用户传入的相对路径**安全地**拼到 bucket 目录下。
///
/// 三道闸：
///   1. 拒绝绝对路径
///   2. 拒绝包含 `..` 的路径段
///   3. canonicalize 后必须仍在 bucket 子树内
///
/// 文件不存在时**也允许返回路径**（write 场景需要），由调用方决定是否 fail。
fn resolve_in_bucket(
    bucket_root: &std::path::Path,
    relpath: &str,
) -> Result<std::path::PathBuf, (StatusCode, Json<serde_json::Value>)> {
    let trimmed = relpath.trim();
    if trimmed.is_empty() {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(json!({"error": "path 不能为空"})),
        ));
    }
    let rel = std::path::Path::new(trimmed);
    if rel.is_absolute() {
        return Err((
            StatusCode::FORBIDDEN,
            Json(json!({"error": "path 不能是绝对路径"})),
        ));
    }
    for seg in rel.components() {
        match seg {
            std::path::Component::ParentDir => {
                return Err((
                    StatusCode::FORBIDDEN,
                    Json(json!({"error": "path 不允许包含 .."})),
                ))
            }
            std::path::Component::Prefix(_) | std::path::Component::RootDir => {
                return Err((
                    StatusCode::FORBIDDEN,
                    Json(json!({"error": "path 不允许 prefix/root"})),
                ))
            }
            _ => {}
        }
    }

    let candidate = bucket_root.join(rel);
    // 如果父目录存在则 canonicalize 父目录，再拼文件名做最终校验。
    // （canonicalize 要求路径整体存在；新文件没法直接 canonicalize）
    let parent = candidate.parent().unwrap_or(bucket_root);
    let real_parent = if parent.exists() {
        match std::fs::canonicalize(parent) {
            Ok(p) => p,
            Err(e) => {
                return Err((
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(json!({"error": format!("canonicalize 失败: {e}")})),
                ))
            }
        }
    } else {
        // parent 不存在则要求它在 bucket_root 下（用规则路径前缀比较，未规范化也够用）
        if !parent.starts_with(bucket_root) {
            return Err((
                StatusCode::FORBIDDEN,
                Json(json!({"error": "path 越权"})),
            ));
        }
        parent.to_path_buf()
    };
    let real_root = match std::fs::canonicalize(bucket_root) {
        Ok(p) => p,
        Err(e) => {
            return Err((
                StatusCode::NOT_FOUND,
                Json(json!({"error": format!("bucket 不存在: {e}")})),
            ))
        }
    };
    if !real_parent.starts_with(&real_root) {
        return Err((
            StatusCode::FORBIDDEN,
            Json(json!({"error": "path 越权（parent 不在 bucket 内）"})),
        ));
    }
    let filename = candidate.file_name().ok_or_else(|| {
        (
            StatusCode::BAD_REQUEST,
            Json(json!({"error": "path 末段为空"})),
        )
    })?;
    Ok(real_parent.join(filename))
}

fn extension_allowed(path: &std::path::Path) -> bool {
    path.extension()
        .and_then(|e| e.to_str())
        .map(|e| ALLOWED_EXTENSIONS.contains(&e.to_ascii_lowercase().as_str()))
        .unwrap_or(false)
}

/// 极简 frontmatter 解析（同 claw-agent-server::skills，复制实现避免跨 crate 依赖）。
fn parse_frontmatter(content: &str) -> (Option<String>, Option<String>) {
    let mut lines = content.lines();
    let first = match lines.next() {
        Some(l) => l.trim(),
        None => return (None, None),
    };
    if first != "---" {
        return (None, None);
    }
    let mut name = None;
    let mut description = None;
    for line in lines {
        let trimmed = line.trim();
        if trimmed == "---" {
            break;
        }
        let parse_value =
            |rest: &str| rest.trim().trim_matches('"').trim_matches('\'').to_string();
        if let Some(rest) = trimmed.strip_prefix("name:") {
            let v = parse_value(rest);
            if !v.is_empty() {
                name = Some(v);
            }
        } else if let Some(rest) = trimmed.strip_prefix("description:") {
            let v = parse_value(rest);
            if !v.is_empty() {
                description = Some(v);
            }
        }
    }
    (name, description)
}

fn mtime_unix(meta: &std::fs::Metadata) -> Option<i64> {
    meta.modified()
        .ok()
        .and_then(|m| m.duration_since(std::time::UNIX_EPOCH).ok())
        .map(|d| d.as_secs() as i64)
}

// ───────────────────────────── handlers

/// `GET /api/skills`
/// 列出所有桶 + 它们的元数据（dir_name / display_name / description / has_skill_md / file_count）。
pub async fn list_buckets(
    State(state): State<AppState>,
    auth: jwt::AuthUser,
) -> impl IntoResponse {
    if let Err(e) = require_admin(&state, &auth).await {
        return e.into_response();
    }
    let root = skills_root_path(&state);
    let read_dir = match std::fs::read_dir(&root) {
        Ok(rd) => rd,
        Err(e) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({"error": format!("读 skills 根目录失败: {e}"), "skills_root": root.display().to_string()})),
            )
                .into_response()
        }
    };

    let mut buckets: Vec<serde_json::Value> = Vec::new();
    for entry in read_dir.flatten() {
        let path = entry.path();
        if !path.is_dir() {
            continue;
        }
        let dir_name = match path.file_name().and_then(|n| n.to_str()) {
            Some(n) => n.to_string(),
            None => continue,
        };
        if dir_name.starts_with('.') {
            continue;
        }
        let skill_md = path.join("SKILL.md");
        let (display_name, description) = if skill_md.exists() {
            match std::fs::read_to_string(&skill_md) {
                Ok(content) => {
                    let (n, d) = parse_frontmatter(&content);
                    (n.unwrap_or_else(|| dir_name.clone()), d)
                }
                Err(_) => (dir_name.clone(), None),
            }
        } else {
            (dir_name.clone(), None)
        };
        let file_count = walkdir::WalkDir::new(&path)
            .into_iter()
            .filter_map(|e| e.ok())
            .filter(|e| e.path().is_file())
            .count();
        buckets.push(json!({
            "dir_name": dir_name,
            "display_name": display_name,
            "description": description,
            "has_skill_md": skill_md.exists(),
            "file_count": file_count,
        }));
    }
    buckets.sort_by(|a, b| a["dir_name"].as_str().cmp(&b["dir_name"].as_str()));
    Json(json!({
        "skills_root": root.display().to_string(),
        "buckets": buckets,
        "notice": "编辑保存后，对下一个新任务生效；正在运行的任务不会感知。"
    }))
    .into_response()
}

/// `GET /api/skills/:bucket/tree`
/// 递归返回桶内文件树。每个文件节点带 size 和 mtime。
pub async fn bucket_tree(
    State(state): State<AppState>,
    auth: jwt::AuthUser,
    Path(bucket): Path<String>,
) -> impl IntoResponse {
    if let Err(e) = require_admin(&state, &auth).await {
        return e.into_response();
    }
    let dir = match bucket_dir(&state, &bucket) {
        Ok(d) => d,
        Err(e) => return e.into_response(),
    };
    if !dir.exists() {
        return (
            StatusCode::NOT_FOUND,
            Json(json!({"error": format!("bucket {} 不存在", bucket)})),
        )
            .into_response();
    }

    fn walk(root: &std::path::Path, current: &std::path::Path) -> serde_json::Value {
        let read = match std::fs::read_dir(current) {
            Ok(r) => r,
            Err(_) => return json!([]),
        };
        let mut entries: Vec<(String, std::path::PathBuf)> = read
            .flatten()
            .map(|e| {
                let n = e.file_name().to_string_lossy().to_string();
                (n, e.path())
            })
            .filter(|(n, _)| !n.starts_with('.'))
            .collect();
        entries.sort_by(|a, b| {
            // 目录在前
            let ad = a.1.is_dir();
            let bd = b.1.is_dir();
            bd.cmp(&ad).then(a.0.cmp(&b.0))
        });
        let nodes: Vec<serde_json::Value> = entries
            .into_iter()
            .map(|(name, path)| {
                let rel = path.strip_prefix(root).unwrap_or(&path);
                if path.is_dir() {
                    json!({
                        "name": name,
                        "type": "dir",
                        "path": rel.to_string_lossy(),
                        "children": walk(root, &path),
                    })
                } else {
                    let meta = std::fs::metadata(&path).ok();
                    json!({
                        "name": name,
                        "type": "file",
                        "path": rel.to_string_lossy(),
                        "size": meta.as_ref().map(|m| m.len()),
                        "mtime_unix": meta.as_ref().and_then(mtime_unix),
                    })
                }
            })
            .collect();
        json!(nodes)
    }

    let tree = walk(&dir, &dir);
    Json(json!({
        "bucket": bucket,
        "tree": tree,
    }))
    .into_response()
}

#[derive(Debug, Deserialize)]
pub struct PathQuery {
    pub path: String,
}

/// `GET /api/skills/:bucket/file?path=X`
pub async fn read_file(
    State(state): State<AppState>,
    auth: jwt::AuthUser,
    Path(bucket): Path<String>,
    Query(q): Query<PathQuery>,
) -> impl IntoResponse {
    if let Err(e) = require_admin(&state, &auth).await {
        return e.into_response();
    }
    let dir = match bucket_dir(&state, &bucket) {
        Ok(d) => d,
        Err(e) => return e.into_response(),
    };
    let full = match resolve_in_bucket(&dir, &q.path) {
        Ok(p) => p,
        Err(e) => return e.into_response(),
    };
    if !extension_allowed(&full) {
        return (
            StatusCode::UNSUPPORTED_MEDIA_TYPE,
            Json(json!({"error": format!("不支持的文件扩展名: {}", q.path)})),
        )
            .into_response();
    }
    let meta = match std::fs::metadata(&full) {
        Ok(m) => m,
        Err(e) => {
            return (
                StatusCode::NOT_FOUND,
                Json(json!({"error": format!("文件不存在: {e}")})),
            )
                .into_response()
        }
    };
    let truncated = meta.len() > READ_SIZE_LIMIT;
    let raw = match std::fs::read_to_string(&full) {
        Ok(s) => s,
        Err(e) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({"error": format!("读取失败: {e}")})),
            )
                .into_response()
        }
    };
    let content = if truncated {
        // 简单按字符截断，前端能看到大部分内容并知道被截了
        raw.chars().take((READ_SIZE_LIMIT as usize) / 2).collect()
    } else {
        raw
    };
    Json(json!({
        "bucket": bucket,
        "path": q.path,
        "content": content,
        "size": meta.len(),
        "mtime_unix": mtime_unix(&meta),
        "truncated": truncated,
    }))
    .into_response()
}

#[derive(Debug, Deserialize)]
pub struct WriteFileBody {
    pub path: String,
    pub content: String,
    /// 客户端读到的 mtime_unix；若不传则跳过冲突检测（强制覆盖）。
    pub base_mtime_unix: Option<i64>,
}

/// `PUT /api/skills/:bucket/file`
pub async fn write_file(
    State(state): State<AppState>,
    auth: jwt::AuthUser,
    Path(bucket): Path<String>,
    Json(body): Json<WriteFileBody>,
) -> impl IntoResponse {
    if let Err(e) = require_admin(&state, &auth).await {
        return e.into_response();
    }
    let dir = match bucket_dir(&state, &bucket) {
        Ok(d) => d,
        Err(e) => return e.into_response(),
    };
    if !dir.exists() {
        // 允许新建首个文件时顺手 mkdir 桶（D1 任何登录用户可写）
        if let Err(e) = std::fs::create_dir_all(&dir) {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({"error": format!("创建桶目录失败: {e}")})),
            )
                .into_response();
        }
    }

    let full = match resolve_in_bucket(&dir, &body.path) {
        Ok(p) => p,
        Err(e) => return e.into_response(),
    };
    if !extension_allowed(&full) {
        return (
            StatusCode::UNSUPPORTED_MEDIA_TYPE,
            Json(json!({"error": format!("不支持的文件扩展名: {}", body.path)})),
        )
            .into_response();
    }
    if body.content.len() > WRITE_SIZE_LIMIT {
        return (
            StatusCode::PAYLOAD_TOO_LARGE,
            Json(json!({
                "error": format!("内容 {} 字节，超过 {} 字节上限", body.content.len(), WRITE_SIZE_LIMIT)
            })),
        )
            .into_response();
    }

    // base_mtime_unix 冲突检测（与 project_ide 相同的乐观锁模式）
    if let Some(base) = body.base_mtime_unix {
        if let Ok(meta) = std::fs::metadata(&full) {
            if let Some(current) = mtime_unix(&meta) {
                if current != base {
                    return (
                        StatusCode::CONFLICT,
                        Json(json!({
                            "error": "文件已被他人修改（mtime 不匹配），请重新打开",
                            "current_mtime_unix": current,
                            "base_mtime_unix": base,
                        })),
                    )
                        .into_response();
                }
            }
        }
    }

    if let Some(parent) = full.parent() {
        if let Err(e) = std::fs::create_dir_all(parent) {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({"error": format!("mkdir 失败: {e}")})),
            )
                .into_response();
        }
    }
    if let Err(e) = std::fs::write(&full, &body.content) {
        return (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({"error": format!("写入失败: {e}")})),
        )
            .into_response();
    }
    let new_mtime = std::fs::metadata(&full).ok().and_then(|m| mtime_unix(&m));
    Json(json!({
        "ok": true,
        "bucket": bucket,
        "path": body.path,
        "mtime_unix": new_mtime,
        "notice": "改动已保存。下一个新任务的 system_prompt 将看到新内容；正在跑的任务不受影响。"
    }))
    .into_response()
}

// ───────────────────────────── 文件树编辑（A.6 round 2：mkdir / delete / rename / create-bucket）

#[derive(Debug, Deserialize)]
pub struct MkdirBody {
    pub path: String,
}

/// `POST /api/skills/:bucket/mkdir`
/// body: `{path: "references/extras"}`
pub async fn mkdir(
    State(state): State<AppState>,
    auth: jwt::AuthUser,
    Path(bucket): Path<String>,
    Json(body): Json<MkdirBody>,
) -> impl IntoResponse {
    if let Err(e) = require_admin(&state, &auth).await {
        return e.into_response();
    }
    let dir = match bucket_dir(&state, &bucket) {
        Ok(d) => d,
        Err(e) => return e.into_response(),
    };
    let full = match resolve_in_bucket(&dir, &body.path) {
        Ok(p) => p,
        Err(e) => return e.into_response(),
    };
    if let Err(e) = std::fs::create_dir_all(&full) {
        return (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({"error": format!("mkdir 失败: {e}")})),
        )
            .into_response();
    }
    Json(json!({"ok": true, "bucket": bucket, "path": body.path})).into_response()
}

/// `DELETE /api/skills/:bucket/file?path=X`
/// 文件和目录都能删（目录递归）。删 SKILL.md 等于让桶失去索引能力，不阻拦——管理员自负。
pub async fn delete_path(
    State(state): State<AppState>,
    auth: jwt::AuthUser,
    Path(bucket): Path<String>,
    Query(q): Query<PathQuery>,
) -> impl IntoResponse {
    if let Err(e) = require_admin(&state, &auth).await {
        return e.into_response();
    }
    let dir = match bucket_dir(&state, &bucket) {
        Ok(d) => d,
        Err(e) => return e.into_response(),
    };
    let full = match resolve_in_bucket(&dir, &q.path) {
        Ok(p) => p,
        Err(e) => return e.into_response(),
    };
    if !full.exists() {
        return (
            StatusCode::NOT_FOUND,
            Json(json!({"error": "目标不存在"})),
        )
            .into_response();
    }
    let result = if full.is_dir() {
        std::fs::remove_dir_all(&full)
    } else {
        std::fs::remove_file(&full)
    };
    if let Err(e) = result {
        return (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({"error": format!("删除失败: {e}")})),
        )
            .into_response();
    }
    Json(json!({"ok": true, "bucket": bucket, "path": q.path})).into_response()
}

#[derive(Debug, Deserialize)]
pub struct RenameBody {
    pub old_path: String,
    pub new_path: String,
}

/// `POST /api/skills/:bucket/rename`
pub async fn rename_path(
    State(state): State<AppState>,
    auth: jwt::AuthUser,
    Path(bucket): Path<String>,
    Json(body): Json<RenameBody>,
) -> impl IntoResponse {
    if let Err(e) = require_admin(&state, &auth).await {
        return e.into_response();
    }
    let dir = match bucket_dir(&state, &bucket) {
        Ok(d) => d,
        Err(e) => return e.into_response(),
    };
    let from = match resolve_in_bucket(&dir, &body.old_path) {
        Ok(p) => p,
        Err(e) => return e.into_response(),
    };
    let to = match resolve_in_bucket(&dir, &body.new_path) {
        Ok(p) => p,
        Err(e) => return e.into_response(),
    };
    if !from.exists() {
        return (
            StatusCode::NOT_FOUND,
            Json(json!({"error": "源路径不存在"})),
        )
            .into_response();
    }
    if to.exists() {
        return (
            StatusCode::CONFLICT,
            Json(json!({"error": "目标路径已存在"})),
        )
            .into_response();
    }
    if let Some(parent) = to.parent() {
        let _ = std::fs::create_dir_all(parent);
    }
    if let Err(e) = std::fs::rename(&from, &to) {
        return (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({"error": format!("重命名失败: {e}")})),
        )
            .into_response();
    }
    Json(json!({
        "ok": true,
        "bucket": bucket,
        "old_path": body.old_path,
        "new_path": body.new_path,
    }))
    .into_response()
}

#[derive(Debug, Deserialize)]
pub struct CreateBucketBody {
    /// 目录名（小写字母+数字+下划线/连字符；下划线开头允许如 _common）
    pub dir_name: String,
    /// SKILL.md frontmatter 中的 `name`（默认同 dir_name）
    pub display_name: Option<String>,
    /// SKILL.md frontmatter 中的 `description`
    pub description: String,
    /// 可选：覆盖默认 SKILL.md 正文（不传则用模板）
    pub initial_skill_md_body: Option<String>,
}

/// `POST /api/skills`（创建桶）
/// 自动初始化：
///   - `<bucket>/SKILL.md` 含 frontmatter（name + description）+ 标准模板正文
///   - `<bucket>/references/.gitkeep`
///   - `<bucket>/assets/.gitkeep`
pub async fn create_bucket(
    State(state): State<AppState>,
    auth: jwt::AuthUser,
    Json(body): Json<CreateBucketBody>,
) -> impl IntoResponse {
    if let Err(e) = require_admin(&state, &auth).await {
        return e.into_response();
    }
    let dir = match bucket_dir(&state, &body.dir_name) {
        Ok(d) => d,
        Err(e) => return e.into_response(),
    };
    if dir.exists() {
        return (
            StatusCode::CONFLICT,
            Json(json!({"error": format!("桶 {} 已存在", body.dir_name)})),
        )
            .into_response();
    }
    if let Err(e) = std::fs::create_dir_all(dir.join("references")) {
        return (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({"error": format!("创建 references/ 失败: {e}")})),
        )
            .into_response();
    }
    if let Err(e) = std::fs::create_dir_all(dir.join("assets")) {
        return (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({"error": format!("创建 assets/ 失败: {e}")})),
        )
            .into_response();
    }
    // .gitkeep 让空目录能被 git 追踪
    let _ = std::fs::write(dir.join("references/.gitkeep"), "");
    let _ = std::fs::write(dir.join("assets/.gitkeep"), "");

    let display_name = body.display_name.unwrap_or_else(|| body.dir_name.clone());
    let body_text = body.initial_skill_md_body.unwrap_or_else(|| {
        format!(
            "# Skill: {dir} 索引\n\n（请在此填入工作流程：开局做什么、按需读哪份 reference、强约束有哪些）\n\n## 可用的 references\n\n- （示例）`references/foo.md`：foo 规则手册\n",
            dir = display_name
        )
    });
    let skill_md = format!(
        "---\nname: {name}\ndescription: {desc}\n---\n\n{body}\n",
        name = display_name,
        desc = body.description,
        body = body_text
    );
    if let Err(e) = std::fs::write(dir.join("SKILL.md"), skill_md) {
        return (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({"error": format!("写 SKILL.md 失败: {e}")})),
        )
            .into_response();
    }
    Json(json!({
        "ok": true,
        "bucket": body.dir_name,
        "display_name": display_name,
        "description": body.description,
        "notice": "桶已创建。新增 references/<name>.md 后，记得在 SKILL.md 索引段落里加一行说明。",
    }))
    .into_response()
}
