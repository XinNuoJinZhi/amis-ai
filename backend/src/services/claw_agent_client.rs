use anyhow::Result;
use reqwest::Client;
use serde::{Deserialize, Serialize};

#[derive(Clone)]
pub struct ClawAgentClient {
    client: Client,
    base_url: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateTaskRequest {
    pub workdir: String,
    pub sandbox_id: String,
    pub initial_message: String,
    pub model: Option<String>,
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

    pub fn events_ws_url(&self, task_id: &str) -> String {
        let ws_url = self.base_url.replace("http://", "ws://").replace("https://", "wss://");
        format!("{}/tasks/{}/events", ws_url, task_id)
    }
}
