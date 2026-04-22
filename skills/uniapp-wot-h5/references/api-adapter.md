# Amis `api` 字段 → axios 请求翻译规则

Amis 的 `api` 字段有多种形态，统一翻译到项目的请求封装 `src/utils/request.ts`（axios 实例）。

## 请求封装（种子项目应已提供，若无则创建）

`src/utils/request.ts`:
```ts
import axios from 'axios'

const instance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || '/api',
  timeout: 10000,
})

instance.interceptors.request.use((cfg) => {
  const token = uni.getStorageSync('token')
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

instance.interceptors.response.use(
  (resp) => resp.data,
  (err) => {
    uni.showToast({ title: err.response?.data?.msg || '请求失败', icon: 'none' })
    return Promise.reject(err)
  }
)

export default instance
```

## Amis api 形态 → axios 代码

### 形态 1：纯字符串
```json
"api": "/api/users"              →  axios.get('/api/users')
"api": "get:/api/users"          →  axios.get('/api/users')
"api": "post:/api/users"         →  axios.post('/api/users', data)
"api": "delete:/api/users/123"   →  axios.delete('/api/users/123')
```

### 形态 2：对象
```json
{
  "method": "post",
  "url": "/api/users",
  "data": { "name": "$name", "age": "$age" }
}
```
→ 
```ts
await axios.post('/api/users', { name: formData.name, age: formData.age })
```
**注意**：`$xxx` 表示引用当前 context 的 `xxx` 字段，翻译时从 reactive 数据里取。

### 形态 3：带响应适配（adaptor）
```json
{ "url": "...", "adaptor": "return { items: payload.list }" }
```
→ 翻译后把 `adaptor` 的逻辑直接写在 `.then` 里：
```ts
const { list } = await axios.get('/api/xxx')
data.value = list
```

## 响应数据结构约定

Amis 通常期望返回：
```json
{
  "status": 0,
  "msg": "",
  "data": { "items": [...], "total": 100 }
}
```

我们项目的 `request.ts` 返回拦截器已经 `return resp.data`，所以拿到的就是整个响应体。**访问数据时用 `data.items`、`data.total`**，不要再 `.data.data`。

## 分页参数约定

Amis CRUD 分页传参：
- `page` / `perPage`（驼峰或下划线随后端）
- 返回 `data.items` + `data.total`

翻译：
```ts
const page = ref(1)
const perPage = ref(20)
const total = ref(0)

async function fetchList() {
  const resp = await axios.get('/api/users', {
    params: { page: page.value, perPage: perPage.value }
  })
  data.value = resp.data.items
  total.value = resp.data.total
}
```

## 禁止

- 不要用 `uni.request`（与 axios 语义不一致，错误处理繁琐）
- 不要在每个组件里自己 import axios，统一走 `src/utils/request.ts`
- 不要硬编码 `http://localhost:8080` 之类的 URL，用 `baseURL`
