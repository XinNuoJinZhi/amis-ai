---
component: condition-builder
source: zc-amis-6.8.0-my242v2
category: patched
zc_suite: other
---

# condition-builder

> 运行时 schema 接口：`ConditionBuilderControlSchema`（extends `FormBaseControlSchema`）

## 属性

| 属性 | 类型 | 必选 | 说明 |
|---|---|---|---|
| `type` | `"condition-builder"` | 是 | 指定类型 |
| `embed` | `boolean` | 否 | 内嵌模式，默认为 true |
| `pickerIcon` | `IconSchema` | 否 | 非内嵌模式时 弹窗触发icon |
| `funcs` | `ConditionBuilderFuncs` | 否 | 函数集合 |
| `fields` | `ConditionBuilderFields` | 是 | 字段集合 |
| `config` | `ConditionBuilderConfig` | 否 | 其他配置 |
| `source` | `SchemaApi \| SchemaTokenizeableString` | 否 | 通过远程拉取配置项 |
| `builderMode` | `'simple' \| 'full'` | 否 | 展现模式 |
| `showANDOR` | `boolean` | 否 | 是否显示并或切换键按钮，只在简单模式下有用 |
| `draggable` | `boolean` | 否 | 是否可拖拽，默认为 true |
| `addBtnVisibleOn` | `string` | 否 |  |
| `addGroupBtnVisibleOn` | `string` | 否 | 表达式：控制按钮“添加条件组”的显示 |
| `formula` | `Omit<InputFormulaControlSchema, 'type'>` | 否 | 将字段输入控件变成公式编辑器。 |
| `formulaForIf` | `any` | 否 | if 里面公式编辑器配置 |

## 跟原版 amis 差异

（自动 diff vs baidu/amis@6.8.0 待 patch_summarizer 补全）
