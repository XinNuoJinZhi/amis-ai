# 常见错误与修复手册

本文件沉淀 Agent 真实生成项目时碰到的错误模式。每条都是"见过的病 + 治过的方"，不是臆想的。

## 📌 冷启动基础错误（建议首先检查）

### E001: `Cannot find module '@dcloudio/uni-components/package.json'`
**现象**：`pnpm run dev:h5` 时 Vite 启动但 easycom 报错。

**根因**：UniApp 3.0-alpha 版本缺依赖声明。

**修复**：在 `package.json` dependencies 加：
```json
"@dcloudio/uni-components": "3.0.0-alpha-5000720260416001"
```
然后 `pnpm install`。

---

### E002: `wot-design-uni` 组件在模板里未渲染
**现象**：`<wd-button>` 展示成纯文本或空白。

**根因**：`pages.json` 的 easycom 配置被误删，或路径写错。

**修复**：确认 `pages.json` 顶层有：
```json
"easycom": {
  "autoscan": true,
  "custom": {
    "^wd-(.*)": "wot-design-uni/components/wd-$1/wd-$1.vue"
  }
}
```

---

### E003: `Uncaught TypeError: Cannot read properties of undefined (reading '...')`
**现象**：页面加载时 JS 报错，数据没展示。

**根因**：`ref<T[]>([])` 初始值不对，或者没等接口返回就读取。

**修复**：
```ts
const list = ref<User[]>([])   // ✅ 明确数组
const detail = ref<User | null>(null)  // ✅ 用 null，模板里 v-if 判空
```
模板里：
```vue
<view v-if="detail">{{ detail.name }}</view>
```

---

### E004: vite 报 `[vite] [plugin:vite-plugin-uni] xxx.vue is empty`
**现象**：刚创建的 .vue 文件空白导致编译失败。

**修复**：至少给一个最小模板：
```vue
<template>
  <view></view>
</template>
<script setup lang="ts"></script>
```

---

### E005: Wot UI 表单校验不触发
**现象**：`formRef.validate()` 直接 resolve，没有任何校验报错。

**根因**：`<wd-input>` 外没有包 `<wd-form>`，或 `prop` 属性没填。

**修复**：
```vue
<wd-form ref="formRef" :model="formData" :rules="rules">
  <wd-input prop="name" v-model="formData.name" />  <!-- prop 必填 -->
</wd-form>
```

---

### E006: axios 请求 404（明明后端有这个接口）
**现象**：`/api/users` 请求去了 `http://localhost:5173/api/users`，不是真后端。

**根因**：Vite dev 没配 proxy，或 `VITE_API_BASE` 环境变量没设。

**修复**：在 `vite.config.ts` 里加 proxy：
```ts
server: {
  proxy: {
    '/api': { target: 'http://localhost:8080', changeOrigin: true }
  }
}
```

---

## 🔄 调试建议

当 `pnpm run dev:h5` 启动失败时：

1. **先看关键日志**：`➜ Local: http://localhost:5173/` 这一行出现 = Vite 本身没挂
2. **再看 Compiling 后的报错**：一般是 easycom 或模块缺失
3. **最后看浏览器 console**：运行时错误都在这里

## 📝 扩展

本文件**冷启动内容较少**，后续每次任务跑失败→修复成功的经验，应由飞轮自动沉淀到此（新增条目）。

**添加新条目的格式**：
```markdown
### EXXX: {简短错误描述}
**现象**：...
**根因**：...
**修复**：具体代码 diff
```
