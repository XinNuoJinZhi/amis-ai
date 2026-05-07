---
component: dialog
amis_version: v6.0.0
---

# dialog

| 属性 | 类型 | 必选 | 说明 |
|---|---|---|---|
| `type` | `"dialog"` | 是 |  |
| `actions` | `ActionSchema[]` | 否 | 默认不用填写，自动会创建确认和取消按钮。 |
| `body` | `SchemaCollection` | 否 | 内容区域 |
| `bodyClassName` | `SchemaClassName` | 否 | 配置 Body 容器 className |
| `closeOnEsc` | `boolean` | 否 | 是否支持按 ESC 关闭 Dialog |
| `closeOnOutside` | `boolean` | 否 | 是否支持点其它区域关闭 Dialog |
| `name` | `string` | 否 |  |
| `size` | `"xs" \| "sm" \| "md" \| "lg" \| "xl" \| "full"` | 否 | Dialog 大小 |
| `height` | `string` | 否 | Dialog 高度 |
| `width` | `string` | 否 | Dialog 宽度 |
| `title` | `SchemaCollection` | 否 | 请通过配置 title 设置标题 |
| `header` | `SchemaCollection` | 否 |  |
| `headerClassName` | `SchemaClassName` | 否 |  |
| `footer` | `SchemaCollection` | 否 |  |
| `confirm` | `boolean` | 否 | 影响自动生成的按钮，如果自己配置了按钮这个配置无效。 |
| `showCloseButton` | `boolean` | 否 | 是否显示关闭按钮 |
| `showErrorMsg` | `boolean` | 否 | 是否显示错误信息 |
| `showLoading` | `boolean` | 否 | 是否显示 spinner |
| `overlay` | `boolean` | 否 | 是否显示蒙层 |
| `dialogType` | `"confirm"` | 否 | 弹框类型 confirm 确认弹框 |
| `draggable` | `boolean` | 否 | 可拖拽 |
