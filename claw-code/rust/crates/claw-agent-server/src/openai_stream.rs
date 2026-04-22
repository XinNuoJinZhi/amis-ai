//! OpenAI 兼容的流式 chat completion 客户端。
//!
//! 为什么自己实现（而不是用 claw-code 的 api crate）？
//! claw-code 的 api crate 解析 OpenAI SSE 时只识别 `content` 字段（openai_compat.rs:714），
//! 完全忽略 `reasoning` 字段（推理模型的思考链）和模型特有的扩展字段。
//! 这里我们自己解析：
//! - `content` 原样透传（Qwen3 的 `<think>...</think>` 就在这里）
//! - `reasoning` 字段用 `<think>...</think>` 包裹后合并到 content 流，让前端统一处理
//! - tool_calls 按标准 OpenAI 协议处理
//!
//! 依赖：ureq（纯同步 HTTP），不依赖 tokio runtime。

use crate::state::TaskEvent;
use runtime::{AssistantEvent, RuntimeError};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::io::BufRead;
use tokio::sync::broadcast;

/// 本模块可识别的 OpenAI 兼容 chat completion 流式解析器。
pub struct OpenAiStreamClient {
    pub base_url: String,
    pub api_key: Option<String>,
    pub model: String,
    pub temperature: Option<f32>,
    pub max_tokens: Option<u32>,
}

/// OpenAI 格式的消息（入参）
#[derive(Debug, Clone, Serialize)]
pub struct OaMessage {
    pub role: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub content: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none", rename = "tool_calls")]
    pub tool_calls: Option<Vec<OaToolCall>>,
    #[serde(skip_serializing_if = "Option::is_none", rename = "tool_call_id")]
    pub tool_call_id: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
pub struct OaToolCall {
    pub id: String,
    #[serde(rename = "type")]
    pub kind: String, // "function"
    pub function: OaFunctionCall,
}

#[derive(Debug, Clone, Serialize)]
pub struct OaFunctionCall {
    pub name: String,
    pub arguments: String, // JSON string
}

/// 工具定义（给 LLM 看的 schema）
#[derive(Debug, Clone, Serialize)]
pub struct OaToolDefinition {
    #[serde(rename = "type")]
    pub kind: String, // "function"
    pub function: OaFunctionSchema,
}

#[derive(Debug, Clone, Serialize)]
pub struct OaFunctionSchema {
    pub name: String,
    pub description: String,
    pub parameters: Value, // JSON schema
}

// ================== SSE chunk 反序列化 ==================

#[derive(Debug, Deserialize)]
struct ChatChunk {
    choices: Vec<ChunkChoice>,
}

#[derive(Debug, Deserialize)]
struct ChunkChoice {
    #[serde(default)]
    delta: ChunkDelta,
    #[serde(default)]
    finish_reason: Option<String>,
}

#[derive(Debug, Default, Deserialize)]
struct ChunkDelta {
    #[serde(default)]
    content: Option<String>,
    #[serde(default)]
    reasoning: Option<String>, // ← 关键：claw-code 缺失的字段
    #[serde(default)]
    tool_calls: Vec<DeltaToolCall>,
}

#[derive(Debug, Default, Deserialize)]
struct DeltaToolCall {
    #[serde(default)]
    index: u32,
    #[serde(default)]
    id: Option<String>,
    #[serde(default)]
    function: DeltaFunction,
}

#[derive(Debug, Default, Deserialize)]
struct DeltaFunction {
    #[serde(default)]
    name: Option<String>,
    #[serde(default)]
    arguments: Option<String>,
}

// ================== 主流程 ==================

impl OpenAiStreamClient {
    /// 发起 chat completion 流式请求，消费整个流后返回给 runtime 的事件列表。
    /// 过程中每一条 text_delta / tool_use 都会同步 broadcast 到 event_tx。
    pub fn stream(
        &self,
        messages: Vec<OaMessage>,
        tools: Vec<OaToolDefinition>,
        event_tx: &broadcast::Sender<TaskEvent>,
    ) -> Result<Vec<AssistantEvent>, RuntimeError> {
        let url = format!("{}/chat/completions", self.base_url.trim_end_matches('/'));

        let mut body = json!({
            "model": self.model,
            "stream": true,
            "messages": messages,
        });
        if !tools.is_empty() {
            body["tools"] = serde_json::to_value(&tools).unwrap();
            body["tool_choice"] = json!("auto");
        }
        if let Some(t) = self.temperature {
            body["temperature"] = json!(t);
        }
        if let Some(m) = self.max_tokens {
            body["max_tokens"] = json!(m);
        }

        let msg_count = messages.len();
        let tool_count = tools.len();
        tracing::info!(
            "OpenAI stream request: model={}, messages={}, tools={}",
            self.model,
            msg_count,
            tool_count
        );

        // 广播 LLM 请求开始事件（前端显示"推理中..."）
        let _ = event_tx.send(TaskEvent::LlmRequestStart {
            model: self.model.clone(),
            messages: msg_count,
            tools: tool_count,
        });
        let started_at = std::time::Instant::now();

        // 读超时：通过 LLM_REQUEST_TIMEOUT_SECS 环境变量配置，默认 300s（5 分钟）
        let read_timeout_secs = std::env::var("LLM_REQUEST_TIMEOUT_SECS")
            .ok()
            .and_then(|s| s.parse::<u64>().ok())
            .unwrap_or(300);
        let mut agent_builder = ureq::AgentBuilder::new()
            .timeout_connect(std::time::Duration::from_secs(30))
            .timeout_read(std::time::Duration::from_secs(read_timeout_secs));

        // ureq 默认不读 HTTP_PROXY 环境变量，需要显式配置
        // 场景：WSL 环境下内网/外网都被 Hyper-V firewall 拦截，流量必须走 Windows 上的 Clash 代理
        // Clash 的 IP-CIDR 规则会处理分流（内网 DIRECT，外网按代理线路）
        if let Ok(proxy_url) = std::env::var("http_proxy")
            .or_else(|_| std::env::var("HTTP_PROXY"))
            .or_else(|_| std::env::var("https_proxy"))
            .or_else(|_| std::env::var("HTTPS_PROXY"))
        {
            if !proxy_url.is_empty() {
                match ureq::Proxy::new(&proxy_url) {
                    Ok(proxy) => {
                        tracing::info!("ureq using HTTP proxy: {}", proxy_url);
                        agent_builder = agent_builder.proxy(proxy);
                    }
                    Err(e) => tracing::warn!("invalid proxy url {}: {}", proxy_url, e),
                }
            }
        }
        let agent = agent_builder.build();

        let mut req = agent.post(&url).set("Content-Type", "application/json");
        if let Some(key) = &self.api_key {
            req = req.set("Authorization", &format!("Bearer {}", key));
        }

        let result: Result<Vec<AssistantEvent>, RuntimeError> = (|| {
            let resp = req
                .send_json(body)
                .map_err(|e| RuntimeError::new(format!("chat completion request failed: {}", e)))?;
            let reader = std::io::BufReader::new(resp.into_reader());
            self.consume_sse(reader, event_tx)
        })();

        // 广播 LLM 请求结束事件
        let elapsed_ms = started_at.elapsed().as_millis() as u64;
        let _ = event_tx.send(TaskEvent::LlmRequestEnd {
            elapsed_ms,
            success: result.is_ok(),
        });

        result
    }

    fn consume_sse<R: BufRead>(
        &self,
        reader: R,
        event_tx: &broadcast::Sender<TaskEvent>,
    ) -> Result<Vec<AssistantEvent>, RuntimeError> {
        let mut events = Vec::new();
        let mut in_reasoning = false; // 当前是否在 <think> 块内
        // 累积每个 tool_call：index → (id, name, arguments_buffer)
        let mut pending_tools: std::collections::BTreeMap<u32, (String, String, String)> =
            std::collections::BTreeMap::new();

        for line in reader.lines() {
            let line = line.map_err(|e| RuntimeError::new(format!("sse read error: {}", e)))?;
            if line.is_empty() {
                continue;
            }
            if !line.starts_with("data: ") {
                continue;
            }
            let data = &line[6..];
            if data.trim() == "[DONE]" {
                break;
            }

            let chunk: ChatChunk = match serde_json::from_str(data) {
                Ok(c) => c,
                Err(e) => {
                    tracing::warn!("failed to parse chunk: {} (data: {})", e, data);
                    continue;
                }
            };

            for choice in chunk.choices {
                let delta = choice.delta;

                // 1. reasoning 处理：用 <think>...</think> 包裹合并到 content 流
                if let Some(reasoning) = delta.reasoning.filter(|s| !s.is_empty()) {
                    if !in_reasoning {
                        in_reasoning = true;
                        emit_text(&mut events, event_tx, "<think>".to_string());
                    }
                    emit_text(&mut events, event_tx, reasoning);
                }

                // 2. content 处理：如果从 reasoning 切到 content，先闭合 </think>
                if let Some(content) = delta.content.filter(|s| !s.is_empty()) {
                    if in_reasoning {
                        in_reasoning = false;
                        emit_text(&mut events, event_tx, "</think>\n\n".to_string());
                    }
                    emit_text(&mut events, event_tx, content);
                }

                // 3. tool_calls 处理（增量累积）
                for dtc in delta.tool_calls {
                    let entry = pending_tools
                        .entry(dtc.index)
                        .or_insert_with(|| (String::new(), String::new(), String::new()));
                    if let Some(id) = dtc.id {
                        entry.0 = id;
                    }
                    if let Some(name) = dtc.function.name {
                        entry.1 = name;
                    }
                    if let Some(args) = dtc.function.arguments {
                        entry.2.push_str(&args);
                    }
                }

                // 4. finish_reason：完成所有 pending tool_calls
                if let Some(reason) = choice.finish_reason {
                    tracing::debug!("stream finish_reason: {}", reason);
                    // 先闭合可能未闭合的 <think>
                    if in_reasoning {
                        in_reasoning = false;
                        emit_text(&mut events, event_tx, "</think>\n\n".to_string());
                    }
                    // 然后把累积的 tool_calls 发出去
                    for (_, (id, name, args)) in std::mem::take(&mut pending_tools) {
                        if !name.is_empty() {
                            let ae = AssistantEvent::ToolUse {
                                id: if id.is_empty() {
                                    format!("call_{}", uuid::Uuid::new_v4().simple())
                                } else {
                                    id
                                },
                                name: name.clone(),
                                input: if args.is_empty() {
                                    "{}".to_string()
                                } else {
                                    args.clone()
                                },
                            };
                            let _ = event_tx.send(TaskEvent::ToolUse {
                                name: name.clone(),
                                input: args,
                            });
                            events.push(ae);
                        }
                    }
                }
            }
        }

        // 保证必须有 MessageStop（runtime 需要它判定流正常结束）
        events.push(AssistantEvent::MessageStop);
        // 如果完全没有 text 也没有 tool，runtime 会报 "assistant stream produced no content"，
        // 这时至少补一个空 text 保证不炸（只有在极端情况下）
        let has_content = events.iter().any(|e| {
            matches!(
                e,
                AssistantEvent::TextDelta(t) if !t.is_empty()
            ) || matches!(e, AssistantEvent::ToolUse { .. })
        });
        if !has_content {
            tracing::warn!("stream produced no content, injecting placeholder");
            let fallback = "（模型没有返回任何内容，可能模型不支持当前的请求格式）".to_string();
            let mut fixed = Vec::with_capacity(events.len() + 1);
            fixed.push(AssistantEvent::TextDelta(fallback));
            fixed.extend(events);
            return Ok(fixed);
        }

        Ok(events)
    }
}

fn emit_text(
    events: &mut Vec<AssistantEvent>,
    event_tx: &broadcast::Sender<TaskEvent>,
    text: String,
) {
    let _ = event_tx.send(TaskEvent::TextDelta(text.clone()));
    events.push(AssistantEvent::TextDelta(text));
}

// ================== Tool schema (hardcoded for our 6 tools) ==================

pub fn default_tool_schemas() -> Vec<OaToolDefinition> {
    vec![
        OaToolDefinition {
            kind: "function".into(),
            function: OaFunctionSchema {
                name: "bash".into(),
                description: "Execute a shell command in the workspace sandbox.".into(),
                parameters: json!({
                    "type": "object",
                    "properties": {
                        "command": {"type": "string", "description": "Shell command to run"}
                    },
                    "required": ["command"]
                }),
            },
        },
        OaToolDefinition {
            kind: "function".into(),
            function: OaFunctionSchema {
                name: "read_file".into(),
                description: "Read a file from the workspace.".into(),
                parameters: json!({
                    "type": "object",
                    "properties": {
                        "path": {"type": "string", "description": "File path (relative to workdir or absolute)"}
                    },
                    "required": ["path"]
                }),
            },
        },
        OaToolDefinition {
            kind: "function".into(),
            function: OaFunctionSchema {
                name: "write_file".into(),
                description: "Write a file (overwrite if exists).".into(),
                parameters: json!({
                    "type": "object",
                    "properties": {
                        "path": {"type": "string"},
                        "content": {"type": "string"}
                    },
                    "required": ["path", "content"]
                }),
            },
        },
        OaToolDefinition {
            kind: "function".into(),
            function: OaFunctionSchema {
                name: "edit_file".into(),
                description: "Edit a file by replacing a string.".into(),
                parameters: json!({
                    "type": "object",
                    "properties": {
                        "path": {"type": "string"},
                        "old_text": {"type": "string"},
                        "new_text": {"type": "string"}
                    },
                    "required": ["path", "old_text", "new_text"]
                }),
            },
        },
        OaToolDefinition {
            kind: "function".into(),
            function: OaFunctionSchema {
                name: "glob_search".into(),
                description: "Find files by glob pattern.".into(),
                parameters: json!({
                    "type": "object",
                    "properties": {
                        "pattern": {"type": "string", "description": "Glob pattern like **/*.vue"},
                        "path": {"type": "string", "description": "Subdirectory relative to workdir (default .)"}
                    },
                    "required": ["pattern"]
                }),
            },
        },
        OaToolDefinition {
            kind: "function".into(),
            function: OaFunctionSchema {
                name: "grep_search".into(),
                description: "Search file contents by substring.".into(),
                parameters: json!({
                    "type": "object",
                    "properties": {
                        "pattern": {"type": "string"},
                        "path": {"type": "string"}
                    },
                    "required": ["pattern"]
                }),
            },
        },
        OaToolDefinition {
            kind: "function".into(),
            function: OaFunctionSchema {
                name: "dev_start".into(),
                description: "启动开发服务器（pnpm run dev:h5）并让沙箱监控其启动状态。完成代码编写后必须调用此工具启动 Vite，而不是用 bash 自己启动。调用后沙箱会异步启动 dev server 并通过 dev-status 事件上报 ready/failed。无参数。".into(),
                parameters: json!({
                    "type": "object",
                    "properties": {},
                    "required": []
                }),
            },
        },
    ]
}

// ================== ConversationMessage → OaMessage 转换 ==================

pub fn convert_messages(messages: &[runtime::ConversationMessage]) -> Vec<OaMessage> {
    let mut result = Vec::new();
    for msg in messages {
        let role = match msg.role {
            runtime::MessageRole::System => "system",
            runtime::MessageRole::User => "user",
            runtime::MessageRole::Assistant => "assistant",
            runtime::MessageRole::Tool => "tool",
        };

        // 按块分类：收集 text、收集 tool_use、展开 tool_result
        let mut text_buf = String::new();
        let mut tool_calls: Vec<OaToolCall> = Vec::new();
        let mut tool_results: Vec<OaMessage> = Vec::new();

        for block in &msg.blocks {
            match block {
                runtime::ContentBlock::Text { text } => {
                    text_buf.push_str(text);
                }
                runtime::ContentBlock::ToolUse { id, name, input } => {
                    tool_calls.push(OaToolCall {
                        id: id.clone(),
                        kind: "function".into(),
                        function: OaFunctionCall {
                            name: name.clone(),
                            arguments: input.clone(),
                        },
                    });
                }
                runtime::ContentBlock::ToolResult {
                    tool_use_id, output, ..
                } => {
                    tool_results.push(OaMessage {
                        role: "tool".into(),
                        content: Some(output.clone()),
                        tool_calls: None,
                        tool_call_id: Some(tool_use_id.clone()),
                    });
                }
            }
        }

        if !text_buf.is_empty() || !tool_calls.is_empty() {
            result.push(OaMessage {
                role: role.to_string(),
                content: if text_buf.is_empty() {
                    None
                } else {
                    Some(text_buf)
                },
                tool_calls: if tool_calls.is_empty() {
                    None
                } else {
                    Some(tool_calls)
                },
                tool_call_id: None,
            });
        }

        // 把 tool_results 作为独立消息 append
        result.extend(tool_results);
    }
    result
}
