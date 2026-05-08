---
component: crudcommon
amis_version: v6.0.0
---

# crudcommon

| 属性 | 类型 | 必选 | 说明 |
|---|---|---|---|
| `type` | `"crud"` | 是 | 指定为 CRUD 渲染器。 |
| `mode` | `"cards" \| "list" \| "table" \| "grid"` | 否 | 指定内容区的展示模式。 |
| `api` | `SchemaApi` | 否 | 初始化数据 API |
| `deferApi` | `SchemaApi` | 否 | 懒加载 API，当行数据中用 defer: true 标记了，则其孩子节点将会用这个 API 来拉取数据。 |
| `bulkActions` | `ActionSchema[]` | 否 | 批量操作 |
| `itemActions` | `ActionSchema[]` | 否 | 单条操作 |
| `perPage` | `number` | 否 | 每页个数，默认为 10，如果不是请设置。 |
| `orderBy` | `string` | 否 | 默认排序字段 |
| `orderDir` | `"asc" \| "desc"` | 否 | 默认排序方向 |
| `defaultParams` | `PlainObject` | 否 | 可以默认给定初始参数如： {\"perPage\": 24} |
| `draggable` | `boolean` | 否 | 是否可通过拖拽排序 |
| `draggableOn` | `SchemaExpression` | 否 | 是否可通过拖拽排序，通过表达式来配置 |
| `name` | `string` | 否 |  |
| `filter` | `any` | 否 | 过滤器表单 |
| `initFetch` | `boolean` | 否 | 初始是否拉取 |
| `initFetchOn` | `SchemaExpression` | 否 | 初始是否拉取，用表达式来配置。 |
| `innerClassName` | `SchemaClassName` | 否 | 配置内部 DOM 的 className |
| `interval` | `number` | 否 | 设置自动刷新时间 |
| `orderField` | `string` | 否 | 设置用来确定位置的字段名，设置后新的顺序将被赋值到该字段中。 |
| `pageField` | `string` | 否 | 设置分页页码字段名。 |
| `perPageField` | `string` | 否 | 设置分页一页显示的多少条数据的字段名。 |
| `pageDirectionField` | `string` | 否 | 设置分页方向的字段名。单位简单分页时清楚时向前还是向后翻页。 |
| `quickSaveApi` | `SchemaApi` | 否 | 快速编辑后用来批量保存的 API |
| `quickSaveItemApi` | `SchemaApi` | 否 | 快速编辑配置成及时保存时使用的 API |
| `saveOrderApi` | `SchemaApi` | 否 | 保存排序的 api |
| `syncLocation` | `boolean` | 否 | 是否将过滤条件的参数同步到地址栏,默认为true |
| `headerToolbar` | `((CRUDToolbarChild & CRUDToolbarObject) \| CRUDBultinToolbarType)[]` | 否 | 顶部工具栏 |
| `footerToolbar` | `((CRUDToolbarChild & CRUDToolbarObject) \| CRUDBultinToolbarType)[]` | 否 | 底部工具栏 |
| `perPageAvailable` | `number[]` | 否 | 每页显示多少个空间成员的配置如： [10, 20, 50, 100]。 |
| `messages` | `SchemaMessage` | 否 |  |
| `hideQuickSaveBtn` | `boolean` | 否 | 是否隐藏快速编辑的按钮。 |
| `autoJumpToTopOnPagerChange` | `boolean` | 否 | 是否自动跳顶部，当切分页的时候。 |
| `silentPolling` | `boolean` | 否 | 静默拉取 |
| `stopAutoRefreshWhen` | `SchemaExpression` | 否 |  |
| `stopAutoRefreshWhenModalIsOpen` | `boolean` | 否 |  |
| `filterTogglable` | `boolean \| { label?: string; activeLabel?: string; icon?: string; activeIcon?: string; }` | 否 |  |
| `filterDefaultVisible` | `boolean` | 否 |  |
| `syncResponse2Query` | `boolean` | 否 | 是否将接口返回的内容自动同步到地址栏，前提是开启了同步地址栏。 |
| `keepItemSelectionOnPageChange` | `boolean` | 否 | 分页的时候是否保留用户选择。 |
| `labelTpl` | `string` | 否 | 当配置 keepItemSelectionOnPageChange 时有用，用来配置已勾选项的文案。 |
| `loadDataOnce` | `boolean` | 否 | 是否为前端单次加载模式，可以用来实现前端分页。 |
| `loadDataOnceFetchOnFilter` | `boolean` | 否 | 在开启loadDataOnce时，当修改过滤条件时是否重新请求api<br><br>如果没有配置，当查询条件表单触发的会重新请求 api，当是列过滤或者是 search-box 触发的则不重新请求 api<br>如果配置为 true，则不管是什么触发都会重新请求 api<br>如果配置为 false 则不管是什么触发都不会重新请求 api |
| `matchFunc` | `any` | 否 | 自定义搜索匹配函数，当开启loadDataOnce时，会基于该函数计算的匹配结果进行过滤，主要用于处理列字段类型较为复杂或者字段值格式和后端返回不一致的场景 |
| `source` | `string` | 否 | 也可以直接从环境变量中读取，但是不太推荐。 |
| `expandConfig` | `{ expand?: 'first' \| 'all' \| 'none'; expandAll?: boolean; accordion?: boolean; }` | 否 | 如果时内嵌模式，可以通过这个来配置默认的展开选项。 |
| `alwaysShowPagination` | `boolean` | 否 | 默认只有当分页数大于 1 是才显示，如果总是想显示请配置。 |
| `autoGenerateFilter` | `boolean \| AutoGenerateFilterObject` | 否 | 开启查询区域，会根据列元素的searchable属性值，自动生成查询条件表单 |
| `autoFillHeight` | `boolean \| { height: number; maxHeight: number; }` | 否 | 内容区域占满屏幕剩余空间 |
| `parsePrimitiveQuery` | `boolean \| { enable: boolean; types?: ('boolean' \| 'number')[]; }` | 否 | 是否开启Query信息转换，开启后将会对url中的Query进行转换，默认开启，默认仅转化布尔值 |
