---
component: breadcrumb
source: zc-amis-6.8.0-my242v2
category: patched
zc_suite: other
---

# 面包屑（type: `breadcrumb`）

> 面包屑导航

**标签**：其他
**编辑器面板**：面包屑
**图标**：`fa fa-list`
**文档**：`/amis/zh-CN/components/breadcrumb`
**基础组件**（编辑器内可直接拖拽）

## 默认 scaffold（建议起手用法）

```json
{
  "type": "breadcrumb",
  "items": [
    {
      "label": "首页",
      "href": "/",
      "icon": "fa fa-home"
    },
    {
      "label": "上级页面"
    },
    {
      "label": "<b>当前页面</b>"
    }
  ]
}
```

## 跟原版 amis 差异

（ZC 改造点描述待 patch_summarizer 补全；可参考源码 diff）
