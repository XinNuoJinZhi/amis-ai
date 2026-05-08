---
component: inputformulacontrol
amis_version: v6.0.0
---

# inputformulacontrol

| 属性 | 类型 | 必选 | 说明 |
|---|---|---|---|
| `type` | `"input-formula"` | 是 |  |
| `evalMode` | `boolean` | 否 | evalMode 即直接就是表达式，否则<br>需要 ${这里面才是表达式}<br>默认为 true |
| `mixedMode` | `boolean` | 否 | 混合模式，意味着这个输入框既可以输入不同文本<br>也可以输入公式。<br>当输入公式时，值格式为 ${公式内容}<br>其他内容当字符串。 |
| `variables` | `VariableItem[]` | 是 | 用于提示的变量集合，默认为空 |
| `variableMode` | `"tabs" \| "tree"` | 否 | 变量展现模式，可选值：'tabs' ｜ 'tree' |
| `functions` | `FuncGroup[]` | 是 | 函数集合，默认不需要传，即  amis-formula 里面那个函数<br>如果有扩充，则需要传。 |
| `title` | `string` | 否 | 编辑器标题 |
| `header` | `string` | 是 | 顶部标题，默认为表达式 |
| `inputMode` | `"button" \| "input-group" \| "input-button"` | 否 | 控件模式 |
| `allowInput` | `boolean` | 否 | 外层input是否允许输入，否需要点击fx在弹窗中输入 |
| `icon` | `string` | 否 | 按钮图标 |
| `btnLabel` | `string` | 否 | 按钮Label，inputMode为button时生效 |
| `level` | `"link" \| "info" \| "success" \| "warning" \| "danger" \| "primary" \| "dark" \| "light"` | 否 | 按钮样式 |
| `btnSize` | `"xs" \| "sm" \| "md" \| "lg"` | 否 | 按钮大小 |
| `borderMode` | `"none" \| "full" \| "half"` | 否 | 边框模式，全边框，还是半边框，或者没边框。 |
| `placeholder` | `string` | 否 | 输入框占位符 |
| `variableClassName` | `string` | 否 | 变量面板CSS样式类名 |
| `functionClassName` | `string` | 否 | 函数面板CSS样式类名 |
| `selfVariableName` | `string` | 否 | 当前输入项字段 name: 用于避免循环绑定自身导致无限渲染 |
| `inputSettings` | `FormulaPickerInputSettings` | 否 | 输入框的类型 |
