---
component: progress
amis_version: v6.0.0
---

# progress

| 属性 | 类型 | 必选 | 说明 |
|---|---|---|---|
| `type` | `"progress"` | 是 |  |
| `name` | `string` | 否 | 关联字段名 |
| `value` | `number` | 是 | 进度值 |
| `mode` | `"circle" \| "line" \| "dashboard"` | 是 | 进度条类型 |
| `progressClassName` | `SchemaClassName` | 否 | 进度条 CSS 类名 |
| `map` | `ColorMapType` | 否 | 配置不同的值段，用不同的样式提示用户 |
| `showLabel` | `boolean` | 否 | 是否显示值 |
| `placeholder` | `string` | 否 | 占位符 |
| `stripe` | `boolean` | 否 | 是否显示背景间隔 |
| `animate` | `boolean` | 否 | 是否显示动画（只有在开启的时候才能看出来） |
| `strokeWidth` | `number` | 否 | 进度条线的宽度 |
| `gapDegree` | `number` | 否 | 仪表盘进度条缺口角度，可取值 0 ~ 295 |
| `gapPosition` | `"top" \| "right" \| "bottom" \| "left"` | 否 | 仪表盘进度条缺口位置 |
| `valueTpl` | `string` | 否 | 内容的模板函数 |
| `threshold` | `{ value: SchemaTpl; color?: string; } \| { value: SchemaTpl; color?: string; }[]` | 否 | 阈值 |
| `showThresholdText` | `boolean` | 否 | 是否显示阈值数值 |
