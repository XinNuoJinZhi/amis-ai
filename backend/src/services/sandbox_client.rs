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
    /// 2026-04：dev server 启动命令（由 template_registry 决定；None 则 sandbox 用默认 `pnpm run dev:h5`）
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub dev_command: Option<String>,
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

    /// 2026-04：允许 backend 在创建沙箱时下发 `dev_command`（由 template_registry 决定）。
    /// 旧的 `create()` 兼容包装已删（无人使用），调用方一律走 `create_with`。
    pub async fn create_with(&self, task_id: &str, dev_command: Option<String>) -> Result<SandboxInfo> {
        let url = format!("{}/sandboxes", self.base_url);
        let req = CreateSandboxRequest {
            task_id: task_id.to_string(),
            dev_command,
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

    /// 启动沙箱里的 dev server（不带 LLM 路径——翻译器分支专用）。
    /// dev_command 在沙箱创建时已通过 create_with 注入，这里只触发执行。
    pub async fn dev_start(&self, sandbox_id: &str) -> Result<serde_json::Value> {
        let url = format!("{}/sandboxes/{}/dev-start", self.base_url, sandbox_id);
        let resp = self.client.post(&url).send().await?;
        let status = resp.status();
        let text = resp.text().await.unwrap_or_default();
        if !status.is_success() {
            return Err(anyhow::anyhow!("dev_start failed: {} {}", status, text));
        }
        Ok(serde_json::from_str(&text)
            .unwrap_or(serde_json::json!({"raw": text})))
    }

    // ───────── IDE 文件系统透传 ─────────

    pub async fn fs_tree(&self, sandbox_id: &str, depth: Option<usize>) -> Result<serde_json::Value> {
        let mut url = format!("{}/sandboxes/{}/fs/tree", self.base_url, sandbox_id);
        if let Some(d) = depth {
            url.push_str(&format!("?depth={}", d));
        }
        let resp = self.client.get(&url).send().await?;
        let status = resp.status();
        let text = resp.text().await.unwrap_or_default();
        if !status.is_success() {
            return Err(anyhow::anyhow!("fs_tree failed: {} {}", status, text));
        }
        Ok(serde_json::from_str(&text)?)
    }

    pub async fn fs_read(&self, sandbox_id: &str, path: &str) -> Result<serde_json::Value> {
        let url = format!("{}/sandboxes/{}/fs/file", self.base_url, sandbox_id);
        let resp = self.client.get(&url).query(&[("path", path)]).send().await?;
        let status = resp.status();
        let text = resp.text().await.unwrap_or_default();
        if !status.is_success() {
            return Err(anyhow::anyhow!("fs_read failed: {} {}", status, text));
        }
        Ok(serde_json::from_str(&text)?)
    }

    pub async fn fs_write(
        &self,
        sandbox_id: &str,
        body: &serde_json::Value,
    ) -> Result<(reqwest::StatusCode, serde_json::Value)> {
        let url = format!("{}/sandboxes/{}/fs/file", self.base_url, sandbox_id);
        let resp = self.client.put(&url).json(body).send().await?;
        let status = resp.status();
        let text = resp.text().await.unwrap_or_default();
        let body = serde_json::from_str(&text).unwrap_or(serde_json::json!({"raw": text}));
        Ok((status, body))
    }

    pub async fn fs_delete(&self, sandbox_id: &str, path: &str) -> Result<serde_json::Value> {
        let url = format!("{}/sandboxes/{}/fs/file", self.base_url, sandbox_id);
        let resp = self.client.delete(&url).query(&[("path", path)]).send().await?;
        let status = resp.status();
        let text = resp.text().await.unwrap_or_default();
        if !status.is_success() {
            return Err(anyhow::anyhow!("fs_delete failed: {} {}", status, text));
        }
        Ok(serde_json::from_str(&text)?)
    }

    pub async fn fs_mkdir(
        &self,
        sandbox_id: &str,
        body: &serde_json::Value,
    ) -> Result<serde_json::Value> {
        let url = format!("{}/sandboxes/{}/fs/mkdir", self.base_url, sandbox_id);
        let resp = self.client.post(&url).json(body).send().await?;
        let status = resp.status();
        let text = resp.text().await.unwrap_or_default();
        if !status.is_success() {
            return Err(anyhow::anyhow!("fs_mkdir failed: {} {}", status, text));
        }
        Ok(serde_json::from_str(&text)?)
    }
}
