---
component: input-tag
source: zc-amis-6.8.0-my242v2
category: patched
zc_suite: other
---

# input-tag

> 运行时 schema 接口：`TagControlSchema`（extends `FormOptionsSchema`）

## 属性

| 属性 | 类型 | 必选 | 说明 |
|---|---|---|---|
| `type` | `"input-tag"` | 是 | 指定类型 |
| `optionsTip` | `string` | 否 | 选项提示信息 |
| `dropdown` | `boolean` | 否 | 是否为下拉模式 |
| `max` | `number` | 否 | 允许添加的标签的最大数量 |
| `maxTagLength` | `number` | 否 | 单个标签的最大文本长度 |
| `maxTagCount` | `number` | 否 | 标签的最大展示数量，超出数量后以收纳浮层的方式展示，仅在多选模式开启后生效 |
| `overflowTagPopover` | `TooltipWrapperSchema` | 否 | 收纳标签的Popover配置 |
| `enableBatchAdd` | `boolean` | 是 | 是否开启批量添加模式 |
| `separator` | `string` | 否 | 开启批量添加后，输入多个标签的分隔符，支持传入多个符号，默认为"-" @default "-" |

## 跟原版 amis 差异

（自动 diff vs baidu/amis@6.8.0 待 patch_summarizer 补全）
