---
component: tablecontrol
amis_version: v6.0.0
---

# tablecontrol

| 属性 | 类型 | 必选 | 说明 |
|---|---|---|---|
| `type` | `"input-table"` | 是 |  |
| `addable` | `boolean` | 否 | 可新增 |
| `copyable` | `boolean` | 否 | 可复制新增 |
| `copyBtnLabel` | `string` | 否 | 复制按钮文字 |
| `copyBtnIcon` | `string` | 否 | 复制按钮图标 |
| `copyAddBtn` | `boolean` | 否 | 是否显示复制按钮 |
| `draggable` | `boolean` | 否 | 是否可以拖拽排序 |
| `addApi` | `SchemaApi` | 否 | 新增 API |
| `addBtnLabel` | `string` | 否 | 新增按钮文字 |
| `addBtnIcon` | `string` | 否 | 新增按钮图标 |
| `removable` | `boolean` | 否 | 可否删除 |
| `deleteApi` | `SchemaApi` | 否 | 删除的 API |
| `editable` | `boolean` | 否 | 可否编辑 |
| `editBtnLabel` | `string` | 否 | 更新按钮名称 |
| `editBtnIcon` | `string` | 否 | 更新按钮图标 |
| `confirmBtnLabel` | `string` | 否 | 确认按钮文字 |
| `confirmBtnIcon` | `string` | 否 | 确认按钮图标 |
| `cancelBtnLabel` | `string` | 否 | 取消按钮文字 |
| `cancelBtnIcon` | `string` | 否 | 取消按钮图标 |
| `deleteBtnLabel` | `string` | 否 | 删除按钮文字 |
| `deleteBtnIcon` | `string` | 否 | 删除按钮图标 |
| `updateApi` | `SchemaApi` | 否 | 更新 API |
| `scaffold` | `any` | 否 | 初始值，新增的时候 |
| `deleteConfirmText` | `string` | 否 | 删除确认文字 |
| `valueField` | `string` | 否 | 值字段 |
| `needConfirm` | `boolean` | 否 | 是否为确认的编辑模式。 |
| `canAccessSuperData` | `boolean` | 否 | 是否可以访问父级数据，正常 combo 已经关联到数组成员，是不能访问父级数据的。 |
| `showIndex` | `boolean` | 否 | 是否显示序号 |
| `perPage` | `number` | 否 | 分页个数，默认不分页 |
| `maxLength` | `string \| number` | 否 | 限制最大个数 |
| `minLength` | `string \| number` | 否 | 限制最小个数 |
| `showFooterAddBtn` | `boolean` | 否 | 是否显示底部新增按钮 |
| `showTableAddBtn` | `boolean` | 否 | 是否显示表格操作栏新增按钮 |
| `footerAddBtn` | `SchemaCollection` | 否 | 底部新增按钮配置 |
| `enableStaticTransform` | `boolean` | 否 | 是否开启 static 状态切换 |
| `toolbarClassName` | `SchemaClassName` | 否 | 底部工具栏CSS样式类 |
