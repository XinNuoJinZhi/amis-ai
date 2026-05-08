---
component: carousel
amis_version: v6.0.0
---

# carousel

| 属性 | 类型 | 必选 | 说明 |
|---|---|---|---|
| `type` | `"carousel"` | 是 | 指定为轮播图类型 |
| `auto` | `boolean` | 否 | 是否自动播放 |
| `interval` | `string \| number` | 否 | 轮播间隔时间 |
| `duration` | `number` | 否 | 动画时长 |
| `width` | `number` | 否 | 设置宽度 |
| `height` | `number` | 否 | 设置高度 |
| `controlsTheme` | `"dark" \| "light"` | 否 |  |
| `placeholder` | `string` | 否 | 占位 |
| `controls` | `("dots" \| "arrows")[]` | 否 | 配置控件内容 |
| `animation` | `"fade" \| "slide"` | 否 | 动画类型 |
| `itemSchema` | `SchemaCollection` | 否 | 配置单条呈现模板 |
| `name` | `string` | 否 |  |
| `thumbMode` | `"contain" \| "cover"` | 否 | 预览图模式 |
| `options` | `any[]` | 否 | 配置固定值 |
| `alwaysShowArrow` | `boolean` | 否 | 是否一直显示箭头 |
| `multiple` | `{ count: number; }` | 否 | 多图模式配置项 |
| `icons` | `{ prev?: SchemaCollection; next?: SchemaCollection; }` | 否 | 自定义箭头图标 |
