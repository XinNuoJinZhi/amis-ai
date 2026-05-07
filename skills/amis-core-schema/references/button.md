---
component: button
amis_version: v6.0.0
---

# button

| 属性 | 类型 | 必选 | 说明 |
|---|---|---|---|
| `id` | `string` | 否 | 主要用于用户行为跟踪里区分是哪个按钮 |
| `block` | `boolean` | 否 | 是否为块状展示，默认为内联。 |
| `disabledTip` | `string` | 否 | 禁用时的文案提示。 |
| `icon` | `string` | 否 | 按钮图标， iconfont 的类名 |
| `iconClassName` | `SchemaClassName` | 否 | icon 上的css 类名 |
| `rightIcon` | `string` | 否 | 右侧按钮图标， iconfont 的类名 |
| `rightIconClassName` | `SchemaClassName` | 否 | 右侧 icon 上的 css 类名 |
| `loadingClassName` | `SchemaClassName` | 否 | loading 上的css 类名 |
| `label` | `string` | 否 | 按钮文字 |
| `level` | `"link" \| "info" \| "success" \| "warning" \| "danger" \| "primary" \| "dark" \| "light" \| "secondary"` | 否 | 按钮样式 |
| `primary` | `boolean` | 否 |  |
| `size` | `"xs" \| "sm" \| "md" \| "lg"` | 否 | 按钮大小 |
| `tooltip` | `SchemaTooltip` | 否 |  |
| `tooltipPlacement` | `"top" \| "right" \| "bottom" \| "left"` | 否 |  |
| `type` | `"button" \| "submit" \| "reset"` | 是 | 指定按钮类型，支持 button、submit或者reset三种类型。 |
| `confirmText` | `string` | 否 | 提示文字，配置了操作前会要求用户确认。 |
| `required` | `string[]` | 否 | 如果按钮在form中，配置此属性会要求用户把指定的字段通过验证后才会触发行为。 |
| `activeLevel` | `string` | 否 | 激活状态时的样式 |
| `activeClassName` | `string` | 否 | 激活状态时的类名 |
| `close` | `string \| boolean` | 否 | 如果按钮在弹框中，可以配置这个动作完成后是否关闭弹窗，或者指定关闭目标弹框。 |
| `requireSelected` | `boolean` | 否 | 当按钮时批量操作按钮时，默认必须有勾选元素才能可点击，如果此属性配置成 false，则没有点选成员也能点击。 |
| `mergeData` | `boolean` | 否 | 是否将弹框中数据 merge 到父级作用域。 |
| `target` | `string` | 否 | 可以指定让谁来触发这个动作。 |
| `countDown` | `number` | 否 | 点击后的禁止倒计时（秒） |
| `countDownTpl` | `string` | 否 | 倒计时文字自定义 |
| `badge` | `BadgeObject` | 否 | 角标 |
| `hotKey` | `string` | 否 | 键盘快捷键 |
| `loadingOn` | `string` | 否 | 是否显示loading效果 |
| `onClick` | `any` | 否 | 自定义事件处理函数 |
| `body` | `SchemaCollection` | 否 | 子内容 |
