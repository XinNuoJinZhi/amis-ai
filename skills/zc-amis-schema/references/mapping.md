---
component: mapping
source: zc-amis-6.8.0-my242v2
category: patched
zc_suite: reportforms
---

# 映射（type: `mapping`）

> 对现有值做映射展示，比如原始值是：1、2、3...，需要展示成：下线、上线、过期等等。

**标签**：展示
**编辑器面板**：映射
**图标**：`fa fa-exchange`
**文档**：`/amis/zh-CN/components/mapping`
**基础组件**（编辑器内可直接拖拽）

## 默认 scaffold（建议起手用法）

```json
{
    type: 'mapping',
    value: 1,
    map: {
      1: '开心',
      2: '愤怒',
      3: '伤心',
      4: '冷漠',
      '*': '一般'
    },
    itemSchema: {
      type: 'tag',
      label: '${item}'
    }
  }
```

## 跟原版 amis 差异

（ZC 改造点描述待 patch_summarizer 补全；可参考源码 diff）
