---
component: picker
source: zc-amis-6.8.0-my242v2
category: patched
zc_suite: other
---

# picker

> 运行时 schema 接口：`PickerControlSchema`（extends `FormOptionsSchema`）

## 属性

| 属性 | 类型 | 必选 | 说明 |
|---|---|---|---|
| `type` | `"picker"` | 是 | 指定类型 |
| `labelTpl` | `SchemaTpl` | 否 | 可用来生成选中的值的描述文字 |
| `labelField` | `string` | 否 | 建议用 labelTpl 选中一个字段名用来作为值的描述文字 |
| `valueField` | `string` | 否 | 选一个可以用来作为值的字段。 |
| `pickerSchema` | `any` | 否 | 弹窗选择框详情。 |
| `primaryField` | `string` | 否 | 设置 ID 字段名 |
| `modalMode` | `'dialog' \| 'drawer'` | 否 | 弹窗模式，dialog 或者 drawer |
| `modalTitle` | `string` | 否 | 弹窗的标题，默认为情选择 |
| `embed` | `boolean` | 否 | 内嵌模式，也就是说不弹框了。 |
| `overflowConfig` | `{ /** * 标签的最大展示数量，超出数量后以收纳浮层的方式展示，仅在多选模式开启后生效 */ maxTagCo...` | 是 | 开启最大标签展示数量的相关配置 |
| `displayPosition` | `('select' \| 'crud')[]` | 否 | 开启最大标签展示数量后，收纳标签生效的位置，未开启内嵌模式默认为选择器, 开启后默认为选择器 + 模态框，可选值为'select'(选择器)、'crud'... |
| `overflowTagPopover` | `TooltipWrapperSchema` | 否 | 开启最大标签展示数量后，选择器内收纳标签的Popover配置 |
| `overflowTagPopoverInCRUD` | `TooltipWrapperSchema` | 否 | 开启最大标签展示数量后，CRUD顶部内收纳标签的Popover配置 |

## 跟原版 amis 差异

（自动 diff vs baidu/amis@6.8.0 待 patch_summarizer 补全）
