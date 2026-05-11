---
component: nested-select
source: zc-amis-6.8.0-my242v2
category: patched
zc_suite: other
---

# 级联选择器（type: `nested-select`）

> 适用于选项中含有子项，可通过 source 拉取选项，支持多选

**标签**：表单项
**编辑器面板**：级联选择器
**图标**：`fa fa-indent`
**文档**：`/amis/zh-CN/components/form/nestedselect`
**基础组件**（编辑器内可直接拖拽）

## 默认 scaffold（建议起手用法）

```json
{
  "type": "nested-select",
  "label": "级联选择器",
  "name": "nestedSelect",
  "onlyChildren": true,
  "options": [
    {
      "label": "选项A",
      "value": "A"
    },
    {
      "label": "选项B",
      "value": "B",
      "children": [
        {
          "label": "选项b1",
          "value": "b1"
        },
        {
          "label": "选项b2",
          "value": "b2"
        }
      ]
    },
    {
      "label": "选项C",
      "value": "C",
      "children": [
        {
          "label": "选项c1",
          "value": "c1"
        },
        {
          "label": "选项c2",
          "value": "c2"
        }
      ]
    }
  ]
}
```

## 事件

| eventName | eventLabel |
|---|---|
| `change` | 值变化 |
| `focus` | 获取焦点 |
| `blur` | 失去焦点 |

## 跟原版 amis 差异

（ZC 改造点描述待 patch_summarizer 补全；可参考源码 diff）
