---
component: wizard
amis_version: v6.0.0
---

# wizard

| 属性 | 类型 | 必选 | 说明 |
|---|---|---|---|
| `type` | `"wizard"` | 是 | 指定为表单向导 |
| `actionClassName` | `SchemaClassName` | 否 | 配置按钮 className |
| `actionFinishLabel` | `string` | 否 | 完成按钮的文字描述 |
| `actionNextLabel` | `string` | 否 | 下一步按钮的文字描述 |
| `actionNextSaveLabel` | `string` | 否 | 下一步并且保存按钮的文字描述 |
| `actionPrevLabel` | `string` | 否 | 上一步按钮的文字描述 |
| `api` | `SchemaApi` | 否 | Wizard 用来保存数据的 api。<br>[详情](https://baidu.github.io/amis/docs/api#wizard) |
| `bulkSubmit` | `boolean` | 否 | 是否合并后再提交 |
| `initApi` | `SchemaApi` | 否 | Wizard 用来获取初始数据的 api。 |
| `mode` | `"vertical" \| "horizontal"` | 否 | 展示模式 |
| `name` | `string` | 否 |  |
| `readOnly` | `boolean` | 否 | 是否为只读模式。 |
| `redirect` | `string` | 否 | 保存完后，可以指定跳转地址，支持相对路径和组内绝对路径，同时可以通过 $xxx 使用变量 |
| `reload` | `string` | 否 |  |
| `target` | `string` | 否 | 默认表单提交自己会通过发送 api 保存数据，但是也可以设定另外一个 form 的 name 值，或者另外一个 `CRUD` 模型的 name 值。 如果 target 目标是一个 `Form` ，则目标 `Form` 会重新触发 `initApi` 和 `schemaApi`，api 可以拿到当前 form 数据。如果目标是一个 `CRUD` 模型，则目标模型会重新触发搜索，参数为当前 Form 数据。 |
| `affixFooter` | `boolean \| "always"` | 否 | 是否将底部按钮固定在底部。 |
| `steps` | `WizardStepSchema[]` | 是 |  |
| `startStep` | `string` | 否 |  |
| `stepsClassName` | `string` | 否 | 步骤条区域css类 |
| `bodyClassName` | `string` | 否 | 表单区域css类 |
| `stepClassName` | `string` | 否 | step + body区域css类 |
| `footerClassName` | `string` | 否 | 底部操作栏的css类 |
| `wrapWithPanel` | `boolean` | 否 | 是否用panel包裹 |
