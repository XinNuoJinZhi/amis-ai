//! 2026-04-25 · 任务追踪日志（tracelog）
//!
//! 把每个 project_generation_task 的完整执行过程归档到 FS，供：
//!   - Claude / admin 事后分析"为什么上次任务失败"
//!   - 给 LLM 二次分析接口喂完整上下文（Phase D 可选，当前靠 cat）
//!
//! 目录结构：
//!   ${tracelog.dir}/task-{id}/
//!     manifest.json           任务元数据 + 最终状态
//!     events.jsonl            全量 WS 事件（除被路由到专属文件的特殊类型）
//!     system_prompt.md        完整 system_prompt 全文（人可读）
//!     llm_calls/call-NNN.json 每轮 LLM 调用的完整入参 + raw response
//!     skills_snapshot/<bucket>/... 本次注入到 prompt 的 SKILL 全文快照
//!     rag_snapshot/samples.json 本次召回 Top-K 样本的 full 快照
//!     analysis_input.md       给 Claude/LLM 看的总索引
//!
//! 配置（system_settings 表，前缀 `tracelog.`）：
//!   - mode: disabled / smart（仅失败任务详记）/ all_tasks（全记）— 默认 disabled
//!   - dir: 归档根目录（默认 /tmp/amis-ai/tracelogs，WSL 友好；prod 建议改 /var/amis-ai/tracelogs）
//!   - retention_days: 超过 N 天自动清，默认 30
//!   - compress: 终结时 tar.gz，默认 true（省 70%+）
//!
//! 所有 IO 错误静默降级（只日志 warn），不影响业务主流程。

use crate::handlers::system_settings::read_value_or;
use crate::AppState;
use chrono::Utc;
use serde_json::{json, Value};
use std::path::{Path, PathBuf};
use std::sync::{Mutex, OnceLock};
use std::time::Instant;
use tokio::fs;
use tokio::io::AsyncWriteExt;

/// 进程内配置缓存（30s TTL），避免每个 text_delta 事件都查 DB 4 次。
#[derive(Clone, Debug)]
struct CachedConfig {
    cfg: Config,
    cached_at: Instant,
}

#[derive(Clone, Debug)]
pub struct Config {
    pub mode: String, // "disabled" / "smart" / "all_tasks"
    pub dir: String,
    pub retention_days: i64,
    pub compress: bool,
}

static CONFIG_CACHE: OnceLock<Mutex<Option<CachedConfig>>> = OnceLock::new();
const CONFIG_TTL_SECS: u64 = 30;

async fn load_config(state: &AppState) -> Config {
    let lock = CONFIG_CACHE.get_or_init(|| Mutex::new(None));
    // 读缓存
    {
        let g = lock.lock().unwrap();
        if let Some(c) = g.as_ref() {
            if c.cached_at.elapsed().as_secs() < CONFIG_TTL_SECS {
                return c.cfg.clone();
            }
        }
    }
    let mode = read_value_or(state, "tracelog.mode", "disabled")
        .await
        .trim()
        .to_lowercase();
    let dir = read_value_or(state, "tracelog.dir", "/tmp/amis-ai/tracelogs")
        .await
        .trim()
        .to_string();
    let retention_days: i64 = read_value_or(state, "tracelog.retention_days", "30")
        .await
        .trim()
        .parse()
        .unwrap_or(30);
    let compress = read_value_or(state, "tracelog.compress", "true")
        .await
        .trim()
        .eq_ignore_ascii_case("true");
    let cfg = Config {
        mode,
        dir,
        retention_days,
        compress,
    };
    {
        let mut g = lock.lock().unwrap();
        *g = Some(CachedConfig {
            cfg: cfg.clone(),
            cached_at: Instant::now(),
        });
    }
    cfg
}

fn task_dir(cfg: &Config, task_id: i32) -> PathBuf {
    Path::new(&cfg.dir).join(format!("task-{}", task_id))
}

/// 任务初始化：创建目录 + manifest.json。仅当 mode != disabled 生效。
pub async fn init_task_tracelog(state: &AppState, task_id: i32) -> Option<PathBuf> {
    let cfg = load_config(state).await;
    if cfg.mode == "disabled" {
        return None;
    }
    let dir = task_dir(&cfg, task_id);
    if let Err(e) = fs::create_dir_all(&dir).await {
        tracing::warn!("tracelog: 创建目录 {} 失败：{}", dir.display(), e);
        return None;
    }
    let _ = fs::create_dir_all(dir.join("llm_calls")).await;
    let _ = fs::create_dir_all(dir.join("skills_snapshot")).await;
    let _ = fs::create_dir_all(dir.join("rag_snapshot")).await;
    let manifest = json!({
        "task_id": task_id,
        "created_at": Utc::now().to_rfc3339(),
        "tracelog_mode": cfg.mode,
        "compress": cfg.compress,
        "finalized_at": null,
        "final_status": null,
    });
    let _ = fs::write(
        dir.join("manifest.json"),
        serde_json::to_vec_pretty(&manifest).unwrap_or_default(),
    )
    .await;
    Some(dir)
}

/// 事件分诊写 FS。
/// - 特殊 type（llm_call_snapshot / skills_content_snapshot / rag_samples_snapshot / system_prompt_built）
///   路由到专属文件；
/// - 其他 append 到 events.jsonl。
pub async fn route_event(state: &AppState, task_id: i32, json_text: &str) {
    let cfg = load_config(state).await;
    if cfg.mode == "disabled" {
        return;
    }
    let dir = task_dir(&cfg, task_id);
    if !dir.exists() && init_task_tracelog(state, task_id).await.is_none() {
        return;
    }

    let parsed: Value = match serde_json::from_str(json_text) {
        Ok(v) => v,
        Err(_) => {
            append_events_jsonl(&dir, json_text).await;
            return;
        }
    };
    let event_type = parsed.get("type").and_then(|v| v.as_str()).unwrap_or("");
    match event_type {
        "llm_call_snapshot" => {
            // 计数找下一个 call-NNN.json
            let calls_dir = dir.join("llm_calls");
            let mut count = 0usize;
            if let Ok(mut rd) = fs::read_dir(&calls_dir).await {
                while let Ok(Some(_)) = rd.next_entry().await {
                    count += 1;
                }
            }
            let name = format!("call-{:03}.json", count + 1);
            // 美化 JSON 便于 cat 看
            let pretty = serde_json::to_vec_pretty(&parsed).unwrap_or_else(|_| json_text.as_bytes().to_vec());
            let _ = fs::write(calls_dir.join(name), pretty).await;
        }
        "skills_content_snapshot" => {
            // payload.data.contents = [{bucket, files: [{path, content}]}]
            let contents = parsed
                .get("data")
                .and_then(|d| d.get("contents"))
                .and_then(|v| v.as_array());
            if let Some(contents) = contents {
                let sk_dir = dir.join("skills_snapshot");
                for bucket_obj in contents {
                    let bucket = bucket_obj
                        .get("bucket")
                        .and_then(|v| v.as_str())
                        .unwrap_or("unknown");
                    // 硬安全：拒绝含 .. 或绝对路径的 bucket 名
                    if bucket.contains("..") || bucket.starts_with('/') {
                        continue;
                    }
                    let bd = sk_dir.join(bucket);
                    let _ = fs::create_dir_all(&bd).await;
                    if let Some(files) = bucket_obj.get("files").and_then(|v| v.as_array()) {
                        for f in files {
                            let rel = f.get("path").and_then(|v| v.as_str()).unwrap_or("");
                            if rel.is_empty() || rel.contains("..") || rel.starts_with('/') {
                                continue;
                            }
                            let content = f.get("content").and_then(|v| v.as_str()).unwrap_or("");
                            let target = bd.join(rel);
                            if let Some(p) = target.parent() {
                                let _ = fs::create_dir_all(p).await;
                            }
                            let _ = fs::write(target, content).await;
                        }
                    }
                }
            }
            // 大体积内容不再往 events.jsonl 写一份
        }
        "rag_samples_snapshot" => {
            let pretty = serde_json::to_vec_pretty(&parsed).unwrap_or_else(|_| json_text.as_bytes().to_vec());
            let _ = fs::write(dir.join("rag_snapshot/samples.json"), pretty).await;
        }
        "system_prompt_built" => {
            // 继续写到 events.jsonl（有 sha256 + preview 有用），但不写 prompt_full（太大）
            // 然后把 prompt_full 单独落到 system_prompt.md
            if let Some(full) = parsed
                .get("data")
                .and_then(|d| d.get("prompt_full"))
                .and_then(|v| v.as_str())
            {
                let _ = fs::write(dir.join("system_prompt.md"), full).await;
            }
            // 写一个不含 prompt_full 的精简事件到 events.jsonl（防 jsonl 行过长）
            let mut slim = parsed.clone();
            if let Some(data) = slim.get_mut("data").and_then(|d| d.as_object_mut()) {
                data.remove("prompt_full");
                data.insert("prompt_full_location".to_string(), json!("system_prompt.md"));
            }
            append_events_jsonl(&dir, &slim.to_string()).await;
        }
        _ => {
            append_events_jsonl(&dir, json_text).await;
        }
    }
}

async fn append_events_jsonl(dir: &Path, json_text: &str) {
    let path = dir.join("events.jsonl");
    if let Ok(mut file) = fs::OpenOptions::new()
        .create(true)
        .append(true)
        .open(&path)
        .await
    {
        let mut line = json_text.to_string();
        if !line.ends_with('\n') {
            line.push('\n');
        }
        let _ = file.write_all(line.as_bytes()).await;
    }
}

/// 任务终结时回调：写 final manifest、生成 analysis_input.md、可选打包压缩。
/// smart 模式 + status=succeeded → 只保留 manifest（节省空间）。
/// 失败 / stopped / all_tasks 模式 → 保留完整归档。
pub async fn finalize_task_tracelog(state: &AppState, task_id: i32, final_status: &str) {
    let cfg = load_config(state).await;
    if cfg.mode == "disabled" {
        return;
    }
    let dir = task_dir(&cfg, task_id);
    if !dir.exists() {
        return;
    }

    // 更新 manifest
    let manifest_path = dir.join("manifest.json");
    let mut manifest: Value = fs::read_to_string(&manifest_path)
        .await
        .ok()
        .and_then(|s| serde_json::from_str(&s).ok())
        .unwrap_or_else(|| json!({ "task_id": task_id }));
    manifest["finalized_at"] = json!(Utc::now().to_rfc3339());
    manifest["final_status"] = json!(final_status);
    let _ = fs::write(
        &manifest_path,
        serde_json::to_vec_pretty(&manifest).unwrap_or_default(),
    )
    .await;

    // smart 模式成功任务 → 丢大文件留 manifest
    if cfg.mode == "smart" && final_status == "succeeded" {
        let _ = fs::remove_dir_all(dir.join("llm_calls")).await;
        let _ = fs::remove_dir_all(dir.join("skills_snapshot")).await;
        let _ = fs::remove_dir_all(dir.join("rag_snapshot")).await;
        let _ = fs::remove_file(dir.join("events.jsonl")).await;
        let _ = fs::remove_file(dir.join("system_prompt.md")).await;
        tracing::info!("tracelog smart: task {} succeeded, retained manifest only", task_id);
        return;
    }

    // 生成 analysis_input.md 总索引
    write_analysis_input(&dir, task_id, final_status, &cfg.mode).await;

    // 压缩
    if cfg.compress {
        compress_dir(&dir).await;
    }
}

/// 打包到同目录下的 .tar.gz，成功后删除源目录。失败日志 warn 不抛。
async fn compress_dir(dir: &Path) {
    let parent = match dir.parent() {
        Some(p) => p,
        None => return,
    };
    let name = match dir.file_name() {
        Some(n) => n.to_os_string(),
        None => return,
    };
    let archive = parent.join(format!("{}.tar.gz", name.to_string_lossy()));
    // 调系统 tar —— amis-ai 部署环境（WSL / Linux）都有
    let status = tokio::process::Command::new("tar")
        .arg("-czf")
        .arg(&archive)
        .arg("-C")
        .arg(parent)
        .arg(name.as_os_str())
        .status()
        .await;
    match status {
        Ok(s) if s.success() => {
            let _ = fs::remove_dir_all(dir).await;
            tracing::info!("tracelog: 归档到 {}", archive.display());
        }
        Ok(s) => tracing::warn!("tracelog: tar 返回非零：{:?}", s.code()),
        Err(e) => tracing::warn!("tracelog: 调 tar 失败：{}", e),
    }
}

async fn write_analysis_input(dir: &Path, task_id: i32, final_status: &str, mode: &str) {
    let mut buf = String::new();
    buf.push_str(&format!("# Task #{} Tracelog 分析素材\n\n", task_id));
    buf.push_str(&format!("- 最终状态：`{}`\n", final_status));
    buf.push_str(&format!("- 归档时间：{}\n", Utc::now().to_rfc3339()));
    buf.push_str(&format!("- Tracelog 模式：`{}`\n", mode));
    buf.push_str(&format!("- 归档目录：`{}`\n\n", dir.display()));

    buf.push_str("## 文件索引\n\n");
    buf.push_str("| 文件 | 说明 |\n|---|---|\n");
    buf.push_str("| `manifest.json` | 元数据 + 最终状态 |\n");
    buf.push_str("| `events.jsonl` | 全量 WS 事件流（按时间顺序；`text_delta` / `tool_use` / `tool_result` / `status_change` 等）|\n");
    buf.push_str("| `system_prompt.md` | 完整 system_prompt 全文（含 skills + RAG 样例）|\n");
    buf.push_str("| `llm_calls/call-NNN.json` | 每轮 LLM 调用：完整入参 messages + raw response + usage |\n");
    buf.push_str("| `skills_snapshot/<bucket>/...` | 本次注入到 prompt 的 SKILL.md / references 全文快照 |\n");
    buf.push_str("| `rag_snapshot/samples.json` | 本次召回 Top-K 样本的 full_amis_json + full_code 快照 |\n\n");

    buf.push_str("## 给 Claude / LLM 的分析建议\n\n");
    buf.push_str("1. 先读 `manifest.json` 了解任务元数据\n");
    buf.push_str("2. 读 `system_prompt.md` 看 LLM 起步拿到的完整上下文（skills + RAG 是否合理）\n");
    buf.push_str("3. 顺序看 `llm_calls/call-*.json` 跟 LLM 每轮推理演化 + tool_use 决策\n");
    buf.push_str("4. 结合 `events.jsonl` 的 tool_result 看工具实际返回值\n");
    buf.push_str(&format!(
        "5. 若状态={}：定位最后 2-3 条 tool_result 的 `is_error=true` + 对应 LLM 在下一 call 中如何响应\n\n",
        final_status
    ));
    buf.push_str("## 常见问题排查切入点\n\n");
    buf.push_str("- **Agent 陷入循环**：events.jsonl 中 tool_use name 重复率 > 50%\n");
    buf.push_str("- **RAG 样本不相关**：对比 rag_snapshot/samples.json 与 amis_json，相似度 <0.5 时考虑调 RAG knob\n");
    buf.push_str("- **Skills 加载错位**：skills_snapshot 缺关键 bucket 或注入了无关 skill\n");
    buf.push_str("- **LLM 输出格式乱**：call-*.json 的 response_raw 检查 finish_reason 是 stop 还是 length/error\n");

    let _ = fs::write(dir.join("analysis_input.md"), buf).await;
}

/// 路径白名单（防越权读宿主机任意文件）。返回 true = 可读。
///
/// 允许：
///   - 顶层 metadata：manifest.json / analysis_input.md / system_prompt.md / events.jsonl
///   - llm_calls/<*.json>
///   - skills_snapshot/<bucket>/<...>（任意层 .md）
///   - rag_snapshot/<*.json|md>
///
/// 拒绝：含 `..`、绝对路径、超过白名单。
fn rel_path_allowed(rel: &str) -> bool {
    if rel.is_empty() || rel.contains("..") || rel.starts_with('/') {
        return false;
    }
    if matches!(
        rel,
        "manifest.json" | "analysis_input.md" | "system_prompt.md" | "events.jsonl"
    ) {
        return true;
    }
    if let Some(rest) = rel.strip_prefix("llm_calls/") {
        return rest.ends_with(".json") && !rest.contains('/');
    }
    if rel.starts_with("skills_snapshot/") {
        // 允许任意子目录但只放 .md
        return rel.ends_with(".md");
    }
    if let Some(rest) = rel.strip_prefix("rag_snapshot/") {
        return (rest.ends_with(".json") || rest.ends_with(".md")) && !rest.contains('/');
    }
    false
}

const TRACELOG_FILE_READ_MAX_BYTES: u64 = 1024 * 1024; // 1MB

/// 列出某任务归档里的所有可读文件（已通过白名单过滤）。目录形式直接 walk；tar.gz 形式 `tar -tzf` 列条目。
pub async fn task_tracelog_list_files(state: &AppState, task_id: i32) -> Vec<String> {
    let cfg = load_config(state).await;
    let dir = task_dir(&cfg, task_id);
    let tar_path = Path::new(&cfg.dir).join(format!("task-{}.tar.gz", task_id));

    let mut entries: Vec<String> = Vec::new();
    if tar_path.exists() {
        // tar -tzf archive.tar.gz → 每行一个 entry，前缀是 "task-N/"
        let prefix = format!("task-{}/", task_id);
        if let Ok(out) = tokio::process::Command::new("tar")
            .arg("-tzf")
            .arg(&tar_path)
            .output()
            .await
        {
            if out.status.success() {
                for line in String::from_utf8_lossy(&out.stdout).lines() {
                    let trimmed = line.trim_end_matches('/');
                    if let Some(rel) = trimmed.strip_prefix(&prefix) {
                        if !rel.is_empty() && rel_path_allowed(rel) {
                            entries.push(rel.to_string());
                        }
                    }
                }
            }
        }
    } else if dir.exists() {
        // 目录形式：递归 walk
        walk_collect(&dir, "", &mut entries).await;
        entries.retain(|e| rel_path_allowed(e));
    }
    entries.sort();
    entries
}

/// 异步递归收集目录下所有相对路径（不解 symlink）。box 化避免无限大小递归。
fn walk_collect<'a>(
    base: &'a Path,
    rel_prefix: &'a str,
    out: &'a mut Vec<String>,
) -> std::pin::Pin<Box<dyn std::future::Future<Output = ()> + Send + 'a>> {
    Box::pin(async move {
        let dir = if rel_prefix.is_empty() {
            base.to_path_buf()
        } else {
            base.join(rel_prefix)
        };
        if let Ok(mut rd) = fs::read_dir(&dir).await {
            while let Ok(Some(entry)) = rd.next_entry().await {
                let name = match entry.file_name().into_string() {
                    Ok(n) => n,
                    Err(_) => continue,
                };
                let rel = if rel_prefix.is_empty() {
                    name.clone()
                } else {
                    format!("{}/{}", rel_prefix, name)
                };
                let path = entry.path();
                if path.is_dir() {
                    walk_collect(base, &rel, out).await;
                } else {
                    out.push(rel);
                }
            }
        }
    })
}

/// 读取归档内单文件内容。路径白名单 + 1MB 上限；越权 / 超大 / 不存在均返回 None。
pub async fn task_tracelog_read_file(
    state: &AppState,
    task_id: i32,
    rel_path: &str,
) -> Option<Vec<u8>> {
    if !rel_path_allowed(rel_path) {
        return None;
    }
    let cfg = load_config(state).await;
    let dir = task_dir(&cfg, task_id);
    let tar_path = Path::new(&cfg.dir).join(format!("task-{}.tar.gz", task_id));

    if tar_path.exists() {
        // tar -xzOf archive.tar.gz task-N/<rel> → 单文件流到 stdout
        let inner_path = format!("task-{}/{}", task_id, rel_path);
        let out = tokio::process::Command::new("tar")
            .arg("-xzOf")
            .arg(&tar_path)
            .arg(&inner_path)
            .output()
            .await
            .ok()?;
        if !out.status.success() {
            return None;
        }
        if (out.stdout.len() as u64) > TRACELOG_FILE_READ_MAX_BYTES {
            // 截断 + 末尾警告
            let mut truncated = out.stdout;
            truncated.truncate(TRACELOG_FILE_READ_MAX_BYTES as usize);
            truncated.extend_from_slice(
                b"\n\n---\n[tracelog: truncated to 1MB; download full archive to see the rest]\n",
            );
            return Some(truncated);
        }
        return Some(out.stdout);
    }

    if dir.exists() {
        let path = dir.join(rel_path);
        // 二次校验：canonicalize 后必须仍在 dir 之下（防 symlink 越权）
        let canon = fs::canonicalize(&path).await.ok()?;
        let dir_canon = fs::canonicalize(&dir).await.ok()?;
        if !canon.starts_with(&dir_canon) {
            return None;
        }
        let meta = fs::metadata(&canon).await.ok()?;
        if meta.len() > TRACELOG_FILE_READ_MAX_BYTES {
            // 截断读：用 take 读前 1MB
            use tokio::io::AsyncReadExt;
            let mut f = fs::File::open(&canon).await.ok()?;
            let mut buf = vec![0u8; TRACELOG_FILE_READ_MAX_BYTES as usize];
            let n = f.read(&mut buf).await.ok()?;
            buf.truncate(n);
            buf.extend_from_slice(
                b"\n\n---\n[tracelog: truncated to 1MB; download full archive to see the rest]\n",
            );
            return Some(buf);
        }
        return fs::read(&canon).await.ok();
    }

    None
}

/// 给 handler 用：查询某任务的归档信息（路径是否存在、是 tar.gz 还是目录、大小）
pub async fn task_tracelog_info(state: &AppState, task_id: i32) -> Value {
    let cfg = load_config(state).await;
    let dir = task_dir(&cfg, task_id);
    let tar_path = Path::new(&cfg.dir).join(format!("task-{}.tar.gz", task_id));

    let dir_exists = dir.exists();
    let tar_exists = tar_path.exists();
    let mut size: u64 = 0;
    let mut files_count: usize = 0;

    if tar_exists {
        if let Ok(meta) = fs::metadata(&tar_path).await {
            size = meta.len();
        }
        files_count = 1;
    } else if dir_exists {
        // 简单递归统计（不深，目录顶多 4 级）
        let (s, n) = dir_size_recursive(&dir).await;
        size = s;
        files_count = n;
    }

    json!({
        "mode": cfg.mode,
        "task_id": task_id,
        "exists": tar_exists || dir_exists,
        "is_archive": tar_exists,
        "path": if tar_exists { tar_path.display().to_string() } else { dir.display().to_string() },
        "size_bytes": size,
        "files_count": files_count,
    })
}

async fn dir_size_recursive(dir: &Path) -> (u64, usize) {
    let mut size: u64 = 0;
    let mut count: usize = 0;
    if let Ok(mut rd) = fs::read_dir(dir).await {
        while let Ok(Some(entry)) = rd.next_entry().await {
            let path = entry.path();
            if path.is_dir() {
                let (s, n) = Box::pin(dir_size_recursive(&path)).await;
                size += s;
                count += n;
            } else if let Ok(meta) = entry.metadata().await {
                size += meta.len();
                count += 1;
            }
        }
    }
    (size, count)
}

/// 读取归档文件原始字节（供下载接口）。tar.gz 直接 cat；目录形式则现场打包到内存。
pub async fn task_tracelog_bytes(state: &AppState, task_id: i32) -> Option<(Vec<u8>, String)> {
    let cfg = load_config(state).await;
    let tar_path = Path::new(&cfg.dir).join(format!("task-{}.tar.gz", task_id));
    if tar_path.exists() {
        let bytes = fs::read(&tar_path).await.ok()?;
        return Some((bytes, format!("task-{}.tar.gz", task_id)));
    }
    // 目录形式：现场打包到 tempfile
    let dir = task_dir(&cfg, task_id);
    if !dir.exists() {
        return None;
    }
    let parent = dir.parent()?;
    let name = dir.file_name()?.to_os_string();
    let tmp = std::env::temp_dir().join(format!("tracelog-{}-{}.tar.gz", task_id, std::process::id()));
    let status = tokio::process::Command::new("tar")
        .arg("-czf")
        .arg(&tmp)
        .arg("-C")
        .arg(parent)
        .arg(name.as_os_str())
        .status()
        .await
        .ok()?;
    if !status.success() {
        return None;
    }
    let bytes = fs::read(&tmp).await.ok()?;
    let _ = fs::remove_file(&tmp).await;
    Some((bytes, format!("task-{}.tar.gz", task_id)))
}

/// spawn 后台清理：每 6 小时扫一次归档根目录，超 retention_days 的目录 / tar.gz 直接删。
pub fn spawn_cleanup(state: AppState) {
    tokio::spawn(async move {
        loop {
            tokio::time::sleep(std::time::Duration::from_secs(6 * 3600)).await;
            let cfg = load_config(&state).await;
            if cfg.mode == "disabled" {
                continue;
            }
            if cfg.retention_days <= 0 {
                continue; // 0 / 负数 = 永久保留
            }
            let retention_secs = (cfg.retention_days as u64) * 86400;
            let root = Path::new(&cfg.dir);
            if !root.exists() {
                continue;
            }
            let mut removed = 0usize;
            if let Ok(mut rd) = fs::read_dir(root).await {
                while let Ok(Some(entry)) = rd.next_entry().await {
                    if let Ok(meta) = entry.metadata().await {
                        if let Ok(modified) = meta.modified() {
                            if let Ok(age) = modified.elapsed() {
                                if age.as_secs() > retention_secs {
                                    let path = entry.path();
                                    let res = if path.is_dir() {
                                        fs::remove_dir_all(&path).await
                                    } else {
                                        fs::remove_file(&path).await
                                    };
                                    if res.is_ok() {
                                        removed += 1;
                                    }
                                }
                            }
                        }
                    }
                }
            }
            if removed > 0 {
                tracing::info!("tracelog cleanup: 删除 {} 条过期归档", removed);
            }
        }
    });
}
