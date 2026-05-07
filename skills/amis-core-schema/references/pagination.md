---
component: pagination
amis_version: v6.0.0
---

# pagination

| 属性 | 类型 | 必选 | 说明 |
|---|---|---|---|
| `type` | `"pagination"` | 是 |  |
| `layout` | `string \| string[]` | 否 | 通过控制layout属性的顺序，调整分页结构 total,perPage,pager,go |
| `maxButtons` | `number` | 否 | 最多显示多少个分页按钮。 |
| `mode` | `MODE_TYPE` | 否 | 模式，默认normal，如果只想简单显示可以配置成 `simple`。 |
| `activePage` | `number` | 是 | 当前页数 |
| `total` | `number` | 否 | 总条数 |
| `perPage` | `number` | 否 | 最后一页，总页数（如果传入了total，会重新计算lastPage）<br>每页显示条数 |
| `showPerPage` | `boolean` | 否 | 是否展示分页切换，也同时受layout控制 |
| `perPageAvailable` | `number[]` | 否 | 指定每页可以显示多少条 |
| `showPageInput` | `boolean` | 否 | 是否显示快速跳转输入框 |
| `disabled` | `boolean` | 否 | 是否禁用 |
| `hasNext` | `boolean` | 否 |  |
| `popOverContainerSelector` | `string` | 否 | 弹层挂载节点 |
