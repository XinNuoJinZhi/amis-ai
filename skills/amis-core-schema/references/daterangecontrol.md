---
component: daterangecontrol
amis_version: v6.0.0
---

# daterangecontrol

| 属性 | 类型 | 必选 | 说明 |
|---|---|---|---|
| `type` | `"input-date-range" \| "input-time-range" \| "input-datetime-range"` | 是 | 指定为日期范围控件 |
| `delimiter` | `string` | 否 | 分割符, 因为有两个值，开始时间和结束时间，所以要有连接符。默认为英文逗号。 |
| `format` | `string` | 否 | 默认 `X` 即时间戳格式，用来提交的时间格式。更多格式类型请参考 moment. |
| `valueFormat` | `string` | 否 | 用来提交的时间格式。更多格式类型请参考 moment.（新：同format） |
| `inputFormat` | `string` | 否 | 默认 `YYYY-MM-DD` 用来配置显示的时间格式。 |
| `displayFormat` | `string` | 否 | 用来配置显示的时间格式（新：同inputFormat） |
| `joinValues` | `boolean` | 否 | 开启后将选中的选项 value 的值用连接符拼接起来，作为当前表单项的值。如： `value1,value2` 否则为 `[value1, value2]` |
| `maxDate` | `string` | 否 | 最大日期限制，支持变量 $xxx 来取值，或者用相对值如：* `-2mins` 2分钟前\n * `+2days` 2天后\n* `-10week` 十周前\n可用单位： `min`、`hour`、`day`、`week`、`month`、`year`。所有单位支持复数形式。 |
| `minDate` | `string` | 否 | 最小日期限制，支持变量 $xxx 来取值，或者用相对值如：* `-2mins` 2分钟前\n * `+2days` 2天后\n* `-10week` 十周前\n可用单位： `min`、`hour`、`day`、`week`、`month`、`year`。所有单位支持复数形式。 |
| `maxDuration` | `string` | 否 | 最大跨度，比如 2days |
| `minDuration` | `string` | 否 | 最小跨度，比如 2days |
| `value` | `any` | 否 | 这里面 value 需要特殊说明一下，因为支持相对值。* `-2mins` 2分钟前\n * `+2days` 2天后\n* `-10week` 十周前\n可用单位： `min`、`hour`、`day`、`week`、`month`、`year`。所有单位支持复数形式。 |
| `borderMode` | `"none" \| "full" \| "half"` | 否 | 边框模式，全边框，还是半边框，或者没边框。 |
| `embed` | `boolean` | 否 | 开启后变成非弹出模式，即内联模式。 |
| `ranges` | `string \| ShortCuts[]` | 否 | 日期范围快捷键 |
| `shortcuts` | `string \| ShortCuts[]` | 否 | 日期范围快捷键 |
| `startPlaceholder` | `string` | 否 | 日期范围开始时间-占位符 |
| `endPlaceholder` | `string` | 否 | 日期范围结束时间-占位符 |
| `animation` | `boolean` | 否 | 是否启用游标动画，默认开启 |
| `transform` | `string` | 否 | 日期数据处理函数，用来处理选择日期之后的的值<br><br>(value: moment.Moment, config: {type: 'start' \| 'end'; originValue: moment.Moment, timeFormat: string}, props: any, data: any, moment: moment) => moment.Moment; |
