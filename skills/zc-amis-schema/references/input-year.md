---
component: input-year
source: zc-amis-6.8.0-my242v2
category: patched
zc_suite: other
---

# input-year

> 运行时 schema 接口：`YearControlSchema`（extends `InputDateBaseControlSchema`）

## 属性

| 属性 | 类型 | 必选 | 说明 |
|---|---|---|---|
| `type` | `"input-year"` | 是 | 指定类型 |
| `format` | `string` | 否 | 月份存储格式 @default X |
| `inputFormat` | `string` | 否 | 月份展示格式 @default YYYY-MM |
| `valueFormat` | `string` | 否 | 替代format |
| `displayFormat` | `string` | 否 | 日期展示格式(新：替代inputFormat) |

## 跟原版 amis 差异

（自动 diff vs baidu/amis@6.8.0 待 patch_summarizer 补全）
