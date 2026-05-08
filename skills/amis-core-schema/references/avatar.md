---
component: avatar
amis_version: v6.0.0
---

# avatar

| 属性 | 类型 | 必选 | 说明 |
|---|---|---|---|
| `type` | `"avatar"` | 是 |  |
| `className` | `SchemaClassName` | 否 | 类名 |
| `style` | `{ [propName: string]: any; }` | 否 | 自定义样式 |
| `badge` | `BadgeObject` | 否 | 角标 |
| `src` | `string` | 否 | 图片地址 |
| `icon` | `string` | 否 | 图标 |
| `fit` | `"fill" \| "contain" \| "cover" \| "none" \| "scale-down"` | 否 | 图片相对于容器的缩放方式 |
| `shape` | `"circle" \| "square" \| "rounded"` | 否 | 形状 |
| `size` | `number \| "small" \| "default" \| "large"` | 否 | 大小 |
| `text` | `string` | 否 | 文本 |
| `gap` | `number` | 否 | 字符类型距离左右两侧边界单位像素 |
| `alt` | `string` | 否 | 图片无法显示时的替换文字地址 |
| `draggable` | `boolean` | 否 | 图片是否允许拖动 |
| `crossOrigin` | `"" \| "anonymous" \| "use-credentials"` | 是 | 图片CORS属性 |
| `onError` | `string` | 否 | 图片加载失败的是否默认处理，字符串函数 |
