# 国际化（i18n）与日志输出规范

## 一、国际化

### 何时必须走 i18n

凡是**用户可见的中文文案**都走 i18n token，**禁止硬编码字符串**。这条无视技术栈，所有项目通用。

涵盖范围：
- 按钮 label、标题、placeholder、message 提示
- 表单 rules 里的 `message` 文案
- 错误提示、空状态文案
- tabbar / 菜单文案

**不涵盖**：
- 给 Agent 看的 console.log / debug log（程序员视角，固定中文 OK）
- 注释（注释一律中文，不需要 i18n）
- 测试用的 mock 数据

### 翻译流程（默认双语 zh-CN / en-US）

#### 1. 在 `src/locales/` 下加 token

```ts
// src/locales/zh-CN.ts
export default {
  user: {
    login: '登录',
    register: '注册',
    placeholder: {
      phone: '请输入手机号',
    },
  },
}

// src/locales/en-US.ts
export default {
  user: {
    login: 'Login',
    register: 'Register',
    placeholder: {
      phone: 'Please enter phone number',
    },
  },
}
```

#### 2. 组件里引用

```vue
<!-- Vue + vue-i18n -->
<template>
  <wd-button>{{ t('user.login') }}</wd-button>
  <wd-input :placeholder="t('user.placeholder.phone')" />
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
</script>
```

```tsx
// React + react-i18next
import { useTranslation } from 'react-i18next'

function LoginButton() {
  const { t } = useTranslation()
  return <button>{t('user.login')}</button>
}
```

### Amis JSON → token 的翻译

Amis JSON 里的 `label`、`placeholder` 等字段是中文。生成代码时：
1. 提取所有中文字符串，按业务模块归类
2. 为每条加 token（命名约定：`{模块}.{用途}.{描述}`，如 `user.placeholder.phone`）
3. 同时写 zh-CN 和 en-US 两份（en 用合理的英文翻译，不会就用拼音占位 + TODO 注释）
4. 组件里用 `t(...)` 引用

### 命名约定

- 全小写 + 点号分级
- 不超过 4 级（user.placeholder.phone 是 3 级，可以；user.login.form.placeholder.phone 太深）
- 不允许中文 key（key 是 ascii）

## 二、日志输出

### 日志分级

| 级别 | 用途 | 例子 |
|---|---|---|
| `console.debug` | 开发期辅助调试 | 打印中间计算结果 |
| `console.info` | 正常业务节点 | "用户登录成功" |
| `console.warn` | 不影响主流程的异常 | "降级使用本地缓存" |
| `console.error` | 真错误，必须上报 | "API 调用失败：500" |

**不允许**：
- 用 `console.log`（语义不明，禁止）
- 在生产代码里留 `console.debug`（构建时应该被剥掉，但还是别留）

### 日志格式约定

```ts
console.info('[模块名] 业务节点描述', { 关键上下文 })
console.error('[模块名] 错误描述', err)
```

例子：
```ts
console.info('[user] 登录成功', { userId: 123, role: 'admin' })
console.error('[order] 提交订单失败', err)
```

为什么要带 `[模块名]` 前缀：
- 浏览器控制台一杂，靠前缀快速过滤
- amis-ai 的 IDE 浏览器控制台面板会按前缀分组

### 给 Agent 的特别提醒

amis-ai 的 IDE 把 iframe 里的 `console.*` 通过 `postMessage` 转发给父窗口的 ConsolePanel。当用户从 IDE 把日志塞进对话时：

```
<!-- amis-ai:inject-source=browser-console -->
​```log-console
[error] [order] 提交订单失败 TypeError: Cannot read property...
​```
```

**遇到这种代码块**：
1. 第一时间从 stack trace 定位文件+行号
2. `Read` 那个文件，看出错代码
3. `Edit` 修复
4. 明确告知用户"已修复 X，请刷新预览"

终端日志同理（`<!-- amis-ai:inject-source=terminal -->` + `​```log-terminal`）。

## 不允许的反模式

```ts
// ❌ 硬编码中文文案
<button>登录</button>  // 必须走 t('user.login')

// ❌ 用 console.log
console.log('user logged in')  // 用 console.info 并加前缀

// ❌ 不带上下文的报错
console.error('error')  // 应包含 [模块名] + 错误对象

// ❌ token key 用中文或大写
t('用户.登录')  // 必须 user.login
```
