---
component: jsonschemaeditorcontrol
amis_version: v6.0.0
---

# jsonschemaeditorcontrol

| 属性 | 类型 | 必选 | 说明 |
|---|---|---|---|
| `type` | `"json-schema-editor"` | 是 | 指定为 JSON Schema Editor |
| `definitions` | `{ [propName: string]: { [propName: string]: any; title: string; type: 'string' \| 'number' \| 'integer' \| 'object' \| 'array' \| 'boolean' \| 'null'; }; }` | 否 | 可以理解为类型模板，方便快速定义复杂类型 |
| `rootTypeMutable` | `boolean` | 否 | 顶层是否允许修改类型 |
| `showRootInfo` | `boolean` | 否 | 顶层类型信息是否隐藏 |
| `disabledTypes` | `string[]` | 否 | 禁用类型，默认禁用了 null 类型 |
| `enableAdvancedSetting` | `boolean` | 否 | 开启详情配置 |
| `advancedSettings` | `{ [propName: string]: any; }` | 否 | 自定义详情配置面板如：<br><br>{<br>  boolean: [<br>     {type: "input-text", name: "aa", label: "AA" }<br>  ]<br>}<br><br>当配置布尔字段详情时，就会出现以上配置 |
| `placeholder` | `SchemaEditorItemPlaceholder` | 否 | 各属性输入控件的占位提示文本<br><br>{<br>  key: "key placeholder",<br>  title: "title placeholder",<br>  description: "description placeholder",<br>  default: "default placeholder"<br>} |
