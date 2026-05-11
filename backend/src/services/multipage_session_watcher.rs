//! 1.2.0 多页 session 真完成等待器
//!
//! 痛点：claw-agent `POST /tasks` 同步返回 session_id 时，LLM 还没真跑完。
//! 多页路径下前端 ws 是 idle 模式（`task.claw_session_id = None`），
//! 没人转发事件 → 单纯 `create_task.await` 后立刻标 page done 是假象。
//!
//! 这里订阅 `ws://{claw_agent_url}/tasks/{session_id}/events`：
//! 1. 把每条事件持久化到 `project_task_event`（关联 backend 的 multipage task_id）
//! 2. 同时按 tracelog 配置归档（与单页路径口径一致）
//! 3. 看到 `status_change=succeeded/failed/stopped` 才返回，最长等 30 分钟（兜底）

use crate::entity::project_task_event;
use crate::AppState;
use chrono::Utc;
use futures_util::StreamExt;
use sea_orm::{ActiveModelTrait, Set};
use tokio_tungstenite::tungstenite::Message as WsMessage;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum SessionFinalStatus {
    Succeeded,
    Failed,
    Stopped,
    Timeout,
}

impl SessionFinalStatus {
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Succeeded => "succeeded",
            Self::Failed => "failed",
            Self::Stopped => "stopped",
            Self::Timeout => "timeout",
        }
    }
}

const WAIT_TIMEOUT_SECS: u64 = 30 * 60;

/// 阻塞等到 claw-agent 推 `status_change=succeeded/failed/stopped` 才返回。
/// 期间所有 ws 事件以原文 JSON 形式落 `project_task_event`，event_type 取自顶层 `type`。
pub async fn wait_session_completed(
    state: &AppState,
    backend_task_id: i32,
    claw_session_id: &str,
) -> SessionFinalStatus {
    let ws_url = format!(
        "{}/tasks/{}/events",
        state
            .claw_agent_url
            .replace("http://", "ws://")
            .replace("https://", "wss://"),
        claw_session_id,
    );

    let upstream = match tokio_tungstenite::connect_async(&ws_url).await {
        Ok((ws, _)) => ws,
        Err(e) => {
            tracing::error!(
                "multipage watcher: 连 claw ws 失败 task={} session={}: {}",
                backend_task_id,
                claw_session_id,
                e
            );
            return SessionFinalStatus::Failed;
        }
    };
    let (_, mut rx) = upstream.split();

    let deadline =
        tokio::time::Instant::now() + tokio::time::Duration::from_secs(WAIT_TIMEOUT_SECS);

    loop {
        let Some(remaining) = deadline.checked_duration_since(tokio::time::Instant::now())
        else {
            tracing::warn!(
                "multipage watcher: session={} 超过 {}s 仍未见 status_change",
                claw_session_id,
                WAIT_TIMEOUT_SECS
            );
            return SessionFinalStatus::Timeout;
        };

        let msg = match tokio::time::timeout(remaining, rx.next()).await {
            Ok(Some(Ok(WsMessage::Text(text)))) => text,
            Ok(Some(Ok(WsMessage::Close(_)))) | Ok(None) => {
                tracing::warn!(
                    "multipage watcher: session={} ws 关闭但未见 status_change",
                    claw_session_id
                );
                return SessionFinalStatus::Failed;
            }
            Ok(Some(Ok(_))) => continue, // ping/pong/binary 忽略
            Ok(Some(Err(e))) => {
                tracing::warn!(
                    "multipage watcher: session={} ws 错误: {}",
                    claw_session_id,
                    e
                );
                return SessionFinalStatus::Failed;
            }
            Err(_) => return SessionFinalStatus::Timeout,
        };

        // 1) 落 DB（所有事件都持久化，让前端 history REST 能回放）
        persist_event(&state.db, backend_task_id, &msg).await;
        // 2) tracelog 归档（与单页路径一致；mode=disabled 时是 no-op）
        crate::services::tracelog::route_event(state, backend_task_id, &msg).await;

        // 3) 嗅探 status_change
        if let Ok(v) = serde_json::from_str::<serde_json::Value>(&msg) {
            if v.get("type").and_then(|t| t.as_str()) == Some("status_change") {
                let data = v.get("data").and_then(|d| d.as_str()).unwrap_or("");
                match data {
                    "succeeded" => return SessionFinalStatus::Succeeded,
                    "failed" => return SessionFinalStatus::Failed,
                    "stopped" => return SessionFinalStatus::Stopped,
                    // pending / running / waiting_user 不视作终结
                    _ => continue,
                }
            }
        }
    }
}

async fn persist_event(db: &sea_orm::DatabaseConnection, task_id: i32, json_text: &str) {
    let parsed = serde_json::from_str::<serde_json::Value>(json_text).ok();
    let event_type = parsed
        .as_ref()
        .and_then(|v| v.get("type").and_then(|t| t.as_str()))
        .unwrap_or("unknown")
        .to_string();

    let record = project_task_event::ActiveModel {
        task_id: Set(task_id),
        event_type: Set(event_type.clone()),
        payload: Set(json_text.to_string()),
        created_at: Set(Utc::now().naive_utc()),
        ..Default::default()
    };

    if let Err(e) = record.insert(db).await {
        tracing::warn!(
            "multipage watcher: persist event 失败 task={}: {}",
            task_id,
            e
        );
    }

    // 1.4 W4 actual_cost / 1.5 W1.2：llm_call_snapshot 收到时累加 usage
    //   - actual_cost_tokens：当前 attempt 成本（fix retry 时由 spawn_dev_status_watcher reset 0）
    //   - accumulated_cost_tokens：全部 attempt 累计（永不 reset，审计用）
    // response_events[*].type=="usage" 含 input_tokens / output_tokens（由 openai_stream/api_bridge 注入）
    if event_type == "llm_call_snapshot" {
        if let Some(v) = parsed {
            let resp_events = v.pointer("/data/response_events").and_then(|x| x.as_array());
            if let Some(arr) = resp_events {
                let mut total: i64 = 0;
                for e in arr {
                    if e.get("type").and_then(|t| t.as_str()) == Some("usage") {
                        let it = e.get("input_tokens").and_then(|n| n.as_i64()).unwrap_or(0);
                        let ot = e.get("output_tokens").and_then(|n| n.as_i64()).unwrap_or(0);
                        total += it + ot;
                    }
                }
                if total > 0 {
                    // 原子累加：同时写两列，单语句保事务一致性
                    let sql = format!(
                        "UPDATE project_generation_task SET \
                            actual_cost_tokens      = COALESCE(actual_cost_tokens, 0) + {tokens}, \
                            accumulated_cost_tokens = COALESCE(accumulated_cost_tokens, 0) + {tokens} \
                         WHERE id = {id}",
                        tokens = total,
                        id = task_id
                    );
                    use sea_orm::{ConnectionTrait, Statement};
                    if let Err(e) = db
                        .execute(Statement::from_string(db.get_database_backend(), sql))
                        .await
                    {
                        tracing::warn!(
                            "actual_cost 累加失败 task={} tokens={}: {}",
                            task_id,
                            total,
                            e
                        );
                    }
                }
            }
        }
    }
}
