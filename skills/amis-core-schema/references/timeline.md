---
component: timeline
amis_version: v6.0.0
---

# timeline

| 属性 | 类型 | 必选 | 说明 |
|---|---|---|---|
| `type` | `"timeline"` | 是 | 指定为 Timeline 时间轴渲染器 |
| `items` | `TimelineItemSchema[]` | 否 | 节点数据 |
| `source` | `SchemaApi` | 否 | API 或 数据映射 |
| `mode` | `"right" \| "left" \| "alternate"` | 否 | 文字相对于时间轴展示方向 |
| `direction` | `"vertical" \| "horizontal"` | 否 | 展示方向 |
| `reverse` | `boolean` | 否 | 节点倒序 |
| `itemTitleSchema` | `SchemaCollection` | 否 | 节点title自定一展示模板 |
| `iconClassName` | `string` | 否 | 图标的CSS类名 |
| `timeClassName` | `string` | 否 | 节点时间的CSS类名 |
| `titleClassName` | `string` | 否 | 节点标题的CSS类名 |
| `detailClassName` | `string` | 否 | 节点详情的CSS类名 |
