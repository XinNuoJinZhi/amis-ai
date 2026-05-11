---
component: input-table
source: zc-amis-6.8.0-my242v2
category: patched
zc_suite: other
---

# 表格编辑框（type: `input-table`）

> 可以用来展现数据的,可以用来展示数组类型的数据，比如 multiple  的子 form

**标签**：表单项
**编辑器面板**：表格编辑
**图标**：`fa fa-table`
**文档**：`/amis/zh-CN/components/form/input-table`
**基础组件**（编辑器内可直接拖拽）

## 默认 scaffold（建议起手用法）

```json
{
  "type": "input-table",
  "name": "table",
  "label": "表格表单",
  "columns": [
    {
      "label": "名称",
      "name": "name",
      "quickEdit": {
        "type": "input-text",
        "name": "name1"
      }
    },
    {
      "label": "分数",
      "name": "score",
      "quickEdit": {
        "type": "input-number",
        "mode": "inline",
        "name": "score"
      }
    },
    {
      "label": "等级",
      "name": "level",
      "quickEdit": {
        "type": "select",
        "name": "level",
        "options": [
          {
            "label": "A",
            "value": "A"
          },
          {
            "label": "B",
            "value": "B"
          },
          {
            "label": "C",
            "value": "C"
          }
        ]
      }
    }
  ],
  "addable": false,
  "footerAddBtn": {
    "label": "新增",
    "icon": "fa fa-plus"
  },
  "strictMode": true
}
```

## 事件

| eventName | eventLabel |
|---|---|
| `add` | 添加行 |
| `addConfirm` | 确认添加 |
| `addSuccess` | 添加成功 |
| `addFail` | 添加失败 |
| `edit` | 编辑行 |
| `editConfirm` | 确认编辑 |
| `editSuccess` | 编辑成功 |
| `editFail` | 编辑失败 |
| `delete` | 删除行 |
| `deleteSuccess` | 删除成功 |
| `deleteFail` | 删除失败 |
| `change` | 值变化 |
| `orderChange` | 行排序 |
| `rowClick` | 行单击 |
| `rowDbClick` | 行双击 |
| `rowMouseEnter` | 鼠标移入行事件 |
| `rowMouseLeave` | 鼠标移出行事件 |

## 跟原版 amis 差异

（ZC 改造点描述待 patch_summarizer 补全；可参考源码 diff）
