# 业务模式：详情页（Amis `page` with template → uniapp 详情布局）

> 触发：Amis JSON 顶层 `type: "page"` + body 含 `tpl` / `image` / `carousel` + 详情类业务

## 推荐实现骨架

```vue
<template>
  <s-layout title="商品详情" :navbar="false">
    <wd-swiper :list="goods.images" autoplay :height="375" />

    <view class="info">
      <view class="title">{{ goods.name }}</view>
      <view class="price">¥{{ goods.price }}</view>
      <view class="meta">月销 {{ goods.sales }} · {{ goods.commentCount }} 条评价</view>
    </view>

    <view class="desc">
      <s-rich-text :content="goods.description" />
    </view>

    <view class="bottom-bar">
      <wd-button @tap="onAddToCart">加入购物车</wd-button>
      <wd-button type="primary" @tap="onBuyNow">立即购买</wd-button>
    </view>
  </s-layout>
</template>

<script setup>
import { ref, onLoad } from 'vue'
import api from '@/sheep/api/goods'

const goods = ref({})

onLoad(async (options) => {
  const { data } = await api.detail(options.id)
  goods.value = data
})

async function onAddToCart() {
  await api.addToCart({ goodsId: goods.value.id, qty: 1 })
  uni.showToast({ title: '已加入', icon: 'success' })
}

function onBuyNow() {
  sheep.$router.go('/pages/order/confirm', {
    items: JSON.stringify([{ goodsId: goods.value.id, qty: 1 }]),
  })
}
</script>
```

## 关键决策

| Amis JSON 字段 | 翻译成 uniapp |
|---|---|
| `type: "carousel"` 顶部轮播 | `<wd-swiper>` |
| `type: "tpl"` 文本插值 | `<view>{{ obj.field }}</view>` 直绑 |
| `type: "image"` | `<wd-img>` 或原生 `<image>` |
| `type: "button"` + `actionType: "link"` | `sheep.$router.go(...)` |
| `type: "button"` + `actionType: "ajax"` | `await api.xxx()` + toast |

## 同类参考页（scaffold 内 Read 即可）

- `pages/goods/index.vue` — 商品详情（含 SKU 选择 + 加购）
- `pages/coupon/detail.vue` — 优惠券详情（含使用说明 + 立即领取）
- `pages/activity/groupon/detail.vue` — 拼团详情（含倒计时 + 团长信息）

## DO/DON'T

✅ **DO**：用 `onLoad` 钩子接 route params，不要在 `setup` 里同步 fetch（小程序 url 可能未解析）
✅ **DO**：富文本用 `<s-rich-text>` 不要 `v-html`（小程序不支持）
❌ **DON'T**：不要把详情数据存 Vuex 全局，详情页是临时数据用 ref 即可
