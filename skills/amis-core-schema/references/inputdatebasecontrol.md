---
component: inputdatebasecontrol
amis_version: v6.0.0
---

# inputdatebasecontrol

| 属性 | 类型 | 必选 | 说明 |
|---|---|---|---|
| `type` | `"input-date" \| "input-datetime" \| "input-time" \| "input-quarter" \| "input-year" \| "input-month"` | 是 | 指定为日期选择控件 |
| `clearable` | `boolean` | 否 | 是否显示清除按钮 |
| `format` | `string` | 否 | 日期存储格式 |
| `valueFormat` | `string` | 否 | 替代format |
| `inputFormat` | `string` | 否 | 日期展示格式 |
| `displayFormat` | `string` | 否 | 日期展示格式(新：替代inputFormat) |
| `utc` | `boolean` | 否 | 设定是否存储 utc 时间。 |
| `emebed` | `boolean` | 否 | 是否为内联模式？ |
| `borderMode` | `"none" \| "full" \| "half"` | 否 | 边框模式，全边框，还是半边框，或者没边框。 |
| `shortcuts` | `string \| ShortCuts[]` | 否 | 日期快捷键 |
| `disabledDate` | `string` | 否 | 字符串函数，用来决定是否禁用某个日期。<br><br>(currentDate: moment.Moment, props: any) => boolean; |
