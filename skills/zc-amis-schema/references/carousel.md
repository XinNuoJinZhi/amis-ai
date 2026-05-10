---
component: carousel
source: zc-amis-6.8.0-my242v2
category: patched
zc_suite: other
---

# 轮播图（type: `carousel`）

> 用来渲染轮播图，可以配置每一页的内容（不只是图片），可以配置过渡动画。

**标签**：展示
**编辑器面板**：轮播图
**图标**：`fa fa-images`
**文档**：`/amis/zh-CN/components/carousel`
**基础组件**（编辑器内可直接拖拽）

## 默认 scaffold（建议起手用法）

```json
{
    type: 'carousel',
    options: [
      {
        image: mockValue({ type: 'image' })
      },
      {
        html: '<div style="width: 100%; height: 300px; background: #e3e3e3; text-align: center; line-height: 300px;">carousel data</div>'
      },
      {
        image: mockValue({ type: 'image' })
      }
    ]
  }
```

## 跟原版 amis 差异

（ZC 改造点描述待 patch_summarizer 补全；可参考源码 diff）
