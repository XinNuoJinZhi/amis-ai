use anyhow::Result;
use reqwest::blocking::Client;
use serde::{Deserialize, Serialize};
use std::time::Duration;

#[derive(Clone)]
pub struct SandboxClient {
    client: Client,
    base_url: String,
}

// 请求/响应结构体
#[derive(Debug, Serialize, Deserialize)]
pub struct CreateSandboxRequest {
    pub task_id: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CreateSandboxResponse {
    pub id: String,
    pub task_id: String,
    pub container_id: String,
    pub preview_port: u16,
    pub workdir: String,
    pub dev_status: String,
    pub recent_logs: Vec<String>,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ExecRequest {
    pub cmd: Vec<String>,
    pub cwd: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ExecResult {
    pub stdout: String,
    pub stderr: String,
    pub exit_code: i32,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DevStatusResponse {
    pub dev_status: serde_json::Value,
    pub recent_logs: Vec<String>,
    pub preview_port: u16,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DeleteResponse {
    pub message: String,
    pub sandbox_id: String,
}

impl SandboxClient {
    pub fn new(base_url: String) -> Self {
        let client = Client::builder()
            .timeout(Duration::from_secs(30))
            .build()
            .unwrap_or_else(|_| Client::new());

        Self { client, base_url }
    }

    pub fn create(&self, task_id: &str) -> Result<CreateSandboxResponse> {
        let url = format!("{}/sandboxes", self.base_url);
        let req = CreateSandboxRequest {
            task_id: task_id.to_string(),
        };

        let resp = self.client.post(&url).json(&req).send()?;
        resp.json::<CreateSandboxResponse>().map_err(Into::into)
    }

    pub fn exec(&self, sandbox_id: &str, cmd: Vec<String>, cwd: Option<&str>) -> Result<ExecResult> {
        let url = format!("{}/sandboxes/{}/exec", self.base_url, sandbox_id);
        let req = ExecRequest {
            cmd,
            cwd: cwd.map(|s| s.to_string()),
        };

        let resp = self.client.post(&url).json(&req).send()?;
        resp.json::<ExecResult>().map_err(Into::into)
    }

    pub fn dev_start(&self, sandbox_id: &str) -> Result<()> {
        let url = format!("{}/sandboxes/{}/dev-start", self.base_url, sandbox_id);
        let resp = self.client.post(&url).send()?;

        if resp.status().is_success() {
            Ok(())
        } else {
            Err(anyhow::anyhow!("Failed to start dev server: {}", resp.status()))
        }
    }

    pub fn dev_status(&self, sandbox_id: &str) -> Result<DevStatusResponse> {
        let url = format!("{}/sandboxes/{}/dev-status", self.base_url, sandbox_id);
        let resp = self.client.get(&url).send()?;
        resp.json::<DevStatusResponse>().map_err(Into::into)
    }

    pub fn delete(&self, sandbox_id: &str) -> Result<()> {
        let url = format!("{}/sandboxes/{}", self.base_url, sandbox_id);
        let resp = self.client.delete(&url).send()?;

        if resp.status().is_success() {
            Ok(())
        } else {
            Err(anyhow::anyhow!("Failed to delete sandbox: {}", resp.status()))
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_sandbox_client_creation() {
        let client = SandboxClient::new("http://localhost:8091".to_string());
        assert_eq!(client.base_url, "http://localhost:8091");
    }

    #[test]
    fn test_exec_result_serialization() {
        let result = ExecResult {
            stdout: "hello".to_string(),
            stderr: "".to_string(),
            exit_code: 0,
        };
        let json = serde_json::to_string(&result).unwrap();
        assert!(json.contains("hello"));
        assert!(json.contains("\"exit_code\":0"));
    }
}
