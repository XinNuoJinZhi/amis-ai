# amis-ai 反向代码生成飞轮 · 实施计划

> ⚠️ **2026-04-22 状态更新**：
> - **Section 0–3** 已落地（沙箱、claw-agent-server、backend 任务编排）
> - **Section 4（Task 4.1–4.4）** 已落地（脚手架占位 + 6 份 Skills markdown）
> - **Section 4 后半（Task 4.5–4.8）+ Section 5 + Section 6** 已被 [`misty-beaming-mango.md`](/home/karl/.claude/plans/misty-beaming-mango.md) **完全替代实现**：
>   - 4.5 backend `include_str!` 静态注入 → **砍掉**，改成运行时读 + Skills 管理 UI（在线编辑）
>   - 4.6 `code_sample` 表 → **完成 + 维度升级**（pgvector(2560)，对齐 qwen3-embedding:4b）
>   - 4.7 Python `/internal/index-code-sample` → **完成 + 加 search-code-samples + probe-embedding-dim**
>   - 4.8 `POST /api/projects/tasks/:id/adopt` → **完成 + 增加自动从 sandbox 收集代码**
>   - Section 6 端到端 → **完成**（[smoke-test.sh](../shared/scripts/smoke-test.sh) 26 项 + [regression-checklist.md](../regression-checklist.md)）
> - 同时新增了原 plan 没有的：标准 Skills 协议（progressive disclosure）、RBAC、嵌套菜单 UI、卡片列表、ZC Amis 多源插件机制（symlink）、维度兼容性探测 UI
> - 详见 [CLAUDE.md "2026-04-22 大升级"](../../CLAUDE.md) 段落

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 基于已批准的设计规格 `/home/karl/.claude/plans/mossy-tinkering-forest.md`，实现"Amis JSON → UniApp+Wot UI H5 项目"的反向代码生成闭环：沙箱执行、claw-code 服务化、任务编排、知识库三层、前端工作台。

**Architecture:** 新增两个独立 Rust 服务（`sandbox-service` 8091、`claw-agent-server` 8090），现有 `backend`（8080）升级为任务编排层；知识库用"脚手架模板 + Skills Markdown + pgvector RAG"三层结构；前端新增 `/projects` 工作台。claw-code 零侵入，仅以 workspace crate 形式包装其 `runtime/tools/api`。

**Tech Stack:** Rust (Axum 0.7 / SeaORM 0.12 / Bollard 0.17 / tokio / tokio-tungstenite) / PostgreSQL 16 + pgvector / Docker / React 18 + Ant Design 5 / Node 20 + pnpm / UniApp + Wot UI。

**Testing Strategy:** 务实 TDD——纯算法型代码（端口池、日志正则、Amis 摘要生成）写 Rust 单元测试；HTTP 端点用 `curl` 命令 + 完整预期输出作为 commit gate。

---

## 执行顺序概览

```
Section 0  ── 环境准备（目录、gitignore、env）
    ↓
Section 1  ── 沙箱基础设施（Dockerfile + sandbox-service）
    ↓
Section 2  ── claw-agent-server（包装 claw-code runtime）
    ↓
Section 3  ── Backend 任务编排层（3 张新表 + 路由 + WS）
    ↓
Section 4  ── 知识库三层（脚手架模板 + Skills + code_sample RAG）
    ↓
Section 5  ── 前端工作台（/projects + Chat 入口）
    ↓
Section 6  ── 端到端联调验证
```

每个 Section 结束时得到一个"独立可验证"的里程碑（curl 可调、容器能跑、前端能看）。

---

## 规约速查

- **git commit 约定**：类型前缀遵循现有仓库习惯（`feat:` / `fix:` / `chore:` / `docs:`），中文正文，短小聚焦
- **环境变量**：敏感值走 `.env`，非敏感默认值写进代码
- **Rust 代码风格**：`cargo fmt` + `cargo clippy`，handler 返回 `impl IntoResponse`
- **文件路径**：所有路径都是相对仓库根 `/home/karl/Working/TianXing/amis-ai/` 的绝对路径写法
- **"Expected output" 约定**：给出的是成功场景的核心字段；允许时间戳/ID 有差异

---

# Section 0 · 环境准备

## Task 0.1：新增宿主机目录与 .gitignore 排除

**Files:**
- Modify: `.gitignore`

- [ ] **Step 1: 创建宿主机目录**

执行（一次性手动动作，非 git 受控）：

```bash
sudo mkdir -p /var/amis-ai/repos /var/amis-ai/workdirs /var/amis-ai/pnpm-store
sudo chown -R "$(whoami)":"$(whoami)" /var/amis-ai
```

Expected: 三个目录存在且当前用户可写。

- [ ] **Step 2: 在 .gitignore 末尾追加沙箱与 plan 相关忽略**

在现有 `.gitignore` 末尾（第 51 行之后）追加：

```gitignore

# 代码生成任务产物（本地工作区）
/var/amis-ai/
sandbox/target/
claw-code/rust/target/

# plan 本地副本（如果 engineer 另存）
docs/plans/*.local.md
```

- [ ] **Step 3: 验证 .gitignore**

Run:
```bash
git check-ignore -v sandbox/target/x
git check-ignore -v docs/plans/foo.local.md
```

Expected: 两行都输出 `.gitignore:` 行号和对应规则。

- [ ] **Step 4: Commit**

```bash
git add .gitignore
git commit -m "chore: 预留反向代码生成所需的忽略规则"
```

---

## Task 0.2：新增公共 .env 示例变量

**Files:**
- Modify: `.env.example`

- [ ] **Step 1: 读取当前 .env.example**

Run:
```bash
cat .env.example
```

Expected: 看到现有的变量列表。

- [ ] **Step 2: 在 .env.example 末尾追加以下变量**

```env

# --- 反向代码生成 ---
# claw-agent-server
CLAW_AGENT_URL=http://localhost:8090
CLAW_AGENT_SESSION_DIR=/var/amis-ai/claw-sessions

# sandbox-service
SANDBOX_SERVICE_URL=http://localhost:8091
SANDBOX_IMAGE=amis-ai-sandbox:uniapp-node20
SANDBOX_PORT_RANGE_START=20000
SANDBOX_PORT_RANGE_END=21000
SANDBOX_WORKDIR_ROOT=/var/amis-ai/workdirs
SANDBOX_REPO_ROOT=/var/amis-ai/repos
SANDBOX_PNPM_STORE=/var/amis-ai/pnpm-store

# 脚手架模板
SCAFFOLD_UNIAPP_WOT_REPO=/home/karl/Working/TianXing/amis-ai/scaffolds/uniapp-wot-h5-template
```

- [ ] **Step 3: Commit**

```bash
git add .env.example
git commit -m "chore: 在 .env.example 加入反向生成所需环境变量"
```

---

# Section 1 · 沙箱基础设施

**里程碑验收标准**：
- `docker build` 能产出 `amis-ai-sandbox:uniapp-node20` 镜像
- `sandbox-service` 8091 端口独立启动
- `curl POST /sandboxes` 拉起容器并返回预览端口
- `curl POST /sandboxes/:id/exec` 能在容器内执行命令并返回 stdout
- `curl POST /sandboxes/:id/dev-start` 启动 Vite dev server 并能通过 `GET /dev-status` 看到 ready 状态
- `DELETE /sandboxes/:id` 能干净销毁容器并回收端口

---

## Task 1.1：创建沙箱 Docker 镜像 Dockerfile

**Files:**
- Create: `shared/docker/sandbox/uniapp-node20/Dockerfile`
- Create: `shared/docker/sandbox/uniapp-node20/.dockerignore`

- [ ] **Step 1: 创建 Dockerfile**

文件 `shared/docker/sandbox/uniapp-node20/Dockerfile`：

```dockerfile
FROM node:20-alpine

RUN apk add --no-cache git bash curl ca-certificates tini

# 启用 corepack 以便使用 pnpm
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

# 默认工作目录
WORKDIR /workspace

# pnpm store 指向挂载点
ENV PNPM_HOME=/root/.local/share/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN mkdir -p $PNPM_HOME

# 预装 UniApp CLI
RUN pnpm config set store-dir /root/.local/share/pnpm/store && \
    pnpm add -g @dcloudio/uvm

# Vite dev server 默认端口
ENV VITE_PORT=5173

# tini 作为 PID 1，避免僵尸进程
ENTRYPOINT ["/sbin/tini", "--"]

# 默认命令：保持容器运行，等待 docker exec
CMD ["sh", "-c", "while true; do sleep 3600; done"]
```

- [ ] **Step 2: 创建 .dockerignore**

文件 `shared/docker/sandbox/uniapp-node20/.dockerignore`：

```
node_modules
.git
target
dist
```

- [ ] **Step 3: 构建镜像**

Run:
```bash
docker build -t amis-ai-sandbox:uniapp-node20 shared/docker/sandbox/uniapp-node20/
```

Expected: 最后一行包含 `Successfully tagged amis-ai-sandbox:uniapp-node20`。

- [ ] **Step 4: 冒烟测试镜像**

Run:
```bash
docker run --rm amis-ai-sandbox:uniapp-node20 sh -c "node -v && pnpm -v && git --version"
```

Expected:
```
v20.xx.x
9.15.0
git version 2.x.x
```

- [ ] **Step 5: Commit**

```bash
git add shared/docker/sandbox/uniapp-node20/
git commit -m "feat: 新增 UniApp 沙箱基础镜像（node20 + pnpm 9 + git）"
```

---

## Task 1.2：创建 sandbox crate 骨架

**Files:**
- Create: `sandbox/Cargo.toml`
- Create: `sandbox/src/main.rs`
- Create: `sandbox/README.md`

- [ ] **Step 1: 创建 Cargo.toml**

文件 `sandbox/Cargo.toml`：

```toml
[package]
name = "amis-ai-sandbox"
version = "0.1.0"
edition = "2021"

[[bin]]
name = "sandbox-service"
path = "src/main.rs"

[dependencies]
axum = { version = "0.7", features = ["ws"] }
tokio = { version = "1.0", features = ["full"] }
tokio-stream = "0.1"
tower-http = { version = "0.5", features = ["cors", "trace"] }
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
tracing = "0.1"
tracing-subscriber = { version = "0.3", features = ["env-filter"] }
dotenvy = "0.15"
thiserror = "1.0"
anyhow = "1.0"
uuid = { version = "1.7", features = ["v4", "serde"] }
bollard = "0.17"
futures-util = "0.3"
regex = "1.10"
once_cell = "1.19"
chrono = { version = "0.4", features = ["serde"] }
bytes = "1.5"

[dev-dependencies]
```

- [ ] **Step 2: 创建最小 main.rs 骨架**

文件 `sandbox/src/main.rs`：

```rust
use axum::{routing::get, Router};
use std::net::SocketAddr;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    dotenvy::dotenv().ok();

    tracing_subscriber::registry()
        .with(tracing_subscriber::EnvFilter::new(
            std::env::var("RUST_LOG").unwrap_or_else(|_| "info,sandbox=debug".to_string()),
        ))
        .with(tracing_subscriber::fmt::layer())
        .init();

    let app = Router::new().route("/health", get(health));

    let addr: SocketAddr = "0.0.0.0:8091".parse()?;
    let listener = tokio::net::TcpListener::bind(addr).await?;
    tracing::info!("🧪 sandbox-service 已启动，监听 {}", addr);
    axum::serve(listener, app).await?;
    Ok(())
}

async fn health() -> &'static str {
    "ok"
}
```

- [ ] **Step 3: 创建 README**

文件 `sandbox/README.md`：

```markdown
# sandbox-service

沙箱执行服务。负责：
- Docker 容器生命周期（基于镜像 `amis-ai-sandbox:uniapp-node20`）
- 命令执行与日志流
- Vite dev server 启动 / ready 判定
- 预览端口池（20000-21000）管理

## 启动

```bash
cd sandbox
cargo run --bin sandbox-service
```

端口：`8091`
```

- [ ] **Step 4: 验证 crate 编译**

Run:
```bash
cd sandbox && cargo build
```

Expected: `Compiling amis-ai-sandbox ... Finished ... target(s)`，无错误。

- [ ] **Step 5: 冒烟测试健康检查**

Run（另开一个终端）:
```bash
cd sandbox && cargo run --bin sandbox-service &
sleep 2
curl -s http://localhost:8091/health
kill %1
```

Expected: `ok`

- [ ] **Step 6: Commit**

```bash
git add sandbox/
git commit -m "feat: 新建 sandbox-service crate 骨架（axum + bollard）"
```

---

## Task 1.3：端口池分配器（含单元测试）

**Files:**
- Create: `sandbox/src/port_pool.rs`
- Modify: `sandbox/src/main.rs`

- [ ] **Step 1: 写失败的单元测试**

文件 `sandbox/src/port_pool.rs`：

```rust
use std::collections::HashSet;
use std::sync::Mutex;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum PortPoolError {
    #[error("端口池已耗尽")]
    Exhausted,
    #[error("端口 {0} 不属于本池或未被分配")]
    NotAllocated(u16),
}

pub struct PortPool {
    range: std::ops::Range<u16>,
    allocated: Mutex<HashSet<u16>>,
}

impl PortPool {
    pub fn new(start: u16, end: u16) -> Self {
        assert!(start < end, "start 必须小于 end");
        Self {
            range: start..end,
            allocated: Mutex::new(HashSet::new()),
        }
    }

    pub fn allocate(&self) -> Result<u16, PortPoolError> {
        let mut set = self.allocated.lock().unwrap();
        for port in self.range.clone() {
            if !set.contains(&port) {
                set.insert(port);
                return Ok(port);
            }
        }
        Err(PortPoolError::Exhausted)
    }

    pub fn release(&self, port: u16) -> Result<(), PortPoolError> {
        let mut set = self.allocated.lock().unwrap();
        if !self.range.contains(&port) || !set.remove(&port) {
            return Err(PortPoolError::NotAllocated(port));
        }
        Ok(())
    }

    pub fn in_use(&self) -> usize {
        self.allocated.lock().unwrap().len()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn allocate_and_release_roundtrip() {
        let pool = PortPool::new(20000, 20003);
        let a = pool.allocate().unwrap();
        let b = pool.allocate().unwrap();
        assert_ne!(a, b);
        assert_eq!(pool.in_use(), 2);
        pool.release(a).unwrap();
        assert_eq!(pool.in_use(), 1);
    }

    #[test]
    fn allocate_exhaustion_returns_error() {
        let pool = PortPool::new(20000, 20002);
        assert_eq!(pool.allocate().unwrap(), 20000);
        assert_eq!(pool.allocate().unwrap(), 20001);
        assert!(matches!(pool.allocate(), Err(PortPoolError::Exhausted)));
    }

    #[test]
    fn release_out_of_range_returns_error() {
        let pool = PortPool::new(20000, 20010);
        assert!(matches!(pool.release(12345), Err(PortPoolError::NotAllocated(12345))));
    }

    #[test]
    fn release_not_allocated_returns_error() {
        let pool = PortPool::new(20000, 20010);
        assert!(matches!(pool.release(20005), Err(PortPoolError::NotAllocated(20005))));
    }
}
```

- [ ] **Step 2: 在 main.rs 里声明 mod 但暂不使用**

在 `sandbox/src/main.rs` 的 `use` 之后添加：

```rust
mod port_pool;
```

- [ ] **Step 3: 运行测试确认通过**

Run:
```bash
cd sandbox && cargo test --lib port_pool
```

Expected:
```
running 4 tests
test port_pool::tests::allocate_and_release_roundtrip ... ok
test port_pool::tests::allocate_exhaustion_returns_error ... ok
test port_pool::tests::release_out_of_range_returns_error ... ok
test port_pool::tests::release_not_allocated_returns_error ... ok

test result: ok. 4 passed; 0 failed
```

- [ ] **Step 4: Commit**

```bash
git add sandbox/src/port_pool.rs sandbox/src/main.rs
git commit -m "feat(sandbox): 实现端口池分配器并通过单元测试"
```

---

## Task 1.4：Docker 客户端封装（创建/删除容器）

**Files:**
- Create: `sandbox/src/docker.rs`
- Modify: `sandbox/src/main.rs`

- [ ] **Step 1: 实现 docker.rs**

文件 `sandbox/src/docker.rs`：

```rust
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
```

- [ ] **Step 2: 在 main.rs 声明 mod**

在 `sandbox/src/main.rs` 现有 `mod port_pool;` 之后追加：

```rust
mod docker;
```

- [ ] **Step 3: 编译验证**

Run:
```bash
cd sandbox && cargo build
```

Expected: 编译通过，`warning` 可接受（未使用代码）。

- [ ] **Step 4: Commit**

```bash
git add sandbox/src/docker.rs sandbox/src/main.rs
git commit -m "feat(sandbox): 封装 bollard 的创建/启动/删除容器能力"
```

---

## Task 1.5：AppState 与沙箱注册表

**Files:**
- Create: `sandbox/src/state.rs`
- Modify: `sandbox/src/main.rs`

- [ ] **Step 1: 实现 state.rs**

文件 `sandbox/src/state.rs`：

```rust
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
```

- [ ] **Step 2: 在 main.rs 接入 SharedState**

替换 `sandbox/src/main.rs` 的整个内容为：

```rust
use axum::{extract::State, routing::get, Json, Router};
use std::net::SocketAddr;
use std::sync::Arc;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

mod docker;
mod port_pool;
mod state;

use state::{AppState, SharedState};

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    dotenvy::dotenv().ok();

    tracing_subscriber::registry()
        .with(tracing_subscriber::EnvFilter::new(
            std::env::var("RUST_LOG").unwrap_or_else(|_| "info,sandbox=debug".to_string()),
        ))
        .with(tracing_subscriber::fmt::layer())
        .init();

    let image = std::env::var("SANDBOX_IMAGE")
        .unwrap_or_else(|_| "amis-ai-sandbox:uniapp-node20".to_string());
    let pnpm_store = std::env::var("SANDBOX_PNPM_STORE")
        .unwrap_or_else(|_| "/var/amis-ai/pnpm-store".to_string());
    let workdir_root = std::env::var("SANDBOX_WORKDIR_ROOT")
        .unwrap_or_else(|_| "/var/amis-ai/workdirs".to_string());
    let port_start: u16 = std::env::var("SANDBOX_PORT_RANGE_START")
        .ok()
        .and_then(|s| s.parse().ok())
        .unwrap_or(20000);
    let port_end: u16 = std::env::var("SANDBOX_PORT_RANGE_END")
        .ok()
        .and_then(|s| s.parse().ok())
        .unwrap_or(21000);

    let docker = docker::DockerClient::connect(image, pnpm_store)?;
    let port_pool = Arc::new(port_pool::PortPool::new(port_start, port_end));

    let state: SharedState = Arc::new(AppState {
        docker,
        port_pool,
        workdir_root,
        sandboxes: Default::default(),
    });

    let app = Router::new()
        .route("/health", get(health))
        .route("/debug/state", get(debug_state))
        .with_state(state);

    let addr: SocketAddr = "0.0.0.0:8091".parse()?;
    let listener = tokio::net::TcpListener::bind(addr).await?;
    tracing::info!("🧪 sandbox-service 已启动，监听 {}", addr);
    axum::serve(listener, app).await?;
    Ok(())
}

async fn health() -> &'static str {
    "ok"
}

async fn debug_state(State(state): State<SharedState>) -> Json<serde_json::Value> {
    let sandboxes = state.sandboxes.read().await;
    let ports_used = state.port_pool.in_use();
    Json(serde_json::json!({
        "sandboxes": sandboxes.values().collect::<Vec<_>>(),
        "ports_used": ports_used,
    }))
}
```

- [ ] **Step 3: 编译 + 启动验证**

Run:
```bash
cd sandbox && cargo run --bin sandbox-service &
sleep 3
curl -s http://localhost:8091/debug/state
kill %1
```

Expected 输出 JSON（注意 `sandboxes` 为空数组）：
```json
{"ports_used":0,"sandboxes":[]}
```

- [ ] **Step 4: Commit**

```bash
git add sandbox/src/state.rs sandbox/src/main.rs
git commit -m "feat(sandbox): 引入共享状态与沙箱注册表"
```

---

## Task 1.6：`POST /sandboxes` 与 `DELETE /sandboxes/:id`

**Files:**
- Create: `sandbox/src/handlers.rs`
- Modify: `sandbox/src/main.rs`

- [ ] **Step 1: 创建 handlers.rs（先实现创建与销毁）**

文件 `sandbox/src/handlers.rs`：

```rust
use crate::docker::CreateOpts;
use crate::state::{DevStatus, Sandbox, SharedState};
use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use serde::Deserialize;
use serde_json::json;
use uuid::Uuid;

#[derive(Debug, Deserialize)]
pub struct CreateSandboxRequest {
    pub task_id: String,
}

pub async fn create_sandbox(
    State(state): State<SharedState>,
    Json(payload): Json<CreateSandboxRequest>,
) -> impl IntoResponse {
    let port = match state.port_pool.allocate() {
        Ok(p) => p,
        Err(_) => {
            return (
                StatusCode::TOO_MANY_REQUESTS,
                Json(json!({"error": "端口池已耗尽，请稍后"})),
            )
                .into_response()
        }
    };

    let workdir = format!("{}/{}", state.workdir_root, payload.task_id);
    // 保证宿主机工作目录存在
    if let Err(e) = tokio::fs::create_dir_all(&workdir).await {
        let _ = state.port_pool.release(port);
        return (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({"error": format!("创建工作目录失败: {e}")})),
        )
            .into_response();
    }

    let container_id = match state
        .docker
        .create_and_start(CreateOpts {
            task_id: &payload.task_id,
            host_workdir: &workdir,
            preview_port: port,
        })
        .await
    {
        Ok(id) => id,
        Err(e) => {
            let _ = state.port_pool.release(port);
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({"error": format!("启动容器失败: {e}")})),
            )
                .into_response();
        }
    };

    let sb = Sandbox {
        id: Uuid::new_v4().to_string(),
        task_id: payload.task_id.clone(),
        container_id,
        preview_port: port,
        workdir,
        dev_status: DevStatus::NotStarted,
        recent_logs: vec![],
        created_at: chrono::Utc::now(),
    };

    let sandbox_id = sb.id.clone();
    state.sandboxes.write().await.insert(sandbox_id.clone(), sb.clone());

    (StatusCode::CREATED, Json(sb)).into_response()
}

pub async fn delete_sandbox(
    State(state): State<SharedState>,
    Path(id): Path<String>,
) -> impl IntoResponse {
    let sb = {
        let mut map = state.sandboxes.write().await;
        map.remove(&id)
    };

    let sb = match sb {
        Some(s) => s,
        None => {
            return (StatusCode::NOT_FOUND, Json(json!({"error": "沙箱不存在"})))
                .into_response();
        }
    };

    if let Err(e) = state.docker.remove(&sb.container_id).await {
        tracing::warn!("删除容器失败（忽略并继续回收端口）: {}", e);
    }
    let _ = state.port_pool.release(sb.preview_port);

    Json(json!({"message": "已销毁", "sandbox_id": id})).into_response()
}
```

- [ ] **Step 2: 在 main.rs 挂载路由**

编辑 `sandbox/src/main.rs`：

1. 在顶部 `mod state;` 下新增 `mod handlers;`
2. 在 Router 上追加两条路由：

```rust
    let app = Router::new()
        .route("/health", get(health))
        .route("/debug/state", get(debug_state))
        .route("/sandboxes", axum::routing::post(handlers::create_sandbox))
        .route("/sandboxes/:id", axum::routing::delete(handlers::delete_sandbox))
        .with_state(state);
```

- [ ] **Step 3: 端到端冒烟测试（需要本地 docker 可用）**

Run:
```bash
cd sandbox && cargo run --bin sandbox-service &
sleep 3

# 创建沙箱
RESP=$(curl -s -X POST http://localhost:8091/sandboxes \
  -H 'Content-Type: application/json' \
  -d '{"task_id":"t1"}')
echo "$RESP" | jq .
SB_ID=$(echo "$RESP" | jq -r .id)

# 检查容器存在
docker ps --filter "name=amis-ai-sandbox-t1" --format '{{.Names}}'

# 销毁
curl -s -X DELETE "http://localhost:8091/sandboxes/$SB_ID" | jq .

# 容器应该没了
docker ps -a --filter "name=amis-ai-sandbox-t1" --format '{{.Names}}'

kill %1
```

Expected:
- 第一条 curl 返回包含 `"id"`/`"preview_port"`/`"container_id"`/`"dev_status":"not_started"` 的 JSON
- `docker ps` 输出 `amis-ai-sandbox-t1`
- DELETE 返回 `{"message":"已销毁", ...}`
- 最后一条 `docker ps -a` 输出为空

- [ ] **Step 4: Commit**

```bash
git add sandbox/src/handlers.rs sandbox/src/main.rs
git commit -m "feat(sandbox): 实现 POST /sandboxes 与 DELETE /sandboxes/:id"
```

---

## Task 1.7：`POST /sandboxes/:id/exec` 容器内执行命令

**Files:**
- Modify: `sandbox/src/docker.rs`
- Modify: `sandbox/src/handlers.rs`
- Modify: `sandbox/src/main.rs`

- [ ] **Step 1: 在 docker.rs 增加 exec 方法**

在 `sandbox/src/docker.rs` 的 `impl DockerClient` 块末尾（`pub fn raw` 之前）插入：

```rust
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
```

在 `docker.rs` 文件顶部（`use` 声明块之后）追加结构体：

```rust
#[derive(Debug, Clone, serde::Serialize)]
pub struct ExecResult {
    pub stdout: String,
    pub stderr: String,
    pub exit_code: i32,
}
```

- [ ] **Step 2: 在 handlers.rs 增加 exec_command**

在 `sandbox/src/handlers.rs` 末尾追加：

```rust
#[derive(Debug, Deserialize)]
pub struct ExecRequest {
    pub cmd: Vec<String>,
    pub cwd: Option<String>,
}

pub async fn exec_command(
    State(state): State<SharedState>,
    Path(id): Path<String>,
    Json(payload): Json<ExecRequest>,
) -> impl IntoResponse {
    let container_id = {
        let map = state.sandboxes.read().await;
        match map.get(&id) {
            Some(sb) => sb.container_id.clone(),
            None => {
                return (StatusCode::NOT_FOUND, Json(json!({"error": "沙箱不存在"})))
                    .into_response();
            }
        }
    };

    match state.docker.exec(&container_id, payload.cmd, payload.cwd).await {
        Ok(res) => Json(res).into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({"error": format!("exec 失败: {e}")})),
        )
            .into_response(),
    }
}
```

- [ ] **Step 3: 在 main.rs 挂载路由**

在 Router 中添加：

```rust
        .route("/sandboxes/:id/exec", axum::routing::post(handlers::exec_command))
```

- [ ] **Step 4: 冒烟测试**

Run:
```bash
cd sandbox && cargo run --bin sandbox-service &
sleep 3

SB=$(curl -s -X POST http://localhost:8091/sandboxes \
  -H 'Content-Type: application/json' -d '{"task_id":"exec-test"}')
SB_ID=$(echo "$SB" | jq -r .id)

curl -s -X POST "http://localhost:8091/sandboxes/$SB_ID/exec" \
  -H 'Content-Type: application/json' \
  -d '{"cmd":["sh","-c","echo hi && node -v"]}' | jq .

curl -s -X DELETE "http://localhost:8091/sandboxes/$SB_ID" > /dev/null
kill %1
```

Expected:
```json
{
  "stdout": "hi\nv20.xx.x\n",
  "stderr": "",
  "exit_code": 0
}
```

- [ ] **Step 5: Commit**

```bash
git add sandbox/src/docker.rs sandbox/src/handlers.rs sandbox/src/main.rs
git commit -m "feat(sandbox): 实现 POST /sandboxes/:id/exec 容器内命令执行"
```

---

## Task 1.8：dev-runner（带 ready/失败判定的日志监听）

**Files:**
- Create: `sandbox/src/dev_runner.rs`
- Modify: `sandbox/src/state.rs`
- Modify: `sandbox/src/handlers.rs`
- Modify: `sandbox/src/main.rs`

- [ ] **Step 1: 写失败的正则判定单元测试**

文件 `sandbox/src/dev_runner.rs`：

```rust
use once_cell::sync::Lazy;
use regex::Regex;

static RE_READY: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"Local:\s+(https?://[^\s]+)").unwrap()
});
static RE_ERROR: Lazy<Regex> = Lazy::new(|| {
    Regex::new(r"(?i)\[vite\].*?(error|ENOENT|failed)|ERR!|ELIFECYCLE").unwrap()
});

#[derive(Debug, Clone, PartialEq)]
pub enum LogSignal {
    Ready(String),
    Failed(String),
    Neutral,
}

pub fn classify(line: &str) -> LogSignal {
    if let Some(cap) = RE_READY.captures(line) {
        return LogSignal::Ready(cap.get(1).unwrap().as_str().to_string());
    }
    if RE_ERROR.is_match(line) {
        return LogSignal::Failed(line.trim().to_string());
    }
    LogSignal::Neutral
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn vite_ready_line_is_detected() {
        let l = "  ➜  Local:   http://localhost:5173/";
        assert_eq!(classify(l), LogSignal::Ready("http://localhost:5173/".to_string()));
    }

    #[test]
    fn vite_error_line_is_detected() {
        let l = "[vite] Internal server error: ENOENT: no such file";
        assert!(matches!(classify(l), LogSignal::Failed(_)));
    }

    #[test]
    fn neutral_line_is_neutral() {
        assert_eq!(classify("something normal"), LogSignal::Neutral);
    }

    #[test]
    fn npm_err_is_detected_as_failed() {
        assert!(matches!(classify("npm ERR! code ELIFECYCLE"), LogSignal::Failed(_)));
    }
}
```

- [ ] **Step 2: 声明 mod 并运行测试**

在 `sandbox/src/main.rs` 顶部添加：

```rust
mod dev_runner;
```

Run:
```bash
cd sandbox && cargo test --lib dev_runner
```

Expected:
```
test result: ok. 4 passed; 0 failed
```

- [ ] **Step 3: 扩展 state.rs 用于日志环形缓冲**

编辑 `sandbox/src/state.rs`，在 `impl` 块之前添加辅助函数与常量：

在 `Sandbox` 结构体定义之后追加：

```rust
pub const MAX_RECENT_LOGS: usize = 200;

impl Sandbox {
    pub fn push_log(&mut self, line: String) {
        if self.recent_logs.len() >= MAX_RECENT_LOGS {
            self.recent_logs.remove(0);
        }
        self.recent_logs.push(line);
    }
}
```

- [ ] **Step 4: 在 handlers.rs 新增 dev-start 与 dev-status**

在 `sandbox/src/handlers.rs` 末尾追加：

```rust
use crate::dev_runner::{classify, LogSignal};
use crate::state::DevStatus;

pub async fn dev_start(
    State(state): State<SharedState>,
    Path(id): Path<String>,
) -> impl IntoResponse {
    let (container_id, _port) = {
        let map = state.sandboxes.read().await;
        match map.get(&id) {
            Some(sb) => (sb.container_id.clone(), sb.preview_port),
            None => {
                return (StatusCode::NOT_FOUND, Json(json!({"error": "沙箱不存在"})))
                    .into_response();
            }
        }
    };

    // 标记为 starting
    {
        let mut map = state.sandboxes.write().await;
        if let Some(sb) = map.get_mut(&id) {
            sb.dev_status = DevStatus::Starting;
            sb.recent_logs.clear();
        }
    }

    // 后台任务：跑 pnpm install && pnpm run dev:h5
    let state_bg = state.clone();
    let sandbox_id = id.clone();
    tokio::spawn(async move {
        let script = "cd /workspace && pnpm install --prefer-offline && pnpm run dev:h5 --host 0.0.0.0 --port 5173 2>&1";
        let cmd = vec!["sh".to_string(), "-c".to_string(), script.to_string()];
        // 简化处理：执行完一次就落盘 stdout/stderr（Vite dev 是前台进程，不会退出——实际用流式更佳）
        // 为了 MVP 我们分两步：先 install 再 dev，中途 probe 日志
        let install_res = state_bg
            .docker
            .exec(
                &container_id,
                vec!["sh".into(), "-c".into(), "cd /workspace && pnpm install --prefer-offline 2>&1".into()],
                None,
            )
            .await;
        match install_res {
            Ok(r) if r.exit_code == 0 => {
                // install 成功，异步起 dev
                let state_probe = state_bg.clone();
                let sid = sandbox_id.clone();
                let cid = container_id.clone();
                tokio::spawn(async move {
                    // nohup 起 vite，重定向日志到文件
                    let _ = state_probe
                        .docker
                        .exec(
                            &cid,
                            vec![
                                "sh".into(),
                                "-c".into(),
                                "cd /workspace && nohup sh -c 'pnpm run dev:h5 --host 0.0.0.0 --port 5173 > /tmp/vite.log 2>&1' &".into(),
                            ],
                            None,
                        )
                        .await;

                    // 轮询 /tmp/vite.log
                    for _ in 0..120 {
                        tokio::time::sleep(std::time::Duration::from_millis(1000)).await;
                        let tail = state_probe
                            .docker
                            .exec(
                                &cid,
                                vec!["sh".into(), "-c".into(), "tail -n 50 /tmp/vite.log 2>/dev/null || true".into()],
                                None,
                            )
                            .await;
                        if let Ok(r) = tail {
                            let mut map = state_probe.sandboxes.write().await;
                            if let Some(sb) = map.get_mut(&sid) {
                                for line in r.stdout.lines() {
                                    sb.push_log(line.to_string());
                                    match classify(line) {
                                        LogSignal::Ready(_url) => {
                                            sb.dev_status = DevStatus::Ready {
                                                url: format!("http://localhost:{}/", sb.preview_port),
                                            };
                                        }
                                        LogSignal::Failed(reason) => {
                                            sb.dev_status = DevStatus::Failed { reason };
                                        }
                                        LogSignal::Neutral => {}
                                    }
                                }
                                if matches!(sb.dev_status, DevStatus::Ready { .. } | DevStatus::Failed { .. }) {
                                    break;
                                }
                            }
                        }
                    }
                });
            }
            Ok(r) => {
                let mut map = state_bg.sandboxes.write().await;
                if let Some(sb) = map.get_mut(&sandbox_id) {
                    sb.dev_status = DevStatus::Failed {
                        reason: format!("pnpm install 失败 (exit={}): {}", r.exit_code, r.stderr.chars().take(500).collect::<String>()),
                    };
                }
            }
            Err(e) => {
                let mut map = state_bg.sandboxes.write().await;
                if let Some(sb) = map.get_mut(&sandbox_id) {
                    sb.dev_status = DevStatus::Failed {
                        reason: format!("pnpm install exec 错误: {e}"),
                    };
                }
            }
        }
    });

    Json(json!({"message": "已触发 dev-start", "sandbox_id": id})).into_response()
}

pub async fn dev_status(
    State(state): State<SharedState>,
    Path(id): Path<String>,
) -> impl IntoResponse {
    let map = state.sandboxes.read().await;
    match map.get(&id) {
        Some(sb) => Json(json!({
            "dev_status": sb.dev_status,
            "recent_logs": sb.recent_logs,
            "preview_port": sb.preview_port,
        }))
        .into_response(),
        None => (StatusCode::NOT_FOUND, Json(json!({"error": "沙箱不存在"}))).into_response(),
    }
}
```

- [ ] **Step 5: 挂载路由**

在 `sandbox/src/main.rs` 的 Router 追加：

```rust
        .route("/sandboxes/:id/dev-start", axum::routing::post(handlers::dev_start))
        .route("/sandboxes/:id/dev-status", axum::routing::get(handlers::dev_status))
```

- [ ] **Step 6: 编译验证**

Run:
```bash
cd sandbox && cargo build
```

Expected: 编译通过。

- [ ] **Step 7: Commit**

```bash
git add sandbox/
git commit -m "feat(sandbox): 实现 dev-start 与 dev-status（含 ready/failed 判定）"
```

---

## Task 1.9：sandbox-service 的 docker-compose 接入（可选本地验证）

**Files:**
- Modify: `docker-compose.yml`

- [ ] **Step 1: 在 docker-compose.yml 追加 sandbox-service 服务定义**

在 `nginx` 服务后面、`volumes:` 声明前插入：

```yaml
  sandbox-service:
    build:
      context: ./sandbox
      dockerfile_inline: |
        FROM rust:1.82-slim AS builder
        WORKDIR /app
        COPY . .
        RUN cargo build --release --bin sandbox-service

        FROM debian:bookworm-slim
        RUN apt-get update && apt-get install -y ca-certificates docker.io && rm -rf /var/lib/apt/lists/*
        COPY --from=builder /app/target/release/sandbox-service /usr/local/bin/
        CMD ["/usr/local/bin/sandbox-service"]
    ports:
      - "8091:8091"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - /var/amis-ai:/var/amis-ai
    environment:
      SANDBOX_IMAGE: amis-ai-sandbox:uniapp-node20
      SANDBOX_WORKDIR_ROOT: /var/amis-ai/workdirs
      SANDBOX_PNPM_STORE: /var/amis-ai/pnpm-store
      SANDBOX_PORT_RANGE_START: "20000"
      SANDBOX_PORT_RANGE_END: "21000"
```

> 注：MVP 阶段可继续用 `cargo run` 本地启动（不上 compose），本 Step 只是把它注册进去备用。

- [ ] **Step 2: Commit**

```bash
git add docker-compose.yml
git commit -m "chore: 在 docker-compose 注册 sandbox-service（可选启用）"
```

---

## Section 1 验收

执行完成后应能：
- `docker images | grep amis-ai-sandbox` 看到镜像
- `cargo test -p amis-ai-sandbox` 全部通过
- 本地启动 `sandbox-service`，完成 create → exec → dev-start → dev-status → delete 的 curl 流程

---

# Section 2 · claw-agent-server（包装 claw-code）

**里程碑验收标准**：
- `claw-code/rust/crates/claw-agent-server/` 作为 workspace 新成员编译通过
- 不修改 claw-code 已有 crate 的任何源码（`git diff` 对 claw-code 已有文件应为空）
- 服务启动监听 8090
- `POST /tasks` 创建会话并回返 `session_id`，后台启动 Agent loop
- `POST /tasks/:id/messages` 把消息入队
- `WS /tasks/:id/events` 能收到 `assistant_delta`、`tool_use`、`tool_result`、`turn_complete` 等事件
- Agent 的 `bash` / `write_file` / `edit_file` 工具通过 HTTP 调 sandbox-service 完成

**前置事实（来自 claw-code 源码）**：
- `ConversationRuntime<C, T>` 是**同步**结构体；`run_turn` 是同步阻塞函数，必须放进 `tokio::task::spawn_blocking`
- `ApiClient::stream(&mut self, ApiRequest) -> Result<Vec<AssistantEvent>, RuntimeError>` 同步
- `ToolExecutor::execute(&mut self, tool_name: &str, input: &str) -> Result<String, ToolError>` 同步
- `AssistantEvent` 枚举：`TextDelta(String)` / `ToolUse{id, name, input}` / `Usage` / `PromptCache` / `MessageStop`
- `Session::new()` 构造空会话；`Session` 暴露 `push_user_text` 等 API
- 依赖路径：agent-server 通过 `runtime = { path = "../runtime" }` 与 `api = { path = "../api" }` 直接复用

---

## Task 2.1：新建 claw-agent-server crate 骨架

**Files:**
- Modify: `claw-code/rust/Cargo.toml`（workspace members 其实用的是通配 `crates/*`，无需改）
- Create: `claw-code/rust/crates/claw-agent-server/Cargo.toml`
- Create: `claw-code/rust/crates/claw-agent-server/src/main.rs`
- Create: `claw-code/rust/crates/claw-agent-server/src/lib.rs`

- [ ] **Step 1: 确认 workspace 通配成员**

Run:
```bash
cat claw-code/rust/Cargo.toml
```

Expected: 第 1-3 行包含 `[workspace]` 和 `members = ["crates/*"]`——新增 crate 自动被包含，无需改根配置。

- [ ] **Step 2: 创建 Cargo.toml**

文件 `claw-code/rust/crates/claw-agent-server/Cargo.toml`：

```toml
[package]
name = "claw-agent-server"
version.workspace = true
edition.workspace = true
license.workspace = true
publish.workspace = true

[[bin]]
name = "claw-agent-server"
path = "src/main.rs"

[dependencies]
runtime = { path = "../runtime" }
api = { path = "../api" }
tools = { path = "../tools" }

axum = { version = "0.7", features = ["ws"] }
tokio = { version = "1", features = ["full"] }
tower-http = { version = "0.5", features = ["cors", "trace"] }
serde = { version = "1", features = ["derive"] }
serde_json = { workspace = true }
tracing = "0.1"
tracing-subscriber = { version = "0.3", features = ["env-filter"] }
reqwest = { version = "0.12", default-features = false, features = ["json", "rustls-tls"] }
uuid = { version = "1.7", features = ["v4", "serde"] }
anyhow = "1"
thiserror = "1"
dotenvy = "0.15"
tokio-stream = "0.1"
futures-util = "0.3"
dashmap = "5.5"

[lints]
workspace = true
```

- [ ] **Step 3: 创建 lib.rs 和 main.rs 骨架**

文件 `claw-code/rust/crates/claw-agent-server/src/lib.rs`：

```rust
//! claw-agent-server: 包装 claw-code runtime 为 HTTP + WebSocket 服务。

pub mod events;
pub mod sandbox_client;
pub mod sandbox_tools;
pub mod session_manager;
pub mod task_loop;
pub mod tool_adapter;
```

文件 `claw-code/rust/crates/claw-agent-server/src/main.rs`：

```rust
use axum::{routing::get, Router};
use std::net::SocketAddr;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    dotenvy::dotenv().ok();

    tracing_subscriber::registry()
        .with(tracing_subscriber::EnvFilter::new(
            std::env::var("RUST_LOG").unwrap_or_else(|_| "info,claw_agent_server=debug".to_string()),
        ))
        .with(tracing_subscriber::fmt::layer())
        .init();

    let app = Router::new().route("/health", get(health));

    let addr: SocketAddr = "0.0.0.0:8090".parse()?;
    let listener = tokio::net::TcpListener::bind(addr).await?;
    tracing::info!("🤖 claw-agent-server 已启动，监听 {}", addr);
    axum::serve(listener, app).await?;
    Ok(())
}

async fn health() -> &'static str {
    "ok"
}
```

> 注意：`lib.rs` 引用的子模块此时还没实现，会导致编译失败。下一 Step 创建空文件让编译通过，后续任务填充真实内容。

- [ ] **Step 4: 创建子模块空文件**

为让 `cargo check` 通过，按顺序创建 6 个空 `.rs`（每个只放一行 `#![allow(unused)]`）：

```bash
cd claw-code/rust/crates/claw-agent-server/src
for f in events.rs sandbox_client.rs sandbox_tools.rs session_manager.rs task_loop.rs tool_adapter.rs; do
  echo '#![allow(unused)]' > $f
done
```

- [ ] **Step 5: 编译验证**

Run:
```bash
cd claw-code/rust && cargo check -p claw-agent-server
```

Expected: `Checking claw-agent-server ... Finished`，无错误（`warning: unused_imports` 可忽略）。

- [ ] **Step 6: 冒烟测试 health**

Run:
```bash
cd claw-code/rust && cargo run -p claw-agent-server &
sleep 3
curl -s http://localhost:8090/health
kill %1
```

Expected: `ok`

- [ ] **Step 7: Commit**

```bash
git add claw-code/rust/crates/claw-agent-server/
git commit -m "feat: 新建 claw-agent-server crate 骨架（复用 runtime+api+tools）"
```

---

## Task 2.2：事件定义（agent-server 自己的事件枚举）

**Files:**
- Modify: `claw-code/rust/crates/claw-agent-server/src/events.rs`

- [ ] **Step 1: 定义 AgentEvent 与 ToJson 辅助**

替换 `claw-code/rust/crates/claw-agent-server/src/events.rs` 为：

```rust
use serde::{Deserialize, Serialize};

/// 对外发布的事件（比 claw-code 内部 AssistantEvent 多一层"适合前端消费"的语义）。
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "event_type", rename_all = "snake_case")]
pub enum AgentEvent {
    SessionCreated { session_id: String },
    TurnStart { turn_index: u32 },
    AssistantDelta { text: String },
    ToolUse { id: String, name: String, input_json: String },
    ToolResult { id: String, name: String, output: String, error: Option<String> },
    TurnComplete { turn_index: u32, iterations: u32 },
    Waiting { reason: String }, // 等待用户消息
    Error { message: String },
    Stopped { reason: String },
}

impl AgentEvent {
    pub fn to_json(&self) -> String {
        serde_json::to_string(self).unwrap_or_else(|e| {
            format!(r#"{{"event_type":"error","message":"serialization failed: {e}"}}"#)
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn session_created_serializes() {
        let e = AgentEvent::SessionCreated { session_id: "abc".into() };
        let s = e.to_json();
        assert!(s.contains("\"event_type\":\"session_created\""));
        assert!(s.contains("\"session_id\":\"abc\""));
    }

    #[test]
    fn tool_use_serializes_input_as_string() {
        let e = AgentEvent::ToolUse { id: "1".into(), name: "bash".into(), input_json: "{\"cmd\":\"ls\"}".into() };
        let s = e.to_json();
        assert!(s.contains("\"name\":\"bash\""));
        assert!(s.contains("\"input_json\":\"{\\\"cmd\\\":\\\"ls\\\"}\""));
    }
}
```

- [ ] **Step 2: 运行测试**

Run:
```bash
cd claw-code/rust && cargo test -p claw-agent-server events
```

Expected: 2 个测试全通过。

- [ ] **Step 3: Commit**

```bash
git add claw-code/rust/crates/claw-agent-server/src/events.rs
git commit -m "feat(claw-agent-server): 定义对外 AgentEvent 事件枚举"
```

---

## Task 2.3：sandbox-service HTTP 客户端

**Files:**
- Modify: `claw-code/rust/crates/claw-agent-server/src/sandbox_client.rs`

- [ ] **Step 1: 实现 SandboxClient**

替换 `claw-code/rust/crates/claw-agent-server/src/sandbox_client.rs` 为：

```rust
use serde::{Deserialize, Serialize};
use thiserror::Error;

#[derive(Debug, Error)]
pub enum SandboxError {
    #[error("http: {0}")]
    Http(#[from] reqwest::Error),
    #[error("sandbox-service 返回非 2xx: status={status} body={body}")]
    NonOk { status: u16, body: String },
    #[error("json: {0}")]
    Json(#[from] serde_json::Error),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExecResult {
    pub stdout: String,
    pub stderr: String,
    pub exit_code: i32,
}

#[derive(Clone)]
pub struct SandboxClient {
    base_url: String,
    http: reqwest::Client,
}

impl SandboxClient {
    pub fn new(base_url: impl Into<String>) -> Self {
        Self {
            base_url: base_url.into(),
            http: reqwest::Client::builder()
                .no_proxy()
                .timeout(std::time::Duration::from_secs(600))
                .build()
                .expect("build reqwest client"),
        }
    }

    pub async fn exec(
        &self,
        sandbox_id: &str,
        cmd: Vec<String>,
        cwd: Option<String>,
    ) -> Result<ExecResult, SandboxError> {
        let url = format!("{}/sandboxes/{}/exec", self.base_url, sandbox_id);
        let body = serde_json::json!({ "cmd": cmd, "cwd": cwd });
        let resp = self.http.post(&url).json(&body).send().await?;
        let status = resp.status();
        let text = resp.text().await?;
        if !status.is_success() {
            return Err(SandboxError::NonOk { status: status.as_u16(), body: text });
        }
        Ok(serde_json::from_str(&text)?)
    }
}
```

- [ ] **Step 2: 编译验证**

Run:
```bash
cd claw-code/rust && cargo check -p claw-agent-server
```

Expected: 无错误。

- [ ] **Step 3: Commit**

```bash
git add claw-code/rust/crates/claw-agent-server/src/sandbox_client.rs
git commit -m "feat(claw-agent-server): 实现 sandbox-service HTTP 客户端"
```

---

## Task 2.4：自定义 ToolExecutor（转发到 sandbox-service）

**Files:**
- Modify: `claw-code/rust/crates/claw-agent-server/src/sandbox_tools.rs`

- [ ] **Step 1: 实现 SandboxToolExecutor**

替换 `claw-code/rust/crates/claw-agent-server/src/sandbox_tools.rs` 为：

```rust
//! 自定义 ToolExecutor：
//! - `bash` / `shell`：转发到 sandbox-service 的 `POST /exec`
//! - `write_file` / `edit_file`：直接写入宿主机工作目录（与容器挂载点共享）
//! - `read_file` / `grep_search` / `glob_search`：直接读宿主机挂载目录
//! - 其他不支持的工具：返回 ToolError

use crate::sandbox_client::SandboxClient;
use runtime::conversation::{ToolError, ToolExecutor};
use serde_json::Value;
use std::path::{Path, PathBuf};

pub struct SandboxToolExecutor {
    sandbox_id: String,
    workdir_host: PathBuf,
    sandbox_client: SandboxClient,
    runtime_handle: tokio::runtime::Handle,
}

impl SandboxToolExecutor {
    pub fn new(
        sandbox_id: String,
        workdir_host: PathBuf,
        sandbox_client: SandboxClient,
        runtime_handle: tokio::runtime::Handle,
    ) -> Self {
        Self { sandbox_id, workdir_host, sandbox_client, runtime_handle }
    }

    fn resolve(&self, rel_or_abs: &str) -> PathBuf {
        let p = Path::new(rel_or_abs);
        if p.is_absolute() {
            // Agent 在容器内思考时会用 /workspace/... 这样的容器路径，映射回宿主机
            if let Ok(rest) = p.strip_prefix("/workspace") {
                return self.workdir_host.join(rest);
            }
            p.to_path_buf()
        } else {
            self.workdir_host.join(p)
        }
    }
}

impl ToolExecutor for SandboxToolExecutor {
    fn execute(&mut self, tool_name: &str, input: &str) -> Result<String, ToolError> {
        let input_value: Value = serde_json::from_str(input)
            .map_err(|e| ToolError::new(format!("invalid tool input json: {e}")))?;

        match tool_name {
            "bash" | "shell" => {
                let cmd_str = input_value.get("command").and_then(|v| v.as_str())
                    .or_else(|| input_value.get("cmd").and_then(|v| v.as_str()))
                    .ok_or_else(|| ToolError::new("missing `command` field"))?;
                let cwd = input_value.get("cwd").and_then(|v| v.as_str()).map(|s| s.to_string());
                let cmd = vec!["sh".to_string(), "-c".to_string(), cmd_str.to_string()];
                let sid = self.sandbox_id.clone();
                let client = self.sandbox_client.clone();
                let res = self.runtime_handle.block_on(async move {
                    client.exec(&sid, cmd, cwd).await
                }).map_err(|e| ToolError::new(format!("sandbox exec failed: {e}")))?;
                Ok(format!(
                    "exit_code={}\nstdout:\n{}\nstderr:\n{}",
                    res.exit_code, res.stdout, res.stderr
                ))
            }
            "write_file" => {
                let path = input_value.get("path").and_then(|v| v.as_str())
                    .ok_or_else(|| ToolError::new("missing `path` field"))?;
                let content = input_value.get("content").and_then(|v| v.as_str())
                    .ok_or_else(|| ToolError::new("missing `content` field"))?;
                let abs = self.resolve(path);
                if let Some(parent) = abs.parent() {
                    std::fs::create_dir_all(parent)
                        .map_err(|e| ToolError::new(format!("mkdir -p failed: {e}")))?;
                }
                std::fs::write(&abs, content)
                    .map_err(|e| ToolError::new(format!("write failed: {e}")))?;
                Ok(format!("wrote {} bytes to {}", content.len(), abs.display()))
            }
            "edit_file" => {
                // 简单的"全文替换 old -> new"语义（和 claw-code MVP 一致）
                let path = input_value.get("path").and_then(|v| v.as_str())
                    .ok_or_else(|| ToolError::new("missing `path` field"))?;
                let old_s = input_value.get("old_string").and_then(|v| v.as_str()).unwrap_or("");
                let new_s = input_value.get("new_string").and_then(|v| v.as_str())
                    .ok_or_else(|| ToolError::new("missing `new_string` field"))?;
                let abs = self.resolve(path);
                let current = std::fs::read_to_string(&abs)
                    .map_err(|e| ToolError::new(format!("read failed: {e}")))?;
                let replaced = if old_s.is_empty() {
                    new_s.to_string()
                } else if !current.contains(old_s) {
                    return Err(ToolError::new("old_string 未在文件中出现"));
                } else {
                    current.replace(old_s, new_s)
                };
                std::fs::write(&abs, replaced)
                    .map_err(|e| ToolError::new(format!("write failed: {e}")))?;
                Ok(format!("edited {}", abs.display()))
            }
            "read_file" => {
                let path = input_value.get("path").and_then(|v| v.as_str())
                    .ok_or_else(|| ToolError::new("missing `path` field"))?;
                let abs = self.resolve(path);
                std::fs::read_to_string(&abs)
                    .map_err(|e| ToolError::new(format!("read failed: {e}")))
            }
            "glob_search" => {
                let pattern = input_value.get("pattern").and_then(|v| v.as_str())
                    .ok_or_else(|| ToolError::new("missing `pattern` field"))?;
                let full = self.workdir_host.join(pattern);
                let iter = glob::glob(&full.to_string_lossy())
                    .map_err(|e| ToolError::new(format!("glob pattern: {e}")))?;
                let mut lines = Vec::new();
                for entry in iter {
                    match entry {
                        Ok(p) => lines.push(p.display().to_string()),
                        Err(_) => {}
                    }
                }
                Ok(lines.join("\n"))
            }
            "grep_search" => {
                // 极简：调 `grep -rn pattern workdir`
                let pattern = input_value.get("pattern").and_then(|v| v.as_str())
                    .ok_or_else(|| ToolError::new("missing `pattern` field"))?;
                let out = std::process::Command::new("grep")
                    .args(["-rn", pattern])
                    .arg(&self.workdir_host)
                    .output()
                    .map_err(|e| ToolError::new(format!("grep spawn failed: {e}")))?;
                Ok(String::from_utf8_lossy(&out.stdout).to_string())
            }
            other => Err(ToolError::new(format!("不支持的工具: {other}"))),
        }
    }
}
```

- [ ] **Step 2: 在 `Cargo.toml` 补充 `glob` 依赖**

编辑 `claw-code/rust/crates/claw-agent-server/Cargo.toml`，在 `[dependencies]` 末尾加一行：

```toml
glob = "0.3"
```

- [ ] **Step 3: 编译验证**

Run:
```bash
cd claw-code/rust && cargo check -p claw-agent-server
```

Expected: 编译通过。

- [ ] **Step 4: Commit**

```bash
git add claw-code/rust/crates/claw-agent-server/
git commit -m "feat(claw-agent-server): 实现 SandboxToolExecutor（转发沙箱+本地文件）"
```

---

## Task 2.5：LLM 客户端适配（通过 amis-ai backend 拉 LLM 配置）

**Files:**
- Modify: `claw-code/rust/crates/claw-agent-server/src/tool_adapter.rs`

> 说明：我们**不**直接用 claw-code 自带的 provider（它走 env var），而是把 Agent 作为"外包 api-client"：通过 amis-ai backend 的内部 API 取到 provider/model/api_key，然后手写一个 OpenAI-兼容流式客户端，实现 `ApiClient` trait。这样 LLM 配置完全由 amis-ai 侧管理，与 Python Agent 同套路。

- [ ] **Step 1: 实现 OpenAiCompatClient（同步 stream 接口）**

替换 `claw-code/rust/crates/claw-agent-server/src/tool_adapter.rs` 为：

```rust
//! 最简 OpenAI 兼容流式客户端，实现 `runtime::conversation::ApiClient`。

use runtime::conversation::{ApiClient, ApiRequest, AssistantEvent, RuntimeError};
use runtime::session::{ContentBlock, ConversationMessage};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone)]
pub struct LlmConfig {
    pub base_url: String,
    pub api_key: String,
    pub model: String,
    pub temperature: f32,
    pub max_tokens: Option<u32>,
}

pub struct OpenAiCompatClient {
    cfg: LlmConfig,
    runtime_handle: tokio::runtime::Handle,
    http: reqwest::Client,
}

impl OpenAiCompatClient {
    pub fn new(cfg: LlmConfig, runtime_handle: tokio::runtime::Handle) -> Self {
        Self {
            cfg,
            runtime_handle,
            http: reqwest::Client::builder()
                .no_proxy()
                .timeout(std::time::Duration::from_secs(600))
                .build()
                .expect("reqwest client"),
        }
    }
}

#[derive(Serialize)]
struct OpenAiMsg {
    role: String,
    content: String,
}

#[derive(Serialize)]
struct OpenAiReq<'a> {
    model: &'a str,
    messages: Vec<OpenAiMsg>,
    temperature: f32,
    max_tokens: Option<u32>,
    stream: bool,
}

#[derive(Deserialize)]
struct OpenAiResp {
    choices: Vec<OpenAiChoice>,
}

#[derive(Deserialize)]
struct OpenAiChoice {
    message: OpenAiChoiceMsg,
}

#[derive(Deserialize)]
struct OpenAiChoiceMsg {
    content: Option<String>,
}

fn messages_to_openai(prompts: &[String], msgs: &[ConversationMessage]) -> Vec<OpenAiMsg> {
    let mut out = Vec::new();
    if !prompts.is_empty() {
        out.push(OpenAiMsg {
            role: "system".into(),
            content: prompts.join("\n\n"),
        });
    }
    for m in msgs {
        let mut text = String::new();
        for b in &m.blocks {
            if let ContentBlock::Text(t) = b {
                text.push_str(t);
            } else if let ContentBlock::ToolUse { name, input, .. } = b {
                text.push_str(&format!("\n[tool_use:{}] {}\n", name, input));
            } else if let ContentBlock::ToolResult { content, .. } = b {
                text.push_str(&format!("\n[tool_result] {}\n", content));
            }
        }
        out.push(OpenAiMsg {
            role: format!("{:?}", m.role).to_lowercase(),
            content: text,
        });
    }
    out
}

impl ApiClient for OpenAiCompatClient {
    fn stream(&mut self, request: ApiRequest) -> Result<Vec<AssistantEvent>, RuntimeError> {
        let messages = messages_to_openai(&request.system_prompt, &request.messages);
        let body = OpenAiReq {
            model: &self.cfg.model,
            messages,
            temperature: self.cfg.temperature,
            max_tokens: self.cfg.max_tokens,
            stream: false, // MVP：非流式，整段返回
        };
        let url = format!("{}/chat/completions", self.cfg.base_url.trim_end_matches('/'));
        let key = self.cfg.api_key.clone();
        let http = self.http.clone();
        let resp: OpenAiResp = self
            .runtime_handle
            .block_on(async move {
                http.post(&url)
                    .header("Authorization", format!("Bearer {}", key))
                    .json(&body)
                    .send()
                    .await
                    .map_err(|e| RuntimeError::new(format!("http: {e}")))?
                    .error_for_status()
                    .map_err(|e| RuntimeError::new(format!("http status: {e}")))?
                    .json::<OpenAiResp>()
                    .await
                    .map_err(|e| RuntimeError::new(format!("json: {e}")))
            })?;
        let content = resp
            .choices
            .first()
            .and_then(|c| c.message.content.clone())
            .unwrap_or_default();
        Ok(vec![
            AssistantEvent::TextDelta(content),
            AssistantEvent::MessageStop,
        ])
    }
}
```

> 说明：MVP 阶段**不解析 tool_calls**，让 Agent 把工具调用意图写在自然语言里，由 task_loop 层识别。这是刻意的精简选择——真正的"OpenAI tools 协议 → AssistantEvent::ToolUse"解析放到后续迭代。

- [ ] **Step 2: 编译验证**

Run:
```bash
cd claw-code/rust && cargo check -p claw-agent-server
```

Expected: 编译通过。

- [ ] **Step 3: Commit**

```bash
git add claw-code/rust/crates/claw-agent-server/src/tool_adapter.rs
git commit -m "feat(claw-agent-server): OpenAI 兼容客户端实现 ApiClient trait"
```

---

## Task 2.6：Session Manager 与 Task Loop

**Files:**
- Modify: `claw-code/rust/crates/claw-agent-server/src/session_manager.rs`
- Modify: `claw-code/rust/crates/claw-agent-server/src/task_loop.rs`

- [ ] **Step 1: 实现 SessionManager**

替换 `claw-code/rust/crates/claw-agent-server/src/session_manager.rs` 为：

```rust
use crate::events::AgentEvent;
use dashmap::DashMap;
use std::sync::Arc;
use tokio::sync::{mpsc, Mutex};

pub struct SessionState {
    pub session_id: String,
    pub sandbox_id: String,
    pub workdir_host: String,
    pub system_prompt: Vec<String>,
    /// 待处理的用户消息队列（温和打断语义）
    pub pending_messages: Mutex<Vec<String>>,
    /// 事件广播：每个 WS 订阅一个接收端
    pub broadcaster: tokio::sync::broadcast::Sender<AgentEvent>,
    pub stop_flag: std::sync::atomic::AtomicBool,
}

#[derive(Default)]
pub struct SessionRegistry {
    pub inner: DashMap<String, Arc<SessionState>>,
}

impl SessionRegistry {
    pub fn get(&self, session_id: &str) -> Option<Arc<SessionState>> {
        self.inner.get(session_id).map(|e| e.value().clone())
    }

    pub fn insert(&self, s: Arc<SessionState>) {
        self.inner.insert(s.session_id.clone(), s);
    }

    pub fn remove(&self, session_id: &str) {
        self.inner.remove(session_id);
    }
}
```

- [ ] **Step 2: 实现 Task Loop（在 blocking 线程里跑 run_turn）**

替换 `claw-code/rust/crates/claw-agent-server/src/task_loop.rs` 为：

```rust
use crate::events::AgentEvent;
use crate::sandbox_client::SandboxClient;
use crate::sandbox_tools::SandboxToolExecutor;
use crate::session_manager::SessionState;
use crate::tool_adapter::{LlmConfig, OpenAiCompatClient};
use runtime::conversation::{ConversationRuntime, AssistantEvent};
use runtime::permissions::PermissionPolicy;
use runtime::session::Session;
use std::path::PathBuf;
use std::sync::Arc;

pub fn spawn_task(
    state: Arc<SessionState>,
    sandbox_client: SandboxClient,
    initial_user_message: String,
    llm: LlmConfig,
) {
    let rt_handle = tokio::runtime::Handle::current();

    tokio::task::spawn_blocking(move || {
        let sender = &state.broadcaster;

        let _ = sender.send(AgentEvent::SessionCreated {
            session_id: state.session_id.clone(),
        });

        let session = Session::new();
        let api_client = OpenAiCompatClient::new(llm, rt_handle.clone());
        let executor = SandboxToolExecutor::new(
            state.sandbox_id.clone(),
            PathBuf::from(&state.workdir_host),
            sandbox_client,
            rt_handle.clone(),
        );
        let mut runtime = ConversationRuntime::new(
            session,
            api_client,
            executor,
            PermissionPolicy::default(),
            state.system_prompt.clone(),
        );

        let mut turn_index: u32 = 0;
        let mut next_input: Option<String> = Some(initial_user_message);

        loop {
            if state.stop_flag.load(std::sync::atomic::Ordering::SeqCst) {
                let _ = sender.send(AgentEvent::Stopped { reason: "stop_flag".into() });
                break;
            }

            let input = match next_input.take() {
                Some(s) => s,
                None => {
                    // 温和打断：检查 pending_messages 队列
                    let popped = rt_handle.block_on(async {
                        let mut q = state.pending_messages.lock().await;
                        if q.is_empty() { None } else { Some(q.remove(0)) }
                    });
                    match popped {
                        Some(m) => m,
                        None => {
                            let _ = sender.send(AgentEvent::Waiting {
                                reason: "no pending user message".into(),
                            });
                            std::thread::sleep(std::time::Duration::from_millis(800));
                            continue;
                        }
                    }
                }
            };

            turn_index += 1;
            let _ = sender.send(AgentEvent::TurnStart { turn_index });

            match runtime.run_turn(input, None) {
                Ok(summary) => {
                    for m in &summary.assistant_messages {
                        for b in &m.blocks {
                            use runtime::session::ContentBlock::*;
                            match b {
                                Text(t) => {
                                    let _ = sender.send(AgentEvent::AssistantDelta { text: t.clone() });
                                }
                                ToolUse { id, name, input } => {
                                    let _ = sender.send(AgentEvent::ToolUse {
                                        id: id.clone(),
                                        name: name.clone(),
                                        input_json: input.clone(),
                                    });
                                }
                                _ => {}
                            }
                        }
                    }
                    for m in &summary.tool_results {
                        for b in &m.blocks {
                            if let runtime::session::ContentBlock::ToolResult { tool_use_id, content, is_error } = b {
                                let _ = sender.send(AgentEvent::ToolResult {
                                    id: tool_use_id.clone(),
                                    name: "".into(),
                                    output: content.clone(),
                                    error: if *is_error { Some(content.clone()) } else { None },
                                });
                            }
                        }
                    }
                    let _ = sender.send(AgentEvent::TurnComplete {
                        turn_index,
                        iterations: summary.iterations as u32,
                    });
                }
                Err(e) => {
                    let _ = sender.send(AgentEvent::Error { message: e.to_string() });
                    break;
                }
            }
        }
    });
}
```

- [ ] **Step 2.1: 核对 ContentBlock 字段**

Run:
```bash
grep -n "pub enum ContentBlock\|ToolResult\s*{" claw-code/rust/crates/runtime/src/session.rs
```

如果 `ToolResult` 的字段名与上面的 `tool_use_id/content/is_error` 不一致，按实际字段名调整。同样 `ToolUse` 的字段名需与 session.rs 里定义一致。

- [ ] **Step 3: 编译验证**

Run:
```bash
cd claw-code/rust && cargo check -p claw-agent-server
```

Expected: 编译通过（如果 ContentBlock 字段名不同，这里会报错 → 回 Step 2 修正）。

- [ ] **Step 4: Commit**

```bash
git add claw-code/rust/crates/claw-agent-server/src/session_manager.rs claw-code/rust/crates/claw-agent-server/src/task_loop.rs
git commit -m "feat(claw-agent-server): 实现 SessionRegistry 与 blocking task loop"
```

---

## Task 2.7：HTTP + WebSocket 路由（POST /tasks、POST /tasks/:id/messages、WS /tasks/:id/events）

**Files:**
- Modify: `claw-code/rust/crates/claw-agent-server/src/main.rs`

- [ ] **Step 1: 替换 main.rs 为完整版**

替换 `claw-code/rust/crates/claw-agent-server/src/main.rs` 为：

```rust
use axum::{
    extract::{
        ws::{Message, WebSocket, WebSocketUpgrade},
        Path, State,
    },
    http::StatusCode,
    response::IntoResponse,
    routing::{get, post},
    Json, Router,
};
use claw_agent_server::events::AgentEvent;
use claw_agent_server::sandbox_client::SandboxClient;
use claw_agent_server::session_manager::{SessionRegistry, SessionState};
use claw_agent_server::task_loop::spawn_task;
use claw_agent_server::tool_adapter::LlmConfig;
use serde::Deserialize;
use serde_json::json;
use std::net::SocketAddr;
use std::sync::Arc;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};
use uuid::Uuid;

#[derive(Clone)]
struct AppState {
    registry: Arc<SessionRegistry>,
    sandbox_client: SandboxClient,
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    dotenvy::dotenv().ok();

    tracing_subscriber::registry()
        .with(tracing_subscriber::EnvFilter::new(
            std::env::var("RUST_LOG").unwrap_or_else(|_| "info,claw_agent_server=debug".to_string()),
        ))
        .with(tracing_subscriber::fmt::layer())
        .init();

    let sandbox_url = std::env::var("SANDBOX_SERVICE_URL")
        .unwrap_or_else(|_| "http://localhost:8091".to_string());

    let state = AppState {
        registry: Arc::new(SessionRegistry::default()),
        sandbox_client: SandboxClient::new(sandbox_url),
    };

    let app = Router::new()
        .route("/health", get(health))
        .route("/tasks", post(create_task))
        .route("/tasks/:id/messages", post(append_message))
        .route("/tasks/:id/stop", post(stop_task))
        .route("/tasks/:id/events", get(ws_events))
        .with_state(state);

    let addr: SocketAddr = "0.0.0.0:8090".parse()?;
    let listener = tokio::net::TcpListener::bind(addr).await?;
    tracing::info!("🤖 claw-agent-server 已启动，监听 {}", addr);
    axum::serve(listener, app).await?;
    Ok(())
}

async fn health() -> &'static str { "ok" }

#[derive(Debug, Deserialize)]
struct CreateTaskReq {
    sandbox_id: String,
    workdir_host: String,
    system_prompt: Vec<String>,
    initial_user_message: String,
    llm: LlmConfigPayload,
}

#[derive(Debug, Deserialize)]
struct LlmConfigPayload {
    base_url: String,
    api_key: String,
    model: String,
    temperature: Option<f32>,
    max_tokens: Option<u32>,
}

async fn create_task(
    State(state): State<AppState>,
    Json(req): Json<CreateTaskReq>,
) -> impl IntoResponse {
    let (tx, _rx) = tokio::sync::broadcast::channel::<AgentEvent>(256);
    let session_id = Uuid::new_v4().to_string();

    let st = Arc::new(SessionState {
        session_id: session_id.clone(),
        sandbox_id: req.sandbox_id.clone(),
        workdir_host: req.workdir_host.clone(),
        system_prompt: req.system_prompt.clone(),
        pending_messages: tokio::sync::Mutex::new(Vec::new()),
        broadcaster: tx,
        stop_flag: std::sync::atomic::AtomicBool::new(false),
    });
    state.registry.insert(st.clone());

    let llm = LlmConfig {
        base_url: req.llm.base_url,
        api_key: req.llm.api_key,
        model: req.llm.model,
        temperature: req.llm.temperature.unwrap_or(0.7),
        max_tokens: req.llm.max_tokens,
    };

    spawn_task(st, state.sandbox_client.clone(), req.initial_user_message, llm);

    (StatusCode::CREATED, Json(json!({ "session_id": session_id }))).into_response()
}

#[derive(Debug, Deserialize)]
struct AppendMsgReq { content: String }

async fn append_message(
    State(state): State<AppState>,
    Path(id): Path<String>,
    Json(req): Json<AppendMsgReq>,
) -> impl IntoResponse {
    let Some(st) = state.registry.get(&id) else {
        return (StatusCode::NOT_FOUND, Json(json!({"error":"session not found"}))).into_response();
    };
    st.pending_messages.lock().await.push(req.content);
    Json(json!({"ok": true})).into_response()
}

async fn stop_task(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> impl IntoResponse {
    let Some(st) = state.registry.get(&id) else {
        return (StatusCode::NOT_FOUND, Json(json!({"error":"session not found"}))).into_response();
    };
    st.stop_flag.store(true, std::sync::atomic::Ordering::SeqCst);
    Json(json!({"ok": true})).into_response()
}

async fn ws_events(
    ws: WebSocketUpgrade,
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> impl IntoResponse {
    ws.on_upgrade(move |socket| handle_ws(socket, state, id))
}

async fn handle_ws(mut socket: WebSocket, state: AppState, id: String) {
    let Some(st) = state.registry.get(&id) else {
        let _ = socket
            .send(Message::Text(json!({"event_type":"error","message":"session not found"}).to_string()))
            .await;
        return;
    };
    let mut rx = st.broadcaster.subscribe();
    loop {
        tokio::select! {
            recv = rx.recv() => {
                match recv {
                    Ok(ev) => {
                        if socket.send(Message::Text(ev.to_json())).await.is_err() {
                            break;
                        }
                    }
                    Err(_) => break,
                }
            }
            msg = socket.recv() => {
                if msg.is_none() { break; }
            }
        }
    }
}
```

- [ ] **Step 2: 编译验证**

Run:
```bash
cd claw-code/rust && cargo check -p claw-agent-server
```

Expected: 编译通过。若 `broadcaster.subscribe()` 遇到 `Sender` 不可 clone 的问题，改用 `Arc<Sender>` 即可；若遇到 `Session` 字段或 `ContentBlock` 字段命名差异，参考 `claw-code/rust/crates/runtime/src/session.rs` 调整 task_loop.rs。

- [ ] **Step 3: 冒烟测试（不实际调 LLM，仅验证路由）**

Run:
```bash
cd claw-code/rust && cargo run -p claw-agent-server &
sleep 3
curl -s http://localhost:8090/health
# 造一个假 task（LLM 会失败但不影响 create_task 接口）
curl -s -X POST http://localhost:8090/tasks \
  -H 'Content-Type: application/json' \
  -d '{
    "sandbox_id":"nonexistent",
    "workdir_host":"/tmp",
    "system_prompt":["你是测试 Agent"],
    "initial_user_message":"hello",
    "llm":{"base_url":"http://localhost:9999","api_key":"x","model":"m"}
  }' | jq .
kill %1
```

Expected: 第一条 `ok`；第二条返回 `{"session_id":"<uuid>"}`。

- [ ] **Step 4: Commit**

```bash
git add claw-code/rust/crates/claw-agent-server/
git commit -m "feat(claw-agent-server): 接入 HTTP + WebSocket 路由（tasks CRUD + events 流）"
```

---

## Section 2 验收

- `cargo test -p claw-agent-server` 通过（events 序列化测试）
- `cargo check -p claw-agent-server` 无错
- `git diff` 在 claw-code 已有 crates（api/runtime/tools/...）下**应为空**，新增仅限 `crates/claw-agent-server/`
- 服务能启动、能创建 session、能通过 WS 订阅到事件

---

# Section 3 · Backend 任务编排层

**里程碑验收标准**：
- 三张新表（`project_generation_task` / `project_task_message` / `project_task_event`）自动建表
- `POST /api/projects/tasks` 能创建任务记录、调 sandbox-service 起容器、调 claw-agent-server 起 session
- `GET /api/projects/tasks/:id` 返回任务详情（含事件流）
- `POST /api/projects/tasks/:id/message` 把消息追加到 claw-agent-server
- `POST /api/projects/tasks/:id/stop` 触发两侧停止
- `WS /api/projects/tasks/:id/events` 聚合 claw-agent + sandbox 事件，转发给前端
- 每轮 Agent 写入文件后自动 `git commit`

---

## Task 3.1：新增三张实体（SeaORM entities）

**Files:**
- Create: `backend/src/entity/project_generation_task.rs`
- Create: `backend/src/entity/project_task_message.rs`
- Create: `backend/src/entity/project_task_event.rs`
- Modify: `backend/src/entity/mod.rs`

- [ ] **Step 1: 创建 project_generation_task.rs**

文件 `backend/src/entity/project_generation_task.rs`：

```rust
use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "project_generation_task")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: i32,
    pub user_id: i32,
    pub source_history_id: Option<i32>,
    #[sea_orm(column_type = "Text")]
    pub amis_json: String,
    pub tech_stack: String,
    pub ui_library: String,
    #[sea_orm(column_type = "Text", nullable)]
    pub extra_prompt: Option<String>,
    pub status: String,
    #[sea_orm(column_type = "Text", nullable)]
    pub repo_path: Option<String>,
    #[sea_orm(column_type = "Text", nullable)]
    pub workdir_path: Option<String>,
    pub sandbox_id: Option<String>,
    pub preview_port: Option<i32>,
    pub claw_session_id: Option<String>,
    pub fix_attempts: i32,
    pub adopted_at: Option<DateTime>,
    pub created_at: DateTime,
    pub updated_at: DateTime,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(
        belongs_to = "super::user::Entity",
        from = "Column::UserId",
        to = "super::user::Column::Id"
    )]
    User,
}

impl Related<super::user::Entity> for Entity {
    fn to() -> RelationDef { Relation::User.def() }
}

impl ActiveModelBehavior for ActiveModel {}
```

- [ ] **Step 2: 创建 project_task_message.rs**

文件 `backend/src/entity/project_task_message.rs`：

```rust
use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "project_task_message")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: i32,
    pub task_id: i32,
    pub role: String,
    #[sea_orm(column_type = "Text")]
    pub content: String,
    pub created_at: DateTime,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(
        belongs_to = "super::project_generation_task::Entity",
        from = "Column::TaskId",
        to = "super::project_generation_task::Column::Id"
    )]
    Task,
}

impl Related<super::project_generation_task::Entity> for Entity {
    fn to() -> RelationDef { Relation::Task.def() }
}

impl ActiveModelBehavior for ActiveModel {}
```

- [ ] **Step 3: 创建 project_task_event.rs**

文件 `backend/src/entity/project_task_event.rs`：

```rust
use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "project_task_event")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: i32,
    pub task_id: i32,
    pub event_type: String,
    #[sea_orm(column_type = "Json")]
    pub payload: serde_json::Value,
    pub created_at: DateTime,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(
        belongs_to = "super::project_generation_task::Entity",
        from = "Column::TaskId",
        to = "super::project_generation_task::Column::Id"
    )]
    Task,
}

impl Related<super::project_generation_task::Entity> for Entity {
    fn to() -> RelationDef { Relation::Task.def() }
}

impl ActiveModelBehavior for ActiveModel {}
```

- [ ] **Step 4: 更新 mod.rs 导出**

编辑 `backend/src/entity/mod.rs` 追加：

```rust
pub mod project_generation_task;
pub mod project_task_message;
pub mod project_task_event;
```

- [ ] **Step 5: 在 main.rs 的建表部分加入新表**

编辑 `backend/src/main.rs`：

1. 在 `use entity::{...}` 导入末尾加上：

```rust
use entity::{user, llm_provider, model_config, generation_history, amis_template,
             project_generation_task, project_task_message, project_task_event};
```

2. 在 `let _ = db.execute(builder.build(&schema.create_table_from_entity(amis_template::Entity))).await;` 之后追加：

```rust
    let _ = db.execute(builder.build(&schema.create_table_from_entity(project_generation_task::Entity))).await;
    let _ = db.execute(builder.build(&schema.create_table_from_entity(project_task_message::Entity))).await;
    let _ = db.execute(builder.build(&schema.create_table_from_entity(project_task_event::Entity))).await;
```

- [ ] **Step 6: 编译验证**

Run:
```bash
cd backend && cargo check
```

Expected: 无错。

- [ ] **Step 7: Commit**

```bash
git add backend/src/entity/ backend/src/main.rs
git commit -m "feat(backend): 新增项目生成任务相关三张 SeaORM 实体"
```

---

## Task 3.2：AppState 扩展（增加 claw-agent / sandbox 基址）

**Files:**
- Modify: `backend/src/main.rs`

- [ ] **Step 1: 扩展 AppState 结构体**

编辑 `backend/src/main.rs`，把 `AppState` 替换为：

```rust
#[derive(Clone)]
pub struct AppState {
    pub db: DatabaseConnection,
    pub http_client: reqwest::Client,
    pub claw_agent_url: String,
    pub sandbox_service_url: String,
    pub sandbox_repo_root: String,
    pub sandbox_workdir_root: String,
}
```

- [ ] **Step 2: 在 main() 里从 env 加载并构造**

在 `let state = AppState { ... };` 替换为：

```rust
    let claw_agent_url = std::env::var("CLAW_AGENT_URL").unwrap_or_else(|_| "http://localhost:8090".to_string());
    let sandbox_service_url = std::env::var("SANDBOX_SERVICE_URL").unwrap_or_else(|_| "http://localhost:8091".to_string());
    let sandbox_repo_root = std::env::var("SANDBOX_REPO_ROOT").unwrap_or_else(|_| "/var/amis-ai/repos".to_string());
    let sandbox_workdir_root = std::env::var("SANDBOX_WORKDIR_ROOT").unwrap_or_else(|_| "/var/amis-ai/workdirs".to_string());

    let state = AppState {
        db,
        http_client: reqwest::Client::builder()
            .no_proxy()
            .build()
            .expect("无法创建 HTTP 客户端"),
        claw_agent_url,
        sandbox_service_url,
        sandbox_repo_root,
        sandbox_workdir_root,
    };
```

- [ ] **Step 3: 编译验证**

Run:
```bash
cd backend && cargo check
```

Expected: 无错。

- [ ] **Step 4: Commit**

```bash
git add backend/src/main.rs
git commit -m "feat(backend): AppState 新增 claw-agent / sandbox-service 地址"
```

---

## Task 3.3：SandboxClient / ClawAgentClient 封装

**Files:**
- Create: `backend/src/services/mod.rs`
- Create: `backend/src/services/sandbox_client.rs`
- Create: `backend/src/services/claw_agent_client.rs`
- Modify: `backend/src/main.rs`

- [ ] **Step 1: 新建 services 模块**

文件 `backend/src/services/mod.rs`：

```rust
pub mod sandbox_client;
pub mod claw_agent_client;
```

- [ ] **Step 2: 实现 sandbox_client.rs**

文件 `backend/src/services/sandbox_client.rs`：

```rust
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateSandboxResp {
    pub id: String,
    pub task_id: String,
    pub container_id: String,
    pub preview_port: u16,
    pub workdir: String,
}

pub async fn create_sandbox(
    http: &reqwest::Client,
    base_url: &str,
    task_id: &str,
) -> anyhow::Result<CreateSandboxResp> {
    let url = format!("{}/sandboxes", base_url);
    let resp = http.post(&url).json(&serde_json::json!({"task_id": task_id}))
        .send().await?.error_for_status()?
        .json::<CreateSandboxResp>().await?;
    Ok(resp)
}

pub async fn delete_sandbox(
    http: &reqwest::Client,
    base_url: &str,
    sandbox_id: &str,
) -> anyhow::Result<()> {
    let url = format!("{}/sandboxes/{}", base_url, sandbox_id);
    http.delete(&url).send().await?.error_for_status()?;
    Ok(())
}

pub async fn dev_start(
    http: &reqwest::Client,
    base_url: &str,
    sandbox_id: &str,
) -> anyhow::Result<()> {
    let url = format!("{}/sandboxes/{}/dev-start", base_url, sandbox_id);
    http.post(&url).send().await?.error_for_status()?;
    Ok(())
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct DevStatusResp {
    pub dev_status: serde_json::Value,
    pub recent_logs: Vec<String>,
    pub preview_port: u16,
}

pub async fn dev_status(
    http: &reqwest::Client,
    base_url: &str,
    sandbox_id: &str,
) -> anyhow::Result<DevStatusResp> {
    let url = format!("{}/sandboxes/{}/dev-status", base_url, sandbox_id);
    let resp = http.get(&url).send().await?.error_for_status()?
        .json::<DevStatusResp>().await?;
    Ok(resp)
}
```

- [ ] **Step 3: 实现 claw_agent_client.rs**

文件 `backend/src/services/claw_agent_client.rs`：

```rust
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize)]
pub struct LlmPayload {
    pub base_url: String,
    pub api_key: String,
    pub model: String,
    pub temperature: Option<f32>,
    pub max_tokens: Option<u32>,
}

#[derive(Debug, Serialize)]
pub struct CreateTaskPayload {
    pub sandbox_id: String,
    pub workdir_host: String,
    pub system_prompt: Vec<String>,
    pub initial_user_message: String,
    pub llm: LlmPayload,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct CreateTaskResp {
    pub session_id: String,
}

pub async fn create_task(
    http: &reqwest::Client,
    base_url: &str,
    payload: &CreateTaskPayload,
) -> anyhow::Result<CreateTaskResp> {
    let url = format!("{}/tasks", base_url);
    let resp = http.post(&url).json(payload).send().await?.error_for_status()?
        .json::<CreateTaskResp>().await?;
    Ok(resp)
}

pub async fn append_message(
    http: &reqwest::Client,
    base_url: &str,
    session_id: &str,
    content: &str,
) -> anyhow::Result<()> {
    let url = format!("{}/tasks/{}/messages", base_url, session_id);
    http.post(&url).json(&serde_json::json!({"content": content}))
        .send().await?.error_for_status()?;
    Ok(())
}

pub async fn stop_task(
    http: &reqwest::Client,
    base_url: &str,
    session_id: &str,
) -> anyhow::Result<()> {
    let url = format!("{}/tasks/{}/stop", base_url, session_id);
    http.post(&url).send().await?.error_for_status()?;
    Ok(())
}
```

- [ ] **Step 4: 在 main.rs 声明 services mod**

编辑 `backend/src/main.rs`，在 `mod handlers;` 下加：

```rust
mod services;
```

- [ ] **Step 5: 编译验证**

Run:
```bash
cd backend && cargo check
```

Expected: 无错。

- [ ] **Step 6: Commit**

```bash
git add backend/src/services/ backend/src/main.rs
git commit -m "feat(backend): 新增 sandbox / claw-agent 下游客户端封装"
```

---

## Task 3.4：project_generation handler —— 创建与查询

**Files:**
- Create: `backend/src/handlers/project_generation.rs`
- Modify: `backend/src/handlers/mod.rs`

- [ ] **Step 1: 实现 handler（CRUD 子集：创建 / 列表 / 详情 / 追加消息 / 停止）**

文件 `backend/src/handlers/project_generation.rs`：

```rust
use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use sea_orm::{ActiveModelTrait, ColumnTrait, EntityTrait, PaginatorTrait, QueryFilter, QueryOrder, Set};
use serde::Deserialize;
use serde_json::json;

use crate::entity::{project_generation_task, project_task_event, project_task_message, user};
use crate::services::{claw_agent_client as claw, sandbox_client as sb};
use crate::utils::jwt;
use crate::AppState;

#[derive(Deserialize)]
pub struct CreateTaskReq {
    pub source_history_id: Option<i32>,
    pub amis_json: String,
    pub tech_stack: String,      // MVP 固定 "uniapp-wot-h5"
    pub ui_library: String,      // MVP 固定 "wot-ui"
    pub extra_prompt: Option<String>,
}

#[derive(Deserialize)]
pub struct ListQuery {
    pub page: Option<u64>,
    pub page_size: Option<u64>,
}

#[derive(Deserialize)]
pub struct AppendMsgReq {
    pub content: String,
}

async fn resolve_user_id(state: &AppState, auth: &jwt::AuthUser) -> Result<i32, axum::response::Response> {
    match user::Entity::find()
        .filter(user::Column::Username.eq(&auth.username))
        .one(&state.db)
        .await
    {
        Ok(Some(u)) => Ok(u.id),
        _ => Err((StatusCode::UNAUTHORIZED, Json(json!({"error":"用户不存在"}))).into_response()),
    }
}

// POST /api/projects/tasks
pub async fn create_task(
    State(state): State<AppState>,
    auth: jwt::AuthUser,
    Json(req): Json<CreateTaskReq>,
) -> impl IntoResponse {
    let user_id = match resolve_user_id(&state, &auth).await {
        Ok(id) => id,
        Err(resp) => return resp,
    };

    // 1. 创建 DB 记录 status=pending
    let now = chrono::Local::now().naive_local();
    let active = project_generation_task::ActiveModel {
        user_id: Set(user_id),
        source_history_id: Set(req.source_history_id),
        amis_json: Set(req.amis_json.clone()),
        tech_stack: Set(req.tech_stack.clone()),
        ui_library: Set(req.ui_library.clone()),
        extra_prompt: Set(req.extra_prompt.clone()),
        status: Set("pending".into()),
        fix_attempts: Set(0),
        created_at: Set(now),
        updated_at: Set(now),
        ..Default::default()
    };
    let task = match active.insert(&state.db).await {
        Ok(t) => t,
        Err(e) => return (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({"error": e.to_string()}))).into_response(),
    };

    // 2. 拉起沙箱
    let task_id_str = task.id.to_string();
    let sbx = match sb::create_sandbox(&state.http_client, &state.sandbox_service_url, &task_id_str).await {
        Ok(s) => s,
        Err(e) => return (StatusCode::BAD_GATEWAY, Json(json!({"error": format!("创建沙箱失败: {e}")}))).into_response(),
    };

    // 3. 初始化 git bare 仓库（本地裸仓库），workdir 已由 sandbox-service 创建
    let repo_path = format!("{}/{}.git", state.sandbox_repo_root, task.id);
    let _ = tokio::fs::create_dir_all(&state.sandbox_repo_root).await;
    let _ = tokio::process::Command::new("git")
        .args(["init", "--bare"])
        .arg(&repo_path)
        .status()
        .await;
    // 在 workdir 里初始化 git（非 bare，指向 bare 仓库作为 remote）
    let _ = tokio::process::Command::new("git").arg("-C").arg(&sbx.workdir).args(["init"]).status().await;
    let _ = tokio::process::Command::new("git")
        .arg("-C").arg(&sbx.workdir)
        .args(["remote", "add", "origin", &repo_path]).status().await;

    // 4. 取 LLM 配置（task_type="chat" 作为代码生成场景）
    let llm_cfg = match fetch_llm_config(&state, "chat").await {
        Ok(v) => v,
        Err(e) => return (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({"error": format!("获取 LLM 配置失败: {e}")}))).into_response(),
    };

    // 5. 创建 claw-agent session
    let sys_prompt = build_system_prompt(&req.tech_stack, &req.ui_library);
    let initial_msg = format!(
        "根据以下 Amis JSON 生成 UniApp + Wot UI H5 项目。\n第一步请从 `/home/karl/Working/TianXing/amis-ai/scaffolds/uniapp-wot-h5-template` 复制脚手架到当前工作目录（使用 cp -r），然后根据 Amis JSON 结构逐页翻译。\n用户额外需求：{}\nAmis JSON:\n```\n{}\n```",
        req.extra_prompt.clone().unwrap_or_else(|| "无".into()),
        req.amis_json
    );
    let payload = claw::CreateTaskPayload {
        sandbox_id: sbx.id.clone(),
        workdir_host: sbx.workdir.clone(),
        system_prompt: sys_prompt,
        initial_user_message: initial_msg,
        llm: llm_cfg,
    };
    let sess = match claw::create_task(&state.http_client, &state.claw_agent_url, &payload).await {
        Ok(r) => r,
        Err(e) => return (StatusCode::BAD_GATEWAY, Json(json!({"error": format!("创建 claw session 失败: {e}")}))).into_response(),
    };

    // 6. 回填 task
    let mut active: project_generation_task::ActiveModel = task.clone().into();
    active.status = Set("running".into());
    active.repo_path = Set(Some(repo_path));
    active.workdir_path = Set(Some(sbx.workdir.clone()));
    active.sandbox_id = Set(Some(sbx.id.clone()));
    active.preview_port = Set(Some(sbx.preview_port as i32));
    active.claw_session_id = Set(Some(sess.session_id.clone()));
    active.updated_at = Set(chrono::Local::now().naive_local());
    let updated = match active.update(&state.db).await {
        Ok(u) => u,
        Err(e) => return (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({"error": e.to_string()}))).into_response(),
    };

    (StatusCode::CREATED, Json(updated)).into_response()
}

// GET /api/projects/tasks
pub async fn list_tasks(
    State(state): State<AppState>,
    auth: jwt::AuthUser,
    Query(q): Query<ListQuery>,
) -> impl IntoResponse {
    let user_id = match resolve_user_id(&state, &auth).await {
        Ok(id) => id,
        Err(resp) => return resp,
    };
    let page = q.page.unwrap_or(1).max(1);
    let page_size = q.page_size.unwrap_or(20).min(100);

    let pag = project_generation_task::Entity::find()
        .filter(project_generation_task::Column::UserId.eq(user_id))
        .order_by_desc(project_generation_task::Column::CreatedAt)
        .paginate(&state.db, page_size);
    let total = pag.num_items().await.unwrap_or(0);
    let items = pag.fetch_page(page - 1).await.unwrap_or_default();

    Json(json!({
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
    })).into_response()
}

// GET /api/projects/tasks/:id
pub async fn get_task(
    State(state): State<AppState>,
    _auth: jwt::AuthUser,
    Path(id): Path<i32>,
) -> impl IntoResponse {
    let task = match project_generation_task::Entity::find_by_id(id).one(&state.db).await {
        Ok(Some(t)) => t,
        Ok(None) => return (StatusCode::NOT_FOUND, Json(json!({"error":"任务不存在"}))).into_response(),
        Err(e) => return (StatusCode::INTERNAL_SERVER_ERROR, Json(json!({"error": e.to_string()}))).into_response(),
    };

    let events = project_task_event::Entity::find()
        .filter(project_task_event::Column::TaskId.eq(id))
        .order_by_asc(project_task_event::Column::CreatedAt)
        .all(&state.db).await.unwrap_or_default();

    let messages = project_task_message::Entity::find()
        .filter(project_task_message::Column::TaskId.eq(id))
        .order_by_asc(project_task_message::Column::CreatedAt)
        .all(&state.db).await.unwrap_or_default();

    Json(json!({
        "task": task,
        "events": events,
        "messages": messages,
    })).into_response()
}

// POST /api/projects/tasks/:id/message
pub async fn append_message(
    State(state): State<AppState>,
    _auth: jwt::AuthUser,
    Path(id): Path<i32>,
    Json(req): Json<AppendMsgReq>,
) -> impl IntoResponse {
    let task = match project_generation_task::Entity::find_by_id(id).one(&state.db).await {
        Ok(Some(t)) => t,
        _ => return (StatusCode::NOT_FOUND, Json(json!({"error":"任务不存在"}))).into_response(),
    };
    let Some(sess_id) = task.claw_session_id.clone() else {
        return (StatusCode::CONFLICT, Json(json!({"error":"任务尚未启动"}))).into_response();
    };

    // 1. 落库 message
    let now = chrono::Local::now().naive_local();
    let _ = project_task_message::ActiveModel {
        task_id: Set(id),
        role: Set("user".into()),
        content: Set(req.content.clone()),
        created_at: Set(now),
        ..Default::default()
    }.insert(&state.db).await;

    // 2. 转发到 claw-agent-server
    if let Err(e) = claw::append_message(&state.http_client, &state.claw_agent_url, &sess_id, &req.content).await {
        return (StatusCode::BAD_GATEWAY, Json(json!({"error": format!("转发消息失败: {e}")}))).into_response();
    }

    Json(json!({"ok": true})).into_response()
}

// POST /api/projects/tasks/:id/stop
pub async fn stop_task(
    State(state): State<AppState>,
    _auth: jwt::AuthUser,
    Path(id): Path<i32>,
) -> impl IntoResponse {
    let task = match project_generation_task::Entity::find_by_id(id).one(&state.db).await {
        Ok(Some(t)) => t,
        _ => return (StatusCode::NOT_FOUND, Json(json!({"error":"任务不存在"}))).into_response(),
    };

    if let Some(sess_id) = task.claw_session_id.as_deref() {
        let _ = claw::stop_task(&state.http_client, &state.claw_agent_url, sess_id).await;
    }
    if let Some(sbx_id) = task.sandbox_id.as_deref() {
        let _ = sb::delete_sandbox(&state.http_client, &state.sandbox_service_url, sbx_id).await;
    }

    let mut active: project_generation_task::ActiveModel = task.into();
    active.status = Set("stopped".into());
    active.updated_at = Set(chrono::Local::now().naive_local());
    let _ = active.update(&state.db).await;

    Json(json!({"ok": true})).into_response()
}

// ---- 内部工具 ----

async fn fetch_llm_config(state: &AppState, task_type: &str) -> anyhow::Result<claw::LlmPayload> {
    // 复用既有 "/api/internal/llm/resolve/:task_type" 端点（内部免鉴权）。
    let url = format!("http://localhost:8080/api/internal/llm/resolve/{}", task_type);
    let val: serde_json::Value = state.http_client.get(&url).send().await?.error_for_status()?
        .json().await?;
    Ok(claw::LlmPayload {
        base_url: val.get("base_url").and_then(|v| v.as_str()).unwrap_or_default().to_string(),
        api_key: val.get("api_key").and_then(|v| v.as_str()).unwrap_or_default().to_string(),
        model: val.get("model_name").and_then(|v| v.as_str()).unwrap_or_default().to_string(),
        temperature: val.get("temperature").and_then(|v| v.as_f64()).map(|x| x as f32),
        max_tokens: val.get("max_tokens").and_then(|v| v.as_i64()).map(|x| x as u32),
    })
}

fn build_system_prompt(tech_stack: &str, ui_library: &str) -> Vec<String> {
    vec![
        format!("你是资深前端工程师。当前任务是根据 Amis JSON 生成 {} + {} 的项目代码。", tech_stack, ui_library),
        include_str!("../../../skills/uniapp-wot-h5/scaffold.md").to_string(),
        include_str!("../../../skills/uniapp-wot-h5/amis-to-vue-mapping.md").to_string(),
    ]
}
```

> 说明：`include_str!` 依赖 Section 4 的 skills 文件。如果执行顺序让 Section 4 落后，先把这两个 `include_str!` 换成空字符串占位，等 Section 4 完成后恢复。

- [ ] **Step 2: 临时占位**

在 Section 4 尚未完成前，把 `build_system_prompt` 改为临时版本：

```rust
fn build_system_prompt(tech_stack: &str, ui_library: &str) -> Vec<String> {
    vec![
        format!("你是资深前端工程师。当前任务是根据 Amis JSON 生成 {} + {} 的项目代码。", tech_stack, ui_library),
        "（skills 尚未加载 —— Section 4 会填充）".to_string(),
    ]
}
```

Section 4 完成后再换回 `include_str!` 版本。

- [ ] **Step 3: 更新 handlers/mod.rs**

编辑 `backend/src/handlers/mod.rs` 追加：

```rust
pub mod project_generation;
```

- [ ] **Step 4: 挂载路由**

编辑 `backend/src/main.rs`，在 "模板库" 路由之后插入：

```rust
        // 项目代码生成任务
        .route("/api/projects/tasks", get(handlers::project_generation::list_tasks).post(handlers::project_generation::create_task))
        .route("/api/projects/tasks/:id", get(handlers::project_generation::get_task))
        .route("/api/projects/tasks/:id/message", post(handlers::project_generation::append_message))
        .route("/api/projects/tasks/:id/stop", post(handlers::project_generation::stop_task))
```

- [ ] **Step 5: 编译验证**

Run:
```bash
cd backend && cargo check
```

Expected: 无错。

- [ ] **Step 6: Commit**

```bash
git add backend/src/handlers/ backend/src/main.rs
git commit -m "feat(backend): 项目代码生成任务 handler（CRUD + 追加消息 + 停止）"
```

---

## Task 3.5：WebSocket 事件聚合

**Files:**
- Create: `backend/src/handlers/project_events_ws.rs`
- Modify: `backend/src/handlers/mod.rs`
- Modify: `backend/src/main.rs`
- Modify: `backend/Cargo.toml`

- [ ] **Step 1: 增加依赖**

编辑 `backend/Cargo.toml`，在 `[dependencies]` 末尾追加：

```toml
tokio-tungstenite = { version = "0.23", features = ["rustls-tls-webpki-roots"] }
futures-util = "0.3"
```

并把 axum 改为带 ws feature：

```toml
axum = { version = "0.7", features = ["multipart", "ws"] }
```

- [ ] **Step 2: 实现 WS handler**

文件 `backend/src/handlers/project_events_ws.rs`：

```rust
use axum::{
    extract::{
        ws::{Message, WebSocket, WebSocketUpgrade},
        Path, State,
    },
    response::IntoResponse,
};
use futures_util::{SinkExt, StreamExt};
use sea_orm::{ActiveModelTrait, EntityTrait, Set};
use serde_json::json;

use crate::entity::{project_generation_task, project_task_event};
use crate::utils::jwt;
use crate::AppState;

pub async fn ws_events(
    ws: WebSocketUpgrade,
    State(state): State<AppState>,
    Path(id): Path<i32>,
    _auth: jwt::AuthUser,
) -> impl IntoResponse {
    ws.on_upgrade(move |socket| handle_ws(socket, state, id))
}

async fn handle_ws(mut socket: WebSocket, state: AppState, task_id: i32) {
    // 1. 先查到 task 和 session_id
    let task = match project_generation_task::Entity::find_by_id(task_id).one(&state.db).await {
        Ok(Some(t)) => t,
        _ => {
            let _ = socket.send(Message::Text(json!({"event_type":"error","message":"任务不存在"}).to_string())).await;
            return;
        }
    };
    let Some(session_id) = task.claw_session_id.clone() else {
        let _ = socket.send(Message::Text(json!({"event_type":"error","message":"session 未创建"}).to_string())).await;
        return;
    };

    // 2. 连接 claw-agent-server 的 WS
    let claw_ws_url = state.claw_agent_url.replace("http", "ws") + &format!("/tasks/{}/events", session_id);
    let (claw_stream, _) = match tokio_tungstenite::connect_async(&claw_ws_url).await {
        Ok(s) => s,
        Err(e) => {
            let _ = socket.send(Message::Text(json!({"event_type":"error","message": format!("连接 claw-agent 失败: {e}")}).to_string())).await;
            return;
        }
    };
    let (_claw_tx, mut claw_rx) = claw_stream.split();

    // 3. 转发 claw 事件到前端 WS，并落库到 project_task_event
    loop {
        tokio::select! {
            msg = claw_rx.next() => {
                match msg {
                    Some(Ok(tokio_tungstenite::tungstenite::Message::Text(txt))) => {
                        // 落库
                        if let Ok(payload) = serde_json::from_str::<serde_json::Value>(&txt) {
                            let event_type = payload.get("event_type").and_then(|v| v.as_str()).unwrap_or("unknown").to_string();
                            let _ = project_task_event::ActiveModel {
                                task_id: Set(task_id),
                                event_type: Set(event_type),
                                payload: Set(payload.clone()),
                                created_at: Set(chrono::Local::now().naive_local()),
                                ..Default::default()
                            }.insert(&state.db).await;

                            // 特殊事件：Agent 说"代码就绪，请启动 dev" → 这里不在 plan MVP 里做复杂状态机
                            // 前端消费事件决定下一步
                        }
                        if socket.send(Message::Text(txt)).await.is_err() { break; }
                    }
                    Some(Ok(_)) => {} // 忽略其他帧
                    Some(Err(_)) | None => break,
                }
            }
            client_msg = socket.recv() => {
                if client_msg.is_none() { break; }
            }
        }
    }
}
```

- [ ] **Step 3: 注册路由**

在 `backend/src/handlers/mod.rs` 追加：

```rust
pub mod project_events_ws;
```

在 `backend/src/main.rs` 的 Router 追加（紧随 `stop_task` 路由之后）：

```rust
        .route("/api/projects/tasks/:id/events", get(handlers::project_events_ws::ws_events))
```

- [ ] **Step 4: 编译验证**

Run:
```bash
cd backend && cargo check
```

Expected: 无错。

- [ ] **Step 5: Commit**

```bash
git add backend/Cargo.toml backend/src/handlers/project_events_ws.rs backend/src/handlers/mod.rs backend/src/main.rs
git commit -m "feat(backend): WebSocket 事件聚合并落库到 project_task_event"
```

---

## Task 3.6：自修复循环（检测 dev_failed → 回填消息）

**Files:**
- Modify: `backend/src/handlers/project_events_ws.rs`

- [ ] **Step 1: 在 WS handler 中加入事件处理分支**

在 `handle_ws` 的 `if let Ok(payload) = ...` 块内、`落库` 之后、`socket.send` 之前插入：

```rust
                            // 自修复触发
                            let event_type_str = payload.get("event_type").and_then(|v| v.as_str()).unwrap_or("");
                            if event_type_str == "tool_result" {
                                // 检查是否是 dev-start 的失败结果
                                let output = payload.get("output").and_then(|v| v.as_str()).unwrap_or("");
                                if output.contains("\"dev_status\":\"failed\"") || output.contains("[vite]") && output.contains("error") {
                                    // 取当前 fix_attempts 并判断
                                    let cur = project_generation_task::Entity::find_by_id(task_id).one(&state.db).await.ok().flatten();
                                    if let Some(cur) = cur {
                                        if cur.fix_attempts < 5 {
                                            let mut m: project_generation_task::ActiveModel = cur.clone().into();
                                            m.fix_attempts = Set(cur.fix_attempts + 1);
                                            m.updated_at = Set(chrono::Local::now().naive_local());
                                            let _ = m.update(&state.db).await;

                                            let fix_msg = format!(
                                                "项目启动失败，请读取 /tmp/vite.log 里的完整错误日志，分析并修复。修复后重新执行 pnpm run dev:h5。\n部分日志：\n{}",
                                                output.chars().take(2000).collect::<String>()
                                            );
                                            let _ = crate::services::claw_agent_client::append_message(
                                                &state.http_client, &state.claw_agent_url, &session_id, &fix_msg
                                            ).await;
                                        } else {
                                            let mut m: project_generation_task::ActiveModel = cur.into();
                                            m.status = Set("waiting_user".into());
                                            m.updated_at = Set(chrono::Local::now().naive_local());
                                            let _ = m.update(&state.db).await;
                                        }
                                    }
                                }
                            }
```

- [ ] **Step 2: 编译验证**

Run:
```bash
cd backend && cargo check
```

Expected: 无错。

- [ ] **Step 3: Commit**

```bash
git add backend/src/handlers/project_events_ws.rs
git commit -m "feat(backend): dev 失败自修复循环（最多 5 次）"
```

---

## Task 3.7：`/preview/{task_id}/` Nginx 反代

**Files:**
- Modify: `shared/docker/nginx/nginx.conf`

- [ ] **Step 1: 追加 preview location**

在 `shared/docker/nginx/nginx.conf` 的 `/api/internal/` 规则之前插入：

```nginx
    # 沙箱预览反代：/preview/{task_id}/ → 127.0.0.1:{preview_port}/
    # MVP 做法：前端在 iframe src 上直接拼 port，例如 http://host:20001/
    # 作为过渡，这里先留一个通用匹配，后续迭代改成基于 task_id 动态查询端口（需要 lua 或 OpenResty）
    location ~ ^/preview/(\d+)/(.*)$ {
        set $port $1;
        set $rest $2;
        # 生产部署用 njs / lua 查表；MVP 使用前端直连 host:port，见前端 iframe 实现
        return 501 'MVP 阶段请前端直接使用 http://<host>:<preview_port>/ 访问沙箱。';
    }
```

> 说明：真正按 path 路由的 dynamic port 方案需要 Nginx 动态 upstream（如 OpenResty / njs）。**MVP 阶段前端直接拿 `preview_port` 拼 iframe src 即可**，这段配置作为未来升级的占位。

- [ ] **Step 2: Commit**

```bash
git add shared/docker/nginx/nginx.conf
git commit -m "chore: Nginx 预留 /preview/{task_id}/ 路由占位"
```

---

## Section 3 验收

端到端手动验证（假设 sandbox-service + claw-agent-server 已跑，LLM 配置可用）：

```bash
# 登录取 JWT
TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"admin123"}' | jq -r .token)

# 创建任务
curl -s -X POST http://localhost:8080/api/projects/tasks \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{
    "amis_json":"{\"type\":\"page\",\"body\":{\"type\":\"crud\",\"api\":\"/api/users\"}}",
    "tech_stack":"uniapp-wot-h5",
    "ui_library":"wot-ui"
  }' | jq .

# 列表
curl -s -H "Authorization: Bearer $TOKEN" http://localhost:8080/api/projects/tasks | jq .

# 详情
curl -s -H "Authorization: Bearer $TOKEN" http://localhost:8080/api/projects/tasks/1 | jq .
```

Expected：
- 创建接口返回 JSON 包含 `id`、`status="running"`、`sandbox_id`、`preview_port`、`claw_session_id`
- 列表返回 `items`、`total`
- 详情返回 `task` + `events` + `messages`

---

# Section 4 · 知识库三层（脚手架 + Skills + RAG）

**里程碑验收标准**：
- `scaffolds/uniapp-wot-h5-template/` 是可直接 `pnpm install && pnpm run dev:h5` 跑起来的空壳项目（由用户提供种子；本 plan 做占位与 README）
- `skills/uniapp-wot-h5/` 下 6 份 Skills markdown 就位
- `code_sample` 表自动建表并带 pgvector 索引
- Python agent 新增 `POST /internal/index-code-sample` 能把项目代码入库
- RAG 检索层扩展出新函数 `search_code_samples`

---

## Task 4.1：脚手架模板占位 + README（用户后续填充真实项目）

**Files:**
- Create: `scaffolds/uniapp-wot-h5-template/README.md`
- Create: `scaffolds/uniapp-wot-h5-template/.gitkeep`

- [ ] **Step 1: 创建目录占位**

```bash
mkdir -p scaffolds/uniapp-wot-h5-template
```

文件 `scaffolds/uniapp-wot-h5-template/.gitkeep`：留空。

文件 `scaffolds/uniapp-wot-h5-template/README.md`：

```markdown
# UniApp + Wot UI H5 脚手架模板

此目录应包含一个可直接运行的 UniApp + Wot UI 项目骨架，用于反向代码生成飞轮。

## 要求

- 根目录含有 `package.json`，scripts 至少包含 `dev:h5`（基于 `vite --host 0.0.0.0 --port 5173`）
- `src/pages/` 目录存在（Agent 会在此目录生成页面）
- `src/api/` 提供 axios 请求封装（Agent 会基于此封装调用 Amis JSON 里的 api）
- `pages.json` 预留一个默认空白首页，Agent 会追加新的页面路由

## 使用

Agent 在任务开局会执行：

```bash
cp -r /home/karl/Working/TianXing/amis-ai/scaffolds/uniapp-wot-h5-template/. /workspace/
cd /workspace && pnpm install
```

## TODO（用户填充）

- [ ] 建立完整的 UniApp + Wot UI 可运行项目
- [ ] 配置 Wot 主题 token
- [ ] 建立请求/响应拦截器
- [ ] 提供空的"登录页 / 列表页 / 表单页"作为 Wot 组件用法示例
```

- [ ] **Step 2: Commit**

```bash
git add scaffolds/uniapp-wot-h5-template/
git commit -m "feat: 脚手架模板目录占位（用户后续填充真实项目）"
```

---

## Task 4.2：Skills 之 scaffold.md

**Files:**
- Create: `skills/uniapp-wot-h5/scaffold.md`

- [ ] **Step 1: 创建文件**

文件 `skills/uniapp-wot-h5/scaffold.md`：

```markdown
# UniApp + Wot UI H5 脚手架规范

## 开局第一步

1. 从 `/home/karl/Working/TianXing/amis-ai/scaffolds/uniapp-wot-h5-template/` 复制脚手架到工作目录：
   ```bash
   cp -r /home/karl/Working/TianXing/amis-ai/scaffolds/uniapp-wot-h5-template/. .
   ```
2. 先不要执行 `pnpm install`（预览启动阶段会一并执行）
3. 以脚手架为基础开始增量编辑

## 目录约束

- `src/pages/{name}/index.vue`：页面组件（Vue 3 `<script setup lang="ts">`）
- `src/api/{resource}.ts`：按业务资源拆分的 API 模块
- `src/components/`：跨页复用组件
- `src/utils/`：通用工具
- `pages.json`：UniApp 路由与 tabbar 配置（每次新增页面必须同步）
- `App.vue`：全局样式与生命周期；不要删除脚手架中的 Wot 主题注入

## 编码约束

- 所有页面使用 `<script setup lang="ts">`
- 引入 Wot 组件使用"按需引入"（脚手架已配置自动引入，直接使用 `<wd-button>` 等标签）
- 请求走 `src/api/` 模块；禁止页面内直接 `uni.request`
- 日期显示使用 `dayjs`（脚手架已依赖）
- 严格模式：`tsconfig.json` `strict: true` 保持不动

## 禁止事项

- 禁止删除 `vite.config.ts` 中的 UniApp 插件注册
- 禁止修改 `manifest.json` 的 `appid`（由用户维护）
- 禁止引入 amis / amis-core 依赖（目标就是用原生 Wot 替代）
- 禁止新增与 H5 不兼容的插件（本次只跑 H5）

## 成功完成的标志

- `pnpm install` 无 peerDependency 错误
- `pnpm run dev:h5 --host 0.0.0.0 --port 5173` 输出 `Local: http://localhost:5173/`
- 浏览器打开首页能看到至少一个 Amis JSON 翻译出来的页面内容
```

- [ ] **Step 2: Commit**

```bash
git add skills/uniapp-wot-h5/scaffold.md
git commit -m "docs(skills): 新增 UniApp+Wot 脚手架规范"
```

---

## Task 4.3：Skills 之 amis-to-vue-mapping.md

**Files:**
- Create: `skills/uniapp-wot-h5/amis-to-vue-mapping.md`

- [ ] **Step 1: 创建文件**

文件 `skills/uniapp-wot-h5/amis-to-vue-mapping.md`：

```markdown
# Amis JSON → Vue 页面映射规则

## 顶层映射

Amis JSON 的顶层往往是一个 `page`；`page.body` 可能是单个组件或数组。规则：

- `page` → 一个 Vue 页面文件 `src/pages/{name}/index.vue`，页面标题 = `page.title`
- `page.body` 如果是数组 → 在 `<template>` 根节点里按顺序渲染每个子组件
- `page.body` 如果是 `form` / `crud` / `table` → 对应整页是"表单页/CRUD 页/列表页"

## 常见顶层类型

| Amis type | 生成策略 |
|-----------|----------|
| `page`    | 页面壳 |
| `form`    | 整页表单，Wot 组件用 `<wd-form>` + `<wd-cell-group>` |
| `crud`    | 列表页 + 弹窗表单；分页用 `<wd-pagination>`；搜索条件区用 `<wd-form>` |
| `dialog`  | 用 `<wd-popup>` 封装，页面 data 里控制显隐 |
| `panel`   | `<wd-card>` 包裹 |

## 数据流

- Amis 的 `initApi`（列表加载）→ Vue `onLoad` 里 await axios 调用 → 写入响应式 `list`
- Amis 的 `api`（表单提交）→ 表单 submit 事件里 await axios 调用 → 成功后 toast + 跳转
- `quickSaveApi` 等"单元格编辑"的 API → MVP 阶段归到"表单提交"统一处理

## Amis 组件 → Wot 组件映射（高频子集）

| Amis | Wot | 备注 |
|------|-----|------|
| `input-text` | `<wd-input>` | type="text" |
| `input-number` | `<wd-input-number>` | |
| `select` | `<wd-picker>` | options → columns |
| `checkbox` | `<wd-checkbox>` | |
| `switch` | `<wd-switch>` | |
| `date` | `<wd-datetime-picker type="date">` | |
| `textarea` | `<wd-textarea>` | |
| `button` | `<wd-button>` | type / size 属性映射 |
| `button-group` | `<wd-button-group>` | |
| `dialog` | `<wd-popup>` | v-model:show 控制 |
| `table` | `<wd-table>` 或原生 `<view>` + loop | 复杂表头可用原生 |
| `pagination` | `<wd-pagination>` | |
| `tabs` | `<wd-tabs>` | |
| `alert` | `<wd-message>` | |
| `toast` | `wd-toast` API 调用式 | |

## 缺失映射的处理

如果某 Amis 组件不在上表：
1. 先在 `src/components/custom/` 下写一个 Vue 组件实现等价视觉与行为
2. 命名用 `Custom{AmisType}.vue`
3. 在页面里直接使用，不要假装 Wot 有对应组件

## 页面必备结构骨架

```vue
<template>
  <view class="page-root">
    <!-- Amis body 翻译到这里 -->
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import * as api from '@/api/{resource}'

const list = ref<any[]>([])
const loading = ref(false)

onLoad(async () => {
  loading.value = true
  try {
    const res = await api.fetchList({})
    list.value = res.items ?? []
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.page-root { padding: 16rpx; }
</style>
```
```

- [ ] **Step 2: Commit**

```bash
git add skills/uniapp-wot-h5/amis-to-vue-mapping.md
git commit -m "docs(skills): Amis JSON 到 Vue 页面映射规则"
```

---

## Task 4.4：Skills 之其他 4 份（component-mapping / api-adapter / pages-json-rules / common-errors）

**Files:**
- Create: `skills/uniapp-wot-h5/component-mapping.md`
- Create: `skills/uniapp-wot-h5/api-adapter.md`
- Create: `skills/uniapp-wot-h5/pages-json-rules.md`
- Create: `skills/uniapp-wot-h5/common-errors.md`

- [ ] **Step 1: 创建 component-mapping.md**

文件 `skills/uniapp-wot-h5/component-mapping.md`：

```markdown
# Amis 组件属性 → Wot 组件属性详细对照

## input-text → wd-input

| Amis 属性 | Wot 属性 | 转换逻辑 |
|-----------|----------|----------|
| `name`    | `modelValue` 的 key | 写 `v-model="form.xxx"` |
| `label`   | `label`  | 直接映射 |
| `placeholder` | `placeholder` | 直接 |
| `required` | `required` + rules | Wot 校验通过 form rules |
| `maxLength` | `maxlength` | 注意大小写 |
| `clearable` | `clearable` | 默认 true |

## select → wd-picker

| Amis 属性 | Wot 属性 |
|-----------|----------|
| `options: [{label,value}]` | `columns: [{label,value}]` |
| `multiple` | Wot 原生不支持多选 picker → 用 `<wd-checkbox-group>` 代替 |
| `searchable` | 用 `<wd-input>` + 筛选逻辑自行实现 |

## crud

没有直接对应的 Wot 组件。需要组合：
- 搜索区：`<wd-form>`
- 操作栏：`<wd-button-group>`（新增/批量删除）
- 列表：`<wd-table>`（少量字段）或 `v-for` 渲染 `<wd-card>`（信息量大）
- 分页：`<wd-pagination>`

> Amis `crud` 自带"新增 → 弹窗表单 → 保存"流程，Vue 侧应显式开一个 `<wd-popup>` 承载表单。

## 其他高频对照

| Amis | Wot |
|------|-----|
| `icon` | `<wd-icon name="xxx">` |
| `avatar` | `<wd-img round>` |
| `badge` | `<wd-badge>` |
| `progress` | `<wd-progress>` |
| `divider` | `<wd-divider>` |
| `card` | `<wd-card>` |
| `grid` | CSS Grid 原生实现 |
```

- [ ] **Step 2: 创建 api-adapter.md**

文件 `skills/uniapp-wot-h5/api-adapter.md`：

```markdown
# Amis API 协议 → axios 封装

## Amis API 格式

```json
{ "method": "get", "url": "/api/users", "data": {"page": 1}, "dataType": "json" }
```

## 翻译规则

1. `method` 默认 `get`（列表）或 `post`（表单提交）
2. `url` 如果是相对路径，追加 `VITE_API_BASE`（在 vite.config.ts 里定义）
3. `data`：
   - GET 请求 → 拼 query string
   - POST 请求 → body
4. `dataType` 目前全部按 JSON 处理

## 封装位置

脚手架已提供 `src/api/http.ts`：

```ts
import axios from 'axios'

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || '/api',
  timeout: 30000,
})

http.interceptors.response.use(
  (resp) => resp.data,
  (err) => Promise.reject(err)
)
```

## 新增资源模块

Agent 每次遇到新的 API URL，应新建 `src/api/{resource}.ts`：

```ts
import { http } from './http'

export const fetchList = (params: any) => http.get('/users', { params })
export const create = (data: any) => http.post('/users', data)
export const update = (id: number, data: any) => http.put(`/users/${id}`, data)
export const remove = (id: number) => http.delete(`/users/${id}`)
```

## 错误处理

- 网络错误：axios 默认抛出 → 页面里 catch 后 `uni.showToast({icon:'none', title:'请求失败'})`
- 业务错误：响应体里 `code !== 0` → 在 response interceptor 里统一抛出
```

- [ ] **Step 3: 创建 pages-json-rules.md**

文件 `skills/uniapp-wot-h5/pages-json-rules.md`：

```markdown
# pages.json 更新规则

## 结构

```json
{
  "pages": [
    { "path": "pages/index/index", "style": { "navigationBarTitleText": "首页" } }
  ],
  "globalStyle": { "navigationBarTextStyle": "black" },
  "easycom": { "autoscan": true, "custom": {} }
}
```

## Agent 每生成一个页面必须同步

1. 在 `pages` 数组尾部追加一项：
   ```json
   { "path": "pages/users/index", "style": { "navigationBarTitleText": "用户列表" } }
   ```
2. `navigationBarTitleText` 来自 Amis `page.title`，没提供则用资源名中文化
3. 如果 Amis JSON 里有多个 page 级入口，第一个自动设为首页（放数组第 0 位）

## tabbar（MVP 可选）

如果 Amis JSON 顶层是多个 `page` 且业务语义是"多模块首页"，才生成 tabbar；否则不加。

## 文件编辑要点

- 使用 `edit_file` 而不是全量 `write_file`，避免覆盖用户的手工改动
- 新增项严格校验 JSON 语法
```

- [ ] **Step 4: 创建 common-errors.md**

文件 `skills/uniapp-wot-h5/common-errors.md`：

```markdown
# 常见错误修复手册（飞轮沉淀区）

> 这份文件用于累积"Agent 自修复过的典型错误 + 正确解法"。初版为空，每次飞轮采纳时人工补充。

## 格式

每条错误用如下结构：

```
### [错误标题]
**错误日志关键字**：…
**根因**：…
**修复动作**：具体编辑步骤 / 命令
```

## 示例（占位）

### Cannot find module '@dcloudio/uni-app'
**错误日志关键字**：`Cannot find module '@dcloudio/uni-app'`
**根因**：脚手架依赖未安装或 pnpm lockfile 残缺。
**修复动作**：
1. 执行 `rm -rf node_modules pnpm-lock.yaml`
2. 执行 `pnpm install`
3. 重新 `pnpm run dev:h5`

（更多条目请持续补充）
```

- [ ] **Step 5: Commit**

```bash
git add skills/uniapp-wot-h5/
git commit -m "docs(skills): 新增 Amis→Wot 组件映射 / API 适配 / pages.json / 错误手册"
```

---

## Task 4.5：恢复 backend 的 `include_str!` 加载 skills

**Files:**
- Modify: `backend/src/handlers/project_generation.rs`

- [ ] **Step 1: 把 build_system_prompt 换回 include_str! 版本**

编辑 `backend/src/handlers/project_generation.rs`，把 Task 3.4 Step 2 的临时版本替换为：

```rust
fn build_system_prompt(tech_stack: &str, ui_library: &str) -> Vec<String> {
    vec![
        format!("你是资深前端工程师。当前任务是根据 Amis JSON 生成 {} + {} 的项目代码。", tech_stack, ui_library),
        include_str!("../../../skills/uniapp-wot-h5/scaffold.md").to_string(),
        include_str!("../../../skills/uniapp-wot-h5/amis-to-vue-mapping.md").to_string(),
    ]
}
```

- [ ] **Step 2: 编译验证**

Run:
```bash
cd backend && cargo check
```

Expected: 无错。如果 `include_str!` 找不到文件，按当前相对路径重新计算到 skills 目录。

- [ ] **Step 3: Commit**

```bash
git add backend/src/handlers/project_generation.rs
git commit -m "feat(backend): 加载 uniapp-wot-h5 核心 skills 到系统 prompt"
```

---

## Task 4.6：code_sample 表 + pgvector 列

**Files:**
- Create: `backend/src/entity/code_sample.rs`
- Modify: `backend/src/entity/mod.rs`
- Modify: `backend/src/main.rs`

- [ ] **Step 1: 创建实体**

文件 `backend/src/entity/code_sample.rs`：

```rust
use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Serialize, Deserialize)]
#[sea_orm(table_name = "code_sample")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: i32,
    pub tech_stack: String,
    pub page_type: Option<String>,
    #[sea_orm(column_type = "Text")]
    pub amis_json: String,
    #[sea_orm(column_type = "Json")]
    pub generated_code: serde_json::Value,
    #[sea_orm(column_type = "Text", nullable)]
    pub summary: Option<String>,
    pub quality_score: Option<f32>,
    pub source_task_id: Option<i32>,
    pub created_at: DateTime,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {}

impl ActiveModelBehavior for ActiveModel {}
```

- [ ] **Step 2: mod.rs 导出**

编辑 `backend/src/entity/mod.rs` 追加：

```rust
pub mod code_sample;
```

- [ ] **Step 3: main.rs 建表 + pgvector 列**

在 `main.rs` 的建表段追加：

```rust
    let _ = db.execute(builder.build(&schema.create_table_from_entity(code_sample::Entity))).await;
    let _ = db.execute_unprepared(
        "DO $$ BEGIN
            ALTER TABLE code_sample ADD COLUMN IF NOT EXISTS embedding vector(1536);
        EXCEPTION WHEN others THEN NULL;
        END $$;"
    ).await;
    let _ = db.execute_unprepared(
        "CREATE INDEX IF NOT EXISTS idx_code_sample_embedding
         ON code_sample USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100)"
    ).await;
```

并在 `use entity::{...}` 导入中补上 `code_sample`。

- [ ] **Step 4: 编译验证**

Run:
```bash
cd backend && cargo check
```

Expected: 无错。

- [ ] **Step 5: Commit**

```bash
git add backend/src/entity/code_sample.rs backend/src/entity/mod.rs backend/src/main.rs
git commit -m "feat(backend): 新增 code_sample 表 + pgvector 向量列与索引"
```

---

## Task 4.7：Python agent 新增 `POST /internal/index-code-sample`

**Files:**
- Modify: `agent/src/routers/` 下新增文件 `code_sample.py`（如果路径不同，参考 `agent/src/main.py` 的路由注册方式）
- Modify: `agent/src/main.py`

- [ ] **Step 1: 了解现有 Python 项目结构**

Run:
```bash
find agent/src -type f -name "*.py" | head -20
```

Expected: 列出 `main.py`、`routers/`、`services/` 等文件；按实际布局调整下面的路径。

- [ ] **Step 2: 创建 code_sample 路由**

文件 `agent/src/routers/code_sample.py`：

```python
from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel
from typing import Any, Optional
import os

from ..services.embedding import embed_text
from ..db import get_db

router = APIRouter()

INTERNAL_KEY = os.getenv("INTERNAL_API_KEY", "")


class IndexCodeSamplePayload(BaseModel):
    tech_stack: str
    page_type: Optional[str] = None
    amis_json: str
    generated_code: dict  # { path: content }
    summary: Optional[str] = None
    source_task_id: Optional[int] = None


@router.post("/internal/index-code-sample")
async def index_code_sample(
    payload: IndexCodeSamplePayload,
    x_internal_key: str = Header(default=""),
):
    if INTERNAL_KEY and x_internal_key != INTERNAL_KEY:
        raise HTTPException(status_code=403, detail="invalid internal key")

    summary = payload.summary or _auto_summary(payload.amis_json, payload.generated_code)
    vec = await embed_text(summary)

    async with get_db() as conn:
        await conn.execute(
            """
            INSERT INTO code_sample
              (tech_stack, page_type, amis_json, generated_code, summary, source_task_id, embedding, created_at)
            VALUES ($1, $2, $3, $4::jsonb, $5, $6, $7, NOW())
            """,
            payload.tech_stack,
            payload.page_type,
            payload.amis_json,
            payload.generated_code,
            summary,
            payload.source_task_id,
            vec,
        )
    return {"ok": True}


def _auto_summary(amis_json: str, generated_code: dict) -> str:
    # 极简摘要：取 Amis JSON 顶层 type + 文件数量
    import json
    try:
        top = json.loads(amis_json)
        top_type = top.get("type", "unknown")
    except Exception:
        top_type = "invalid"
    return f"tech=uniapp-wot-h5 top={top_type} files={len(generated_code)}"
```

> 说明：如果 `agent/src/db.py` 或 `embedding.py` 的接口名不同，按实际调整。关键是"向量化 summary，写入 code_sample 表"。

- [ ] **Step 3: 在 main.py 注册路由**

编辑 `agent/src/main.py`，在 include_router 段追加：

```python
from .routers.code_sample import router as code_sample_router
app.include_router(code_sample_router)
```

- [ ] **Step 4: 冒烟测试**

Run:
```bash
cd agent && uv run uvicorn src.main:app --port 8000 &
sleep 3
curl -s -X POST http://localhost:8000/internal/index-code-sample \
  -H 'Content-Type: application/json' \
  -d '{
    "tech_stack":"uniapp-wot-h5",
    "page_type":"list",
    "amis_json":"{\"type\":\"page\",\"body\":{\"type\":\"crud\"}}",
    "generated_code":{"src/pages/users/index.vue":"<template>..</template>"}
  }' | jq .
kill %1
```

Expected: `{"ok": true}`，并且 `code_sample` 表多一条记录。

- [ ] **Step 5: Commit**

```bash
git add agent/src/routers/code_sample.py agent/src/main.py
git commit -m "feat(agent): 新增 code_sample 向量入库内部端点"
```

---

## Task 4.8：后端 `POST /api/projects/tasks/:id/adopt` 触发回流

**Files:**
- Modify: `backend/src/handlers/project_generation.rs`
- Modify: `backend/src/main.rs`

- [ ] **Step 1: 新增 adopt handler**

在 `backend/src/handlers/project_generation.rs` 末尾追加：

```rust
use walkdir::WalkDir;

pub async fn adopt_task(
    State(state): State<AppState>,
    _auth: jwt::AuthUser,
    Path(id): Path<i32>,
) -> impl IntoResponse {
    let task = match project_generation_task::Entity::find_by_id(id).one(&state.db).await {
        Ok(Some(t)) => t,
        _ => return (StatusCode::NOT_FOUND, Json(json!({"error":"任务不存在"}))).into_response(),
    };
    let Some(workdir) = task.workdir_path.clone() else {
        return (StatusCode::CONFLICT, Json(json!({"error":"任务无工作目录"}))).into_response();
    };

    // 1. 读取工作目录所有文件（限制在 1MB 以内，跳过 node_modules/.git）
    let mut files = serde_json::Map::new();
    for entry in WalkDir::new(&workdir).into_iter().filter_map(|e| e.ok()) {
        let path = entry.path();
        if path.is_dir() { continue; }
        let rel = match path.strip_prefix(&workdir) {
            Ok(r) => r.to_string_lossy().to_string(),
            Err(_) => continue,
        };
        if rel.starts_with("node_modules/") || rel.starts_with(".git/") { continue; }
        if let Ok(meta) = entry.metadata() {
            if meta.len() > 1_000_000 { continue; }
        }
        if let Ok(content) = std::fs::read_to_string(path) {
            files.insert(rel, serde_json::Value::String(content));
        }
    }

    // 2. 调 agent 入库
    let agent_url = std::env::var("AGENT_URL").unwrap_or_else(|_| "http://localhost:8000".to_string());
    let internal_key = std::env::var("INTERNAL_API_KEY").unwrap_or_default();
    let payload = serde_json::json!({
        "tech_stack": task.tech_stack,
        "page_type": null,
        "amis_json": task.amis_json,
        "generated_code": serde_json::Value::Object(files),
        "source_task_id": task.id,
    });
    let resp = state.http_client.post(format!("{}/internal/index-code-sample", agent_url))
        .header("X-Internal-Key", internal_key)
        .json(&payload).send().await;
    if let Err(e) = resp {
        return (StatusCode::BAD_GATEWAY, Json(json!({"error": format!("入库失败: {e}")}))).into_response();
    }

    // 3. 标记 adopted_at
    let mut active: project_generation_task::ActiveModel = task.clone().into();
    active.adopted_at = Set(Some(chrono::Local::now().naive_local()));
    active.status = Set("adopted".into());
    active.updated_at = Set(chrono::Local::now().naive_local());
    let _ = active.update(&state.db).await;

    Json(json!({"ok": true, "task_id": id})).into_response()
}
```

- [ ] **Step 2: 添加 walkdir 依赖**

编辑 `backend/Cargo.toml`，在 `[dependencies]` 追加：

```toml
walkdir = "2"
```

- [ ] **Step 3: 挂载路由**

在 `backend/src/main.rs` 追加：

```rust
        .route("/api/projects/tasks/:id/adopt", post(handlers::project_generation::adopt_task))
```

- [ ] **Step 4: 编译验证**

Run:
```bash
cd backend && cargo check
```

Expected: 无错。

- [ ] **Step 5: Commit**

```bash
git add backend/
git commit -m "feat(backend): 实现采纳任务接口触发 code_sample 入库"
```

---

## Section 4 验收

- `code_sample` 表创建成功，`\d code_sample` 包含 `embedding` 列
- `skills/uniapp-wot-h5/` 下有 6 份 md 文件
- `scaffolds/uniapp-wot-h5-template/` 目录存在（内容待用户填充）
- `POST /internal/index-code-sample` 能向量化并写入记录
- `POST /api/projects/tasks/:id/adopt` 能把工作区代码扫出并入库

---

# Section 5 · 前端项目工作台

**里程碑验收标准**：
- 侧栏新增 `/projects` 菜单
- `/projects` 列表页：显示任务表格，支持创建（粘贴 Amis JSON + 选技术栈）
- `/projects/:id` 详情页：四象限——事件流、文件树/diff、iframe 预览、对话框
- Chat 页"预览"区新增"生成项目代码"按钮
- WebSocket 实时显示 Agent 事件
- 采纳按钮调用 `/api/projects/tasks/:id/adopt`

---

## Task 5.1：前端服务层封装

**Files:**
- Create: `frontend/src/services/projectTasks.ts`
- Modify: `frontend/src/types/index.ts`（如果存在；不存在则新建）

- [ ] **Step 1: 确认 types/index.ts**

Run:
```bash
cat frontend/src/types/index.ts 2>/dev/null || echo "[not found]"
```

如果输出 `[not found]`：创建一个空文件 `frontend/src/types/index.ts` 内容：
```ts
export interface GenerationHistory {
  id: number;
  user_prompt: string;
  generated_json: string;
  status: string;
  created_at: string;
  adopted_at?: string | null;
}
```
（如果已存在，追加 `ProjectTask` 类型，不删除既有内容）

- [ ] **Step 2: 追加 ProjectTask 与 ProjectTaskEvent 类型**

编辑 `frontend/src/types/index.ts`，在末尾追加：

```ts
export interface ProjectTask {
  id: number;
  user_id: number;
  source_history_id?: number | null;
  amis_json: string;
  tech_stack: string;
  ui_library: string;
  extra_prompt?: string | null;
  status: 'pending' | 'running' | 'waiting_user' | 'succeeded' | 'failed' | 'stopped' | 'adopted';
  repo_path?: string | null;
  workdir_path?: string | null;
  sandbox_id?: string | null;
  preview_port?: number | null;
  claw_session_id?: string | null;
  fix_attempts: number;
  adopted_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectTaskEvent {
  id: number;
  task_id: number;
  event_type: string;
  payload: any;
  created_at: string;
}

export interface ProjectTaskMessage {
  id: number;
  task_id: number;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
}
```

- [ ] **Step 3: 创建 services/projectTasks.ts**

文件 `frontend/src/services/projectTasks.ts`：

```ts
import api from './api';
import type { ProjectTask, ProjectTaskEvent, ProjectTaskMessage } from '../types';

export async function listTasks(page = 1, pageSize = 20): Promise<{
  items: ProjectTask[]; total: number; page: number; page_size: number;
}> {
  const { data } = await api.get('/projects/tasks', { params: { page, page_size: pageSize } });
  return data;
}

export async function getTask(id: number): Promise<{
  task: ProjectTask;
  events: ProjectTaskEvent[];
  messages: ProjectTaskMessage[];
}> {
  const { data } = await api.get(`/projects/tasks/${id}`);
  return data;
}

export async function createTask(payload: {
  source_history_id?: number;
  amis_json: string;
  tech_stack: string;
  ui_library: string;
  extra_prompt?: string;
}): Promise<ProjectTask> {
  const { data } = await api.post('/projects/tasks', payload);
  return data;
}

export async function appendMessage(id: number, content: string): Promise<void> {
  await api.post(`/projects/tasks/${id}/message`, { content });
}

export async function stopTask(id: number): Promise<void> {
  await api.post(`/projects/tasks/${id}/stop`);
}

export async function adoptTask(id: number): Promise<void> {
  await api.post(`/projects/tasks/${id}/adopt`);
}

export function openEventsWs(id: number, token: string): WebSocket {
  // 注意：浏览器端访问 ws(s)://{host}:8080/api/projects/tasks/{id}/events
  const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
  const host = window.location.hostname;
  // Rust backend 监听 8080；若经由 nginx，直接 wss://{host}/api/... 亦可
  const url = `${proto}://${host}:8080/api/projects/tasks/${id}/events?token=${encodeURIComponent(token)}`;
  return new WebSocket(url);
}
```

> 说明：WebSocket 鉴权采用 query 参数传 token（浏览器 WS 无法传自定义 header）。Backend 的 WS handler 需要支持从 query 读 token；本 plan 中 `jwt::AuthUser` extractor 需要增强—— 如果实际实现里仅支持 Authorization header，则 Section 6 联调时再按需扩展 extractor 或改为临时关闭 WS 鉴权。

- [ ] **Step 4: Commit**

```bash
git add frontend/src/types/ frontend/src/services/projectTasks.ts
git commit -m "feat(frontend): 项目任务服务封装（REST + WebSocket）"
```

---

## Task 5.2：Projects 列表页

**Files:**
- Create: `frontend/src/views/Projects/index.tsx`
- Create: `frontend/src/views/Projects/CreateTaskModal.tsx`

- [ ] **Step 1: 创建列表页**

文件 `frontend/src/views/Projects/index.tsx`：

```tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Table, Tag, Space, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { listTasks } from '../../services/projectTasks';
import type { ProjectTask } from '../../types';
import CreateTaskModal from './CreateTaskModal';

const statusColor: Record<ProjectTask['status'], string> = {
  pending: 'default',
  running: 'processing',
  waiting_user: 'warning',
  succeeded: 'success',
  failed: 'error',
  stopped: 'default',
  adopted: 'success',
};

export default function Projects() {
  const nav = useNavigate();
  const [items, setItems] = useState<ProjectTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await listTasks();
      setItems(res.items);
    } catch (e: any) {
      message.error(e?.message ?? '加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const columns: ColumnsType<ProjectTask> = [
    { title: 'ID', dataIndex: 'id', width: 70 },
    { title: '技术栈', dataIndex: 'tech_stack', width: 140 },
    { title: '状态', dataIndex: 'status', width: 130, render: (s: ProjectTask['status']) => (
      <Tag color={statusColor[s]}>{s}</Tag>
    )},
    { title: '修复次数', dataIndex: 'fix_attempts', width: 100 },
    { title: '预览端口', dataIndex: 'preview_port', width: 100 },
    { title: '创建时间', dataIndex: 'created_at', width: 200 },
    { title: '操作', key: 'op', width: 120, render: (_, r) => (
      <Button type="link" onClick={() => nav(`/projects/${r.id}`)}>查看</Button>
    )},
  ];

  return (
    <div style={{ padding: 24 }}>
      <Space style={{ marginBottom: 16 }}>
        <Button type="primary" onClick={() => setOpen(true)}>创建任务</Button>
        <Button onClick={load}>刷新</Button>
      </Space>
      <Table
        rowKey="id"
        columns={columns}
        dataSource={items}
        loading={loading}
        pagination={{ pageSize: 20 }}
      />
      <CreateTaskModal
        open={open}
        onClose={() => setOpen(false)}
        onCreated={(id) => { setOpen(false); load(); nav(`/projects/${id}`); }}
      />
    </div>
  );
}
```

- [ ] **Step 2: 创建 CreateTaskModal**

文件 `frontend/src/views/Projects/CreateTaskModal.tsx`：

```tsx
import { useState } from 'react';
import { Modal, Form, Input, Select, message } from 'antd';
import { createTask } from '../../services/projectTasks';

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: (id: number) => void;
  defaultAmisJson?: string;
  defaultSourceHistoryId?: number;
}

export default function CreateTaskModal({ open, onClose, onCreated, defaultAmisJson, defaultSourceHistoryId }: Props) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const onOk = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      const task = await createTask({
        amis_json: values.amis_json,
        tech_stack: values.tech_stack,
        ui_library: values.ui_library,
        extra_prompt: values.extra_prompt,
        source_history_id: defaultSourceHistoryId,
      });
      message.success('已创建任务');
      onCreated(task.id);
    } catch (e: any) {
      if (e?.errorFields) return; // validation 失败
      message.error(e?.message ?? '创建失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="创建代码生成任务" open={open} onCancel={onClose} onOk={onOk} confirmLoading={loading} width={760}>
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          tech_stack: 'uniapp-wot-h5',
          ui_library: 'wot-ui',
          amis_json: defaultAmisJson ?? '',
        }}
      >
        <Form.Item label="技术栈" name="tech_stack" rules={[{ required: true }]}>
          <Select options={[{ value: 'uniapp-wot-h5', label: 'UniApp + Wot UI (H5)' }]} />
        </Form.Item>
        <Form.Item label="UI 组件库" name="ui_library" rules={[{ required: true }]}>
          <Select options={[{ value: 'wot-ui', label: 'Wot UI' }]} />
        </Form.Item>
        <Form.Item label="Amis JSON" name="amis_json" rules={[{ required: true }]}>
          <Input.TextArea rows={10} placeholder='{"type":"page",...}' />
        </Form.Item>
        <Form.Item label="额外指令（可选）" name="extra_prompt">
          <Input.TextArea rows={3} placeholder="例如：表单校验规则更严格、使用深色主题" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/views/Projects/index.tsx frontend/src/views/Projects/CreateTaskModal.tsx
git commit -m "feat(frontend): 项目任务列表页与创建弹窗"
```

---

## Task 5.3：Projects 详情页（四象限）

**Files:**
- Create: `frontend/src/views/Projects/Detail.tsx`
- Create: `frontend/src/views/Projects/components/EventStream.tsx`
- Create: `frontend/src/views/Projects/components/TaskChat.tsx`
- Create: `frontend/src/views/Projects/components/SandboxPreview.tsx`

- [ ] **Step 1: 创建 EventStream 组件**

文件 `frontend/src/views/Projects/components/EventStream.tsx`：

```tsx
import { useEffect, useRef } from 'react';
import { Tag } from 'antd';
import type { ProjectTaskEvent } from '../../../types';

const typeColor: Record<string, string> = {
  assistant_delta: 'blue',
  tool_use: 'purple',
  tool_result: 'green',
  turn_start: 'cyan',
  turn_complete: 'geekblue',
  error: 'red',
  waiting: 'gold',
};

export default function EventStream({ events }: { events: ProjectTaskEvent[] }) {
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [events.length]);
  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: 8, background: '#fafafa', borderRadius: 6, fontFamily: 'monospace', fontSize: 12 }}>
      {events.map((e) => (
        <div key={e.id} style={{ marginBottom: 6 }}>
          <Tag color={typeColor[e.event_type] ?? 'default'}>{e.event_type}</Tag>
          <span style={{ color: '#999', marginRight: 8 }}>{e.created_at.slice(11, 19)}</span>
          <code style={{ whiteSpace: 'pre-wrap' }}>
            {e.event_type === 'assistant_delta'
              ? (e.payload?.text ?? '')
              : JSON.stringify(e.payload)}
          </code>
        </div>
      ))}
      <div ref={endRef} />
    </div>
  );
}
```

- [ ] **Step 2: 创建 TaskChat 组件**

文件 `frontend/src/views/Projects/components/TaskChat.tsx`：

```tsx
import { useState } from 'react';
import { Input, Button, Space, message } from 'antd';
import type { ProjectTaskMessage } from '../../../types';
import { appendMessage } from '../../../services/projectTasks';

export default function TaskChat({
  taskId,
  messages,
  onSent,
}: {
  taskId: number;
  messages: ProjectTaskMessage[];
  onSent: () => void;
}) {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  const send = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setSending(true);
    try {
      await appendMessage(taskId, trimmed);
      setText('');
      onSent();
    } catch (e: any) {
      message.error(e?.message ?? '发送失败');
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, overflowY: 'auto', padding: 8, background: '#fff', border: '1px solid #eee', borderRadius: 6 }}>
        {messages.length === 0 && <div style={{ color: '#999' }}>暂无对话消息</div>}
        {messages.map((m) => (
          <div key={m.id} style={{ marginBottom: 8 }}>
            <b>{m.role}：</b>
            <span>{m.content}</span>
          </div>
        ))}
      </div>
      <Space.Compact style={{ marginTop: 8, width: '100%' }}>
        <Input.TextArea
          rows={2}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="发消息给 Agent…（温和打断：当前 turn 完成后生效）"
        />
        <Button type="primary" loading={sending} onClick={send}>发送</Button>
      </Space.Compact>
    </div>
  );
}
```

- [ ] **Step 3: 创建 SandboxPreview 组件**

文件 `frontend/src/views/Projects/components/SandboxPreview.tsx`：

```tsx
export default function SandboxPreview({ previewPort }: { previewPort?: number | null }) {
  if (!previewPort) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
        沙箱未就绪，等待 Agent 启动 dev server…
      </div>
    );
  }
  const src = `http://${window.location.hostname}:${previewPort}/`;
  return (
    <iframe
      src={src}
      title="preview"
      style={{ width: '100%', height: '100%', border: '1px solid #eee', borderRadius: 6 }}
    />
  );
}
```

- [ ] **Step 4: 创建 Detail.tsx**

文件 `frontend/src/views/Projects/Detail.tsx`：

```tsx
import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Space, Tag, message, Row, Col } from 'antd';
import { getTask, stopTask, adoptTask, openEventsWs } from '../../services/projectTasks';
import type { ProjectTask, ProjectTaskEvent, ProjectTaskMessage } from '../../types';
import EventStream from './components/EventStream';
import TaskChat from './components/TaskChat';
import SandboxPreview from './components/SandboxPreview';

export default function Detail() {
  const { id } = useParams();
  const nav = useNavigate();
  const [task, setTask] = useState<ProjectTask | null>(null);
  const [events, setEvents] = useState<ProjectTaskEvent[]>([]);
  const [messages, setMessages] = useState<ProjectTaskMessage[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const taskId = Number(id);

  const refresh = async () => {
    try {
      const res = await getTask(taskId);
      setTask(res.task);
      setEvents(res.events);
      setMessages(res.messages);
    } catch (e: any) {
      message.error(e?.message ?? '加载失败');
    }
  };

  useEffect(() => {
    refresh();
    const token = localStorage.getItem('token') ?? '';
    const ws = openEventsWs(taskId, token);
    wsRef.current = ws;
    ws.onmessage = (ev) => {
      try {
        const payload = JSON.parse(ev.data);
        const synthetic: ProjectTaskEvent = {
          id: Date.now() + Math.random(),
          task_id: taskId,
          event_type: payload.event_type ?? 'unknown',
          payload,
          created_at: new Date().toISOString(),
        };
        setEvents((prev) => [...prev, synthetic]);
      } catch { /* noop */ }
    };
    ws.onclose = () => { wsRef.current = null; };
    return () => { ws.close(); };
  }, [taskId]);

  const onStop = async () => {
    await stopTask(taskId);
    message.success('已停止');
    refresh();
  };

  const onAdopt = async () => {
    await adoptTask(taskId);
    message.success('已采纳并入库');
    refresh();
  };

  return (
    <div style={{ padding: 16, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Space style={{ marginBottom: 12 }}>
        <Button onClick={() => nav('/projects')}>返回列表</Button>
        <span>任务 #{taskId}</span>
        {task && <Tag color="blue">{task.status}</Tag>}
        {task && <Tag>修复 {task.fix_attempts}/5</Tag>}
        <Button danger onClick={onStop} disabled={!task || task.status === 'stopped' || task.status === 'adopted'}>停止</Button>
        <Button type="primary" onClick={onAdopt} disabled={!task || task.status === 'adopted'}>采纳并入库</Button>
        <Button onClick={refresh}>刷新</Button>
      </Space>
      <Row gutter={12} style={{ flex: 1, minHeight: 0 }}>
        <Col span={12} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ flex: 1, minHeight: 0 }}>
            <EventStream events={events} />
          </div>
          <div style={{ height: 220 }}>
            <TaskChat taskId={taskId} messages={messages} onSent={refresh} />
          </div>
        </Col>
        <Col span={12}>
          <SandboxPreview previewPort={task?.preview_port ?? undefined} />
        </Col>
      </Row>
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add frontend/src/views/Projects/
git commit -m "feat(frontend): 项目任务详情页（事件流 + 对话 + 预览）"
```

---

## Task 5.4：路由与菜单注册

**Files:**
- Modify: `frontend/src/router/index.tsx`
- Modify: `frontend/src/components/Layout.tsx`（或等价的侧栏组件）

- [ ] **Step 1: 更新 router/index.tsx**

编辑 `frontend/src/router/index.tsx`，在 `import Settings` 之后追加：

```tsx
import Projects from '../views/Projects';
import ProjectDetail from '../views/Projects/Detail';
```

在 `children: [...]` 数组里追加两条：

```tsx
      { path: 'projects', element: <Projects /> },
      { path: 'projects/:id', element: <ProjectDetail /> },
```

- [ ] **Step 2: 更新侧栏菜单**

先确认当前 Layout 的菜单结构：

Run:
```bash
grep -n "menu\|Menu\|path: 'chat'" frontend/src/components/Layout.tsx | head
```

在菜单项数组里（和 `chat`/`history`/`templates`/`settings` 同级）加入：

```tsx
{ key: 'projects', label: '项目工作台', path: '/projects' },
```

> 如果侧栏用的不是 Ant Design Menu 而是自定义菜单，按同样位置插入。

- [ ] **Step 3: 编译验证**

Run:
```bash
cd frontend && pnpm build
```

Expected: 无 TS 错误。

- [ ] **Step 4: Commit**

```bash
git add frontend/src/router/ frontend/src/components/Layout.tsx
git commit -m "feat(frontend): 注册 /projects 路由与侧栏菜单"
```

---

## Task 5.5：Chat 页"生成项目代码"快捷入口

**Files:**
- Modify: `frontend/src/views/Chat/index.tsx`

- [ ] **Step 1: 在 Amis 预览区加按钮**

编辑 `frontend/src/views/Chat/index.tsx`：

1. 在文件顶部 import 区追加：

```tsx
import CreateTaskModal from '../Projects/CreateTaskModal';
```

2. 在组件内，找到展示 Amis JSON 预览的那一块（通常是有 `amisJson` 状态变量的位置），在该 UI 区块附近加入：

```tsx
const [genOpen, setGenOpen] = useState(false);
// ... 组件现有其他状态保留 ...

// 在预览区按钮栏追加：
<Button disabled={!amisJson} onClick={() => setGenOpen(true)}>生成项目代码</Button>

// 在组件最外层 JSX 的末尾追加 Modal：
<CreateTaskModal
  open={genOpen}
  onClose={() => setGenOpen(false)}
  onCreated={(id) => { setGenOpen(false); window.open(`/projects/${id}`, '_blank'); }}
  defaultAmisJson={amisJson ?? ''}
/>
```

> 说明：如果 Chat 页使用的状态变量名不是 `amisJson`（可能叫 `generatedJson` 或其他），请读一下当前文件用实际名字替换。

- [ ] **Step 2: 编译验证**

Run:
```bash
cd frontend && pnpm build
```

Expected: 无 TS 错误。

- [ ] **Step 3: Commit**

```bash
git add frontend/src/views/Chat/index.tsx
git commit -m "feat(frontend): Chat 页增加'生成项目代码'快捷入口"
```

---

## Section 5 验收

- 浏览器打开 `/projects` 看到任务列表；能点"创建任务"弹窗填 Amis JSON + 技术栈并创建
- 创建后跳转到 `/projects/:id`，左侧事件流区随 WS 实时滚动
- 右侧 iframe 预览区在 `preview_port` 就绪后能加载
- Chat 页有"生成项目代码"按钮，点击弹出同一个创建窗口，带入当前 Amis JSON

---

# Section 6 · 端到端联调与验证

**目的**：把前面 5 个子系统串联起来，执行规格第 9-10 页定义的 8 项验收场景。这一节**不包含新功能开发**，只做校准、捉虫、必要的小修补。

---

## Task 6.1：启动依赖检查清单

**Files:** 无

- [ ] **Step 1: 宿主机先决条件**

确认下列每一项：

```bash
# Docker 可用
docker version

# PostgreSQL（通过 docker-compose 启动）
docker compose up -d postgres
docker compose ps postgres  # Should be up (healthy)

# 目录存在且可写
ls -ld /var/amis-ai/repos /var/amis-ai/workdirs /var/amis-ai/pnpm-store

# 沙箱镜像已构建
docker image ls amis-ai-sandbox:uniapp-node20
```

- [ ] **Step 2: 脚手架模板可直接跑通**

```bash
cd scaffolds/uniapp-wot-h5-template
pnpm install
pnpm run dev:h5
```

Expected: 看到 `Local: http://localhost:5173/`，浏览器打开看到空白或欢迎页。

如果这一步失败，说明 Section 4 的"模板待用户填充"状态还没完成——回到 Task 4.1 的 README 里的 TODO，用户先把模板项目做好。

- [ ] **Step 3: 各服务能独立启动**

在 4 个终端分别跑：

终端 A：
```bash
cd sandbox && cargo run --bin sandbox-service
```

终端 B：
```bash
cd claw-code/rust && cargo run -p claw-agent-server
```

终端 C：
```bash
cd backend && cargo run
```

终端 D：
```bash
cd frontend && pnpm dev
```

Expected: 4 个服务都启动成功并监听正确端口（8091 / 8090 / 8080 / 5173）。

---

## Task 6.2：端到端冒烟场景（CRUD 页）

**Files:** 无（仅验证）

- [ ] **Step 1: 准备 Amis JSON**

使用这段 Amis JSON：

```json
{
  "type": "page",
  "title": "用户管理",
  "body": {
    "type": "crud",
    "api": "/api/users",
    "columns": [
      { "name": "id", "label": "ID" },
      { "name": "name", "label": "姓名" },
      { "name": "email", "label": "邮箱" }
    ],
    "headerToolbar": [{ "type": "button", "label": "新增", "actionType": "dialog", "dialog": {
      "title": "新增用户",
      "body": { "type": "form", "api": "post:/api/users", "body": [
        { "type": "input-text", "name": "name", "label": "姓名", "required": true },
        { "type": "input-text", "name": "email", "label": "邮箱" }
      ]}
    }}]
  }
}
```

- [ ] **Step 2: 登录并创建任务**

打开浏览器 `http://localhost:5173/login`，用 `admin/admin123` 登录。

跳到 `/projects`，点"创建任务"，把上面的 JSON 粘贴进去，技术栈/UI 库都选默认，点确定。

- [ ] **Step 3: 观察事件流**

在详情页左上角事件流应能看到以下顺序（受 LLM 影响顺序可能变动）：

1. `session_created`
2. `turn_start turn_index=1`
3. `tool_use name=bash input_json={"command":"cp -r /home/karl/Working/..."}`
4. `tool_result` 返回 `exit_code=0`
5. 后续多轮 `tool_use write_file` / `edit_file`
6. 某一轮 `tool_use bash` 执行 `pnpm install && pnpm run dev:h5`
7. `dev_status` 相关事件（由 Backend 聚合沙箱日志转发）

- [ ] **Step 4: 预览 iframe**

当任务状态变成 `running` 且 `preview_port` 不为空，右侧 iframe 应该加载出真实的 UniApp H5 页面。

**成功判定**：
- 页面包含"用户管理"标题
- 有"新增"按钮 → 点击弹窗出现（Wot Popup）
- 表单里有"姓名"/"邮箱"两个 `<wd-input>`

- [ ] **Step 5: 测试温和打断**

在右下对话框发消息：`"把主题色改成 #52c41a（绿色）"`

Expected: 下一轮 turn 开始时，Agent 能读取消息并把项目主题色改掉；iframe 刷新后看到绿色主题。

- [ ] **Step 6: 测试自修复**

手动往 `/var/amis-ai/workdirs/{task_id}/vite.config.ts` 里注入一个语法错误（比如多写个 `}`），触发 Vite 重启失败。

Run:
```bash
TASK_ID=1  # 替换为实际 ID
echo '}' >> /var/amis-ai/workdirs/$TASK_ID/vite.config.ts
```

Expected：
- 后端日志里看到 `dev_failed` 事件
- Agent 自动收到错误日志回喂，下一轮 turn 修复
- `fix_attempts` 从 1 递增

- [ ] **Step 7: 采纳**

点"采纳并入库"，确认：

```bash
docker compose exec postgres psql -U amis_ai -c "SELECT id, tech_stack, page_type, source_task_id FROM code_sample ORDER BY id DESC LIMIT 5;"
```

Expected: 最新一条 `source_task_id = TASK_ID`，`tech_stack = uniapp-wot-h5`。

- [ ] **Step 8: 提交一份"集成验证通过"的记录**

```bash
git commit --allow-empty -m "chore: 端到端冒烟通过（CRUD 场景）"
```

---

## Task 6.3：回归检查清单

- [ ] **Step 1: 原有 Amis JSON 生成飞轮未受破坏**

在 `/chat` 页面重复一次"自然语言 → Amis JSON"流程：
- 输入需求 → 流式生成 Amis JSON
- 预览渲染
- 点"采纳" → `generation_history` 和 `amis_template` 表各增加一条

Expected: 原有流程功能正常。

- [ ] **Step 2: Rust 全量 check + test**

```bash
cd backend && cargo test
cd ../sandbox && cargo test
cd ../claw-code/rust && cargo test -p claw-agent-server
```

Expected: 所有测试通过。

- [ ] **Step 3: claw-code 原有源码未被修改**

```bash
cd claw-code && git status --porcelain | grep -v 'crates/claw-agent-server'
```

Expected: 输出为空（或仅有 `rust/target/` 之类的构建产物）。

- [ ] **Step 4: 清理悬挂容器**

```bash
docker ps --filter 'name=amis-ai-sandbox-' --format '{{.Names}}' | xargs -r docker rm -f
```

- [ ] **Step 5: Commit**

```bash
git commit --allow-empty -m "chore: 回归验证通过"
```

---

## Task 6.4：文档补完

**Files:**
- Modify: `README.md`（如果根目录没有，跳过）
- Modify: `CLAUDE.md`（项目根）

- [ ] **Step 1: 在 CLAUDE.md "常用命令" 段追加**

编辑 `CLAUDE.md`，在 `## 常用命令` 的 bash 代码块末尾追加：

```bash
# 反向代码生成（Section 5 实施后启用）
cd sandbox && cargo run --bin sandbox-service          # 8091
cd claw-code/rust && cargo run -p claw-agent-server    # 8090

# 构建沙箱镜像（一次性）
docker build -t amis-ai-sandbox:uniapp-node20 shared/docker/sandbox/uniapp-node20/
```

- [ ] **Step 2: 在 "项目结构" 段补充新增目录**

修改 `CLAUDE.md` 的项目结构那部分：

```
amis-ai/
├── frontend/                 # React 前端（Vite + TypeScript）
├── backend/                  # Rust 后台管理服务（Axum）
├── agent/                    # Python 智能体服务（FastAPI）
├── claw-code/                # AI 编码引擎（上游开源项目 + 本项目 claw-agent-server crate）
├── sandbox/                  # Rust 沙箱执行服务（Docker 容器编排）
├── scaffolds/                # 各技术栈脚手架模板
├── skills/                   # Agent 的 Skills 规则库
└── shared/                   # 共享配置（Docker、Nginx、脚本）
```

- [ ] **Step 3: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: 更新 CLAUDE.md 常用命令与项目结构"
```

---

## Section 6 验收

所有下列条目都通过：

| 验收项 | 通过判据 |
|--------|----------|
| 依赖环境就绪 | 沙箱镜像 build 成功、PG healthy、四个服务能独立启动 |
| 端到端 CRUD 场景跑通 | 事件流完整、iframe 预览生效、Wot 组件可见 |
| 温和打断生效 | 下一轮 Agent 吸收新消息并产出对应变更 |
| 自修复闭环生效 | 注入错误后 `fix_attempts` 递增、最终恢复绿色 |
| 采纳入库 | `code_sample` 表新增记录且 embedding 非空 |
| 原有飞轮无回归 | `/chat` 页生成+采纳流程照常 |
| claw-code 源码零改动 | `git status` 在 claw-code/ 下只看到新 crate |
| 所有 `cargo test` 通过 | |

---

# 附录 A · 执行次序与依赖拓扑

```
S0 环境准备
   ↓
S1 沙箱基础设施  ── （独立子系统，结束后 sandbox-service 可 curl 通）
   ↓
S2 claw-agent-server  ── （依赖 S1 的 sandbox-service HTTP 接口）
   ↓
S3 Backend 任务编排  ── （依赖 S1 + S2，此时 Task 3.4 的 build_system_prompt 用占位）
   ↓
S4 知识库三层  ── （Task 4.5 把 S3 的占位换回 include_str!）
   ↓
S5 前端工作台  ── （依赖 S3 的 REST + WS 接口）
   ↓
S6 端到端联调
```

---

# 附录 B · 关键外部依赖版本

| 组件 | 版本 | 说明 |
|------|------|------|
| Rust | 1.82+ | `rust-toolchain` 保持项目默认 |
| axum | 0.7 | 与现有 backend 一致 |
| sea-orm | 0.12 | 同上 |
| bollard | 0.17 | Docker API |
| reqwest | 0.12（claw-agent-server）/ 0.11（backend） | 分别对齐各自依赖树 |
| tokio-tungstenite | 0.23 | backend WS 客户端 |
| Node | 20 | 沙箱镜像基础 |
| pnpm | 9.15 | 沙箱镜像预装 |
| pgvector | pg16 | 数据库 |

---

# 附录 C · 未在本 plan 实施（MVP 外）

明确延后（参考规格 "明确不在 MVP 范围内"）：

- 小程序/App 产物支持
- React/Vue3 等其他技术栈
- 远程 Git 托管（GitHub/Gitea push）
- 复杂沙箱权限隔离（seccomp/AppArmor）
- 任务"从 commit fork 重启"
- 协作式多用户同任务
- 计费/配额
- 任务硬超时

