# 业务模式：ZC `app://` 协议 API 调用（sheep/api 封装）

> 触发：Amis JSON 内 `api: "app://..."` / `source: "app://..."` 字段

## 推荐实现骨架

### Step 1 — `sheep/api/<entity>.js` 封装

```js
// sheep/api/goods.js
import { request } from '@/sheep/request'

export default {
  list: (params) => request({ url: 'app://goods/list', method: 'GET', params }),
  detail: (id) => request({ url: `app://goods/detail/${id}`, method: 'GET' }),
  addToCart: (data) => request({ url: 'app://cart/add', method: 'POST', data }),
}
```

### Step 2 — `sheep/request/index.js` 把 `app://` 改写成实际地址

```js
// sandbox 内 / 开发环境：app:// 改写成 mock 或 /api 代理
function rewriteUrl(url) {
  if (url.startsWith('app://')) {
    return '/api/' + url.replace('app://', '')   // 走 sandbox 的 mock 路径
  }
  return url
}

export async function request({ url, method = 'GET', params, data }) {
  const finalUrl = rewriteUrl(url)
  // ... uni.request 调用
}
```

### Step 3 — 页面里直接用业务 API

```vue
<script setup>
import api from '@/sheep/api/goods'
const { data, error } = await api.list({ pageNo: 1, pageSize: 20 })
</script>
```

## 协议约定

| 协议形式 | 解析路径 |
|---|---|
| `app://<service>/<resource>` | sandbox 内重写为 `/api/<service>/<resource>` → 走 vite 代理 mock |
| `app://<service>/<resource>/${id}` | 同上，URL 模板插值 |
| 生产环境 | ZC 部署网关自动重写成内网 apicenter 地址 |

## sandbox 内的 mock 策略

scaffold 自带 `sheep/request/mock.js` 含 mockjs 兜底：
- 无后端时返回符合 schema 的随机数据
- LLM 生成新业务 API 时，**同步在 mock.js 加一条 mock 规则**（不需要真后端就能 dev 起来）

## DO/DON'T

✅ **DO**：所有业务 API 集中到 `sheep/api/<entity>.js`，页面不直接调 `uni.request`
✅ **DO**：用 `app://` 协议字面量，由 `sheep/request` 统一改写
✅ **DO**：sandbox 内生成新 API 时同步加 mock，让 dev:h5 直接可用
❌ **DON'T**：不要在页面里 hardcode `/api/...` 路径，会破坏多端切换
❌ **DON'T**：不要把 ZC 私有协议（`app://`）改成 `http://`，会破坏生产环境网关重写
