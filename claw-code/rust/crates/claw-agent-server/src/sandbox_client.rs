use anyhow::Result;
use serde::{Deserialize, Serialize};

#[derive(Clone)]
pub struct SandboxClient {
    base_url: String,
}

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

impl SandboxClient {
    pub fn new(base_url: String) -> Self {
        Self { base_url }
    }

    pub fn create(&self, task_id: &str) -> Result<CreateSandboxResponse> {
        let url = format!("{}/sandboxes", self.base_url);
        let req = CreateSandboxRequest {
            task_id: task_id.to_string(),
        };

        let resp: CreateSandboxResponse = ureq::post(&url)
            .send_json(serde_json::to_value(&req)?)?
            .into_json()?;
        Ok(resp)
    }

    pub fn exec(&self, sandbox_id: &str, cmd: Vec<String>, cwd: Option<&str>) -> Result<ExecResult> {
        let url = format!("{}/sandboxes/{}/exec", self.base_url, sandbox_id);
        let req = ExecRequest {
            cmd,
            cwd: cwd.map(|s| s.to_string()),
        };

        let resp: ExecResult = ureq::post(&url)
            .send_json(serde_json::to_value(&req)?)?
            .into_json()?;
        Ok(resp)
    }

    pub fn dev_start(&self, sandbox_id: &str) -> Result<()> {
        let url = format!("{}/sandboxes/{}/dev-start", self.base_url, sandbox_id);
        let resp = ureq::post(&url).call()?;

        if resp.status() < 300 {
            Ok(())
        } else {
            Err(anyhow::anyhow!("Failed to start dev server: {}", resp.status()))
        }
    }

    pub fn dev_status(&self, sandbox_id: &str) -> Result<DevStatusResponse> {
        let url = format!("{}/sandboxes/{}/dev-status", self.base_url, sandbox_id);
        let resp: DevStatusResponse = ureq::get(&url).call()?.into_json()?;
        Ok(resp)
    }

    pub fn delete(&self, sandbox_id: &str) -> Result<()> {
        let url = format!("{}/sandboxes/{}", self.base_url, sandbox_id);
        let resp = ureq::delete(&url).call()?;

        if resp.status() < 300 {
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
