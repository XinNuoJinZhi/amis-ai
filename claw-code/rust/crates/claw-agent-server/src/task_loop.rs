use crate::api_bridge::ProviderRuntimeClient;
use crate::sandbox_client::SandboxClient;
use crate::state::{TaskEvent, TaskStatus};
use crate::tool_executor::SandboxToolExecutor;
use api::ProviderClient;
use runtime::{ConversationRuntime, PermissionMode, PermissionPolicy, Session};
use std::path::PathBuf;
use tokio::sync::{broadcast, mpsc};

pub struct TaskLoopConfig {
    pub task_id: String,
    pub initial_message: String,
    pub workdir: String,
    pub sandbox_id: String,
    pub model: String,
    pub sandbox_url: String,
    pub tech_stack: String,
    pub event_tx: broadcast::Sender<TaskEvent>,
    pub msg_rx: mpsc::Receiver<String>,
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
        event_tx,
        msg_rx,
    } = config;

    let _ = event_tx.send(TaskEvent::StatusChange(TaskStatus::Running));

    // 把整个 ConversationRuntime 循环跑在一个 blocking thread 上
    // 用 msg_rx.blocking_recv() 同步接收追加消息
    let event_tx_outer = event_tx.clone();
    let handle = tokio::task::spawn_blocking(move || -> anyhow::Result<()> {
        let workdir_path = PathBuf::from(&workdir);
        let sandbox = SandboxClient::new(sandbox_url);

        let session = Session::new().with_workspace_root(workdir_path.clone());

        let provider = ProviderClient::from_model(&model)
            .map_err(|e| anyhow::anyhow!("Failed to init provider: {}", e))?;

        let api_client = ProviderRuntimeClient::new(provider, model, event_tx.clone())
            .map_err(|e| anyhow::anyhow!("Failed to init API client: {}", e))?;

        let tool_executor = SandboxToolExecutor::new(sandbox, sandbox_id, workdir_path);

        let policy = PermissionPolicy::new(PermissionMode::WorkspaceWrite);

        // 基础 prompt：身份、工作目录、工具使用原则
        let mut system_prompt = vec![format!(
            "你是 amis-ai 的反向代码生成智能体。工作目录: {}\n\
             技术栈: {}\n\n\
             ## 工作原则\n\
             1. 先用 `bash: ls -la` 确认种子项目结构\n\
             2. 严格遵循下方 Skills 文档里的规则\n\
             3. 使用 read_file/write_file/edit_file 工具操作文件\n\
             4. 使用 bash 工具执行 shell 命令（如 pnpm install、git 操作）\n\
             5. 完成编码后，主动调 `bash: pnpm run dev:h5` 验证能启动\n\
             6. 启动失败时读 Vite 错误日志，定位后修复，最多 5 次自修复",
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
