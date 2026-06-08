# 2026-06-08 · 多页面任务 WS 误判「确定性翻译器」修复（regression）

> 1.6 dev 期。用户报告：多页面任务详情的 Chat 面板显示「本任务由确定性翻译器生成」，
> 但该任务实际调了 LLM。根因是一条 WS 判据张冠李戴，是 `fd875f0` 引入翻译器时的 regression。

## 现象

打开多页面任务详情（task #378，2 页 `unified` 策略），Chat 面板显示：

> 🪄 本任务由确定性翻译器生成
> Amis JSON 已被一比一翻译成 Vue 代码，**未调用 LLM**。所以这里没有对话流——这是设计意图，不是 bug。

但 #378 **实际调用了 LLM**：`page_count=2`、`actual_cost_tokens` 累计 23039、走了 `multipage_scheduler` + multipage epilog 写 RAG。用户质疑：多页面任务交互应与单页面基本一致，为何被显示成翻译器、且看不到对话流。

## 根因

WS 转发 handler [project_events.rs](../../backend/src/handlers/project_events.rs) `handle_ws` 用 `claw_session_id == None` 作为「翻译器任务」的**唯一判据**：

```rust
let claw_session = match task.claw_session_id {
    Some(ref s) => s.clone(),
    None => { handle_ws_translator_idle(socket, task_id).await; return; }  // ← 一刀切
};
```

但**多页面任务的主 task 天生 `claw_session_id == None`**——真正的 LLM 会话在各子页面的子 session 上，由 [multipage_session_watcher](../../backend/src/services/multipage_session_watcher.rs) 订阅并把每条事件落库到主 task（DB 实测 #378 已落 270 条 `text_delta` + 40 对 `tool_use`/`tool_result` + `user_message`）。

**regression 引入点**：`fd875f0`（2026-04-25 引入确定性翻译器）把该 `None` 分支从 `send_error("Claw session not initialized")` 改成了 `handle_ws_translator_idle`，只想着翻译器、忘了多页面主任务的 session 也一直为 None。前端 [ChatPanel](../../frontend/src/views/Projects/detail/panels/ChatPanel.tsx) 收到 `translator_idle` 事件后把多页面任务渲染成翻译器空文案，**短路了本已落库、能渲染成对话流的事件**。

## 修复

### P0 · 消除误判（核心）

1. **后端三态分流**：抽纯函数 `resolve_ws_mode(claw_session_id, page_count) -> WsMode`：
   - `Some(非空)` → `Live`（连 claw-agent，单页 IDE 路径，行为不变）
   - `None && page_count > 1` → `MultipageIdle`（多页面主任务，**绝不发** `translator_idle`）
   - `None && 单页` → `TranslatorIdle`（真翻译器任务，保留原行为）
   - 配 cargo 单测覆盖三分支（含 regression 防线 `(None, 2) → MultipageIdle`）
2. **前端防御层**：ChatPanel 的 `translator_idle` 短路收紧为
   `events.some(translator_idle) && blocks.length === 0`——只要 events 里有真对话块就渲染对话流，即便后端漏判也兜底。

### P1 · 实时对齐单页（broadcast）

新增 `AppState.multipage_event_tx: broadcast::Sender<(i32, String)>`：
- watcher 落库每条子页面事件后 `send((task_id, json))`（无订阅者时忽略 Err）
- `handle_ws_multipage_idle` 订阅 + 按 `task_id` 过滤转发给前端，`Lagged` 时跳过（history 兜底）

进行中的多页面任务由此能像单页一样**实时滚动** LLM 对话；已完成任务靠 mount 时 history 回放。

## 验证

- ✅ cargo test `ws_mode_tests` 3 分支全绿（`live` / `multipage_idle` / `translator_idle`）
- ✅ cargo check P0+P1 编译干净；4 服务重启全 UP
- ✅ 后端实测：`ws://…/tasks/378/events` 首条 = `multipage_idle`（不再 `translator_idle`）
- ✅ DB：#378 history 含 270 `text_delta` + 40 `tool_use`/`tool_result` + `user_message` → ChatPanel 渲染为完整对话流
- ✅ smoke-test：PASS=77 FAIL=0 全部通过（端到端回归，未破坏单页 / 翻译器 / 多页其他路径）

## 影响文件

| 文件 | 改动 |
|---|---|
| backend/src/handlers/project_events.rs | +133：`resolve_ws_mode` 纯函数 + 单测 + `handle_ws_multipage_idle`（broadcast 订阅转发） |
| backend/src/main.rs | +9：`multipage_event_tx` broadcast 字段 + 初始化 |
| backend/src/services/multipage_session_watcher.rs | +4：落库后 broadcast send |
| frontend/src/views/Projects/detail/panels/ChatPanel.tsx | +8：`blocks.length === 0` 防御层 |

## 教训

`claw_session_id == None` 不是「翻译器任务」的充分条件——它至少有**两个来源**：翻译器 fully_supported、多页面主任务。任何"用某字段为空当作某路径标志"的判据，都要先问：**还有谁也会让这个字段为空？** 多页面路径的透传/判据坑已第三次出现（参见 1.5 W4 多页 `fetch_rag` 传空 amis），值得专门警惕。
