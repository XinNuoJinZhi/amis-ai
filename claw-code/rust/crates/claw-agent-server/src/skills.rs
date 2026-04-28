//! 构建 system_prompt 中的 Skills 部分。
//!
//! 设计原则（progressive disclosure，对齐 claw-code 标准 Skills 协议）：
//!
//! - **L0**：`_common/SKILL.md` 全文 —— 跨栈通用的产品哲学，每次都全量塞
//! - **L1**：当前任务命中的桶 SKILL.md 全文 —— 含工作流程
//! - **L2**：其他所有桶的 `name + description` 索引 —— 让 Agent 知道"还有哪些 skill 可用"
//! - **L3**：`USER_INPUT_FENCE_GUIDANCE` —— 识别浏览器/终端塞入日志的协议（永远塞）
//!
//! references/ 子文档由 Agent 通过 `Skill` 工具或 `Read` 工具按需加载，**不进 system_prompt**。
//!
//! **维度解耦**（2026-04，技术栈解耦重构）：每个桶的 frontmatter 支持 `kind / platforms /
//! tech_stacks / ui_libs / requires / conflicts / priority` 字段，新任务可按维度叠加多个桶。
//! 老接口 `build_skills_system_prompt(root, plugins, current_stack)` 保留兼容 legacy 路径。
//! 新接口见 `build_skills_system_prompt_v2(root, plugins, &TaskSkillContext)`。
//!
//! 调用约定：
//! - `skills_root`：amis-ai 主仓库的 skills 目录（即 `$CLAW_CONFIG_HOME/skills`）
//! - `plugin_roots`：来自 `SKILLS_PLUGIN_PATHS` 的外部插件包目录列表

use std::collections::HashSet;
use std::path::{Path, PathBuf};

const SKILL_INDEX_FILENAME: &str = "SKILL.md";
const COMMON_BUCKET_DIR: &str = "_common";
const SCAFFOLD_FROM_SCRATCH_BUCKET: &str = "scaffold-from-scratch";

/// SKILL.md frontmatter 的完整结构（2026-04 起，维度解耦）。
///
/// 所有字段都可选，缺省兼容老桶（无 kind / 无维度标签）。
#[derive(Debug, Default, Clone)]
pub struct ParsedFrontmatter {
    pub name: Option<String>,
    pub description: Option<String>,
    pub kind: Option<String>,         // platform | stack | ui | common | legacy
    pub platforms: Vec<String>,
    pub tech_stacks: Vec<String>,
    pub ui_libs: Vec<String>,
    pub requires: Vec<String>,
    pub conflicts: Vec<String>,
    pub priority: i32,
}

/// 一个 skill 桶（目录）的元数据。
#[derive(Debug, Clone)]
pub struct SkillBucketInfo {
    /// 目录名（用于按 stack 字段精确匹配，如 "uniapp-wot-h5" / "platform-web"）
    pub dir_name: String,
    /// SKILL.md frontmatter 中的 `name`，缺失时 fallback 到 dir_name
    pub display_name: String,
    /// SKILL.md frontmatter 中的 `description`
    pub description: Option<String>,
    /// 维度身份（None 视作 legacy 聚合桶，L1 精确匹配路径使用）
    pub kind: Option<String>,
    pub platforms: Vec<String>,
    pub tech_stacks: Vec<String>,
    pub ui_libs: Vec<String>,
    pub requires: Vec<String>,
    pub conflicts: Vec<String>,
    pub priority: i32,
    /// SKILL.md 全文
    pub full_text: String,
}

/// 任务的 skill 选桶上下文（2026-04 维度解耦新接口）。
#[derive(Debug, Default)]
pub struct TaskSkillContext<'a> {
    pub platform: Option<&'a str>,
    pub tech_stacks: &'a [String],
    pub ui_libs: &'a [String],
    pub template_name: Option<&'a str>,
    /// UI 上显式勾选的桶目录名（若非空，优先按此派发）
    pub explicit_buckets: &'a [String],
    /// 兼容期：前端只传 `tech_stack: "uniapp-wot-h5"` 时走这里
    pub legacy_stack: Option<&'a str>,
}

impl<'a> TaskSkillContext<'a> {
    /// legacy 适配：把老 `current_stack: &str` 翻译成 ctx
    pub fn legacy(current_stack: &'a str) -> Self {
        Self {
            platform: None,
            tech_stacks: &[],
            ui_libs: &[],
            template_name: None,
            explicit_buckets: &[],
            legacy_stack: Some(current_stack),
        }
    }
}

/// 扫描一个 root 目录下的所有 skill 桶。
pub fn scan_buckets(root: &Path) -> Vec<SkillBucketInfo> {
    let mut buckets = Vec::new();
    let read_dir = match std::fs::read_dir(root) {
        Ok(rd) => rd,
        Err(e) => {
            tracing::warn!(
                "Skills root {} unreadable: {}（继续，不影响其他 root）",
                root.display(),
                e
            );
            return buckets;
        }
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
        let skill_md_path = path.join(SKILL_INDEX_FILENAME);
        let full_text = match std::fs::read_to_string(&skill_md_path) {
            Ok(text) => text,
            Err(_) => {
                tracing::debug!(
                    "Bucket {} 缺少 {}, 跳过",
                    dir_name,
                    SKILL_INDEX_FILENAME
                );
                continue;
            }
        };
        let fm = parse_frontmatter_full(&full_text);
        let display_name = fm.name.clone().unwrap_or_else(|| dir_name.clone());
        buckets.push(SkillBucketInfo {
            dir_name,
            display_name,
            description: fm.description,
            kind: fm.kind,
            platforms: fm.platforms,
            tech_stacks: fm.tech_stacks,
            ui_libs: fm.ui_libs,
            requires: fm.requires,
            conflicts: fm.conflicts,
            priority: fm.priority,
            full_text,
        });
    }
    buckets
}

/// 极简 YAML frontmatter 解析：抽 `name / description` （老接口兼容）。
///
/// 老代码仍调用此函数，返回元组；新代码用 `parse_frontmatter_full`。
#[allow(dead_code)]
pub fn parse_frontmatter(content: &str) -> (Option<String>, Option<String>) {
    let fm = parse_frontmatter_full(content);
    (fm.name, fm.description)
}

/// 完整 frontmatter 解析：支持标量 + 数组语法 `[a, b]`。
///
/// 支持形态：
/// ```yaml
/// ---
/// name: foo
/// description: "带空格的描述"
/// kind: stack
/// platforms: [web]
/// tech_stacks: [react, react-vite]
/// ui_libs: [antd]
/// requires: [_common]
/// conflicts: [stack-vue3]
/// priority: 50
/// ---
/// ```
///
/// 不支持：多行字符串、嵌套对象、注释。
pub fn parse_frontmatter_full(content: &str) -> ParsedFrontmatter {
    let mut fm = ParsedFrontmatter::default();
    let mut lines = content.lines();
    let first = match lines.next() {
        Some(l) => l.trim(),
        None => return fm,
    };
    if first != "---" {
        return fm;
    }
    for line in lines {
        let trimmed = line.trim();
        if trimmed == "---" {
            break;
        }
        let Some((key, rest)) = split_key_value(trimmed) else {
            continue;
        };
        match key {
            "name" => {
                let v = strip_scalar(rest);
                if !v.is_empty() {
                    fm.name = Some(v);
                }
            }
            "description" => {
                let v = strip_scalar(rest);
                if !v.is_empty() {
                    fm.description = Some(v);
                }
            }
            "kind" => {
                let v = strip_scalar(rest);
                if !v.is_empty() {
                    fm.kind = Some(v);
                }
            }
            "platforms" => fm.platforms = parse_array(rest),
            "tech_stacks" => fm.tech_stacks = parse_array(rest),
            "ui_libs" => fm.ui_libs = parse_array(rest),
            "requires" => fm.requires = parse_array(rest),
            "conflicts" => fm.conflicts = parse_array(rest),
            "priority" => {
                if let Ok(n) = strip_scalar(rest).parse::<i32>() {
                    fm.priority = n;
                }
            }
            _ => {}
        }
    }
    fm
}

fn split_key_value(line: &str) -> Option<(&str, &str)> {
    let idx = line.find(':')?;
    let key = line[..idx].trim();
    let rest = &line[idx + 1..];
    if key.is_empty() {
        return None;
    }
    Some((key, rest))
}

fn strip_scalar(rest: &str) -> String {
    rest.trim()
        .trim_matches('"')
        .trim_matches('\'')
        .to_string()
}

/// 解析数组语法 `[a, b, c]`，容忍空白 / 引号 / 空数组。
/// 老 SKILL.md 写 `platforms: web` 这种非数组写法也容忍（退化为单元素数组）。
fn parse_array(rest: &str) -> Vec<String> {
    let trimmed = rest.trim();
    if trimmed.is_empty() {
        return Vec::new();
    }
    // 支持 [a, b] 以及 [ a , b ]
    if let Some(inner) = trimmed.strip_prefix('[').and_then(|s| s.strip_suffix(']')) {
        return inner
            .split(',')
            .map(|p| p.trim().trim_matches('"').trim_matches('\'').to_string())
            .filter(|s| !s.is_empty())
            .collect();
    }
    // 非数组写法（单个标量），宽容处理为单元素数组
    let single = strip_scalar(rest);
    if single.is_empty() {
        Vec::new()
    } else {
        vec![single]
    }
}

/// 构建 Skills 段（**老接口**，兼容 legacy 路径；2026-04 起内部转发到 v2）。
///
/// 返回的 `Vec<String>` 每个元素是一个 section，外层会再用换行拼成最终 system_prompt。
#[allow(dead_code)]
pub fn build_skills_system_prompt(
    skills_root: &Path,
    plugin_roots: &[PathBuf],
    current_stack: &str,
) -> Vec<String> {
    let ctx = TaskSkillContext::legacy(current_stack);
    build_skills_system_prompt_v2(skills_root, plugin_roots, &ctx)
}

/// 本次任务选中 skill 桶的摘要信息，配合 `build_skills_system_prompt_v2_with_meta` 给
/// "执行详情"面板使用，便于管理员排查为什么某个 skill 没生效。
#[derive(Debug, Clone)]
pub struct SelectedSkillMeta {
    pub dir_name: String,
    pub display_name: String,
    pub priority: i32,
    pub kind: Option<String>,
    pub description: Option<String>,
}

/// `build_skills_system_prompt_v2` 的姐妹版本：除了 sections，还返回本次选中的桶元数据。
/// 旧调用方继续用不带 meta 的版本，新调用方（如 task_loop emit 事件）用这个。
pub fn build_skills_system_prompt_v2_with_meta(
    skills_root: &Path,
    plugin_roots: &[PathBuf],
    ctx: &TaskSkillContext,
) -> (Vec<String>, Vec<SelectedSkillMeta>) {
    let sections = build_skills_system_prompt_v2(skills_root, plugin_roots, ctx);

    // 重新跑一次 select_buckets 拿元数据。成本极低：scan_buckets 本身是内存/IO 很小的操作，
    // 且相对于 LLM 推理耗时可以忽略。如果将来有性能顾虑，可以重构 v2 让它同时返回两者。
    let mut buckets = scan_buckets(skills_root);
    for plugin_root in plugin_roots {
        buckets.extend(scan_buckets(plugin_root));
    }
    let selected = select_buckets(&buckets, ctx);

    let mut meta: Vec<SelectedSkillMeta> = buckets
        .iter()
        .filter(|b| selected.contains(&b.dir_name))
        .map(|b| SelectedSkillMeta {
            dir_name: b.dir_name.clone(),
            display_name: b.display_name.clone(),
            priority: b.priority,
            kind: b.kind.clone(),
            description: b.description.clone(),
        })
        .collect();
    // 按优先级降序 + 名字升序，跟 sections 输出顺序保持一致
    meta.sort_by(|a, b| b.priority.cmp(&a.priority).then(a.dir_name.cmp(&b.dir_name)));

    (sections, meta)
}

/// 构建 Skills 段（**新接口**，支持维度叠加）。
pub fn build_skills_system_prompt_v2(
    skills_root: &Path,
    plugin_roots: &[PathBuf],
    ctx: &TaskSkillContext,
) -> Vec<String> {
    let mut buckets = scan_buckets(skills_root);
    for plugin_root in plugin_roots {
        buckets.extend(scan_buckets(plugin_root));
    }

    let mut sections = Vec::new();

    // L0：_common 全文（所有任务必读）
    if let Some(common) = buckets.iter().find(|b| b.dir_name == COMMON_BUCKET_DIR) {
        sections.push(format!(
            "# Skill: {} (跨栈必读)\n\n{}",
            common.display_name,
            common.full_text.trim()
        ));
    } else {
        tracing::warn!(
            "未找到 _common 桶（{}/{}/{}），跨栈哲学未被注入",
            skills_root.display(),
            COMMON_BUCKET_DIR,
            SKILL_INDEX_FILENAME
        );
    }

    // L1：选桶算法
    let selected = select_buckets(&buckets, ctx);

    // 输出选中桶（按 priority desc），排除 _common（L0 已塞）
    let mut ordered: Vec<&SkillBucketInfo> = buckets
        .iter()
        .filter(|b| selected.contains(&b.dir_name) && b.dir_name != COMMON_BUCKET_DIR)
        .collect();
    ordered.sort_by(|a, b| b.priority.cmp(&a.priority).then(a.dir_name.cmp(&b.dir_name)));
    for b in &ordered {
        let header_tag = b.kind.as_deref().map(|k| format!(" [{k}]")).unwrap_or_default();
        sections.push(format!(
            "# Skill: {}{}\n\n{}",
            b.display_name,
            header_tag,
            b.full_text.trim()
        ));
    }

    // L2：其他未选中桶的 name + description 索引
    let other_buckets: Vec<&SkillBucketInfo> = buckets
        .iter()
        .filter(|b| b.dir_name != COMMON_BUCKET_DIR && !selected.contains(&b.dir_name))
        .collect();
    if !other_buckets.is_empty() {
        let mut index = String::from(
            "# 可用的其他 Skills（按需加载，不要凭空猜内容）\n\n\
             下面这些 skill 当前没有自动注入到上下文里。如果任务涉及它们，\
             用 `Skill` 工具按名字加载对应 SKILL.md，再按 SKILL.md 的工作流程操作。\n\n",
        );
        for b in &other_buckets {
            let desc = b.description.as_deref().unwrap_or("(无描述)");
            index.push_str(&format!("- `{}` — {}\n", b.display_name, desc));
        }
        index.push_str(
            "\n用法：`Skill({\"skill\": \"<name>\"})`。\n\
             加载后该 skill 的 references/ 子文档可用 `Read` 工具按相对路径读取。",
        );
        sections.push(index);
    }

    // L3：用户注入日志识别协议（永远全量塞）
    sections.push(USER_INPUT_FENCE_GUIDANCE.to_string());

    tracing::info!(
        "Loaded SKILL.md index: {} sections, {} buckets discovered, {} selected (skills_root={}, plugins={}, ctx={:?})",
        sections.len(),
        buckets.len(),
        selected.len(),
        skills_root.display(),
        plugin_roots.len(),
        ctx
    );

    sections
}

/// 选桶算法：按优先级 explicit > legacy_stack > 维度叠加，递归解 requires，再按 conflicts+priority 去重。
fn select_buckets(buckets: &[SkillBucketInfo], ctx: &TaskSkillContext) -> HashSet<String> {
    let mut selected: HashSet<String> = HashSet::new();
    selected.insert(COMMON_BUCKET_DIR.to_string());

    // 1. explicit 优先
    if !ctx.explicit_buckets.is_empty() {
        for name in ctx.explicit_buckets {
            if buckets.iter().any(|b| &b.dir_name == name) {
                selected.insert(name.clone());
            }
        }
    } else if let Some(legacy) = ctx.legacy_stack {
        // 2. legacy_stack 精确匹配
        if buckets.iter().any(|b| b.dir_name == legacy) {
            selected.insert(legacy.to_string());
        } else {
            // legacy_stack 未命中 → 按维度叠加（可能是新 stack 名）
            append_by_dimension(buckets, ctx, &mut selected);
        }
    } else {
        // 3. 按维度叠加
        append_by_dimension(buckets, ctx, &mut selected);
    }

    // 4. 无模板 → 追加 scaffold-from-scratch
    if ctx.template_name.is_none()
        && buckets.iter().any(|b| b.dir_name == SCAFFOLD_FROM_SCRATCH_BUCKET)
    {
        selected.insert(SCAFFOLD_FROM_SCRATCH_BUCKET.to_string());
    }

    // 5. 解析 requires（递归）
    let mut to_process: Vec<String> = selected.iter().cloned().collect();
    while let Some(name) = to_process.pop() {
        if let Some(b) = buckets.iter().find(|b| b.dir_name == name) {
            for req in &b.requires {
                if selected.insert(req.clone()) {
                    to_process.push(req.clone());
                }
            }
        }
    }

    // 6. 冲突解决：conflicts 对中取 priority 大者，小者剔除并 warn
    resolve_conflicts(buckets, &mut selected);

    selected
}

fn append_by_dimension(
    buckets: &[SkillBucketInfo],
    ctx: &TaskSkillContext,
    selected: &mut HashSet<String>,
) {
    for b in buckets {
        let kind = b.kind.as_deref().unwrap_or("");
        match kind {
            "platform" => {
                if let Some(p) = ctx.platform {
                    if b.platforms.iter().any(|x| x == p) {
                        selected.insert(b.dir_name.clone());
                    }
                }
            }
            "stack" => {
                if ctx.tech_stacks.iter().any(|t| b.tech_stacks.contains(t)) {
                    selected.insert(b.dir_name.clone());
                }
            }
            "ui" => {
                if ctx.ui_libs.iter().any(|u| b.ui_libs.contains(u)) {
                    selected.insert(b.dir_name.clone());
                }
            }
            _ => {}
        }
    }
}

fn resolve_conflicts(buckets: &[SkillBucketInfo], selected: &mut HashSet<String>) {
    let snapshot: Vec<&SkillBucketInfo> = buckets
        .iter()
        .filter(|b| selected.contains(&b.dir_name))
        .collect();
    let mut to_remove: HashSet<String> = HashSet::new();
    for b in &snapshot {
        for conflict in &b.conflicts {
            if to_remove.contains(&b.dir_name) {
                continue;
            }
            if let Some(other) = snapshot.iter().find(|o| &o.dir_name == conflict) {
                if to_remove.contains(&other.dir_name) {
                    continue;
                }
                // priority 大者胜；相等时按 dir_name 字典序（稳定）
                let keep_self = b.priority > other.priority
                    || (b.priority == other.priority && b.dir_name <= other.dir_name);
                let loser = if keep_self { &other.dir_name } else { &b.dir_name };
                tracing::warn!(
                    "Skill 桶冲突：{} vs {}（priority {} vs {}），剔除 {}",
                    b.dir_name,
                    other.dir_name,
                    b.priority,
                    other.priority,
                    loser
                );
                to_remove.insert(loser.clone());
            }
        }
    }
    for name in to_remove {
        selected.remove(&name);
    }
}

const USER_INPUT_FENCE_GUIDANCE: &str = r#"# Skill: user-injected-logs

用户在云端 IDE 里可能会把"浏览器控制台输出"或"终端输出"塞进对话让你分析。
你可以通过以下 Markdown 约定快速识别它们，**并把它们当作真实的诊断证据而不是普通聊天**：

- HTML 注释 `<!-- amis-ai:inject-source=browser-console -->` 后面跟的 `log-console` 代码块
  → 来自 iframe 里被劫持的 `console.log/warn/error/info/debug`
- HTML 注释 `<!-- amis-ai:inject-source=terminal -->` 后面跟的 `log-terminal` 代码块
  → 来自沙箱容器内的 bash 终端输出

遇到这两种代码块时，按顺序做：
1. 先扫里面的 `error` / `Error` / `Traceback` / `TypeError` / `ReferenceError` / `ENOENT` 等
2. 定位到具体的源文件和行号（优先 src/pages/**、src/components/**）
3. 用 Read + Edit 工具直接修代码；改完后告诉用户"已修复 X"，无需等待用户二次确认
4. 如果只是一般的 info/debug，用一句话告知用户"这是信息日志，未见异常"
"#;

/// 默认的 skills 根目录（相对于 workdir_root 或固定路径）。
///
/// 优先级：`SKILLS_ROOT` env > `CLAW_CONFIG_HOME/skills` > 硬编码开发路径。
pub fn default_skills_root() -> PathBuf {
    if let Ok(s) = std::env::var("SKILLS_ROOT") {
        return PathBuf::from(s);
    }
    if let Ok(c) = std::env::var("CLAW_CONFIG_HOME") {
        return PathBuf::from(c).join("skills");
    }
    PathBuf::from("/home/karl/Working/TianXing/amis-ai/skills")
}

/// 从 `SKILLS_PLUGIN_PATHS` env 解析出插件 root 列表。
pub fn default_plugin_roots() -> Vec<PathBuf> {
    let raw = match std::env::var("SKILLS_PLUGIN_PATHS") {
        Ok(s) => s,
        Err(_) => return Vec::new(),
    };
    raw.split(',')
        .map(|s| s.trim())
        .filter(|s| !s.is_empty())
        .map(PathBuf::from)
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    fn write_skill(dir: &Path, name: &str, description: &str, body: &str) {
        std::fs::create_dir_all(dir).expect("mkdir");
        let content = format!(
            "---\nname: {name}\ndescription: {description}\n---\n\n{body}\n"
        );
        std::fs::write(dir.join(SKILL_INDEX_FILENAME), content).expect("write");
    }

    fn write_skill_full(dir: &Path, frontmatter: &str, body: &str) {
        std::fs::create_dir_all(dir).expect("mkdir");
        let content = format!("---\n{frontmatter}\n---\n\n{body}\n");
        std::fs::write(dir.join(SKILL_INDEX_FILENAME), content).expect("write");
    }

    #[test]
    fn test_parse_frontmatter_basic() {
        let md = "---\nname: foo\ndescription: hello\n---\n\nbody";
        let (name, desc) = parse_frontmatter(md);
        assert_eq!(name, Some("foo".to_string()));
        assert_eq!(desc, Some("hello".to_string()));
    }

    #[test]
    fn test_parse_frontmatter_no_frontmatter() {
        let (name, desc) = parse_frontmatter("# Just heading");
        assert!(name.is_none());
        assert!(desc.is_none());
    }

    #[test]
    fn test_parse_frontmatter_quoted() {
        let md = "---\nname: \"foo\"\ndescription: 'hello, world'\n---\n";
        let (name, desc) = parse_frontmatter(md);
        assert_eq!(name, Some("foo".to_string()));
        assert_eq!(desc, Some("hello, world".to_string()));
    }

    #[test]
    fn test_parse_frontmatter_full_arrays() {
        let md = "---\n\
name: stack-react\n\
description: React + Vite\n\
kind: stack\n\
platforms: [web]\n\
tech_stacks: [react, react-vite]\n\
ui_libs: [antd, arco]\n\
requires: [_common]\n\
conflicts: [stack-vue3]\n\
priority: 50\n\
---\n\nbody";
        let fm = parse_frontmatter_full(md);
        assert_eq!(fm.name.as_deref(), Some("stack-react"));
        assert_eq!(fm.kind.as_deref(), Some("stack"));
        assert_eq!(fm.platforms, vec!["web".to_string()]);
        assert_eq!(fm.tech_stacks, vec!["react".to_string(), "react-vite".to_string()]);
        assert_eq!(fm.ui_libs, vec!["antd".to_string(), "arco".to_string()]);
        assert_eq!(fm.requires, vec!["_common".to_string()]);
        assert_eq!(fm.conflicts, vec!["stack-vue3".to_string()]);
        assert_eq!(fm.priority, 50);
    }

    #[test]
    fn test_parse_frontmatter_full_empty_arrays() {
        let fm = parse_frontmatter_full("---\nname: x\nplatforms: []\n---\n");
        assert!(fm.platforms.is_empty());
    }

    #[test]
    fn test_parse_frontmatter_full_scalar_fallback() {
        // 老写法 `platforms: web`（非数组）也要兼容为 ["web"]
        let fm = parse_frontmatter_full("---\nplatforms: web\n---\n");
        assert_eq!(fm.platforms, vec!["web".to_string()]);
    }

    #[test]
    fn test_build_with_common_and_current_stack() {
        let tmp = tempfile::tempdir().expect("tmp");
        let skills_root = tmp.path();

        write_skill(
            &skills_root.join("_common"),
            "_common",
            "shared philosophy",
            "# COMMON BODY",
        );
        write_skill(
            &skills_root.join("uniapp-wot-h5"),
            "uniapp-wot-h5",
            "uniapp h5 mapping",
            "# STACK BODY",
        );
        write_skill(
            &skills_root.join("react-element"),
            "react-element",
            "react antd-style",
            "# REACT BODY",
        );

        let sections = build_skills_system_prompt(skills_root, &[], "uniapp-wot-h5");
        // L0 + L1 + L2 + L3 = 4
        assert_eq!(sections.len(), 4, "sections: {sections:#?}");

        assert!(sections[0].contains("_common"));
        assert!(sections[0].contains("COMMON BODY"));
        assert!(sections[1].contains("uniapp-wot-h5"));
        assert!(sections[1].contains("STACK BODY"));
        assert!(sections[2].contains("react-element"));
        assert!(sections[2].contains("react antd-style"));
        // STACK BODY 的内容不应出现在 L2（避免重复塞）
        assert!(!sections[2].contains("STACK BODY"));
        // L3 永远存在
        assert!(sections[3].contains("user-injected-logs"));
    }

    #[test]
    fn test_build_when_only_common_exists() {
        let tmp = tempfile::tempdir().expect("tmp");
        write_skill(
            &tmp.path().join("_common"),
            "_common",
            "only common",
            "# CORE",
        );
        let sections = build_skills_system_prompt(tmp.path(), &[], "no-such-stack");
        // L0 + L3 = 2 （L1 缺失，L2 没有其他桶）
        assert_eq!(sections.len(), 2);
        assert!(sections[0].contains("_common"));
        assert!(sections[1].contains("user-injected-logs"));
    }

    #[test]
    fn test_build_skips_directory_without_skill_md() {
        let tmp = tempfile::tempdir().expect("tmp");
        std::fs::create_dir_all(tmp.path().join("empty-bucket")).expect("mkdir");
        write_skill(
            &tmp.path().join("_common"),
            "_common",
            "x",
            "# y",
        );
        let sections = build_skills_system_prompt(tmp.path(), &[], "any");
        assert_eq!(sections.len(), 2);
    }

    #[test]
    fn test_build_includes_plugin_roots() {
        let tmp = tempfile::tempdir().expect("tmp");
        let main_root = tmp.path().join("main");
        let plugin_root = tmp.path().join("plugin");
        std::fs::create_dir_all(&main_root).expect("mkdir main");
        std::fs::create_dir_all(&plugin_root).expect("mkdir plugin");

        write_skill(&main_root.join("_common"), "_common", "core", "# C");
        write_skill(
            &plugin_root.join("zc_amis"),
            "zc_amis",
            "ZC Amis 二开知识",
            "# ZC",
        );

        let sections = build_skills_system_prompt(
            &main_root,
            &[plugin_root.clone()],
            "uniapp-wot-h5",
        );
        // L0 + L2 (zc_amis) + L3 = 3 （L1 缺失因为 uniapp-wot-h5 桶不存在）
        assert_eq!(sections.len(), 3, "sections: {sections:#?}");
        assert!(sections[1].contains("zc_amis"));
        assert!(sections[1].contains("ZC Amis 二开知识"));
    }

    #[test]
    fn test_default_plugin_roots_parses_csv() {
        std::env::set_var("SKILLS_PLUGIN_PATHS", "/a, /b ,,/c");
        let roots = default_plugin_roots();
        assert_eq!(
            roots,
            vec![
                PathBuf::from("/a"),
                PathBuf::from("/b"),
                PathBuf::from("/c"),
            ]
        );
        std::env::remove_var("SKILLS_PLUGIN_PATHS");
        assert!(default_plugin_roots().is_empty());
    }

    // ============ v2 新接口测试 ============

    #[test]
    fn test_v2_dimensional_selection_web_react_antd() {
        let tmp = tempfile::tempdir().expect("tmp");
        let root = tmp.path();

        write_skill_full(
            &root.join("_common"),
            "name: _common\nkind: common",
            "# COMMON",
        );
        write_skill_full(
            &root.join("platform-web"),
            "name: platform-web\nkind: platform\nplatforms: [web]",
            "# PLATFORM WEB",
        );
        write_skill_full(
            &root.join("platform-mobile"),
            "name: platform-mobile\nkind: platform\nplatforms: [mobile]",
            "# PLATFORM MOBILE",
        );
        write_skill_full(
            &root.join("stack-react"),
            "name: stack-react\nkind: stack\nplatforms: [web]\ntech_stacks: [react]",
            "# STACK REACT",
        );
        write_skill_full(
            &root.join("ui-antd"),
            "name: ui-antd\nkind: ui\nui_libs: [antd]",
            "# UI ANTD",
        );
        write_skill_full(
            &root.join("ui-element-plus"),
            "name: ui-element-plus\nkind: ui\nui_libs: [element-plus]",
            "# UI ELEMENT",
        );

        let stacks = vec!["react".to_string()];
        let ui = vec!["antd".to_string()];
        let ctx = TaskSkillContext {
            platform: Some("web"),
            tech_stacks: &stacks,
            ui_libs: &ui,
            template_name: Some("react-antd-vite-template"),
            explicit_buckets: &[],
            legacy_stack: None,
        };

        let sections = build_skills_system_prompt_v2(root, &[], &ctx);
        let joined = sections.join("\n---\n");
        assert!(joined.contains("COMMON"), "缺 _common");
        assert!(joined.contains("PLATFORM WEB"), "缺 platform-web");
        assert!(joined.contains("STACK REACT"), "缺 stack-react");
        assert!(joined.contains("UI ANTD"), "缺 ui-antd");
        // 未选中的桶只出现在索引里（没有正文）
        assert!(!joined.contains("PLATFORM MOBILE"));
        assert!(!joined.contains("UI ELEMENT"));
    }

    #[test]
    fn test_v2_legacy_stack_exact_match() {
        let tmp = tempfile::tempdir().expect("tmp");
        let root = tmp.path();
        write_skill_full(&root.join("_common"), "name: _common\nkind: common", "# C");
        write_skill_full(
            &root.join("uniapp-wot-h5"),
            "name: uniapp-wot-h5\nkind: legacy\nplatforms: [mobile]",
            "# LEGACY UNIAPP",
        );
        write_skill_full(
            &root.join("platform-mobile"),
            "name: platform-mobile\nkind: platform\nplatforms: [mobile]",
            "# NEW MOBILE",
        );

        // legacy 路径：传 current_stack = uniapp-wot-h5 → 只激活 legacy 桶，不叠加 platform-mobile
        let ctx = TaskSkillContext::legacy("uniapp-wot-h5");
        let sections = build_skills_system_prompt_v2(root, &[], &ctx);
        let joined = sections.join("\n---\n");
        assert!(joined.contains("LEGACY UNIAPP"));
        assert!(!joined.contains("NEW MOBILE"), "legacy 精确匹配时不应叠加维度桶");
    }

    #[test]
    fn test_v2_scaffold_from_scratch_when_no_template() {
        let tmp = tempfile::tempdir().expect("tmp");
        let root = tmp.path();
        write_skill_full(&root.join("_common"), "name: _common\nkind: common", "# C");
        write_skill_full(
            &root.join("scaffold-from-scratch"),
            "name: scaffold-from-scratch\nkind: common",
            "# FROM SCRATCH",
        );

        let ctx = TaskSkillContext {
            platform: Some("web"),
            tech_stacks: &[],
            ui_libs: &[],
            template_name: None, // 无模板
            explicit_buckets: &[],
            legacy_stack: None,
        };
        let sections = build_skills_system_prompt_v2(root, &[], &ctx);
        let joined = sections.join("\n---\n");
        assert!(joined.contains("FROM SCRATCH"), "无模板时要注入 scaffold-from-scratch");
    }

    #[test]
    fn test_v2_explicit_buckets_override() {
        let tmp = tempfile::tempdir().expect("tmp");
        let root = tmp.path();
        write_skill_full(&root.join("_common"), "name: _common\nkind: common", "# C");
        write_skill_full(
            &root.join("stack-vue3"),
            "name: stack-vue3\nkind: stack\ntech_stacks: [vue3]",
            "# VUE3",
        );
        write_skill_full(
            &root.join("stack-react"),
            "name: stack-react\nkind: stack\ntech_stacks: [react]",
            "# REACT",
        );

        // 用户显式勾 stack-vue3，即使 tech_stacks 字段填了 react 也以显式为准
        let explicit = vec!["stack-vue3".to_string()];
        let stacks = vec!["react".to_string()];
        let ctx = TaskSkillContext {
            platform: None,
            tech_stacks: &stacks,
            ui_libs: &[],
            template_name: Some("any"),
            explicit_buckets: &explicit,
            legacy_stack: None,
        };
        let sections = build_skills_system_prompt_v2(root, &[], &ctx);
        let joined = sections.join("\n---\n");
        assert!(joined.contains("VUE3"));
        assert!(!joined.contains("\n# REACT"), "显式优先时不应叠加 React 桶");
    }

    #[test]
    fn test_v2_requires_recursively_resolved() {
        let tmp = tempfile::tempdir().expect("tmp");
        let root = tmp.path();
        write_skill_full(&root.join("_common"), "name: _common\nkind: common", "# C");
        write_skill_full(
            &root.join("stack-react"),
            "name: stack-react\nkind: stack\ntech_stacks: [react]\nrequires: [dep.node]",
            "# REACT",
        );
        write_skill_full(
            &root.join("dep.node"),
            "name: dep.node\nkind: common\nrequires: [dep.pnpm]",
            "# NODE",
        );
        write_skill_full(&root.join("dep.pnpm"), "name: dep.pnpm\nkind: common", "# PNPM");

        let stacks = vec!["react".to_string()];
        let ctx = TaskSkillContext {
            platform: None,
            tech_stacks: &stacks,
            ui_libs: &[],
            template_name: Some("x"),
            explicit_buckets: &[],
            legacy_stack: None,
        };
        let sections = build_skills_system_prompt_v2(root, &[], &ctx);
        let joined = sections.join("\n---\n");
        assert!(joined.contains("# REACT"));
        assert!(joined.contains("# NODE"), "requires 一层要解");
        assert!(joined.contains("# PNPM"), "requires 要递归解");
    }

    #[test]
    fn test_v2_conflicts_resolved_by_priority() {
        let tmp = tempfile::tempdir().expect("tmp");
        let root = tmp.path();
        write_skill_full(&root.join("_common"), "name: _common\nkind: common", "# C");
        write_skill_full(
            &root.join("stack-react"),
            "name: stack-react\nkind: stack\ntech_stacks: [react]\nconflicts: [stack-vue3]\npriority: 80",
            "# REACT",
        );
        write_skill_full(
            &root.join("stack-vue3"),
            "name: stack-vue3\nkind: stack\ntech_stacks: [vue3]\npriority: 50",
            "# VUE3",
        );

        let explicit = vec!["stack-react".to_string(), "stack-vue3".to_string()];
        let ctx = TaskSkillContext {
            platform: None,
            tech_stacks: &[],
            ui_libs: &[],
            template_name: Some("x"),
            explicit_buckets: &explicit,
            legacy_stack: None,
        };
        let sections = build_skills_system_prompt_v2(root, &[], &ctx);
        let joined = sections.join("\n---\n");
        assert!(joined.contains("# REACT"), "高优先级应被保留");
        // VUE3 被剔除到索引里（不含正文 body "# VUE3" 行；只剩 description 短行在 L2）
        let l1_blocks: Vec<&String> = sections.iter().filter(|s| s.starts_with("# Skill:")).collect();
        let react_included = l1_blocks.iter().any(|s| s.contains("VUE3") && s.contains("# Skill: stack-react"));
        assert!(!react_included);
    }
}
