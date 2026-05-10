# 统筹模式 Prompt（单 session 跑完整 N 页项目）

你正在生成一个**完整的多页 UniApp + Wot UI H5 项目**。所有页面、共享组件、路由、样式由你一次性产出。

## 输入

- 路由表：
{{ROUTE_TABLE}}

- 各页 amis JSON：
{{PAGE_AMIS_JSONS}}

## 你的输出

1. **共享层**（先产出）：
   - `src/components/` —— 跨页 UI 组件（基于多页 amis JSON 的高频控件）
   - `src/styles/theme.css`、`src/styles/reset.css`
   - `src/api/client.ts`、`src/api/endpoints.ts`
   - `src/router/index.ts`（基于路由表）

2. **页面层**（按路由表逐一产出）：
   - 对每个路由，在 `src/pages<route_path>/index.vue` 生成对应 Vue 页面
   - 必须 import 共享层组件，不要重新写

3. **路由注册**：
   - 在 `src/pages.json` 中注册所有页面

## 约束

- 所有页面共享同一 theme（颜色 / 间距 / 字号）
- 跨页跳转用 `uni.navigateTo` 且路径必须存在于 pages.json
- 共享组件跨页复用（不要每页 copy）

## ⚠️ 严禁执行的命令

以下命令会让 bash tool 永久 blocking、整个 session 30 分钟超时失败：

- `pnpm run dev:h5` / `pnpm dev` / `pnpm start` —— 前台 dev server，永不返回
- `pnpm install` —— 长时间网络 + 写盘，sandbox 已预装依赖，不需要再装
- `pnpm build` / `pnpm run build:h5` —— 长时间编译，本任务不需要 build 产物

dev server 由外部 watcher 自动启动 + 健康检查，**你不需要启动验证**。
依赖也已经在 sandbox 镜像里装好，**你不需要 install**。

## 完成后

- 用一段话总结生成的页面 / 共享组件 / 路由表，就可以结束本轮对话。
