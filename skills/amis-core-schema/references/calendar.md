---
component: calendar
amis_version: v6.0.0
---

# calendar

| 属性 | 类型 | 必选 | 说明 |
|---|---|---|---|
| `type` | `"calendar"` | 是 | 指定为日历选择控件 |
| `schedules` | `string \| scheduleItem[]` | 否 | 日程 |
| `scheduleClassNames` | `string[]` | 否 | 日程显示颜色自定义 |
| `scheduleAction` | `SchemaObject` | 否 | 日程点击展示 |
| `largeMode` | `boolean` | 否 | 是否开启放大模式 |
| `todayActiveStyle` | `{ [propName: string]: any; }` | 否 | 今日激活时的自定义样式 |
