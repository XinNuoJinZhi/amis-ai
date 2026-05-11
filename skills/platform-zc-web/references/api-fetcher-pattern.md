# 业务模式：`service` fetcher 与 `app://` 协议改写

> 触发：amis schema 内出现 `api: "app://..."` / `source: "app://..."` / `actionType: "ajax"` 配 `app://` URL

## `service` 是什么

`@/utils/request.ts` 暴露的 `service` 是一个**预配好 ZC 协议规则的 axios 实例**，作为 amis `fetcher` 注入：

```tsx
import { service } from '@/utils/request';
amisRender(schema, data, { fetcher: service, /* ... */ });
```

amis 内部所有 API 调用（crud 列表 / form 提交 / select 数据源 / ajax 按钮）都会走 `service`，自动获得：

1. **`app://` 协议改写**：`app://goods/list` → `<gateway>/goods/list` 或开发环境 mock 路径
2. **Token 注入**：从 `localStorage` / cookie 读 access_token 加 `Authorization: Bearer ...`
3. **错误统一处理**：401 自动跳登录，业务错误 toast 提示
4. **租户上下文**：多租户场景自动加 `X-Tenant-Id` 头

## 推荐用法

```jsonc
{
  "type": "crud",
  "api": "app://goods/list",                  // GET 走 service
  "columns": [
    { "name": "category", "label": "分类",
      "source": "app://dict/category" }        // 列内 source 也走 service
  ],
  "headerToolbar": [
    { "type": "button", "label": "导出",
      "actionType": "ajax",
      "api": "POST:app://goods/export" }       // 按钮 ajax 也走 service
  ]
}
```

## DEV 环境 mock 兜底

sandbox 环境 `app://` 不通真实 ZC apicenter 网关，`service` 检测 `import.meta.env.DEV` 时改写到本地 mock：

```ts
// utils/request.ts 节选
function rewriteAppProtocol(url: string) {
  if (!url.startsWith('app://')) return url;
  const path = url.replace('app://', '');
  if (import.meta.env.DEV) {
    return `/mock/${path}`;          // 本地 mock 路径，由 vite-plugin-mock 拦截
  }
  return `${ZC_GATEWAY}/${path}`;    // 生产走真实网关
}
```

scaffold `mock/` 目录下的 `.ts` 文件由 vite-plugin-mock 自动挂载，返回静态业务数据。

## LLM 生成业务 API 时的 SOP

当 LLM 在 schema 里用了一个新的 `app://` URL 时：

1. ✅ 写到 amis schema 里：`"api": "app://my-service/my-resource"`
2. ✅ **同步**在 `mock/my-service.ts` 加一条 mock 规则：
   ```ts
   import Mock from 'mockjs';
   export default {
     'GET /mock/my-service/my-resource': () => ({
       status: 0,
       msg: '',
       data: {
         items: Mock.mock({ 'list|10': [{ id: '@id', name: '@cname' }] }).list,
         total: 100,
       },
     }),
   };
   ```
3. ✅ 重启 dev server（vite 自动热加载 mock 文件）
4. ✅ 不要去手写 axios 调用 —— `service` 已经做了所有事

## ZC 响应结构约定

ZC apicenter 标准响应：

```json
{
  "status": 0,            // 0=success，非 0=业务错误
  "msg": "",              // 错误消息
  "data": { /* 业务数据 */ }
}
```

amis `fetcher` 默认就吃这个结构，所以 mock 也按这格式写。

## 同类参考（scaffold 内 Read 即可）

- `src/utils/request.ts` — service 完整实现（含 token / 错误 / 重试）
- `src/services/` — 业务级 API 封装（部分页面直接调用，bypass amis）
- `mock/` — 业务 mock 数据集合

## DO/DON'T

✅ **DO**：所有业务 API 用 `app://` 协议，由 `service` 统一处理
✅ **DO**：新增 API 同步加 mock，sandbox 内 dev:vite 直接可用
✅ **DO**：`actionType: "ajax"` 的按钮 API 也写 `app://`，不要写绝对 URL
❌ **DON'T**：不要绕过 `service` 直接 fetch / axios.get
❌ **DON'T**：不要把 `app://` 改成 `http://` 硬编码 — 破坏多环境部署
❌ **DON'T**：不要在前端硬编码 `Authorization` 头 — `service` 已经从 localStorage 读
