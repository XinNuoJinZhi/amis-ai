---
component: ajaxaction
amis_version: v6.0.0
---

# ajaxaction

| 属性 | 类型 | 必选 | 说明 |
|---|---|---|---|
| `actionType` | `"ajax"` | 是 | 指定为发送 ajax 的行为。 |
| `api` | `SchemaApi` | 是 | 配置 ajax 发送地址 |
| `feedback` | `FeedbackDialog` | 否 |  |
| `reload` | `string` | 否 |  |
| `redirect` | `string` | 否 |  |
| `ignoreConfirm` | `boolean` | 否 |  |
| `isolateScope` | `boolean` | 否 | 是否开启请求隔离, 主要用于隔离联动CRUD, Service的请求 |
