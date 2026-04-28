use crate::permission_prompter::PermissionDecisionPayload;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::{mpsc as std_mpsc, Arc};
use tokio::sync::{broadcast, mpsc};

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
    /// 用户追加 / 发起的消息。在 run_turn 之前 broadcast，
    /// 以便前端 WS 实时流 + events 历史回放都能看到自己刚输入的话。
    #[serde(rename = "user_message")]
    UserMessage(String),
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
    /// Skills 加载完成（任务启动初期一次性发送）。
    /// 用于"执行详情"面板展示本次任务注入了哪些 skill 桶。
    #[serde(rename = "skills_loaded")]
    SkillsLoaded {
        selected_buckets: Vec<SkillBucketInfoLite>,
        skills_root: String,
        extra_sections_count: usize,
        total_sections: usize,
    },
    /// 完整 system prompt 构建完成（任务启动初期一次性发送）。
    /// `prompt_full` 仅在 WS/DB 留档供管理员审计，前端普通用户可以只看预览。
    #[serde(rename = "system_prompt_built")]
    SystemPromptBuilt {
        prompt_length: usize,
        prompt_sha256: String,
        prompt_preview: String,
        prompt_full: String,
    },
    /// 2026-04-25 tracelog 专用：每轮 LLM 调用结束时一次性发送，含完整入参 + 响应。
    /// backend 的 tracelog::route_event 会把它路由到 task-{id}/llm_calls/call-NNN.json。
    /// **不**进入 broadcast text-delta 流（只在归档落盘）；前端可选展示。
    #[serde(rename = "llm_call_snapshot")]
    LlmCallSnapshot {
        call_seq: u32,
        model: String,
        request_messages: Vec<serde_json::Value>,
        response_events: Vec<serde_json::Value>,
        elapsed_ms: u64,
        success: bool,
    },
    /// 2026-04-25 tracelog 专用：注入到 prompt 的 SKILL.md / references 全文快照。
    /// 仅在启动期一次性发，体积大，由 backend tracelog 路由到 task-{id}/skills_snapshot/。
    #[serde(rename = "skills_content_snapshot")]
    SkillsContentSnapshot {
        contents: Vec<SkillBucketContent>,
    },
}

/// SkillsContentSnapshot 的单个桶内容
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct SkillBucketContent {
    pub bucket: String,
    pub files: Vec<SkillFileContent>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct SkillFileContent {
    /// 桶内相对路径，如 "SKILL.md" / "references/api-adapter.md"
    pub path: String,
    pub content: String,
}

/// skills_loaded 事件 payload 里每个桶的摘要信息。
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct SkillBucketInfoLite {
    pub name: String,
    pub dir_name: String,
    pub priority: i32,
    pub kind: Option<String>,
    pub description: Option<String>,
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
    /// 一次性"启动期事件"缓存：skills_loaded / system_prompt_built 等在 WS 订阅建立前就发出的事件，
    /// tokio::broadcast 在 0 订阅者时会丢消息，所以把它们额外存一份 —— WS handler 订阅时先 replay 这些，
    /// 然后再进入流式 broadcast 循环。只存一次性事件（不存 text_delta 这种洪流）。
    ///
    /// 用 std::sync::Mutex 而非 tokio::sync 版本：task_loop 在 blocking thread 里写入，
    /// ws.rs 在 async 里读一次（clone 后释放锁）—— std::Mutex 在两边都能用且锁时间极短。
    pub initial_events: Arc<std::sync::Mutex<Vec<TaskEvent>>>,
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
