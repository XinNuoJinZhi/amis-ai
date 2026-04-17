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
    let mut rx = {
        let tasks = state.tasks.read().await;
        match tasks.get(&task_id) {
            Some(task) => task.tx.subscribe(),
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

    while let Ok(event) = rx.recv().await {
        let Ok(json) = serde_json::to_string(&event) else {
            continue;
        };
        if socket.send(Message::Text(json)).await.is_err() {
            break;
        }
    }
}
