---
component: card2
amis_version: v6.0.0
---

# card2

| 属性 | 类型 | 必选 | 说明 |
|---|---|---|---|
| `type` | `"card2"` | 是 | 指定为 card2 类型 |
| `body` | `SchemaCollection` | 是 | 内容 |
| `bodyClassName` | `SchemaClassName` | 否 | body 类名 |
| `style` | `{ [propName: string]: any; }` | 否 | 自定义样式 |
| `hideCheckToggler` | `boolean` | 否 | 隐藏选框 |
| `checkOnItemClick` | `boolean` | 是 | 不配置href且cards容器下生效，点击整个卡片触发选中 |
| `wrapperComponent` | `string` | 否 | 渲染标签 |
