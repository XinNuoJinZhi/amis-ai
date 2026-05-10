---
component: input-image
source: zc-amis-6.8.0-my242v2
category: patched
zc_suite: other
---

# 图片上传（type: `input-image`）

> 可以对图片实现裁剪，限制图片的宽高以及大小，支持自动上传及上传多张图片

**标签**：表单项
**图标**：`fa fa-crop`
**文档**：`/amis/zh-CN/components/form/input-image`
**基础组件**（编辑器内可直接拖拽）

## 默认 scaffold（建议起手用法）

```json
{
  "type": "input-image",
  "label": "图片上传",
  "name": "image",
  "autoUpload": true,
  "proxy": true,
  "uploadType": "fileReceptor",
  "imageClassName": "r w-full"
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
