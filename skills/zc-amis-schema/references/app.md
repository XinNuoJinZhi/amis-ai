---
component: app
source: zc-amis-6.8.0-my242v2
category: patched
zc_suite: other
---

# app

> 运行时 schema 接口：`AppSchema`（extends `BaseSchema, SpinnerExtraProps`）

## 属性

| 属性 | 类型 | 必选 | 说明 |
|---|---|---|---|
| `type` | `"app"` | 是 | 指定类型 |
| `api` | `SchemaApi` | 否 |  |
| `brandName` | `string` | 否 | 系统名称 |
| `logo` | `string` | 否 | logo 图片地址，可以是 svg。 |
| `onBrandNameClick` | `() => void /** * 顶部区域 */ header?: SchemaCollection` | 否 | 系统名称点击事件 |
| `asideBefore` | `SchemaCollection` | 否 | 边栏菜单前面的区域 |
| `asideAfter` | `SchemaCollection` | 否 | 边栏菜单后面的区域 |
| `pages` | `Array<AppPage> \| AppPage` | 否 | 页面集合。 |
| `footer` | `SchemaCollection` | 否 | 底部区域。 |
| `className` | `SchemaClassName` | 否 | css 类名。 |
| `showBreadcrumb` | `boolean` | 否 | 显示面包屑路径。 |
| `showFullBreadcrumbPath` | `boolean` | 否 | 显示面包屑完整路径。 |
| `showBreadcrumbHomePath` | `boolean` | 否 | 显示面包屑首页路径。 |
| `cssVars` | `any` | 否 |  |

## 跟原版 amis 差异

（自动 diff vs baidu/amis@6.8.0 待 patch_summarizer 补全）
