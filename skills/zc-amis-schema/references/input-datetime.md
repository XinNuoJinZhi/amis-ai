---
component: input-datetime
source: zc-amis-6.8.0-my242v2
category: patched
zc_suite: other
---

# input-datetime

> 运行时 schema 接口：`DateTimeControlSchema`（extends `InputDateBaseControlSchema`）

## 属性

| 属性 | 类型 | 必选 | 说明 |
|---|---|---|---|
| `type` | `"input-datetime"` | 是 | 指定类型 |
| `format` | `string` | 否 | 日期存储格式 @default X |
| `inputFormat` | `string` | 否 | 日期展示格式 @default YYYY-MM-DD HH:mm |
| `valueFormat` | `string` | 否 | 替代format |
| `displayFormat` | `string` | 否 | 日期展示格式(新：替代inputFormat) |
| `timeFormat` | `string` | 否 | 时间的格式。 @default HH:mm |
| `minDate` | `string` | 否 | 限制最小日期 |
| `maxDate` | `string` | 否 | 限制最大日期 |
| `timeConstraints` | `any` | 否 | 时间输入范围限制 |
| `isEndDate` | `boolean` | 否 | 是否为结束时间，如果是，那么会自动加上 23:59:59 |

## 跟原版 amis 差异

（自动 diff vs baidu/amis@6.8.0 待 patch_summarizer 补全）
