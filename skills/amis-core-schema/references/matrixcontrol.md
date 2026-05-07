---
component: matrixcontrol
amis_version: v6.0.0
---

# matrixcontrol

| 属性 | 类型 | 必选 | 说明 |
|---|---|---|---|
| `type` | `"matrix-checkboxes"` | 是 |  |
| `multiple` | `boolean` | 否 | 配置singleSelectMode时设置为false |
| `singleSelectMode` | `boolean` | 否 | 设置单选模式，multiple为false时有效 |
| `source` | `SchemaApi` | 否 | 可用来通过 API 拉取 options。 |
| `columns` | `{ [propName: string]: any; label: string; }[]` | 否 |  |
| `rows` | `{ [propName: string]: any; label: string; }[]` | 否 |  |
| `rowLabel` | `string` | 否 | 行标题说明 |
