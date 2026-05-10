---
component: chart
source: zc-amis-6.8.0-my242v2
category: patched
zc_suite: reportforms
---

# 图表（type: `chart`）

> 用来渲染图表，基于 echarts 图表库，理论上 echarts 所有图表类型都支持。

**标签**：展示
**编辑器面板**：图表
**图标**：`fa fa-pie-chart`
**文档**：`/amis/zh-CN/components/chart`
**基础组件**（编辑器内可直接拖拽）

## 默认 scaffold（建议起手用法）

```json
{
    type: 'chart',
    config: chartDefaultConfig,
    replaceChartOption: true
  }
```

## 事件

| eventName | eventLabel |
|---|---|
| `init` | 初始化 |
| `click` | 鼠标点击 |
| `mouseover` | 鼠标悬停 |
| `legendselectchanged` | 切换图例选中状态 |

## 跟原版 amis 差异

（ZC 改造点描述待 patch_summarizer 补全；可参考源码 diff）
