---
component: property
source: zc-amis-6.8.0-my242v2
category: patched
zc_suite: other
---

# property

> 运行时 schema 接口：`PropertySchema`（extends `BaseSchema`）

## 属性

| 属性 | 类型 | 必选 | 说明 |
|---|---|---|---|
| `type` | `"property"` | 是 | 指定类型 |
| `title` | `string` | 否 | 标题 |
| `column` | `number` | 否 | 一共几列 |
| `mode` | `'table' \| 'simple'` | 否 | 显示模式 |
| `items` | `Array<PropertyItem>` | 是 | 每个 property 的设置 |
| `style` | `{ [propName: string]: any` | 否 | 自定义样式 |
| `titleStyle` | `{ [propName: string]: any` | 否 | 标题样式 |
| `labelStyle` | `{ [propName: string]: any` | 否 | 自定义样式 |
| `separator` | `string` | 否 |  |
| `contentStyle` | `{ [propName: string]: any` | 否 | 自定义样式 |

## 跟原版 amis 差异

（自动 diff vs baidu/amis@6.8.0 待 patch_summarizer 补全）
