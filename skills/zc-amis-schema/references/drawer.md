---
component: drawer
source: zc-amis-6.8.0-my242v2
category: patched
zc_suite: other
---

# drawer

> 运行时 schema 接口：`DrawerSchema`（extends `BaseSchema`）

## 属性

| 属性 | 类型 | 必选 | 说明 |
|---|---|---|---|
| `type` | `"drawer"` | 是 | 指定类型 |
| `inputParams` | `any` | 否 | 弹窗参数说明，值格式为 JSONSchema。 |
| `actions` | `Array<ActionSchema>` | 否 | 默认不用填写，自动会创建确认和取消按钮。 |
| `body` | `SchemaCollection` | 否 | 内容区域 |
| `className` | `SchemaClassName` | 否 | 配置 外层 className |
| `bodyClassName` | `SchemaClassName` | 否 | 配置 Body 容器 className |
| `headerClassName` | `SchemaClassName` | 否 | 配置 头部 容器 className |
| `footerClassName` | `SchemaClassName` | 否 | 配置 头部 容器 className |
| `closeOnEsc` | `boolean` | 否 | 是否支持按 ESC 关闭 Dialog |
| `name` | `SchemaName` | 否 |  |
| `size` | `'xs' \| 'sm' \| 'md' \| 'lg' \| 'full'` | 否 | Dialog 大小 |
| `title` | `SchemaCollection` | 否 | 请通过配置 title 设置标题 |
| `position` | `'left' \| 'right' \| 'top' \| 'bottom'` | 否 | 从什么位置弹出 |
| `showCloseButton` | `boolean` | 否 | 是否展示关闭按钮 当值为false时，默认开启closeOnOutside |
| `width` | `number \| string` | 否 | 抽屉的宽度 （当position为left \| right时生效） |
| `height` | `number \| string` | 否 | 抽屉的高度 （当position为top \| bottom时生效） |
| `header` | `SchemaCollection` | 否 | 头部 |
| `footer` | `SchemaCollection` | 否 | 底部 |
| `confirm` | `boolean` | 否 | 影响自动生成的按钮，如果自己配置了按钮这个配置无效。 |
| `resizable` | `boolean` | 否 | 是否可以拖动弹窗大小 |
| `overlay` | `boolean` | 否 | 是否显示蒙层 |
| `closeOnOutside` | `boolean` | 否 | 点击外部的时候是否关闭弹框。 |
| `showErrorMsg` | `boolean` | 否 | 是否显示错误信息 |
| `data` | `{ [propName: string]: any` | 否 | 数据映射 |

## 跟原版 amis 差异

（自动 diff vs baidu/amis@6.8.0 待 patch_summarizer 补全）
