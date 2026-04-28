use crate::openai_stream::{
    convert_messages as convert_to_oa_messages, default_tool_schemas, OpenAiStreamClient,
};
use crate::state::TaskEvent;
use api::{
    ContentBlockDelta, InputContentBlock, InputMessage, MessageRequest, OutputContentBlock,
    ProviderClient, StreamEvent, ToolChoice, ToolDefinition,
};
use runtime::{
    ApiClient, ApiRequest, AssistantEvent, ContentBlock, ConversationMessage, MessageRole,
    RuntimeError,
};
use serde_json::{json, Value};
use std::sync::atomic::{AtomicU32, Ordering};
use tokio::sync::broadcast;

/// 进程内 LLM 调用计数器（用于 LlmCallSnapshot.call_seq）。
/// 跨任务共享一个计数也能用——backend tracelog 按 task-id 隔离，call_seq 仅用于排序。
static LLM_CALL_SEQ: AtomicU32 = AtomicU32::new(0);

/// 把 ConversationMessage 序列化成 JSON（runtime crate 没 derive Serialize，手撸）
fn message_to_json(msg: &ConversationMessage) -> Value {
    let role = match msg.role {
        MessageRole::System => "system",
        MessageRole::User => "user",
        MessageRole::Assistant => "assistant",
        MessageRole::Tool => "tool",
    };
    let blocks: Vec<Value> = msg
        .blocks
        .iter()
        .map(|b| match b {
            ContentBlock::Text { text } => json!({ "type": "text", "text": text }),
            ContentBlock::ToolUse { id, name, input } => json!({
                "type": "tool_use",
                "id": id,
                "name": name,
                // input 是 LLM 给的 JSON 字符串，尽量解析成对象再嵌套（更易读）
                "input": serde_json::from_str::<Value>(input).unwrap_or_else(|_| Value::String(input.clone())),
            }),
            ContentBlock::ToolResult {
                tool_use_id,
                tool_name,
                output,
                is_error,
            } => json!({
                "type": "tool_result",
                "tool_use_id": tool_use_id,
                "tool_name": tool_name,
                "output": output,
                "is_error": is_error,
            }),
        })
        .collect();
    let mut obj = serde_json::Map::new();
    obj.insert("role".to_string(), Value::String(role.to_string()));
    obj.insert("blocks".to_string(), Value::Array(blocks));
    if let Some(usage) = &msg.usage {
        obj.insert(
            "usage".to_string(),
            json!({
                "input_tokens": usage.input_tokens,
                "output_tokens": usage.output_tokens,
                "cache_read_input_tokens": usage.cache_read_input_tokens,
                "cache_creation_input_tokens": usage.cache_creation_input_tokens,
            }),
        );
    }
    Value::Object(obj)
}

/// 把 AssistantEvent 序列化成 JSON
fn assistant_event_to_json(ev: &AssistantEvent) -> Value {
    match ev {
        AssistantEvent::TextDelta(text) => json!({ "type": "text_delta", "text": text }),
        AssistantEvent::ToolUse { id, name, input } => json!({
            "type": "tool_use",
            "id": id,
            "name": name,
            "input": serde_json::from_str::<Value>(input).unwrap_or_else(|_| Value::String(input.clone())),
        }),
        AssistantEvent::Usage(u) => json!({
            "type": "usage",
            "input_tokens": u.input_tokens,
            "output_tokens": u.output_tokens,
            "cache_read_input_tokens": u.cache_read_input_tokens,
            "cache_creation_input_tokens": u.cache_creation_input_tokens,
        }),
        AssistantEvent::PromptCache(pc) => json!({
            "type": "prompt_cache",
            "unexpected": pc.unexpected,
            "reason": pc.reason,
            "previous_cache_read_input_tokens": pc.previous_cache_read_input_tokens,
            "current_cache_read_input_tokens": pc.current_cache_read_input_tokens,
            "token_drop": pc.token_drop,
        }),
        AssistantEvent::MessageStop => json!({ "type": "message_stop" }),
    }
}

/// 发出 LlmCallSnapshot —— 在 stream() 调用结束（无论成功失败）时一次性发出。
/// 成本：每轮 LLM 调用一次 broadcast，落盘由 backend tracelog 路由处理。
fn emit_llm_call_snapshot(
    event_tx: &broadcast::Sender<TaskEvent>,
    model: &str,
    request: &ApiRequest,
    result: &Result<Vec<AssistantEvent>, RuntimeError>,
    elapsed_ms: u64,
) {
    let call_seq = LLM_CALL_SEQ.fetch_add(1, Ordering::Relaxed) + 1;
    let request_messages: Vec<Value> =
        request.messages.iter().map(message_to_json).collect();
    let (success, response_events) = match result {
        Ok(events) => (true, events.iter().map(assistant_event_to_json).collect()),
        Err(e) => (
            false,
            vec![json!({ "type": "error", "message": e.to_string() })],
        ),
    };
    let _ = event_tx.send(TaskEvent::LlmCallSnapshot {
        call_seq,
        model: model.to_string(),
        request_messages,
        response_events,
        elapsed_ms,
        success,
    });
}

/// 两种后端路径：
/// - Anthropic 协议：走 claw-code 的 api crate（仍用 ProviderClient）
/// - OpenAI 兼容：走我们自己的 openai_stream 模块（支持 reasoning 字段）
pub enum Backend {
    Anthropic(ProviderClient),
    OpenAiCompat(OpenAiStreamClient),
}

pub struct ProviderRuntimeClient {
    backend: Backend,
    model: String,
    event_tx: broadcast::Sender<TaskEvent>,
}

impl ProviderRuntimeClient {
    /// Anthropic 路径（走 claw-code 的 api crate）
    pub fn new_anthropic(
        provider: ProviderClient,
        model: String,
        event_tx: broadcast::Sender<TaskEvent>,
    ) -> Self {
        Self {
            backend: Backend::Anthropic(provider),
            model,
            event_tx,
        }
    }

    /// OpenAI 兼容路径（Ollama / DeepSeek / Qwen / DashScope / OpenAI）
    pub fn new_openai_compat(
        base_url: String,
        api_key: Option<String>,
        model: String,
        temperature: Option<f32>,
        max_tokens: Option<u32>,
        event_tx: broadcast::Sender<TaskEvent>,
    ) -> Self {
        Self {
            backend: Backend::OpenAiCompat(OpenAiStreamClient {
                base_url,
                api_key,
                model: model.clone(),
                temperature,
                max_tokens,
            }),
            model,
            event_tx,
        }
    }
}

impl ApiClient for ProviderRuntimeClient {
    fn stream(&mut self, request: ApiRequest) -> Result<Vec<AssistantEvent>, RuntimeError> {
        let started = std::time::Instant::now();
        let result = self.stream_inner(&request);
        let elapsed_ms = started.elapsed().as_millis() as u64;
        // 2026-04-25 tracelog：每轮 LLM 调用结束时落盘（broadcast → backend tracelog）
        emit_llm_call_snapshot(&self.event_tx, &self.model, &request, &result, elapsed_ms);
        result
    }
}

impl ProviderRuntimeClient {
    fn stream_inner(&self, request: &ApiRequest) -> Result<Vec<AssistantEvent>, RuntimeError> {
        match &self.backend {
            Backend::OpenAiCompat(client) => {
                // 自己解析：支持 reasoning 字段、<think> 标签统一化
                let system_prompt_str = (!request.system_prompt.is_empty())
                    .then(|| request.system_prompt.join("\n\n"));

                let mut oa_messages = Vec::new();
                // 系统提示作为 role=system 的消息注入到头部
                if let Some(sys) = system_prompt_str {
                    oa_messages.push(crate::openai_stream::OaMessage {
                        role: "system".into(),
                        content: Some(sys),
                        tool_calls: None,
                        tool_call_id: None,
                    });
                }
                oa_messages.extend(convert_to_oa_messages(&request.messages));

                client.stream(oa_messages, default_tool_schemas(), &self.event_tx)
            }
            Backend::Anthropic(provider) => {
                // 原 claw-code api crate 路径
                let system_prompt = (!request.system_prompt.is_empty())
                    .then(|| request.system_prompt.join("\n\n"));
                let messages = convert_messages(&request.messages);

                // ⚠️ 关键：必须把工具 schema 以 Anthropic 原生 tools 参数传过去，
                // 否则 Claude 会模仿 Claude Code 的文本格式输出 <function_calls><invoke>... XML，
                // 而不是走结构化 tool_use content block。
                let tools: Vec<ToolDefinition> = crate::openai_stream::default_tool_schemas()
                    .into_iter()
                    .map(|t| ToolDefinition {
                        name: t.function.name,
                        description: Some(t.function.description),
                        input_schema: t.function.parameters,
                    })
                    .collect();

                let message_request = MessageRequest {
                    model: self.model.clone(),
                    // 生成业务代码场景需要较大输出（pages.json + 多个 .vue 文件），
                    // Claude Sonnet 4.6 output 上限 64k，这里给 16k 够用且留安全边界
                    max_tokens: 16384,
                    messages,
                    system: system_prompt,
                    tools: Some(tools),
                    tool_choice: Some(ToolChoice::Auto),
                    stream: true,
                    temperature: None,
                    top_p: None,
                    frequency_penalty: None,
                    presence_penalty: None,
                    stop: None,
                    reasoning_effort: None,
                };

                let event_tx = self.event_tx.clone();
                let rt = tokio::runtime::Builder::new_current_thread()
                    .enable_all()
                    .build()
                    .map_err(|e| RuntimeError::new(format!("Failed to create runtime: {}", e)))?;

                rt.block_on(async move {
                    let stream = provider
                        .stream_message(&message_request)
                        .await
                        .map_err(|e| RuntimeError::new(format!("API stream error: {}", e)))?;
                    consume_stream(stream, &event_tx).await
                })
            }
        }
    }
}

fn convert_messages(messages: &[ConversationMessage]) -> Vec<InputMessage> {
    messages
        .iter()
        .filter_map(|message| {
            let role = match message.role {
                MessageRole::System | MessageRole::User | MessageRole::Tool => "user",
                MessageRole::Assistant => "assistant",
            };

            let content = message
                .blocks
                .iter()
                .map(|block| match block {
                    ContentBlock::Text { text } => InputContentBlock::Text { text: text.clone() },
                    ContentBlock::ToolUse { id, name, input } => InputContentBlock::ToolUse {
                        id: id.clone(),
                        name: name.clone(),
                        input: serde_json::from_str(input)
                            .unwrap_or_else(|_| serde_json::json!({ "raw": input })),
                    },
                    ContentBlock::ToolResult {
                        tool_use_id,
                        output,
                        is_error,
                        ..
                    } => InputContentBlock::ToolResult {
                        tool_use_id: tool_use_id.clone(),
                        content: vec![api::ToolResultContentBlock::Text {
                            text: output.clone(),
                        }],
                        is_error: *is_error,
                    },
                })
                .collect::<Vec<_>>();

            (!content.is_empty()).then(|| InputMessage {
                role: role.to_string(),
                content,
            })
        })
        .collect()
}

async fn consume_stream(
    mut stream: api::MessageStream,
    event_tx: &broadcast::Sender<TaskEvent>,
) -> Result<Vec<AssistantEvent>, RuntimeError> {
    let mut events = Vec::new();
    let mut pending_tool: Option<(String, String, String)> = None;
    let mut text_deltas = 0usize;
    let mut tool_uses = 0usize;
    let mut thinking_deltas = 0usize;
    let mut stop_reason: Option<String> = None;

    loop {
        let event = stream
            .next_event()
            .await
            .map_err(|e| RuntimeError::new(format!("Stream read error: {}", e)))?;

        let Some(event) = event else { break };

        match event {
            StreamEvent::ContentBlockStart(start) => {
                if let OutputContentBlock::ToolUse { id, name, .. } = start.content_block {
                    pending_tool = Some((id, name, String::new()));
                }
            }
            StreamEvent::ContentBlockDelta(delta_event) => match delta_event.delta {
                ContentBlockDelta::TextDelta { text } => {
                    text_deltas += 1;
                    let ae = AssistantEvent::TextDelta(text.clone());
                    let _ = event_tx.send(TaskEvent::TextDelta(text));
                    events.push(ae);
                }
                ContentBlockDelta::InputJsonDelta { partial_json } => {
                    if let Some((_, _, ref mut input)) = &mut pending_tool {
                        input.push_str(&partial_json);
                    }
                }
                ContentBlockDelta::ThinkingDelta { .. } => {
                    thinking_deltas += 1;
                }
                _ => {}
            },
            StreamEvent::ContentBlockStop(_) => {
                if let Some((id, name, input)) = pending_tool.take() {
                    tool_uses += 1;
                    let ae = AssistantEvent::ToolUse {
                        id,
                        name: name.clone(),
                        input: input.clone(),
                    };
                    let _ = event_tx.send(TaskEvent::ToolUse {
                        name: name.clone(),
                        input,
                    });
                    events.push(ae);
                }
            }
            StreamEvent::MessageDelta(md) => {
                if let Some(reason) = md.delta.stop_reason {
                    stop_reason = Some(reason);
                }
            }
            StreamEvent::MessageStop(_) => {
                events.push(AssistantEvent::MessageStop);
            }
            _ => {}
        }
    }

    tracing::info!(
        "Anthropic stream done: text_deltas={}, tool_uses={}, thinking_deltas={}, stop_reason={:?}, total_events={}",
        text_deltas,
        tool_uses,
        thinking_deltas,
        stop_reason,
        events.len()
    );

    // 兜底：如果 Claude 这一轮什么 text 和 tool_use 都没发（常见于中转服务 SSE 截断，
    // 或模型只输出 thinking 被我们忽略），塞一条占位 text，避免 runtime 在 build_assistant_message
    // 里因 blocks 空而硬报 "assistant stream produced no content" 终止整个任务。
    if text_deltas == 0 && tool_uses == 0 {
        let placeholder = format!(
            "(模型本轮未返回 text / tool_use；stop_reason={:?}；thinking_deltas={})",
            stop_reason, thinking_deltas
        );
        tracing::warn!("Empty assistant turn, injecting placeholder: {}", placeholder);
        let _ = event_tx.send(TaskEvent::TextDelta(placeholder.clone()));
        // 插在 MessageStop 前
        let insert_at = events
            .iter()
            .position(|e| matches!(e, AssistantEvent::MessageStop))
            .unwrap_or(events.len());
        events.insert(insert_at, AssistantEvent::TextDelta(placeholder));
    }

    Ok(events)
}
