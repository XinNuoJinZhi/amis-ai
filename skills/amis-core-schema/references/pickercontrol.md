---
component: pickercontrol
amis_version: v6.0.0
---

# pickercontrol

| 属性 | 类型 | 必选 | 说明 |
|---|---|---|---|
| `type` | `"picker"` | 是 |  |
| `labelTpl` | `string` | 否 | 可用来生成选中的值的描述文字 |
| `labelField` | `string` | 否 | 建议用 labelTpl<br>选中一个字段名用来作为值的描述文字 |
| `valueField` | `string` | 否 | 选一个可以用来作为值的字段。 |
| `pickerSchema` | `any` | 否 | 弹窗选择框详情。 |
| `modalMode` | `"dialog" \| "drawer"` | 否 | 弹窗模式，dialog 或者 drawer |
| `modalTitle` | `string` | 否 | 弹窗的标题，默认为情选择 |
| `embed` | `boolean` | 否 | 内嵌模式，也就是说不弹框了。 |
| `overflowConfig` | `{ maxTagCount?: number; displayPosition?: ('select' \| 'crud')[]; overflowTagPopover?: TooltipWrapperSchema; overflowTagPopoverInCRUD?: TooltipWrapperSchema; }` | 是 | 开启最大标签展示数量的相关配置 |
