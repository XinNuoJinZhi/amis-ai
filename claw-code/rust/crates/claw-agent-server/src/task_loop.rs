use crate::api_bridge::ProviderRuntimeClient;
use crate::sandbox_client::SandboxClient;
use crate::state::{TaskEvent, TaskStatus};
use crate::tool_executor::SandboxToolExecutor;
use api::ProviderClient;
use runtime::{ConversationRuntime, PermissionMode, PermissionPolicy, Session};
use std::path::PathBuf;
use tokio::sync::{broadcast, mpsc};

pub struct LlmConfig {
    pub base_url: Option<String>,
    pub api_key: Option<String>,
    pub model: String,
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
    pub event_tx: broadcast::Sender<TaskEvent>,
    pub msg_rx: mpsc::Receiver<String>,
}

/// 注入 LLM 配置到环境变量，并返回 claw-code 能识别的 effective model 名
/// 策略：只有 claude-* 走 Anthropic，其他全部走 OpenAI 兼容（大多数自建/国产模型都兼容 OpenAI API）
fn apply_llm_config_to_env(config: &LlmConfig) -> String {
    let model_lower = config.model.to_lowercase();

    if model_lower.starts_with("claude-") {
        if let Some(key) = &config.api_key {
            std::env::set_var("ANTHROPIC_API_KEY", key);
        }
        if let Some(url) = &config.base_url {
            std::env::set_var("ANTHROPIC_BASE_URL", url);
        }
        tracing::info!(
            "LLM config applied as Anthropic: model={}, base_url={:?}",
            config.model,
            config.base_url
        );
        config.model.clone()
    } else {
        // 默认走 OpenAI 兼容路径（Ollama/DeepSeek/通义千问/DashScope/LiteLLM 等）
        if let Some(key) = &config.api_key {
            std::env::set_var("OPENAI_API_KEY", key);
        }
        if let Some(url) = &config.base_url {
            std::env::set_var("OPENAI_BASE_URL", url);
        }

        // 如果 model 不以 claw-code 能识别的前缀开头，加上 "openai/" 前缀让路由生效
        let effective_model = if model_lower.starts_with("gpt-")
            || model_lower.starts_with("openai/")
            || model_lower.starts_with("grok-")
        {
            config.model.clone()
        } else {
            format!("openai/{}", config.model)
        };

        tracing::info!(
            "LLM config applied as OpenAI-compat: original_model={}, effective_model={}, base_url={:?}",
            config.model,
            effective_model,
            config.base_url
        );
        effective_model
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
        event_tx,
        msg_rx,
    } = config;

    // 如果调用方传入了 LLM 配置，注入对应的 env var 并返回 claw-code 能识别的 model 名
    let effective_model = if let Some(cfg) = &llm_config {
        apply_llm_config_to_env(cfg)
    } else {
        model
    };

    let _ = event_tx.send(TaskEvent::StatusChange(TaskStatus::Running));

    // 把整个 ConversationRuntime 循环跑在一个 blocking thread 上
    // 用 msg_rx.blocking_recv() 同步接收追加消息
    let event_tx_outer = event_tx.clone();
    let handle = tokio::task::spawn_blocking(move || -> anyhow::Result<()> {
        let workdir_path = PathBuf::from(&workdir);
        let sandbox = SandboxClient::new(sandbox_url);

        let session = Session::new().with_workspace_root(workdir_path.clone());

        let provider = ProviderClient::from_model(&effective_model)
            .map_err(|e| anyhow::anyhow!("Failed to init provider: {}", e))?;

        let api_client = ProviderRuntimeClient::new(provider, effective_model, event_tx.clone())
            .map_err(|e| anyhow::anyhow!("Failed to init API client: {}", e))?;

        let tool_executor = SandboxToolExecutor::new(sandbox, sandbox_id, workdir_path);

        let policy = PermissionPolicy::new(PermissionMode::WorkspaceWrite);

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

        // 根据 tech_stack 加载对应的 Skills bundle
        let skills_root = crate::skills::default_skills_root();
        let skill_sections = crate::skills::load_skills_bundle(&skills_root, &tech_stack);
        let skill_count = skill_sections.len();
        system_prompt.extend(skill_sections);

        tracing::info!(
            "Task {} loaded {} skill sections for tech_stack: {}",
            task_id,
            skill_count,
            tech_stack
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
            .run_turn(initial_message, None)
            .map_err(|e| anyhow::anyhow!("initial run_turn failed: {}", e))?;
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
            match runtime.run_turn(msg, None) {
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
