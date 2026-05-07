---
component: inputexcelcontrol
amis_version: v6.0.0
---

# inputexcelcontrol

| 属性 | 类型 | 必选 | 说明 |
|---|---|---|---|
| `type` | `"input-excel"` | 是 | 指定为 Excel 解析 |
| `allSheets` | `boolean` | 否 | 是否解析所有 sheet，默认情况下只解析第一个 |
| `parseMode` | `"object" \| "array"` | 否 | 解析模式，array 是解析成二维数组，object 是将第一列作为字段名，解析为对象数组 |
| `includeEmpty` | `boolean` | 否 | 是否包含空内容，主要用于二维数组模式 |
| `plainText` | `boolean` | 否 | 纯文本模式 |
| `parseImage` | `boolean` | 否 | 解析图片 |
| `imageDataURI` | `boolean` | 否 | 图片解析结果使用 data URI 格式 |
| `placeholder` | `string` | 否 | 占位文本提示 |
| `autoFill` | `{ [propName: string]: string; }` | 否 | 文件解析完成后将字段同步到表单内部 |
