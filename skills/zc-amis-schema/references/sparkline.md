---
component: sparkline
source: zc-amis-6.8.0-my242v2
category: patched
zc_suite: reportforms
---

# sparkline

> 运行时 schema 接口：`SparkLineSchema`（extends `BaseSchema`）

## 属性

| 属性 | 类型 | 必选 | 说明 |
|---|---|---|---|
| `type` | `"sparkline"` | 是 | 指定类型 |
| `className` | `SchemaClassName` | 否 | css 类名 |
| `name` | `string` | 否 | 关联数据变量。 |
| `width` | `number` | 否 | 宽度 @default 100 |
| `height` | `number` | 否 | 高度 @default 50 |
| `clickAction` | `ActionSchema` | 否 | 点击行为 |
| `placeholder` | `string` | 否 | 空数据时显示的内容 |
| `value` | `Array< \| number \| { value: number` | 否 |  |
| `label` | `string` | 否 |  |

## 跟原版 amis 差异

（自动 diff vs baidu/amis@6.8.0 待 patch_summarizer 补全）
