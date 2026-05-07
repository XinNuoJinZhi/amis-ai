---
component: images
amis_version: v6.0.0
---

# images

| 属性 | 类型 | 必选 | 说明 |
|---|---|---|---|
| `type` | `"images" \| "static-images"` | 是 | 指定为图片集渲染器 |
| `defaultImage` | `string` | 否 | 默认图片地址 |
| `placeholder` | `string` | 否 | 列表为空时显示 |
| `delimiter` | `string` | 否 | 配置值的连接符 |
| `thumbMode` | `"contain" \| "cover" \| "w-full" \| "h-full"` | 否 | 预览图模式 |
| `thumbRatio` | `"1:1" \| "4:3" \| "16:9"` | 否 | 预览图比率 |
| `name` | `string` | 否 | 关联字段名，也可以直接配置 src |
| `value` | `any` | 否 |  |
| `source` | `string` | 否 |  |
| `options` | `any[]` | 否 |  |
| `src` | `string` | 否 | 图片地址，默认读取数据中的 image 属性，如果不是请配置 ,如  ${imageUrl} |
| `originalSrc` | `string` | 否 | 大图地址，不设置用 src 属性，如果不是请配置，如：${imageOriginUrl} |
| `enlargeAble` | `boolean` | 否 | 是否启动放大功能。 |
| `enlargetWithImages` | `boolean` | 否 | 放大时是否显示图片集 |
| `showDimensions` | `boolean` | 否 | 是否显示尺寸。 |
| `className` | `SchemaClassName` | 否 | 外层 CSS 类名 |
| `listClassName` | `SchemaClassName` | 否 | 列表 CSS 类名 |
| `imageGallaryClassName` | `SchemaClassName` | 否 | 放大详情图 CSS 类名 |
| `showToolbar` | `boolean` | 否 | 是否展示图片工具栏 |
| `toolbarActions` | `ImageToolbarAction[]` | 否 | 工具栏配置 |
