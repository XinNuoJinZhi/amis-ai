---
component: tabs
amis_version: v6.0.0
---

# tabs

| 属性 | 类型 | 必选 | 说明 |
|---|---|---|---|
| `type` | `"tabs"` | 是 |  |
| `tabs` | `TabSchema[]` | 是 | 选项卡成员。当配置了 source 时，选项卡成员，将会根据目标数据进行重复。 |
| `source` | `string` | 否 | 关联已有数据，选项卡直接根据目标数据重复。 |
| `tabsMode` | `TabsMode` | 否 | 展示形式 |
| `contentClassName` | `SchemaClassName` | 否 | 内容类名 |
| `linksClassName` | `SchemaClassName` | 否 | 链接外层类名 |
| `mountOnEnter` | `boolean` | 否 | 卡片是否只有在点开的时候加载？ |
| `unmountOnExit` | `boolean` | 否 | 卡片隐藏的时候是否销毁卡片内容 |
| `toolbar` | `ActionSchema` | 否 | 可以在右侧配置点其他功能按钮。 |
| `subFormMode` | `"horizontal" \| "normal" \| "inline"` | 否 | 配置子表单项默认的展示方式。 |
| `subFormHorizontal` | `FormHorizontal` | 否 | 如果是水平排版，这个属性可以细化水平排版的左右宽度占比。 |
| `addable` | `boolean` | 否 | 是否支持新增 |
| `closable` | `boolean` | 否 | 是否支持删除 |
| `draggable` | `boolean` | 否 | 是否支持拖拽 |
| `showTip` | `boolean` | 否 | 是否显示提示 |
| `showTipClassName` | `string` | 否 | tooltip 提示的类名 |
| `editable` | `boolean` | 否 | 是否可编辑标签名 |
| `scrollable` | `boolean` | 否 | 是否导航支持内容溢出滚动。属性废弃，为了兼容暂且保留 |
| `sidePosition` | `"right" \| "left"` | 否 | 编辑器模式，侧边的位置 |
| `addBtnText` | `string` | 否 | 自定义增加按钮文案 |
| `defaultKey` | `any` | 否 | 初始化激活的选项卡，hash值或索引值，支持使用表达式 |
| `activeKey` | `any` | 否 | 激活的选项卡，hash值或索引值，支持使用表达式 |
| `collapseOnExceed` | `number` | 否 | 超过多少个时折叠按钮 |
| `collapseBtnLabel` | `string` | 否 | 折叠按钮文字 |
| `swipeable` | `boolean` | 否 | 是否滑动切换只在移动端生效 |
