---
component: draweraction
amis_version: v6.0.0
---

# draweraction

| 属性 | 类型 | 必选 | 说明 |
|---|---|---|---|
| `actionType` | `"drawer"` | 是 | 指定为打开弹窗，抽出式弹窗 |
| `drawer` | `DrawerSchemaBase` | 是 | 抽出式弹框详情<br>文档：https://aisuda.bce.baidu.com/amis/zh-CN/components/drawer |
| `nextCondition` | `SchemaExpression` | 否 | 是否有下一个的表达式，正常可以不用配置，如果想要刷掉某些数据可以配置这个。 |
| `reload` | `string` | 否 |  |
| `redirect` | `string` | 否 |  |
