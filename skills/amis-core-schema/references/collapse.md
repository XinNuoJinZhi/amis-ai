---
component: collapse
amis_version: v6.0.0
---

# collapse

| 属性 | 类型 | 必选 | 说明 |
|---|---|---|---|
| `type` | `"collapse"` | 是 | 指定为折叠器类型 |
| `key` | `string` | 否 | 标识 |
| `headerPosition` | `"top" \| "bottom"` | 否 | 标题展示位置 |
| `header` | `SchemaCollection` | 否 | 标题 |
| `body` | `SchemaCollection` | 是 | 内容区域 |
| `bodyClassName` | `string` | 否 | 配置 Body 容器 className |
| `disabled` | `boolean` | 否 | 是否禁用 |
| `collapsable` | `boolean` | 否 | 是否可折叠 |
| `collapsed` | `boolean` | 否 | 默认是否折叠 |
| `showArrow` | `boolean` | 否 | 图标是否展示 |
| `expandIcon` | `SchemaObject` | 否 | 自定义切换图标 |
| `headingClassName` | `string` | 否 | 标题 CSS 类名 |
| `collapseHeader` | `string` | 否 | 收起的标题 |
| `size` | `"xs" \| "sm" \| "md" \| "lg" \| "base"` | 否 | 控件大小 |
| `mountOnEnter` | `boolean` | 否 | 点开时才加载内容 |
| `unmountOnExit` | `boolean` | 否 | 卡片隐藏就销毁内容。 |
| `divideLine` | `boolean` | 否 | 标题内容分割线 |
