---
component: service
source: zc-amis-6.8.0-my242v2
category: patched
zc_suite: other
---

# 服务Service（type: `service`）

> 功能性容器，可以用来加载数据或者加载渲染器配置。加载到的数据在容器可以使用。

**标签**：数据容器
**编辑器面板**：服务Service
**图标**：`fa fa-server`
**文档**：`/amis/zh-CN/components/service`
**基础组件**（编辑器内可直接拖拽）

## 默认 scaffold（建议起手用法）

```json
{
  "type": "service",
  "body": []
}
```

## 事件

| eventName | eventLabel |
|---|---|
| `init` | 初始化 |
| `fetchInited` | 初始化数据接口请求完成 |
| `fetchSchemaInited` | 初始化Schema接口请求完成 |

## 跟原版 amis 差异

（ZC 改造点描述待 patch_summarizer 补全；可参考源码 diff）
