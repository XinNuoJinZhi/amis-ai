---
component: service
amis_version: v6.0.0
---

# service

| 属性 | 类型 | 必选 | 说明 |
|---|---|---|---|
| `type` | `"service"` | 是 | 指定为 Service 数据拉取控件。 |
| `api` | `SchemaApi` | 否 | 页面初始化的时候，可以设置一个 API 让其取拉取，发送数据会携带当前 data 数据（包含地址栏参数），获取得数据会合并到 data 中，供组件内使用。 |
| `ws` | `string` | 否 | WebScocket 地址，用于实时获取数据 |
| `dataProvider` | `ComposedDataProvider` | 否 | 通过调用外部函数来获取数据 |
| `body` | `SchemaCollection` | 否 | 内容区域 |
| `fetchOn` | `SchemaExpression` | 否 |  |
| `initFetch` | `boolean` | 否 | 是否默认就拉取？ |
| `initFetchOn` | `SchemaExpression` | 否 | 是否默认就拉取？通过表达式来决定. |
| `schemaApi` | `SchemaApi` | 否 | 用来获取远程 Schema 的 api |
| `initFetchSchema` | `boolean` | 否 | 是否默认加载 schemaApi |
| `initFetchSchemaOn` | `SchemaExpression` | 否 | 用表达式来配置。 |
| `interval` | `number` | 否 | 是否轮询拉取 |
| `silentPolling` | `boolean` | 否 | 是否静默拉取 |
| `stopAutoRefreshWhen` | `SchemaExpression` | 否 | 关闭轮询的条件。 |
| `messages` | `SchemaMessage` | 否 |  |
| `name` | `string` | 否 |  |
| `showErrorMsg` | `boolean` | 否 | 是否以Alert的形式显示api接口响应的错误信息，默认展示 |
