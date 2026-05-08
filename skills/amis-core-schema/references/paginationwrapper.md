---
component: paginationwrapper
amis_version: v6.0.0
---

# paginationwrapper

| 属性 | 类型 | 必选 | 说明 |
|---|---|---|---|
| `type` | `"pagination-wrapper"` | 是 | 指定为分页容器功能性渲染器 |
| `showPageInput` | `boolean` | 否 | 是否显示快速跳转输入框 |
| `maxButtons` | `number` | 否 | 最多显示多少个分页按钮。 |
| `inputName` | `string` | 否 | 输入字段名 |
| `outputName` | `string` | 否 | 输出字段名 |
| `perPage` | `number` | 否 | 每页显示多条数据。 |
| `position` | `"top" \| "bottom" \| "none"` | 否 | 分页显示位置，如果配置为 none 则需要自己在内容区域配置 pagination 组件，否则不显示。 |
| `body` | `SchemaCollection` | 否 | 内容区域 |
