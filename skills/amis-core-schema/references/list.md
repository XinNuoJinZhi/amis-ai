---
component: list
amis_version: v6.0.0
---

# list

| 属性 | 类型 | 必选 | 说明 |
|---|---|---|---|
| `type` | `"list" \| "static-list"` | 是 | 指定为 List 列表展示控件。 |
| `title` | `string` | 否 | 标题 |
| `footer` | `SchemaCollection` | 否 | 底部区域 |
| `footerClassName` | `SchemaClassName` | 否 | 底部区域类名 |
| `header` | `SchemaCollection` | 否 | 顶部区域 |
| `headerClassName` | `SchemaClassName` | 否 | 顶部区域类名 |
| `listItem` | `ListItemSchema` | 否 | 单条数据展示内容配置 |
| `source` | `string` | 否 | 数据源: 绑定当前环境变量 |
| `showFooter` | `boolean` | 否 | 是否显示底部 |
| `showHeader` | `boolean` | 否 | 是否显示头部 |
| `placeholder` | `string` | 否 | 无数据提示 |
| `hideCheckToggler` | `boolean` | 否 | 是否隐藏勾选框 |
| `affixHeader` | `boolean` | 否 | 是否固顶 |
| `affixFooter` | `boolean` | 否 | 是否固底 |
| `itemCheckableOn` | `SchemaExpression` | 否 | 配置某项是否可以点选 |
| `itemDraggableOn` | `SchemaExpression` | 否 | 配置某项是否可拖拽排序，前提是要开启拖拽功能 |
| `checkOnItemClick` | `boolean` | 否 | 点击列表单行时，是否选择 |
| `valueField` | `string` | 否 | 可以用来作为值的字段 |
| `size` | `"sm" \| "base"` | 否 | 大小 |
| `itemAction` | `ActionSchema` | 否 | 点击列表项的行为 |
