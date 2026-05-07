---
component: drawer
amis_version: v6.0.0
---

# drawer

| 属性 | 类型 | 必选 | 说明 |
|---|---|---|---|
| `type` | `"drawer"` | 是 |  |
| `actions` | `ActionSchema[]` | 否 | 默认不用填写，自动会创建确认和取消按钮。 |
| `body` | `SchemaCollection` | 否 | 内容区域 |
| `className` | `SchemaClassName` | 否 | 配置 外层 className |
| `bodyClassName` | `SchemaClassName` | 否 | 配置 Body 容器 className |
| `headerClassName` | `SchemaClassName` | 否 | 配置 头部 容器 className |
| `footerClassName` | `SchemaClassName` | 否 | 配置 头部 容器 className |
| `closeOnEsc` | `boolean` | 否 | 是否支持按 ESC 关闭 Dialog |
| `name` | `string` | 否 |  |
| `size` | `"xs" \| "sm" \| "md" \| "lg" \| "full"` | 否 | Dialog 大小 |
| `title` | `SchemaCollection` | 否 | 请通过配置 title 设置标题 |
| `position` | `"top" \| "right" \| "bottom" \| "left"` | 否 | 从什么位置弹出 |
| `showCloseButton` | `boolean` | 否 | 是否展示关闭按钮<br>当值为false时，默认开启closeOnOutside |
| `width` | `string \| number` | 否 | 抽屉的宽度 （当position为left \| right时生效） |
| `height` | `string \| number` | 否 | 抽屉的高度 （当position为top \| bottom时生效） |
| `header` | `SchemaCollection` | 否 | 头部 |
| `footer` | `SchemaCollection` | 否 | 底部 |
| `confirm` | `boolean` | 否 | 影响自动生成的按钮，如果自己配置了按钮这个配置无效。 |
| `resizable` | `boolean` | 否 | 是否可以拖动弹窗大小 |
| `overlay` | `boolean` | 否 | 是否显示蒙层 |
| `closeOnOutside` | `boolean` | 否 | 点击外部的时候是否关闭弹框。 |
| `showErrorMsg` | `boolean` | 否 | 是否显示错误信息 |
