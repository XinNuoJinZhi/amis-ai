---
component: buttongroup
amis_version: v6.0.0
---

# buttongroup

| 属性 | 类型 | 必选 | 说明 |
|---|---|---|---|
| `type` | `"button-group"` | 是 | 指定为提交按钮类型 |
| `btnClassName` | `SchemaClassName` | 否 |  |
| `btnActiveClassName` | `string` | 否 |  |
| `buttons` | `ActionSchema[]` | 否 | 按钮集合 |
| `btnLevel` | `string` | 否 | 按钮样式级别 |
| `btnActiveLevel` | `string` | 是 | 按钮选中的样式级别 |
| `vertical` | `boolean` | 否 | 垂直展示？ |
| `tiled` | `boolean` | 否 | 平铺展示？ |
| `disabled` | `boolean` | 否 | 是否为禁用状态。 |
| `disabledOn` | `SchemaExpression` | 否 | 通过 JS 表达式来配置当前表单项的禁用状态。 |
| `visible` | `boolean` | 否 | 是否显示 |
| `visibleOn` | `SchemaExpression` | 否 | 通过 JS 表达式来配置当前表单项是否显示 |
| `size` | `"xs" \| "sm" \| "md" \| "lg"` | 否 | 按钮大小 |
