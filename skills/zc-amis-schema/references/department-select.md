---
component: department-select
source: zc-amis-6.8.0-my242v2
category: new
zc_suite: oa
---

# 部门选择（type: `department-select`）

> 可以用来点选部门信息

**标签**：表单项
**编辑器面板**：下拉框
**图标**：`fa fa-group`
**文档**：`/amis/zh-CN/components/department-select`
**基础组件**（编辑器内可直接拖拽）

## 默认 scaffold（建议起手用法）

```json
{
    type: 'department-select',
    label: '部门信息',
    multiple: false,
    name: 'department',
    showIcon: true,
    // options:
    source: {
      "url": "app://department/source",
    }
  }
```

## 事件

| eventName | eventLabel |
|---|---|
| `change` | 值变化 |
| `focus` | 获取焦点 |
| `blur` | 失去焦点 |
| `add` | 新增选项 |
| `edit` | 编辑选项 |
| `delete` | 删除选项 |
