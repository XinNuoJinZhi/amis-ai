---
component: collapsegroup
amis_version: v6.0.0
---

# collapsegroup

| 属性 | 类型 | 必选 | 说明 |
|---|---|---|---|
| `type` | `"collapse-group"` | 是 | 指定为折叠器类型 |
| `activeKey` | `string \| number \| (string \| number)[]` | 否 | 激活面板 |
| `accordion` | `boolean` | 否 | 手风琴模式 |
| `expandIcon` | `SchemaObject` | 否 | 自定义切换图标 |
| `expandIconPosition` | `"right" \| "left"` | 否 | 设置图标位置 |
| `body` | `SchemaCollection` | 否 | 内容区域 |
| `enableFieldSetStyle` | `boolean` | 否 | 当Collapse作为Form组件的子元素时，开启该属性后组件样式设置为FieldSet组件的样式，默认开启 |
