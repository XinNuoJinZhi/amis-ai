---
component: card
amis_version: v6.0.0
---

# card

| 属性 | 类型 | 必选 | 说明 |
|---|---|---|---|
| `type` | `"card"` | 是 | 指定为 card 类型 |
| `header` | `{ className?: SchemaClassName; title?: SchemaTpl; titleClassName?: SchemaClassName; subTitle?: SchemaTpl; subTitleClassName?: SchemaClassName; subTitlePlaceholder?: string; description?: SchemaTpl; descriptionPlaceholder?: string; descriptionClassName?: SchemaClassName; desc?: SchemaTpl; descPlaceholder?: SchemaTpl; descClassName?: SchemaClassName; avatar?: SchemaUrlPath; avatarText?: SchemaTpl; avatarTextBackground?: String[]; avatarTextClassName?: SchemaClassName; avatarClassName?: SchemaClassName; imageClassName?: SchemaClassName; highlight?: SchemaExpression; highlightClassName?: SchemaClassName; href?: SchemaTpl; blank?: boolean; }` | 否 | 头部配置 |
| `body` | `CardBodyField[]` | 否 | 内容区域 |
| `media` | `{ className?: SchemaClassName; type?: 'image' \| 'video'; url?: SchemaUrlPath; position?: 'top' \| 'left' \| 'right' \| 'bottom'; autoPlay?: boolean; isLive?: boolean; poster?: SchemaUrlPath; }` | 否 | 多媒体区域 |
| `actions` | `ActionSchema[]` | 否 | 底部按钮集合。 |
| `toolbar` | `ActionSchema[]` | 否 | 工具栏按钮 |
| `secondary` | `string` | 否 | 次要说明 |
| `useCardLabel` | `boolean` | 否 | 卡片内容区的表单项label是否使用Card内部的样式，默认为true |
