---
component: datetimecontrol
amis_version: v6.0.0
---

# datetimecontrol

| 属性 | 类型 | 必选 | 说明 |
|---|---|---|---|
| `type` | `"input-datetime"` | 是 | 指定为日期时间选择控件 |
| `format` | `string` | 否 | 日期存储格式 |
| `inputFormat` | `string` | 否 | 日期展示格式 |
| `valueFormat` | `string` | 否 | 替代format |
| `displayFormat` | `string` | 否 | 日期展示格式(新：替代inputFormat) |
| `timeFormat` | `string` | 否 | 时间的格式。 |
| `minDate` | `string` | 否 | 限制最小日期 |
| `maxDate` | `string` | 否 | 限制最大日期 |
| `timeConstraints` | `any` | 否 | 时间输入范围限制 |
| `isEndDate` | `boolean` | 否 | 是否为结束时间，如果是，那么会自动加上 23:59:59 |
