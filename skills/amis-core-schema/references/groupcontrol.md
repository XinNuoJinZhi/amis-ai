---
component: groupcontrol
amis_version: v6.0.0
---

# groupcontrol

| 属性 | 类型 | 必选 | 说明 |
|---|---|---|---|
| `type` | `"group"` | 是 |  |
| `body` | `GroupSubControl[]` | 是 | FormItem 集合 |
| `gap` | `"xs" \| "sm" \| "normal"` | 否 | 间隔 |
| `direction` | `"vertical" \| "horizontal"` | 否 | 配置时垂直摆放还是左右摆放。 |
| `subFormMode` | `"horizontal" \| "normal" \| "inline"` | 否 | 配置子表单项默认的展示方式。 |
| `subFormHorizontal` | `FormHorizontal` | 否 | 如果是水平排版，这个属性可以细化水平排版的左右宽度占比。 |
