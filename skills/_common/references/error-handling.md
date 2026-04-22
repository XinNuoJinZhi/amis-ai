# 错误处理统一范式

无论目标技术栈是什么，错误处理都按下面这套分层来做。**不允许 silent catch**，不允许 `catch(e) {}` 这种吞错。

## 三层错误模型

| 层 | 来源 | 示例 | 处理位置 |
|---|---|---|---|
| **网络层** | HTTP 响应 4xx/5xx、超时、断网 | `Request failed with status 500` | axios 拦截器 / fetch 包装层 |
| **业务层** | 后端返回 200 但 `code !== 0` | `{code: 1001, msg: "用户名已存在"}` | API 模块层（`src/api/*`） |
| **校验层** | 表单校验失败、字段必填、格式错误 | `请输入手机号` | 组件层（form validation） |

## 网络层（统一在拦截器处理）

```ts
// src/utils/request.ts（脚手架已预置，按当前栈调整 import 即可）
import axios from 'axios'

const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE,
  timeout: 10000,
})

request.interceptors.response.use(
  (resp) => resp,
  (err) => {
    if (err.code === 'ECONNABORTED') {
      // 超时
      showToast('请求超时，请检查网络')
    } else if (err.response?.status >= 500) {
      showToast('服务器异常，请稍后重试')
    } else if (err.response?.status === 401) {
      // 未登录，跳登录页
      redirectToLogin()
    } else {
      showToast(err.response?.data?.msg || '请求失败')
    }
    return Promise.reject(err)
  }
)
```

**铁律**：
- **永远 reject**，不要让错误"消失"
- 用户可见的提示用 `toast`/`message` 组件，不要 `alert`
- 401 必须跳登录页，不要傻等
- 超时阈值默认 10s，业务方需要更久的可以单接口覆盖

## 业务层（API 模块统一处理）

```ts
// src/api/user.ts
import request from '@/utils/request'

export async function getUserInfo(id: string) {
  const { data } = await request.get(`/user/${id}`)
  if (data.code !== 0) {
    // 业务错误：抛自定义错误，让组件层选择如何展示
    throw new BusinessError(data.code, data.msg)
  }
  return data.data
}
```

**铁律**：
- API 模块返回**业务数据**（`data.data`），不返回完整 axios response
- 业务错误抛 `BusinessError`，不要返回 `{ok: false}` 之类的歧义结构
- 组件层 `try/catch BusinessError` 决定怎么展示（toast / inline 提示 / 重试按钮）

## 校验层（在表单组件里）

```vue
<!-- Vue 例子 -->
<wd-form ref="formRef" :model="form" :rules="rules">
  <wd-input v-model="form.phone" prop="phone" placeholder="手机号" />
</wd-form>

<script setup lang="ts">
const rules = {
  phone: [
    { required: true, message: '请输入手机号' },
    { pattern: /^1\d{10}$/, message: '手机号格式不正确' },
  ],
}

async function onSubmit() {
  try {
    await formRef.value.validate()
    // 通过，调 API
  } catch (e) {
    // 校验失败，组件库会自动高亮，不必额外处理
  }
}
</script>
```

**铁律**：
- 校验失败由组件库自己处理 UI，不要再写 toast
- 用 Amis JSON 里的 `required`/`validations` 字段映射到目标栈的 rules

## 给 Agent 的特别提醒

当沙箱 dev 启动失败 / 用户从 IDE 塞日志进对话时：

1. **错误信息里有文件名+行号** → 直接 `Read` 那个文件 + `Edit` 修
2. **错误信息只有堆栈** → `Grep` 关键 symbol 找位置
3. **是依赖缺失（Cannot find module 'xxx'）** → 检查是不是 import 写错（先于"是不是要装包"）
4. **是 TypeScript 类型错误** → 修类型，不要 `any` 一把梭
5. **修完一定要告诉用户"已修复 X，请刷新预览"**——别让用户猜你做了什么

## 不允许的反模式

```ts
// ❌ silent swallow
try { await foo() } catch {}

// ❌ 用 alert
alert('错了！')

// ❌ 把 axios response 整个返回
export const getUser = (id) => request.get(`/user/${id}`)

// ❌ 在组件里直接 axios
axios.get('/api/...')  // 必须走 src/api/

// ❌ 在 catch 里返回模糊状态
catch (e) { return { ok: false } }
```
