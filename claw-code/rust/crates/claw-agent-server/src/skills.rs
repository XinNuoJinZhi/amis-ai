use std::path::{Path, PathBuf};

/// 从 skills 目录加载 Markdown 文件组装 system prompt 片段。
/// 返回 Vec<String>，每个元素是一个 section（ConversationRuntime::system_prompt 要的格式）。
pub fn load_skills_bundle(skills_root: &Path, tech_stack: &str) -> Vec<String> {
    let bundle_dir = skills_root.join(tech_stack);

    if !bundle_dir.is_dir() {
        tracing::warn!(
            "Skills bundle directory not found: {}",
            bundle_dir.display()
        );
        return Vec::new();
    }

    // 默认加载顺序：scaffold → amis-to-vue → component → api → pages-json → common-errors
    // 这个顺序很关键：先立规矩（不能改什么），再讲映射，最后讲踩坑
    let preferred_order = [
        "scaffold.md",
        "amis-to-vue-mapping.md",
        "component-mapping.md",
        "api-adapter.md",
        "pages-json-rules.md",
        "common-errors.md",
    ];

    let mut sections = Vec::new();
    for filename in preferred_order {
        let path = bundle_dir.join(filename);
        match std::fs::read_to_string(&path) {
            Ok(content) => {
                let section = format!(
                    "# Skill: {} (技术栈 {})\n\n{}",
                    filename.trim_end_matches(".md"),
                    tech_stack,
                    content.trim()
                );
                sections.push(section);
                tracing::info!("Loaded skill: {}", filename);
            }
            Err(e) => {
                tracing::debug!("Skill {} not found or unreadable: {}", filename, e);
            }
        }
    }

    sections
}

/// 默认的 skills 根目录（相对于 workdir_root 或固定路径）
pub fn default_skills_root() -> PathBuf {
    std::env::var("SKILLS_ROOT")
        .map(PathBuf::from)
        .unwrap_or_else(|_| {
            // 默认找项目根的 skills 目录（开发模式）
            PathBuf::from("/home/karl/Working/TianXing/amis-ai/skills")
        })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_load_skills_returns_empty_if_dir_missing() {
        let tmp = std::env::temp_dir().join("claw-agent-skills-test-nonexistent");
        let _ = std::fs::remove_dir_all(&tmp);
        let sections = load_skills_bundle(&tmp, "any-stack");
        assert!(sections.is_empty());
    }

    #[test]
    fn test_load_skills_reads_markdown() {
        let tmp = std::env::temp_dir().join("claw-agent-skills-test");
        let stack_dir = tmp.join("test-stack");
        std::fs::create_dir_all(&stack_dir).unwrap();
        std::fs::write(stack_dir.join("scaffold.md"), "# Hello scaffold").unwrap();

        let sections = load_skills_bundle(&tmp, "test-stack");
        assert_eq!(sections.len(), 1);
        assert!(sections[0].contains("# Skill: scaffold"));
        assert!(sections[0].contains("# Hello scaffold"));

        std::fs::remove_dir_all(&tmp).unwrap();
    }
}
