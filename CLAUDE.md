# CLAUDE.md · amis-ai 协作手册

> 本文档给 AI 助手看，聚焦「怎么协作、规约是啥、注意啥」。产品介绍 / 亮点 / 快速上手请看 [README.md](README.md)。

## 项目简介

amis-ai 是「AI 驱动的低代码飞轮」产品，含正反两条链路：

- **正向飞轮**：自然语言 → Amis JSON 配置（`/chat`）
- **反向飞轮**：Amis JSON → UniApp + Wot UI H5 项目（沙箱内生成 + 启动 + 自修复，最多 5 次重试；`/projects/:id`）

## 服务与端口速查

| 服务 | 端口 | 语言 |
|---|---|---|
| frontend | 5173 | React + Vite |
| agent | 8000 | Python / FastAPI |
| backend | 8080 | Rust / Axum |
| claw-agent-server | 8090 | Rust / Axum |
| sandbox-service | 8091 | Rust / Axum + Bollard |
| PostgreSQL + pgvector | 5432 | — |
| Nginx | 80 | — |

详情 → [docs/architecture/services-and-ports.md](docs/architecture/services-and-ports.md)

---

## 开发规范

- **所有回复、思考、代码注释用中文**
- 后端 Rust 遵循 `cargo fmt` / `cargo clippy`
- 前端 TypeScript 严格模式
- Python 代码遵循 PEP 8

### claw-code 工作约束

- `claw-code/rust/crates/{api,runtime,tools,...}` 是**第三方代码，绝不修改**
- 仅通过 `claw-code/rust/crates/claw-agent-server/` 实现 `ApiClient` / `ToolExecutor` trait 扩展
- 如需改 claw-code 行为，**必须在包装层解决，不能改源 crate**

### 并发与运行时约束（踩坑记录）

- `reqwest::blocking` 会创建内部 tokio runtime，在 tokio async context 里 drop 会 panic —— 已改用纯同步的 `ureq`
- 在 `spawn_blocking` 里调用 async 函数时，用 `tokio::runtime::Builder::new_current_thread()` 创建**局部 runtime**，避免嵌套 multi-thread runtime 的 drop 问题
- `ConversationRuntime` 必须全程在同一个 blocking thread 内存活（多轮对话前提）

### ⚠️ WSL 代理坑

WSL 里若 `http_proxy`/`HTTPS_PROXY` 指向 Clash，`claw-agent-server` 访问内网 LLM（如本地 Ollama）会被代理拦截返回 502。`start-services.sh` 已用 `env -u` 局部清理，**必须用此脚本启动**；手动启动先 `unset http_proxy HTTP_PROXY https_proxy HTTPS_PROXY`。

---

## 🛠️ 日常工具三件套

| 工件 | 何时跑 | 干什么 |
|---|---|---|
| [shared/scripts/start-services.sh](shared/scripts/start-services.sh) | 服务启停 | `check` 体检 / `start` 启 4 服务 / `status` 看端口 / `stop` 停+清沙箱 / `restart` |
| [shared/scripts/smoke-test.sh](shared/scripts/smoke-test.sh) | 每次发版 / 改完 / 接手机器 | 端到端 26 项冒烟，`PASS=26 FAIL=0` 才算绿灯 |
| [docs/regression-checklist.md](docs/regression-checklist.md) | 大改动后 / 出门前 | 脚本覆盖不到的人工回归项 |

**新人接手 amis-ai 标准开机流程**：
```bash
./shared/scripts/start-services.sh check    # 体检
./shared/scripts/start-services.sh start    # 起 4 服务
./shared/scripts/smoke-test.sh              # 冒烟 PASS=26
# 跟 docs/regression-checklist.md 跑人工项
```

---

## 常用命令

```bash
# 基础设施
docker-compose up -d                         # postgres + nginx

# 四服务统一启停（推荐）
./shared/scripts/start-services.sh start     # sandbox + claw-agent + backend + python-agent

# 插件挂载（C 阶段：ZC 等外部团队 skill 包）
SKILLS_PLUGIN_PATHS=/opt/zc-amis-skills \
  ./shared/scripts/start-services.sh restart

# 日志
tail -f /tmp/amis-ai-logs/{backend,claw-agent-server,sandbox-service,agent}.log

# 前端
cd frontend && pnpm dev                      # :5173

# 单服务调试
cd sandbox && cargo run                      # :8091
cd claw-code/rust && cargo run -p claw-agent-server   # :8090
cd backend && cargo run                      # :8080
cd agent && uv run uvicorn src.main:app --reload --port 8000
```

---

## 📚 关键文档索引

### 架构（[docs/architecture/](docs/architecture/)）

| 文档 | 内容 |
|---|---|
| [services-and-ports.md](docs/architecture/services-and-ports.md) | 4 服务 + 基础设施 + 启动脚本 + WSL 代理坑 |
| [cloud-ide.md](docs/architecture/cloud-ide.md) | 六合一云端 IDE + IDE 路由 + 控制台注入 + 塞入对话约定 |
| [reverse-flywheel.md](docs/architecture/reverse-flywheel.md) | 反向飞轮 7 步流程 + 状态机 |
| [llm-config.md](docs/architecture/llm-config.md) | task_type / protocol / Anthropic 路径 / 已知限制 |

### 历次升级（[docs/upgrades/](docs/upgrades/)）

| 文档 | 内容 |
|---|---|
| [2026-04-22-knowledge-rag-plugins.md](docs/upgrades/2026-04-22-knowledge-rag-plugins.md) | Skills 标准协议 + RAG 飞轮闭环 + 插件机制 + RBAC |
| [2026-04-22-synthetic-honey.md](docs/upgrades/2026-04-22-synthetic-honey.md) | AI 辅助 Skill 起草（整桶 + 单文件改写） |
| [2026-04-25-rag-quality-loop.md](docs/upgrades/2026-04-25-rag-quality-loop.md) | RAG 质量闭环（thumbs/rating/LLM 评委/负例 + A/B 工具） |
| [2026-04-25-tracelog.md](docs/upgrades/2026-04-25-tracelog.md) | 任务追踪日志（每任务 FS 归档：events / LLM 入参+响应 / Skills+RAG 全文快照 / analysis_input.md） |
| [2026-04-27-conversation-streaming.md](docs/upgrades/2026-04-27-conversation-streaming.md) | 通用 AI 对话：SSE 流式打字机 + 多会话 DB 持久化（左侧会话栏 / 重命名 / 删除） |
| [2026-05-07-amis-knowledge-completion.md](docs/upgrades/2026-05-07-amis-knowledge-completion.md) | 1.1.0 · Amis 知识双轨补全（175 schema + 148 RAG 样例 + 100% embedding；接受 0pp delta + 上线 thumbs 兜底） |
| [2026-05-09-multipage-reverse-flywheel-1.2.md](docs/upgrades/2026-05-09-multipage-reverse-flywheel-1.2.md) | 1.2.0 · 多页面反向飞轮 + 5 策略评测矩阵（**R4/R2/R1/R3/Unified 全 GA**；3 prompts × 5 策略 = 15 任务全 succeeded；6 个 P0 issue 全修；最终评测 30min） |
| [2026-05-11-zc-amis-1.3-stage-c.md](docs/upgrades/2026-05-11-zc-amis-1.3-stage-c.md) | 1.3.0 · ZC Amis Web 端阶段 C（zc-editor-web-template + zc-web-node20 镜像） |
| [2026-05-11-zc-amis-1.3-stage-d-e.md](docs/upgrades/2026-05-11-zc-amis-1.3-stage-d-e.md) | 1.3.0 · 阶段 D/E（ZC Web 出码 + 9 prompts 评测） |
| [2026-05-11-zc-amis-1.3.1-mobile.md](docs/upgrades/2026-05-11-zc-amis-1.3.1-mobile.md) | 1.3.1 · ZC 智搭小程序底座 + 反向飞轮支持出码 |
| [2026-05-12-llm-routing-rag-quality-vue3.md](docs/upgrades/2026-05-12-llm-routing-rag-quality-vue3.md) | 1.4.0 · LLM 路由智能化（category × tier 偏置 + token 配额 + actual_cost）+ RAG 质量收口（双路召回 + 负例 + page 评委）+ Vue3 模板（**16 commits，v4 三组 100% 通过**） |
| [2026-05-12-roadmap-1.5-w1.md](docs/upgrades/2026-05-12-roadmap-1.5-w1.md) | 1.5.0 · 接力首日（W1 + W3 骨架）— 分类器超时 fix + actual_cost 双列 + D 评测集 + A/B schema 占位 |
| [2026-05-12-1.5-feature-complete.md](docs/upgrades/2026-05-12-1.5-feature-complete.md) | 1.5.0 · 全集（A+B+D）— W2 estimate 校准 + W3 A/B 框架完整 + W4 评测发现并修复 1.4 B.1 多页路径 bug（10 文件 +296/-85，3 轮评测 6 csv） |

### 规范与清单

| 文档 | 内容 |
|---|---|
| [docs/regression-checklist.md](docs/regression-checklist.md) | 人工回归清单 |
| [docs/skills-plugin-spec.md](docs/skills-plugin-spec.md) | Skills 插件包规范（C.2） |
| [docs/zc-amis-plugin-template-readme.md](docs/zc-amis-plugin-template-readme.md) | ZC 团队起步模板 |
| [docs/llm-knowledge-handbook.md](docs/llm-knowledge-handbook.md) | 大模型知识通识手册 |
| [docs/migration-2026-04-stack-decouple.md](docs/migration-2026-04-stack-decouple.md) | 技术栈解耦迁移手册 |
| [docs/plans/2026-04-16-reverse-code-generation.md](docs/plans/2026-04-16-reverse-code-generation.md) | 反向代码生成原始设计计划 |

### 代码路径速查

| 关心点 | 文件 |
|---|---|
| 任务 CRUD + 状态机 + RAG 注入 | [backend/src/handlers/project_generation.rs](backend/src/handlers/project_generation.rs) |
| IDE 透传（JWT + 任务归属） | [backend/src/handlers/project_ide.rs](backend/src/handlers/project_ide.rs) |
| Skills 加载 + HOME 隔离 + 插件挂载 | [claw-code/rust/crates/claw-agent-server/src/](claw-code/rust/crates/claw-agent-server/src/) |
| Agent 多轮 runtime | [claw-code/rust/crates/claw-agent-server/src/task_loop.rs](claw-code/rust/crates/claw-agent-server/src/task_loop.rs) |
| 沙箱文件系统（越权校验） | [sandbox/src/fs_handlers.rs](sandbox/src/fs_handlers.rs) |
| 沙箱终端（bollard exec TTY） | [sandbox/src/terminal_handlers.rs](sandbox/src/terminal_handlers.rs) |
| dev server 启动 + 日志监听 | [sandbox/src/dev_runner.rs](sandbox/src/dev_runner.rs) |
| RAG 入库/检索/评委 | [agent/src/routers/internal.py](agent/src/routers/internal.py) + [agent/src/services/rag.py](agent/src/services/rag.py) |
| 前端云端 IDE | [frontend/src/views/Projects/detail/](frontend/src/views/Projects/detail/) |
| 前端知识库管理 | [frontend/src/views/KnowledgeBase/](frontend/src/views/KnowledgeBase/) |
| 脚手架种子（UniApp+Wot H5） | [scaffolds/uniapp-wot-h5-template/](scaffolds/uniapp-wot-h5-template/) |

### 参考项目

- LLM 配置管理参考：`~/Working/creation/timecraft-novel`（handlers/llm_admin.rs / utils/llm.rs / utils/jwt.rs）
- 反向飞轮设计规格：`/home/karl/.claude/plans/mossy-tinkering-forest.md`
- 知识层 + RAG + 插件设计：`/home/karl/.claude/plans/misty-beaming-mango.md`
- RAG 质量闭环设计：`/home/karl/.claude/plans/shiny-honking-backus.md`
- AI 起草设计：`/home/karl/.claude/plans/amis-ai-ai-synthetic-honey.md`
