# 骨架先行 Prompt（R1 第 1 阶段）

你正在为一个**多页面 UniApp + Wot UI H5 项目**生成「共享骨架」。

## 你的输出范围（仅这些）

1. `src/components/` —— 跨页通用 UI 组件
   - 至少包含：AppHeader.vue / AppFooter.vue / FormWrapper.vue / DataTable.vue
   - 如果用户的多页 amis JSON 高频出现某些控件（如时间选择、上传），加对应 wrapper

2. `src/styles/` —— 全局样式 / 主题
   - `theme.css`：色值变量、间距 spacing tokens
   - `reset.css`：全局 reset
   - `vars.scss`（如果用 SCSS）：变量

3. `src/api/` —— 共享 API 客户端
   - `client.ts`：axios / uni.request 封装
   - `endpoints.ts`：所有 amis JSON 中出现的 API URL 抽成常量

4. `src/router/index.ts` 或 `src/pages.json` —— 路由表 stub
   - 把所有页面占位条目都列出来（基于下方提供的路由清单）
   - 每个页面只占位（指向后续会生成的 .vue 文件）

5. `src/store/index.ts`（如果项目用 Pinia / Vuex） —— 全局状态 stub
   - 提供 user / app 全局 store 占位

## 你**不要**做的

- ❌ 不要生成具体页面 .vue 文件（那是第 2 阶段的事）
- ❌ 不要在路由里写具体业务逻辑

## 输入

下面是用户提供的多页输入摘要（每页只给 type 和 title 概览，不给完整 amis JSON）：

{{PAGE_LIST_SUMMARY}}

路由表（已确定）：

{{ROUTE_TABLE}}
