---
component: tabs-transfer
source: zc-amis-6.8.0-my242v2
category: patched
zc_suite: other
---

# 组合穿梭器（type: `tabs-transfer`）

> 组合穿梭器组件

**标签**：表单项
**编辑器面板**：组合穿梭器
**图标**：`fa fa-th-list`
**文档**：`/amis/zh-CN/components/form/transfer`
**基础组件**（编辑器内可直接拖拽）

## 默认 scaffold（建议起手用法）

```json
{
  "label": "组合穿梭器",
  "type": "tabs-transfer",
  "name": "tabsTransfer",
  "selectMode": "tree",
  "options": [
    {
      "label": "成员",
      "children": [
        {
          "label": "法师",
          "value": "fashi",
          "children": [
            {
              "label": "诸葛亮",
              "value": "zhugeliang"
            }
          ]
        },
        {
          "label": "战士",
          "value": "zhanshi",
          "children": [
            {
              "label": "曹操",
              "value": "caocao"
            },
            {
              "label": "钟无艳",
              "value": "zhongwuyan"
            }
          ]
        },
        {
          "label": "打野",
          "value": "daye",
          "children": [
            {
              "label": "李白",
              "value": "libai"
            },
            {
              "label": "韩信",
              "value": "hanxin"
            },
            {
              "label": "云中君",
              "value": "yunzhongjun"
            }
          ]
        }
      ]
    },
    {
      "label": "用户",
      "children": [
        {
          "label": "法师",
          "value": "fashi2",
          "children": [
            {
              "label": "诸葛亮",
              "value": "zhugeliang2"
            }
          ]
        },
        {
          "label": "战士",
          "value": "zhanshi2",
          "children": [
            {
              "label": "曹操",
              "value": "caocao2"
            },
            {
              "label": "钟无艳",
              "value": "zhongwuyan2"
            }
          ]
        },
        {
          "label": "打野",
          "value": "daye2",
          "children": [
            {
              "label": "李白",
              "value": "libai2"
            },
            {
              "label": "韩信",
              "value": "hanxin2"
            },
            {
              "label": "云中君",
              "value": "yunzhongjun2"
            }
          ]
        }
      ]
    }
  ]
}
```

## 事件

| eventName | eventLabel |
|---|---|
| `change` | 值变化 |
| `tab-change` | 选项卡切换 |

## 跟原版 amis 差异

（ZC 改造点描述待 patch_summarizer 补全；可参考源码 diff）
