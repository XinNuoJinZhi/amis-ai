---
component: page
amis_version: v6.0.0
---

# page

| 属性 | 类型 | 必选 | 说明 |
|---|---|---|---|
| `type` | `"page"` | 是 | 指定为 page 渲染器。 |
| `title` | `string` | 否 | 页面标题 |
| `subTitle` | `string` | 否 | 页面副标题 |
| `remark` | `SchemaRemark` | 否 | 页面描述, 标题旁边会出现个小图标，放上去会显示这个属性配置的内容。 |
| `body` | `SchemaCollection` | 否 | 内容区域 |
| `bodyClassName` | `SchemaClassName` | 否 | 内容区 css 类名 |
| `aside` | `SchemaCollection` | 否 | 边栏区域 |
| `asideResizor` | `boolean` | 否 | 边栏是否允许拖动 |
| `asideSticky` | `boolean` | 否 | 边栏内容是否粘住，即不跟随滚动。 |
| `asideMinWidth` | `number` | 否 | 边栏最小宽度 |
| `asideMaxWidth` | `number` | 否 | 边栏最小宽度 |
| `asideClassName` | `SchemaClassName` | 否 | 边栏区 css 类名 |
| `className` | `SchemaClassName` | 否 | 配置容器 className |
| `css` | `CSSRule` | 否 | 自定义页面级别样式表 |
| `mobileCSS` | `CSSRule` | 否 | 移动端下的样式表 |
| `data` | `SchemaDefaultData` | 否 | 页面级别的初始数据 |
| `headerClassName` | `SchemaClassName` | 否 | 配置 header 容器 className |
| `initApi` | `SchemaApi` | 否 | 页面初始化的时候，可以设置一个 API 让其取拉取，发送数据会携带当前 data 数据（包含地址栏参数），获取得数据会合并到 data 中，供组件内使用。 |
| `initFetch` | `boolean` | 否 | 是否默认就拉取？ |
| `initFetchOn` | `SchemaExpression` | 否 | 是否默认就拉取表达式 |
| `messages` | `SchemaMessage` | 否 |  |
| `name` | `string` | 否 |  |
| `toolbar` | `SchemaCollection` | 否 | 页面顶部区域，当存在 title 时在右上角显示。 |
| `toolbarClassName` | `SchemaClassName` | 否 | 配置 toolbar 容器 className |
| `definitions` | `any` | 否 |  |
| `interval` | `number` | 否 | 配置轮询间隔，配置后 initApi 将轮询加载。 |
| `silentPolling` | `boolean` | 否 | 是否要静默加载，也就是说不显示进度 |
| `stopAutoRefreshWhen` | `SchemaExpression` | 否 | 配置停止轮询的条件。 |
| `showErrorMsg` | `boolean` | 否 | 是否显示错误信息，默认是显示的。 |
| `cssVars` | `any` | 否 | css 变量 |
| `regions` | `("header" \| "body" \| "aside" \| "toolbar")[]` | 否 | 默认不设置自动感觉内容来决定要不要展示这些区域<br>如果配置了，以配置为主。 |
| `style` | `{ [propName: string]: any; }` | 否 | 自定义样式 |
| `pullRefresh` | `{ disabled?: boolean; pullingText?: string; loosingText?: string; }` | 否 | 下拉刷新配置 |
