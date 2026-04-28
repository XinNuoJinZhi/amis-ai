//! POST /api/projects/tasks/:id/analyze
//!
//! 让 admin 对一个已完成/失败的反向飞轮任务做"事后复盘"：
//! - 抽取任务的 amis_json、system_prompt、触发的 Skills / RAG、Agent 的工具调用序列、最终状态
//! - 打包成 meta-prompt 交给一个"更强的 LLM"（直接走 select_default；如果当前 default 不够强
//!   admin 自己去系统设置切 provider）
//! - 解析 LLM 返回的结构化 JSON：`{overall_quality, issues[], suggested_skill_edits[], suggested_rag_samples_to_add}`
//!
//! 这是阶段 4 的"AI 分析建议"落地入口。实现上刻意保守：
//! - 同步一次性调用（非流式），简化前端集成
//! - 不引入独立的 "frontier" provider 选择，直接沿用 default（task_type 链 code_generation→generation）
//! - 分析所需的上下文**从 DB 里拿**（project_task_event 表），不依赖 sandbox 当前状态

use axum::{
    extract::{Path, State},
    http::StatusCode,
    Json,
};
use sea_orm::{ColumnTrait, EntityTrait, QueryFilter, QueryOrder};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};

use crate::entity::{project_generation_task, project_task_event, user};
use crate::services::llm_selector;
use crate::utils::jwt;
use crate::AppState;

#[derive(Debug, Serialize)]
pub struct AnalyzeResponse {
    /// 整体质量判定（优秀 / 良好 / 一般 / 较差 / 失败）
    pub overall_quality: String,
    /// 问题清单。如果 LLM 返回格式不合预期，将以单条 raw_text 呈现
    pub issues: Vec<AnalyzeIssue>,
    /// 建议给 Skills 的补丁说明（人类可读的 markdown 片段列表）
    pub suggested_skill_edits: Vec<String>,
    /// 建议加入 RAG 库的样例说明
    pub suggested_rag_samples_to_add: Option<String>,
    /// LLM 的原始 markdown 输出（即使 JSON 解析失败也可看到）
    pub raw: String,
    /// 本次分析使用的 provider / model（供审计）
    pub analyzer_provider: String,
    pub analyzer_model: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AnalyzeIssue {
    pub aspect: String,
    pub problem: String,
    pub suggestion: String,
}

/// POST /api/projects/tasks/:id/analyze
pub async fn analyze_task(
    State(state): State<AppState>,
    Path(task_id): Path<i32>,
    auth_user: jwt::AuthUser,
) -> Result<Json<AnalyzeResponse>, (StatusCode, Json<Value>)> {
    // 1. 鉴权：只有 admin 能分析
    let u = user::Entity::find()
        .filter(user::Column::Username.eq(&auth_user.username))
        .one(&state.db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({"error": format!("DB error: {}", e)}))))?
        .ok_or_else(|| (StatusCode::UNAUTHORIZED, Json(json!({"error": "用户不存在"}))))?;
    if !u.is_admin {
        return Err((StatusCode::FORBIDDEN, Json(json!({"error": "任务分析仅限管理员"}))));
    }

    // 2. 拿 task
    let task = project_generation_task::Entity::find_by_id(task_id)
        .one(&state.db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({"error": format!("DB: {}", e)}))))?
        .ok_or_else(|| (StatusCode::NOT_FOUND, Json(json!({"error": "任务不存在"}))))?;

    // 3. 拿 events，聚合关键信息
    let events = project_task_event::Entity::find()
        .filter(project_task_event::Column::TaskId.eq(task_id))
        .order_by_asc(project_task_event::Column::CreatedAt)
        .all(&state.db)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({"error": format!("events DB: {}", e)}))))?;

    let summary = summarize_events(&events);

    // 4. 组装 meta-prompt
    let meta_prompt = build_meta_prompt(&task, &summary);

    // 5. 选 LLM（沿用 select_default 链路）
    let decision = llm_selector::select_for_task(&state, u.id, &task.amis_json, Some("default"), None, None)
        .await
        .map_err(|e| (StatusCode::BAD_GATEWAY, Json(json!({"error": format!("分析 LLM 选择失败: {}", e)}))))?;

    // 6. 调 LLM（OpenAI 兼容协议，一次性）
    let raw = call_llm_chat(&state, &decision, &meta_prompt)
        .await
        .map_err(|e| (StatusCode::BAD_GATEWAY, Json(json!({"error": format!("分析 LLM 调用失败: {}", e)}))))?;

    // 7. 尝试从 raw 里抠 JSON（容忍 markdown 代码围栏），失败就 fallback 成单 raw_text
    let parsed = parse_analysis(&raw);

    Ok(Json(AnalyzeResponse {
        overall_quality: parsed.overall_quality,
        issues: parsed.issues,
        suggested_skill_edits: parsed.suggested_skill_edits,
        suggested_rag_samples_to_add: parsed.suggested_rag_samples_to_add,
        raw,
        analyzer_provider: decision.provider_name,
        analyzer_model: decision.config.model,
    }))
}

// ───────────────────────── 内部：events 汇总

#[derive(Debug, Default)]
struct TaskSummary {
    llm_provider: Option<String>,
    llm_model: Option<String>,
    capability_tier: Option<String>,
    complexity_score: Option<f32>,
    system_prompt_preview: Option<String>,
    system_prompt_length: Option<usize>,
    selected_skills: Vec<String>,
    rag_results: Vec<String>,
    tool_call_count: usize,
    tool_error_count: usize,
    final_status: Option<String>,
    last_error: Option<String>,
    /// 最近 8 次工具调用简述（用于让 LLM 看 Agent 实际路径）
    recent_tool_trace: Vec<String>,
}

fn summarize_events(events: &[project_task_event::Model]) -> TaskSummary {
    let mut s = TaskSummary::default();
    let mut tool_trace_buf: Vec<String> = Vec::new();

    for ev in events {
        let payload: Value = serde_json::from_str(&ev.payload).unwrap_or(Value::Null);
        match ev.event_type.as_str() {
            "llm_selected" => {
                s.llm_provider = payload.get("provider_name").and_then(|v| v.as_str()).map(String::from);
                s.llm_model = payload.get("model").and_then(|v| v.as_str()).map(String::from);
                s.capability_tier = payload.get("capability_tier").and_then(|v| v.as_str()).map(String::from);
                s.complexity_score = payload.get("complexity_score").and_then(|v| v.as_f64()).map(|f| f as f32);
            }
            "system_prompt_built" => {
                let data = payload.get("data").unwrap_or(&payload);
                s.system_prompt_length = data.get("prompt_length").and_then(|v| v.as_u64()).map(|u| u as usize);
                s.system_prompt_preview = data.get("prompt_preview").and_then(|v| v.as_str()).map(String::from);
            }
            "skills_loaded" => {
                let data = payload.get("data").unwrap_or(&payload);
                if let Some(arr) = data.get("selected_buckets").and_then(|v| v.as_array()) {
                    s.selected_skills = arr
                        .iter()
                        .filter_map(|b| b.get("dir_name").and_then(|v| v.as_str()).map(String::from))
                        .collect();
                }
            }
            "rag_samples_injected" => {
                let data = payload.get("data").unwrap_or(&payload);
                if let Some(arr) = data.get("results").and_then(|v| v.as_array()) {
                    s.rag_results = arr
                        .iter()
                        .filter_map(|r| {
                            let id = r.get("id").and_then(|v| v.as_i64())?;
                            let sim = r.get("similarity").and_then(|v| v.as_f64()).unwrap_or(0.0);
                            let team = r.get("source_team").and_then(|v| v.as_str()).unwrap_or("?");
                            Some(format!("#{id} team={team} sim={:.2}", sim))
                        })
                        .collect();
                }
            }
            "tool_use" => {
                s.tool_call_count += 1;
                let data = payload.get("data").unwrap_or(&payload);
                let name = data.get("name").and_then(|v| v.as_str()).unwrap_or("?");
                let input_preview: String = data
                    .get("input")
                    .and_then(|v| v.as_str())
                    .map(|s| s.chars().take(80).collect())
                    .unwrap_or_default();
                tool_trace_buf.push(format!("→ {} {}", name, input_preview));
            }
            "tool_result" => {
                let data = payload.get("data").unwrap_or(&payload);
                let is_error = data.get("is_error").and_then(|v| v.as_bool()).unwrap_or(false);
                if is_error {
                    s.tool_error_count += 1;
                    let out_preview: String = data
                        .get("output")
                        .and_then(|v| v.as_str())
                        .map(|s| s.chars().take(120).collect())
                        .unwrap_or_default();
                    if let Some(last) = tool_trace_buf.last_mut() {
                        last.push_str(&format!(" [ERR: {}]", out_preview));
                    }
                }
            }
            "status_change" => {
                s.final_status = payload.get("data").and_then(|v| v.as_str()).map(String::from);
            }
            "error_message" => {
                if let Some(msg) = payload.get("data").and_then(|v| v.as_str()) {
                    s.last_error = Some(msg.chars().take(500).collect());
                }
            }
            _ => {}
        }
    }
    // 取最后 8 条工具调用
    s.recent_tool_trace = tool_trace_buf
        .into_iter()
        .rev()
        .take(8)
        .collect::<Vec<_>>()
        .into_iter()
        .rev()
        .collect();
    s
}

// ───────────────────────── 内部：meta-prompt

fn build_meta_prompt(task: &project_generation_task::Model, summary: &TaskSummary) -> String {
    let amis_json_trunc: String = task.amis_json.chars().take(2000).collect();
    let prompt_preview = summary
        .system_prompt_preview
        .clone()
        .unwrap_or_else(|| "(未记录)".to_string());
    let trace = if summary.recent_tool_trace.is_empty() {
        "(无工具调用记录)".to_string()
    } else {
        summary.recent_tool_trace.join("\n")
    };

    format!(
        r#"你是 amis-ai 反向飞轮的"调优顾问"。请根据下面这次任务的执行记录，给 admin 一份**结构化改进建议**。

## 任务本体

- task_id: {task_id}
- status: {final_status}
- platform/stack/ui: {platform} / {tech_stack} / {ui_library}
- amis_json（截断 2KB）:

```json
{amis_json}
```

## LLM 决策

- provider: {provider} | model: {model} | tier: {tier} | complexity: {complexity}

## 触发的 Skills 桶

{skills}

## 注入的 RAG 样例

{rag}

## System Prompt 预览（前 500 字符）

```
{prompt_preview}
```

system_prompt 总长度: {prompt_length} 字符

## Agent 工具调用（最近 8 次）

```
{trace}
```

工具总调用: {tool_call_count} 次 | 失败: {tool_error_count} 次

## 最后错误

{last_error}

---

请严格按下面 JSON schema 返回分析（**只返回 JSON，用 ```json ...``` 代码块围起来**）：

```json
{{
  "overall_quality": "优秀|良好|一般|较差|失败",
  "issues": [
    {{
      "aspect": "Skills | RAG | SystemPrompt | LLM | 模板 | 工具调用 | 其他",
      "problem": "简要描述观察到的问题",
      "suggestion": "具体可执行的修改建议（越具体越好）"
    }}
  ],
  "suggested_skill_edits": [
    "具体要在哪个 skill 桶 SKILL.md 加/改什么段落的 markdown 片段"
  ],
  "suggested_rag_samples_to_add": "如果失败跟缺样例有关，这里写一段 pending 样例 markdown 供 admin 采纳参考（没必要就写 null）"
}}
```

**重要**：只返回 JSON 代码块，不要额外解释文字。"#,
        task_id = task.id,
        final_status = summary.final_status.as_deref().unwrap_or(&task.status),
        platform = if task.platform.is_empty() { "-" } else { task.platform.as_str() },
        tech_stack = task.tech_stack,
        ui_library = if task.ui_library.is_empty() { "-" } else { task.ui_library.as_str() },
        amis_json = amis_json_trunc,
        provider = summary.llm_provider.as_deref().unwrap_or("-"),
        model = summary.llm_model.as_deref().unwrap_or("-"),
        tier = summary.capability_tier.as_deref().unwrap_or("-"),
        complexity = summary.complexity_score.map(|f| format!("{:.1}", f)).unwrap_or_else(|| "-".to_string()),
        skills = if summary.selected_skills.is_empty() {
            "(未记录)".to_string()
        } else {
            summary.selected_skills.iter().map(|s| format!("- {}", s)).collect::<Vec<_>>().join("\n")
        },
        rag = if summary.rag_results.is_empty() {
            "(未命中或未记录)".to_string()
        } else {
            summary.rag_results.iter().map(|s| format!("- {}", s)).collect::<Vec<_>>().join("\n")
        },
        prompt_preview = prompt_preview,
        prompt_length = summary.system_prompt_length.map(|n| n.to_string()).unwrap_or_else(|| "-".to_string()),
        trace = trace,
        tool_call_count = summary.tool_call_count,
        tool_error_count = summary.tool_error_count,
        last_error = summary.last_error.as_deref().unwrap_or("(无错误记录)"),
    )
}

// ───────────────────────── 内部：LLM 调用

async fn call_llm_chat(
    state: &AppState,
    decision: &llm_selector::LlmDecision,
    prompt: &str,
) -> Result<String, String> {
    let base_url = decision
        .config
        .base_url
        .as_deref()
        .ok_or_else(|| "provider 缺 base_url".to_string())?;
    let api_key = decision.config.api_key.as_deref().unwrap_or("");

    // 沿用 OpenAI 兼容协议（所有 provider.protocol=openai 走这个；anthropic 留给未来再加）
    if decision.config.protocol != "openai" {
        return Err(format!(
            "暂不支持协议 `{}`（阶段 4 只实现 openai 兼容）",
            decision.config.protocol
        ));
    }

    let url = format!("{}/chat/completions", base_url.trim_end_matches('/'));
    let body = json!({
        "model": decision.config.model,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.3,
        "max_tokens": 4096,
        "stream": false,
    });

    let resp = state
        .http_client
        .post(&url)
        .header("Authorization", format!("Bearer {}", api_key))
        .header("Content-Type", "application/json")
        .json(&body)
        .timeout(std::time::Duration::from_secs(180))
        .send()
        .await
        .map_err(|e| format!("请求失败: {}", e))?;

    if !resp.status().is_success() {
        let code = resp.status().as_u16();
        let body = resp.text().await.unwrap_or_default();
        return Err(format!("HTTP {}: {}", code, body.chars().take(300).collect::<String>()));
    }

    let body: Value = resp.json().await.map_err(|e| format!("响应 JSON 解析失败: {}", e))?;
    let content = body
        .get("choices")
        .and_then(|c| c.as_array())
        .and_then(|a| a.first())
        .and_then(|c0| c0.get("message"))
        .and_then(|m| m.get("content"))
        .and_then(|s| s.as_str())
        .ok_or_else(|| "响应里没找到 choices[0].message.content".to_string())?
        .to_string();
    Ok(content)
}

// ───────────────────────── 内部：解析 LLM 输出

struct ParsedAnalysis {
    overall_quality: String,
    issues: Vec<AnalyzeIssue>,
    suggested_skill_edits: Vec<String>,
    suggested_rag_samples_to_add: Option<String>,
}

fn parse_analysis(raw: &str) -> ParsedAnalysis {
    // 尝试从 ```json ... ``` 或 ``` ... ``` 里抠
    let fenced = extract_fenced_json(raw).unwrap_or_else(|| raw.to_string());
    let v: Value = match serde_json::from_str(&fenced) {
        Ok(v) => v,
        Err(_) => {
            // 解析失败：降级为单条 raw 描述
            return ParsedAnalysis {
                overall_quality: "未知".to_string(),
                issues: vec![AnalyzeIssue {
                    aspect: "分析解析失败".to_string(),
                    problem: "LLM 返回的 JSON 无法解析".to_string(),
                    suggestion: "请查看下方 raw 字段的原始文本，或重试一次".to_string(),
                }],
                suggested_skill_edits: vec![],
                suggested_rag_samples_to_add: None,
            };
        }
    };

    let overall_quality = v
        .get("overall_quality")
        .and_then(|s| s.as_str())
        .unwrap_or("未知")
        .to_string();

    let issues = v
        .get("issues")
        .and_then(|a| a.as_array())
        .map(|arr| {
            arr.iter()
                .filter_map(|i| {
                    Some(AnalyzeIssue {
                        aspect: i.get("aspect").and_then(|v| v.as_str())?.to_string(),
                        problem: i.get("problem").and_then(|v| v.as_str())?.to_string(),
                        suggestion: i.get("suggestion").and_then(|v| v.as_str())?.to_string(),
                    })
                })
                .collect()
        })
        .unwrap_or_default();

    let suggested_skill_edits = v
        .get("suggested_skill_edits")
        .and_then(|a| a.as_array())
        .map(|arr| arr.iter().filter_map(|s| s.as_str().map(String::from)).collect())
        .unwrap_or_default();

    let suggested_rag_samples_to_add = v
        .get("suggested_rag_samples_to_add")
        .and_then(|s| s.as_str())
        .filter(|s| !s.is_empty() && *s != "null")
        .map(String::from);

    ParsedAnalysis {
        overall_quality,
        issues,
        suggested_skill_edits,
        suggested_rag_samples_to_add,
    }
}

/// 抠出 ```json ... ``` 或 ``` ... ``` 里的内容。没有围栏时返回 None。
fn extract_fenced_json(raw: &str) -> Option<String> {
    if let Some(start) = raw.find("```json") {
        let after = &raw[start + 7..];
        if let Some(end) = after.find("```") {
            return Some(after[..end].trim().to_string());
        }
    }
    // 兜底：普通 ``` 围栏
    if let Some(start) = raw.find("```") {
        let after = &raw[start + 3..];
        // 跳过可能的 "json\n" 行首
        let after_lang = after
            .find('\n')
            .map(|p| &after[p + 1..])
            .unwrap_or(after);
        if let Some(end) = after_lang.find("```") {
            return Some(after_lang[..end].trim().to_string());
        }
    }
    None
}
