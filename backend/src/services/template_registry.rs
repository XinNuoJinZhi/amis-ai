//! 底座模板注册表（2026-04 技术栈解耦重构）。
//!
//! 启动时从 `scaffolds/registry.yaml` 加载到内存，放进 `AppState.template_registry`。
//! 前端 Registry API / 任务创建 / sandbox dev_command 参数化 / Skills 默认桶 fallback 都读这里。

use serde::{Deserialize, Serialize};
use std::path::Path;
use std::sync::Arc;

/// 单个模板的完整元数据（对应 registry.yaml 的一条 entry）。
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TemplateSpec {
    pub name: String,
    /// 相对 `$SCAFFOLD_ROOT` 的子目录；None 表示"无目录可复制"（如 `__blank__` 伪模板）
    #[serde(default)]
    pub dir: Option<String>,
    pub platform: String,
    #[serde(default)]
    pub tech_stacks: Vec<String>,
    #[serde(default)]
    pub ui_libs: Vec<String>,
    #[serde(default)]
    pub bootstrap: Vec<String>,
    /// dev server 启动命令；None = 由 Agent 动态生成（从 package.json scripts.dev 读）
    #[serde(default)]
    pub dev_command: Option<String>,
    #[serde(default = "default_dev_log")]
    pub dev_log: String,
    #[serde(default = "default_port_hint")]
    pub preview_port_hint: u16,
    /// 用户没显式选 skill 桶时的默认激活列表
    #[serde(default)]
    pub default_skill_buckets: Vec<String>,
    /// sandbox 镜像 tag（1.3 引入）；None 表示沿用 sandbox-service 启动时默认镜像 `amis-ai-sandbox:uniapp-node20`。
    /// 1.3.0 起 ZC Web 模板用 `amis-ai-sandbox:zc-web-node20`；后续多模板共存时由 sandbox-service 路由 docker run。
    #[serde(default)]
    pub image: Option<String>,
}

fn default_dev_log() -> String {
    "/tmp/vite.log".to_string()
}

fn default_port_hint() -> u16 {
    5173
}

#[derive(Debug, Deserialize)]
struct RegistryFile {
    #[allow(dead_code)]
    version: u32,
    templates: Vec<TemplateSpec>,
}

/// 模板注册表（进程内只读，克隆便宜：外层用 Arc 包一下即可）。
#[derive(Debug, Clone)]
pub struct TemplateRegistry {
    templates: Vec<TemplateSpec>,
}

impl TemplateRegistry {
    /// 从 YAML 文件加载。失败时返回空注册表并记 warn log（不 panic，允许 legacy 路径继续跑）。
    pub fn load(path: &Path) -> Self {
        match std::fs::read_to_string(path) {
            Ok(text) => match serde_yaml::from_str::<RegistryFile>(&text) {
                Ok(file) => {
                    tracing::info!(
                        "Template registry loaded: {} templates from {}",
                        file.templates.len(),
                        path.display()
                    );
                    Self {
                        templates: file.templates,
                    }
                }
                Err(e) => {
                    tracing::warn!(
                        "Template registry YAML parse error at {}: {} —— 使用空注册表兜底",
                        path.display(),
                        e
                    );
                    Self::empty_with_legacy_fallback()
                }
            },
            Err(e) => {
                tracing::warn!(
                    "Template registry file {} unreadable: {} —— 使用 legacy fallback",
                    path.display(),
                    e
                );
                Self::empty_with_legacy_fallback()
            }
        }
    }

    /// Registry 加载失败时的兜底：内置 uniapp-wot-h5 + __blank__ 两条，保证既有功能不退化。
    fn empty_with_legacy_fallback() -> Self {
        let fallback = vec![
            TemplateSpec {
                name: "uniapp-wot-h5-template".into(),
                dir: Some("uniapp-wot-h5-template".into()),
                platform: "mobile".into(),
                tech_stacks: vec!["uniapp".into()],
                ui_libs: vec!["wot".into()],
                bootstrap: vec!["pnpm install".into()],
                dev_command: Some("pnpm run dev:h5".into()),
                dev_log: default_dev_log(),
                preview_port_hint: default_port_hint(),
                default_skill_buckets: vec!["_common".into(), "uniapp-wot-h5".into()],
                image: None,
            },
            TemplateSpec {
                name: "__blank__".into(),
                dir: None,
                platform: "any".into(),
                tech_stacks: vec!["any".into()],
                ui_libs: vec!["any".into()],
                bootstrap: vec![],
                dev_command: None,
                dev_log: default_dev_log(),
                preview_port_hint: default_port_hint(),
                default_skill_buckets: vec!["_common".into(), "scaffold-from-scratch".into()],
                image: None,
            },
        ];
        Self { templates: fallback }
    }

    /// 精确按 name 查模板。
    pub fn get(&self, name: &str) -> Option<&TemplateSpec> {
        self.templates.iter().find(|t| t.name == name)
    }

    /// 列出所有模板的摘要视图（Registry API 用）。
    pub fn list(&self) -> &[TemplateSpec] {
        &self.templates
    }

    /// 按 (platform, tech_stack, ui_lib) 过滤可用模板（任一字段 None 或 "any" 不过滤）。
    pub fn filter(
        &self,
        platform: Option<&str>,
        tech_stack: Option<&str>,
        ui_lib: Option<&str>,
    ) -> Vec<&TemplateSpec> {
        self.templates
            .iter()
            .filter(|t| {
                let platform_ok = match platform {
                    None => true,
                    Some(p) => t.platform == "any" || t.platform == p,
                };
                let stack_ok = match tech_stack {
                    None => true,
                    Some(s) => {
                        t.tech_stacks.iter().any(|x| x == "any" || x == s)
                    }
                };
                let ui_ok = match ui_lib {
                    None => true,
                    Some(u) => t.ui_libs.iter().any(|x| x == "any" || x == u),
                };
                platform_ok && stack_ok && ui_ok
            })
            .collect()
    }
}

/// 便利函数：默认加载路径解析（优先 env，其次仓库相对路径）。
pub fn default_registry_path() -> std::path::PathBuf {
    if let Ok(p) = std::env::var("SCAFFOLD_REGISTRY_PATH") {
        return std::path::PathBuf::from(p);
    }
    if let Ok(root) = std::env::var("SCAFFOLD_ROOT") {
        return std::path::PathBuf::from(root).join("registry.yaml");
    }
    std::path::PathBuf::from("/home/karl/Working/TianXing/amis-ai/scaffolds/registry.yaml")
}

/// 封装成 Arc 以便放进 AppState 共享。
pub fn load_default() -> Arc<TemplateRegistry> {
    Arc::new(TemplateRegistry::load(&default_registry_path()))
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::Write;

    #[test]
    fn test_load_from_yaml_roundtrip() {
        let mut tmp = tempfile::NamedTempFile::new().unwrap();
        writeln!(
            tmp,
            "version: 1\n\
             templates:\n\
             \u{20}\u{20}- name: t1\n\
             \u{20}\u{20}\u{20}\u{20}dir: t1-dir\n\
             \u{20}\u{20}\u{20}\u{20}platform: web\n\
             \u{20}\u{20}\u{20}\u{20}tech_stacks: [react]\n\
             \u{20}\u{20}\u{20}\u{20}ui_libs: [antd]\n\
             \u{20}\u{20}\u{20}\u{20}bootstrap: [pnpm install]\n\
             \u{20}\u{20}\u{20}\u{20}dev_command: pnpm run dev\n\
             \u{20}\u{20}\u{20}\u{20}dev_log: /tmp/vite.log\n\
             \u{20}\u{20}\u{20}\u{20}preview_port_hint: 5173\n\
             \u{20}\u{20}\u{20}\u{20}default_skill_buckets: [_common, stack-react]"
        )
        .unwrap();
        let reg = TemplateRegistry::load(tmp.path());
        let t = reg.get("t1").expect("t1 missing");
        assert_eq!(t.platform, "web");
        assert_eq!(t.tech_stacks, vec!["react".to_string()]);
        assert_eq!(t.dev_command.as_deref(), Some("pnpm run dev"));
        assert_eq!(t.default_skill_buckets, vec!["_common".to_string(), "stack-react".to_string()]);
    }

    #[test]
    fn test_filter_by_dimension() {
        let reg = TemplateRegistry::empty_with_legacy_fallback();
        // __blank__ 的 platform=any，应该命中任何 platform
        let hits = reg.filter(Some("web"), Some("react"), Some("antd"));
        assert!(hits.iter().any(|t| t.name == "__blank__"));
        // uniapp-wot-h5 只在 mobile+uniapp+wot 组合下命中
        let hits_mobile = reg.filter(Some("mobile"), Some("uniapp"), Some("wot"));
        assert!(hits_mobile.iter().any(|t| t.name == "uniapp-wot-h5-template"));
        let hits_web_uniapp = reg.filter(Some("web"), Some("uniapp"), None);
        assert!(!hits_web_uniapp.iter().any(|t| t.name == "uniapp-wot-h5-template"));
    }

    #[test]
    fn test_fallback_when_file_missing() {
        let reg = TemplateRegistry::load(Path::new("/nonexistent/registry.yaml"));
        assert!(reg.get("__blank__").is_some());
        assert!(reg.get("uniapp-wot-h5-template").is_some());
    }
}
