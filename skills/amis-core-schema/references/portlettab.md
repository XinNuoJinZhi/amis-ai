---
component: portlettab
amis_version: v6.0.0
---

# portlettab

| 属性 | 类型 | 必选 | 说明 |
|---|---|---|---|
| `title` | `string` | 否 | Tab 标题 |
| `tab` | `SchemaCollection` | 否 | 内容 |
| `toolbar` | `ActionSchema[]` | 否 | 可以在右侧配置点其他功能按钮，随着tab切换而切换 |
| `body` | `SchemaCollection` | 否 | 内容 |
| `icon` | `string` | 否 | 按钮图标 |
| `iconPosition` | `"right" \| "left"` | 否 |  |
| `reload` | `boolean` | 否 | 设置以后内容每次都会重新渲染 |
| `mountOnEnter` | `boolean` | 否 | 点开时才加载卡片内容 |
| `unmountOnExit` | `boolean` | 否 | 卡片隐藏就销毁卡片节点。 |
