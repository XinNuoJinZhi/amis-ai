---
component: crud
source: zc-amis-6.8.0-my242v2
category: patched
zc_suite: other
---

# 增删改查（type: `crud`）

> 用来实现对数据的增删改查，支持三种模式展示：table、cards和list. 负责数据的拉取，分页，单条操作，批量操作，排序，快速编辑等等功能。集成查询条件。

**标签**：数据容器
**编辑器面板**：增删改查
**图标**：`fa fa-table`
**文档**：`/amis/zh-CN/components/crud`
**基础组件**（编辑器内可直接拖拽）

## 默认 scaffold（建议起手用法）

```json
{
  "type": "crud",
  "syncLocation": false,
  "api": "",
  "columns": [
    {
      "name": "id",
      "label": "ID",
      "type": "text"
    },
    {
      "name": "engine",
      "label": "渲染引擎",
      "type": "text"
    }
  ],
  "bulkActions": [],
  "itemActions": []
}
```

## 事件

| eventName | eventLabel |
|---|---|
| `fetchInited` | 初始化数据接口请求完成 |
| `selectedChange` | 选择表格项 |
| `columnSort` | 列排序 |
| `columnFilter` | 列筛选 |
| `columnSearch` | 列搜索 |
| `orderChange` | 行排序 |
| `columnToggled` | 列显示变化 |
| `rowClick` | 行单击 |
| `rowMouseEnter` | 鼠标移入行事件 |
| `rowMouseLeave` | 鼠标移出行事件 |

## 跟原版 amis 差异

（ZC 改造点描述待 patch_summarizer 补全；可参考源码 diff）
