---
component: input-tree
source: zc-amis-6.8.0-my242v2
category: patched
zc_suite: other
---

# item（type: `input-tree`）

> 新增数据项

**标签**：表单项
**编辑器面板**：树选择
**图标**：`fa fa-list-alt`
**文档**：`/amis/zh-CN/components/form/input-tree`
**基础组件**（编辑器内可直接拖拽）

## 默认 scaffold（建议起手用法）

```json
{
  "type": "input-tree",
  "label": "树组件",
  "name": "tree",
  "options": [
    {
      "label": "选项A",
      "value": "A",
      "children": [
        {
          "label": "选项C",
          "value": "C"
        },
        {
          "label": "选项D",
          "value": "D"
        }
      ]
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
