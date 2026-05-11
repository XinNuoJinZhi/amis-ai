---
component: chained-select
source: zc-amis-6.8.0-my242v2
category: patched
zc_suite: other
---

# 链式下拉框（type: `chained-select`）

> 通过<code>source</code>拉取选项，只要有返回结果，就可以无限级别增加

**标签**：表单项
**编辑器面板**：链式下拉
**图标**：`fa fa-th-list`
**文档**：`/amis/zh-CN/components/form/chain-select`
**基础组件**（编辑器内可直接拖拽）

## 默认 scaffold（建议起手用法）

```json
{
  "type": "chained-select",
  "label": "链式下拉",
  "name": "chainedSelect",
  "joinValues": true
}
```

## 事件

| eventName | eventLabel |
|---|---|
| `change` | 值变化 |

## 跟原版 amis 差异

（ZC 改造点描述待 patch_summarizer 补全；可参考源码 diff）
