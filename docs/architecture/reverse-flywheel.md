# 反向飞轮：Amis JSON → 可运行业务项目

反向飞轮 2026-04 新增，MVP 锁定 **UniApp + Wot UI H5**。以 Amis JSON 为蓝本驱动 AI 编码智能体，在服务端 Docker 沙箱中**真实生成 + 启动 + 自修复**，采纳结果沉淀回 `code_sample` 表形成闭环。

## 用户路径（完整 7 步）

1. 在 `/chat` 页生成 Amis JSON（正向飞轮）
2. 点击消息下的「🚀 生成项目代码」按钮 → 自动跳转 `/projects/:id`
3. 后端创建 `project_generation_task` 记录 → 调 sandbox-service 拉起 Docker 容器 → 调 claw-agent-server 创建会话
4. 前端详情页：WebSocket 订阅事件流，实时展示 Agent 工具调用；右侧 iframe 加载沙箱 Vite 预览
5. Agent 用 Skills 文档驱动，在沙箱里 `pnpm install` → `pnpm run dev:h5`
6. **启动失败** → Agent 自动读 Vite 错误日志修复（`fix_attempts` 最多 5）
7. **启动成功** → 用户点「采纳」→ 代码沉淀到 `code_sample` 表 → Python 异步向量化入 pgvector → 下次新任务时作为 Top-3 RAG 样例注入 system_prompt

## 状态机

`project_generation_task.status`：

```
created → running → (dev_ready | failed)
                      ↓
                   adopted
```

- **created**：记录已建，容器未起
- **running**：Agent 正在编码 + dev server 启动中
- **dev_ready**：Vite 输出就绪 URL，前端 iframe 可预览
- **failed**：超出 fix_attempts 或 Agent 主动放弃（claw_agent_client 标 status=failed）
- **adopted**：用户确认采纳 → 触发 `adopt_task`

## 关键实现点

| 关心点 | 文件 |
|---|---|
| 任务 CRUD + 状态机 | [../../backend/src/handlers/project_generation.rs](../../backend/src/handlers/project_generation.rs) |
| 事件 WebSocket 聚合代理 | [../../backend/src/handlers/project_events.rs](../../backend/src/handlers/project_events.rs) |
| Sandbox 客户端 | [../../backend/src/services/sandbox_client.rs](../../backend/src/services/sandbox_client.rs) |
| Claw Agent 客户端 | [../../backend/src/services/claw_agent_client.rs](../../backend/src/services/claw_agent_client.rs) |
| dev server 启动 + 日志监听 + ready/failed 判定 | [../../sandbox/src/dev_runner.rs](../../sandbox/src/dev_runner.rs) |
| 20000–21000 端口池 | [../../sandbox/src/port_pool.rs](../../sandbox/src/port_pool.rs) |
| Agent 多轮 runtime | [../../claw-code/rust/crates/claw-agent-server/src/task_loop.rs](../../claw-code/rust/crates/claw-agent-server/src/task_loop.rs) |
| Skills system_prompt 注入 | [../../claw-code/rust/crates/claw-agent-server/src/skills.rs](../../claw-code/rust/crates/claw-agent-server/src/skills.rs) |
| 脚手架种子 | [../../scaffolds/uniapp-wot-h5-template/](../../scaffolds/uniapp-wot-h5-template/) |

## 采纳 → RAG 飞轮

采纳时 `adopt_task`：
1. 从 sandbox 收集 `src/*` 拼成 markdown
2. INSERT `code_samples`（含 tech_stack / source_team / status=`pending`）
3. 异步调 Python `/internal/index-code-sample` 向量化
4. admin 在 `/knowledge-base/code-samples` 审核通过或打回

下次任务检索时，backend `fetch_rag_extra_sections` 调 Python `/internal/search-code-samples` 取同 stack Top-3 `approved` 样例，拼 markdown section 通过 claw-agent-server `extra_system_sections` 注入 system_prompt 末尾。

详细质量闭环见 [../upgrades/2026-04-25-rag-quality-loop.md](../upgrades/2026-04-25-rag-quality-loop.md)。

## 多页任务并发控制（1.2.0）

反向飞轮多页任务（[multipage_scheduler.rs](../../backend/src/services/multipage_scheduler.rs)）的独立模式（execution_strategy=isolated）下，N 个 claw-agent session 并发跑各自页面。为避免压垮 sandbox 资源，用 `tokio::sync::Semaphore` 限流：

- env `MAX_CONCURRENT_SESSIONS` 控制同一 task 内并发 session 上限（默认 3）
- 限流逻辑在 `run_isolated_pages_with_shared_context`：每个 page spawn 前 `acquire_owned()` 拿 permit，处理完 drop 自动释放
- 超过限制的页面在 JoinSet 里 await permit，FIFO 排队
- 全部完成后 `joinset.join_next()` 收集结果统一更新 DB
