---
component: report-forms
source: zc-amis-6.8.0-my242v2
category: new
zc_suite: reportforms
---

# ZC 报表套件（type: `report-forms`）

> ZC fork 的独立 BI 报表子系统，覆盖图表、数值指标、地图、词云等可视化能力。
> 源码：`packages/amis-editor/src/plugin/ReportForms/` 共 125 个文件（独立子模块）。

**标签**：报表 / BI / 可视化

## 入口用法

ZC report-forms 套件按图表类型分发，建议在 schema 里指定 `chartType` 或直接用具体类型：

```json
{
  "type": "report-forms",
  "chartType": "bar",
  "source": {
    "url": "app://report/sales-overview"
  }
}
```

## 支持的图表类型（chartType / 独立 type）

| 类型 | 用途 |
|---|---|
| `bar` | 柱状图 |
| `line` | 折线图 |
| `pie` / `pie2` | 饼图 |
| `gauge` | 仪表盘 |
| `funnel` | 漏斗图 |
| `radar` | 雷达图 |
| `map` | 地图（含 ChartMap 子套件） |
| `wordcloud` | 词云 |
| `sankey` | 桑基图（ChartSanKey 子套件） |
| `scatter-map` | 散点地图（ChartScatterMap 子套件） |
| `waterfall` / `accumulated-waterfall` | 瀑布图 / 累积瀑布图 |
| `calendar` | 日历图（ChartCalendar 子套件） |
| `enumber` | 数值指标（ENumber，单一大数字展示） |

## 数据源

- `app://` 协议接 ZC apicenter（生产）
- mock 数据 / 静态 JSON（开发期 sandbox）

## 跟原版 amis chart 差异

- 原版 `amis` 只有通用 `chart` type（包 echarts）
- ZC 拆出独立 `report-forms` 套件 + 每种图表独立 plugin（更细颗粒度配置）
- ZC 报表配置面板有专属 ReportFormsConfig 渲染器（编辑器侧）

## 已知限制

- sandbox 环境的 `app://` 协议不通，需要 mock 数据 fallback
- 部分图表依赖 ZC 私有图表库，优先用通用 bar/line/pie 等基础图表
