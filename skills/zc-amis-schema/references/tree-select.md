---
component: tree-select
source: zc-amis-6.8.0-my242v2
category: patched
zc_suite: other
---

# tree-select

> 运行时 schema 接口：`TreeSelectControlSchema`（extends `FormOptionsSchema`）

## 属性

| 属性 | 类型 | 必选 | 说明 |
|---|---|---|---|
| `type` | `"tree-select"` | 是 | 指定类型 |
| `hideRoot` | `boolean` | 否 | 是否隐藏顶级 |
| `rootLabel` | `string` | 否 | 顶级选项的名称 |
| `rootValue` | `any` | 否 | 顶级选项的值 |
| `showIcon` | `boolean` | 否 | 显示图标 |
| `cascade` | `boolean` | 否 | 父子之间是否完全独立。 |
| `withChildren` | `boolean` | 否 | 选父级的时候是否把子节点的值也包含在内。 |
| `onlyChildren` | `boolean` | 否 | 选父级的时候，是否只把子节点的值包含在内 |
| `onlyLeaf` | `boolean` | 否 | 单选时，只运行选择叶子节点 |
| `rootCreatable` | `boolean` | 否 | 顶级节点是否可以创建子节点 |
| `hideNodePathLabel` | `boolean` | 否 | 是否隐藏选择框中已选中节点的祖先节点的文本信息 |
| `enableNodePath` | `boolean` | 否 | 是否开启节点路径模式 |
| `pathSeparator` | `string` | 否 | 开启节点路径模式后，节点路径的分隔符 |
| `showOutline` | `boolean` | 否 | 是否显示展开线 |
| `deferApi` | `SchemaApi` | 否 | 懒加载接口 |
| `maxTagCount` | `number` | 否 | 标签的最大展示数量，超出数量后以收纳浮层的方式展示，仅在多选模式开启后生效 |
| `overflowTagPopover` | `TooltipWrapperSchema` | 否 | 收纳标签的Popover配置 |
| `menuTpl` | `string` | 否 | 自定义选项 |
| `enableDefaultIcon` | `boolean` | 否 | 是否为选项添加默认的Icon，默认值为true |
| `testIdBuilder` | `TestIdBuilder` | 否 |  |

## 跟原版 amis 差异

（自动 diff vs baidu/amis@6.8.0 待 patch_summarizer 补全）
