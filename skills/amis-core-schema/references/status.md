---
component: status
amis_version: v6.0.0
---

# status

| 属性 | 类型 | 必选 | 说明 |
|---|---|---|---|
| `type` | `"status"` | 是 | 指定为状态展示控件 |
| `placeholder` | `string` | 否 | 占位符 |
| `map` | `{ [propName: string]: string; }` | 否 | 状态图标映射关系 |
| `labelMap` | `{ [propName: string]: string; }` | 否 | 文字映射关系 |
| `source` | `StatusSource` | 否 | 新版配置映射源的字段<br>可以兼容新版icon并且配置颜色<br>2.8.0 新增 |
