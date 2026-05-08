---
component: ratingcontrol
amis_version: v6.0.0
---

# ratingcontrol

| 属性 | 类型 | 必选 | 说明 |
|---|---|---|---|
| `type` | `"input-rating"` | 是 |  |
| `count` | `number` | 否 | 分数 |
| `half` | `boolean` | 否 | 允许半颗星 |
| `allowClear` | `boolean` | 否 | 是否允许再次点击后清除 |
| `readonly` | `boolean` | 否 | 是否只读 |
| `colors` | `string \| { [propName: string]: string; }` | 否 | 星星被选中的颜色 |
| `inactiveColor` | `string` | 否 | 未被选中的星星的颜色 |
| `texts` | `{ [propName: string]: string; }` | 否 | 星星被选中时的提示文字 |
| `textPosition` | `textPositionType` | 否 | 文字的位置 |
| `char` | `string` | 否 | 自定义字符 |
| `charClassName` | `string` | 否 | 自定义字符类名 |
| `textClassName` | `string` | 否 | 自定义文字类名 |
