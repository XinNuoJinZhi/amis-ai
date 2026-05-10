---
component: wizard
source: zc-amis-6.8.0-my242v2
category: patched
zc_suite: other
---

# 向导（type: `wizard`）

> 表单向导，可以将复杂的多个表单项拆分成多个步骤，一步一步指引用户完成填写。

**标签**：功能
**编辑器面板**：向导
**图标**：`fa fa-list-ol`
**文档**：`/amis/zh-CN/components/wizard`
**基础组件**（编辑器内可直接拖拽）

## 默认 scaffold（建议起手用法）

```json
{
  "type": "wizard",
  "steps": [
    {
      "title": "第一步",
      "body": [
        {
          "type": "input-text",
          "label": "文本",
          "name": "var1"
        }
      ]
    },
    {
      "title": "第二步",
      "body": [
        {
          "type": "input-text",
          "label": "文本2",
          "name": "var2"
        }
      ]
    }
  ]
}
```

## 事件

| eventName | eventLabel |
|---|---|
| `inited` | 初始化数据接口请求完成 |
| `finished` | 点击完成 |
| `stepChange` | 步骤切换 |
| `change` | 数值变化 |
| `submitSucc` | 提交成功 |
| `submitFail` | 提交失败 |
| `stepSubmitSucc` | 步骤提交成功 |
| `stepSubmitFail` | 步骤提交失败 |

## 跟原版 amis 差异

（ZC 改造点描述待 patch_summarizer 补全；可参考源码 diff）
