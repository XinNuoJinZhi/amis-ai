# 2026-04-27 · 通用 AI 对话：SSE 流式 + 多会话持久化

> `/chat` 页（左侧菜单「AI 对话」）从「一锤子等完整响应」升级为「打字机逐字流式」+「数据库多会话管理」。
> 刷新浏览器 / 换设备 / 删了再回来——历史都还在。

## Context（为什么做）

之前 [Conversation/index.tsx](../../frontend/src/views/Conversation/index.tsx) 调 `chat(history)` 一把梭等完整响应，然后整段 setMessages，再加个 CSS 脉冲点装样子——表现就是憋几秒"啪"一下整段冒出来；后端 [conversation.rs](../../backend/src/handlers/conversation.rs) 也直接给 LLM 发 `"stream": false`。

并且整个对话**只在内存里**：路由切走、刷新浏览器，全没了，根本不算「AI 对话页」该有的样子。

这次一并补齐：

- **真 SSE**：后端转发上游 OpenAI SSE 流到前端，前端逐 chunk 累加到气泡
- **多会话**：数据库存会话 + 消息，左侧像 ChatGPT 那样一条条列着，可新建 / 重命名 / 删除 / 切换
- **首字尾光标**：流式中气泡末尾跳一个细光标条，结束后消失

## 数据库

### 新表

| 表 | 字段 | 说明 |
|---|---|---|
| `conversation_session` | `id` PK / `session_id` UUID(unique) / `user_id` / `title` / `created_at` / `updated_at` | 一个用户多条会话；title 默认「新会话」，首条用户消息发出后用前 30 字自动回填 |
| `conversation_message` | `id` PK / `session_pk` FK→session.id / `role` / `content` / `model?` / `provider?` / `created_at` | 单条消息；assistant 才回填 model/provider 给前端挂 Tag |

### 索引

```sql
CREATE INDEX idx_conv_session_user_updated
  ON conversation_session (user_id, updated_at DESC);
CREATE INDEX idx_conv_message_session
  ON conversation_message (session_pk, created_at);
```

启动时由 sea-orm `Schema::create_table_from_entity` 自动建表，索引在 [main.rs](../../backend/src/main.rs) 一并 `CREATE INDEX IF NOT EXISTS`。

### 未做 FK 约束

sea-orm `create_table_from_entity` 不生成 DB 级 FK。删除会话时 handler 先 `delete_many(messages WHERE session_pk = ?)` 再 `delete_by_id(session)`，业务层兜底。

## 后端接口

| Method | 路径 | 作用 |
|---|---|---|
| `GET` | `/api/conversation/sessions` | 列当前用户全部会话（最近更新在前） |
| `POST` | `/api/conversation/sessions` | 新建空会话（title=「新会话」） |
| `GET` | `/api/conversation/sessions/:id` | 拉会话详情 + 全部消息（按 created_at 升序） |
| `PATCH` | `/api/conversation/sessions/:id` | 改 title（≤80 字） |
| `DELETE` | `/api/conversation/sessions/:id` | 删会话连带消息 |
| `POST` | `/api/conversation/sessions/:id/chat/stream` | **SSE 流式**：发用户消息 → 流式生成 assistant |

## SSE 事件协议

```
event: meta
data: {"user_message": {...MessageDTO}, "model": "...", "provider": "...", "title": "用户问的xxx"}

event: chunk
data: {"text": "你"}

event: chunk
data: {"text": "好"}

event: final
data: {"assistant_message": {...MessageDTO}}
```

| 事件 | 时机 | payload |
|---|---|---|
| `meta` | 上游 LLM 请求发出**前**就发 | 用户消息（已落库）+ 模型 / provider + 自动回填的 title（首条触发，否则 null） |
| `chunk` | 上游每个 `delta.content` | 增量文本（可能 1 字也可能多字） |
| `final` | 流结束、assistant 消息**已落库**后发 | 完整 assistant 消息（含 DB id） |
| `error` | 任何阶段出错 | `{ "error": "..." }` |

handler 用 `mpsc::Sender<Event>` + `futures::stream::unfold` 拼出 axum `Sse`，与 `skill_authoring::generate_stream` 同套模式。OpenAI 上游 SSE 解析在 [conversation.rs::pump_openai_stream](../../backend/src/handlers/conversation.rs)，规则按 W3C：空行 = 事件边界，`data: [DONE]` = 流结束。

## 前端

### 服务层 [services/conversation.ts](../../frontend/src/services/conversation.ts)

| 函数 | 说明 |
|---|---|
| `listSessions / createSession / getSession / renameSession / deleteSession` | 走 `axios` |
| `chatStream(sessionId, content, handlers, signal?)` | 走原生 `fetch` + `ReadableStream`，自己解析 SSE 事件块（以 `\n\n` 切，dispatch 到 `onMeta / onChunk / onFinal / onError`） |

### 视图 [views/Conversation/index.tsx](../../frontend/src/views/Conversation/index.tsx)

布局：
```
┌─────────┬─────────────────────────────┐
│ 会话    │ AI 对话 · task_type=chat   │
│ + 新会话│ 当前会话标题  [provider/model]│
│ ─────── │─────────────────────────────│
│ • 第一条│  用户气泡 →                 │
│ • 第二条│  ← assistant 气泡           │
│ • 第三条│    （流式 ▌ 末尾闪烁光标）   │
│ ...     │─────────────────────────────│
│         │ [输入框 ............] [发送]│
└─────────┴─────────────────────────────┘
```

关键交互：
- 首次挂载：拉会话列表，空则自动 `createSession`
- 切换会话：`useEffect(activeId)` 拉详情
- 发送：占位 push 临时 user / pending assistant → `meta` 事件用真实 DB id 替临时 id → `chunk` 累加 content → `final` 替整条 assistant
- 流式标识：assistant.pending && content === '' 时显示「正在思考...」；首字到来后切换为 content + 末尾闪烁光标条
- 改名：Modal + Input 限 80 字
- 删除：Popconfirm 双确认；如果删的是当前会话 → 自动切下一条；删空了自动建新会话
- 自动滚到底：依赖 `messages.length` + 最后一条 content 长度变化

### 中断生成（同日补丁）

`/chat` 流式中按钮变红色 `⏹ 停止`：
- 前端 `useRef<AbortController>` 跟踪当前流，点击 `controller.abort()`
- 后端 [pump_openai_stream](../../backend/src/handlers/conversation.rs) 检测到 `tx.send` 失败（client 断开）→ 立即停止读上游 LLM（节省算力）→ 调用方走原有落库分支，**已生成部分照样存进 DB**
- 中断后气泡末尾追加 `⏹ 已停止` 标记；刷新页面看到的 assistant 消息就是中断时的状态

### 项目工作台 ChatPanel 同步修复（同日补丁）

[ChatPanel.tsx](../../frontend/src/views/Projects/detail/panels/ChatPanel.tsx) 之前的「停止」按钮依赖 `status_change` 事件流推断 `isRunning`，但 `add_message` handler 不发该事件，导致用户发完消息到 LLM 实际响应那 1~5 秒 gap 里按钮还停在「发送」。修复：
- 加 `optimisticBusy` 乐观态：`addProjectTaskMessage` 成功后立刻置 true
- `useEffect` 监听 events 末尾，看到 `turn_complete` 或非 active 状态切换就关闭乐观态
- 60s 安全兜底
- 主动点停止后立即关闭乐观态（不等事件回流）
- 渲染条件 `showStop = isRunning || optimisticBusy`，按钮加 `danger` 红色

**任务启动时立刻显示停止（同日二补）**

任务**首次启动 / 刷新页面立刻进来**时，events 流可能还是空数组，`currentStatus` 是 null → 按钮停在发送。修复：把 `task.status` 从 [ProjectDetail](../../frontend/src/views/Projects/detail/index.tsx) 顶层透传给 ChatPanel：
- ChatPanel Props 加 `taskStatus?: string | null`
- `currentStatus` 计算改为：events 流找不到 status_change 时 fallback 到 props.taskStatus
- 三个父视图（OnboardingView / WorkspaceView / EditorView）全部加 prop 透传

这样 REST 一旦把 task.status 拉回来（running/pending/waiting_user），按钮立即变停止——不用等 WS event。

**任务结束时顶层 task 自动同步（同日三补）**

[ProjectDetail](../../frontend/src/views/Projects/detail/index.tsx) 的轮询只在 `phase === 'onboarding'` 阶段跑，进入 workspace 后就停了。结果任务从 running → succeeded/failed/stopped 时事件流推了 `status_change`，但顶层 `task` state 没人刷——TopBar 的状态显示、StopTaskButton 显隐、采纳按钮可见性全部卡在旧状态。

修复：加一个全阶段都跑的 effect：
- 监听 events，找最末尾的 `status_change`
- 用 `lastStatusFromEventRef` 去重，状态值真正变化才触发
- 异步 `getProjectTask` 刷新（顺带把 sandbox_id / preview_port 等也带回来）

比定时轮询轻——只在状态切换的瞬间多发一次 REST。

**dev ready → succeeded 切换前端拿不到（同日四补）**

但三补只覆盖 events 流里有 `status_change` 的情况。Backend `dev_status_watcher` 检测到 dev server ready 时把 task.status 改成 `succeeded`（[project_generation.rs:807](../../backend/src/handlers/project_generation.rs#L807)）只 insert DB **不 broadcast 到 WS**——这种 backend 自主产生的 status_change 永远到不了前端事件流，三补的 useEffect 也派不上用场。

症状：底部状态栏显示 `READY`，但顶部「停止任务」按钮还在、ChatPanel 按钮还卡在「停止」、采纳按钮没出来。

修复：把原 `phase === 'onboarding'` 阶段才跑的 3 秒轮询，扩成「task 在活跃态（pending / running / waiting_user）时一直跑」：
- 状态切到终结态（succeeded / failed / stopped）后 effect re-run 直接 return，停止轮询（不浪费带宽）
- 与三补的 events 监听互为补充——onboarding 阶段大多 status_change 来自上游 claw-agent（events 流可见），workspace 阶段 dev_status_watcher 产生的状态切换由轮询兜住

更彻底的修法是后端给 dev_status_watcher 加 WS broadcast 通道，但工作量大；前端轻量轮询作为 pragmatic fallback。

**timezone bug：task #100 防御逻辑误标 failed（同日五补，根因核弹）**

实战 task #102 暴露：用户明明看到 LLM 用 `write_file` 改了 `src/pages/products/products.vue` 而且预览页能正常渲染，但 task.status 却是 `failed`、`fix 0/5` 永远没触发自动修复。日志只有一行：

```
task 102 dev ready but workdir unchanged since task start → marking failed (likely path-rejected writes)
```

定位到 [workdir_changed_since_task_start](../../backend/src/handlers/project_generation.rs#L1111) 函数：

```rust
// 任务写入时（其它处统一）：本地时间 GMT+8 的 15:57
created_at: Set(chrono::Local::now().naive_local())

// 旧检测代码：把 naive 当 UTC 读
let secs = task_created_at.and_utc().timestamp();  // ← 比真实 UTC 早 8h
let since = UNIX_EPOCH + secs + 5s;                // ← 跑到任务创建后 8h
// 文件 mtime（真实 UTC ≈ 创建后几秒）全部 < since → 误判 "workdir 一字未改" → 标 failed
```

**核心修复**：把 naive 按本地时区还原回 UTC timestamp 再比对。

```rust
let secs = chrono::Local
    .from_local_datetime(&task_created_at)
    .single()
    .map(|dt| dt.timestamp())
    .unwrap_or_else(|| task_created_at.and_utc().timestamp());
```

这才是「为什么 fix 0/5 永远不触发」「为什么任务总被误标 failed」的**根因**——前面的 ChatPanel 按钮、TopBar 状态、轮询补丁全是症状层面的修补，本质是这个时区 bug 把 watcher 在 dev 第一次 ready 时就强制送进 failed 退出分支了。

**watcher 状态机重构（连带修，让任务可救场）**

光修 timezone 不够——task #100 防御本来就有合法触发场景（LLM write_file 全被路径校验拦截），原本一旦标 failed 就 watcher `return` 退出，再没人监听沙箱后续状态。重构 [spawn_dev_status_watcher](../../backend/src/handlers/project_generation.rs#L711)：

| 场景 | 改前 | 改后 |
|---|---|---|
| `task.status=failed` 时 dev 重新 ready（救场后） | watcher 早 return 退出 | 基于 DB 状态判断 → 切回 succeeded（**复活**），落 `status_change` 事件 |
| `task.status=failed` 时收到 runtime_error / dev_failed | `return` 退出 | `continue` 不 dispatch fix（避免重复打扰 agent），等下次 ready 由 ready 分支复活 |
| `attempts >= 5` 触达上限 | `return` 退出 | 标 status=failed + finalize tracelog，但 `continue` 不退出，留给手动救场 |
| `task.status=stopped`（用户主动停止） | 退出 ✅ | 仍退出 ✅ |
| `marked_succeeded_once` 内存标志 | 用它跟踪首次 ready | 删除——每次 ready 直接读 DB.status 决策（更准、支持复活） |
| `marked_workdir_unchanged_failed` 新增 | / | task #100 防御只触发一次（避免反复改 status） |
| dev ready → succeeded 时 | 仅改 DB | 还落 `status_change` 事件，让前端 history REST 拉到时能感知 |

这一连串改动让「失败 ≠ 终结」：watcher 持续监听，用户/admin 手动喂日志救场后能自动复活到 succeeded，列表页和工作台状态自动同步。

**ChatPanel optimisticBusy 关闭逻辑过早（同日六补）**

实战 task #103 暴露：用户用「塞全部」把控制台日志塞进输入框发送后，按钮**没变成停止**——按钮闪都不闪。

[ChatPanel.tsx](../../frontend/src/views/Projects/detail/panels/ChatPanel.tsx) 的 `optimisticBusy` 关闭 useEffect 写得太宽，**从整个 events 末尾扫**找任意 `turn_complete` / `status_change(终结)` 就关闭。但任务历史里早就有这些事件（前几轮 LLM 干完 turn 时推过 turn_complete），所以 `setOptimisticBusy(true)` 刚开就被立刻关掉。

修复：增加 `busyStartIdxRef` 记下用户发消息那一刻的 `events.length` 作为基准，useEffect 只扫**这之后新增**的事件——历史里的 turn_complete 不再误触发关闭。

| 时机 | events.length | busyStartIdxRef | 行为 |
|---|---|---|---|
| 用户塞日志发送前 | N | -1 | busy=false，按钮=发送 |
| `addProjectTaskMessage` 成功 | N | **N** | busy=true，按钮=停止 |
| LLM 流出 text_delta（events 涨到 N+5） | N+5 | N | 扫 [N, N+5) 无 turn_complete → 按钮保持停止 |
| LLM `turn_complete` 来了 | N+8 | N | 扫到 → setBusy(false)，按钮变回发送 |

### 兼容路由

`/chat` 路径不变（[router/index.tsx:33](../../frontend/src/router/index.tsx#L33)），左侧菜单「AI 对话」无需改名。

## 关键路径速查

| 关心点 | 文件 |
|---|---|
| 会话表 entity | [backend/src/entity/conversation_session.rs](../../backend/src/entity/conversation_session.rs) |
| 消息表 entity | [backend/src/entity/conversation_message.rs](../../backend/src/entity/conversation_message.rs) |
| 后端 handlers | [backend/src/handlers/conversation.rs](../../backend/src/handlers/conversation.rs) |
| 路由注册 | [backend/src/main.rs:528-543](../../backend/src/main.rs#L528) |
| 自动建表 + 索引 | [backend/src/main.rs:78-87](../../backend/src/main.rs#L78) |
| 前端服务层 | [frontend/src/services/conversation.ts](../../frontend/src/services/conversation.ts) |
| 前端视图（/chat） | [frontend/src/views/Conversation/index.tsx](../../frontend/src/views/Conversation/index.tsx) |
| 项目工作台 ChatPanel | [frontend/src/views/Projects/detail/panels/ChatPanel.tsx](../../frontend/src/views/Projects/detail/panels/ChatPanel.tsx) |

## 验证

| 检查 | 状态 |
|---|---|
| `cargo check`（backend） | ✅ exit 0（仅 sqlx-postgres 0.7.4 已知 future-incompat 警告，已记 tech-debt） |
| `tsc -b`（frontend） | ✅ exit 0 |
| 端到端流式（手测） | ⏳ 待 `./shared/scripts/start-services.sh restart` 后确认 |

## 已知限制 / 后续可选

- **历史窗口固定 20 条**：handler 拉最近 20 条消息组 prompt，超长会话不能让模型记住更早内容（业界 ChatGPT 也只在前端拼一段窗口，差距是它做了 summary）。如要长窗口可后续加 `system` 摘要消息或滑动窗口压缩。
- **协议限定 OpenAI 兼容**：与原 `chat` handler 一致；Anthropic 协议路径要再写一段 SSE 解析（differ），尚未做。
- **中断后上游连接靠 reqwest 自然 drop**：客户端断开 → `tx.send` 失败 → spawn 任务 return → `reqwest::Response` 被 drop 释放连接。上游 LLM 服务可能还会继续生成几秒（直到检测到 client gone），算力上不是 0 浪费但比"等完整段"省很多。
- **未做软删除**：`DELETE` 是物理删除，删了就找不回来。如果以后有合规要求可加 `deleted_at`。
- **会话列表无分页**：用户一旦累积上千条会话列表会卡，需要时加 `?limit=&before=` 分页。
