---
component: app
amis_version: v6.0.0
---

# app

| 属性 | 类型 | 必选 | 说明 |
|---|---|---|---|
| `type` | `"app"` | 是 | 指定为 app 类型。 |
| `api` | `SchemaApi` | 否 |  |
| `brandName` | `string` | 否 | 系统名称 |
| `logo` | `string` | 否 | logo 图片地址，可以是 svg。 |
| `header` | `SchemaCollection` | 否 | 顶部区域 |
| `asideBefore` | `SchemaCollection` | 否 | 边栏菜单前面的区域 |
| `asideAfter` | `SchemaCollection` | 否 | 边栏菜单后面的区域 |
| `pages` | `AppPage \| AppPage[]` | 否 | 页面集合。 |
| `footer` | `SchemaCollection` | 否 | 底部区域。 |
| `className` | `SchemaClassName` | 否 | css 类名。 |
| `showBreadcrumb` | `boolean` | 否 | 显示面包屑路径。 |
| `showFullBreadcrumbPath` | `boolean` | 否 | 显示面包屑完整路径。 |
| `showBreadcrumbHomePath` | `boolean` | 否 | 显示面包屑首页路径。 |
