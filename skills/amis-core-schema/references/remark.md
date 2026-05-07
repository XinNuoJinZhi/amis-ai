---
component: remark
amis_version: v6.0.0
---

# remark

| 属性 | 类型 | 必选 | 说明 |
|---|---|---|---|
| `type` | `"remark"` | 是 | 指定为提示类型 |
| `label` | `string` | 否 |  |
| `icon` | `string` | 否 |  |
| `tooltipClassName` | `SchemaClassName` | 否 |  |
| `trigger` | `("click" \| "hover" \| "focus")[]` | 否 | 触发规则 |
| `title` | `string` | 否 | 提示标题 |
| `content` | `string` | 是 | 提示内容 |
| `placement` | `"top" \| "right" \| "bottom" \| "left"` | 否 | 显示位置 |
| `rootClose` | `boolean` | 否 | 点击其他内容时是否关闭弹框信息 |
| `shape` | `"circle" \| "square"` | 否 | icon的形状 |
