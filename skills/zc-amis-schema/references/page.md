---
component: page
source: zc-amis-6.8.0-my242v2
category: patched
zc_suite: other
---

# 页面（type: `page`）

> 页面渲染器，页面的顶级入口。包含多个区域，您可以选择在不同的区域里面放置不同的渲染器。

**编辑器面板**：页面
**图标**：`fa fa-desktop`
**文档**：`/amis/zh-CN/components/page`
**基础组件**（编辑器内可直接拖拽）

## 默认 scaffold（建议起手用法）

```json
{
  "type": "page",
  "regions": [
    "body"
  ],
  "body": [
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

## 跟原版 amis 差异

（ZC 改造点描述待 patch_summarizer 补全；可参考源码 diff）
