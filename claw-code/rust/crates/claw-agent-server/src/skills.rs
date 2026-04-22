//! 构建 system_prompt 中的 Skills 部分。
//!
//! 设计原则（progressive disclosure，对齐 claw-code 标准 Skills 协议）：
//!
//! - **L0**：`_common/SKILL.md` 全文 —— 跨栈通用的产品哲学，每次都全量塞
//! - **L1**：当前 stack 的 `SKILL.md` 全文 —— 含工作流程，每次任务都塞
//! - **L2**：其他所有 stack 的 `name + description` 索引 —— 让 Agent 知道"还有哪些 skill 可用"
//! - **L3**：`USER_INPUT_FENCE_GUIDANCE` —— 识别浏览器/终端塞入日志的协议（永远塞）
//!
//! references/ 子文档由 Agent 通过 `Skill` 工具或 `Read` 工具按需加载，**不进 system_prompt**。
//!
//! 历史：旧实现 `load_skills_bundle` 把 `uniapp-wot-h5/` 下 6 份固定文件全量拼进 system_prompt，
//! 浪费上下文且无法扩展到多桶 / 多源。本次（A.4）重写为索引模式。
//!
//! 调用约定：
//! - `skills_root`：amis-ai 主仓库的 skills 目录（即 `$CLAW_CONFIG_HOME/skills`）
//! - `plugin_roots`：来自 `SKILLS_PLUGIN_PATHS` 的外部插件包目录列表（A 阶段传 &[]，C 阶段填）

use std::path::{Path, PathBuf};

const SKILL_INDEX_FILENAME: &str = "SKILL.md";
const COMMON_BUCKET_DIR: &str = "_common";

/// 一个 skill 桶（目录）的元数据。
#[derive(Debug)]
struct SkillBucketInfo {
    /// 目录名（用于按 stack 字段精确匹配，如 "uniapp-wot-h5"）
    dir_name: String,
    /// SKILL.md frontmatter 中的 `name`，缺失时 fallback 到 dir_name
    display_name: String,
    /// SKILL.md frontmatter 中的 `description`
    description: Option<String>,
    /// SKILL.md 全文（仅 _common 和当前 stack 会用到，其他桶只用 name+description）
    full_text: String,
}

/// 扫描一个 root 目录下的所有 skill 桶。
fn scan_buckets(root: &Path) -> Vec<SkillBucketInfo> {
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
        // 跳过隐藏目录（.git、.gitkeep 等不应出现，但保险起见）
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
        let (fm_name, fm_desc) = parse_frontmatter(&full_text);
        let display_name = fm_name.unwrap_or_else(|| dir_name.clone());
        buckets.push(SkillBucketInfo {
            dir_name,
            display_name,
            description: fm_desc,
            full_text,
        });
    }
    buckets
}

/// 极简 YAML frontmatter 解析：抽 `name` 和 `description`。
///
/// 只支持最常见的形态（单行 key: value，可选引号）：
/// ```text
/// ---
/// name: foo
/// description: "bar baz"
/// ---
/// ```
/// 不支持多行字符串、嵌套对象。完整的 frontmatter 仍保留在 SKILL.md 全文里，
/// Agent 看到的是原始 markdown，不会丢信息。
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
        let parse_value = |rest: &str| -> String {
            rest.trim().trim_matches('"').trim_matches('\'').to_string()
        };
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

/// 构建 Skills 段，作为 ConversationRuntime::system_prompt 的一部分。
///
/// 返回的 `Vec<String>` 每个元素是一个 section，外层会再用换行拼成最终 system_prompt。
pub fn build_skills_system_prompt(
    skills_root: &Path,
    plugin_roots: &[PathBuf],
    current_stack: &str,
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

    // L1：当前 stack 的 SKILL.md 全文（含工作流程）
    if let Some(stack) = buckets.iter().find(|b| b.dir_name == current_stack) {
        sections.push(format!(
            "# Skill: {} (当前技术栈)\n\n{}",
            stack.display_name,
            stack.full_text.trim()
        ));
    } else {
        tracing::warn!(
            "当前技术栈 '{}' 没有匹配的 skill 桶（{}/{}）",
            current_stack,
            skills_root.display(),
            current_stack
        );
    }

    // L2：其他 stacks 的 name+description 索引
    let other_buckets: Vec<&SkillBucketInfo> = buckets
        .iter()
        .filter(|b| b.dir_name != COMMON_BUCKET_DIR && b.dir_name != current_stack)
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
        "Loaded SKILL.md index: {} sections, {} buckets discovered (skills_root={}, plugins={}), current_stack={}",
        sections.len(),
        buckets.len(),
        skills_root.display(),
        plugin_roots.len(),
        current_stack
    );

    sections
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
/// A.5 阶段会让启动脚本统一设置 `CLAW_CONFIG_HOME`，本函数会优先用 env，
/// 落到第三档说明配置缺失（生产环境应 fail loud）。
pub fn default_skills_root() -> PathBuf {
    if let Ok(s) = std::env::var("SKILLS_ROOT") {
        return PathBuf::from(s);
    }
    if let Ok(c) = std::env::var("CLAW_CONFIG_HOME") {
        return PathBuf::from(c).join("skills");
    }
    PathBuf::from("/home/karl/Working/TianXing/amis-ai/skills")
}

/// 从 `SKILLS_PLUGIN_PATHS` env 解析出插件 root 列表（C 阶段会用）。
/// A 阶段会被 task_loop 调用，传给 `build_skills_system_prompt`，
/// 当前 env 通常未设，返回空列表 → L2 就只列 amis-ai 自身的桶。
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
        // 一个空目录（没有 SKILL.md）应该被静默跳过，不影响其他桶
        std::fs::create_dir_all(tmp.path().join("empty-bucket")).expect("mkdir");
        write_skill(
            &tmp.path().join("_common"),
            "_common",
            "x",
            "# y",
        );
        let sections = build_skills_system_prompt(tmp.path(), &[], "any");
        // empty-bucket 不计入；L0 + L3 = 2
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
}
