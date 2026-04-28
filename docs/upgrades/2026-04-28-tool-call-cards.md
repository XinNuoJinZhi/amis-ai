# 2026-04-28 · 对话区工具调用卡片化

> 把云端 IDE 任务对话区里 `tool_use` / `tool_result` 事件的渲染从「一坨原始 JSON `<pre>`」升级成「紧凑工具卡片」，参考 Claude Code VSCode 插件、ccweb、vibe-kanban、happy 等社区方案的展示模式。

## 背景与动机

云端 IDE 任务详情页的 `ChatPanel` 此前对 `tool_use` / `tool_result` 事件采用兜底处理：把整个 `input` / `output` 调用 `JSON.stringify(_, null, 2)` 塞进 `<pre>` —— 用户看到的就是连续若干屏的 JSON 文本，体验糟糕（典型场景：一次任务里 `read_file` / `write_file` 调用十多次，每个都铺一大块代码字符串）。

社区开源方案（Claude Code VSCode 插件 / ccweb / vibe-kanban / happy）通用做法：

- **每个工具调用一张紧凑卡片**：图标 + 工具名 + 一行摘要 + 状态徽标 + 折叠箭头
- **input/output 配对**：同一次工具调用的入参和出参合并到同一张卡片里，不再一上一下两个独立块
- **状态可视化**：运行中（spinner / 蓝边）/ 成功（绿对勾）/ 失败（红 X + 红条）
- **详情按需展开**：默认折叠，点击展开看完整 JSON

## 范围

仅前端，不改协议、不改后端。Rust 侧 `TaskEvent::ToolUse` / `TaskEvent::ToolResult` 已经把 `name + input + output + is_error` 都推到事件流里，材料够。

涉及文件：

- 新建 `frontend/src/views/Projects/detail/components/ToolCallCard.tsx`
- 改造 `frontend/src/views/Projects/detail/panels/ChatPanel.tsx` 里的 `eventsToBlocks` + `BlockView`

## 设计要点

### 1. 配对算法（栈式按工具名匹配）

后端 `TaskEvent::ToolResult` 只带 `name + output + is_error`，**没带 `tool_use_id`**（见 [tool_executor.rs:72](../../claw-code/rust/crates/claw-agent-server/src/tool_executor.rs#L72)）。所以前端按"栈式就近配对"：

- 顺序遍历事件
- 见到 `tool_use(id, name, input)` → push 一个新 `ToolBlock { id, name, input, status: 'running' }`
- 见到 `tool_result(name, output, is_error)` → 倒着找最近一个同名且未关闭的 `ToolBlock`，回填 `output / is_error / status`
- 找不到（极端：协议错位）→ 兜底新建一个 status = 'orphan' 的卡片

### 2. 卡片结构

```
┌──────────────────────────────────────────────────────────┐
│ [icon] read_file · src/pages/index/index.vue   ✓  [v]    │  ← 单行 28px
├──────────────────────────────────────────────────────────┤
│ {input JSON}                                              │  ← 默认折叠
│ ─────────                                                 │
│ {output text/JSON}                                        │
└──────────────────────────────────────────────────────────┘
```

颜色语义：

| 状态     | 左边框    | 摘要行 icon              |
| -------- | --------- | ------------------------ |
| running  | 蓝色脉冲  | spinner                  |
| success  | 透明      | 绿色对勾 `CheckOutlined` |
| error    | 红色实线  | 红色 X `CloseOutlined`   |
| orphan   | 灰色虚线  | 问号                     |

### 3. 工具映射表（图标 + 摘要器）

| tool_name      | icon                  | 摘要规则（取自 input 字段）                              |
| -------------- | --------------------- | -------------------------------------------------------- |
| `read_file`    | FileTextOutlined      | `path`                                                   |
| `write_file`   | EditOutlined          | `path` ·（如有）`${content.length} chars`                |
| `edit_file`    | FormOutlined          | `path`                                                   |
| `glob_search`  | FolderOpenOutlined    | `pattern`                                                |
| `grep_search`  | SearchOutlined        | `pattern` ·（如有）`in ${path}`                          |
| `bash`         | CodeOutlined          | `$ ${command.slice(0, 100)}`                             |
| `dev_start`    | ThunderboltOutlined   | `启动 dev server`（无 input）                            |
| `Skill`        | BulbOutlined          | `加载 ${skill_name}` 或 `path`                           |
| 兜底          | ToolOutlined          | `JSON.stringify(input).slice(0, 80)`                     |

### 4. 折叠默认值

- 默认收起 input + output 详情 → 减少 80% 屏幕占用
- 错误（is_error = true）→ 默认展开 output（用户多半要看错误信息）
- 列表数量 > 20 时（极少见）暂不做虚拟列表，先观察

## 不在范围（后续迭代）

- ❌ `write_file` / `edit_file` 的 diff 高亮渲染（先靠折叠 + monospace 读 raw）
- ❌ `bash` stdout / stderr 分色（统一显成 monospace 文本）
- ❌ markdown 渲染 assistant 文本（独立任务，跟工具卡片解耦）
- ❌ 语法高亮（不引入 prism / highlight.js，避免包体膨胀）

## 验证

- 类型检查：`cd frontend && pnpm tsc --noEmit`（不启 dev server，只验类型）
- 视觉验证：留给用户在云端 IDE 跑一次实际任务确认（auto mode 下不主动起服务）

## 回滚策略

整个改动只动了一个组件文件 + ChatPanel 局部，可单 commit 回滚。`tool_use` / `tool_result` 事件协议未改，旧版前端能继续工作。
