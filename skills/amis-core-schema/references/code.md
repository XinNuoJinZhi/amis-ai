---
component: code
amis_version: v6.0.0
---

# code

| 属性 | 类型 | 必选 | 说明 |
|---|---|---|---|
| `type` | `"code"` | 是 |  |
| `language` | `string` | 否 | 语言类型 |
| `editorTheme` | `EditorNamespace.BuiltinTheme` | 否 |  |
| `tabSize` | `number` | 否 | tab 大小 |
| `wordWrap` | `boolean` | 否 | 是否折行 |
| `customLang` | `CustomLang` | 否 | 自定义语言 |
| `wrapperComponent` | `string` | 否 | 使用的标签，默认多行使用pre，单行使用code |
| `maxHeight` | `number` | 否 | 最大高度，单位为px |
