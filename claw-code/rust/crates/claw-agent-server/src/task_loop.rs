use crate::api_bridge::ProviderRuntimeClient;
use crate::sandbox_client::SandboxClient;
use crate::state::{TaskEvent, TaskStatus};
use crate::tool_executor::SandboxToolExecutor;
use api::ProviderClient;
use runtime::{
    ConversationRuntime, PermissionMode, PermissionPolicy, Session,
};
use std::path::PathBuf;
use tokio::sync::{broadcast, mpsc};

pub struct TaskLoopConfig {
    pub task_id: String,
    pub initial_message: String,
    pub workdir: String,
    pub sandbox_id: String,
    pub model: String,
    pub sandbox_url: String,
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
        event_tx,
        mut msg_rx,
    } = config;

    let _ = event_tx.send(TaskEvent::StatusChange(TaskStatus::Running));

    let workdir_path = PathBuf::from(&workdir);
    let sandbox = SandboxClient::new(sandbox_url);

    let event_tx_clone = event_tx.clone();
    let workdir_for_run = workdir_path.clone();
    let sandbox_for_run = sandbox.clone();
    let sandbox_id_for_run = sandbox_id.clone();
    let model_for_run = model.clone();
    let initial_msg = initial_message.clone();

    let result = tokio::task::spawn_blocking(move || -> anyhow::Result<()> {
        let session = Session::new().with_workspace_root(workdir_for_run.clone());

        let provider = ProviderClient::from_model(&model_for_run)
            .map_err(|e| anyhow::anyhow!("Failed to init provider: {}", e))?;

        let api_client = ProviderRuntimeClient::new(provider, model_for_run, event_tx_clone.clone())
            .map_err(|e| anyhow::anyhow!("Failed to init API client: {}", e))?;

        let tool_executor =
            SandboxToolExecutor::new(sandbox_for_run, sandbox_id_for_run, workdir_for_run);

        let policy = PermissionPolicy::new(PermissionMode::WorkspaceWrite);

        let system_prompt = vec![format!(
            "You are an AI coding agent working in directory: {}. Use tools to read, write, and run commands.",
            workdir
        )];

        let mut runtime = ConversationRuntime::new(
            session,
            api_client,
            tool_executor,
            policy,
            system_prompt,
        );

        let summary = runtime
            .run_turn(initial_msg, None)
            .map_err(|e| anyhow::anyhow!("run_turn failed: {}", e))?;

        tracing::info!(
            "Task {} first turn completed: {} iterations",
            task_id,
            summary.iterations
        );

        Ok(())
    })
    .await;

    match result {
        Ok(Ok(())) => {
            let _ = event_tx.send(TaskEvent::TurnComplete);
            let _ = event_tx.send(TaskEvent::StatusChange(TaskStatus::Succeeded));
        }
        Ok(Err(e)) => {
            tracing::error!("Task execution error: {}", e);
            let _ = event_tx.send(TaskEvent::StatusChange(TaskStatus::Failed));
        }
        Err(e) => {
            tracing::error!("Task spawn error: {}", e);
            let _ = event_tx.send(TaskEvent::StatusChange(TaskStatus::Failed));
        }
    }

    // 等待后续消息（简化版本，后续迭代可以支持消息追加）
    while let Some(msg) = msg_rx.recv().await {
        tracing::info!("Received additional message: {}", msg);
        // TODO: 复用 ConversationRuntime 跑新 turn
    }

    Ok(())
}
