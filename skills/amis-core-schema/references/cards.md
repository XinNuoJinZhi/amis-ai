---
component: cards
amis_version: v6.0.0
---

# cards

| 属性 | 类型 | 必选 | 说明 |
|---|---|---|---|
| `type` | `"cards"` | 是 | 指定为 cards 类型 |
| `card` | `Partial<CardSchema> \| Card2Schema` | 否 |  |
| `headerClassName` | `SchemaClassName` | 否 | 头部 CSS 类名 |
| `footerClassName` | `SchemaClassName` | 否 | 底部 CSS 类名 |
| `itemClassName` | `SchemaClassName` | 否 | 卡片 CSS 类名 |
| `placeholder` | `string` | 否 | 无数据提示 |
| `showFooter` | `boolean` | 否 | 是否显示底部 |
| `showHeader` | `boolean` | 否 | 是否显示头部 |
| `source` | `string` | 否 | 数据源: 绑定当前环境变量 |
| `title` | `string` | 否 | 标题 |
| `hideCheckToggler` | `boolean` | 否 | 是否隐藏勾选框 |
| `affixHeader` | `boolean` | 否 | 是否固顶 |
| `affixFooter` | `boolean` | 否 | 是否固底 |
| `header` | `SchemaCollection` | 否 | 顶部区域 |
| `footer` | `SchemaCollection` | 否 | 底部区域 |
| `itemCheckableOn` | `SchemaExpression` | 否 | 配置某项是否可以点选 |
| `itemDraggableOn` | `SchemaExpression` | 否 | 配置某项是否可拖拽排序，前提是要开启拖拽功能 |
| `checkOnItemClick` | `boolean` | 否 | 点击卡片的时候是否勾选卡片。 |
| `masonryLayout` | `boolean` | 否 | 是否为瀑布流布局？ |
| `valueField` | `string` | 否 | 可以用来作为值的字段 |
