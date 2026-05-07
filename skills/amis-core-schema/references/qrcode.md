---
component: qrcode
amis_version: v6.0.0
---

# qrcode

| 属性 | 类型 | 必选 | 说明 |
|---|---|---|---|
| `type` | `"qrcode" \| "qr-code"` | 是 |  |
| `name` | `string` | 否 | 关联字段名。 |
| `qrcodeClassName` | `SchemaClassName` | 否 | css 类名 |
| `codeSize` | `number` | 否 | 二维码的宽高大小，默认 128 |
| `backgroundColor` | `string` | 否 | 背景色 |
| `foregroundColor` | `string` | 否 | 前景色 |
| `level` | `"L" \| "M" \| "Q" \| "H"` | 否 | 二维码复杂级别 |
| `placeholder` | `string` | 否 | 占位符 |
| `imageSettings` | `QRCodeImageSettings` | 否 | 图片配置 |
