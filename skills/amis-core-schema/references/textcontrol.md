---
component: textcontrol
amis_version: v6.0.0
---

# textcontrol

| 属性 | 类型 | 必选 | 说明 |
|---|---|---|---|
| `type` | `"input-text" \| "input-password" \| "input-email" \| "input-url" \| "native-date" \| "native-time" \| "native-number"` | 是 |  |
| `addOn` | `{ position?: 'left' \| 'right'; label?: string; icon?: string; className?: string; } & ActionSchema` | 否 |  |
| `trimContents` | `boolean` | 否 | 是否去除首尾空白文本。 |
| `autoComplete` | `SchemaApi` | 否 | 自动完成 API，当输入部分文字的时候，会将这些文字通过 ${term} 可以取到，发送给接口。<br>接口可以返回匹配到的选项，帮助用户输入。 |
| `nativeAutoComplete` | `string` | 否 | 配置原生 input 的 autoComplete 属性 |
| `borderMode` | `"none" \| "full" \| "half"` | 否 | 边框模式，全边框，还是半边框，或者没边框。 |
| `minLength` | `number` | 否 | 限制文字最小输入个数 |
| `maxLength` | `number` | 否 | 限制文字最大输入个数 |
| `showCounter` | `boolean` | 否 | 是否显示计数 |
| `prefix` | `string` | 否 | 前缀 |
| `suffix` | `string` | 否 | 后缀 |
| `transform` | `{ lowerCase?: boolean; upperCase?: boolean; }` | 否 | 自动转换值 |
| `inputControlClassName` | `string` | 否 | control节点的CSS类名 |
| `nativeInputClassName` | `string` | 否 | 原生input标签的CSS类名 |
| `clearValueOnEmpty` | `boolean` | 否 | 在内容为空的时候清除值 |
