//! WebSocket 驱动的 PermissionPrompter 实现。
//!
//! claw-code 的 PermissionPolicy 在需要审批时会调用 PermissionPrompter::decide()。
//! CLI 版本（CliPermissionPrompter）是从 stdin 读 y/N。
//! 我们这里把它改成：
//! - 生成 request_id，广播 TaskEvent::PermissionRequest 给前端
//! - blocking_recv 阻塞等待前端通过 HTTP 回传的决策
//! - 支持「记住本 session」工具级记忆（勾选后下次同工具直接 Allow，不再弹窗）

use crate::state::TaskEvent;
use runtime::{PermissionPromptDecision, PermissionPrompter, PermissionRequest};
use std::collections::HashSet;
use std::sync::mpsc;
use tokio::sync::broadcast;

/// 前端回传的决策 payload
#[derive(Debug, Clone)]
pub struct PermissionDecisionPayload {
    pub request_id: String,
    pub allow: bool,
    pub remember: bool,
    pub reason: Option<String>,
}

pub struct WebSocketPermissionPrompter {
    event_tx: broadcast::Sender<TaskEvent>,
    decision_rx: mpsc::Receiver<PermissionDecisionPayload>,
    /// 工具级记忆：在本 prompter 存活期间（≈一个任务的生命周期），这些工具的调用直接 Allow。
    remembered_allows: HashSet<String>,
}

impl WebSocketPermissionPrompter {
    pub fn new(
        event_tx: broadcast::Sender<TaskEvent>,
        decision_rx: mpsc::Receiver<PermissionDecisionPayload>,
    ) -> Self {
        Self {
            event_tx,
            decision_rx,
            remembered_allows: HashSet::new(),
        }
    }
}

impl PermissionPrompter for WebSocketPermissionPrompter {
    fn decide(&mut self, request: &PermissionRequest) -> PermissionPromptDecision {
        // 1. 记忆命中：本任务此前已"记住允许"过这个工具，直接 Allow
        if self.remembered_allows.contains(&request.tool_name) {
            tracing::info!(
                "permission auto-allowed (remembered) for tool: {}",
                request.tool_name
            );
            return PermissionPromptDecision::Allow;
        }

        // 2. 生成唯一 request_id
        let request_id = uuid::Uuid::new_v4().to_string();

        // 3. 广播给前端
        let _ = self.event_tx.send(TaskEvent::PermissionRequest {
            request_id: request_id.clone(),
            tool: request.tool_name.clone(),
            input: request.input.clone(),
            current_mode: request.current_mode.as_str().to_string(),
            required_mode: request.required_mode.as_str().to_string(),
            reason: request.reason.clone(),
        });

        tracing::info!(
            "permission request dispatched: id={}, tool={}",
            request_id,
            request.tool_name
        );

        // 4. 阻塞等待前端决策（在 spawn_blocking 线程里，可以安全阻塞）
        // 丢掉 ID 不匹配的旧决策（防止上一轮的滞后消息污染本轮）
        loop {
            match self.decision_rx.recv() {
                Ok(decision) => {
                    if decision.request_id != request_id {
                        tracing::warn!(
                            "drop stale decision for id={} (expected {})",
                            decision.request_id,
                            request_id
                        );
                        continue;
                    }
                    // 5. 命中本次 request_id：处理决策
                    if decision.allow {
                        if decision.remember {
                            self.remembered_allows.insert(request.tool_name.clone());
                            tracing::info!("remembered allow for tool: {}", request.tool_name);
                        }
                        return PermissionPromptDecision::Allow;
                    } else {
                        return PermissionPromptDecision::Deny {
                            reason: decision
                                .reason
                                .unwrap_or_else(|| "user denied via UI".to_string()),
                        };
                    }
                }
                Err(_) => {
                    // channel 关闭（任务被 stop 了）
                    return PermissionPromptDecision::Deny {
                        reason: "decision channel closed".to_string(),
                    };
                }
            }
        }
    }
}
