use crate::permission_prompter::PermissionDecisionPayload;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::{mpsc as std_mpsc, Arc};
use tokio::sync::{broadcast, mpsc};
use uuid::Uuid;

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum TaskStatus {
    Pending,
    Running,
    WaitingUser,
    Succeeded,
    Failed,
    Stopped,
}

#[derive(Clone, Debug, Serialize)]
#[serde(tag = "type", content = "data")]
pub enum TaskEvent {
    #[serde(rename = "text_delta")]
    TextDelta(String),
    #[serde(rename = "tool_use")]
    ToolUse {
        name: String,
        input: String,
    },
    #[serde(rename = "tool_result")]
    ToolResult {
        name: String,
        output: String,
        is_error: bool,
    },
    #[serde(rename = "status_change")]
    StatusChange(TaskStatus),
    #[serde(rename = "turn_complete")]
    TurnComplete,
    #[serde(rename = "permission_request")]
    PermissionRequest {
        request_id: String,
        tool: String,
        input: String,
        current_mode: String,
        required_mode: String,
        reason: Option<String>,
    },
    #[serde(rename = "llm_request_start")]
    LlmRequestStart {
        model: String,
        messages: usize,
        tools: usize,
    },
    #[serde(rename = "llm_request_end")]
    LlmRequestEnd {
        elapsed_ms: u64,
        success: bool,
    },
    #[serde(rename = "error_message")]
    ErrorMessage(String),
}

pub struct AgentTask {
    pub id: String,
    pub status: TaskStatus,
    pub workdir: String,
    pub sandbox_id: Option<String>,
    pub tx: broadcast::Sender<TaskEvent>,
    pub msg_tx: mpsc::Sender<String>,
    /// 权限审批决策 channel：HTTP handler 把前端的决策 send 到这里，
    /// PermissionPrompter 在 blocking thread 里 recv。用 std::sync::mpsc 因为 prompter 是同步 trait。
    pub decision_tx: std_mpsc::Sender<PermissionDecisionPayload>,
    pub created_at: DateTime<Utc>,
}

pub struct AppState {
    pub tasks: tokio::sync::RwLock<HashMap<String, AgentTask>>,
    pub sandbox_url: String,
    pub default_model: String,
}

pub type SharedState = Arc<AppState>;

impl AppState {
    pub fn new(sandbox_url: String, default_model: String) -> Self {
        Self {
            tasks: tokio::sync::RwLock::new(HashMap::new()),
            sandbox_url,
            default_model,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_task_status_serialization() {
        assert_eq!(serde_json::to_string(&TaskStatus::Pending).unwrap(), "\"pending\"");
        assert_eq!(serde_json::to_string(&TaskStatus::Running).unwrap(), "\"running\"");
        assert_eq!(serde_json::to_string(&TaskStatus::WaitingUser).unwrap(), "\"waiting_user\"");
        assert_eq!(serde_json::to_string(&TaskStatus::Succeeded).unwrap(), "\"succeeded\"");
        assert_eq!(serde_json::to_string(&TaskStatus::Failed).unwrap(), "\"failed\"");
        assert_eq!(serde_json::to_string(&TaskStatus::Stopped).unwrap(), "\"stopped\"");
    }

    // 注：原 test_agent_task_creation 引用了不存在的 AgentTask::new()。
    // AgentTask 字段含 broadcast::Sender / mpsc::Sender，无简单构造，
    // 实际由 task_loop / http handler 整体装配。该测试已删。
}
