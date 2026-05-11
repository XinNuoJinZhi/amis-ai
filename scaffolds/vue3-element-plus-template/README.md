# vue3-element-plus-template

amis-ai 反向飞轮 Web 端 Vue 3 底座（1.4 引入）。

## 技术栈

- **Vue 3** （Composition API + `<script setup>`）
- **TypeScript** 5.5+
- **Vite** 5.4+
- **Element Plus** 2.8+（搭 `@element-plus/icons-vue`）
- **Vue Router** 4（history 模式）
- 通过 `unplugin-auto-import` + `unplugin-vue-components` 实现 Element Plus 组件按需自动引入 + Vue/Vue-Router API 自动导入，Agent 写业务页面零样板

## 与 react-antd-vite-template 的差异

| 维度 | react-antd-vite | vue3-element-plus |
|---|---|---|
| 框架 | React 18 | Vue 3.5 |
| UI 库 | Ant Design 5 | Element Plus 2.x |
| 状态 | React Hooks | Vue Composition API |
| 路由 | react-router-dom v6 | vue-router 4 |
| 自动导入 | 无 | AutoImport + Components |

## 启动（容器内）

```bash
pnpm install
pnpm dev   # → http://0.0.0.0:5173
```

## iframe 预览 bridge

`src/main.ts` 内置 console / runtime-error / vite:error 桥（与其它 scaffold 一致协议），无需业务代码改动。
