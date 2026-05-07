---
component: panel
amis_version: v6.0.0
---

# panel

| 属性 | 类型 | 必选 | 说明 |
|---|---|---|---|
| `type` | `"panel"` | 是 | 指定为Panel渲染器。 |
| `actions` | `ActionSchema[]` | 否 | 按钮集合 |
| `actionsClassName` | `SchemaClassName` | 否 | 按钮集合外层类名 |
| `body` | `SchemaCollection` | 否 | 内容区域 |
| `bodyClassName` | `SchemaClassName` | 否 | 配置 Body 容器 className |
| `footer` | `SchemaCollection` | 否 | 底部内容区域 |
| `footerClassName` | `SchemaClassName` | 否 | 配置 footer 容器 className |
| `footerWrapClassName` | `SchemaClassName` | 否 | footer 和 actions 外层 div 类名。 |
| `header` | `SchemaCollection` | 否 | 头部内容, 和 title 二选一。 |
| `headerClassName` | `SchemaClassName` | 否 | 配置 header 容器 className |
| `title` | `string` | 否 | Panel 标题 |
| `affixFooter` | `boolean \| "always"` | 否 | 固定底部, 想要把按钮固定在底部的时候配置。 |
| `subFormMode` | `"horizontal" \| "normal" \| "inline"` | 否 | 配置子表单项默认的展示方式。 |
| `subFormHorizontal` | `FormHorizontal` | 否 | 如果是水平排版，这个属性可以细化水平排版的左右宽度占比。 |
