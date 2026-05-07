---
component: portlet
amis_version: v6.0.0
---

# portlet

| 属性 | 类型 | 必选 | 说明 |
|---|---|---|---|
| `type` | `"portlet"` | 是 | 指定为 portlet 类型 |
| `tabs` | `PortletTabSchema[]` | 是 |  |
| `source` | `string` | 否 | 关联已有数据，选项卡直接根据目标数据重复。 |
| `tabsClassName` | `SchemaClassName` | 否 | 类名 |
| `tabsMode` | `"" \| "card" \| "radio" \| "vertical" \| "tiled" \| "line"` | 否 | 展示形式 |
| `contentClassName` | `SchemaClassName` | 否 | 内容类名 |
| `linksClassName` | `SchemaClassName` | 否 | 链接外层类名 |
| `mountOnEnter` | `boolean` | 否 | 卡片是否只有在点开的时候加载？ |
| `unmountOnExit` | `boolean` | 否 | 卡片隐藏的时候是否销毁卡片内容 |
| `toolbar` | `ActionSchema[]` | 否 | 可以在右侧配置点其他功能按钮。不会随着tab切换 |
| `scrollable` | `boolean` | 否 | 是否支持溢出滚动 |
| `divider` | `boolean` | 否 | header和内容是否展示分割线 |
| `description` | `string` | 否 | 标题右侧的描述 |
| `hideHeader` | `boolean` | 否 | 隐藏头部 |
| `style` | `{ [propName: string]: any; }` | 否 | 自定义样式 |
