---
component: flex
amis_version: v6.0.0
---

# flex

| 属性 | 类型 | 必选 | 说明 |
|---|---|---|---|
| `type` | `"flex"` | 是 | 指定为 flex 展示类型 |
| `justify` | `"center" \| "start" \| "flex-start" \| "end" \| "flex-end" \| "space-around" \| "space-between" \| "space-evenly"` | 否 | 水平分布 |
| `alignItems` | `"center" \| "start" \| "flex-start" \| "end" \| "flex-end" \| "stretch" \| "baseline"` | 否 | 垂直布局 |
| `alignContent` | `"center" \| "flex-start" \| "flex-end" \| "space-around" \| "space-between" \| "space-evenly" \| "stretch" \| "normal"` | 否 | 多行情况下的垂直分布 |
| `direction` | `"row" \| "column" \| "row-reverse" \| "column-reverse"` | 否 | 方向 |
| `items` | `SchemaCollection` | 是 | 每个 flex 的设置 |
| `style` | `{ [propName: string]: any; }` | 否 | 自定义样式 |
