---
component: nestedselectcontrol
amis_version: v6.0.0
---

# nestedselectcontrol

| 属性 | 类型 | 必选 | 说明 |
|---|---|---|---|
| `type` | `"nested-select"` | 是 |  |
| `borderMode` | `"none" \| "full" \| "half"` | 否 | 边框模式，全边框，还是半边框，或者没边框。 |
| `menuClassName` | `string` | 否 | 弹框的 css 类 |
| `cascade` | `boolean` | 否 | 父子之间是否完全独立。 |
| `withChildren` | `boolean` | 否 | 选父级的时候是否把子节点的值也包含在内。 |
| `onlyChildren` | `boolean` | 否 | 选父级的时候，是否只把子节点的值包含在内 |
| `onlyLeaf` | `boolean` | 否 | 只允许选择叶子节点 |
| `hideNodePathLabel` | `boolean` | 否 | 是否隐藏选择框中已选中节点的祖先节点的文本信息 |
| `maxTagCount` | `number` | 否 | 标签的最大展示数量，超出数量后以收纳浮层的方式展示，仅在多选模式开启后生效 |
| `overflowTagPopover` | `object` | 否 | 收纳标签的Popover配置 |
