---
component: table2
source: zc-amis-6.8.0-my242v2
category: patched
zc_suite: other
---

# table2

> 运行时 schema 接口：`TableSchema2`（extends `BaseSchema`）

## 属性

| 属性 | 类型 | 必选 | 说明 |
|---|---|---|---|
| `type` | `"table2"` | 是 | 指定类型 |
| `title` | `string \| SchemaObject \| Array<SchemaObject>` | 否 | 表格标题 |
| `source` | `SchemaTokenizeableString` | 是 | 表格数据源 |
| `columnsTogglable` | `'auto' \| boolean \| SchemaObject` | 否 | 表格可自定义列 |
| `columns` | `Array<ColumnSchema>` | 是 | 表格列配置 |
| `rowSelection` | `RowSelectionSchema \| boolean` | 否 | 表格可选择配置 |
| `expandable` | `ExpandableSchema` | 否 | 表格行可展开配置 |
| `sticky` | `boolean` | 否 | 粘性头部 |
| `loading` | `boolean \| string \| SchemaObject` | 否 | 加载中 |
| `itemBadge` | `BadgeObject` | 否 | 行角标内容 |
| `showBadge` | `boolean` | 否 | 是否展示行角标 |
| `popOverContainer` | `any` | 否 | 指定挂载dom |
| `keyField` | `string` | 否 | 多选、嵌套展开记录的ID字段名 默认id |
| `childrenColumnName` | `string` | 否 | 数据源嵌套自定义字段名 |
| `rowClassNameExpr` | `string` | 否 | 自定义行样式 |
| `lineHeight` | `string` | 否 | 是否固定内容行高度 |
| `bordered` | `boolean` | 否 | 是否展示边框 |
| `showHeader` | `boolean` | 否 | 是否展示表头 |
| `footer` | `string \| SchemaObject \| Array<SchemaObject>` | 否 | 指定表尾 |
| `quickSaveApi` | `SchemaApi` | 否 | 快速编辑后用来批量保存的 API |
| `quickSaveItemApi` | `SchemaApi` | 否 | 快速编辑配置成及时保存时使用的 API |
| `messages` | `SchemaMessage` | 否 | 接口报错信息配置 |
| `reload` | `string` | 否 | 重新加载的组件名称 |
| `actions` | `Array<ActionSchema>` | 否 | 操作列配置 |
| `maxKeepItemSelectionLength` | `number` | 否 | 批量操作最大限制数 |
| `keepItemSelectionOnPageChange` | `boolean` | 否 | 翻页是否保存数据 |
| `selectable` | `boolean` | 否 | 是否可选择 作用同rowSelection 兼容原CRUD属性 默认多选 |
| `multiple` | `boolean` | 否 | 是否可多选 作用同rowSelection.type 兼容原CRUD属性 不设置认为是多选 仅设置selectable才起作用 |
| `primaryField` | `string` | 否 | 设置ID字段名 作用同keyFiled 兼容原CURD属性 |
| `tableLayout` | `'fixed' \| 'auto'` | 否 |  |
| `autoFillHeight` | `boolean \| AutoFillHeightObject` | 否 | 表格自动计算高度 |
| `canAccessSuperData` | `boolean` | 否 | 表格是否可以获取父级数据域值，默认为false |
| `lazyRenderAfter` | `number` | 否 | 当一次性渲染太多列上有用，默认为 100，可以用来提升表格渲染性能 @default 100 |

## 跟原版 amis 差异

（自动 diff vs baidu/amis@6.8.0 待 patch_summarizer 补全）
