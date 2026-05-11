# OfficeViewer 组件

OfficeViewer 是一个用于在浏览器中预览 Office 文档（Word、Excel）的组件。它支持通过 URL 加载远程文件，或者直接预览通过 Upload 组件上传的文件（Blob/File 对象）。

## 功能特性

- **Word 预览**: 使用 `docx-preview` 渲染 `.docx` 文件。
- **Excel 预览**: 使用 `xlsx` 库解析并在 Ant Design Table 中展示 `.xlsx`, `.csv`, `.tsv` 文件。
- **远程加载**: 支持配置 `src` 属性为 HTTP/HTTPS URL，组件会自动下载并预览。
- **表单集成**: 可以作为表单项使用，自动获取 `value`（通常是 File 对象或 Upload 组件的 value）。

## 属性 (Props)

| 属性名 | 类型 | 说明 |
|Ref | --- | --- |
| src | `string \| Blob \| File` | 文档地址（URL）或文件对象。如果未提供 `value`，将使用此属性。 |
| value | `string \| Blob \| File \| any[]` | 表单值。优先级高于 `src`。支持 Upload 组件的 fileList 数组。 |
| excelOptions | `{ height?: number }` | Excel 预览配置，目前支持设置高度。 |
| docxOptions | `{ height?: number }` | Word 预览配置，目前支持设置高度。 |

## 使用示例

### 1. 静态 URL 预览

```json
{
  "type": "office-viewer",
  "src": "http://example.com/files/document.docx",
  "docxOptions": {
    "height": 800
  }
}
```

### 2. 在表单中使用（配合 Upload）

OfficeViewer 可以自动消费表单上下文中同名变量的值。

```json
{
  "type": "form",
  "body": [
    {
      "type": "input-file",
      "name": "file",
      "label": "上传文件"
    },
    {
      "type": "office-viewer",
      "name": "file" // 关联同一个 name
    }
  ]
}
```

## 注意事项

- **跨域问题 (CORS)**: 当使用 `src` 加载远程 URL 时，目标服务器必须配置 CORS 响应头（`Access-Control-Allow-Origin`），否则浏览器会拦截请求导致加载失败。
- **文件格式**: 目前仅支持 `.docx` (Word) 和 `.xlsx`/`.csv`/`.tsv` (Excel)。不支持 `.doc` (旧版 Word) 或 `.xls`。
