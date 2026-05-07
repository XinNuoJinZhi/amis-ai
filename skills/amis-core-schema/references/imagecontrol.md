---
component: imagecontrol
amis_version: v6.0.0
---

# imagecontrol

| 属性 | 类型 | 必选 | 说明 |
|---|---|---|---|
| `type` | `"input-image"` | 是 | 指定为图片上传控件 |
| `src` | `string` | 否 | 默认展示图片的链接 |
| `imageClassName` | `string` | 否 | 默认展示图片的类名 |
| `accept` | `string` | 否 | 配置接收的图片类型<br><br>建议直接填写文件后缀<br>如：.txt,.csv<br><br>多个类型用逗号隔开。 |
| `allowInput` | `boolean` | 否 | 默认都是通过用户选择图片后上传返回图片地址，如果开启此选项，则可以允许用户图片地址。 |
| `autoUpload` | `boolean` | 否 | 是否自动开始上传 |
| `uploadBtnText` | `string \| TplSchema` | 否 | 上传按钮文案 |
| `btnClassName` | `SchemaClassName` | 否 | 选择图片按钮的 CSS 类名 |
| `btnUploadClassName` | `SchemaClassName` | 否 | 上传按钮的 CSS 类名 |
| `compress` | `boolean` | 否 |  |
| `compressOptions` | `{ maxHeight?: number; maxWidth?: number; }` | 否 |  |
| `crop` | `boolean \| { aspectRatio?: number; guides?: boolean; dragMode?: string; viewMode?: number; rotatable?: boolean; scalable?: boolean; }` | 否 |  |
| `cropFormat` | `string` | 否 | 裁剪后的图片类型 |
| `cropQuality` | `number` | 否 | 裁剪后的质量 |
| `reCropable` | `boolean` | 否 | 是否允许二次裁剪。 |
| `hideUploadButton` | `boolean` | 否 | 是否隐藏上传按钮 |
| `limit` | `{ aspectRatioLabel?: string; aspectRatio?: number; height?: number; width?: number; maxHeight?: number; maxWidth?: number; minHeight?: number; minWidth?: number; }` | 否 | 限制图片大小，超出不让上传。 |
| `maxLength` | `number` | 否 | 最多的个数 |
| `maxSize` | `number` | 否 | 默认没有限制，当设置后，文件大小大于此值将不允许上传。 |
| `receiver` | `SchemaApi` | 否 | 默认 `/api/upload` 如果想自己存储，请设置此选项。 |
| `showCompressOptions` | `boolean` | 否 | 默认为 false, 开启后，允许用户输入压缩选项。 |
| `multiple` | `boolean` | 否 | 是否为多选 |
| `capture` | `string` | 否 | 可配置移动端的拍照功能，比如配置 `camera` 移动端只能拍照，等 |
| `joinValues` | `boolean` | 否 | 单选模式：当用户选中某个选项时，选项中的 value 将被作为该表单项的值提交，否则，整个选项对象都会作为该表单项的值提交。<br>多选模式：选中的多个选项的 `value` 会通过 `delimiter` 连接起来，否则直接将以数组的形式提交值。 |
| `delimiter` | `string` | 否 | 分割符 |
| `extractValue` | `boolean` | 否 | 开启后将选中的选项 value 的值封装为数组，作为当前表单项的值。 |
| `resetValue` | `any` | 否 | 清除时设置的值 |
| `thumbMode` | `"contain" \| "cover" \| "w-full" \| "h-full"` | 否 | 缩路图展示模式 |
| `thumbRatio` | `"1:1" \| "4:3" \| "16:9"` | 否 | 缩路图展示比率。 |
| `autoFill` | `{ [propName: string]: string; }` | 否 | 上传后把其他字段同步到表单内部。 |
| `initAutoFill` | `boolean` | 否 | 初始化时是否把其他字段同步到表单内部。 |
| `initCrop` | `boolean` | 否 | 初始化时是否打开裁剪模式 |
| `dropCrop` | `boolean` | 否 | 图片上传完毕是否进入裁剪模式 |
| `frameImage` | `string` | 否 | 默认占位图图片地址 |
| `fixedSize` | `boolean` | 否 | 是否开启固定尺寸 |
| `fixedSizeClassName` | `SchemaClassName` | 否 | 固定尺寸的 CSS类名 |
| `draggable` | `boolean` | 否 | 是否可拖拽排序 |
| `draggableTip` | `string` | 否 | 可拖拽排序的提示信息。 |
