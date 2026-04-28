# 云端 IDE 架构（2026-04 新增）

`/projects/:id` 是类 VSCode 的**六合一工作区**，帮用户看穿沙箱黑盒、手动介入调试。旧版以 `/projects/:id/legacy` 兜底。

## 工作区布局

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

六大面板：
1. **FileTree**：沙箱工作目录树，忽略 `node_modules/.git/dist`
2. **Editor (Monaco)**：多 Tab 编辑 + mtime 冲突检测
3. **Preview**：iframe 加载沙箱 Vite dev server（经 Nginx `/preview/{task_id}/` 代理）
4. **Terminal**：xterm.js + WebSocket（bollard exec TTY）
5. **Console**：从 iframe postMessage 接收的业务日志
6. **ChatPanel (drawer)**：向 Agent 提问 / 塞入调试证据

## 后端 IDE 路由

所有路由均 **JWT + 任务归属校验**，prefix `/api/projects/tasks/:id/ide/`：

| Method | 路径 | 实现 |
|---|---|---|
| GET  | `fs/tree?depth=N` | 文件树（忽略 node_modules/.git/dist/…） |
| GET  | `fs/file?path=X`  | 读文件（>512KB 标 `truncated`） |
| PUT  | `fs/file`         | 写文件，body `{path,content,base_mtime}`；base_mtime 冲突返回 **409** |
| DEL  | `fs/file?path=X`  | 删除文件/目录 |
| POST | `fs/mkdir`        | 创建目录 |
| WS   | `terminal?token=JWT&cols=N&rows=N` | xterm TTY（bollard exec + TTY） |

实现：[../../backend/src/handlers/project_ide.rs](../../backend/src/handlers/project_ide.rs)

## Sandbox 直连协议（仅 backend 调用）

### 文件系统 ([../../sandbox/src/fs_handlers.rs](../../sandbox/src/fs_handlers.rs))

- 所有 path **规范化 + 越权校验**（必须落在 `/workspace` 内）
- 读限 512KB，写限 2MB
- `/api/sandbox/{task_id}/fs/tree` / `fs/read` / `fs/write` / `fs/delete` / `fs/mkdir`

### 终端 ([../../sandbox/src/terminal_handlers.rs](../../sandbox/src/terminal_handlers.rs))

WebSocket 帧协议：
- 客户端 → 服务端：`{t:"in",d:"..."}` / `{t:"resize",cols,rows}`
- 服务端 → 客户端：`{t:"out",d:"..."}` / `{t:"exit",code}`
- stdin 限速 2KB/s；空闲 15 分钟自动 close

## 浏览器控制台注入

[../../scaffolds/uniapp-wot-h5-template/src/main.ts](../../scaffolds/uniapp-wot-h5-template/src/main.ts) 在 `window.parent !== window` 分支里劫持了 `console.log/info/warn/error/debug`，通过 `postMessage({type:'amis-ai/console',...})` 发给父窗口（IDE 的 `ConsolePanel`）。

安全性：循环引用 / BigInt / Error / Function 都通过 `safeStringify` 处理。

## 「塞入对话」约定

当用户点 ConsolePanel / TerminalPanel 的「塞入对话」按钮，前端调 `addProjectTaskMessage` 发一条带特殊 markdown fence 的消息：

```markdown
<!-- amis-ai:inject-source=browser-console -->
用户从浏览器控制台塞入以下日志，请协助分析：

​```log-console
[error] TypeError: Cannot read property 'foo' of undefined
    at src/pages/index/index.vue:42
​```
```

终端版本用 `log-terminal` fence。[../../claw-code/rust/crates/claw-agent-server/src/skills.rs](../../claw-code/rust/crates/claw-agent-server/src/skills.rs) 里的 `USER_INPUT_FENCE_GUIDANCE` 常量会被附加到所有 system_prompt 末尾，告诉 Agent 碰到这类代码块要当诊断证据分析并直接修代码。

## 关键前端文件

| 关心点 | 文件 |
|---|---|
| 工作区装配 | [../../frontend/src/views/Projects/detail/index.tsx](../../frontend/src/views/Projects/detail/index.tsx) |
| 六大面板 | [../../frontend/src/views/Projects/detail/panels/](../../frontend/src/views/Projects/detail/panels/) |
| 文件树/事件/控制台钩子 | [../../frontend/src/views/Projects/detail/hooks/](../../frontend/src/views/Projects/detail/hooks/) |
| IDE 工作区状态 | [../../frontend/src/stores/ide.ts](../../frontend/src/stores/ide.ts) |
| IDE REST/WS 客户端 | [../../frontend/src/services/ide.ts](../../frontend/src/services/ide.ts) |
| Legacy 老版本 | [../../frontend/src/views/Projects/Detail.tsx](../../frontend/src/views/Projects/Detail.tsx) |
