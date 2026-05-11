---
name: stack-vue3
description: Vue 3 + Vite + Composition API 技术栈反向代码生成规则
kind: stack
platforms: [web]
tech_stacks: [vue3]
requires: [_common, platform-web]
conflicts: [stack-vue2, stack-react]
priority: 50
---

# Skill: stack-vue3

把 Amis JSON 翻译成 **Vue 3 + TypeScript + Vite** 项目代码。
UI 组件库由 `ui.*` skill 决定（常见配对：`ui-element-plus` / `ui-naive`）。

## 底座关键文件

```
src/
  main.ts              # createApp(App).use(router).mount('#app')
  App.vue              # 顶层 <RouterView />
  router/index.ts      # vue-router v4 + createWebHistory
  pages/               # 业务页面（.vue 单文件组件）
  components/          # 复用组件
  api/
    client.ts          # axios 实例 + 拦截器
  composables/         # Composition API 复用逻辑
  stores/              # Pinia（如启用）
  styles/global.css
vite.config.ts
tsconfig.json
package.json
```

## 依赖基线

```json
{
  "dependencies": {
    "vue": "^3.4.0",
    "vue-router": "^4.4.0",
    "pinia": "^2.2.0",
    "axios": "^1.7.0"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^5.1.0",
    "typescript": "^5.5.0",
    "vue-tsc": "^2.0.0",
    "vite": "^5.4.0"
  }
}
```

## Amis → Vue3 套路

- **page / form / crud** → SFC + `<script setup lang="ts">` 组合式 API
- 响应式状态：`ref` / `reactive`；计算派生：`computed`
- 表单：v-model + ui 库表单组件；复杂校验可接 `vee-validate` 或 UI 库自带
- API 调用：封装为 composable，例如 `useUsers()` 返回 `{ data, loading, error, refresh }`

## 强约束

- **必须**用 `<script setup>` 语法糖，不写 options API
- TypeScript 严格模式；props/emits 用 `defineProps<T>()` / `defineEmits<T>()` 类型标注
- 样式统一 `<style scoped>` 避免污染全局
- 全局注册组件只在 main.ts 做，业务组件就地 import

## 工作流程

1. 读目录识别是否有模板
2. 无模板：按"底座关键文件"创建骨架，pnpm install
3. 按 Amis JSON 创建 `src/pages/<name>.vue`
4. 新页面必须在 `src/router/index.ts` 注册
5. API 调用封装到 `src/api/` + `src/composables/`
6. dev_start 验证

## 进阶模式（references/）

按需阅读，触发场景如下：

| 文件 | 触发场景 |
|---|---|
| [composables-pattern.md](references/composables-pattern.md) | 跨组件复用逻辑（数据加载 / 表单管理 / 防抖） |
| [router-guards-pattern.md](references/router-guards-pattern.md) | 登录鉴权 / 嵌套布局 / 动态路由 / 多页面任务路由生成 |
| [pinia-store-pattern.md](references/pinia-store-pattern.md) | 跨组件共享状态（用户信息 / 全局配置 / 权限） |
| [script-setup-pitfalls.md](references/script-setup-pitfalls.md) | props 解构 / ref unwrap / template ref 等高频坑（写业务前先扫一眼） |
