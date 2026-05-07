---
component: json
amis_version: v6.0.0
---

# json

| 属性 | 类型 | 必选 | 说明 |
|---|---|---|---|
| `type` | `"json" \| "static-json"` | 是 | 指定为Json展示类型 |
| `value` | `any[] \| Record<string, any>` | 否 | 要展示的 JSON 数据 |
| `levelExpand` | `number` | 否 | 默认展开的级别 |
| `source` | `string` | 否 | 支持从数据链取值 |
| `mutable` | `boolean` | 否 | 是否可修改 |
| `displayDataTypes` | `boolean` | 否 | 是否显示数据类型 |
| `enableClipboard` | `boolean` | 否 | 是否可复制 |
| `iconStyle` | `"circle" \| "square" \| "triangle"` | 否 | 图标风格 |
| `quotesOnKeys` | `boolean` | 否 | 是否显示键的引号 |
| `sortKeys` | `boolean` | 否 | 是否为键排序 |
| `ellipsisThreshold` | `number \| false` | 否 | 设置字符串的最大展示长度，超出长度阈值的字符串将被截断，点击value可切换字符串展示方式，默认为false |
