---
component: doc-entity
source: zc-amis-6.8.0-my242v2
category: new
zc_suite: model
---

# 文档实体（type: `doc-entity`）

> Form渲染器，Form的顶级入口。

**编辑器面板**：文档实体
**图标**：`fa fa-desktop`
**基础组件**（编辑器内可直接拖拽）

## 默认 scaffold（建议起手用法）

```json
{
  "type": "doc-entity",
  "regions": [
    "fields"
  ],
  "fields": [
    {
      "type": "tpl",
      "tpl": "内容"
    }
  ]
}
```

## 事件

| eventName | eventLabel |
|---|---|
| `init` | 初始化 |
| `inited` | 初始化数据接口请求完成 |
| `pullRefresh` | 下拉刷新 |
