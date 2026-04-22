//! 沙箱文件系统接口 —— 直接读写宿主机 workdir（volume mount 的同步路径），
//! 不走 docker exec，性能更好且稳定。

use crate::state::SharedState;
use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use serde::{Deserialize, Serialize};
use serde_json::json;
use std::path::{Path as StdPath, PathBuf};
use tokio::fs;

const MAX_READ_BYTES: u64 = 512 * 1024; // 512KB
const MAX_WRITE_BYTES: usize = 2 * 1024 * 1024; // 2MB
const DEFAULT_TREE_DEPTH: usize = 6;

/// 内置忽略列表 —— 生成项目一般永远不需要走进这些目录。
const IGNORE_NAMES: &[&str] = &[
    "node_modules",
    ".git",
    "dist",
    ".output",
    "unpackage",
    ".nuxt",
    ".turbo",
    ".cache",
    "target",
];

// ────────────────────────────────────────── helpers

/// 把 workdir 定位到沙箱对应的宿主机路径，并对客户端传入的相对路径做越权防护。
async fn resolve_sandbox_path(
    state: &SharedState,
    sandbox_id: &str,
    rel_path: &str,
) -> Result<(String, PathBuf), (StatusCode, Json<serde_json::Value>)> {
    let workdir = {
        let map = state.sandboxes.read().await;
        match map.get(sandbox_id) {
            Some(sb) => sb.workdir.clone(),
            None => {
                return Err((
                    StatusCode::NOT_FOUND,
                    Json(json!({"error": "沙箱不存在"})),
                ))
            }
        }
    };

    // 规范化相对路径：去掉开头的 '/' 和 '.'
    let rel = rel_path.trim_start_matches('/').trim_start_matches("./");
    if rel.contains("..") || rel.contains('\0') {
        return Err((
            StatusCode::FORBIDDEN,
            Json(json!({"error": "非法路径（含 '..' 或空字符）"})),
        ));
    }

    let mut joined = PathBuf::from(&workdir);
    if !rel.is_empty() {
        joined.push(rel);
    }

    // 对已存在路径做 canonicalize；对待创建文件只规范化父目录。
    let canonical = if fs::try_exists(&joined).await.unwrap_or(false) {
        fs::canonicalize(&joined).await.map_err(|e| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({"error": format!("规范化路径失败: {e}")})),
            )
        })?
    } else if let Some(parent) = joined.parent() {
        if parent.exists() {
            let mut c = fs::canonicalize(parent).await.map_err(|e| {
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(json!({"error": format!("规范化父目录失败: {e}")})),
                )
            })?;
            if let Some(name) = joined.file_name() {
                c.push(name);
            }
            c
        } else {
            joined.clone()
        }
    } else {
        joined.clone()
    };

    let workdir_canonical = fs::canonicalize(&workdir).await.map_err(|e| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({"error": format!("规范化 workdir 失败: {e}")})),
        )
    })?;

    if !canonical.starts_with(&workdir_canonical) {
        return Err((
            StatusCode::FORBIDDEN,
            Json(json!({"error": "路径越权：超出沙箱工作目录"})),
        ));
    }

    Ok((workdir, canonical))
}

fn detect_lang(path: &StdPath) -> &'static str {
    match path.extension().and_then(|e| e.to_str()).unwrap_or("") {
        "ts" | "tsx" => "typescript",
        "js" | "jsx" | "cjs" | "mjs" => "javascript",
        "vue" => "vue",
        "json" => "json",
        "md" | "markdown" => "markdown",
        "html" | "htm" => "html",
        "css" => "css",
        "scss" | "sass" => "scss",
        "less" => "less",
        "yaml" | "yml" => "yaml",
        "toml" => "toml",
        "rs" => "rust",
        "py" => "python",
        "go" => "go",
        "sh" | "bash" => "shell",
        "svg" => "svg",
        "xml" => "xml",
        _ => "plaintext",
    }
}

fn mtime_secs(meta: &std::fs::Metadata) -> i64 {
    meta.modified()
        .ok()
        .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
        .map(|d| d.as_secs() as i64)
        .unwrap_or(0)
}

// ────────────────────────────────────────── tree

#[derive(Debug, Deserialize)]
pub struct TreeQuery {
    pub depth: Option<usize>,
}

#[derive(Debug, Serialize)]
pub struct TreeNode {
    pub name: String,
    pub path: String,
    #[serde(rename = "type")]
    pub kind: String, // "dir" | "file"
    pub size: Option<u64>,
    pub mtime: Option<i64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub children: Option<Vec<TreeNode>>,
}

fn walk_dir_sync(root: &StdPath, rel: &StdPath, max_depth: usize, depth: usize) -> std::io::Result<Vec<TreeNode>> {
    if depth >= max_depth {
        return Ok(vec![]);
    }
    let full = root.join(rel);
    let mut entries = Vec::new();
    let read_dir = match std::fs::read_dir(&full) {
        Ok(r) => r,
        Err(_) => return Ok(vec![]),
    };

    let mut items: Vec<_> = read_dir.filter_map(|e| e.ok()).collect();
    items.sort_by_key(|e| e.file_name());

    for entry in items {
        let name = entry.file_name().to_string_lossy().to_string();
        if IGNORE_NAMES.contains(&name.as_str()) {
            continue;
        }
        let meta = match entry.metadata() {
            Ok(m) => m,
            Err(_) => continue,
        };
        let rel_path = rel.join(&name);
        let rel_str = rel_path.to_string_lossy().replace('\\', "/");
        if meta.is_dir() {
            let children = walk_dir_sync(root, &rel_path, max_depth, depth + 1)?;
            entries.push(TreeNode {
                name,
                path: rel_str,
                kind: "dir".into(),
                size: None,
                mtime: Some(mtime_secs(&meta)),
                children: Some(children),
            });
        } else if meta.is_file() {
            entries.push(TreeNode {
                name,
                path: rel_str,
                kind: "file".into(),
                size: Some(meta.len()),
                mtime: Some(mtime_secs(&meta)),
                children: None,
            });
        }
    }
    Ok(entries)
}

pub async fn fs_tree(
    State(state): State<SharedState>,
    Path(id): Path<String>,
    Query(q): Query<TreeQuery>,
) -> impl IntoResponse {
    let workdir = {
        let map = state.sandboxes.read().await;
        match map.get(&id) {
            Some(sb) => sb.workdir.clone(),
            None => {
                return (
                    StatusCode::NOT_FOUND,
                    Json(json!({"error": "沙箱不存在"})),
                )
                    .into_response();
            }
        }
    };

    let depth = q.depth.unwrap_or(DEFAULT_TREE_DEPTH).clamp(1, 10);
    let workdir_clone = workdir.clone();
    let res = tokio::task::spawn_blocking(move || {
        walk_dir_sync(StdPath::new(&workdir_clone), StdPath::new(""), depth, 0)
    })
    .await;

    match res {
        Ok(Ok(nodes)) => Json(json!({
            "root": workdir,
            "depth": depth,
            "nodes": nodes,
        }))
        .into_response(),
        Ok(Err(e)) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({"error": format!("遍历失败: {e}")})),
        )
            .into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({"error": format!("spawn_blocking panic: {e}")})),
        )
            .into_response(),
    }
}

// ────────────────────────────────────────── read

#[derive(Debug, Deserialize)]
pub struct ReadQuery {
    pub path: String,
}

pub async fn fs_read(
    State(state): State<SharedState>,
    Path(id): Path<String>,
    Query(q): Query<ReadQuery>,
) -> impl IntoResponse {
    let (_workdir, abs) = match resolve_sandbox_path(&state, &id, &q.path).await {
        Ok(p) => p,
        Err(e) => return e.into_response(),
    };

    let meta = match fs::metadata(&abs).await {
        Ok(m) => m,
        Err(e) => {
            return (
                StatusCode::NOT_FOUND,
                Json(json!({"error": format!("文件不存在: {e}")})),
            )
                .into_response()
        }
    };
    if !meta.is_file() {
        return (
            StatusCode::BAD_REQUEST,
            Json(json!({"error": "不是文件"})),
        )
            .into_response();
    }

    let lang = detect_lang(&abs);
    let mtime = meta.modified()
        .ok()
        .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
        .map(|d| d.as_secs() as i64)
        .unwrap_or(0);

    if meta.len() > MAX_READ_BYTES {
        return Json(json!({
            "path": q.path,
            "size": meta.len(),
            "mtime": mtime,
            "lang": lang,
            "truncated": true,
            "content": "",
        }))
        .into_response();
    }

    match fs::read(&abs).await {
        Ok(bytes) => {
            // 尝试 UTF-8 解码，否则视为二进制文件并拒绝
            match String::from_utf8(bytes) {
                Ok(s) => Json(json!({
                    "path": q.path,
                    "size": meta.len(),
                    "mtime": mtime,
                    "lang": lang,
                    "truncated": false,
                    "content": s,
                }))
                .into_response(),
                Err(_) => Json(json!({
                    "path": q.path,
                    "size": meta.len(),
                    "mtime": mtime,
                    "lang": "binary",
                    "truncated": true,
                    "content": "",
                }))
                .into_response(),
            }
        }
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({"error": format!("读取失败: {e}")})),
        )
            .into_response(),
    }
}

// ────────────────────────────────────────── write

#[derive(Debug, Deserialize)]
pub struct WriteBody {
    pub path: String,
    pub content: String,
    /// 客户端打开文件时的 mtime，提交时用来做乐观锁。0 表示新文件或不校验。
    pub base_mtime: Option<i64>,
}

pub async fn fs_write(
    State(state): State<SharedState>,
    Path(id): Path<String>,
    Json(body): Json<WriteBody>,
) -> impl IntoResponse {
    if body.content.len() > MAX_WRITE_BYTES {
        return (
            StatusCode::PAYLOAD_TOO_LARGE,
            Json(json!({"error": "内容超过 2MB 上限"})),
        )
            .into_response();
    }

    let (_workdir, abs) = match resolve_sandbox_path(&state, &id, &body.path).await {
        Ok(p) => p,
        Err(e) => return e.into_response(),
    };

    // 乐观锁：若文件存在且客户端带了 base_mtime，则比对当前 mtime
    if let (Some(base), true) = (body.base_mtime, fs::try_exists(&abs).await.unwrap_or(false)) {
        if base > 0 {
            if let Ok(meta) = fs::metadata(&abs).await {
                let current = meta
                    .modified()
                    .ok()
                    .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
                    .map(|d| d.as_secs() as i64)
                    .unwrap_or(0);
                // 允许 1 秒误差（文件系统 mtime 分辨率）
                if (current - base).abs() > 1 {
                    return (
                        StatusCode::CONFLICT,
                        Json(json!({
                            "error": "文件已被其他方修改（乐观锁冲突）",
                            "server_mtime": current,
                            "client_base_mtime": base,
                        })),
                    )
                        .into_response();
                }
            }
        }
    }

    // 确保父目录存在
    if let Some(parent) = abs.parent() {
        let _ = fs::create_dir_all(parent).await;
    }

    match fs::write(&abs, body.content.as_bytes()).await {
        Ok(_) => {
            let mtime = fs::metadata(&abs)
                .await
                .ok()
                .and_then(|m| m.modified().ok())
                .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
                .map(|d| d.as_secs() as i64)
                .unwrap_or(0);
            Json(json!({
                "ok": true,
                "path": body.path,
                "size": body.content.len(),
                "mtime": mtime,
            }))
            .into_response()
        }
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({"error": format!("写入失败: {e}")})),
        )
            .into_response(),
    }
}

// ────────────────────────────────────────── delete

#[derive(Debug, Deserialize)]
pub struct DeleteQuery {
    pub path: String,
}

pub async fn fs_delete(
    State(state): State<SharedState>,
    Path(id): Path<String>,
    Query(q): Query<DeleteQuery>,
) -> impl IntoResponse {
    let (_workdir, abs) = match resolve_sandbox_path(&state, &id, &q.path).await {
        Ok(p) => p,
        Err(e) => return e.into_response(),
    };

    let meta = match fs::metadata(&abs).await {
        Ok(m) => m,
        Err(_) => {
            return (
                StatusCode::NOT_FOUND,
                Json(json!({"error": "文件/目录不存在"})),
            )
                .into_response()
        }
    };
    let res = if meta.is_dir() {
        fs::remove_dir_all(&abs).await
    } else {
        fs::remove_file(&abs).await
    };
    match res {
        Ok(_) => Json(json!({"ok": true, "path": q.path})).into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({"error": format!("删除失败: {e}")})),
        )
            .into_response(),
    }
}

// ────────────────────────────────────────── mkdir

#[derive(Debug, Deserialize)]
pub struct MkdirBody {
    pub path: String,
}

pub async fn fs_mkdir(
    State(state): State<SharedState>,
    Path(id): Path<String>,
    Json(body): Json<MkdirBody>,
) -> impl IntoResponse {
    let (_workdir, abs) = match resolve_sandbox_path(&state, &id, &body.path).await {
        Ok(p) => p,
        Err(e) => return e.into_response(),
    };
    match fs::create_dir_all(&abs).await {
        Ok(_) => Json(json!({"ok": true, "path": body.path})).into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({"error": format!("mkdir 失败: {e}")})),
        )
            .into_response(),
    }
}
