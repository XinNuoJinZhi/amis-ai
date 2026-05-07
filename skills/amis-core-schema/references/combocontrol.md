---
component: combocontrol
amis_version: v6.0.0
---

# combocontrol

| 属性 | 类型 | 必选 | 说明 |
|---|---|---|---|
| `type` | `"combo"` | 是 | 指定为组合输入框类型 |
| `scaffold` | `any` | 否 | 单组表单项初始值。默认为 `{}` |
| `noBorder` | `boolean` | 否 | 是否含有边框 |
| `deleteConfirmText` | `string` | 否 | 确认删除时的提示 |
| `deleteApi` | `SchemaApi` | 否 | 删除时调用的api |
| `typeSwitchable` | `boolean` | 否 | 是否可切换条件，配合`conditions`使用 |
| `conditions` | `ComboCondition[]` | 否 | 符合某类条件后才渲染的schema |
| `formClassName` | `SchemaClassName` | 否 | 内部单组表单项的类名 |
| `addButtonClassName` | `SchemaClassName` | 否 | 新增按钮CSS类名 |
| `addButtonText` | `string` | 否 | 新增按钮文字 |
| `addable` | `boolean` | 否 | 是否可新增 |
| `addattop` | `boolean` | 否 | Add at top |
| `items` | `ComboSubControl[]` | 否 | 数组输入框的子项 |
| `draggable` | `boolean` | 否 | 是否可拖拽排序 |
| `draggableTip` | `string` | 否 | 可拖拽排序的提示信息。 |
| `flat` | `boolean` | 否 | 是否将结果扁平化(去掉name),只有当controls的length为1且multiple为true的时候才有效 |
| `delimiter` | `string` | 否 | 当扁平化开启并且joinValues为true时，用什么分隔符 |
| `joinValues` | `boolean` | 否 | 当扁平化开启的时候，是否用分隔符的形式发送给后端，否则采用array的方式 |
| `maxLength` | `string \| number` | 否 | 限制最大个数 |
| `minLength` | `string \| number` | 否 | 限制最小个数 |
| `multiLine` | `boolean` | 否 | 是否多行模式，默认一行展示完 |
| `multiple` | `boolean` | 否 | 是否可多选 |
| `removable` | `boolean` | 否 | 是否可删除 |
| `subFormMode` | `"horizontal" \| "normal" \| "inline"` | 否 | 子表单的模式。 |
| `subFormHorizontal` | `FormHorizontal` | 否 | 如果是水平排版，这个属性可以细化水平排版的左右宽度占比。 |
| `placeholder` | `string` | 否 | 没有成员时显示。 |
| `canAccessSuperData` | `boolean` | 否 | 是否可以访问父级数据，正常 combo 已经关联到数组成员，是不能访问父级数据的。 |
| `tabsMode` | `boolean` | 否 | 采用 Tabs 展示方式？ |
| `tabsStyle` | `"" \| "card" \| "radio" \| "line"` | 否 | Tabs 的展示模式。 |
| `tabsLabelTpl` | `string` | 否 | 选项卡标题的生成模板。 |
| `lazyLoad` | `boolean` | 否 | 数据比较多，比较卡时，可以试试开启。 |
| `strictMode` | `boolean` | 否 | 严格模式，为了性能默认不开的。 |
| `syncFields` | `string[]` | 否 | 配置同步字段。只有 `strictMode` 为 `false` 时有效。<br>如果 Combo 层级比较深，底层的获取外层的数据可能不同步。<br>但是给 combo 配置这个属性就能同步下来。输入格式：`["os"]` |
| `nullable` | `boolean` | 否 | 允许为空，如果子表单项里面配置验证器，且又是单条模式。可以允许用户选择清空（不填）。 |
| `messages` | `{ validateFailed?: string; minLengthValidateFailed?: string; maxLengthValidateFailed?: string; }` | 否 | 提示信息 |
| `updatePristineAfterStoreDataReInit` | `boolean` | 否 |  |
