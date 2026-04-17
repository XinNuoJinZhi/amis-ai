use anyhow::Result;
use reqwest::Client;
use serde::{Deserialize, Serialize};

#[derive(Clone)]
pub struct SandboxClient {
    client: Client,
    base_url: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateSandboxRequest {
    pub task_id: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SandboxInfo {
    pub id: String,
    pub task_id: String,
    pub container_id: String,
    pub preview_port: u16,
    pub workdir: String,
    pub dev_status: String,
    pub recent_logs: Vec<String>,
    pub created_at: String,
}

impl SandboxClient {
    pub fn new(client: Client, base_url: String) -> Self {
        Self { client, base_url }
    }

    pub async fn create(&self, task_id: &str) -> Result<SandboxInfo> {
        let url = format!("{}/sandboxes", self.base_url);
        let req = CreateSandboxRequest {
            task_id: task_id.to_string(),
        };

        let resp = self.client.post(&url).json(&req).send().await?;

        if !resp.status().is_success() {
            let status = resp.status();
            let text = resp.text().await.unwrap_or_default();
            return Err(anyhow::anyhow!("create sandbox failed: {} {}", status, text));
        }

        Ok(resp.json::<SandboxInfo>().await?)
    }

    pub async fn delete(&self, sandbox_id: &str) -> Result<()> {
        let url = format!("{}/sandboxes/{}", self.base_url, sandbox_id);
        let resp = self.client.delete(&url).send().await?;

        if resp.status().is_success() {
            Ok(())
        } else {
            Err(anyhow::anyhow!("delete sandbox failed: {}", resp.status()))
        }
    }

    pub async fn dev_status(&self, sandbox_id: &str) -> Result<serde_json::Value> {
        let url = format!("{}/sandboxes/{}/dev-status", self.base_url, sandbox_id);
        let resp = self.client.get(&url).send().await?;
        Ok(resp.json::<serde_json::Value>().await?)
    }
}
