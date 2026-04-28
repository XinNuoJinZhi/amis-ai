---
name: stack-uniapp
description: uni-app（Vue 3） 技术栈反向代码生成规则 —— 支持 H5 / 微信小程序 / App
kind: stack
platforms: [mobile]
tech_stacks: [uniapp]
requires: [_common, platform-mobile]
priority: 50
---

# Skill: stack-uniapp

把 Amis JSON 翻译成 **uni-app（Vue 3）** 项目代码。输出可跨 H5 / 微信小程序 / App 多端，**H5 是默认目标**。
UI 组件库由 `ui.*` skill 决定（常见配对：`ui-wot` / `ui-uview`）。

## 底座关键文件

```
src/
  main.ts              # createSSRApp(App) + use(pinia)
  App.vue
  pages.json           # ⚠️ 所有页面路径必须在此显式注册
  manifest.json        # 应用配置（weixin / h5 / app 差异化）
  pages/
    index/index.vue    # 首页
    <name>/<name>.vue  # 业务页面
  components/          # 复用组件（easycom 自动导入规则）
  api/
    client.ts          # uni.request 封装或 axios
  composables/
  stores/              # pinia
  static/              # 静态资源（uni-app 约定）
vite.config.ts
```

## 依赖基线

```json
{
  "dependencies": {
    "vue": "^3.4.0",
    "@dcloudio/uni-app": "3.0.0-4050420240924001",
    "pinia": "^2.2.0"
  },
  "devDependencies": {
    "@dcloudio/uni-cli-shared": "3.0.0-4050420240924001",
    "@dcloudio/vite-plugin-uni": "3.0.0-4050420240924001",
    "typescript": "^5.5.0",
    "vite": "^5.4.0"
  },
  "scripts": {
    "dev:h5": "uni --port 5173",
    "dev:mp-weixin": "uni -p mp-weixin",
    "build:h5": "uni build"
  }
}
```

## Amis → uni-app 套路

- **page** → `src/pages/<name>/<name>.vue` + 注册到 `pages.json`
- 表单、列表、详情：按 Amis schema 映射，使用 UI 库组件（wd-* / u-*）
- 导航：`uni.navigateTo({url: '/pages/foo/foo'})`
- API：封装 `src/api/client.ts` 用 `uni.request` 或 axios 适配器

## ⚠️ 高频陷阱：`uni` 是全局变量，**永远不要 import**

uni-app 把 `uni.*` 一整套 API（`uni.request` / `uni.navigateTo` / `uni.showToast` 等）作为
**全局对象**运行时注入，`@dcloudio/uni-app` 包只导出**生命周期组合函数**（`onLoad` / `onShow` 等），
**根本没有** `uni` 这个导出名。如果你写了 `import { uni } from '@dcloudio/uni-app'`，
浏览器会抛：

```
SyntaxError: The requested module '.../uni-app.es.js' does not provide an export named 'uni'
```

这是反向飞轮里非常高频的**"编辑完 dev 启动成功但页面打不开"**症状。

### ❌ 错误写法

```typescript
import { uni } from '@dcloudio/uni-app'   // ← 运行时报错！
uni.request({...})
```

### ✅ 正确写法

```typescript
// 1) 不要 import，直接用全局 uni（推荐）
uni.request({ url: '/api/login', method: 'POST', data: { phone, password } })
uni.navigateTo({ url: '/pages/home/home' })
uni.showToast({ title: '登录成功', icon: 'success' })

// 2) 如果 TypeScript 报 "Cannot find name 'uni'"，
//    在使用的 .ts 文件顶部加一行类型引用（或在 tsconfig.json 的 types 里加 "@dcloudio/types"）：
/// <reference types="@dcloudio/types" />

// 3) 真正需要从 @dcloudio/uni-app import 的，只有生命周期：
import { onLoad, onShow, onPullDownRefresh } from '@dcloudio/uni-app'
```

### 什么时候可以 `import`

- **生命周期**：`onLoad` / `onShow` / `onPullDownRefresh` / `onReachBottom` 等 → 从 `@dcloudio/uni-app` 按需 import
- **Vue 3 API**：`ref` / `reactive` / `computed` 等 → 从 `vue` import
- **其他 `uni.xxx`**：**全部直接用，不 import**

## 强约束

1. **新建页面必须同步 `pages.json`** —— 漏写是 #1 高频失败原因
2. 单位用 `rpx`（750 等分）
3. 不在组件里直接 `uni.request`，统一走 `src/api/`
4. 生命周期 `onLoad` / `onShow` 等用 `@dcloudio/uni-app` 提供的 composable
5. **禁止 `import { uni } from '@dcloudio/uni-app'`**（见上方"高频陷阱"）
6. **🔥 任何 `import ... from '@/...'` 之前必须先 `bash: ls -la /workspace/src/<目标目录>` 确认文件存在**：
   - 2026-04-25 task #92 实锤：LLM 凭通用 Vue 项目习惯写 `import { request } from '@/api/client'`，
     但种子里那时叫 `http.ts` 不叫 `client.ts`，vite import-analysis 直接 `Cannot find module`，
     dev server 起来但页面空白。
   - 当前种子已经在 `src/api/` 下同时提供了 `client.ts` / `http.ts` / `index.ts` 三种入口（兼容
     LLM 习惯的所有写法），但仍然要养成「**先 ls，再 import**」的纪律——其他目录（如
     `src/composables/`、`src/utils/`、`src/stores/`）没做同样兼容兜底。
   - 反例：`import foo from '@/utils/format'` → 没看就写 → vite 解析失败
   - 正例：先 `bash: ls /workspace/src/utils/` 看到 `formatDate.ts` → 再写 `import { formatDate } from '@/utils/formatDate'`
7. **`@/` 路径别名映射**：`@/*` = `src/*`（见 `tsconfig.json paths`）。**绝对**别用 `~/` 或 `@@/` 等其他别名。

## 工作流程

1. 读 `pages.json` 和 `package.json` 理解当前结构
2. 按 Amis JSON 创建页面文件
3. **立即** `edit_file` 更新 `pages.json` 的 `pages` 数组
4. API 封装到 `src/api/<domain>.ts`
5. `dev_start` 触发 `pnpm run dev:h5`（或等价命令）
