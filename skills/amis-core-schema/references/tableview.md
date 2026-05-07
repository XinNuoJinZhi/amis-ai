---
component: tableview
amis_version: v6.0.0
---

# tableview

| 属性 | 类型 | 必选 | 说明 |
|---|---|---|---|
| `type` | `"table-view"` | 是 | 指定为 table-view 展示类型 |
| `width` | `string \| number` | 否 | table 容器宽度，默认是 auto |
| `padding` | `string \| number` | 否 | 默认单元格内边距 |
| `border` | `boolean` | 否 | 是否显示边框 |
| `borderColor` | `string` | 否 | 边框颜色 |
| `caption` | `string` | 否 | 标题设置 |
| `captionSide` | `"top" \| "bottom"` | 否 | 标题位置 |
| `trs` | `TrObject[]` | 是 | 行设置 |
| `cols` | `ColObject[]` | 是 | 列设置 |
