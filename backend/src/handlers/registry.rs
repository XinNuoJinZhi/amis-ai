//! 维度注册表 API（2026-04 技术栈解耦重构）。
//!
//! 前端创建任务时需要知道：
//!   - 有哪些平台 / 技术栈 / UI 库可选（`GET /api/registry/platforms`）
//!   - 有哪些底座模板可用（`GET /api/registry/templates`）
//!   - 有哪些 Skills 桶（按维度分组，`GET /api/registry/skills`）
//!   - 选了 A/B/C 后会激活哪些 Skills 桶（`POST /api/registry/resolve-skills`）
//!
//! 数据源：
//!   - templates / platforms / stacks / ui_libs → 从 `AppState.template_registry` + 内置枚举聚合
//!   - skills → 运行时扫 `AppState.skills_root` 的每个桶 `SKILL.md` frontmatter
//!
//! 权限：所有端点仅需登录（非 admin 亦可读，用于 CreateTaskModal 渲染），
//! 写操作本文件不涉及。

use axum::{
    extract::State,
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use serde::{Deserialize, Serialize};
use serde_json::json;
use std::path::{Path, PathBuf};

use crate::utils::jwt::AuthUser;
use crate::AppState;

// ───────────────────────────── 数据模型

#[derive(Debug, Serialize)]
pub struct PlatformEntry {
    pub id: String,
    pub name: String,
    pub stacks: Vec<StackEntry>,
}

#[derive(Debug, Serialize)]
pub struct StackEntry {
    pub id: String,
    pub name: String,
    pub ui_libs: Vec<UiLibEntry>,
}

#[derive(Debug, Serialize)]
pub struct UiLibEntry {
    pub id: String,
    pub name: String,
}

#[derive(Debug, Serialize)]
pub struct TemplateSummary {
    pub name: String,
    pub platform: String,
    pub tech_stacks: Vec<String>,
    pub ui_libs: Vec<String>,
    pub has_scaffold: bool,
    pub dev_command: Option<String>,
    pub default_skill_buckets: Vec<String>,
}

#[derive(Debug, Serialize)]
pub struct SkillBucketSummary {
    pub dir_name: String,
    pub display_name: String,
    pub description: Option<String>,
    pub kind: Option<String>,
    pub platforms: Vec<String>,
    pub tech_stacks: Vec<String>,
    pub ui_libs: Vec<String>,
    pub requires: Vec<String>,
    pub conflicts: Vec<String>,
    pub priority: i32,
}

#[derive(Debug, Deserialize)]
pub struct ResolveSkillsPayload {
    #[serde(default)]
    pub platform: Option<String>,
    #[serde(default)]
    pub tech_stacks: Vec<String>,
    #[serde(default)]
    pub ui_libs: Vec<String>,
    #[serde(default)]
    pub template_name: Option<String>,
    #[serde(default)]
    pub explicit_buckets: Vec<String>,
    #[serde(default)]
    pub legacy_stack: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct ResolveSkillsResponse {
    pub selected: Vec<String>,
    pub sections: usize,
    pub warnings: Vec<String>,
}

// ───────────────────────────── 内置维度枚举（缺省值；前端支持 tags 自由输入扩展）

fn builtin_platforms() -> Vec<PlatformEntry> {
    vec![
        PlatformEntry {
            id: "web".into(),
            name: "Web 端".into(),
            stacks: vec![
                StackEntry {
                    id: "react".into(),
                    name: "React".into(),
                    ui_libs: vec![
                        UiLibEntry { id: "antd".into(), name: "Ant Design".into() },
                        UiLibEntry { id: "arco".into(), name: "Arco Design".into() },
                        // 1.3 引入：ZC 智搭低代码平台 Amis 二开版（含 zc-editor 底座 + 121 个二开组件）
                        UiLibEntry { id: "zc-amis".into(), name: "ZC 智搭 Amis".into() },
                    ],
                },
                StackEntry {
                    id: "vue3".into(),
                    name: "Vue 3".into(),
                    ui_libs: vec![
                        UiLibEntry { id: "element-plus".into(), name: "Element Plus".into() },
                        UiLibEntry { id: "naive".into(), name: "Naive UI".into() },
                    ],
                },
                StackEntry {
                    id: "vue2".into(),
                    name: "Vue 2".into(),
                    ui_libs: vec![
                        UiLibEntry { id: "element-ui".into(), name: "Element UI".into() },
                    ],
                },
            ],
        },
        PlatformEntry {
            id: "mobile".into(),
            name: "移动端".into(),
            stacks: vec![
                StackEntry {
                    id: "uniapp".into(),
                    name: "uni-app".into(),
                    ui_libs: vec![
                        UiLibEntry { id: "wot".into(), name: "Wot UI".into() },
                        UiLibEntry { id: "uview".into(), name: "uView UI".into() },
                    ],
                },
                StackEntry {
                    id: "rn".into(),
                    name: "React Native".into(),
                    ui_libs: vec![
                        UiLibEntry { id: "native-base".into(), name: "NativeBase".into() },
                    ],
                },
            ],
        },
    ]
}

// ───────────────────────────── Skills 桶扫描（backend 侧独立实现，避免跨 crate 耦合）

fn scan_skill_buckets(root: &Path) -> Vec<SkillBucketSummary> {
    let mut results = Vec::new();
    let read_dir = match std::fs::read_dir(root) {
        Ok(rd) => rd,
        Err(_) => return results,
    };
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
        let text = match std::fs::read_to_string(&skill_md) {
            Ok(t) => t,
            Err(_) => continue,
        };
        let fm = parse_frontmatter(&text);
        results.push(SkillBucketSummary {
            dir_name: dir_name.clone(),
            display_name: fm.name.unwrap_or(dir_name),
            description: fm.description,
            kind: fm.kind,
            platforms: fm.platforms,
            tech_stacks: fm.tech_stacks,
            ui_libs: fm.ui_libs,
            requires: fm.requires,
            conflicts: fm.conflicts,
            priority: fm.priority,
        });
    }
    results.sort_by(|a, b| a.dir_name.cmp(&b.dir_name));
    results
}

#[derive(Debug, Default)]
struct Frontmatter {
    name: Option<String>,
    description: Option<String>,
    kind: Option<String>,
    platforms: Vec<String>,
    tech_stacks: Vec<String>,
    ui_libs: Vec<String>,
    requires: Vec<String>,
    conflicts: Vec<String>,
    priority: i32,
}

fn parse_frontmatter(text: &str) -> Frontmatter {
    let mut fm = Frontmatter::default();
    let mut lines = text.lines();
    if lines.next().map(str::trim) != Some("---") {
        return fm;
    }
    for line in lines {
        let trimmed = line.trim();
        if trimmed == "---" {
            break;
        }
        let Some(idx) = trimmed.find(':') else { continue };
        let key = trimmed[..idx].trim();
        let rest = &trimmed[idx + 1..];
        let scalar = |r: &str| r.trim().trim_matches('"').trim_matches('\'').to_string();
        let array = |r: &str| -> Vec<String> {
            let rt = r.trim();
            if let Some(inner) = rt.strip_prefix('[').and_then(|s| s.strip_suffix(']')) {
                inner
                    .split(',')
                    .map(|p| p.trim().trim_matches('"').trim_matches('\'').to_string())
                    .filter(|s| !s.is_empty())
                    .collect()
            } else {
                let s = scalar(r);
                if s.is_empty() { Vec::new() } else { vec![s] }
            }
        };
        match key {
            "name" => {
                let v = scalar(rest);
                if !v.is_empty() { fm.name = Some(v); }
            }
            "description" => {
                let v = scalar(rest);
                if !v.is_empty() { fm.description = Some(v); }
            }
            "kind" => {
                let v = scalar(rest);
                if !v.is_empty() { fm.kind = Some(v); }
            }
            "platforms" => fm.platforms = array(rest),
            "tech_stacks" => fm.tech_stacks = array(rest),
            "ui_libs" => fm.ui_libs = array(rest),
            "requires" => fm.requires = array(rest),
            "conflicts" => fm.conflicts = array(rest),
            "priority" => { if let Ok(n) = scalar(rest).parse() { fm.priority = n; } }
            _ => {}
        }
    }
    fm
}

// ───────────────────────────── 选桶算法（与 claw-agent-server::skills 逻辑等价）

const COMMON_BUCKET: &str = "_common";
const SCAFFOLD_FROM_SCRATCH: &str = "scaffold-from-scratch";

fn resolve_selected_buckets(
    all: &[SkillBucketSummary],
    payload: &ResolveSkillsPayload,
    template_defaults: &[String],
    warnings: &mut Vec<String>,
) -> Vec<String> {
    use std::collections::HashSet;
    let mut selected: HashSet<String> = HashSet::new();
    selected.insert(COMMON_BUCKET.to_string());

    // 1. explicit 优先
    if !payload.explicit_buckets.is_empty() {
        for name in &payload.explicit_buckets {
            if all.iter().any(|b| &b.dir_name == name) {
                selected.insert(name.clone());
            } else {
                warnings.push(format!("显式指定的桶 {} 未找到，已忽略", name));
            }
        }
    } else if let Some(legacy) = &payload.legacy_stack {
        if all.iter().any(|b| &b.dir_name == legacy) {
            selected.insert(legacy.clone());
        } else {
            append_by_dimension(all, payload, &mut selected);
        }
    } else {
        append_by_dimension(all, payload, &mut selected);
    }

    // 1.5 template.default_skill_buckets 兜底（1.3 引入）
    // 像 platform-zc-web / zc-amis-schema 这种 knowledge 类桶不带 platform/stack/ui 维度，
    // 维度 selector 命不中；如果当前 template 在 registry.yaml 配了 default_skill_buckets，
    // 把它们一并激活。**explicit 路径优先级最高，不被本步覆盖**——已经走 explicit 的任务保持原样。
    if payload.explicit_buckets.is_empty() {
        for n in template_defaults {
            if all.iter().any(|b| &b.dir_name == n) {
                selected.insert(n.clone());
            } else {
                warnings.push(format!(
                    "template 的 default_skill_buckets 提到 {} 但桶不存在，已忽略",
                    n
                ));
            }
        }
    }

    // 2. 无模板 → scaffold-from-scratch
    if payload.template_name.is_none()
        && all.iter().any(|b| b.dir_name == SCAFFOLD_FROM_SCRATCH)
    {
        selected.insert(SCAFFOLD_FROM_SCRATCH.to_string());
    }

    // 3. requires 递归
    let mut to_process: Vec<String> = selected.iter().cloned().collect();
    while let Some(name) = to_process.pop() {
        if let Some(b) = all.iter().find(|x| x.dir_name == name) {
            for req in &b.requires {
                if selected.insert(req.clone()) {
                    to_process.push(req.clone());
                }
            }
        }
    }

    // 4. conflicts 解决
    let snapshot: Vec<&SkillBucketSummary> =
        all.iter().filter(|b| selected.contains(&b.dir_name)).collect();
    let mut to_remove: HashSet<String> = HashSet::new();
    for b in &snapshot {
        if to_remove.contains(&b.dir_name) {
            continue;
        }
        for conflict in &b.conflicts {
            if let Some(other) = snapshot.iter().find(|o| &o.dir_name == conflict) {
                if to_remove.contains(&other.dir_name) {
                    continue;
                }
                let keep_self = b.priority > other.priority
                    || (b.priority == other.priority && b.dir_name <= other.dir_name);
                let loser = if keep_self { &other.dir_name } else { &b.dir_name };
                warnings.push(format!(
                    "桶冲突：{} vs {}（priority {} vs {}），剔除 {}",
                    b.dir_name, other.dir_name, b.priority, other.priority, loser
                ));
                to_remove.insert(loser.clone());
            }
        }
    }
    for n in to_remove {
        selected.remove(&n);
    }

    let mut out: Vec<String> = selected.into_iter().collect();
    out.sort();
    out
}

fn append_by_dimension(
    all: &[SkillBucketSummary],
    payload: &ResolveSkillsPayload,
    selected: &mut std::collections::HashSet<String>,
) {
    for b in all {
        let kind = b.kind.as_deref().unwrap_or("");
        match kind {
            "platform" => {
                if let Some(p) = &payload.platform {
                    if b.platforms.contains(p) {
                        selected.insert(b.dir_name.clone());
                    }
                }
            }
            "stack" => {
                if payload.tech_stacks.iter().any(|t| b.tech_stacks.contains(t)) {
                    selected.insert(b.dir_name.clone());
                }
            }
            "ui" => {
                if payload.ui_libs.iter().any(|u| b.ui_libs.contains(u)) {
                    selected.insert(b.dir_name.clone());
                }
            }
            _ => {}
        }
    }
}

// ───────────────────────────── Handlers

/// GET /api/registry/platforms
/// 登录即可读。返回 (platform → stacks → ui_libs) 三级级联供 CreateTaskModal 使用。
pub async fn list_platforms(_auth: AuthUser) -> impl IntoResponse {
    let out = builtin_platforms();
    (StatusCode::OK, Json(out)).into_response()
}

/// GET /api/registry/templates
pub async fn list_templates(
    State(state): State<AppState>,
    _auth: AuthUser,
) -> impl IntoResponse {
    let scaffold_root = scaffold_root_path();
    let items: Vec<TemplateSummary> = state
        .template_registry
        .list()
        .iter()
        .map(|t| TemplateSummary {
            name: t.name.clone(),
            platform: t.platform.clone(),
            tech_stacks: t.tech_stacks.clone(),
            ui_libs: t.ui_libs.clone(),
            has_scaffold: t
                .dir
                .as_ref()
                .map(|d| scaffold_root.join(d).exists())
                .unwrap_or(false),
            dev_command: t.dev_command.clone(),
            default_skill_buckets: t.default_skill_buckets.clone(),
        })
        .collect();
    (StatusCode::OK, Json(items)).into_response()
}

/// GET /api/registry/skills
pub async fn list_skill_buckets(
    State(state): State<AppState>,
    _auth: AuthUser,
) -> impl IntoResponse {
    let buckets = scan_skill_buckets(Path::new(&state.skills_root));
    (StatusCode::OK, Json(buckets)).into_response()
}

/// POST /api/registry/resolve-skills
pub async fn resolve_skills(
    State(state): State<AppState>,
    _auth: AuthUser,
    Json(payload): Json<ResolveSkillsPayload>,
) -> impl IntoResponse {
    let buckets = scan_skill_buckets(Path::new(&state.skills_root));
    let mut warnings = Vec::new();
    let template_defaults: Vec<String> = payload
        .template_name
        .as_deref()
        .and_then(|n| state.template_registry.get(n))
        .map(|t| t.default_skill_buckets.clone())
        .unwrap_or_default();
    let selected = resolve_selected_buckets(&buckets, &payload, &template_defaults, &mut warnings);
    // sections 数量 = L0(common) + 选中桶(不含 _common) + L2(索引，仅当有未选中桶时) + L3
    let selected_non_common = selected.iter().filter(|n| n.as_str() != COMMON_BUCKET).count();
    let others_exist = buckets
        .iter()
        .any(|b| b.dir_name != COMMON_BUCKET && !selected.contains(&b.dir_name));
    let mut sections = 1 + selected_non_common + 1; // L0 + selected + L3
    if others_exist {
        sections += 1;
    }
    let resp = ResolveSkillsResponse {
        selected,
        sections,
        warnings,
    };
    let _ = state; // silence unused if compile-time gates remove fields later
    let _ = &payload;
    (StatusCode::OK, Json(json!(resp))).into_response()
}

fn scaffold_root_path() -> PathBuf {
    if let Ok(p) = std::env::var("SCAFFOLD_ROOT") {
        return PathBuf::from(p);
    }
    PathBuf::from("/home/karl/Working/TianXing/amis-ai/scaffolds")
}
