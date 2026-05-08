---
component: steps
amis_version: v6.0.0
---

# steps

| 属性 | 类型 | 必选 | 说明 |
|---|---|---|---|
| `type` | `"steps"` | 是 | 指定为 Steps 步骤条渲染器 |
| `steps` | `StepSchema[]` | 否 | 步骤 |
| `source` | `string` | 否 | API 或 数据映射 |
| `value` | `string \| number` | 否 | 指定当前步骤 |
| `name` | `string` | 否 | 变量映射 |
| `status` | `any` | 否 |  |
| `mode` | `"vertical" \| "horizontal"` | 否 | 展示模式 |
| `labelPlacement` | `"vertical" \| "horizontal"` | 否 | 标签放置位置 |
| `progressDot` | `boolean` | 否 | 点状步骤条 |
