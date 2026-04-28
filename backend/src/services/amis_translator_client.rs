//! 2026-04-25：amis-translator 客户端 —— 调 Python agent 的
//! `POST /internal/translate-amis`，把 Amis JSON 确定性翻译成业务代码。
//!
//! 详见 docs/architecture/amis-translator-pipeline.md。

use anyhow::Result;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::collections::HashMap;

/// 翻译请求体（与 agent 端 amis_translator.models.TranslateRequest 一致）。
#[derive(Debug, Serialize)]
pub struct TranslateRequest<'a> {
    pub amis_json: Value,
    pub ui_lib: &'a str,
    pub tech_stack: &'a str,
    pub platform: &'a str,
    pub current_pages_json: Option<Value>,
}

/// 翻译响应体。
#[derive(Debug, Deserialize)]
pub struct TranslateResponse {
    /// API contract：agent 端固定返回；当前 backend 不消费但保留语义（dead_code 抑制）。
    #[allow(dead_code)]
    pub success: bool,
    pub fully_supported: bool,
    #[serde(default)]
    pub files: HashMap<String, String>,
    #[serde(default)]
    pub unsupported_types: Vec<String>,
    #[serde(default)]
    pub notes: Vec<String>,
}

/// 调用 agent 的 /internal/translate-amis。
///
/// 参数：
/// - `agent_url`：agent base URL（如 `http://localhost:8000`，从 env AGENT_URL 读）
/// - `internal_key`：`X-Internal-Key` header 值
///
/// 失败时返回 Err；成功时返回 TranslateResponse（即使 fully_supported=false）。
pub async fn translate(
    http_client: &reqwest::Client,
    agent_url: &str,
    internal_key: &str,
    req: &TranslateRequest<'_>,
) -> Result<TranslateResponse> {
    let url = format!("{}/internal/translate-amis", agent_url);
    let resp = http_client
        .post(&url)
        .header("X-Internal-Key", internal_key)
        .json(req)
        .send()
        .await?;
    let status = resp.status();
    let text = resp.text().await.unwrap_or_default();
    if !status.is_success() {
        return Err(anyhow::anyhow!(
            "translate-amis HTTP {}：{}",
            status,
            text
        ));
    }
    let parsed: TranslateResponse = serde_json::from_str(&text)
        .map_err(|e| anyhow::anyhow!("translate-amis 返回解析失败: {} body={}", e, text))?;
    Ok(parsed)
}
