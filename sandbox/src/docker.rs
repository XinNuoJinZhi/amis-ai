use bollard::container::{
    Config, CreateContainerOptions, RemoveContainerOptions, StartContainerOptions,
};
use bollard::models::{HostConfig, Mount, MountTypeEnum, PortBinding, PortMap, RestartPolicy, RestartPolicyNameEnum};
use bollard::Docker;
use std::collections::HashMap;
use thiserror::Error;

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
}

pub struct CreateOpts<'a> {
    pub task_id: &'a str,
    pub host_workdir: &'a str,
    pub preview_port: u16,
}

impl DockerClient {
    pub fn connect(image: impl Into<String>, pnpm_store: impl Into<String>) -> Result<Self, DockerError> {
        let inner = Docker::connect_with_local_defaults()?;
        Ok(Self {
            inner,
            image: image.into(),
            pnpm_store: pnpm_store.into(),
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

    pub fn raw(&self) -> &Docker {
        &self.inner
    }
}
