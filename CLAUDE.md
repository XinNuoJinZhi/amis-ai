# amis-ai 开发指南

## 项目简介

amis-ai 是一个「AI 驱动的低代码飞轮」产品，包含两条正反互补的链路：

1. **正向飞轮**：自然语言 → Amis JSON 配置
   - 用户描述需求，AI 生成 Amis JSON，支持实时预览、编辑、采纳入 RAG 知识库
2. **反向飞轮**：Amis JSON → 可运行的业务项目代码（2026-04 新增，MVP 锁定 UniApp + Wot UI H5）
   - 以 Amis JSON 为蓝本驱动 AI 编码智能体，在服务端 Docker 沙箱中真实生成 + 启动 + 自修复
   - 智能体失败时自动读 dev server 错误日志修复，最多 5 次重试
   - 采纳的结果沉淀回 `code_sample` 表，形成反向飞轮（越用越聪明）

## 技术栈

### 服务组件
- **amis-ai-backend** (Rust / Axum 0.7 + SeaORM)：后台管理 + 任务编排，端口 **8080**
- **agent** (Python / FastAPI)：正向生成智能体，端口 **8000**
- **claw-agent-server** (Rust / Axum)：反向代码生成智能体，包装 claw-code runtime，端口 **8090**
- **sandbox-service** (Rust / Axum + Bollard)：Docker 沙箱生命周期管理 + dev-start 监控，端口 **8091**
- **frontend** (React 18 + Vite + Ant Design 5 + amis SDK + @ant-design/pro-chat + Monaco Editor + xterm.js)：前端，端口 **5173**（pro-chat peer dep 要求 React 18，pnpm install 会自动降级）
  - **v0.dev 风格视觉**：暗色主题（`darkAlgorithm` + 自定义 token）、Geist / Geist Mono 字体、白底黑字 primary Button、边框替代阴影。主题定义在 `frontend/src/theme/`
  - **云端 IDE**：`/projects/:id` 是文件树 + Monaco 编辑器 + 终端 + 浏览器控制台 + 预览六合一面板（详见下文）；旧版以 `/projects/:id/legacy` 兜底

### 基础设施
- PostgreSQL + pgvector 扩展：主数据库，端口 5432
- Docker daemon：沙箱容器运行时（每任务一个 `amis-ai-sandbox-task-N` 容器）
- Nginx：反向代理，端口 80（新增 `/preview/{task_id}/` 代理到沙箱 Vite dev server）
- Ollama / DashScope / OpenAI / Anthropic：LLM 供应商（通过 UI 在运行时配置，不硬编码）

## 项目结构

```
amis-ai/
├── frontend/                        # React 前端（Vite + TypeScript）
│   └── src/
│       ├── theme/                   # v0.dev 风格主题（AntD token + CSS 变量 + 字体）
│       ├── stores/ide.ts            # IDE 工作区状态（打开文件 Tab、console 日志、终端 buffer）
│       ├── services/ide.ts          # IDE REST/WS 客户端封装
│       └── views/Projects/
│           ├── Detail.tsx           # ⚠️ legacy，保留在 /projects/:id/legacy
│           └── detail/              # 新版云端 IDE（/projects/:id 默认入口）
│               ├── index.tsx        # 装配 TopBar + ActivityBar + 三栏主区 + Bottom Tabs
│               ├── panels/          # FileTree/Editor/Preview/Chat/Terminal/Console/Logs
│               └── hooks/           # useFileTree / useProjectEvents / useIframeConsole
├── backend/                         # Rust 后台管理服务
│   └── src/
│       ├── handlers/
│       │   ├── project_generation.rs  # 项目任务 REST 路由
│       │   ├── project_events.rs      # WebSocket 事件聚合代理
│       │   └── project_ide.rs         # 🆕 IDE 透传：JWT 认证 + 任务归属 → sandbox fs/terminal
│       ├── services/                  # 新增目录：内部服务客户端
│       │   ├── sandbox_client.rs      # 调 sandbox-service（async reqwest，含 fs_tree/read/write 等）
│       │   └── claw_agent_client.rs   # 调 claw-agent-server（async reqwest）
│       └── entity/
│           ├── project_generation_task.rs
│           ├── project_task_message.rs
│           └── project_task_event.rs
├── agent/                           # Python 智能体服务（正向生成，保持原状）
├── claw-code/                       # 第三方 claw-code 源码（仅复用，不改）
│   └── rust/crates/claw-agent-server/   # 新增 crate：包装 claw-code runtime 为多租户服务
│       └── src/
│           ├── main.rs
│           ├── state.rs             # TaskEvent、TaskStatus、AgentTask
│           ├── sandbox_client.rs    # 同步 HTTP 客户端（ureq，避免嵌套 tokio runtime）
│           ├── tool_executor.rs     # bash 走 sandbox exec；文件工具直接操作工作目录
│           ├── api_bridge.rs        # async→sync 桥接（ApiClient trait 实现）
│           ├── task_loop.rs         # spawn_blocking + multi-turn 消息队列
│           ├── skills.rs            # 按 tech_stack 加载 Skills markdown 到 system_prompt
│           ├── http.rs              # REST handler
│           └── ws.rs                # WebSocket 事件流
├── sandbox/                         # Rust Docker 沙箱服务
│   └── src/
│       ├── main.rs
│       ├── docker.rs                # Bollard 封装（含 exec 方法，支持 TTY）
│       ├── port_pool.rs             # 20000–21000 端口池
│       ├── dev_runner.rs            # pnpm run dev:h5 启动 + 日志监听 + ready/failed 判定
│       ├── handlers.rs              # 核心 REST（create/delete/exec/dev-start/dev-status）
│       ├── fs_handlers.rs           # 🆕 文件系统（tree/read/write/delete/mkdir，直读宿主 workdir）
│       └── terminal_handlers.rs     # 🆕 终端 WebSocket（bollard exec TTY + xterm 协议 in/out/resize）
├── skills/                          # A 层 Skills（Markdown 文档，注入 system_prompt）
│   └── uniapp-wot-h5/
│       ├── scaffold.md              # 脚手架约束
│       ├── amis-to-vue-mapping.md   # 顶层结构翻译规则
│       ├── component-mapping.md     # Amis 组件 → Wot UI 组件对照
│       ├── api-adapter.md           # axios 请求适配
│       ├── pages-json-rules.md      # 路由注册规则
│       └── common-errors.md         # 飞轮沉淀错误手册
├── scaffolds/                       # C 层脚手架种子项目
│   └── uniapp-wot-h5-template/      # UniApp + Wot UI H5 可跑骨架（pnpm install 已验证）
├── shared/                          # 共享配置
│   ├── docker/
│   │   ├── postgres/init.sql
│   │   ├── nginx/nginx.conf
│   │   └── sandbox/uniapp-node20/   # 沙箱镜像 Dockerfile
│   └── scripts/
│       └── start-services.sh        # 🆕 一键启动三 Rust 服务（含 unset proxy）
├── docs/                            # 设计文档（如设计规格 + 实施计划）
└── docker-compose.yml
```

## 开发规范

- 所有回复、思考、代码注释使用中文
- 后端 Rust 代码遵循标准 Rust 风格（`cargo fmt` / `cargo clippy`）
- 前端使用 TypeScript 严格模式
- Python 代码遵循 PEP 8
- **不要主动提交代码或启动测试服务，需要用户允许**

### claw-code 工作约束
- `claw-code/rust/crates/{api,runtime,tools,...}` 是**第三方代码**，**绝不修改**
- 仅通过在 `claw-code/rust/crates/claw-agent-server/` 中实现 `ApiClient` / `ToolExecutor` trait 来扩展
- 如需改动 claw-code 的行为，必须在包装层解决，不能改源 crate

### 并发与运行时约束（踩坑记录）
- `reqwest::blocking` 会创建内部 tokio runtime，在 tokio async context 里 drop 时会 panic —— 已改用纯同步的 `ureq`
- 在 `spawn_blocking` 里调用 async 函数时，用 `tokio::runtime::Builder::new_current_thread()` 创建**局部 runtime**，避免嵌套 multi-thread runtime 的 drop 问题
- `ConversationRuntime` 必须全程在同一个 blocking thread 内存活（支持多轮对话的前提）

## 🛠️ 日常工具三件套（必读，所有维护工作的入口）

| 工件 | 何时跑 | 干什么 |
|---|---|---|
| **[shared/scripts/start-services.sh](shared/scripts/start-services.sh)** | 服务启停 | `check` 体检 / `start` 启动 4 个服务 / `status` 看端口 / `stop` 停 + 清沙箱 / `restart` 重启 |
| **[shared/scripts/smoke-test.sh](shared/scripts/smoke-test.sh)** | 每次发版 / 改完 / 接手机器 | 端到端 26 项冒烟（健康/登录/Skills CRUD/系统配置/Embedding 兼容/RAG 入库检索/RBAC），输出 `PASS=26 FAIL=0` 才算绿灯 |
| **[docs/regression-checklist.md](docs/regression-checklist.md)** | 大改动后 / 出门前 | 回归清单：脚本不能覆盖的人工部分（正向/反向飞轮的 UI 流程、ZC 插件挂载、Embedding UI、回滚信号） |

**新人接手 amis-ai 标准开机流程**：
```bash
./shared/scripts/start-services.sh check    # 1. 体检（缺啥提示啥）
./shared/scripts/start-services.sh start    # 2. 起 4 服务
./shared/scripts/smoke-test.sh              # 3. 冒烟，PASS=26 才放心
# 4. 跟着 docs/regression-checklist.md 跑一遍人工项
```

---

## 常用命令

```bash
# === 一键启动所有 4 个后端服务（推荐，2026-04-22 起含 Python agent） ===
./shared/scripts/start-services.sh check     # 启动前体检（DB/Docker/pgvector/二进制/uv 等）
./shared/scripts/start-services.sh start     # 启动 sandbox + claw-agent + backend + python-agent
./shared/scripts/start-services.sh status    # 查看端口（4 个：8080 backend / 8090 claw / 8091 sandbox / 8000 agent）
./shared/scripts/start-services.sh stop      # 停止 + 清理 Docker 容器
./shared/scripts/start-services.sh restart   # 重启
./shared/scripts/smoke-test.sh               # 端到端冒烟（PASS=26 才算 OK）

# === 给 ZC 等外部团队挂插件 skill 包（C 阶段，2026-04-22 起） ===
SKILLS_PLUGIN_PATHS=/opt/zc-amis-skills,/opt/another-pack \
  ./shared/scripts/start-services.sh restart

# 日志位置：/tmp/amis-ai-logs/
tail -f /tmp/amis-ai-logs/claw-agent-server.log
tail -f /tmp/amis-ai-logs/sandbox-service.log
tail -f /tmp/amis-ai-logs/backend.log
tail -f /tmp/amis-ai-logs/agent.log          # 2026-04-22 新增

# === 前端 ===
cd frontend && pnpm dev                      # Vite dev server @ :5173

# === 单独启动某个后端服务（调试用） ===
cd sandbox && cargo run                                              # :8091
cd claw-code/rust && cargo run -p claw-agent-server                  # :8090
cd backend && cargo run                                              # :8080
cd agent && uv run uvicorn src.main:app --reload --port 8000         # :8000

# === Docker 基础设施 ===
docker-compose up -d            # postgres + nginx
docker images | grep sandbox    # 确认沙箱镜像存在：amis-ai-sandbox:uniapp-node20
```

### ⚠️ 代理问题（WSL 用户必读）
在 WSL 里如果设置了 `http_proxy` / `HTTPS_PROXY` 指向 Clash 等代理，那么 claw-agent-server 访问**内网 LLM**（如本地 Ollama）会被代理拦截返回 502。`start-services.sh` 已用 `env -u` 局部清除代理变量（只影响三个后端服务进程，不影响当前 shell），所以**必须用这个脚本启动**，或者手动先 `unset http_proxy HTTP_PROXY https_proxy HTTPS_PROXY` 再 `cargo run`。

## 云端 IDE 架构（2026-04 新增）

`/projects/:id` 是类 VSCode 的六合一工作区，帮用户看穿沙箱黑盒、手动介入调试：

```
┌──────────────────────────────────────────────────────────┐
│ TopBar（返回、面包屑）                                    │
├──┬───────────────┬────────────────────┬─────────────────┤
│A │ FileTree /    │ Editor (Monaco)    │ Preview         │
│B │ ChatPanel     │ ── Bottom Tabs ─── │ (iframe)        │
│  │ (drawer)      │ [终端 | 控制台 |    │                 │
│  │               │  Dev 日志]          │                 │
├──┴───────────────┴────────────────────┴─────────────────┤
│ StatusBar（task 状态、dev 状态、端口、fix 次数）          │
└──────────────────────────────────────────────────────────┘
```

### 后端路由（都走 JWT + 任务归属校验）

| Method | 路径 | 实现 |
|---|---|---|
| GET  | `/api/projects/tasks/:id/ide/fs/tree?depth=N` | 文件树（忽略 node_modules/.git/dist/…） |
| GET  | `/api/projects/tasks/:id/ide/fs/file?path=X`  | 读文件（>512KB 标 `truncated`） |
| PUT  | `/api/projects/tasks/:id/ide/fs/file`         | 写文件，body `{path,content,base_mtime}`；base_mtime 冲突返回 **409** |
| DEL  | `/api/projects/tasks/:id/ide/fs/file?path=X`  | 删除文件/目录 |
| POST | `/api/projects/tasks/:id/ide/fs/mkdir`        | 创建目录 |
| WS   | `/api/projects/tasks/:id/ide/terminal?token=JWT&cols=N&rows=N` | xterm TTY（bollard exec + TTY） |

### Sandbox 直连（仅 backend 调用，不暴露给前端）

`sandbox/src/fs_handlers.rs`：所有 path **规范化 + 越权校验**（必须落在 `/workspace` 内），读写限 512KB/2MB。
`sandbox/src/terminal_handlers.rs`：WebSocket 帧协议，客户端发 `{t:"in",d:"..."}` / `{t:"resize",cols,rows}`，服务端回 `{t:"out",d:"..."}` / `{t:"exit",code}`。stdin 限速 2KB/s，空闲 15 分钟自动 close。

### 浏览器控制台注入

`scaffolds/uniapp-wot-h5-template/src/main.ts` 在 `window.parent !== window` 分支里劫持了 `console.log/info/warn/error/debug`，通过 `postMessage({type:'amis-ai/console',...})` 发给父窗口（IDE 的 `ConsolePanel`）。循环引用/BigInt/Error/Function 都做了 safeStringify。

### "塞入对话" 约定（Agent 可识别）

当用户点 ConsolePanel / TerminalPanel 的「塞入对话」按钮时，前端调 `addProjectTaskMessage` 发一条带特殊 markdown fence 的消息：

```markdown
<!-- amis-ai:inject-source=browser-console -->
用户从浏览器控制台塞入以下日志，请协助分析：

​```log-console
[error] TypeError: Cannot read property 'foo' of undefined
    at src/pages/index/index.vue:42
​```
```

终端版本用 `log-terminal` fence。`claw-code/rust/.../skills.rs` 里的 `USER_INPUT_FENCE_GUIDANCE` 常量会被附加到所有 system_prompt 末尾，告诉 Agent 碰到这类代码块要当诊断证据分析并直接修代码。

## 反向飞轮关键流程

用户完整走一遍的路径：

1. 在 `/chat` 页生成 Amis JSON（正向飞轮）
2. 点击消息下的「🚀 生成项目代码」按钮 → 自动跳转 `/projects/:id`
3. 后端流程：创建 `project_generation_task` 记录 → 调 sandbox-service 拉起 Docker 容器 → 调 claw-agent-server 创建会话
4. 前端详情页：WebSocket 订阅事件流，实时展示 Agent 工具调用；右侧 iframe 加载沙箱 Vite 预览
5. Agent 用 Skills 文档驱动，在沙箱里 `pnpm install` → `pnpm run dev:h5`
6. 启动失败 → Agent 自动读 Vite 错误日志修复（`fix_attempts` 最多 5）
7. 启动成功 → 用户点「采纳」→ 代码沉淀到 `code_sample` 表（RAG 飞轮，待 Task 4.5）

## LLM 配置

沿用 amis-ai 现有的 LLM 管理机制（`backend/src/handlers/llm_admin.rs`）：
- 在「系统设置 → LLM 供应商」UI 里配置 provider + model
- `task_type` 新增 `code_generation`（可选，fallback 到 `generation`）
- **每个供应商创建时必须显式选择协议类型**（`llm_providers.protocol` 字段）：
  - `openai` → OpenAI Chat Completions 兼容协议（Ollama / DashScope / DeepSeek / 通义千问 等）
  - `anthropic` → Anthropic Messages API（官方 `api.anthropic.com` 或支持 Claude 端点的中转服务）
- `claw-agent-server` 只看 `protocol` 字段路由，**不再根据模型名前缀猜测**
- Anthropic 路径会自动：
  - 规范化 base_url（去除结尾 `/v1`），避免中转服务带 `/v1` 时拼成 `/v1/v1/messages`
  - 把工具 schema 以 Anthropic 原生 `tools` 参数传过去（不传的话 Claude 会模仿 Claude Code 训练数据输出 `<function_calls><invoke>` 文本而非结构化 `tool_use`）

**已知限制**：本地开源模型（如 Ollama `qwen3.5:27b`）tool calling 能力弱，Agent 容易只输出文字不调工具。建议配置一个支持 function calling 的模型（Claude Haiku / GPT-4o-mini / DeepSeek-V3 API / Qwen-Max 等）获得可靠效果。

## 参考项目

- LLM 配置管理参考: `~/Working/creation/timecraft-novel`
  - 后端 LLM 管理: `backend/src/handlers/llm_admin.rs`
  - LLM 工具模块: `backend/src/utils/llm.rs`
  - JWT 认证: `backend/src/utils/jwt.rs`
- 反向飞轮设计规格: `/home/karl/.claude/plans/mossy-tinkering-forest.md`
- 知识层 + RAG 飞轮 + 插件机制设计：`/home/karl/.claude/plans/misty-beaming-mango.md`

---

## 2026-04-22 大升级 · 知识层 + 飞轮闭环 + 插件机制

这次升级把"原 plan 里 Task 4.5–4.8 + Section 6"全部完成，并把 Skills 升级到 claw-code 标准协议、加上多源插件机制、补上 RBAC 和管理界面。

### A · Skills 知识层升级（标准协议 + 索引模式）

- **目录约定**：`skills/<bucket>/SKILL.md`（YAML frontmatter `name + description`）+ `references/` 详细文档 + `assets/`
- **加载策略 progressive disclosure**（`claw-agent-server/src/skills.rs::build_skills_system_prompt`）：
  - L0：`_common/SKILL.md` 全文（产品哲学，所有任务必读）
  - L1：当前 `tech_stack` 的 SKILL.md 全文（含工作流）
  - L2：其他 stack 的 `name + description` 索引（让 Agent 知道还有什么可调）
  - L3：用户日志识别协议（USER_INPUT_FENCE_GUIDANCE）
  - 详情 Agent 通过 **claw-code 内置 `Skill` 工具按需加载**（`tool_executor.rs::execute_skill_with_guard`，含路径白名单 + 256KB 上限）
- **HOME 隔离**（`claw-agent-server/src/main.rs::init_skills_env`）：把 HOME 重写到 tempdir，阻断宿主机 `~/.claude/skills` 等私人 skill 污染业务上下文
- **Skills 管理 UI**：`/knowledge-base/skills` —— 卡片列表 + 单桶详情（左树右 Monaco + VSCode 式右键 CRUD + 自动打开 SKILL.md + 新建桶含模板）

### B · RAG 飞轮闭环

- **schema**：`code_samples` 表（含 `tech_stack / source_team / status / hit_count` + pgvector embedding 列）
  - **维度**：当前 2560，对齐 `qwen3-embedding:4b`。改 embedding 模型必须 ALTER TABLE 重建列（`EMBEDDING_DIM` env 控制）
  - 不建 ivfflat 索引（pgvector 限制 2000 维，用 sequential scan，飞轮起步阶段够用）
- **入库**：手动 `POST /api/code-samples` 或采纳 `POST /api/projects/tasks/:id/adopt`（自动从 sandbox 收集 src/* 拼成 markdown）→ INSERT → 异步调 Python `/internal/index-code-sample` 向量化
- **检索**：任务创建时 backend 调 Python `/internal/search-code-samples`（同 stack Top-3 only_approved）→ 拼 markdown section → 通过 claw-agent-server `extra_system_sections` 注入 system_prompt 末尾
- **审核流**：D3 决策默认 `pending`（`adopt_default_status` 系统配置可切 `approved`）
- **管理 UI**：`/knowledge-base/code-samples` 列表 + 详情（左 Amis JSON / 右代码 + 通过/拒绝/删除）
- **维度兼容性 UI**（`/settings → 模型配置`）：探测按钮 → 三个 Tag（pgvector列 / env / 模型实测） → 不匹配大红警告

### C · ZC Amis 等外部团队插件机制（C 阶段）

- **插件包** = git 仓库，根目录下放一个或多个 skill 桶（每个含 `SKILL.md`）
- **挂载**：claw-agent-server 启动时（`mount_plugin_packs`），按 `SKILLS_PLUGIN_PATHS` env 把每个含 SKILL.md 的子目录 **symlink** 到 `$CLAW_CONFIG_HOME/skills/<bucket>`
- **同名冲突**：amis-ai 自带桶优先；多插件之间先到先得 + 警告
- 完整规范：[docs/skills-plugin-spec.md](docs/skills-plugin-spec.md)
- ZC 团队起步教程：[docs/zc-amis-plugin-template-readme.md](docs/zc-amis-plugin-template-readme.md)

### RBAC（A.6 加）

- `users.is_admin` 列；seed 时 admin 账号置 true；新注册默认 false
- 所有 `/api/skills/*`、`/api/code-samples/*`、`/api/system-settings/*`、`/api/system/*` 走 `require_admin` 校验
- 前端 Layout 按 `user.is_admin` 隐藏菜单；mount 时主动调 `/api/user/profile` 同步避免 localStorage 缓存过时
- 普通用户绕路由直接访问会拿到 403 Result 页

### 关键路径速查

| 关心点 | 文件 |
|---|---|
| Skills 加载 | [claw-code/rust/crates/claw-agent-server/src/skills.rs](claw-code/rust/crates/claw-agent-server/src/skills.rs) |
| Skill 工具白名单 | [claw-code/rust/crates/claw-agent-server/src/tool_executor.rs](claw-code/rust/crates/claw-agent-server/src/tool_executor.rs) |
| 启动 env + HOME 隔离 + 插件挂载 | [claw-code/rust/crates/claw-agent-server/src/main.rs](claw-code/rust/crates/claw-agent-server/src/main.rs) |
| Skills 管理 API | [backend/src/handlers/skills_admin.rs](backend/src/handlers/skills_admin.rs) |
| RAG CRUD | [backend/src/handlers/code_samples.rs](backend/src/handlers/code_samples.rs) |
| 系统配置 + 维度探测 | [backend/src/handlers/system_settings.rs](backend/src/handlers/system_settings.rs) |
| 采纳回流 + RAG 检索拼 prompt | [backend/src/handlers/project_generation.rs](backend/src/handlers/project_generation.rs)（adopt_task / fetch_rag_extra_sections） |
| Python RAG 入库/检索/探测 | [agent/src/services/rag.py](agent/src/services/rag.py)、[agent/src/routers/internal.py](agent/src/routers/internal.py) |
| 前端 Skills/RAG 管理界面 | [frontend/src/views/KnowledgeBase/](frontend/src/views/KnowledgeBase/) |
| 启动脚本（含 check + agent + plugin env） | [shared/scripts/start-services.sh](shared/scripts/start-services.sh) |
| 端到端冒烟 | [shared/scripts/smoke-test.sh](shared/scripts/smoke-test.sh) |
| 回归清单 | [docs/regression-checklist.md](docs/regression-checklist.md) |

### 原 plan 状态对照

`docs/plans/2026-04-16-reverse-code-generation.md` 里的 Section 4（Task 4.5–4.8 RAG 飞轮）+ Section 6（端到端验证）由本次升级**全部替代实现**，但落地形态比原 plan 更完整：原 plan 只考虑 backend `include_str!` 静态注入 skills（被砍）；本次落地的是**运行时管理 + 多源插件 + 审核流 + 维度探测 UI**全套。
