---
component: combo
source: zc-amis-6.8.0-my242v2
category: patched
zc_suite: other
---

# 组合输入（type: `combo`）

> 多个表单项的组合，可配置是否增加和删除初始设定的模板

**标签**：表单项
**编辑器面板**：组合输入
**图标**：`fa fa-group`
**文档**：`/amis/zh-CN/components/form/combo`
**基础组件**（编辑器内可直接拖拽）

## 默认 scaffold（建议起手用法）

```json
{
  "type": "combo",
  "label": "组合输入",
  "name": "combo",
  "multiple": true,
  "addable": true,
  "removable": true,
  "removableMode": "icon",
  "addBtn": {
    "label": "新增",
    "icon": "fa fa-plus",
    "level": "primary",
    "size": "sm"
  },
  "items": [
    {
      "type": "input-text",
      "name": "text",
      "placeholder": "文本"
    },
    {
      "type": "select",
      "name": "select",
      "placeholder": "选项",
      "options": [
        {
          "label": "A",
          "value": "a"
        },
        {
          "label": "B",
          "value": "b"
        }
      ]
    }
  ]
}
```

## 事件

| eventName | eventLabel |
|---|---|
| `add` | 添加 |
| `delete` | 删除 |
| `dragEnd` | 拖拽结束 |
| `tabsChange` | 切换tab |

## 跟原版 amis 差异

（ZC 改造点描述待 patch_summarizer 补全；可参考源码 diff）
