---
component: selectcontrol
amis_version: v6.0.0
---

# selectcontrol

| 属性 | 类型 | 必选 | 说明 |
|---|---|---|---|
| `type` | `"select" \| "multi-select"` | 是 |  |
| `autoComplete` | `SchemaApi` | 否 | 自动完成 API，当输入部分文字的时候，会将这些文字通过 ${term} 可以取到，发送给接口。<br>接口可以返回匹配到的选项，帮助用户输入。 |
| `menuTpl` | `string` | 否 | 可以自定义菜单展示。 |
| `showInvalidMatch` | `boolean` | 是 | 当在value值未匹配到当前options中的选项时，是否value值对应文本飘红显示 |
| `borderMode` | `"none" \| "full" \| "half"` | 否 | 边框模式，全边框，还是半边框，或者没边框。 |
| `selectMode` | `"table" \| "group" \| "tree" \| "chained" \| "associated"` | 否 | 勾选展示模式 |
| `leftOptions` | `Option[]` | 否 | 当 selectMode 为 associated 时用来定义左侧的选项 |
| `leftMode` | `"list" \| "tree"` | 否 | 当 selectMode 为 associated 时用来定义左侧的选择模式 |
| `rightMode` | `"list" \| "table" \| "tree" \| "chained"` | 否 | 当 selectMode 为 associated 时用来定义右侧的选择模式 |
| `searchResultMode` | `"list" \| "table" \| "tree" \| "chained"` | 否 | 搜索结果展示模式 |
| `columns` | `any[]` | 否 | 当 selectMode 为 table 时定义表格列信息。 |
| `searchResultColumns` | `any[]` | 否 | 当 searchResultMode 为 table 时定义表格列信息。 |
| `searchable` | `boolean` | 否 | 可搜索？ |
| `searchApi` | `SchemaApi` | 否 | 搜索 API |
| `itemHeight` | `number` | 否 | 单个选项的高度，主要用于虚拟渲染 |
| `virtualThreshold` | `number` | 否 | 在选项数量达到多少时开启虚拟渲染 |
| `checkAll` | `boolean` | 否 | 可多选条件下，是否可全选 |
| `defaultCheckAll` | `boolean` | 否 | 可多选条件下，是否默认全选中所有值 |
| `checkAllLabel` | `string` | 否 | 可多选条件下，全选项文案，默认 ”全选“ |
| `maxTagCount` | `number` | 否 | 标签的最大展示数量，超出数量后以收纳浮层的方式展示，仅在多选模式开启后生效 |
| `overflowTagPopover` | `object` | 否 | 收纳标签的Popover配置 |
| `optionClassName` | `SchemaClassName` | 否 | 选项的自定义CSS类名 |
| `overlay` | `{ width?: number \| string; align?: 'left' \| 'center' \| 'right'; filterOption?: 'string'; }` | 否 | 下拉框 Popover 设置 |
