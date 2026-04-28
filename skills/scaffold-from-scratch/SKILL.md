---
name: scaffold-from-scratch
description: 从零搭建项目骨架的通用工作流（无预置模板场景专用）
kind: common
priority: 40
---

# Skill: scaffold-from-scratch

当前任务**没有预置底座模板**（`template_name` 为 null / `__blank__`），工作目录是**空的**。
你需要从零搭建完整可运行项目，包括 `package.json`、构建配置、入口文件，再装依赖启动 dev server。

本 skill 只讲"从零搭建"的通用流程，**具体语法、版本号、组件引入**请结合当前任务的 `stack.*` 和 `ui.*` skill。

## 约束已解除，但请有节制

本任务下所有文件**均可创建/修改**（包括 `package.json`、`pnpm-lock.yaml`、`vite.config.ts` 等）。
不过请注意：
- 依赖变更优先用 `bash: pnpm add <pkg>` 而非直接手写 `package.json`（pnpm 会自动解析兼容版本）
- 构建配置修改前先 `read_file` 理解再动，避免把已调通的配置改坏
- 禁止在项目根跑 `rm -rf /*` 等破坏性命令

## 标准工作流程

### 第 1 步：确认工作目录干净

```bash
bash: ls -la /workspace
```

若有残留文件，先判断要不要保留；若要从头来，可以 `bash: rm -rf /workspace/*` 再开始。

### 第 2 步：创建 package.json

根据任务的 `tech_stacks` + `ui_libs` 写出 deps + devDeps + scripts。
**务必确认**：
- dependencies 的版本彼此兼容（antd 5 ↔ react 18 ↔ @types/react 18；element-plus 2 ↔ vue 3.4+）
- `scripts.dev` 字段**必填**（稍后 `dev_start` 工具会调用它）
- Node 版本要求用 `engines.node: ">=18"` 标明

### 第 3 步：创建构建配置

按 stack 写：
- React + Vite → `vite.config.ts` + `@vitejs/plugin-react`
- Vue3 + Vite → `vite.config.ts` + `@vitejs/plugin-vue`
- uni-app → `vite.config.ts` + `@dcloudio/vite-plugin-uni`
- React Native → `metro.config.js`
- Next.js → `next.config.js`

### 第 4 步：创建 tsconfig（如用 TS）

最小可用：`"target": "ES2020"` / `"moduleResolution": "bundler"` / `"jsx": "react-jsx"`（React）或 `"preserve"`（其他）。

### 第 5 步：创建入口 + 路由 + 首页

- React：`src/main.tsx` + `src/App.tsx` + `index.html`
- Vue3：`src/main.ts` + `src/App.vue` + `index.html`
- uni-app：`src/main.ts` + `src/App.vue` + `src/pages/index/index.vue` + `src/pages.json`

至少创建一个可跑通的空白首页，让 `pnpm run dev` 有东西可渲染。

### 第 6 步：装依赖

```bash
bash: pnpm install
```

观察输出确认没有 peer deps 报错；有就按提示补 `pnpm add <missing>`。

### 第 7 步：按 Amis JSON 生成业务页面

此时回到 `stack.*` / `ui.*` skill 的工作流程，创建实际的业务代码。

### 第 8 步：启动验证

```
dev_start
```

工具会根据 `package.json` 的 `scripts.dev` 拼命令。启动后读日志确认：
- 是否有端口冲突
- 是否有编译错误（未识别 JSX、找不到模块等）
- 浏览器访问是否 200

## 失败自修复

启动失败时（最多 5 次）：
1. 读 `/tmp/vite.log` 或等价日志
2. 定位具体错误（未安装的包 → `pnpm add`；语法错误 → `edit_file` 修复）
3. 再次 `dev_start`

## 常见坑

- `vite` + React：忘了 `@vitejs/plugin-react` → build 报 JSX 不识别
- `Vue3 + TS`：`.vue` 文件默认不认 TS → 加 `vue-tsc` 或 `vue-shim.d.ts`
- `uni-app`：忘了 `@dcloudio/vite-plugin-uni` → 报 `createSSRApp is not a function`
- 依赖版本打架：优先保 React 18、Vue 3.4+、Node 18/20 LTS 不动，其他往这几个核心版本兼容
