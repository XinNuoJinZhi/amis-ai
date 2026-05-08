---
component: tag
amis_version: v6.0.0
---

# tag

| 属性 | 类型 | 必选 | 说明 |
|---|---|---|---|
| `type` | `"tag"` | 是 |  |
| `className` | `SchemaClassName` | 否 | 类名 |
| `style` | `{ [propName: string]: any; }` | 否 | 自定义样式 |
| `color` | `string` | 否 | 标签颜色 |
| `label` | `string` | 是 | 标签文本内容 |
| `displayMode` | `"status" \| "rounded" \| "normal"` | 否 | normal: 面性标签，对应color的背景色<br>rounded: 线性标签， 对应color的边框<br>status: 带图标的标签， 图标可以自定义 |
| `icon` | `string` | 否 | status模式时候设置的前置图标 |
| `closable` | `boolean` | 否 | 是否展示关闭按钮 |
| `closeIcon` | `string` | 是 | 关闭图标 |
| `checkable` | `boolean` | 否 | 是否是可选的标签 |
| `checked` | `boolean` | 否 | 是否选中 |
| `disabled` | `boolean` | 否 | 是否禁用 |
