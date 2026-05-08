---
component: dialogaction
amis_version: v6.0.0
---

# dialogaction

| 属性 | 类型 | 必选 | 说明 |
|---|---|---|---|
| `actionType` | `"dialog"` | 是 | 指定为打开弹窗 |
| `dialog` | `DialogSchemaBase` | 是 | 弹框详情<br>文档：https://aisuda.bce.baidu.com/amis/zh-CN/components/dialog |
| `nextCondition` | `SchemaExpression` | 否 | 是否有下一个的表达式，正常可以不用配置，如果想要刷掉某些数据可以配置这个。 |
| `reload` | `string` | 否 |  |
| `redirect` | `string` | 否 |  |
