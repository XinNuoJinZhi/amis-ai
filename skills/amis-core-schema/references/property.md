---
component: property
amis_version: v6.0.0
---

# property

| 属性 | 类型 | 必选 | 说明 |
|---|---|---|---|
| `type` | `"property"` | 是 | 指定为 property 展示类型 |
| `title` | `string` | 否 | 标题 |
| `column` | `number` | 否 | 一共几列 |
| `mode` | `"table" \| "simple"` | 否 | 显示模式 |
| `items` | `PropertyItem[]` | 是 | 每个 property 的设置 |
| `style` | `{ [propName: string]: any; }` | 否 | 自定义样式 |
| `titleStyle` | `{ [propName: string]: any; }` | 否 | 标题样式 |
| `labelStyle` | `{ [propName: string]: any; }` | 否 | 自定义样式 |
| `separator` | `string` | 否 |  |
| `contentStyle` | `{ [propName: string]: any; }` | 否 | 自定义样式 |
