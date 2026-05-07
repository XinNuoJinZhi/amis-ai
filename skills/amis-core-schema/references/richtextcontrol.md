---
component: richtextcontrol
amis_version: v6.0.0
---

# richtextcontrol

| 属性 | 类型 | 必选 | 说明 |
|---|---|---|---|
| `type` | `"input-rich-text"` | 是 |  |
| `vendor` | `"froala" \| "tinymce"` | 否 | 编辑器类型 |
| `receiver` | `SchemaApi` | 否 | 图片保存 API |
| `videoReceiver` | `SchemaApi` | 否 | 视频保存 API |
| `fileField` | `string` | 否 | 接收器的字段名 |
| `borderMode` | `"none" \| "full" \| "half"` | 否 | 边框模式，全边框，还是半边框，或者没边框。 |
| `options` | `any` | 否 | tinymce 或 froala 的配置 |
