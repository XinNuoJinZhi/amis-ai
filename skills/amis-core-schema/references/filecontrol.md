---
component: filecontrol
amis_version: v6.0.0
---

# filecontrol

| 属性 | 类型 | 必选 | 说明 |
|---|---|---|---|
| `type` | `"input-file"` | 是 | 指定为文件上传 |
| `btnLabel` | `string` | 否 | 上传文件按钮说明 |
| `accept` | `string` | 否 | 默认只支持纯文本，要支持其他类型，请配置此属性。建议直接填写文件后缀<br>如：.txt,.csv<br><br>多个类型用逗号隔开。 |
| `capture` | `string` | 否 | 控制 input 标签的 capture 属性，用于移动端拍照或录像。 |
| `asBase64` | `boolean` | 否 | 如果上传的文件比较小可以设置此选项来简单的把文件 base64 的值给 form 一起提交，目前不支持多选。 |
| `asBlob` | `boolean` | 否 | 如果不希望 File 组件上传，可以配置 `asBlob` 或者 `asBase64`，采用这种方式后，组件不再自己上传了，而是直接把文件数据作为表单项的值，文件内容会在 Form 表单提交的接口里面一起带上。 |
| `autoUpload` | `boolean` | 否 | 是否自动开始上传 |
| `chunkApi` | `SchemaApi` | 否 | 默认 `/api/upload/chunk` 想自己存储时才需要关注。 |
| `chunkSize` | `number` | 否 | 分块大小，默认为 5M. |
| `concurrency` | `number` | 否 | 分块上传的并发数 |
| `delimiter` | `string` | 否 | 分割符 |
| `downloadUrl` | `SchemaApi` | 否 | 默认显示文件路径的时候会支持直接下载，<br>可以支持加前缀如：`http://xx.dom/filename=` ，<br>如果不希望这样，可以把当前配置项设置为 `false`。<br><br>1.1.6 版本开始将支持变量 ${xxx} 来自己拼凑个下载地址，并且支持配置成 post. |
| `templateUrl` | `SchemaApi` | 否 | 模板下载地址 |
| `fileField` | `string` | 否 | 默认 `file`, 如果你不想自己存储，则可以忽略此属性。 |
| `finishChunkApi` | `SchemaApi` | 否 | 默认 `/api/upload/finishChunkApi` 想自己存储时才需要关注。 |
| `hideUploadButton` | `boolean` | 否 | 是否隐藏上传按钮 |
| `maxLength` | `number` | 否 | 最多的个数 |
| `maxSize` | `number` | 否 | 默认没有限制，当设置后，文件大小大于此值将不允许上传。 |
| `receiver` | `SchemaApi` | 否 | 默认 `/api/upload/file` 如果想自己存储，请设置此选项。 |
| `startChunkApi` | `string` | 否 | 默认 `/api/upload/startChunk` 想自己存储时才需要关注。 |
| `useChunk` | `boolean \| "auto"` | 否 | 默认为 'auto' amis 所在服务器，限制了文件上传大小不得超出10M，所以 amis 在用户选择大文件的时候，自动会改成分块上传模式。 |
| `btnClassName` | `SchemaClassName` | 否 | 按钮 CSS 类名 |
| `btnUploadClassName` | `SchemaClassName` | 否 | 上传按钮 CSS 类名 |
| `multiple` | `boolean` | 否 | 是否为多选 |
| `joinValues` | `boolean` | 否 | 1. 单选模式：当用户选中某个选项时，选项中的 value 将被作为该表单项的值提交，<br>否则，整个选项对象都会作为该表单项的值提交。<br>2. 多选模式：选中的多个选项的 `value` 会通过 `delimiter` 连接起来，<br>否则直接将以数组的形式提交值。 |
| `extractValue` | `boolean` | 否 | 开启后将选中的选项 value 的值封装为数组，作为当前表单项的值。 |
| `resetValue` | `any` | 否 | 清除时设置的值 |
| `autoFill` | `{ [propName: string]: string; }` | 否 | 上传后把其他字段同步到表单内部。 |
| `initAutoFill` | `boolean` | 否 | 初始化时是否把其他字段同步到表单内部。 |
| `valueField` | `string` | 否 | 接口返回的数据中，哪个用来当做值 |
| `nameField` | `string` | 否 | 接口返回的数据中，哪个用来展示文件名 |
| `urlField` | `string` | 否 | 接口返回的数据中哪个用来作为下载地址。 |
| `stateTextMap` | `{ init: string; pending: string; uploading: string; error: string; uploaded: string; ready: string; }` | 否 | 按钮状态文案配置。 |
| `documentation` | `string` | 否 | 说明文档内容配置 |
| `documentLink` | `string` | 否 | 说明文档链接配置 |
| `drag` | `boolean` | 否 | 是否为拖拽上传 |
