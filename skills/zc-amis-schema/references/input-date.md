---
component: input-date
source: zc-amis-6.8.0-my242v2
category: patched
zc_suite: other
---

# input-date

> 运行时 schema 接口：`DateControlSchema`（extends `InputDateBaseControlSchema`）

## 属性

| 属性 | 类型 | 必选 | 说明 |
|---|---|---|---|
| `type` | `"input-date"` | 是 | 指定类型 |
| `format` | `string` | 否 | 日期存储格式 @default X |
| `inputFormat` | `string` | 否 | 日期展示格式 @default YYYY-MM-DD |
| `valueFormat` | `string` | 否 | 替代format |
| `displayFormat` | `string` | 否 | 日期展示格式(新：替代inputFormat) |
| `closeOnSelect` | `boolean` | 否 | 点选日期后是否关闭弹窗 |
| `minDate` | `string` | 否 | 限制最小日期 |
| `maxDate` | `string` | 否 | 限制最大日期 |
| `popOverContainerSelector` | `string` | 否 | 弹窗容器选择器 |

## 跟原版 amis 差异

（自动 diff vs baidu/amis@6.8.0 待 patch_summarizer 补全）
