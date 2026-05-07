---
component: crud2common
amis_version: v6.0.0
---

# crud2common

| 属性 | 类型 | 必选 | 说明 |
|---|---|---|---|
| `type` | `"crud2"` | 是 | 指定为 CRUD2 渲染器。 |
| `mode` | `"cards" \| "list" \| "table" \| "table2" \| "grid"` | 否 | 指定内容区的展示模式。 |
| `api` | `SchemaApi` | 否 | 初始化数据 API |
| `source` | `string` | 否 | 也可以直接从环境变量中读取，但是不太推荐。 |
| `silentPolling` | `boolean` | 否 | 静默拉取 |
| `interval` | `number` | 否 | 设置自动刷新时间 |
| `stopAutoRefreshWhen` | `SchemaExpression` | 否 |  |
| `loadType` | `"pagination" \| "more"` | 否 | 数据展示模式 无限加载 or 分页 |
| `perPage` | `number` | 否 | 无限加载时，根据此项设置其每页加载数量，可以不限制 |
| `loadDataOnce` | `boolean` | 否 | 是否为前端单次加载模式，可以用来实现前端分页。 |
| `selectable` | `boolean` | 否 | 是否可以选择数据，外部事件动作 |
| `multiple` | `boolean` | 否 | 是否可以多选数据，仅当selectable为 true 时生效 |
| `showSelection` | `boolean` | 否 | 是否展示已选数据区域，仅当selectable为 true 时生效 |
| `quickSaveApi` | `SchemaApi` | 否 | 快速编辑后用来批量保存的 API |
| `quickSaveItemApi` | `SchemaApi` | 否 | 快速编辑配置成及时保存时使用的 API |
| `saveOrderApi` | `SchemaApi` | 否 | 保存排序的 api |
| `syncLocation` | `boolean` | 否 | 是否将过滤条件的参数同步到地址栏,默认为true |
| `pageField` | `string` | 否 | 设置分页页码字段名。 |
| `perPageField` | `string` | 否 | 设置分页一页显示的多少条数据的字段名。 |
| `name` | `string` | 否 |  |
| `hideQuickSaveBtn` | `boolean` | 否 | 是否隐藏快速编辑的按钮。 |
| `autoJumpToTopOnPagerChange` | `boolean` | 否 | 是否自动跳顶部，当切分页的时候。 |
| `headerToolbar` | `SchemaCollection` | 否 | 顶部区域 |
| `headerToolbarClassName` | `string` | 否 | 顶部区域CSS类名 |
| `footerToolbar` | `SchemaCollection` | 否 | 底部区域 |
| `footerToolbarClassName` | `string` | 否 | 底部区域CSS类名 |
| `syncResponse2Query` | `boolean` | 否 | 是否将接口返回的内容自动同步到地址栏，前提是开启了同步地址栏。 |
| `keepItemSelectionOnPageChange` | `boolean` | 否 | 翻页时是否保留用户已选的数据 |
| `autoFillHeight` | `boolean` | 否 | 内容区域占满屏幕剩余空间 |
| `primaryField` | `string` | 否 | 行标识符，默认为id |
| `parsePrimitiveQuery` | `boolean \| { enable: boolean; types?: ('boolean' \| 'number')[]; }` | 否 | 是否开启Query信息转换，开启后将会对url中的Query进行转换，默认开启，默认仅转化布尔值 |
