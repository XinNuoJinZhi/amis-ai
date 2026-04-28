---
name: stack-vue2
description: Vue 2.7 + Options API + Vue CLI / Vite 技术栈反向代码生成规则
kind: stack
platforms: [web]
tech_stacks: [vue2]
requires: [_common, platform-web]
conflicts: [stack-vue3]
priority: 50
---

# Skill: stack-vue2

把 Amis JSON 翻译成 **Vue 2.7** 项目代码（遗留系统维护场景常见）。
UI 组件库由 `ui.*` skill 决定（常见配对：`ui-element-ui`）。

## 底座关键文件

```
src/
  main.js / main.ts    # new Vue({router, render: h => h(App)}).$mount('#app')
  App.vue
  router/index.js      # vue-router v3
  pages/
  components/
  api/
  store/               # Vuex（可选）
  styles/
```

## 依赖基线

```json
{
  "dependencies": {
    "vue": "^2.7.16",
    "vue-router": "^3.6.5",
    "vuex": "^3.6.2",
    "axios": "^1.7.0"
  },
  "devDependencies": {
    "@vitejs/plugin-vue2": "^2.3.0",
    "vite": "^5.4.0"
  }
}
```

## Amis → Vue2 套路

- **page / form / crud** → Options API（data / computed / methods / watch / lifecycle）
- 表单：v-model + Element UI 组件 + `async-validator`
- API：封装到 `src/api/`，在 `methods` 里调

## 强约束

- 必须 options API（Vue 2.7 虽支持 composition，但老项目习惯保留 options 风格）
- 不要混用 `<script setup>`（Vue 2 不支持）
- vue-router 用 hash 模式（避免后端配合 history）

## 工作流程

1. 识别是否有模板
2. 无模板：创建骨架 + `pnpm install`
3. 按 Amis JSON 创建 `.vue` 页面
4. 注册路由（`router/index.js`）
5. API 封装 + dev_start
