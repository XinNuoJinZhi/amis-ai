---
component: date
amis_version: v6.0.0
---

# date

| 属性 | 类型 | 必选 | 说明 |
|---|---|---|---|
| `type` | `"date" \| "static-date" \| "datetime" \| "static-datetime" \| "time" \| "static-time"` | 是 | 指定为日期展示类型 |
| `format` | `string` | 否 | 展示的时间格式，参考 moment 中的格式说明。 |
| `displayFormat` | `string` | 否 | 展示的时间格式，参考 moment 中的格式说明。（新：同format） |
| `placeholder` | `string` | 否 | 占位符 |
| `valueFormat` | `string` | 否 | 值的时间格式，参考 moment 中的格式说明。 |
| `fromNow` | `boolean` | 否 | 显示成相对时间，比如1分钟前 |
| `updateFrequency` | `number` | 否 | 更新频率， 默认为1分钟 |
| `displayTimeZone` | `string` | 否 | 时区 |
