---
component: number
source: zc-amis-6.8.0-my242v2
category: patched
zc_suite: other
---

# number

> 运行时 schema 接口：`NumberSchema`（extends `BaseSchema`）

## 属性

| 属性 | 类型 | 必选 | 说明 |
|---|---|---|---|
| `type` | `"number"` | 是 | 指定类型 |
| `precision` | `number` | 否 | 精度，用来控制小数点位数 |
| `prefix` | `string` | 否 | 前缀 |
| `suffix` | `string` | 否 | 后缀 |
| `kilobitSeparator` | `boolean` | 否 | 是否千分分隔 |
| `percent` | `boolean \| number` | 否 | 百分比显示 |
| `placeholder` | `string` | 否 | 占位符 |
| `unitOptions` | `string \| Array<Option> \| string[] \| PlainObject` | 否 | 单位列表 |

## 跟原版 amis 差异

（自动 diff vs baidu/amis@6.8.0 待 patch_summarizer 补全）
