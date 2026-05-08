---
component: container
amis_version: v6.0.0
---

# container

| 属性 | 类型 | 必选 | 说明 |
|---|---|---|---|
| `type` | `"container"` | 是 | 指定为 container 类型 |
| `body` | `SchemaCollection` | 是 | 内容 |
| `bodyClassName` | `SchemaClassName` | 否 | body 类名 |
| `style` | `{ [propName: string]: any; }` | 否 | 自定义样式 |
| `wrapperComponent` | `string` | 否 | 使用的标签 |
| `wrapperBody` | `boolean` | 否 | 是否需要对body加一层div包裹，默认为 true |
| `draggable` | `string \| boolean` | 否 | 是否开启容器拖拽 |
| `draggableConfig` | `string \| ContainerDraggableConfig` | 是 | 是否开启容器拖拽配置 |
