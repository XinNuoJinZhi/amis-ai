---
component: chart
amis_version: v6.0.0
---

# chart

| 属性 | 类型 | 必选 | 说明 |
|---|---|---|---|
| `type` | `"chart"` | 是 | 指定为 chart 类型 |
| `chartTheme` | `any` | 否 | Chart 主题配置 |
| `api` | `SchemaApi` | 否 | 图表配置接口 |
| `initFetch` | `boolean` | 否 | 是否初始加载。 |
| `initFetchOn` | `SchemaExpression` | 否 | 是否初始加载用表达式来配置 |
| `config` | `any` | 否 | 配置echart的config，支持数据映射。如果用了数据映射，为了同步更新，请设置 trackExpression |
| `trackExpression` | `string` | 否 | 跟踪表达式，如果这个表达式的运行结果发生变化了，则会更新 Echart，当 config 中用了数据映射时有用。 |
| `width` | `string \| number` | 否 | 宽度设置 |
| `height` | `string \| number` | 否 | 高度设置 |
| `interval` | `number` | 否 | 刷新时间 |
| `name` | `string` | 否 |  |
| `style` | `{ [propName: string]: any; }` | 否 | style样式 |
| `dataFilter` | `SchemaFunction` | 否 |  |
| `source` | `string` | 否 |  |
| `disableDataMapping` | `boolean` | 否 | 默认开启 Config 中的数据映射，如果想关闭，请开启此功能。 |
| `clickAction` | `ActionSchema` | 否 | 点击行为配置，可以用来满足下钻操作等。 |
| `replaceChartOption` | `boolean` | 否 | 默认配置时追加的，如果更新配置想完全替换配置请配置为 true. |
| `unMountOnHidden` | `boolean` | 否 | 不可见的时候隐藏 |
| `mapURL` | `SchemaApi` | 否 | 获取 geo json 文件的地址 |
| `mapName` | `string` | 否 | 地图名称 |
| `loadBaiduMap` | `boolean` | 否 | 加载百度地图 |
