//! 沙箱终端 WebSocket —— 用 bollard exec + TTY 把容器 bash 接到 xterm.js。

use crate::state::SharedState;
use axum::{
    extract::{
        ws::{Message, WebSocket, WebSocketUpgrade},
        Path, Query, State,
    },
    response::IntoResponse,
};
use bollard::exec::{CreateExecOptions, ResizeExecOptions, StartExecOptions, StartExecResults};
use futures_util::{SinkExt, StreamExt};
use serde::{Deserialize, Serialize};
use std::time::{Duration, Instant};
use tokio::io::AsyncWriteExt;

#[derive(Debug, Deserialize)]
pub struct TerminalQuery {
    pub cols: Option<u16>,
    pub rows: Option<u16>,
}

#[derive(Debug, Deserialize)]
#[serde(tag = "t", rename_all = "lowercase")]
enum ClientFrame {
    /// 用户在终端输入（含 keystrokes）
    In { d: String },
    /// 调整终端尺寸
    Resize { cols: u16, rows: u16 },
    /// 心跳
    Ping {},
}

#[derive(Debug, Serialize)]
#[serde(tag = "t", rename_all = "lowercase")]
enum ServerFrame<'a> {
    /// 终端输出数据
    Out { d: &'a str },
    /// 连接就绪
    Ready {},
    /// 会话结束（容器 exec 退出）
    Exit { code: i64 },
    /// 错误信息
    Error { message: String },
}

/// 每 WS 每秒最大输入字节数，防粘贴炸弹
const STDIN_RATE_BYTES_PER_SEC: usize = 2 * 1024;
/// 空闲超时：双方 N 秒没消息就主动关
const IDLE_TIMEOUT_SECS: u64 = 15 * 60;

pub async fn terminal_ws(
    ws: WebSocketUpgrade,
    State(state): State<SharedState>,
    Path(id): Path<String>,
    Query(q): Query<TerminalQuery>,
) -> impl IntoResponse {
    ws.on_upgrade(move |socket| handle_terminal(socket, state, id, q))
}

async fn send_error(socket: WebSocket, message: impl Into<String>) {
    let (mut sink, _) = socket.split();
    let frame = ServerFrame::Error { message: message.into() };
    if let Ok(s) = serde_json::to_string(&frame) {
        let _ = sink.send(Message::Text(s)).await;
    }
    let _ = sink.close().await;
}

async fn handle_terminal(socket: WebSocket, state: SharedState, id: String, q: TerminalQuery) {
    let container_id = {
        let map = state.sandboxes.read().await;
        match map.get(&id) {
            Some(sb) => sb.container_id.clone(),
            None => {
                send_error(socket, "沙箱不存在").await;
                return;
            }
        }
    };

    let cols = q.cols.unwrap_or(120);
    let rows = q.rows.unwrap_or(30);

    // 创建 exec（带 TTY + stdin）
    let exec = match state
        .docker
        .raw()
        .create_exec(
            &container_id,
            CreateExecOptions {
                cmd: Some(vec![
                    "bash".to_string(),
                    "--login".to_string(),
                ]),
                attach_stdout: Some(true),
                attach_stderr: Some(true),
                attach_stdin: Some(true),
                tty: Some(true),
                working_dir: Some("/workspace".to_string()),
                env: Some(vec!["TERM=xterm-256color".to_string()]),
                ..Default::default()
            },
        )
        .await
    {
        Ok(e) => e,
        Err(e) => {
            send_error(socket, format!("create_exec: {e}")).await;
            return;
        }
    };

    // 事先 resize（bollard exec resize 在 start_exec 之后才生效，所以先 start 再 resize）
    let start_res = state
        .docker
        .raw()
        .start_exec(
            &exec.id,
            Some(StartExecOptions {
                detach: false,
                tty: true,
                output_capacity: None,
            }),
        )
        .await;

    let (mut output, mut input) = match start_res {
        Ok(StartExecResults::Attached { output, input }) => (output, input),
        Ok(StartExecResults::Detached) => {
            send_error(socket, "exec detached unexpectedly").await;
            return;
        }
        Err(e) => {
            send_error(socket, format!("start_exec: {e}")).await;
            return;
        }
    };

    // start 之后 resize
    let _ = state.docker.raw().resize_exec(&exec.id, ResizeExecOptions { width: cols, height: rows }).await;

    let (mut ws_sink, mut ws_stream) = socket.split();

    // Ready 信号
    let _ = ws_sink
        .send(Message::Text(serde_json::to_string(&ServerFrame::Ready {}).unwrap()))
        .await;

    let exec_id_for_resize = exec.id.clone();
    let docker_for_resize = state.docker.clone();

    // 限速窗口：1 秒一桶
    let mut bucket_bytes: usize = 0;
    let mut bucket_start = Instant::now();

    // 两方向 pipe：
    //  WS → stdin（用户输入）
    //  exec output → WS（容器输出）
    let forward_output = async move {
        while let Some(Ok(chunk)) = output.next().await {
            use bollard::container::LogOutput::*;
            let bytes = match chunk {
                StdOut { message } | StdErr { message } | Console { message } => message,
                StdIn { .. } => continue,
            };
            let text = String::from_utf8_lossy(&bytes).to_string();
            let frame = ServerFrame::Out { d: &text };
            let s = match serde_json::to_string(&frame) {
                Ok(s) => s,
                Err(_) => continue,
            };
            if ws_sink.send(Message::Text(s)).await.is_err() {
                break;
            }
        }
        // 输出流结束 → 查询 exit_code 并发 Exit
        let exit = docker_for_resize
            .raw()
            .inspect_exec(&exec_id_for_resize)
            .await
            .ok()
            .and_then(|info| info.exit_code)
            .unwrap_or(0);
        let _ = ws_sink
            .send(Message::Text(
                serde_json::to_string(&ServerFrame::Exit { code: exit }).unwrap(),
            ))
            .await;
        let _ = ws_sink.close().await;
    };

    let exec_id_for_input = exec.id.clone();
    let docker_for_input = state.docker.clone();
    let forward_input = async move {
        loop {
            let recv = tokio::time::timeout(
                Duration::from_secs(IDLE_TIMEOUT_SECS),
                ws_stream.next(),
            )
            .await;
            let msg = match recv {
                Err(_) => break, // 空闲超时
                Ok(None) => break,
                Ok(Some(Err(_))) => break,
                Ok(Some(Ok(m))) => m,
            };
            match msg {
                Message::Text(text) => {
                    let frame: ClientFrame = match serde_json::from_str(&text) {
                        Ok(f) => f,
                        Err(_) => continue,
                    };
                    match frame {
                        ClientFrame::In { d } => {
                            // 限速
                            let now = Instant::now();
                            if now.duration_since(bucket_start) >= Duration::from_secs(1) {
                                bucket_bytes = 0;
                                bucket_start = now;
                            }
                            bucket_bytes += d.len();
                            if bucket_bytes > STDIN_RATE_BYTES_PER_SEC {
                                // 超过限速：丢弃（或睡到下个窗口）
                                tokio::time::sleep(Duration::from_millis(400)).await;
                            }
                            if let Err(e) = input.write_all(d.as_bytes()).await {
                                tracing::warn!("terminal stdin write error: {}", e);
                                break;
                            }
                            let _ = input.flush().await;
                        }
                        ClientFrame::Resize { cols, rows } => {
                            let _ = docker_for_input
                                .raw()
                                .resize_exec(
                                    &exec_id_for_input,
                                    ResizeExecOptions {
                                        width: cols,
                                        height: rows,
                                    },
                                )
                                .await;
                        }
                        ClientFrame::Ping {} => {
                            // 心跳：客户端只要发过消息 IDLE 超时就会重置，无需额外回应
                        }
                    }
                }
                Message::Binary(_) => {}
                Message::Close(_) => break,
                _ => {}
            }
        }
    };

    tokio::select! {
        _ = forward_output => {},
        _ = forward_input => {},
    }
}

