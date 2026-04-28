# 服务与端口架构

amis-ai 是**多进程分层架构**：4 个后端服务 + 1 个前端 Vite dev server + PostgreSQL + Docker daemon + Nginx 反向代理。

## 服务端口总览

| 服务 | 端口 | 语言/框架 | 进程入口 | 职责 |
|---|---|---|---|---|
| **amis-ai-backend** | 8080 | Rust / Axum 0.7 + SeaORM | `backend/src/main.rs` | 后台管理 + 任务编排 + JWT + RAG 拼 prompt |
| **agent** | 8000 | Python / FastAPI | `agent/src/main.py` | 正向生成智能体（NL → Amis JSON）+ 内部 RAG 入库/检索/评委 |
| **claw-agent-server** | 8090 | Rust / Axum | `claw-code/rust/crates/claw-agent-server/src/main.rs` | 反向代码生成，包装 claw-code runtime（多租户化） |
| **sandbox-service** | 8091 | Rust / Axum + Bollard | `sandbox/src/main.rs` | Docker 沙箱生命周期 + dev-start 监控 + fs/terminal 透传 |
| **frontend** | 5173 | React 18 + Vite | `frontend/` | 前端，v0.dev 暗色主题 |

### 基础设施

| 组件 | 端口 | 用途 |
|---|---|---|
| PostgreSQL + pgvector | 5432 | 主库（含 embedding 列） |
| Docker daemon | - | 沙箱运行时（每任务一个 `amis-ai-sandbox-task-N` 容器） |
| Nginx | 80 | 反向代理 + `/preview/{task_id}/` 代理到沙箱 Vite dev server |
| LLM 供应商 | - | Ollama / DashScope / OpenAI / Anthropic（通过 UI 运行时配置） |

## docker-compose 与本地启动的边界

`docker-compose.yml` **只管容器化的基础设施**（postgres / nginx / sandbox-service 镜像构建），Rust 服务本身**不进 compose**，原因：
- 需要本机 `cargo run` 快速迭代
- `sandbox-service` 需要宿主机 Docker daemon（`/var/run/docker.sock`）
- 启动脚本自带 proxy 清理 + 日志目录管理，比 compose 方便

完整启停：
```bash
docker-compose up -d                          # postgres + nginx + 构建 sandbox 镜像
./shared/scripts/start-services.sh start      # 起 4 个 Rust/Python 服务
```

## start-services.sh 子命令

| 子命令 | 语义 |
|---|---|
| `check` | 体检（DB/Docker/pgvector/二进制/uv 等缺啥提示啥） |
| `start` | 启动 sandbox + claw-agent + backend + agent（Python） |
| `status` | 查看 4 端口监听情况（8080 / 8090 / 8091 / 8000） |
| `stop` | 停止所有服务 + 清理 Docker 沙箱容器 |
| `restart` | stop + start |

插件挂载（C 阶段）：
```bash
SKILLS_PLUGIN_PATHS=/opt/zc-amis-skills,/opt/another-pack \
  ./shared/scripts/start-services.sh restart
```

## 日志位置

统一在 `/tmp/amis-ai-logs/`：
- `backend.log`
- `claw-agent-server.log`
- `sandbox-service.log`
- `agent.log`

## ⚠️ WSL 代理坑（必读）

WSL 中若设置 `http_proxy` / `HTTPS_PROXY` 指向 Clash 等代理，`claw-agent-server` 访问**内网 LLM**（如本地 Ollama）会被代理拦截返回 502。

`start-services.sh` 已用 `env -u` 局部清除代理变量（只影响服务进程，不影响当前 shell）。所以 **必须用此脚本启动**，或者手动先：
```bash
unset http_proxy HTTP_PROXY https_proxy HTTPS_PROXY
```
再 `cargo run`。

## 单服务调试启动

```bash
cd sandbox && cargo run                                              # :8091
cd claw-code/rust && cargo run -p claw-agent-server                  # :8090
cd backend && cargo run                                              # :8080
cd agent && uv run uvicorn src.main:app --reload --port 8000         # :8000
cd frontend && pnpm dev                                              # :5173
```

## 相关文档

- 云端 IDE 架构 → [cloud-ide.md](cloud-ide.md)
- 反向飞轮流程 → [reverse-flywheel.md](reverse-flywheel.md)
- LLM 配置与协议 → [llm-config.md](llm-config.md)
