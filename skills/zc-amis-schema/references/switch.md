---
component: switch
source: zc-amis-6.8.0-my242v2
category: patched
zc_suite: other
---

# switch

> 运行时 schema 接口：`SwitchControlSchema`（extends `FormBaseControlSchema`）

## 属性

| 属性 | 类型 | 必选 | 说明 |
|---|---|---|---|
| `type` | `"switch"` | 是 | 指定类型 |
| `trueValue` | `boolean \| string \| number` | 否 | 勾选值 |
| `falseValue` | `boolean \| string \| number` | 否 | 未勾选值 |
| `option` | `string` | 否 | 选项说明 |
| `onText` | `string \| IconSchema \| SchemaCollection` | 否 | 开启时显示的内容 |
| `offText` | `string \| IconSchema \| SchemaCollection` | 否 | 关闭时显示的内容 |
| `size` | `'sm' \| 'md'` | 否 | 开关尺寸 |
| `loading` | `boolean` | 否 | 是否处于加载状态 |

## 跟原版 amis 差异

（自动 diff vs baidu/amis@6.8.0 待 patch_summarizer 补全）
