---
component: fieldsetcontrol
amis_version: v6.0.0
---

# fieldsetcontrol

| 属性 | 类型 | 必选 | 说明 |
|---|---|---|---|
| `type` | `"fieldset" \| "fieldSet"` | 是 | 指定为表单项集合 |
| `titlePosition` | `"top" \| "bottom"` | 是 | 标题展示位置 |
| `collapsable` | `boolean` | 否 | 是否可折叠 |
| `collapsed` | `boolean` | 否 | 默认是否折叠 |
| `body` | `SchemaCollection` | 否 | 内容区域 |
| `title` | `string` | 否 | 标题 |
| `collapseTitle` | `string` | 否 | 收起的标题 |
| `mountOnEnter` | `boolean` | 否 | 点开时才加载内容 |
| `unmountOnExit` | `boolean` | 否 | 卡片隐藏就销毁内容。 |
| `subFormMode` | `"horizontal" \| "normal" \| "inline"` | 否 | 配置子表单项默认的展示方式。 |
| `subFormHorizontal` | `FormHorizontal` | 否 | 如果是水平排版，这个属性可以细化水平排版的左右宽度占比。 |
