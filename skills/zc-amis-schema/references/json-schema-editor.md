---
component: json-schema-editor
source: zc-amis-6.8.0-my242v2
category: patched
zc_suite: other
---

# json-schema-editor

> 运行时 schema 接口：`JSONSchemaEditorControlSchema`（extends `Omit<FormBaseControlSchema, 'placeholder'>`）

## 属性

| 属性 | 类型 | 必选 | 说明 |
|---|---|---|---|
| `type` | `"json-schema-editor"` | 是 | 指定类型 |
| `definitions` | `{ [propName: string]: { title: string` | 否 | 可以理解为类型模板，方便快速定义复杂类型 |
| `type` | `\| 'string' \| 'number' \| 'integer' \| 'object' \| 'arra...` | 是 |  |
| `rootTypeMutable` | `boolean` | 否 | 顶层是否允许修改类型 |
| `showRootInfo` | `boolean` | 否 | 顶层类型信息是否隐藏 |
| `disabledTypes` | `Array<string>` | 否 | 禁用类型，默认禁用了 null 类型 |
| `enableAdvancedSetting` | `boolean` | 否 | 开启详情配置 |
| `advancedSettings` | `{ [propName: string]: any` | 否 | 自定义详情配置面板如： {   boolean: [      {type: "input-text", name: "aa", label: "AA" ... |
| `placeholder` | `SchemaEditorItemPlaceholder` | 否 | 各属性输入控件的占位提示文本 {   key: "key placeholder",   title: "title placeholder",   de... |
| `titleAndKey` | `boolean` | 否 |  |
| `mini` | `boolean` | 否 | 是否为迷你模式，会隐藏一些不必要的元素 |

## 跟原版 amis 差异

（自动 diff vs baidu/amis@6.8.0 待 patch_summarizer 补全）
