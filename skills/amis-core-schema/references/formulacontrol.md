---
component: formulacontrol
amis_version: v6.0.0
---

# formulacontrol

| 属性 | 类型 | 必选 | 说明 |
|---|---|---|---|
| `type` | `"formula"` | 是 | 指定为公式功能控件。 |
| `id` | `string` | 否 | 当某个按钮的目标指定为此值后，会触发一次公式应用。这个机制可以在 autoSet 为 false 时用来手动触发 |
| `condition` | `string` | 否 | 触发公式的作用条件，如 data.xxx == \"a\" 或者 ${xx} |
| `autoSet` | `boolean` | 否 | 是否自动应用 |
| `formula` | `string` | 否 | 公式 |
| `initSet` | `boolean` | 否 | 是否初始应用 |
| `name` | `string` | 否 | 字段名，公式结果将作用到此处指定的变量中去 |
