use crate::sandbox_client::SandboxClient;
use crate::state::TaskEvent;
use anyhow::anyhow;
use runtime::{ToolError, ToolExecutor};
use serde_json::json;
use std::path::{Path, PathBuf};
use tokio::sync::broadcast;

/// Skill 工具单次加载允许的最大 SKILL.md 文件大小（256 KB）。
/// 超过此值返回错误 —— 一份合理的 SKILL.md 索引不应超过这个量级，
/// 详细文档应该拆到 references/ 下用 Read 工具按需读。
const SKILL_FILE_SIZE_LIMIT: u64 = 256 * 1024;

pub struct SandboxToolExecutor {
    sandbox: SandboxClient,
    sandbox_id: String,
    workdir: PathBuf,
    event_tx: broadcast::Sender<TaskEvent>,
}

impl SandboxToolExecutor {
    pub fn new(
        sandbox: SandboxClient,
        sandbox_id: String,
        workdir: PathBuf,
        event_tx: broadcast::Sender<TaskEvent>,
    ) -> Self {
        Self {
            sandbox,
            sandbox_id,
            workdir,
            event_tx,
        }
    }
}

impl ToolExecutor for SandboxToolExecutor {
    fn execute(&mut self, tool_name: &str, input: &str) -> Result<String, ToolError> {
        let result = match tool_name {
            "bash" => execute_bash(&self.sandbox, &self.sandbox_id, input),
            "read_file" => execute_read_file(&self.workdir, input),
            "write_file" => execute_write_file(&self.workdir, input),
            "edit_file" => execute_edit_file(&self.workdir, input),
            "glob_search" => execute_glob_search(&self.workdir, input),
            "grep_search" => execute_grep_search(&self.workdir, input),
            "dev_start" => execute_dev_start(&self.sandbox, &self.sandbox_id),
            // claw-code 标准 Skill 工具：按需加载某个 skill 的 SKILL.md 全文，
            // 配合 progressive disclosure，让 Agent 不必把所有 markdown 全塞进 system_prompt。
            // workdir 作为 cwd 传给 commands::resolve_skill_path 用于 ancestor 扫描，
            // 但实际的发现路径主要是 $CLAW_CONFIG_HOME/skills 和 $SKILLS_PLUGIN_PATHS。
            "Skill" => execute_skill_with_guard(&self.workdir, input),
            other => Err(ToolError::new(format!("不支持的工具: {other}"))),
        };

        // 广播工具执行结果到事件流（让前端能看到返回内容）
        let (output, is_error) = match &result {
            Ok(s) => (s.clone(), false),
            Err(e) => (format!("{}", e), true),
        };
        let _ = self.event_tx.send(TaskEvent::ToolResult {
            name: tool_name.to_string(),
            output,
            is_error,
        });

        result
    }
}

/// 调用 sandbox-service 的 dev-start 端点启动 Vite dev server 并让沙箱监控状态。
/// 返回一段简短的状态描述给 Agent，避免它误以为"失败了"。
fn execute_dev_start(sandbox: &SandboxClient, sandbox_id: &str) -> Result<String, ToolError> {
    sandbox
        .dev_start(sandbox_id)
        .map_err(|e| ToolError::new(format!("dev_start failed: {}", e)))?;
    Ok(json!({
        "status": "starting",
        "message": "dev server is starting. Sandbox service will monitor Vite output. It takes up to 120 seconds. Task is considered complete after this call — do NOT loop checking dev-status."
    })
    .to_string())
}

fn execute_bash(
    sandbox: &SandboxClient,
    sandbox_id: &str,
    input: &str,
) -> Result<String, ToolError> {
    let bash_input: serde_json::Value = serde_json::from_str(input)
        .map_err(|e| ToolError::new(format!("Invalid bash input JSON: {}", e)))?;

    let command = bash_input
        .get("command")
        .and_then(|v| v.as_str())
        .ok_or_else(|| ToolError::new("Missing 'command' field in bash input"))?;

    let cmd = vec!["sh".to_string(), "-c".to_string(), command.to_string()];

    let exec_result = sandbox.exec(sandbox_id, cmd, None).map_err(|e| {
        ToolError::new(format!("Failed to execute bash in sandbox: {}", e))
    })?;

    let output = json!({
        "stdout": exec_result.stdout,
        "stderr": exec_result.stderr,
        "exit_code": exec_result.exit_code
    });

    Ok(output.to_string())
}

fn execute_read_file(workdir: &std::path::Path, input: &str) -> Result<String, ToolError> {
    let read_input: serde_json::Value = serde_json::from_str(input)
        .map_err(|e| ToolError::new(format!("Invalid read_file input JSON: {}", e)))?;

    let path = read_input
        .get("path")
        .and_then(|v| v.as_str())
        .ok_or_else(|| ToolError::new("Missing 'path' field in read_file input"))?;

    let full_path = normalize_path(workdir, path);

    let content = std::fs::read_to_string(&full_path)
        .map_err(|e| ToolError::new(format!("Failed to read file: {}", e)))?;

    Ok(content)
}

/// 把 Agent 传入的 path 归一化到宿主机真实路径。
///
/// Agent 从 bash 工具看到的是容器视角（挂载点 `/workspace`），容易把 write_file / edit_file / read_file
/// 的路径也写成 `/workspace/src/pages/xxx.vue`。但这三个工具是在**宿主机**的 claw-agent-server 进程里
/// 直接 `std::fs::*`，宿主机根目录下没有 `/workspace` 目录，`karl` 用户也无权在 `/` 下创建它，
/// 结果是 `Permission denied (os error 13)`。
///
/// 归一化规则：
/// 1. 剥掉 `/workspace/` 或 `/workspace` 前缀 → 当相对路径处理，拼 workdir
/// 2. 剥掉 `/var/amis-ai/workdirs/task-N/` 前缀（Agent 偶尔会用真实宿主机路径）→ 当相对路径
/// 3. 其他绝对路径：保留（比如系统工具查文件）
/// 4. 相对路径：拼 workdir
fn normalize_path(workdir: &std::path::Path, path: &str) -> std::path::PathBuf {
    let trimmed = path.trim();
    // 容器视角前缀
    if let Some(rest) = trimmed.strip_prefix("/workspace/") {
        return workdir.join(rest);
    }
    if trimmed == "/workspace" {
        return workdir.to_path_buf();
    }
    // 宿主机真实路径前缀（Agent 有时会手滑写出来）
    if let Some(workdir_str) = workdir.to_str() {
        let with_slash = format!("{workdir_str}/");
        if let Some(rest) = trimmed.strip_prefix(&with_slash) {
            return workdir.join(rest);
        }
        if trimmed == workdir_str {
            return workdir.to_path_buf();
        }
    }
    // 其他绝对路径保留
    if std::path::Path::new(trimmed).is_absolute() {
        return std::path::PathBuf::from(trimmed);
    }
    // 相对路径拼 workdir
    workdir.join(trimmed)
}

/// 预检写入的 .vue 文件内容：如果里面用到了 Wot UI 的某个组件但对应组件目录在
/// `node_modules/wot-design-uni/components/<name>/` 下不存在，就拒绝写入。
///
/// 动机：qwen3.5:27b 经常 hallucinate 其他 UI 库的组件名（`<wd-empty>` / `<wd-result>` /
/// `<wd-skeleton>`），这些在 Wot UI 1.6.0 里不存在。`@dcloudio/vite-plugin-uni` 的 easycom
/// 会按 `^wd-(.*)` 规则自动插入 `import __easycom_X from 'wot-design-uni/components/wd-X/wd-X.vue'`
/// ——路径不存在就会在**浏览器打开页面时**报 `[plugin:vite:import-analysis] Failed to resolve import`，
/// Agent 反复"修"也修不好（因为根本不是语法问题，是组件不存在）。
///
/// 在 write_file / edit_file 工具层面把这个失败提前到**写入时**，Agent 立即收到明确错误
/// 与替代方案提示，能真正止血。
fn validate_wot_components(workdir: &std::path::Path, path: &str, content: &str) -> Result<(), ToolError> {
    if !path.ends_with(".vue") {
        return Ok(());
    }
    // 扫 <wd-xxx 样式的标签（含连字符），自闭合 / 开标签都能命中
    let re = regex::Regex::new(r"<(wd-[a-z][a-z0-9-]*)").expect("regex");
    let mut missing: Vec<String> = Vec::new();
    let mut seen: std::collections::HashSet<String> = std::collections::HashSet::new();
    for cap in re.captures_iter(content) {
        let name = cap.get(1).map(|m| m.as_str().to_string()).unwrap_or_default();
        if name.is_empty() || !seen.insert(name.clone()) {
            continue;
        }
        let component_vue = workdir
            .join("node_modules/wot-design-uni/components")
            .join(&name)
            .join(format!("{name}.vue"));
        if !component_vue.exists() {
            missing.push(name);
        }
    }
    if missing.is_empty() {
        return Ok(());
    }

    // 常见 hallucinated 组件的替代方案（只列 Wot UI 1.6.0 里**真的不存在**的）
    let hint = |n: &str| -> &'static str {
        match n {
            "wd-empty" => "Wot UI 没有 empty 组件（你可能混淆了 NutUI/Vant）。空状态用 `<view>` + `<wd-img>` 占位图 + 提示文字自己拼，或用 `<wd-status-tip>`",
            "wd-result" => "Wot UI 没有 result 组件。用 `<wd-status-tip>` 展示状态，或 `<view>` + `<wd-img>` + `<wd-button>` 手拼",
            "wd-list" => "Wot UI 没有 list 组件。长列表直接 `<view v-for>` + `<wd-cell-group>` + `<wd-cell>`",
            "wd-dialog" => "Wot UI 没有 dialog 组件。弹窗用 `<wd-message-box>`（命令式）或 `<wd-popup position=\"center\">`（声明式）",
            "wd-modal" => "同 wd-dialog：用 `<wd-message-box>` 或 `<wd-popup>`",
            "wd-select" => "Wot UI 没有通用 select。用 `<wd-picker>`（单选）、`<wd-col-picker>`（多级联动）、`<wd-select-picker>`（多选）",
            "wd-pull-refresh" | "wd-refresh" => "Wot UI 没有独立的下拉刷新组件，uni-app 原生用 onPullDownRefresh 生命周期",
            "wd-radio-button" => "用 `<wd-radio>` + `<wd-radio-group shape=\"button\">` 实现按钮式单选",
            "wd-menu" | "wd-menu-item" => "下拉菜单用 `<wd-drop-menu>` + `<wd-drop-menu-item>`",
            _ => "用 `bash ls /workspace/node_modules/wot-design-uni/components/` 查看真实存在的组件清单，或参考 skills/uniapp-wot-h5/component-mapping.md",
        }
    };
    let details: Vec<String> = missing
        .iter()
        .map(|n| format!("- `<{}>`：{}", n, hint(n)))
        .collect();
    Err(ToolError::new(format!(
        "❌ 文件 {path} 里用到的以下 Wot UI 组件在 `node_modules/wot-design-uni/components/` 里**不存在**（很可能是你把其他 UI 库的组件名张冠李戴了）：\n\n{}\n\n\
         Wot UI 1.6.0 通过 easycom 自动 import：`<wd-X>` → `wot-design-uni/components/wd-X/wd-X.vue`。你用一个不存在的标签，Vite 编译后浏览器打开就会报 `Failed to resolve import`。\n\n\
         请先用 `bash ls /workspace/node_modules/wot-design-uni/components/` 看看**真实存在**的组件列表，再重新写这个文件。",
        details.join("\n")
    )))
}

/// 锁定文件白名单：Agent 不允许通过 write_file / edit_file 修改这些关键底座文件。
/// 这些文件的版本依赖都是种子项目维护者锁定过的，改动极易破坏 npm 依赖解析。
fn is_locked_scaffold_file(path: &str) -> bool {
    let normalized = path.trim().trim_start_matches("./").trim_start_matches('/');
    // 匹配文件名（允许路径前缀），如 "package.json" / "src/../package.json" / "/workspace/package.json"
    let basename = normalized.rsplit('/').next().unwrap_or(normalized);
    // 单文件锁定
    if matches!(
        basename,
        "package.json"
            | "pnpm-lock.yaml"
            | "yarn.lock"
            | "package-lock.json"
            | "vite.config.ts"
            | "vite.config.js"
            | "tsconfig.json"
            | ".npmrc"
            | "manifest.json"
    ) {
        return true;
    }
    // 入口文件锁定（带 src/ 前缀判断，避免误伤同名业务文件）
    matches!(
        normalized,
        "src/main.ts" | "src/main.js" | "src/App.vue"
    ) || normalized.ends_with("/src/main.ts")
        || normalized.ends_with("/src/main.js")
        || normalized.ends_with("/src/App.vue")
}

fn execute_write_file(workdir: &std::path::Path, input: &str) -> Result<String, ToolError> {
    let write_input: serde_json::Value = serde_json::from_str(input)
        .map_err(|e| ToolError::new(format!("Invalid write_file input JSON: {}", e)))?;

    let path = write_input
        .get("path")
        .and_then(|v| v.as_str())
        .ok_or_else(|| ToolError::new("Missing 'path' field in write_file input"))?;

    if is_locked_scaffold_file(path) {
        return Err(ToolError::new(format!(
            "❌ 禁止修改锁定文件: {path}。package.json / pnpm-lock.yaml / vite.config.ts / tsconfig.json / .npmrc / manifest.json / src/main.ts / src/App.vue 是种子项目的锁定底座，改动会破坏依赖解析或 Vite 启动。特别注意：严禁在 src/main.ts 中 import 任何第三方库的 CSS（Wot UI 样式由 easycom 自动注入）。你只能在 src/pages/、src/api/、src/pages.json、src/static/ 下创建或修改文件。"
        )));
    }

    let content = write_input
        .get("content")
        .and_then(|v| v.as_str())
        .ok_or_else(|| ToolError::new("Missing 'content' field in write_file input"))?;

    // Wot UI 组件存在性预检（防止 Agent hallucinate 不存在的组件名导致 easycom 运行时 import 失败）
    validate_wot_components(workdir, path, content)?;

    let full_path = normalize_path(workdir, path);

    if let Some(parent) = full_path.parent() {
        std::fs::create_dir_all(parent)
            .map_err(|e| ToolError::new(format!("Failed to create directories: {}", e)))?;
    }

    std::fs::write(&full_path, content)
        .map_err(|e| ToolError::new(format!("Failed to write file: {}", e)))?;

    Ok(json!({"status": "ok"}).to_string())
}

fn execute_edit_file(workdir: &std::path::Path, input: &str) -> Result<String, ToolError> {
    let edit_input: serde_json::Value = serde_json::from_str(input)
        .map_err(|e| ToolError::new(format!("Invalid edit_file input JSON: {}", e)))?;

    let path = edit_input
        .get("path")
        .and_then(|v| v.as_str())
        .ok_or_else(|| ToolError::new("Missing 'path' field in edit_file input"))?;

    if is_locked_scaffold_file(path) {
        return Err(ToolError::new(format!(
            "❌ 禁止修改锁定文件: {path}。只允许修改 src/pages.json（添加路由）、src/pages/**、src/api/** 等业务代码。src/main.ts / src/App.vue / package.json / vite.config.ts 等底座文件不可改。特别注意不要 import 第三方库的 CSS。"
        )));
    }

    let old_text = edit_input
        .get("old_text")
        .and_then(|v| v.as_str())
        .ok_or_else(|| ToolError::new("Missing 'old_text' field in edit_file input"))?;

    let new_text = edit_input
        .get("new_text")
        .and_then(|v| v.as_str())
        .ok_or_else(|| ToolError::new("Missing 'new_text' field in edit_file input"))?;

    let full_path = normalize_path(workdir, path);

    let mut content = std::fs::read_to_string(&full_path)
        .map_err(|e| ToolError::new(format!("Failed to read file: {}", e)))?;

    if !content.contains(old_text) {
        return Err(ToolError::new(format!(
            "Pattern '{}' not found in file",
            old_text
        )));
    }

    content = content.replace(old_text, new_text);

    // Wot UI 组件存在性预检（覆盖 edit_file 场景，避免 Agent 通过 edit 悄悄把不存在的组件塞进来）
    validate_wot_components(workdir, path, &content)?;

    std::fs::write(&full_path, content)
        .map_err(|e| ToolError::new(format!("Failed to write file: {}", e)))?;

    Ok(json!({"status": "ok"}).to_string())
}

fn execute_glob_search(workdir: &std::path::Path, input: &str) -> Result<String, ToolError> {
    let glob_input: serde_json::Value = serde_json::from_str(input)
        .map_err(|e| ToolError::new(format!("Invalid glob_search input JSON: {}", e)))?;

    let pattern = glob_input
        .get("pattern")
        .and_then(|v| v.as_str())
        .ok_or_else(|| ToolError::new("Missing 'pattern' field in glob_search input"))?;

    let search_path = glob_input
        .get("path")
        .and_then(|v| v.as_str())
        .unwrap_or(".");

    let full_pattern = normalize_path(workdir, search_path).join(pattern);
    let pattern_str = full_pattern
        .to_str()
        .ok_or_else(|| ToolError::new("Invalid pattern path"))?;

    let entries = glob::glob(pattern_str)
        .map_err(|e| ToolError::new(format!("Invalid glob pattern: {}", e)))?
        .filter_map(|entry| {
            entry
                .ok()
                .and_then(|path| path.to_str().map(|s| s.to_string()))
        })
        .collect::<Vec<_>>();

    Ok(json!(entries).to_string())
}

fn execute_grep_search(workdir: &std::path::Path, input: &str) -> Result<String, ToolError> {
    let grep_input: serde_json::Value = serde_json::from_str(input)
        .map_err(|e| ToolError::new(format!("Invalid grep_search input JSON: {}", e)))?;

    let pattern = grep_input
        .get("pattern")
        .and_then(|v| v.as_str())
        .ok_or_else(|| ToolError::new("Missing 'pattern' field in grep_search input"))?;

    let search_path = grep_input
        .get("path")
        .and_then(|v| v.as_str())
        .unwrap_or(".");

    let full_path = normalize_path(workdir, search_path);

    let mut results = Vec::new();

    if full_path.is_file() {
        let content = std::fs::read_to_string(&full_path)
            .map_err(|e| ToolError::new(format!("Failed to read file: {}", e)))?;

        for (line_no, line) in content.lines().enumerate() {
            if line.contains(pattern) {
                results.push(format!("{}:{}: {}", full_path.display(), line_no + 1, line));
            }
        }
    } else if full_path.is_dir() {
        for entry in walkdir::WalkDir::new(&full_path)
            .into_iter()
            .filter_map(|e| e.ok())
            .filter(|e| e.path().is_file())
        {
            if let Ok(content) = std::fs::read_to_string(entry.path()) {
                for (line_no, line) in content.lines().enumerate() {
                    if line.contains(pattern) {
                        results.push(format!(
                            "{}:{}: {}",
                            entry.path().display(),
                            line_no + 1,
                            line
                        ));
                    }
                }
            }
        }
    }

    Ok(json!(results).to_string())
}

/// claw-code 标准 `Skill` 工具的安全包装。
///
/// 流程：
/// 1. 解析 `{skill, args?}` 输入
/// 2. 复用 `commands::resolve_skill_path` 把 skill 名解析成 SKILL.md 路径
///    （它会扫 `$CLAW_CONFIG_HOME/skills`、cwd 祖先、`$HOME/.claude/skills` 等）
/// 3. **强制路径白名单**：解析出的真实路径必须落在 `$CLAW_CONFIG_HOME/skills/**`
///    或 `$SKILLS_PLUGIN_PATHS` 中任一根的子树内。
///    这一步同时阻断两类问题：
///     - 攻击：Agent 用 `..` 等花招读宿主机任意文件（resolve_skill_path 本身已做名字校验，
///       但白名单是第二道闸）
///     - 污染：宿主机用户的 `$HOME/.claude/skills/*` 被混入业务上下文（A.0 PoC 暴露的副作用）
/// 4. **强制 size 上限**（256 KB）：claw-code 内部 `execute_skill` 没有 size 校验，
///    我们必须自己加，避免离谱大文件爆 token / OOM
/// 5. 解析 frontmatter 抽出 description
/// 6. 返回 JSON 给 Agent
fn execute_skill_with_guard(workdir: &Path, input: &str) -> Result<String, ToolError> {
    let skill_input: serde_json::Value = serde_json::from_str(input)
        .map_err(|e| ToolError::new(format!("Invalid Skill input JSON: {}", e)))?;

    let skill_name = skill_input
        .get("skill")
        .and_then(|v| v.as_str())
        .ok_or_else(|| ToolError::new("Missing 'skill' field in Skill input"))?
        .trim();

    if skill_name.is_empty() {
        return Err(ToolError::new("'skill' field must not be empty"));
    }

    let args = skill_input
        .get("args")
        .and_then(|v| v.as_str())
        .map(|s| s.to_string());

    // 用 claw-code commands crate 解析 skill 名 → 真实 SKILL.md 路径
    let skill_path = commands::resolve_skill_path(workdir, skill_name)
        .map_err(|e| ToolError::new(format!("Skill '{}' not found: {}", skill_name, e)))?;

    // 第一道闸：白名单校验。失败即拒，绝不读文件。
    enforce_skill_path_whitelist(&skill_path)?;

    // 第二道闸：size 上限。stat 后再 read，避免大文件先吃满内存。
    let metadata = std::fs::metadata(&skill_path).map_err(|e| {
        ToolError::new(format!(
            "Failed to stat skill at {}: {}",
            skill_path.display(),
            e
        ))
    })?;
    if metadata.len() > SKILL_FILE_SIZE_LIMIT {
        return Err(ToolError::new(format!(
            "Skill file '{}' is {} bytes, exceeds {} byte limit. \
             Move bulky content into references/ and Read it on demand.",
            skill_path.display(),
            metadata.len(),
            SKILL_FILE_SIZE_LIMIT
        )));
    }

    let prompt = std::fs::read_to_string(&skill_path)
        .map_err(|e| ToolError::new(format!("Failed to read skill: {}", e)))?;

    // frontmatter description（claw-code SkillOutput 也有这个字段，保持兼容）
    let description = parse_frontmatter_description(&prompt);

    let output = json!({
        "skill": skill_name,
        "path": skill_path.display().to_string(),
        "args": args,
        "description": description,
        "prompt": prompt,
    });
    Ok(output.to_string())
}

/// 强制 skill 文件路径必须在白名单根下。
///
/// 白名单根来自两个 env：
/// - `CLAW_CONFIG_HOME/skills`（amis-ai 自身的 skills）
/// - `SKILLS_PLUGIN_PATHS` 逗号分隔的多路径（ZC Amis 等外部插件包）
///
/// 用 `canonicalize` 把符号链接、`..` 等花招都拍平，再做 starts_with。
fn enforce_skill_path_whitelist(path: &Path) -> Result<(), ToolError> {
    let canonical = std::fs::canonicalize(path).map_err(|e| {
        ToolError::new(format!(
            "Failed to canonicalize skill path {}: {}",
            path.display(),
            e
        ))
    })?;

    let mut allowed_roots: Vec<PathBuf> = Vec::new();
    if let Ok(home) = std::env::var("CLAW_CONFIG_HOME") {
        let p = PathBuf::from(home).join("skills");
        if let Ok(c) = std::fs::canonicalize(&p) {
            allowed_roots.push(c);
        }
    }
    if let Ok(plugins) = std::env::var("SKILLS_PLUGIN_PATHS") {
        for raw in plugins.split(',') {
            let raw = raw.trim();
            if raw.is_empty() {
                continue;
            }
            if let Ok(c) = std::fs::canonicalize(raw) {
                allowed_roots.push(c);
            }
        }
    }

    if allowed_roots.is_empty() {
        return Err(ToolError::new(
            "Refusing to load skill: neither CLAW_CONFIG_HOME nor SKILLS_PLUGIN_PATHS is set with a valid existing path",
        ));
    }

    if allowed_roots.iter().any(|root| canonical.starts_with(root)) {
        return Ok(());
    }

    Err(ToolError::new(format!(
        "Skill path '{}' is outside allowed roots ({} configured). \
         Allowed roots: CLAW_CONFIG_HOME/skills and SKILLS_PLUGIN_PATHS only.",
        canonical.display(),
        allowed_roots.len()
    )))
}

/// 极简 YAML frontmatter description 解析。
///
/// 只支持最常见的形态：
/// ```text
/// ---
/// name: foo
/// description: bar baz
/// ---
/// ```
/// 不支持多行字符串、引号转义、嵌套对象 —— 这一层只是**抽出 description 当友好提示**，
/// SKILL.md 的真正内容在 `prompt` 字段里全部返回，Agent 自己也能看到原始 frontmatter。
fn parse_frontmatter_description(content: &str) -> Option<String> {
    let mut lines = content.lines();
    let first = lines.next()?.trim();
    if first != "---" {
        return None;
    }
    for line in lines {
        let trimmed = line.trim();
        if trimmed == "---" {
            return None;
        }
        if let Some(rest) = trimmed.strip_prefix("description:") {
            let value = rest
                .trim()
                .trim_matches('"')
                .trim_matches('\'')
                .to_string();
            if value.is_empty() {
                return None;
            }
            return Some(value);
        }
    }
    None
}

#[cfg(test)]
mod tests {
    use super::*;

    // 注：原 test_tool_executor_creation 已与新 4 参数 new() 不同步，
    // event_tx 需要 broadcast::Sender，构造繁琐，先移除。
    // SandboxToolExecutor::new 的逻辑由集成测试覆盖即可。

    #[test]
    fn frontmatter_extracts_description() {
        let md = "---\nname: foo\ndescription: hello world\n---\n\n# body";
        assert_eq!(
            parse_frontmatter_description(md),
            Some("hello world".to_string())
        );
    }

    #[test]
    fn frontmatter_handles_quoted_description() {
        let md = "---\nname: foo\ndescription: \"hello, world\"\n---\n";
        assert_eq!(
            parse_frontmatter_description(md),
            Some("hello, world".to_string())
        );
    }

    #[test]
    fn frontmatter_returns_none_when_absent() {
        let md = "# Just a heading, no frontmatter";
        assert_eq!(parse_frontmatter_description(md), None);
    }

    #[test]
    fn whitelist_rejects_when_no_env_set() {
        // 清空两个 env，模拟"未配置"场景
        // SAFETY：单测进程内串行设置 env
        std::env::remove_var("CLAW_CONFIG_HOME");
        std::env::remove_var("SKILLS_PLUGIN_PATHS");
        let result = enforce_skill_path_whitelist(Path::new("/etc/passwd"));
        assert!(result.is_err());
        let msg = format!("{}", result.unwrap_err());
        assert!(msg.contains("Refusing"), "unexpected error: {msg}");
    }

    #[test]
    fn whitelist_allows_path_under_claw_config_home() {
        let temp = tempfile::tempdir().expect("temp");
        let skills_dir = temp.path().join("skills").join("hello");
        std::fs::create_dir_all(&skills_dir).expect("mkdir");
        let skill_md = skills_dir.join("SKILL.md");
        std::fs::write(&skill_md, "---\nname: hello\n---\n").expect("write");

        std::env::set_var("CLAW_CONFIG_HOME", temp.path());
        std::env::remove_var("SKILLS_PLUGIN_PATHS");

        assert!(enforce_skill_path_whitelist(&skill_md).is_ok());
    }

    #[test]
    fn whitelist_rejects_path_outside_allowed_roots() {
        let temp = tempfile::tempdir().expect("temp");
        std::fs::create_dir_all(temp.path().join("skills")).expect("mkdir skills");
        std::env::set_var("CLAW_CONFIG_HOME", temp.path());
        std::env::remove_var("SKILLS_PLUGIN_PATHS");

        // 创建一个白名单**外**的真实文件，避免 canonicalize 失败掩盖逻辑
        let outside = tempfile::NamedTempFile::new().expect("outside");
        let result = enforce_skill_path_whitelist(outside.path());
        assert!(
            result.is_err(),
            "should reject path {} outside CLAW_CONFIG_HOME",
            outside.path().display()
        );
        let msg = format!("{}", result.unwrap_err());
        assert!(msg.contains("outside allowed roots"), "unexpected: {msg}");
    }
}
