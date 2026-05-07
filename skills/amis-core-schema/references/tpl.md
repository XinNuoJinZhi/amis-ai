---
component: tpl
amis_version: v6.0.0
---

# tpl

| 属性 | 类型 | 必选 | 说明 |
|---|---|---|---|
| `type` | `"html" \| "tpl"` | 是 | 指定为模板渲染器。<br><br>文档：https://aisuda.bce.baidu.com/amis/zh-CN/docs/concepts/template |
| `tpl` | `string` | 否 |  |
| `html` | `string` | 否 |  |
| `text` | `string` | 否 |  |
| `raw` | `string` | 否 |  |
| `inline` | `boolean` | 否 | 是否内联显示？ |
| `wrapperComponent` | `any` | 否 | 标签类型 |
| `style` | `{ [propName: string]: any; }` | 否 | 自定义样式 |
| `badge` | `BadgeObject` | 否 | 角标 |
