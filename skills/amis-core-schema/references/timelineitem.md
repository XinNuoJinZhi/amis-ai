---
component: timelineitem
amis_version: v6.0.0
---

# timelineitem

| 属性 | 类型 | 必选 | 说明 |
|---|---|---|---|
| `time` | `string` | 是 | 时间点 |
| `title` | `SchemaCollection` | 否 | 时间节点标题 |
| `detail` | `string` | 否 | 详细内容 |
| `detailCollapsedText` | `string` | 否 | detail折叠时文案 |
| `detailExpandedText` | `string` | 否 | detail展开时文案 |
| `color` | `string` | 否 | 时间点圆圈颜色 |
| `icon` | `any` | 否 | 图标 |
| `iconClassName` | `string` | 否 | 图标的CSS类名 |
| `timeClassName` | `string` | 否 | 节点时间的CSS类名（优先级高于统一配置的timeClassName） |
| `titleClassName` | `string` | 否 | 节点标题的CSS类名（优先级高于统一配置的titleClassName） |
| `detailClassName` | `string` | 否 | 节点详情的CSS类名（优先级高于统一配置的detailClassName） |
