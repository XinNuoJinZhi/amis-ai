---
component: subformcontrol
amis_version: v6.0.0
---

# subformcontrol

| 属性 | 类型 | 必选 | 说明 |
|---|---|---|---|
| `type` | `"input-sub-form"` | 是 | 指定为 SubForm 子表单 |
| `placeholder` | `string` | 否 | 占位符 |
| `multiple` | `boolean` | 否 | 是否多选 |
| `draggable` | `boolean` | 否 | 是否可拖拽排序 |
| `draggableTip` | `string` | 否 | 拖拽提示信息 |
| `addable` | `boolean` | 否 | 是否可新增 |
| `removable` | `boolean` | 否 | 是否可删除 |
| `minLength` | `number` | 否 | 最少个数 |
| `maxLength` | `number` | 否 | 最多个数 |
| `labelField` | `string` | 否 | 当值中存在这个字段，则按钮名称将使用此字段的值来展示。 |
| `btnLabel` | `string` | 否 | 按钮默认名称 |
| `addButtonText` | `string` | 否 | 新增按钮文字 |
| `addButtonClassName` | `SchemaClassName` | 否 | 新增按钮 CSS 类名 |
| `itemClassName` | `SchemaClassName` | 否 | 值元素的类名 |
| `itemsClassName` | `SchemaClassName` | 否 | 值列表元素的类名 |
| `showErrorMsg` | `boolean` | 否 | 是否在左下角显示报错信息 |
| `form` | `Omit<FormSchema, "type">` | 否 | 子表单详情 |
| `scaffold` | `any` | 否 |  |
