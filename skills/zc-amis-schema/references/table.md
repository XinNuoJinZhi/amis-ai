---
component: table
source: zc-amis-6.8.0-my242v2
category: patched
zc_suite: other
---

# table

> 运行时 schema 接口：`TableSchema`（extends `BaseSchema`）

## 属性

| 属性 | 类型 | 必选 | 说明 |
|---|---|---|---|
| `type` | `"table"` | 是 | 指定类型 |
| `affixHeader` | `boolean` | 否 | 是否固定表头 |
| `affixFooter` | `boolean` | 否 | 是否固底 |
| `columns` | `Array<TableColumn>` | 否 | 表格的列信息 |
| `columnsTogglable` | `boolean \| 'auto'` | 否 | 展示列显示开关，自动即：列数量大于或等于5个时自动开启 |
| `footable` | `\| boolean \| { expand?: 'first' \| 'all' \| 'none'` | 否 | 是否开启底部展示功能，适合移动端展示 |
| `accordion` | `boolean` | 否 | 是否为手风琴模式 |
| `footerClassName` | `SchemaClassName` | 否 | 底部外层 CSS 类名 |
| `headerClassName` | `SchemaClassName` | 否 | 顶部外层 CSS 类名 |
| `placeholder` | `string \| SchemaTpl` | 否 | 占位符 |
| `showFooter` | `boolean` | 否 | 是否显示底部 |
| `showHeader` | `boolean` | 否 | 是否显示头部 |
| `source` | `SchemaTokenizeableString` | 否 | 数据源：绑定当前环境变量 |
| `tableClassName` | `SchemaClassName` | 否 | 表格 CSS 类名 |
| `title` | `string` | 否 | 标题 |
| `toolbarClassName` | `SchemaClassName` | 否 | 工具栏 CSS 类名 |
| `combineNum` | `number \| SchemaExpression` | 否 | 合并单元格配置，配置数字表示从左到右的多少列自动合并单元格。 |
| `combineFromIndex` | `number` | 否 | 合并单元格配置，配置从第几列开始合并。 |
| `prefixRow` | `Array<SchemaObject>` | 否 | 顶部总结行 |
| `affixRow` | `Array<SchemaObject>` | 否 | 底部总结行 |
| `resizable` | `boolean` | 否 | 是否可调整列宽 |
| `rowClassNameExpr` | `string` | 否 | 行样式表表达式 |
| `itemBadge` | `BadgeObject` | 否 | 行角标 |
| `autoGenerateFilter` | `AutoGenerateFilterObject \| boolean` | 否 | 开启查询区域，会根据列元素的searchable属性值，自动生成查询条件表单 |
| `canAccessSuperData` | `boolean` | 否 | 表格是否可以获取父级数据域值，默认为false |
| `autoFillHeight` | `boolean \| AutoFillHeightObject` | 否 | 表格自动计算高度 |
| `tableLayout` | `'fixed' \| 'auto'` | 否 | table layout |
| `deferApi` | `SchemaApi` | 否 | 懒加载 API，当行数据中用 defer: true 标记了，则其孩子节点将会用这个 API 来拉取数据。 |

## 跟原版 amis 差异

（自动 diff vs baidu/amis@6.8.0 待 patch_summarizer 补全）
