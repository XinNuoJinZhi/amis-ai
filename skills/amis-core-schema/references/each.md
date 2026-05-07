---
component: each
amis_version: v6.0.0
---

# each

| 属性 | 类型 | 必选 | 说明 |
|---|---|---|---|
| `type` | `"each"` | 是 | 指定为each展示类型 |
| `name` | `string` | 否 | 关联字段名 |
| `source` | `string` | 否 | 关联字段名 支持数据映射 |
| `itemKeyName` | `string` | 否 | 用来控制通过什么字段读取成员数据，考虑到可能多层嵌套<br>如果名字一样会读取不到上层变量，所以这里可以指定一下 |
| `indexKeyName` | `string` | 否 | 用来控制通过什么字段读取序号，考虑到可能多层嵌套<br>如果名字一样会读取不到上层变量，所以这里可以指定一下 |
| `items` | `SchemaCollection` | 否 |  |
| `placeholder` | `string` | 否 |  |
