---
component: nav
amis_version: v6.0.0
---

# nav

| 属性 | 类型 | 必选 | 说明 |
|---|---|---|---|
| `type` | `"nav"` | 是 | 指定为 Nav 导航渲染器 |
| `links` | `NavItemSchema[]` | 否 | 链接地址集合 |
| `indentSize` | `number` | 是 |  |
| `source` | `SchemaApi` | 否 | 可以通过 API 拉取。 |
| `deferApi` | `SchemaApi` | 否 | 懒加载 api，如果不配置复用 source 接口。 |
| `stacked` | `boolean` | 否 | true 为垂直排列，false 为水平排列类似如 tabs。 |
| `itemActions` | `SchemaCollection` | 否 | 更多操作菜单列表 |
| `draggable` | `boolean` | 否 | 可拖拽 |
| `saveOrderApi` | `SchemaApi` | 否 | 保存排序的 api |
| `itemBadge` | `BadgeObject` | 否 | 角标 |
| `badge` | `BadgeObject` | 否 | 角标 |
| `dragOnSameLevel` | `boolean` | 否 | 仅允许同层级拖拽 |
| `overflow` | `NavOverflow` | 否 | 横向导航时自动收纳配置 |
| `level` | `number` | 否 | 最多展示多少层级 |
| `defaultOpenLevel` | `number` | 否 | 默认展开层级 小于等于该层数的节点默认全部打开 |
| `showKey` | `string` | 否 | 控制仅展示指定key菜单下的子菜单项 |
| `collapsed` | `boolean` | 否 | 控制菜单缩起 |
| `mode` | `"inline" \| "float"` | 否 | 垂直模式 非折叠状态下 控制菜单打开方式 |
| `expandIcon` | `string \| SchemaObject` | 否 | 自定义展开图标 |
| `expandPosition` | `string` | 否 | 自定义展开图标位置 默认在前面 before after |
| `themeColor` | `"dark" \| "light"` | 否 | 主题配色 默认light |
| `accordion` | `boolean` | 否 | 手风琴展开 仅垂直inline模式支持 |
| `popupClassName` | `string` | 否 | 子菜单项展开浮层样式 |
| `searchable` | `boolean` | 否 | 是否开启搜索 |
| `searchConfig` | `{ className?: string; matchFunc?: string \| any; placeholder?: string; mini?: boolean; enhance?: boolean; clearable?: boolean; searchImediately?: boolean; valueField?: string; }` | 否 | 搜索框相关配置 |
