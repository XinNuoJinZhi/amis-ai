use crate::state::TaskEvent;
use api::{
    ContentBlockDelta, InputContentBlock, InputMessage, MessageRequest, OutputContentBlock,
    ProviderClient, StreamEvent,
};
use runtime::{
    ApiClient, ApiRequest, AssistantEvent, ContentBlock, ConversationMessage, MessageRole,
    RuntimeError,
};
use tokio::sync::broadcast;

pub struct ProviderRuntimeClient {
    provider: ProviderClient,
    model: String,
    event_tx: broadcast::Sender<TaskEvent>,
}

impl ProviderRuntimeClient {
    pub fn new(
        provider: ProviderClient,
        model: String,
        event_tx: broadcast::Sender<TaskEvent>,
    ) -> Result<Self, RuntimeError> {
        Ok(Self {
            provider,
            model,
            event_tx,
        })
    }
}

impl ApiClient for ProviderRuntimeClient {
    fn stream(&mut self, request: ApiRequest) -> Result<Vec<AssistantEvent>, RuntimeError> {
        let system_prompt = (!request.system_prompt.is_empty())
            .then(|| request.system_prompt.join("\n\n"));

        let messages = convert_messages(&request.messages);

        let message_request = MessageRequest {
            model: self.model.clone(),
            max_tokens: 4096,
            messages,
            system: system_prompt,
            tools: None,
            tool_choice: None,
            stream: true,
            temperature: None,
            top_p: None,
            frequency_penalty: None,
            presence_penalty: None,
            stop: None,
            reasoning_effort: None,
        };

        let event_tx = self.event_tx.clone();
        let provider = &self.provider;

        // 使用 current_thread runtime 而不是 multi-thread，避免嵌套 runtime drop panic
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
                    let ae = AssistantEvent::TextDelta(text.clone());
                    let _ = event_tx.send(TaskEvent::TextDelta(text));
                    events.push(ae);
                }
                ContentBlockDelta::InputJsonDelta { partial_json } => {
                    if let Some((_, _, ref mut input)) = &mut pending_tool {
                        input.push_str(&partial_json);
                    }
                }
                _ => {}
            },
            StreamEvent::ContentBlockStop(_) => {
                if let Some((id, name, input)) = pending_tool.take() {
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
            StreamEvent::MessageStop(_) => {
                events.push(AssistantEvent::MessageStop);
            }
            StreamEvent::MessageStart(_) | StreamEvent::MessageDelta(_) => {}
        }
    }

    Ok(events)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_convert_messages_basic() {
        let messages = vec![ConversationMessage::user_text("hello")];
        let converted = convert_messages(&messages);

        assert_eq!(converted.len(), 1);
        assert_eq!(converted[0].role, "user");
    }

    #[test]
    fn test_convert_messages_role_mapping() {
        let msg_user = ConversationMessage::user_text("user message");
        let msg_assistant = ConversationMessage::assistant(vec![ContentBlock::Text {
            text: "assistant message".to_string(),
        }]);

        let messages = vec![msg_user, msg_assistant];
        let converted = convert_messages(&messages);

        assert_eq!(converted.len(), 2);
        assert_eq!(converted[0].role, "user");
        assert_eq!(converted[1].role, "assistant");
    }
}
