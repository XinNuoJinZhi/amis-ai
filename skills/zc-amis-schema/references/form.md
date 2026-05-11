---
component: form
source: zc-amis-6.8.0-my242v2
category: patched
zc_suite: other
---

# 表单（type: `form`）

> 可用于新建、编辑或者展示数据，配置初始化接口可从远端加载数据，配置提交接口可将数据发送远端。另外也可以将数据提交给其他组件，与其他组件通信。

**标签**：数据容器
**编辑器面板**：表单
**图标**：`fa fa-list-alt`
**文档**：`/amis/zh-CN/components/form/index`
**基础组件**（编辑器内可直接拖拽）

## 默认 scaffold（建议起手用法）

```json
{
  "type": "form",
  "title": "表单",
  "body": [
    {
      "label": "文本框",
      "type": "input-text",
      "name": "text"
    }
  ]
}
```

## 事件

| eventName | eventLabel |
|---|---|
| `inited` | 初始化数据接口请求完成 |
| `change` | 数值变化 |
| `formItemValidateSucc` | 表单项校验成功 |
| `formItemValidateError` | 表单项校验失败 |
| `validateSucc` | 表单校验成功 |
| `validateError` | 表单校验失败 |
| `submit` | 表单提交 |
| `submitSucc` | 提交成功 |
| `submitFail` | 提交失败 |
| `asyncApiFinished` | 远程请求轮询结束 |

## 跟原版 amis 差异

（ZC 改造点描述待 patch_summarizer 补全；可参考源码 diff）
