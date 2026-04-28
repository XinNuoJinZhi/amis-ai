# amis-ai

> **AI 驱动的低代码正反飞轮** —— 从自然语言直达可运行的业务项目代码

![status](https://img.shields.io/badge/status-active-brightgreen)
![stack](https://img.shields.io/badge/stack-Rust%20%7C%20Python%20%7C%20React-blue)
![stage](https://img.shields.io/badge/stage-MVP-orange)

amis-ai 把「用自然语言描述需求」这件事做到底：**正向**让 AI 吐出 [Amis JSON](https://aisuda.bce.baidu.com/amis/zh-CN/docs) 界面配置，**反向**再把 Amis JSON 翻译回可运行、可采纳、可回流的 UniApp + Wot UI H5 项目。两条链路通过 RAG 知识库闭环，**越用越聪明**。

---

## ✨ 项目亮点

- 🔄 **正向飞轮**：自然语言 → Amis JSON，支持实时预览、编辑、采纳入库
- 🏗️ **反向飞轮**：Amis JSON → UniApp + Wot UI H5 可运行项目（MVP）
  - 在服务端 Docker 沙箱中**真实生成 + 启动 + 自修复**
  - Vite dev server 启动失败自动读错误日志修复，最多 5 次重试
  - 成功采纳的代码沉淀回 `code_sample` 表，RAG 飞轮闭环
- 💻 **云端 IDE**：类 VSCode 的**六合一工作区**（文件树 / Monaco / 终端 / 浏览器控制台 / 预览 / Chat）
  - 沙箱内文件直接读写 + xterm.js 终端 + iframe 预览 console 注入回传
  - 用户可点「塞入对话」把浏览器 console / 终端日志作为诊断证据交给 Agent
- 📚 **插件化知识库**：Skills 标准协议 + 多源插件挂载 + RBAC + AI 辅助起草
  - Skills 采用 claw-code 标准协议（`SKILL.md` + `references/` + progressive disclosure）
  - ZC 等外部团队可通过 `SKILLS_PLUGIN_PATHS` 环境变量挂载自己的 skill 包
- 📈 **RAG 质量闭环**：评分 / 负例 / LLM 评委 / A/B 报告，4 段分阶段开关
  - Phase 0/1 默认 live（审核可视化 + 信号埋点）
  - Phase 2/3/4 按数据分阶段激活（LLM 评委 / 权重 / 负例注入）
- 🎨 **AI 辅助起草**：整桶 skill 起草（SSE 流式）+ 单文件改写（DiffEditor 对比）

---

## 🏗️ 架构速览

```
┌──────────────────────────────────────────────────────────┐
│                      Frontend (React/Vite) :5173          │
│   /chat (正向)    /projects/:id (反向·云端IDE)             │
└────────┬──────────────────────────────────┬──────────────┘
         │                                  │
         ↓ REST/WS                          ↓
┌─────────────────┐          ┌──────────────────────────┐
│ backend         │ ←─ RAG ─→│ agent (Python/FastAPI)   │
│ :8080 (Axum)    │          │ :8000  向量化·检索·评委   │
└──┬────────────┬─┘          └──────────────────────────┘
   │            │                        ↑
   ↓            ↓                        │
┌────────────┐ ┌──────────────────────┐ │
│ sandbox    │ │ claw-agent-server    │─┘
│ :8091      │ │ :8090 (包装claw-code)│
│ Docker     │ │                      │
└────────────┘ └──────────────────────┘
   ↓ bollard
┌────────────────────────────────────┐
│ amis-ai-sandbox-task-N containers  │  (UniApp + Wot UI H5)
│   pnpm run dev:h5 @ 20000-21000    │
└────────────────────────────────────┘

基础设施：PostgreSQL+pgvector(5432)  Nginx(80, /preview/{task_id}/ 代理)
```

### 端口表

| 服务 | 端口 | 语言/框架 |
|---|---|---|
| frontend | 5173 | React 18 + Vite + Ant Design 5 + amis SDK |
| agent（正向 + RAG） | 8000 | Python / FastAPI |
| backend（管理 + 编排） | 8080 | Rust / Axum + SeaORM |
| claw-agent-server（反向） | 8090 | Rust / Axum |
| sandbox-service | 8091 | Rust / Axum + Bollard |
| PostgreSQL + pgvector | 5432 | — |
| Nginx | 80 | — |

详情 → [docs/architecture/services-and-ports.md](docs/architecture/services-and-ports.md)

---

## 🚀 快速开始

### 先决条件

- **Docker**（daemon 需运行；沙箱 + postgres 都依赖）
- **PostgreSQL 16+ with pgvector**（或用 docker-compose 起的版本）
- **Rust 1.75+**（后端三个 Rust 服务）
- **Node.js 20+ & pnpm**（前端）
- **uv**（Python 包管理器）
- **WSL 用户**：注意代理坑（详见下文）

### 1. 起基础设施

```bash
docker-compose up -d            # postgres + nginx
docker images | grep sandbox    # 确认沙箱镜像：amis-ai-sandbox:uniapp-node20
```

### 2. 体检 + 一键启 4 服务

```bash
./shared/scripts/start-services.sh check    # 缺啥告诉你啥
./shared/scripts/start-services.sh start    # 启 sandbox + claw-agent + backend + agent
./shared/scripts/start-services.sh status   # 看端口（8080 / 8090 / 8091 / 8000）
```

### 3. 起前端

```bash
cd frontend
pnpm install                    # 首次；pro-chat peer dep 会拉 React 18
pnpm dev                        # :5173
```

### 4. 端到端冒烟

```bash
./shared/scripts/smoke-test.sh  # PASS=26 FAIL=0 才算绿灯
```

### 5. 人工回归

跟着 [docs/regression-checklist.md](docs/regression-checklist.md) 跑正向/反向飞轮主链路 + Embedding UI + 插件挂载。

### ⚠️ WSL 代理坑

在 WSL 设了 `http_proxy` / `HTTPS_PROXY`（比如 Clash），claw-agent-server 访问**内网 LLM**（本地 Ollama）会 502。`start-services.sh` 已做局部清理，**必须用此脚本启动**。详情 → [docs/architecture/services-and-ports.md](docs/architecture/services-and-ports.md#️-wsl-代理坑必读)。

### 插件挂载（ZC 等外部团队）

```bash
SKILLS_PLUGIN_PATHS=/opt/zc-amis-skills,/opt/another-pack \
  ./shared/scripts/start-services.sh restart
```

插件包规范 → [docs/skills-plugin-spec.md](docs/skills-plugin-spec.md)

---

## 📖 深入阅读

### 架构

- [服务与端口](docs/architecture/services-and-ports.md) —— 4 服务 + 基础设施 + WSL 代理坑
- [云端 IDE](docs/architecture/cloud-ide.md) —— 六合一工作区 + IDE 路由 + 控制台注入 + 塞入对话
- [反向飞轮](docs/architecture/reverse-flywheel.md) —— 7 步流程 + 状态机
- [LLM 配置](docs/architecture/llm-config.md) —— task_type / protocol / Anthropic 路径

### 历次升级

- [2026-04-22 · Skills 知识层 + RAG 飞轮 + 插件机制](docs/upgrades/2026-04-22-knowledge-rag-plugins.md)
- [2026-04-22 · AI 辅助 Skill 起草（Synthetic Honey）](docs/upgrades/2026-04-22-synthetic-honey.md)
- [2026-04-25 · RAG 质量闭环（评分 / 负例 / 审核可视化）](docs/upgrades/2026-04-25-rag-quality-loop.md)

### 规范与清单

- [回归检查清单](docs/regression-checklist.md)
- [Skills 插件包规范](docs/skills-plugin-spec.md)
- [ZC Amis 插件起步模板](docs/zc-amis-plugin-template-readme.md)
- [大模型知识通识手册](docs/llm-knowledge-handbook.md)
- [技术栈解耦迁移手册](docs/migration-2026-04-stack-decouple.md)

### 原始设计计划

- [docs/plans/](docs/plans/) —— 反向代码生成原始设计文档

---

## 🤝 贡献 / 开发者指南

开发时请先读 [CLAUDE.md](CLAUDE.md)：开发规约 + 踩坑记录（`reqwest::blocking` panic、运行时嵌套、WSL 代理等）+ 代码路径速查。

技术栈约定：
- Rust 代码 `cargo fmt` / `cargo clippy`
- 前端 TypeScript 严格模式
- Python PEP 8
- **所有回复 / 思考 / 代码注释用中文**

claw-code 约束：
- `claw-code/rust/crates/{api,runtime,tools,...}` 是第三方代码，**绝不修改**
- 扩展仅通过 `claw-code/rust/crates/claw-agent-server/` 实现 `ApiClient` / `ToolExecutor` trait

---

## 📜 License

TODO（待选定，可能是 MIT / Apache-2.0 / 私有）
