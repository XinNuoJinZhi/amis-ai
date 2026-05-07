---
component: tasks
amis_version: v6.0.0
---

# tasks

| 属性 | 类型 | 必选 | 说明 |
|---|---|---|---|
| `type` | `"tasks"` | 是 | 指定为任务类型 |
| `btnClassName` | `SchemaClassName` | 否 |  |
| `btnText` | `string` | 否 | 操作按钮文字 |
| `checkApi` | `SchemaApi` | 否 | 用来获取任务状态的 API，当没有进行时任务时不会发送。 |
| `interval` | `number` | 否 | 当有任务进行中，会每隔一段时间再次检测，而时间间隔就是通过此项配置，默认 3s。 |
| `items` | `{ key?: string; label?: string; remark?: string; status?: 0 \| 1 \| 2 \| 3 \| 4 \| 5; }[]` | 否 |  |
| `name` | `string` | 否 |  |
| `operationLabel` | `string` | 否 | 操作列说明 |
| `reSubmitApi` | `SchemaApi` | 否 | 如果任务失败，且可以重试，提交的时候会使用此 API |
| `remarkLabel` | `string` | 否 | 备注列说明 |
| `retryBtnClassName` | `SchemaClassName` | 否 | 配置容器重试按钮 className |
| `retryBtnText` | `string` | 否 | 重试操作按钮文字 |
| `statusLabel` | `string` | 否 | 状态列说明 |
| `statusLabelMap` | `string[]` | 否 | 状态显示对应的类名配置。 |
| `statusTextMap` | `string[]` | 否 | 状态显示对应的文字显示配置。 |
| `submitApi` | `SchemaApi` | 否 | 提交任务使用的 API |
| `tableClassName` | `SchemaClassName` | 否 | 配置 table className |
| `taskNameLabel` | `string` | 否 | 任务名称列说明 |
| `initialStatusCode` | `number` | 否 |  |
| `readyStatusCode` | `number` | 否 |  |
| `loadingStatusCode` | `number` | 否 |  |
| `canRetryStatusCode` | `number` | 否 |  |
| `finishStatusCode` | `number` | 否 |  |
| `errorStatusCode` | `number` | 否 |  |
