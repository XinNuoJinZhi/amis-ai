use bollard::container::{
    Config, CreateContainerOptions, RemoveContainerOptions, StartContainerOptions,
};
use bollard::models::{HostConfig, Mount, MountTypeEnum, PortBinding, PortMap, RestartPolicy, RestartPolicyNameEnum};
use bollard::Docker;
use std::collections::HashMap;
use thiserror::Error;

#[derive(Debug, Clone, serde::Serialize)]
pub struct ExecResult {
    pub stdout: String,
    pub stderr: String,
    pub exit_code: i32,
}

#[derive(Debug, Error)]
pub enum DockerError {
    #[error("docker api: {0}")]
    Api(#[from] bollard::errors::Error),
}

#[derive(Clone)]
pub struct DockerClient {
    inner: Docker,
    image: String,
    pnpm_store: String,
    /// 容器/exec 身份 UID（与宿主机的 uid 对齐，避免 root-owned 目录阻塞 std::fs::write）
    host_uid: u32,
    /// 容器/exec 身份 GID
    host_gid: u32,
}

pub struct CreateOpts<'a> {
    pub task_id: &'a str,
    pub host_workdir: &'a str,
    pub preview_port: u16,
}

impl DockerClient {
    pub fn connect(image: impl Into<String>, pnpm_store: impl Into<String>) -> Result<Self, DockerError> {
        let inner = Docker::connect_with_local_defaults()?;
        let host_uid = std::env::var("SANDBOX_CONTAINER_UID")
            .ok()
            .and_then(|s| s.parse::<u32>().ok())
            .unwrap_or(1000);
        let host_gid = std::env::var("SANDBOX_CONTAINER_GID")
            .ok()
            .and_then(|s| s.parse::<u32>().ok())
            .unwrap_or(1000);
        Ok(Self {
            inner,
            image: image.into(),
            pnpm_store: pnpm_store.into(),
            host_uid,
            host_gid,
        })
    }

    pub async fn create_and_start(&self, opts: CreateOpts<'_>) -> Result<String, DockerError> {
        let name = format!("amis-ai-sandbox-{}", opts.task_id);

        let mut port_bindings: PortMap = HashMap::new();
        port_bindings.insert(
            "5173/tcp".to_string(),
            Some(vec![PortBinding {
                host_ip: Some("127.0.0.1".to_string()),
                host_port: Some(opts.preview_port.to_string()),
            }]),
        );

        let mounts = vec![
            Mount {
                target: Some("/workspace".to_string()),
                source: Some(opts.host_workdir.to_string()),
                typ: Some(MountTypeEnum::BIND),
                read_only: Some(false),
                ..Default::default()
            },
            Mount {
                target: Some("/root/.local/share/pnpm/store".to_string()),
                source: Some(self.pnpm_store.clone()),
                typ: Some(MountTypeEnum::BIND),
                read_only: Some(false),
                ..Default::default()
            },
        ];

        let host_config = HostConfig {
            mounts: Some(mounts),
            port_bindings: Some(port_bindings),
            memory: Some(1024 * 1024 * 1024), // 1GB
            nano_cpus: Some(1_000_000_000),    // 1 CPU
            restart_policy: Some(RestartPolicy {
                name: Some(RestartPolicyNameEnum::NO),
                maximum_retry_count: None,
            }),
            ..Default::default()
        };

        let mut exposed: HashMap<String, HashMap<(), ()>> = HashMap::new();
        exposed.insert("5173/tcp".to_string(), HashMap::new());

        let config = Config {
            image: Some(self.image.clone()),
            working_dir: Some("/workspace".to_string()),
            host_config: Some(host_config),
            exposed_ports: Some(exposed),
            // 以宿主机 UID:GID 启动容器，避免容器创建的文件在宿主机是 root-owned 而 karl 写不进去
            user: Some(format!("{}:{}", self.host_uid, self.host_gid)),
            env: Some(vec![
                // 镜像里 pnpm 全局 bin 装在 /root/.local/share/pnpm，默认 755，非 root 能读能执行但不能写
                // 把 HOME 指到可写区，让 pnpm 的状态文件（.pnpm/locks、store-v3 等）不再试图写 /root
                "HOME=/tmp".to_string(),
                "PNPM_HOME=/tmp/.pnpm".to_string(),
                "PATH=/root/.local/share/pnpm:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin".to_string(),
            ]),
            ..Default::default()
        };

        let created = self
            .inner
            .create_container(
                Some(CreateContainerOptions {
                    name: name.clone(),
                    platform: None,
                }),
                config,
            )
            .await?;

        self.inner
            .start_container(&created.id, None::<StartContainerOptions<String>>)
            .await?;

        Ok(created.id)
    }

    pub async fn remove(&self, container_id: &str) -> Result<(), DockerError> {
        self.inner
            .remove_container(
                container_id,
                Some(RemoveContainerOptions {
                    force: true,
                    v: true,
                    ..Default::default()
                }),
            )
            .await?;
        Ok(())
    }

    pub async fn exec(
        &self,
        container_id: &str,
        cmd: Vec<String>,
        cwd: Option<String>,
    ) -> Result<ExecResult, DockerError> {
        use bollard::exec::{CreateExecOptions, StartExecResults};
        use futures_util::StreamExt;

        let exec = self
            .inner
            .create_exec(
                container_id,
                CreateExecOptions {
                    cmd: Some(cmd),
                    attach_stdout: Some(true),
                    attach_stderr: Some(true),
                    working_dir: cwd,
                    // 显式传 user：避免 bash mkdir/touch 创建 root-owned 目录，
                    // 与容器启动身份保持一致
                    user: Some(format!("{}:{}", self.host_uid, self.host_gid)),
                    ..Default::default()
                },
            )
            .await?;

        let mut stdout = String::new();
        let mut stderr = String::new();

        if let StartExecResults::Attached { mut output, .. } =
            self.inner.start_exec(&exec.id, None).await?
        {
            while let Some(Ok(msg)) = output.next().await {
                use bollard::container::LogOutput::*;
                match msg {
                    StdOut { message } => stdout.push_str(&String::from_utf8_lossy(&message)),
                    StdErr { message } => stderr.push_str(&String::from_utf8_lossy(&message)),
                    Console { message } => stdout.push_str(&String::from_utf8_lossy(&message)),
                    StdIn { .. } => {}
                }
            }
        }

        let inspect = self.inner.inspect_exec(&exec.id).await?;
        let exit_code = inspect.exit_code.unwrap_or(0) as i32;
        Ok(ExecResult { stdout, stderr, exit_code })
    }

    pub fn raw(&self) -> &Docker {
        &self.inner
    }
}
