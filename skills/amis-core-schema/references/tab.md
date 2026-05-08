---
component: tab
amis_version: v6.0.0
---

# tab

| 属性 | 类型 | 必选 | 说明 |
|---|---|---|---|
| `title` | `string \| SchemaObject` | 否 | Tab 标题 |
| `tab` | `SchemaCollection` | 否 | 内容 |
| `body` | `SchemaCollection` | 否 | 内容 |
| `badge` | `number` | 否 | 徽标 |
| `hash` | `string` | 否 | 设置以后将跟url的hash对应 |
| `icon` | `string` | 否 | 按钮图标 |
| `iconPosition` | `"right" \| "left"` | 否 |  |
| `reload` | `boolean` | 否 | 设置以后内容每次都会重新渲染 |
| `mountOnEnter` | `boolean` | 否 | 点开时才加载卡片内容 |
| `unmountOnExit` | `boolean` | 否 | 卡片隐藏就销毁卡片节点。 |
| `mode` | `"horizontal" \| "normal" \| "inline"` | 否 | 配置子表单项默认的展示方式。 |
| `horizontal` | `FormHorizontal` | 否 | 如果是水平排版，这个属性可以细化水平排版的左右宽度占比。 |
| `closable` | `boolean` | 否 | 是否可关闭，优先级高于 tabs 的 closable |
| `disabled` | `boolean` | 否 | 是否禁用 |
