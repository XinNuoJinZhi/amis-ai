use anyhow::Result;
use reqwest::Client;
use serde::{Deserialize, Serialize};

#[derive(Clone)]
pub struct ClawAgentClient {
    client: Client,
    base_url: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct LlmConfig {
    pub base_url: Option<String>,
    pub api_key: Option<String>,
    pub model: String,
    /// 协议类型：openai（OpenAI Chat Completions 兼容）/ anthropic（Anthropic Messages API）
    pub protocol: String,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct CreateTaskRequest {
    pub workdir: String,
    pub sandbox_id: String,
    pub initial_message: String,
    pub model: Option<String>,
    pub tech_stack: Option<String>,
    /// 2026-04 多维选桶字段（可选；claw-agent-server 端优先用这些字段叠加 Skills 桶）
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub platform: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub tech_stacks: Option<Vec<String>>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub ui_libs: Option<Vec<String>>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub template_name: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub explicit_buckets: Option<Vec<String>>,
    pub llm_config: Option<LlmConfig>,
    pub permission_config: Option<serde_json::Value>,
    /// B.5：可选的额外 system_prompt 段（典型用途：RAG Top-K 样例）。
    /// claw-agent-server 会在 Skills 索引后面追加这些段。
    #[serde(skip_serializing_if = "Option::is_none")]
    pub extra_system_sections: Option<Vec<String>>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CreateTaskResponse {
    pub id: String,
    pub status: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AddMessageRequest {
    pub content: String,
}

impl ClawAgentClient {
    pub fn new(client: Client, base_url: String) -> Self {
        Self { client, base_url }
    }

    pub async fn create_task(&self, req: CreateTaskRequest) -> Result<CreateTaskResponse> {
        let url = format!("{}/tasks", self.base_url);
        let resp = self.client.post(&url).json(&req).send().await?;

        if !resp.status().is_success() {
            let status = resp.status();
            let text = resp.text().await.unwrap_or_default();
            return Err(anyhow::anyhow!(
                "create claw-agent task failed: {} {}",
                status,
                text
            ));
        }

        Ok(resp.json::<CreateTaskResponse>().await?)
    }

    pub async fn add_message(&self, task_id: &str, content: String) -> Result<()> {
        let url = format!("{}/tasks/{}/messages", self.base_url, task_id);
        let req = AddMessageRequest { content };

        let resp = self.client.post(&url).json(&req).send().await?;

        if resp.status().is_success() {
            Ok(())
        } else {
            Err(anyhow::anyhow!("add message failed: {}", resp.status()))
        }
    }

    pub async fn stop_task(&self, task_id: &str) -> Result<()> {
        let url = format!("{}/tasks/{}/stop", self.base_url, task_id);
        let resp = self.client.post(&url).send().await?;

        if resp.status().is_success() {
            Ok(())
        } else {
            Err(anyhow::anyhow!("stop task failed: {}", resp.status()))
        }
    }

    pub async fn send_permission_decision(
        &self,
        claw_session_id: &str,
        payload: serde_json::Value,
    ) -> Result<()> {
        let url = format!("{}/tasks/{}/permission-decision", self.base_url, claw_session_id);
        let resp = self.client.post(&url).json(&payload).send().await?;
        if resp.status().is_success() {
            Ok(())
        } else {
            Err(anyhow::anyhow!(
                "send permission decision failed: {}",
                resp.status()
            ))
        }
    }

}
