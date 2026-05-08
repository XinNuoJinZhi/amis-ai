---
component: mapping
amis_version: v6.0.0
---

# mapping

| 属性 | 类型 | 必选 | 说明 |
|---|---|---|---|
| `type` | `"map" \| "mapping"` | 是 | 指定为映射展示控件 |
| `name` | `string` | 否 | 关联字段名。 |
| `map` | `{ [propName: string]: string; }` | 否 | 配置映射规则，值可以使用模板语法。当 key 为 * 时表示 else，也就是说值没有映射到任何规则时用 * 对应的值展示。 |
| `valueField` | `string` | 否 | map或source为对象数组时，作为value值的字段名 |
| `labelField` | `string` | 否 | map或source为对象数组时，作为label值的字段名 |
| `itemSchema` | `SchemaCollection` | 否 | 自定义渲染映射值，支持html或schema |
| `source` | `SchemaApi` | 否 | 如果想远程拉取字典，请配置 source 为接口。 |
| `placeholder` | `string` | 否 | 占位符 |
