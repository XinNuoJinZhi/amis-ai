---
component: treecontrol
amis_version: v6.0.0
---

# treecontrol

| 属性 | 类型 | 必选 | 说明 |
|---|---|---|---|
| `type` | `"input-tree"` | 是 |  |
| `hideRoot` | `boolean` | 否 | 是否隐藏顶级 |
| `rootLabel` | `string` | 否 | 顶级选项的名称 |
| `rootValue` | `any` | 否 | 顶级选项的值 |
| `showIcon` | `boolean` | 否 | 显示图标 |
| `autoCheckChildren` | `boolean` | 否 | ui级联关系，true代表级联选中，false代表不级联，默认为true |
| `cascade` | `boolean` | 否 | 该属性代表数据级联关系，autoCheckChildren为true时生效，默认为false，具体数据级联关系如下：<br>1.casacde为false，ui行为为级联选中子节点，子节点禁用；值只包含父节点的值<br>2.cascade为false，withChildren为true，ui行为为级联选中子节点，子节点禁用；值包含父子节点的值<br>3.cascade为true，ui行为级联选中子节点，子节点可反选，值包含父子节点的值，此时withChildren属性失效<br>4.cascade不论为true还是false，onlyChildren为true，ui行为级联选中子节点，子节点可反选，值只包含子节点的值 |
| `withChildren` | `boolean` | 否 | 选父级的时候是否把子节点的值也包含在内。 |
| `onlyChildren` | `boolean` | 否 | 选父级的时候，是否只把子节点的值包含在内 |
| `onlyLeaf` | `boolean` | 否 | 单选时，只运行选择叶子节点 |
| `rootCreatable` | `boolean` | 否 | 顶级节点是否可以创建子节点 |
| `enableNodePath` | `boolean` | 否 | 是否开启节点路径模式 |
| `pathSeparator` | `string` | 否 | 开启节点路径模式后，节点路径的分隔符 |
| `showOutline` | `boolean` | 否 | 是否显示展开线 |
| `deferApi` | `SchemaApi` | 否 | 懒加载接口 |
| `highlightTxt` | `string` | 否 | 需要高亮的字符串 |
| `enableDefaultIcon` | `boolean` | 否 | 是否为选项添加默认的Icon，默认值为true |
| `searchable` | `boolean` | 否 | 是否开启搜索 |
| `searchApi` | `SchemaApi` | 否 | 搜索 API |
| `searchConfig` | `{ className?: string; placeholder?: string; mini?: boolean; enhance?: boolean; clearable?: boolean; searchImediately?: boolean; sticky?: boolean; }` | 否 | 搜索框的配置 |
| `heightAuto` | `boolean` | 否 | 高度自动增长？ |
