use crate::api_bridge::ProviderRuntimeClient;
use crate::permission_prompter::{PermissionDecisionPayload, WebSocketPermissionPrompter};
use crate::sandbox_client::SandboxClient;
use crate::state::{TaskEvent, TaskStatus};
use crate::tool_executor::SandboxToolExecutor;
use api::ProviderClient;
use runtime::{ConversationRuntime, PermissionMode, PermissionPolicy, Session};
use std::path::PathBuf;
use std::sync::mpsc as std_mpsc;
use tokio::sync::{broadcast, mpsc};

pub struct LlmConfig {
    pub base_url: Option<String>,
    pub api_key: Option<String>,
    pub model: String,
    /// 协议类型：openai（OpenAI Chat Completions 兼容）/ anthropic（Anthropic Messages API）。
    /// 由用户在供应商管理 UI 显式指定，不再靠模型名前缀猜测。
    pub protocol: String,
}

/// 任务级权限配置
pub struct PermissionConfig {
    pub mode: PermissionMode,
    /// 工具白名单；None = 全开
    pub allowed_tools: Option<Vec<String>>,
}

impl Default for PermissionConfig {
    fn default() -> Self {
        Self {
            mode: PermissionMode::DangerFullAccess,
            allowed_tools: None,
        }
    }
}

/// 解析字符串到 PermissionMode（前端传过来的）
pub fn parse_permission_mode(s: &str) -> Option<PermissionMode> {
    match s {
        "read_only" | "read-only" => Some(PermissionMode::ReadOnly),
        "workspace_write" | "workspace-write" => Some(PermissionMode::WorkspaceWrite),
        "danger_full_access" | "danger-full-access" => Some(PermissionMode::DangerFullAccess),
        "prompt" => Some(PermissionMode::Prompt),
        "allow" => Some(PermissionMode::Allow),
        _ => None,
    }
}

pub struct TaskLoopConfig {
    pub task_id: String,
    pub initial_message: String,
    pub workdir: String,
    pub sandbox_id: String,
    pub model: String,
    pub sandbox_url: String,
    pub tech_stack: String,
    pub llm_config: Option<LlmConfig>,
    pub permission_config: PermissionConfig,
    pub decision_rx: std_mpsc::Receiver<PermissionDecisionPayload>,
    pub event_tx: broadcast::Sender<TaskEvent>,
    pub msg_rx: mpsc::Receiver<String>,
    /// B.5：额外注入到 system_prompt 的段（最常见用途：backend 拼好的 RAG Top-K 样例）。
    /// 这些段会在 Skills 索引之后追加。空 vec 表示不注入。
    pub extra_system_sections: Vec<String>,
}

/// 决定走哪条后端路径
pub enum BackendKind {
    /// Anthropic 协议，走 claw-code 的 api crate
    Anthropic,
    /// OpenAI 兼容协议（Ollama / DeepSeek / 通义千问 / DashScope / OpenAI），走我们自己的解析器
    OpenAiCompat {
        base_url: String,
        api_key: Option<String>,
        temperature: Option<f32>,
        max_tokens: Option<u32>,
    },
}

/// 根据 llm_config 的 protocol 字段决定走哪条后端路径。
/// 不再使用模型名前缀判断，协议完全由用户在供应商配置里显式指定。
/// 返回 (backend_kind, effective_model_name)。
fn decide_backend(default_model: &str, config: Option<&LlmConfig>) -> (BackendKind, String) {
    // 没有 llm_config → 走 Anthropic 默认路径（依赖 ANTHROPIC_API_KEY 环境变量）
    let Some(cfg) = config else {
        return (BackendKind::Anthropic, default_model.to_string());
    };

    match cfg.protocol.as_str() {
        "anthropic" => {
            if let Some(key) = &cfg.api_key {
                std::env::set_var("ANTHROPIC_API_KEY", key);
            }
            if let Some(url) = &cfg.base_url {
                // claw-code 的 AnthropicClient 会自己拼 `/v1/messages`，
                // 所以这里去掉用户可能误带的 `/v1` 后缀，避免出现 `/v1/v1/messages`
                let normalized = url.trim_end_matches('/').trim_end_matches("/v1");
                std::env::set_var("ANTHROPIC_BASE_URL", normalized);
                tracing::info!(
                    "Backend: Anthropic, model={}, base_url={} (normalized from {})",
                    cfg.model,
                    normalized,
                    url
                );
            } else {
                tracing::info!("Backend: Anthropic, model={} (no base_url override)", cfg.model);
            }
            (BackendKind::Anthropic, cfg.model.clone())
        }
        // 默认走 OpenAI 兼容路径（包括 openai、未知值、空值）
        _ => {
            let base_url = cfg
                .base_url
                .clone()
                .unwrap_or_else(|| "https://api.openai.com/v1".to_string());

            tracing::info!(
                "Backend: OpenAI-compat (protocol={}), model={}, base_url={}",
                cfg.protocol,
                cfg.model,
                base_url
            );

            (
                BackendKind::OpenAiCompat {
                    base_url,
                    api_key: cfg.api_key.clone(),
                    temperature: None, // 后续可从 cfg 传入
                    max_tokens: None,
                },
                cfg.model.clone(),
            )
        }
    }
}

pub fn spawn_task_loop(config: TaskLoopConfig) {
    tokio::spawn(async move {
        if let Err(e) = run_task_loop(config).await {
            tracing::error!("Task loop failed: {}", e);
        }
    });
}

async fn run_task_loop(config: TaskLoopConfig) -> anyhow::Result<()> {
    let TaskLoopConfig {
        task_id,
        initial_message,
        workdir,
        sandbox_id,
        model,
        sandbox_url,
        tech_stack,
        llm_config,
        permission_config,
        decision_rx,
        event_tx,
        msg_rx,
        extra_system_sections,
    } = config;

    // 根据 llm_config 决定走哪条后端路径：
    // - 有 llm_config 且 model 不是 claude-* → OpenAI 兼容（我们自己的解析器，支持 reasoning）
    // - 其他 → Anthropic（claw-code api crate）
    let (backend_kind, effective_model) = decide_backend(&model, llm_config.as_ref());

    let _ = event_tx.send(TaskEvent::StatusChange(TaskStatus::Running));

    // 把整个 ConversationRuntime 循环跑在一个 blocking thread 上
    // 用 msg_rx.blocking_recv() 同步接收追加消息
    let event_tx_outer = event_tx.clone();
    let handle = tokio::task::spawn_blocking(move || -> anyhow::Result<()> {
        let workdir_path = PathBuf::from(&workdir);
        let sandbox = SandboxClient::new(sandbox_url);

        let session = Session::new().with_workspace_root(workdir_path.clone());

        let api_client = match backend_kind {
            BackendKind::OpenAiCompat {
                base_url,
                api_key,
                temperature,
                max_tokens,
            } => ProviderRuntimeClient::new_openai_compat(
                base_url,
                api_key,
                effective_model.clone(),
                temperature,
                max_tokens,
                event_tx.clone(),
            ),
            BackendKind::Anthropic => {
                let provider = ProviderClient::from_model(&effective_model)
                    .map_err(|e| anyhow::anyhow!("Failed to init provider: {}", e))?;
                ProviderRuntimeClient::new_anthropic(provider, effective_model.clone(), event_tx.clone())
            }
        };

        let tool_executor = SandboxToolExecutor::new(sandbox, sandbox_id, workdir_path, event_tx.clone());

        // 用前端传来的权限配置构造 PermissionPolicy
        // 如果指定了工具白名单，通过 with_tool_requirement 对每个工具设定最低权限要求
        let mut policy = PermissionPolicy::new(permission_config.mode);
        if let Some(allowed) = &permission_config.allowed_tools {
            // 工具 → 最低权限的内置映射（与 claw-code mvp_tool_specs 一致）
            let tool_reqs: &[(&str, PermissionMode)] = &[
                ("bash", PermissionMode::DangerFullAccess),
                ("read_file", PermissionMode::ReadOnly),
                ("write_file", PermissionMode::WorkspaceWrite),
                ("edit_file", PermissionMode::WorkspaceWrite),
                ("glob_search", PermissionMode::ReadOnly),
                ("grep_search", PermissionMode::ReadOnly),
            ];
            for (name, required) in tool_reqs {
                if allowed.iter().any(|t| t == name) {
                    policy = policy.with_tool_requirement(*name, *required);
                }
            }
        }

        // 根据模式决定是否创建 WebSocketPermissionPrompter
        // DangerFullAccess 和 Allow 模式下不会触发审批，不需要 prompter
        let mut prompter: Option<WebSocketPermissionPrompter> =
            if matches!(permission_config.mode, PermissionMode::DangerFullAccess | PermissionMode::Allow) {
                None
            } else {
                Some(WebSocketPermissionPrompter::new(event_tx.clone(), decision_rx))
            };

        // 基础 prompt：身份、工作目录、工具使用原则（强调"只输出工具调用"的纪律）
        let mut system_prompt = vec![format!(
            "你是 amis-ai 的反向代码生成智能体。工作目录: {}\n\
             技术栈: {}\n\n\
             ## 🔥 最重要：你必须通过工具调用完成任务，禁止只输出计划文字\n\n\
             你**必须**使用以下工具来完成每一步工作：\n\
             - `bash` 执行 shell 命令（如 `ls -la`、`pnpm install`、`pnpm run dev:h5`）\n\
             - `read_file` 读取文件内容\n\
             - `write_file` 写入完整文件\n\
             - `edit_file` 按字符串替换修改文件\n\
             - `glob_search` 按通配符查找文件\n\
             - `grep_search` 按正则搜索内容\n\n\
             ❌ 禁止：只回复 \"我计划这样做...\" 却不调用任何工具\n\
             ❌ 禁止：编造文件内容，不通过 read_file 确认就开始修改\n\
             ✅ 要求：**每条响应至少包含一个工具调用**，除非任务已完整交付\n\n\
             ## 工作流程（严格顺序）\n\
             1. **第一步必须**调 `bash: ls -la` 看种子项目结构\n\
             2. 调 `read_file` 读种子项目的 package.json / pages.json / vite.config.ts\n\
             3. 根据下方 Skills 文档里的规则，用 write_file / edit_file 创建/修改文件\n\
             4. 调 `bash: pnpm install`（若需新依赖）\n\
             5. 调 `bash: pnpm run dev:h5` 启动验证\n\
             6. 启动失败时读 Vite 错误日志 → 定位 → 修复 → 重启（最多 5 次自修复）\n\n\
             ## 失败策略\n\
             - 工具报错时，直接看 error 字段然后调整参数重试，不要光说\"我再试试\"\n\
             - 文件找不到时先用 `glob_search` 定位，不要假设路径",
            workdir, tech_stack
        )];

        // A.4：用索引模式构建 Skills 段（progressive disclosure）。
        // L0: _common 全文 + L1: 当前 stack 全文 + L2: 其他 stack 索引 + L3: 用户日志识别协议。
        // references/ 下的详细文档由 Agent 通过 `Skill` 工具或 `Read` 按需加载。
        let skills_root = crate::skills::default_skills_root();
        let plugin_roots = crate::skills::default_plugin_roots();
        let skill_sections = crate::skills::build_skills_system_prompt(
            &skills_root,
            &plugin_roots,
            &tech_stack,
        );
        let skill_count = skill_sections.len();
        system_prompt.extend(skill_sections);

        // B.5：追加 backend 在任务创建时拼好的额外段（典型来源：RAG Top-K 样例）。
        let extra_count = extra_system_sections.len();
        system_prompt.extend(extra_system_sections);

        tracing::info!(
            "Task {} loaded {} skill sections + {} extra sections for tech_stack={} (skills_root={}, plugins={})",
            task_id,
            skill_count,
            extra_count,
            tech_stack,
            skills_root.display(),
            plugin_roots.len()
        );

        let mut runtime = ConversationRuntime::new(
            session,
            api_client,
            tool_executor,
            policy,
            system_prompt,
        );

        // 第一轮：初始消息
        tracing::info!("Task {} starting initial turn", task_id);
        let summary = runtime
            .run_turn(
                initial_message,
                prompter
                    .as_mut()
                    .map(|p| p as &mut dyn runtime::PermissionPrompter),
            )
            .map_err(|e| {
                let _ = event_tx.send(TaskEvent::ErrorMessage(format!(
                    "❌ 初始对话失败: {}",
                    e
                )));
                anyhow::anyhow!("initial run_turn failed: {}", e)
            })?;
        tracing::info!(
            "Task {} initial turn done: {} iterations",
            task_id,
            summary.iterations
        );
        let _ = event_tx.send(TaskEvent::TurnComplete);

        // 后续轮：阻塞接收追加消息，直到 channel 关闭
        let mut msg_rx = msg_rx;
        while let Some(msg) = msg_rx.blocking_recv() {
            tracing::info!("Task {} received follow-up message", task_id);
            match runtime.run_turn(
                msg,
                prompter
                    .as_mut()
                    .map(|p| p as &mut dyn runtime::PermissionPrompter),
            ) {
                Ok(summary) => {
                    tracing::info!(
                        "Task {} follow-up turn done: {} iterations",
                        task_id,
                        summary.iterations
                    );
                    let _ = event_tx.send(TaskEvent::TurnComplete);
                }
                Err(e) => {
                    tracing::error!("Task {} follow-up turn failed: {}", task_id, e);
                    let _ = event_tx.send(TaskEvent::ErrorMessage(format!(
                        "❌ 追加对话失败: {}",
                        e
                    )));
                    let _ = event_tx.send(TaskEvent::StatusChange(TaskStatus::Failed));
                    return Err(anyhow::anyhow!("follow-up turn failed: {}", e));
                }
            }
        }

        Ok(())
    });

    match handle.await {
        Ok(Ok(())) => {
            let _ = event_tx_outer.send(TaskEvent::StatusChange(TaskStatus::Succeeded));
            Ok(())
        }
        Ok(Err(e)) => {
            tracing::error!("Task execution error: {}", e);
            let _ = event_tx_outer.send(TaskEvent::StatusChange(TaskStatus::Failed));
            Err(e)
        }
        Err(e) => {
            tracing::error!("Task spawn join error: {}", e);
            let _ = event_tx_outer.send(TaskEvent::StatusChange(TaskStatus::Failed));
            Err(anyhow::anyhow!("spawn_blocking join error: {}", e))
        }
    }
}
