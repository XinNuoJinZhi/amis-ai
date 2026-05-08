---
component: tooltipwrapper
amis_version: v6.0.0
---

# tooltipwrapper

| 属性 | 类型 | 必选 | 说明 |
|---|---|---|---|
| `type` | `"tooltip-wrapper"` | 是 | 文字提示容器 |
| `title` | `string` | 否 | 文字提示标题 |
| `content` | `string` | 否 | 文字提示内容，兼容 tooltip，但建议通过 content 来实现提示内容 |
| `tooltip` | `string` | 否 |  |
| `placement` | `"top" \| "right" \| "bottom" \| "left"` | 否 | 文字提示浮层出现位置，默认为top |
| `offset` | `[number, number]` | 否 | 浮层位置相对偏移量 |
| `showArrow` | `boolean` | 否 | 是否展示浮层指向箭头 |
| `disabled` | `boolean` | 否 | 是否禁用提示 |
| `trigger` | `any` | 否 | 浮层触发方式，默认为hover |
| `mouseEnterDelay` | `number` | 否 | 浮层延迟显示时间, 单位 ms |
| `mouseLeaveDelay` | `number` | 否 | 浮层延迟隐藏时间, 单位 ms |
| `rootClose` | `boolean` | 否 | 是否点击非内容区域关闭提示，默认为true |
| `body` | `SchemaCollection` | 否 | 内容区域 |
| `wrapperComponent` | `string` | 是 | 内容区包裹标签 |
| `inline` | `boolean` | 否 | 内容区是否内联显示，默认为false |
| `tooltipTheme` | `"dark" \| "light"` | 否 | 主题样式， 默认为light |
| `style` | `{ [propName: string]: any; }` | 否 | 内容区自定义样式 |
| `enterable` | `boolean` | 否 | 是否可以移入浮层中, 默认true |
| `tooltipStyle` | `{ [propName: string]: any; }` | 否 | 自定义提示浮层样式 |
| `className` | `string` | 否 | 内容区CSS类名 |
| `tooltipClassName` | `string` | 否 | 文字提示浮层CSS类名 |
