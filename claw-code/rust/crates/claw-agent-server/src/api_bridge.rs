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
use tokio::sync::broadcast;

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
