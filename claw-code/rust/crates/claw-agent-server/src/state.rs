use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
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
}

pub struct AgentTask {
    pub id: String,
    pub status: TaskStatus,
    pub workdir: String,
    pub sandbox_id: Option<String>,
    pub tx: broadcast::Sender<TaskEvent>,
    pub msg_tx: mpsc::Sender<String>,
    pub created_at: DateTime<Utc>,
}

impl AgentTask {
    pub fn new(workdir: String, sandbox_id: Option<String>) -> Self {
        let (tx, _) = broadcast::channel(100);
        let (msg_tx, _) = mpsc::channel(50);

        Self {
            id: Uuid::new_v4().to_string(),
            status: TaskStatus::Pending,
            workdir,
            sandbox_id,
            tx,
            msg_tx,
            created_at: Utc::now(),
        }
    }
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

    #[test]
    fn test_agent_task_creation() {
        let task = AgentTask::new("/tmp/workdir".to_string(), Some("sandbox123".to_string()));
        assert_eq!(task.status, TaskStatus::Pending);
        assert_eq!(task.workdir, "/tmp/workdir");
        assert_eq!(task.sandbox_id, Some("sandbox123".to_string()));
    }
}
