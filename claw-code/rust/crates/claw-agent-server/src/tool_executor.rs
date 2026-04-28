use crate::sandbox_client::SandboxClient;
use crate::state::TaskEvent;
use runtime::{ToolError, ToolExecutor};
use serde_json::json;
use std::path::{Path, PathBuf};
use std::time::SystemTime;
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
    /// 任务开始时间（task_loop 构造 executor 的瞬间）。dev_start 前置健康检查
    /// 用它判断 workdir 内是否有任何文件 mtime > task_started_at——
    /// 全部"陈旧"则说明 LLM 一行业务代码都没改、却急着启动 dev server，
    /// task #100 实锤：那次任务 55 次 write_file 全越界、workdir 一个文件没动，
    /// 但 LLM 照样调 dev_start 自报"已完成"。
    task_started_at: SystemTime,
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
            task_started_at: SystemTime::now(),
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
            "dev_start" => execute_dev_start(
                &self.sandbox,
                &self.sandbox_id,
                &self.workdir,
                self.task_started_at,
            ),
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

/// dev_start 前置健康检查：扫 workdir 下是否有任何文件的 mtime 晚于 task_started_at。
///
/// 动机：task #100 实锤——LLM 把 55 个 write_file 全写到了越界路径（被新版 `enforce_within_workdir`
/// 拦了之后，文件根本没落地），workdir 里一个新文件都没有；但 LLM 照样调 dev_start 自报"已完成"。
/// 状态机基于 dev ready 事件触发，于是任务被错误地标 succeeded。
///
/// 这层防御让 dev_start **当场拒绝**，错误信息明确告诉 Agent："你似乎还没写任何业务代码，
/// 检查上面 write_file 是否报过路径错误，把路径改成相对路径重发"——LLM 还有自修复机会。
///
/// 实现：递归遍历 workdir，遇到任意文件 mtime > task_started_at（或 mtime > workdir 自身 mtime
/// 留余量 5s 兜底）即视为"有产出"。空目录、I/O 错误、无法读 mtime 都按"无法判定"处理（保守放行，
/// 不阻塞合法 use case）。
fn dev_start_preflight(workdir: &Path, task_started_at: SystemTime) -> Result<(), ToolError> {
    let mut saw_recent_file = false;

    // 用 walkdir 递归扫描，但层级和目录数都设上限避免极端情况爆栈/超时。
    // node_modules 永远跳过——种子模板里安装过依赖时它会有大量"新"文件，会误判为"有改动"，
    // 但它跟业务代码无关。
    for entry in walkdir::WalkDir::new(workdir)
        .max_depth(8)
        .into_iter()
        .filter_entry(|e| {
            !matches!(
                e.file_name().to_str(),
                Some("node_modules") | Some(".git") | Some("dist") | Some(".uniapp")
            )
        })
        .filter_map(|e| e.ok())
        .take(20_000)
    {
        if !entry.file_type().is_file() {
            continue;
        }
        let Ok(meta) = entry.metadata() else { continue };
        let Ok(mtime) = meta.modified() else { continue };
        if mtime > task_started_at {
            saw_recent_file = true;
            break;
        }
    }

    if saw_recent_file {
        return Ok(());
    }

    Err(ToolError::new(
        "❌ dev_start 前置检查失败：工作目录里没有任何在本任务期间被新建/修改的文件。\n\n\
         可能的原因（按概率排序）：\n\
         1. 你之前的 `write_file` / `edit_file` 都被路径校验拒绝了（错误信息里写明 `路径越界` 之类）——\
         请回看历史工具结果，把路径**改成相对路径**（如 `src/pages/foo/index.vue`）重新写入。\n\
         2. 你在 `bash` 工具里 mkdir/写文件——但 bash 在容器里跑，文件不会出现在工作目录。\
         **业务代码必须用 write_file / edit_file 写**，bash 只用于运行命令（pnpm install / lint 等）。\n\
         3. 你「以为」已经写完了，但其实一次 write_file 都没调用。\n\n\
         请先把业务代码用 write_file / edit_file 真正写到工作目录，然后再调用 dev_start。\n\
         （这条防线是 task #100 复盘后加的：那次 LLM 写了 55 次 write_file 但全部越界没落地，\
         照样自信地 dev_start，结果预览跑的还是脚手架原版。）"
            .to_string(),
    ))
}

/// 调用 sandbox-service 的 dev-start 端点启动 Vite dev server 并让沙箱监控状态。
/// 返回一段简短的状态描述给 Agent，避免它误以为"失败了"。
fn execute_dev_start(
    sandbox: &SandboxClient,
    sandbox_id: &str,
    workdir: &Path,
    task_started_at: SystemTime,
) -> Result<String, ToolError> {
    // 防御层：workdir 没有任何"新文件"则拒绝 dev_start
    dev_start_preflight(workdir, task_started_at)?;

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
/// 2. 剥掉 `/tmp/workspace/` 或 `/tmp/workspace` 前缀（task #100 实锤：LLM 凭旧记忆
///    给 write_file 传容器视角的 `/tmp/workspace/...`，结果在宿主机另写到 host /tmp 死路里，
///    任务"成功"但 dev server 跑的还是脚手架原版）→ 当相对路径
/// 3. 剥掉 `/var/amis-ai/workdirs/task-N/` 前缀（Agent 偶尔会用真实宿主机路径）→ 当相对路径
/// 4. 其他绝对路径：保留（read_file 偶尔需要读 /tmp/vite.log 等系统位置；
///    write/edit 之后再由 `enforce_within_workdir` 做硬校验防越界）
/// 5. 相对路径：拼 workdir
fn normalize_path(workdir: &std::path::Path, path: &str) -> std::path::PathBuf {
    let trimmed = path.trim();
    // 容器视角前缀（脚手架推荐写法）
    if let Some(rest) = trimmed.strip_prefix("/workspace/") {
        return workdir.join(rest);
    }
    if trimmed == "/workspace" {
        return workdir.to_path_buf();
    }
    // 容器内 /tmp/workspace（早期约定，Agent 凭记忆复用 → 必须显式归一）
    if let Some(rest) = trimmed.strip_prefix("/tmp/workspace/") {
        return workdir.join(rest);
    }
    if trimmed == "/tmp/workspace" {
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
    // 其他绝对路径保留（写/编辑层面会有 enforce_within_workdir 兜底拦截）
    if std::path::Path::new(trimmed).is_absolute() {
        return std::path::PathBuf::from(trimmed);
    }
    // 相对路径拼 workdir
    workdir.join(trimmed)
}

/// 词法规范化：把 `..` / `.` / 多余分隔符等吃掉，**不接触文件系统**。
///
/// 用于 `enforce_within_workdir`——写/编辑前要判断 full_path 是否落在 workdir 内，
/// 但 full_path 多半还不存在（write 创建新文件），`canonicalize` 直接 fail。
/// 改用纯字符串规范化：能挡 `../../etc/passwd` 这类越界，又对未存在路径有效。
fn lexically_normalize(path: &std::path::Path) -> std::path::PathBuf {
    use std::path::Component;
    let mut out: Vec<Component<'_>> = Vec::new();
    for c in path.components() {
        match c {
            Component::ParentDir => {
                // 仅当上一段是 Normal 时才弹出；Prefix/RootDir 保留，避免越过根
                if matches!(out.last(), Some(Component::Normal(_))) {
                    out.pop();
                }
            }
            Component::CurDir => {}
            other => out.push(other),
        }
    }
    out.iter().collect()
}

/// 写/编辑工具的硬校验：归一化后的目标路径**必须**落在 workdir 子树内。
///
/// 动机：task #100 实锤——LLM 给 write_file 传 `/tmp/workspace/...`，
/// `normalize_path` 老版本把它当"其他绝对路径"原样保留，结果文件落到宿主机 /tmp 里、
/// dev server 跑的还是脚手架原版，任务"成功"但预览没改。这一层是兜底，
/// 哪怕将来再冒出新的奇葩前缀，写/编辑层面也不会再悄悄越界。
///
/// 错误信息明确告诉 Agent 怎么修——用相对路径或 `/workspace/...`。
fn enforce_within_workdir(
    workdir: &std::path::Path,
    full_path: &std::path::Path,
    raw_path: &str,
) -> Result<(), ToolError> {
    let normalized = lexically_normalize(full_path);
    let workdir_norm = lexically_normalize(workdir);
    if normalized.starts_with(&workdir_norm) {
        return Ok(());
    }
    Err(ToolError::new(format!(
        "❌ 路径越界：`{raw}` 被解析到 `{full}`，落在工作目录 `{wd}` 之外。\n\n\
         所有 write_file / edit_file 必须把文件写在工作目录内。请用以下任一方式：\n\
         1. **相对路径**（推荐）：`src/pages/foo/index.vue`、`pages.json`、`vite.config.ts`\n\
         2. 容器视角前缀：`/workspace/src/pages/foo/index.vue`（会被自动映射到工作目录）\n\n\
         ❌ 禁止使用 `/tmp/...` `/home/...` `/etc/...` 等任何宿主机绝对路径。\n\
         ⚠️ 如果你之前传过 `/tmp/workspace/...`，那是早期容器约定，已迁移到工作目录内，\
         请改用相对路径或 `/workspace/...` 重新写入。",
        raw = raw_path,
        full = normalized.display(),
        wd = workdir_norm.display()
    )))
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

/// （2026-04 技术栈解耦）锁定文件白名单已全面解封，Agent 可自由修改 package.json / vite.config.ts /
/// src/main.ts 等底座文件。"不动底座"改为 prompt 层的软约束（写在 `_common` 和 `scaffold-from-scratch`
/// skill 里），不再由工具层硬拒。
///
/// 函数保留（永远返回 false）只是为避免外部调用方在过渡期拿到 compile error；Phase 4 收敛时会彻底移除。
#[allow(dead_code)]
fn is_locked_scaffold_file(_path: &str) -> bool {
    false
}

/// 2026-04-25：拦截 uni-app 项目中已知会导致 dev 启动报错的"幻觉 import"。
///
/// 触发场景：
/// 1. `import { uni } from '@dcloudio/uni-app'`
///    - `@dcloudio/uni-app` 包**没有** `uni` 命名导出，`uni` 是 H5 runtime 全局对象，直接用即可
///    - 实测踩坑：task #88 / #91 / #93 都跌过同一个 SyntaxError: does not provide an export named 'uni'
///    - SKILL.md 第 5 条早就写明「禁止」但 LLM 仍重复违反，必须代码层硬拦截
///
/// 2. `import { UniApp } from '@dcloudio/types'`（或类似命名导入）
///    - `@dcloudio/types` 用 `namespace UniApp` 暴露类型，必须 `/// <reference types="@dcloudio/types" />`
///      或不显式引用（在 tsconfig 的 types 数组里）；命名 import 编译期会报 ts(2305)
///
/// 拦截范围：.ts / .vue / .js / .mjs / .tsx 文件
fn validate_uniapp_imports(path: &str, content: &str) -> Result<(), ToolError> {
    let is_code = path.ends_with(".ts")
        || path.ends_with(".tsx")
        || path.ends_with(".js")
        || path.ends_with(".mjs")
        || path.ends_with(".vue");
    if !is_code {
        return Ok(());
    }

    // 模式 1：import 子句包含裸 `uni`（不是 `uniApp` 这种）来自 @dcloudio/uni-app
    // 用 regex 模糊匹配各种空白 / 组合形态：
    //   import { uni } from '@dcloudio/uni-app'
    //   import { uni, foo } from "@dcloudio/uni-app"
    //   import {uni} from '@dcloudio/uni-app'
    let re_uni = regex::Regex::new(
        r#"import\s*\{[^}]*\buni\b[^}]*\}\s*from\s*['"]@dcloudio/uni-app['"]"#,
    )
    .expect("regex");
    if re_uni.is_match(content) {
        return Err(ToolError::new(format!(
            "❌ 文件 {path} 里包含 `import {{ uni }} from '@dcloudio/uni-app'` —— 这是 uni-app **#1 高频陷阱**：\n\n\
             - `@dcloudio/uni-app` 包**没有** `uni` 命名导出。`uni` 是 uni-app H5 runtime 注入的**全局对象**，**直接用即可**：\n\
                 ✅ `uni.request({{...}})`  `uni.navigateTo({{...}})`  `uni.showToast({{...}})`\n\
                 ❌ `import {{ uni }} from '@dcloudio/uni-app'` → 浏览器报 SyntaxError，dev 起来但页面白屏\n\n\
             - 如果 TypeScript 报 `Cannot find name 'uni'`，在文件顶部加一行三斜线引用：\n\
                 `/// <reference types=\"@dcloudio/types\" />`\n\n\
             - `@dcloudio/uni-app` 包**只**导出生命周期 composable（onLoad / onShow / onPullDownRefresh / onReachBottom 等），**不**导出 uni。\n\n\
             请把这行 import **删掉**，直接调用 `uni.xxx`，再重写文件。"
        )));
    }

    // 模式 2：从 @dcloudio/types 做命名 import（types 包用 namespace，不能命名 import）
    let re_types = regex::Regex::new(
        r#"import\s*\{[^}]*\}\s*from\s*['"]@dcloudio/types['"]"#,
    )
    .expect("regex");
    if re_types.is_match(content) {
        return Err(ToolError::new(format!(
            "❌ 文件 {path} 里包含从 `@dcloudio/types` 的命名 import —— 这个包用 `namespace` 暴露类型，**不能**命名 import：\n\n\
             - 错误写法：`import {{ UniApp }} from '@dcloudio/types'` → ts(2305) Module has no exported member\n\
             - 正确做法 1（推荐）：在文件顶部加三斜线引用 `/// <reference types=\"@dcloudio/types\" />`，之后类型直接用 `UniApp.RequestOptions` 等\n\
             - 正确做法 2：在 `tsconfig.json` 的 `compilerOptions.types` 数组里加 `\"@dcloudio/types\"`，全局生效\n\n\
             请把这行命名 import **删掉**，按上面任一方式引用类型，再重写文件。"
        )));
    }

    Ok(())
}

/// 2026-04-25：种子模板提供的"底座关键文件"——LLM 通常应该用 `edit_file` 精确改，
/// 而不是 `write_file` 整文件覆盖。整个覆盖时极易丢掉模板里的拦截器、类型定义、
/// runtime 初始化等关键逻辑（task #92/#93 实锤：LLM 整覆盖 src/api/client.ts 把
/// axios 拦截器扔了，还顺手写了 `import {{ uni }} from '@dcloudio/uni-app'` 高频陷阱）。
///
/// 策略：
/// - 列表里的路径，如果**已经存在**，则拒绝 write_file（要求改用 edit_file）
/// - 不在列表里 / 列表里但首次创建（不存在）→ 放行
fn is_protected_scaffold_file(path: &str) -> bool {
    // 规范化：去前导 ./ 或 /，跟 LLM 传入路径打平
    let normalized = path.trim_start_matches('/').trim_start_matches("./");
    matches!(
        normalized,
        // uni-app 底座
        "src/main.ts"
        | "src/App.vue"
        | "src/manifest.json"
        | "src/uni.scss"
        // API 层（脚手架已提供 axios + 拦截器实现）
        | "src/api/client.ts"
        | "src/api/http.ts"
        | "src/api/index.ts"
        // 构建工具
        | "vite.config.ts"
        | "tsconfig.json"
        | "package.json"
        | "pnpm-lock.yaml"
        | "index.html"
        | ".npmrc"
    )
}

fn execute_write_file(workdir: &std::path::Path, input: &str) -> Result<String, ToolError> {
    let write_input: serde_json::Value = serde_json::from_str(input)
        .map_err(|e| ToolError::new(format!("Invalid write_file input JSON: {}", e)))?;

    let path = write_input
        .get("path")
        .and_then(|v| v.as_str())
        .ok_or_else(|| ToolError::new("Missing 'path' field in write_file input"))?;

    // 2026-04：底座文件硬锁已解封，由 prompt/Skills 层软约束引导 Agent。
    let content = write_input
        .get("content")
        .and_then(|v| v.as_str())
        .ok_or_else(|| ToolError::new("Missing 'content' field in write_file input"))?;

    // Wot UI 组件存在性预检（防止 Agent hallucinate 不存在的组件名导致 easycom 运行时 import 失败）
    validate_wot_components(workdir, path, content)?;
    // uni-app 高频陷阱预检（import { uni } / 命名 import @dcloudio/types 等）
    validate_uniapp_imports(path, content)?;

    let full_path = normalize_path(workdir, path);

    // task #100 防御：写入路径必须落在 workdir 内。挡住任何"奇葩绝对路径"
    // 让 LLM 立刻收到清晰的错误信息（说明该用相对路径 / `/workspace/...`）。
    enforce_within_workdir(workdir, &full_path, path)?;

    // 底座关键文件保护：已存在 + 在保护清单 → 拒绝整覆盖（强制走 edit_file）
    if is_protected_scaffold_file(path) && full_path.exists() {
        return Err(ToolError::new(format!(
            "❌ 拒绝 write_file 整文件覆盖底座关键文件 `{path}`。\n\n\
             这个文件是脚手架的「底座」——种子里已经实现了关键逻辑（如 axios 拦截器、runtime 初始化、构建配置等）。\n\
             整覆盖会把这些一并丢掉，task #92/#93 已经为此栽过：LLM 整覆盖 client.ts 后，axios 拦截器没了，还顺手写了 `import {{ uni }}` 触发 SyntaxError。\n\n\
             正确姿势：\n\
             1. 先 `read_file {{path: \"{path}\"}}` 看清楚当前实现\n\
             2. 用 `edit_file {{path, old_text, new_text}}` 做精确局部替换，**保留**已有的拦截器/类型/接口\n\
             3. 如果你确认要从零重写底座，先 `bash: rm <文件>`（极少见，且应该有充足理由）"
        )));
    }

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

    // 2026-04：底座文件硬锁已解封，由 prompt/Skills 层软约束引导 Agent。
    let old_text = edit_input
        .get("old_text")
        .and_then(|v| v.as_str())
        .ok_or_else(|| ToolError::new("Missing 'old_text' field in edit_file input"))?;

    let new_text = edit_input
        .get("new_text")
        .and_then(|v| v.as_str())
        .ok_or_else(|| ToolError::new("Missing 'new_text' field in edit_file input"))?;

    let full_path = normalize_path(workdir, path);

    // task #100 防御：编辑路径必须落在 workdir 内（同 write_file）
    enforce_within_workdir(workdir, &full_path, path)?;

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
    // uni-app 高频陷阱预检（同上）
    validate_uniapp_imports(path, &content)?;

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

    // ─────────────────────── normalize_path / enforce_within_workdir ───────────────────────
    // task #100 防御回归：LLM 给文件工具传了 `/tmp/workspace/...`，
    // 老版本归一化把它当"其他绝对路径"放行，写到了宿主机 /tmp 里、
    // dev server 跑的还是脚手架原版。下面 6 个 case 锁住这条路。

    #[test]
    fn normalize_strips_tmp_workspace_prefix() {
        let wd = std::path::PathBuf::from("/var/amis-ai/workdirs/task-100");
        assert_eq!(
            normalize_path(&wd, "/tmp/workspace/src/pages/index/index.vue"),
            wd.join("src/pages/index/index.vue")
        );
        assert_eq!(normalize_path(&wd, "/tmp/workspace"), wd);
    }

    #[test]
    fn normalize_strips_workspace_prefix_unchanged() {
        // 回归：老的 `/workspace/` 行为没被改掉
        let wd = std::path::PathBuf::from("/var/amis-ai/workdirs/task-100");
        assert_eq!(
            normalize_path(&wd, "/workspace/src/main.ts"),
            wd.join("src/main.ts")
        );
    }

    #[test]
    fn enforce_within_workdir_accepts_relative() {
        let wd = std::path::PathBuf::from("/var/amis-ai/workdirs/task-100");
        let full = normalize_path(&wd, "src/pages/foo/index.vue");
        assert!(enforce_within_workdir(&wd, &full, "src/pages/foo/index.vue").is_ok());
    }

    #[test]
    fn enforce_within_workdir_accepts_workspace_alias() {
        let wd = std::path::PathBuf::from("/var/amis-ai/workdirs/task-100");
        let full = normalize_path(&wd, "/workspace/src/main.ts");
        assert!(enforce_within_workdir(&wd, &full, "/workspace/src/main.ts").is_ok());
    }

    #[test]
    fn enforce_within_workdir_accepts_tmp_workspace_alias() {
        // task #100 现场：旧前缀经 normalize 拍平后，必须能落在 workdir 内放行
        let wd = std::path::PathBuf::from("/var/amis-ai/workdirs/task-100");
        let raw = "/tmp/workspace/src/pages/profile/index.vue";
        let full = normalize_path(&wd, raw);
        assert!(enforce_within_workdir(&wd, &full, raw).is_ok());
    }

    #[test]
    fn enforce_within_workdir_rejects_host_absolute() {
        let wd = std::path::PathBuf::from("/var/amis-ai/workdirs/task-100");
        // normalize 不识别这种前缀 → 原样保留 → enforce 拦截
        let raw = "/tmp/foo/bar.txt";
        let full = normalize_path(&wd, raw);
        let err = enforce_within_workdir(&wd, &full, raw).unwrap_err();
        let msg = format!("{}", err);
        assert!(msg.contains("路径越界"), "unexpected: {msg}");
        assert!(msg.contains("相对路径"), "should hint relative path: {msg}");
    }

    #[test]
    fn dev_start_preflight_rejects_unchanged_workdir() {
        // 模拟 task #100：workdir 里只有"早就存在"的脚手架文件，没新内容
        let temp = tempfile::tempdir().expect("temp");
        let f = temp.path().join("src/pages/index/index.vue");
        std::fs::create_dir_all(f.parent().unwrap()).unwrap();
        std::fs::write(&f, "scaffold").unwrap();

        // task_started_at 设到未来 → 现有所有文件 mtime 都早于它
        let task_started_at = SystemTime::now() + std::time::Duration::from_secs(60);
        let result = dev_start_preflight(temp.path(), task_started_at);
        assert!(result.is_err(), "should reject unchanged workdir");
        let msg = format!("{}", result.unwrap_err());
        assert!(
            msg.contains("dev_start 前置检查失败"),
            "unexpected: {msg}"
        );
        assert!(msg.contains("相对路径"), "should hint fix: {msg}");
    }

    #[test]
    fn dev_start_preflight_accepts_workdir_with_recent_file() {
        let temp = tempfile::tempdir().expect("temp");
        // task_started_at 设到 60s 前
        let task_started_at = SystemTime::now() - std::time::Duration::from_secs(60);
        // 现在创建文件 → mtime ≈ now > task_started_at
        let f = temp.path().join("src/pages/profile/index.vue");
        std::fs::create_dir_all(f.parent().unwrap()).unwrap();
        std::fs::write(&f, "fresh").unwrap();
        assert!(dev_start_preflight(temp.path(), task_started_at).is_ok());
    }

    #[test]
    fn enforce_within_workdir_rejects_parent_traversal() {
        let wd = std::path::PathBuf::from("/var/amis-ai/workdirs/task-100");
        // 相对路径 + .. 越界
        let raw = "../../../etc/passwd";
        let full = normalize_path(&wd, raw);
        let err = enforce_within_workdir(&wd, &full, raw).unwrap_err();
        assert!(format!("{}", err).contains("路径越界"));
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
