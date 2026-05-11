---
component: select
source: zc-amis-6.8.0-my242v2
category: patched
zc_suite: other
---

# 下拉框（type: `select`）

> 支持多选，输入提示，可使用 source 获取选项

**标签**：表单项
**编辑器面板**：下拉框
**图标**：`fa fa-th-list`
**文档**：`/amis/zh-CN/components/form/select`
**基础组件**（编辑器内可直接拖拽）

## 默认 scaffold（建议起手用法）

```json
{
  "type": "select",
  "label": "选项",
  "name": "select",
  "options": [
    {
      "label": "选项A",
      "value": "A"
    },
    {
      "label": "选项B",
      "value": "B"
    }
  ]
}
```

## 跟原版 amis 差异

（ZC 改造点描述待 patch_summarizer 补全；可参考源码 diff）
