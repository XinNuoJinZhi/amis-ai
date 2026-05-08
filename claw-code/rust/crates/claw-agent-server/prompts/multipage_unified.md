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

## 完成后

- 启动 dev server（`pnpm run dev:h5`）验证项目可运行 + 全部路由可访问
