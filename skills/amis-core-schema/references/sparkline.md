---
component: sparkline
amis_version: v6.0.0
---

# sparkline

| 属性 | 类型 | 必选 | 说明 |
|---|---|---|---|
| `type` | `"sparkline"` | 是 |  |
| `className` | `SchemaClassName` | 否 | css 类名 |
| `name` | `string` | 否 | 关联数据变量。 |
| `width` | `number` | 否 | 宽度 |
| `height` | `number` | 否 | 高度 |
| `clickAction` | `ActionSchema` | 否 | 点击行为 |
| `placeholder` | `string` | 否 | 空数据时显示的内容 |
| `value` | `(number \| { value: number; label?: string; })[]` | 否 |  |
