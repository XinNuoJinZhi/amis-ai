---
component: input-file
source: zc-amis-6.8.0-my242v2
category: patched
zc_suite: other
---

# 文件上传（type: `input-file`）

> 可上传多个文件，可配置是否自动上传以及大文件分片上传

**标签**：表单项
**图标**：`fa fa-upload`
**文档**：`/amis/zh-CN/components/form/input-file`
**基础组件**（编辑器内可直接拖拽）

## 默认 scaffold（建议起手用法）

```json
{
  "type": "input-file",
  "label": "文件上传",
  "autoUpload": true,
  "proxy": true,
  "uploadType": "fileReceptor",
  "name": "file"
}
```

## 事件

| eventName | eventLabel |
|---|---|
| `change` | 值变化 |
| `remove` | 移除文件 |
| `success` | 上传成功 |
| `fail` | 上传失败 |

## 跟原版 amis 差异

（ZC 改造点描述待 patch_summarizer 补全；可参考源码 diff）
