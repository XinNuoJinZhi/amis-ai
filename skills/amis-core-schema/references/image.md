---
component: image
amis_version: v6.0.0
---

# image

| 属性 | 类型 | 必选 | 说明 |
|---|---|---|---|
| `type` | `"image" \| "static-image"` | 是 | 指定为图片展示类型 |
| `defaultImage` | `string` | 否 | 默认图片地址 |
| `title` | `string` | 否 | 图片标题 |
| `name` | `string` | 否 | 关联字段名，也可以直接配置 src |
| `imageCaption` | `string` | 否 | 图片描述信息 |
| `src` | `string` | 否 | 图片地址，如果配置了 name，这个属性不用配置。 |
| `originalSrc` | `string` | 否 | 大图地址，不设置用 src |
| `enlargeAble` | `boolean` | 否 | 是否启动放大功能。 |
| `enlargeWithGallary` | `boolean` | 否 | 放大时是否显示图片集 |
| `alt` | `string` | 否 | 是否显示尺寸。<br>图片无法显示时的替换文本 |
| `height` | `number` | 否 | 高度 |
| `width` | `number` | 否 | 宽度 |
| `className` | `SchemaClassName` | 否 | 外层 css 类名 |
| `innerClassName` | `SchemaClassName` | 否 | 组件内层 css 类名 |
| `imageClassName` | `SchemaClassName` | 否 | 图片 css 类名 |
| `thumbClassName` | `SchemaClassName` | 否 | 图片缩略图外层 css 类名 |
| `imageGallaryClassName` | `SchemaClassName` | 否 | 放大详情图 CSS 类名 |
| `caption` | `string` | 否 | 图片说明文字 |
| `imageMode` | `"thumb" \| "original"` | 否 | 图片展示模式，默认为缩略图模式、可以配置成原图模式 |
| `thumbMode` | `"contain" \| "cover" \| "w-full" \| "h-full"` | 否 | 预览图模式 |
| `thumbRatio` | `"1:1" \| "4:3" \| "16:9"` | 否 | 预览图比率 |
| `href` | `string` | 否 | 链接地址 |
| `blank` | `boolean` | 否 | 是否新窗口打开 |
| `htmlTarget` | `string` | 否 | 链接的 target |
| `showToolbar` | `boolean` | 否 | 是否展示图片工具栏 |
| `toolbarActions` | `ImageToolbarAction[]` | 否 | 工具栏配置 |
