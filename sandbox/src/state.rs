use crate::docker::DockerClient;
use crate::port_pool::PortPool;
use serde::Serialize;
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum DevStatus {
    NotStarted,
    Starting,
    Ready { url: String },
    Failed { reason: String },
}

#[derive(Clone, Debug, Serialize)]
pub struct Sandbox {
    pub id: String,
    pub task_id: String,
    pub container_id: String,
    pub preview_port: u16,
    pub workdir: String,
    pub dev_status: DevStatus,
    pub recent_logs: Vec<String>,
    pub created_at: chrono::DateTime<chrono::Utc>,
}

pub struct AppState {
    pub docker: DockerClient,
    pub port_pool: Arc<PortPool>,
    pub workdir_root: String,
    pub sandboxes: RwLock<HashMap<String, Sandbox>>,
}

pub type SharedState = Arc<AppState>;

pub const MAX_RECENT_LOGS: usize = 200;

impl Sandbox {
    pub fn push_log(&mut self, line: String) {
        if self.recent_logs.len() >= MAX_RECENT_LOGS {
            self.recent_logs.remove(0);
        }
        self.recent_logs.push(line);
    }
}
