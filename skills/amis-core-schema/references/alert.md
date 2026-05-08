---
component: alert
amis_version: v6.0.0
---

# alert

| 属性 | 类型 | 必选 | 说明 |
|---|---|---|---|
| `type` | `"alert"` | 是 | 指定为提示框类型 |
| `title` | `string` | 否 | 提示框标题 |
| `body` | `SchemaCollection` | 是 | 内容区域 |
| `level` | `"info" \| "success" \| "warning" \| "danger"` | 否 | 提示类型 |
| `showCloseButton` | `boolean` | 否 | 是否显示关闭按钮 |
| `closeButtonClassName` | `string` | 否 | 关闭按钮CSS类名 |
| `showIcon` | `boolean` | 否 | 是否显示ICON |
| `icon` | `string` | 否 | 左侧图标 |
| `iconClassName` | `string` | 否 | 图标CSS类名 |
| `actions` | `SchemaCollection` | 否 | 操作区域 |
