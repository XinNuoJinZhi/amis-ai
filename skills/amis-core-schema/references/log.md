---
component: log
amis_version: v6.0.0
---

# log

| 属性 | 类型 | 必选 | 说明 |
|---|---|---|---|
| `type` | `"log"` | 是 | 指定为 log 链接展示控件 |
| `className` | `string` | 否 | 自定义 CSS 类名 |
| `source` | `string` | 是 | 获取日志的地址 |
| `height` | `number` | 否 | 控件高度 |
| `autoScroll` | `boolean` | 否 | 是否自动滚动到最底部 |
| `encoding` | `string` | 否 | 返回内容字符编码 |
| `maxLength` | `number` | 否 | 限制最大日志数量 |
| `rowHeight` | `number` | 否 | 每行高度 |
| `operation` | `LogOperation[]` | 否 | 一些可操作选项 |
| `credentials` | `string` | 否 | credentials 配置 |
