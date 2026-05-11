---
component: checkboxes
source: zc-amis-6.8.0-my242v2
category: patched
zc_suite: other
---

# checkboxes

> 运行时 schema 接口：`CheckboxesControlSchema`（extends `FormOptionsSchema`）

## 属性

| 属性 | 类型 | 必选 | 说明 |
|---|---|---|---|
| `type` | `"checkboxes"` | 是 | 指定类型 |
| `checkAll` | `boolean` | 否 | 是否开启全选功能 |
| `defaultCheckAll` | `boolean` | 否 | 是否默认全选 |
| `checkAllText` | `string` | 否 | 全选/不选文案 |
| `columnsCount` | `number \| number[]` | 否 | 每行显示多少个 |
| `menuTpl` | `string` | 否 | 自定义选项展示 |
| `testIdBuilder` | `TestIdBuilder` | 否 |  |

## 跟原版 amis 差异

（自动 diff vs baidu/amis@6.8.0 待 patch_summarizer 补全）
