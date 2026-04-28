---
name: platform-web
description: Web 端（浏览器）目标平台通用规则 —— 路由、构建、性能、兼容性
kind: platform
platforms: [web]
priority: 20
---

# Skill: platform-web

当前任务目标平台是 **Web 浏览器**（PC / 移动端 H5 都算）。本 skill 定义与具体 tech_stack 无关、但所有 Web 端都要遵守的通用约束。

与 `platform-mobile`（小程序/原生 App）互斥：Web 端路由用 URL hash 或 history，不使用 `pages.json`。

## 构建与启动

- 构建工具通常是 **Vite**（React / Vue3 默认），部分老 Vue2 项目用 webpack
- dev server 默认监听 `0.0.0.0:5173`，host 设成 `0.0.0.0` 便于沙箱内外访问
- **脚本约定**：`package.json` 必须有 `"dev": "vite"` 或等价命令，`dev_start` 工具会读这个脚本
- 生产打包：`pnpm build` 输出到 `dist/`

## 路由

- SPA 路由用 `react-router` / `vue-router` / `@solidjs/router` 等（按 stack 决定，见对应 stack skill）
- 路由懒加载：业务页面统一 `() => import('./pages/Foo')`
- 404 页面必须显式配置，别让用户看到白屏

## 兼容性

- 目标浏览器：Chrome 90+ / Safari 15+ / Firefox 88+（不支持 IE）
- 移动端 H5 额外注意：
  - `<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">`
  - 1px 边框、iOS safe-area（`env(safe-area-inset-*)`）
  - 点击态延迟可用 `touchstart` 或 CSS `:active`

## 性能要点

- 首屏代码分割：按路由拆 chunk
- 图片懒加载（`loading="lazy"` 或 IntersectionObserver）
- 第三方库大包（moment / lodash 全量）换轻量替代（dayjs / lodash-es 按需）
- 生产构建必启 gzip / brotli

## 错误处理

- 全局 ErrorBoundary（React）/ `errorCaptured`（Vue）兜底运行时异常
- 所有异步请求带 try/catch 或 `.catch`
- 对用户展示的错误文案要**友好且可操作**，不是堆栈直出

## API 调用

- 统一走封装后的 HTTP 客户端（`src/api/client.ts`，axios/ofetch/fetch）
- 请求拦截器：注入 token、统一 baseURL
- 响应拦截器：统一错误码处理、401 自动跳登录

## 与其他 skill 协作

- tech_stack 具体怎么写 → 对应 `stack.*` skill
- UI 组件怎么用 → 对应 `ui.*` skill
- 从零搭建时的流程 → `scaffold-from-scratch` skill
