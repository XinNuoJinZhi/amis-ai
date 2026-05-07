---
component: transfercontrol
amis_version: v6.0.0
---

# transfercontrol

| 属性 | 类型 | 必选 | 说明 |
|---|---|---|---|
| `type` | `"transfer"` | 是 |  |
| `showArrow` | `boolean` | 否 | 是否显示剪头 |
| `sortable` | `boolean` | 否 | 可排序？ |
| `selectMode` | `"list" \| "table" \| "tree" \| "chained" \| "associated"` | 否 | 勾选展示模式 |
| `resultListModeFollowSelect` | `boolean` | 否 | 结果面板是否追踪显示 |
| `leftOptions` | `Option[]` | 否 | 当 selectMode 为 associated 时用来定义左侧的选项 |
| `leftMode` | `"list" \| "tree"` | 否 | 当 selectMode 为 associated 时用来定义左侧的选择模式 |
| `rightMode` | `"list" \| "table" \| "tree" \| "chained"` | 否 | 当 selectMode 为 associated 时用来定义右侧的选择模式 |
| `searchResultMode` | `"list" \| "table" \| "tree" \| "chained"` | 否 | 搜索结果展示模式 |
| `columns` | `any[]` | 否 | 当 selectMode 为 table 时定义表格列信息。 |
| `searchResultColumns` | `any[]` | 否 | 当 searchResultMode 为 table 时定义表格列信息。 |
| `searchable` | `boolean` | 否 | 可搜索？ |
| `resultSearchable` | `boolean` | 否 | 结果（右则）列表的检索功能，当设置为true时，可以通过输入检索模糊匹配检索内容 |
| `searchApi` | `SchemaApi` | 否 | 搜索 API |
| `selectTitle` | `string` | 否 | 左侧的标题文字 |
| `resultTitle` | `string` | 否 | 右侧结果的标题文字 |
| `menuTpl` | `SchemaObject` | 否 | 用来丰富选项展示 |
| `valueTpl` | `SchemaObject` | 否 | 用来丰富值的展示 |
| `searchPlaceholder` | `string` | 否 | 左侧列表搜索框提示 |
| `resultSearchPlaceholder` | `string` | 否 | 右侧列表搜索框提示 |
| `statistics` | `boolean` | 否 | 统计数字 |
| `itemHeight` | `number` | 否 | 单个选项的高度，主要用于虚拟渲染 |
| `virtualThreshold` | `number` | 否 | 在选项数量达到多少时开启虚拟渲染 |
| `showInvalidMatch` | `boolean` | 否 | 当在value值未匹配到当前options中的选项时，是否value值对应文本飘红显示 |
| `onlyChildren` | `boolean` | 否 | 树形模式下，仅选中子节点 |
| `pagination` | `{ enable: SchemaExpression; className?: SchemaClassName; loadDataOnce?: boolean; } & Pick<PaginationSchema, "layout" \| "maxButtons" \| "perPageAvailable" \| "popOverContainerSelector">` | 否 | 分页配置，selectMode为默认和table才会生效 |
