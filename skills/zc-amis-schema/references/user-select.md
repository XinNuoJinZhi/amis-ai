---
component: user-select
source: zc-amis-6.8.0-my242v2
category: new
zc_suite: oa
---

# 人员选择（type: `user-select`）

> 可以用来点选人员信息

**标签**：表单项
**编辑器面板**：表格编辑
**图标**：`fa fa-user`
**文档**：`/amis/zh-CN/components/user-select`
**基础组件**（编辑器内可直接拖拽）

## 默认 scaffold（建议起手用法）

```json
{
    type: 'user-select',
    name: 'user',
    label: '人员选择',
    // displayType: 'simple',
    "multiple": false,
    "sortable": true,
    "searchable": true,
    "selectMode": "associated",
    "leftMode": "tree",
    "searchApi": "app://user/search?term=${term}",
    "deferApi": "app://user/defer?departmentId=${ref}&parentId=${value}",
    "source": "app://user/source",
  }
```
