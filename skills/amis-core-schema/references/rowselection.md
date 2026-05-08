---
component: rowselection
amis_version: v6.0.0
---

# rowselection

| 属性 | 类型 | 必选 | 说明 |
|---|---|---|---|
| `type` | `string` | 是 | 选择类型 单选/多选 |
| `keyField` | `string` | 否 | 对应数据源的key值 |
| `disableOn` | `string` | 否 | 行是否禁用表达式 |
| `selections` | `RowSelectionOptionsSchema[]` | 否 | 自定义选择菜单 |
| `selectedRowKeys` | `(string \| number)[]` | 否 | 已选择的key值 |
| `selectedRowKeysExpr` | `string` | 否 | 已选择的key值表达式 |
| `columnWidth` | `number` | 否 | 已选择的key值表达式 |
| `rowClick` | `boolean` | 否 | 是否点击行触发选中或取消选中 |
