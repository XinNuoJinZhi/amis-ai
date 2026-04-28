# 2026-04-22 大升级 · 知识层 + 飞轮闭环 + 插件机制

> 本文迁移自原 CLAUDE.md（第 267–328 行），为保证历史信息零损耗，内容原样保留。

这次升级把「原 plan 里 Task 4.5–4.8 + Section 6」全部完成，并把 Skills 升级到 claw-code 标准协议、加上多源插件机制、补上 RBAC 和管理界面。

## A · Skills 知识层升级（标准协议 + 索引模式）

- **目录约定**：`skills/<bucket>/SKILL.md`（YAML frontmatter `name + description`）+ `references/` 详细文档 + `assets/`
- **加载策略 progressive disclosure**（`claw-agent-server/src/skills.rs::build_skills_system_prompt`）：
  - L0：`_common/SKILL.md` 全文（产品哲学，所有任务必读）
  - L1：当前 `tech_stack` 的 SKILL.md 全文（含工作流）
  - L2：其他 stack 的 `name + description` 索引（让 Agent 知道还有什么可调）
  - L3：用户日志识别协议（USER_INPUT_FENCE_GUIDANCE）
  - 详情 Agent 通过 **claw-code 内置 `Skill` 工具按需加载**（`tool_executor.rs::execute_skill_with_guard`，含路径白名单 + 256KB 上限）
- **HOME 隔离**（`claw-agent-server/src/main.rs::init_skills_env`）：把 HOME 重写到 tempdir，阻断宿主机 `~/.claude/skills` 等私人 skill 污染业务上下文
- **Skills 管理 UI**：`/knowledge-base/skills` —— 卡片列表 + 单桶详情（左树右 Monaco + VSCode 式右键 CRUD + 自动打开 SKILL.md + 新建桶含模板）

## B · RAG 飞轮闭环

- **schema**：`code_samples` 表（含 `tech_stack / source_team / status / hit_count` + pgvector embedding 列）
  - **维度**：当前 2560，对齐 `qwen3-embedding:4b`。改 embedding 模型必须 ALTER TABLE 重建列（`EMBEDDING_DIM` env 控制）
  - 不建 ivfflat 索引（pgvector 限制 2000 维，用 sequential scan，飞轮起步阶段够用）
- **入库**：手动 `POST /api/code-samples` 或采纳 `POST /api/projects/tasks/:id/adopt`（自动从 sandbox 收集 src/* 拼成 markdown）→ INSERT → 异步调 Python `/internal/index-code-sample` 向量化
- **检索**：任务创建时 backend 调 Python `/internal/search-code-samples`（同 stack Top-3 only_approved）→ 拼 markdown section → 通过 claw-agent-server `extra_system_sections` 注入 system_prompt 末尾
- **审核流**：D3 决策默认 `pending`（`adopt_default_status` 系统配置可切 `approved`）
- **管理 UI**：`/knowledge-base/code-samples` 列表 + 详情（左 Amis JSON / 右代码 + 通过/拒绝/删除）
- **维度兼容性 UI**（`/settings → 模型配置`）：探测按钮 → 三个 Tag（pgvector列 / env / 模型实测） → 不匹配大红警告

## C · ZC Amis 等外部团队插件机制（C 阶段）

- **插件包** = git 仓库，根目录下放一个或多个 skill 桶（每个含 `SKILL.md`）
- **挂载**：claw-agent-server 启动时（`mount_plugin_packs`），按 `SKILLS_PLUGIN_PATHS` env 把每个含 SKILL.md 的子目录 **symlink** 到 `$CLAW_CONFIG_HOME/skills/<bucket>`
- **同名冲突**：amis-ai 自带桶优先；多插件之间先到先得 + 警告
- 完整规范：[../skills-plugin-spec.md](../skills-plugin-spec.md)
- ZC 团队起步教程：[../zc-amis-plugin-template-readme.md](../zc-amis-plugin-template-readme.md)

## RBAC（A.6 加）

- `users.is_admin` 列；seed 时 admin 账号置 true；新注册默认 false
- 所有 `/api/skills/*`、`/api/code-samples/*`、`/api/system-settings/*`、`/api/system/*` 走 `require_admin` 校验
- 前端 Layout 按 `user.is_admin` 隐藏菜单；mount 时主动调 `/api/user/profile` 同步避免 localStorage 缓存过时
- 普通用户绕路由直接访问会拿到 403 Result 页

## 关键路径速查

| 关心点 | 文件 |
|---|---|
| Skills 加载 | [../../claw-code/rust/crates/claw-agent-server/src/skills.rs](../../claw-code/rust/crates/claw-agent-server/src/skills.rs) |
| Skill 工具白名单 | [../../claw-code/rust/crates/claw-agent-server/src/tool_executor.rs](../../claw-code/rust/crates/claw-agent-server/src/tool_executor.rs) |
| 启动 env + HOME 隔离 + 插件挂载 | [../../claw-code/rust/crates/claw-agent-server/src/main.rs](../../claw-code/rust/crates/claw-agent-server/src/main.rs) |
| Skills 管理 API | [../../backend/src/handlers/skills_admin.rs](../../backend/src/handlers/skills_admin.rs) |
| RAG CRUD | [../../backend/src/handlers/code_samples.rs](../../backend/src/handlers/code_samples.rs) |
| 系统配置 + 维度探测 | [../../backend/src/handlers/system_settings.rs](../../backend/src/handlers/system_settings.rs) |
| 采纳回流 + RAG 检索拼 prompt | [../../backend/src/handlers/project_generation.rs](../../backend/src/handlers/project_generation.rs)（adopt_task / fetch_rag_extra_sections） |
| Python RAG 入库/检索/探测 | [../../agent/src/services/rag.py](../../agent/src/services/rag.py)、[../../agent/src/routers/internal.py](../../agent/src/routers/internal.py) |
| 前端 Skills/RAG 管理界面 | [../../frontend/src/views/KnowledgeBase/](../../frontend/src/views/KnowledgeBase/) |
| 启动脚本（含 check + agent + plugin env） | [../../shared/scripts/start-services.sh](../../shared/scripts/start-services.sh) |
| 端到端冒烟 | [../../shared/scripts/smoke-test.sh](../../shared/scripts/smoke-test.sh) |
| 回归清单 | [../regression-checklist.md](../regression-checklist.md) |

## 原 plan 状态对照

[../plans/2026-04-16-reverse-code-generation.md](../plans/2026-04-16-reverse-code-generation.md) 里的 Section 4（Task 4.5–4.8 RAG 飞轮）+ Section 6（端到端验证）由本次升级**全部替代实现**，但落地形态比原 plan 更完整：原 plan 只考虑 backend `include_str!` 静态注入 skills（被砍）；本次落地的是**运行时管理 + 多源插件 + 审核流 + 维度探测 UI**全套。
