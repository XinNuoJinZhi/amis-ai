//! R2 用：扫 sandbox 现有产物拼成「全局组件清单」prompt 段
//!
//! 给独立模式（execution_strategy=isolated）下每页 session 注入这个清单作为
//! prompt 头硬约束 — 让 LLM 知道哪些 components / styles / api 已存在，必须 import 复用。

use std::path::Path;

#[derive(Debug, Default)]
pub struct GlobalContext {
    pub component_files: Vec<String>,
    pub style_files: Vec<String>,
    pub api_modules: Vec<String>,
}

/// 扫 workdir 下 src/components / src/styles / src/api 三个目录
pub fn scan_sandbox(workdir: &Path) -> GlobalContext {
    GlobalContext {
        component_files: scan_dir(&workdir.join("src/components"), workdir),
        style_files: scan_dir(&workdir.join("src/styles"), workdir),
        api_modules: scan_dir(&workdir.join("src/api"), workdir),
    }
}

fn scan_dir(dir: &Path, workdir_root: &Path) -> Vec<String> {
    if !dir.exists() {
        return Vec::new();
    }
    walkdir::WalkDir::new(dir)
        .into_iter()
        .filter_map(Result::ok)
        .filter(|e| e.file_type().is_file())
        .filter_map(|e| {
            e.path()
                .strip_prefix(workdir_root)
                .ok()
                .and_then(|p| p.to_str())
                .map(|s| s.to_string())
        })
        .collect()
}

/// 渲染成 prompt section（注入每页 session 的 prompt 头）
pub fn render_prompt_section(ctx: &GlobalContext) -> String {
    if ctx.component_files.is_empty()
        && ctx.style_files.is_empty()
        && ctx.api_modules.is_empty()
    {
        return String::from(
            "\n# 全局组件清单\n\n（当前 sandbox 还没有任何已有组件 / 样式 / API 模块。\
             你可以自由生成，但请尽量统一命名风格 + 把可复用部分抽到 src/components 等位置。）\n",
        );
    }
    let mut out = String::from("\n# 全局组件清单（必须复用，不准重新造）\n\n");
    if !ctx.component_files.is_empty() {
        out.push_str("**已有组件**（请通过 `import { Xxx } from '@/components/xxx'` 复用）：\n");
        for p in &ctx.component_files {
            out.push_str(&format!("- {p}\n"));
        }
        out.push('\n');
    }
    if !ctx.style_files.is_empty() {
        out.push_str("**全局样式 / theme tokens**：\n");
        for p in &ctx.style_files {
            out.push_str(&format!("- {p}\n"));
        }
        out.push('\n');
    }
    if !ctx.api_modules.is_empty() {
        out.push_str("**API 客户端模块**：\n");
        for p in &ctx.api_modules {
            out.push_str(&format!("- {p}\n"));
        }
    }
    out
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use tempfile::tempdir;

    #[test]
    fn test_scan_sandbox_picks_up_component_files() {
        let dir = tempdir().unwrap();
        let comp = dir.path().join("src/components/Button.vue");
        fs::create_dir_all(comp.parent().unwrap()).unwrap();
        fs::write(&comp, "<template></template>").unwrap();
        let ctx = scan_sandbox(dir.path());
        assert_eq!(ctx.component_files.len(), 1);
        assert!(ctx.component_files[0].ends_with("Button.vue"));
    }

    #[test]
    fn test_scan_sandbox_returns_empty_when_dirs_missing() {
        let dir = tempdir().unwrap();
        let ctx = scan_sandbox(dir.path());
        assert!(ctx.component_files.is_empty());
        assert!(ctx.style_files.is_empty());
        assert!(ctx.api_modules.is_empty());
    }

    #[test]
    fn test_render_prompt_section_empty_returns_friendly_message() {
        let ctx = GlobalContext::default();
        let s = render_prompt_section(&ctx);
        assert!(s.contains("还没有任何已有组件"));
    }

    #[test]
    fn test_render_prompt_section_includes_all_sections() {
        let ctx = GlobalContext {
            component_files: vec!["src/components/Button.vue".to_string()],
            style_files: vec!["src/styles/theme.css".to_string()],
            api_modules: vec!["src/api/user.ts".to_string()],
        };
        let s = render_prompt_section(&ctx);
        assert!(s.contains("Button.vue"));
        assert!(s.contains("theme.css"));
        assert!(s.contains("user.ts"));
        assert!(s.contains("必须复用"));
    }
}
