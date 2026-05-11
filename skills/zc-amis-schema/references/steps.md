---
component: steps
source: zc-amis-6.8.0-my242v2
category: patched
zc_suite: other
---

# 步骤条（type: `steps`）

> Steps 步骤条

**标签**：展示
**编辑器面板**：Steps
**图标**：`fa fa-forward`
**文档**：`/amis/zh-CN/components/steps`
**基础组件**（编辑器内可直接拖拽）

## 默认 scaffold（建议起手用法）

```json
{
  "type": "steps",
  "value": 1,
  "steps": [
    {
      "title": "第一步",
      "subTitle": "副标题",
      "description": "描述"
    },
    {
      "title": "第二步"
    },
    {
      "title": "第三步"
    }
  ]
}
```

## 跟原版 amis 差异

（ZC 改造点描述待 patch_summarizer 补全；可参考源码 diff）
