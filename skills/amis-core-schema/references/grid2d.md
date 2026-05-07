---
component: grid2d
amis_version: v6.0.0
---

# grid2d

| 属性 | 类型 | 必选 | 说明 |
|---|---|---|---|
| `type` | `"grid-2d"` | 是 | 指定为 grid-2d 展示类型 |
| `cols` | `number` | 否 | 列数量，默认是 12 |
| `width` | `string \| number` | 否 | grid 2d 容器宽度，默认是 auto |
| `gap` | `string \| number` | 否 | 格子间距，默认 0，包含行和列 |
| `gapRow` | `string \| number` | 否 | 格子行级别的间距，如果不设置就和 gap 一样 |
| `rowHeight` | `string \| number` | 否 | 单位行高度，默认 50 px |
| `grids` | `Grid[]` | 是 | 每个格子的配置 |
