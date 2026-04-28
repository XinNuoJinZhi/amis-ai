use crate::state::SharedState;
use axum::{
    extract::{
        ws::{Message, WebSocket, WebSocketUpgrade},
        Path, State,
    },
    response::IntoResponse,
};

pub async fn ws_events(
    State(state): State<SharedState>,
    Path(id): Path<String>,
    ws: WebSocketUpgrade,
) -> impl IntoResponse {
    ws.on_upgrade(move |socket| handle_ws(socket, state, id))
}

async fn handle_ws(mut socket: WebSocket, state: SharedState, task_id: String) {
    // 1. 先订阅 broadcast（保证从此刻起的所有 send 都能被这个 receiver 拿到），
    //    然后拷贝一份 initial_events 快照 —— 两步顺序很重要：先订阅再拷快照可以避免
    //    "快照拷完到 subscribe 之间" 的事件丢失。
    let (mut rx, cached) = {
        let tasks = state.tasks.read().await;
        match tasks.get(&task_id) {
            Some(task) => {
                let rx = task.tx.subscribe();
                let cached: Vec<crate::state::TaskEvent> = task
                    .initial_events
                    .lock()
                    .map(|guard| guard.clone())
                    .unwrap_or_default();
                (rx, cached)
            }
            None => {
                let _ = socket
                    .send(Message::Text(
                        serde_json::json!({"error": "Task not found"}).to_string(),
                    ))
                    .await;
                return;
            }
        }
    };

    // 2. 先 replay 缓存里的启动期事件（skills_loaded / system_prompt_built 等）
    //    这是为了解决 broadcast 在 WS 订阅建立前发出的消息被丢弃的问题。
    for event in cached {
        let Ok(json) = serde_json::to_string(&event) else {
            continue;
        };
        if socket.send(Message::Text(json)).await.is_err() {
            return;
        }
    }

    // 3. 进入正常流式转发循环
    while let Ok(event) = rx.recv().await {
        let Ok(json) = serde_json::to_string(&event) else {
            continue;
        };
        if socket.send(Message::Text(json)).await.is_err() {
            break;
        }
    }
}
