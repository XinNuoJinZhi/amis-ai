---
component: input-sub-form
source: zc-amis-6.8.0-my242v2
category: patched
zc_suite: other
---

# input-sub-form

> 运行时 schema 接口：`SubFormControlSchema`（extends `FormBaseControlSchema`）

## 属性

| 属性 | 类型 | 必选 | 说明 |
|---|---|---|---|
| `type` | `"input-sub-form"` | 是 | 指定类型 |
| `placeholder` | `string` | 否 | 占位符 |
| `multiple` | `boolean` | 否 | 是否多选 |
| `draggable` | `boolean` | 否 | 是否可拖拽排序 |
| `draggableTip` | `string` | 否 | 拖拽提示信息 |
| `addable` | `boolean` | 否 | 是否可新增 |
| `removable` | `boolean` | 否 | 是否可删除 |
| `hideActionsOnMaxLength` | `boolean` | 否 |  |
| `minLength` | `number` | 否 | 最少个数 |
| `maxLength` | `number` | 否 | 最多个数 |
| `labelField` | `string` | 否 | 当值中存在这个字段，则按钮名称将使用此字段的值来展示。 |
| `btnLabel` | `string` | 否 | 按钮默认名称 @default 设置 |
| `addButtonText` | `string` | 否 | 新增按钮文字 |
| `addButtonClassName` | `SchemaClassName` | 否 | 新增按钮 CSS 类名 |
| `itemClassName` | `SchemaClassName` | 否 | 值元素的类名 |
| `itemsClassName` | `SchemaClassName` | 否 | 值列表元素的类名 |
| `showErrorMsg` | `boolean` | 否 | 是否在左下角显示报错信息 |
| `form` | `Omit<FormSchema, 'type'>` | 否 | 子表单详情 |
| `scaffold` | `any` | 否 |  |

## 跟原版 amis 差异

（自动 diff vs baidu/amis@6.8.0 待 patch_summarizer 补全）
