---
component: dropdown-button
source: zc-amis-6.8.0-my242v2
category: patched
zc_suite: other
---

# dropdown-button

> 运行时 schema 接口：`DropdownButtonSchema`（extends `BaseSchema`）

## 属性

| 属性 | 类型 | 必选 | 说明 |
|---|---|---|---|
| `type` | `"dropdown-button"` | 是 | 指定类型 |
| `block` | `boolean` | 否 | 是否独占一行 `display: block` |
| `btnClassName` | `SchemaClassName` | 否 | 给 Button 配置 className。 |
| `buttons` | `Array<DropdownButton>` | 否 | 按钮集合，支持分组 |
| `body` | `SchemaCollection` | 否 | 内容区域 |
| `label` | `string` | 否 | 按钮文字 |
| `level` | `'info' \| 'success' \| 'danger' \| 'warning' \| 'primary'...` | 否 | 按钮级别，样式 |
| `closeOnOutside` | `boolean` | 否 | 按钮提示文字，hover 时显示 /   // tooltip?: SchemaTooltip;   /** 点击外部是否关闭 |
| `closeOnClick` | `boolean` | 否 | 点击内容是否关闭 |
| `size` | `'xs' \| 'sm' \| 'md' \| 'lg'` | 否 | 按钮大小 |
| `align` | `'left' \| 'right'` | 否 | 对齐方式 |
| `iconOnly` | `boolean` | 否 | 是否只显示图标。 |
| `rightIcon` | `SchemaIcon` | 否 | 右侧图标 |
| `trigger` | `'click' \| 'hover'` | 否 | 触发条件，默认是 click |
| `hideCaret` | `boolean` | 否 | 是否显示下拉按钮 |
| `menuClassName` | `string` | 否 | 菜单 CSS 样式 |
| `overlayPlacement` | `string` | 否 |  |

## 跟原版 amis 差异

（自动 diff vs baidu/amis@6.8.0 待 patch_summarizer 补全）
