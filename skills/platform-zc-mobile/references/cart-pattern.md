# 业务模式：购物车（Amis `crud` + footerToolbar → uniapp 购物车 + 计价）

> 触发：Amis JSON `type: "crud"` + `footerToolbar` 含合计/结算按钮，typically 购物车场景

## 推荐实现骨架

```vue
<template>
  <s-layout title="购物车">
    <view v-for="item in cart.list" :key="item.id" class="cart-item">
      <wd-checkbox v-model="item.checked" @change="updateTotal" />
      <wd-img :src="item.image" />
      <view class="info">
        <view class="name">{{ item.name }}</view>
        <view class="price">¥{{ item.price }}</view>
      </view>
      <wd-input-number v-model="item.qty" :min="1" @change="updateQty(item)" />
    </view>

    <view class="bottom-bar">
      <wd-checkbox v-model="allChecked" @change="onCheckAll">全选</wd-checkbox>
      <view class="total">合计：<text class="price">¥{{ total }}</text></view>
      <wd-button type="primary" @tap="onCheckout">去结算 ({{ checkedCount }})</wd-button>
    </view>
  </s-layout>
</template>

<script setup>
import { computed, onShow } from 'vue'
import { useCartStore } from '@/sheep/store/cart'

const cart = useCartStore()

onShow(() => cart.fetch())

const allChecked = computed({
  get: () => cart.list.every(i => i.checked),
  set: (v) => cart.list.forEach(i => i.checked = v),
})

const checkedItems = computed(() => cart.list.filter(i => i.checked))
const checkedCount = computed(() => checkedItems.value.length)
const total = computed(() =>
  checkedItems.value.reduce((s, i) => s + i.price * i.qty, 0).toFixed(2)
)

async function updateQty(item) {
  await cart.updateQty(item.id, item.qty)
}

function onCheckout() {
  if (!checkedCount.value) return uni.showToast({ title: '请选择商品', icon: 'none' })
  sheep.$router.go('/pages/order/confirm', {
    ids: checkedItems.value.map(i => i.id).join(','),
  })
}
</script>
```

## 关键决策

| Amis JSON 字段 | 翻译成 uniapp |
|---|---|
| `crud.columns[].type: "input-number"` | `<wd-input-number>` |
| `footerToolbar` 合计/按钮 | `<view class="bottom-bar">` 固定底部 |
| `${total}` 计价插值 | `computed(() => items.reduce(...))` |
| `actionType: "link"` 去结算 | `sheep.$router.go('/pages/order/confirm', params)` |

## 同类参考页（scaffold 内 Read 即可）

- `sheep/store/cart.js` — 购物车 store（fetch / add / remove / updateQty / clear）
- `pages/order/confirm.vue` — 订单确认（含购物车清单 + 计价合计）

## DO/DON'T

✅ **DO**：用 Pinia `useCartStore()` 状态管理，购物车多页共享
✅ **DO**：合计用 `computed`，自动响应 checked / qty 变化
✅ **DO**：onShow（不是 onLoad）触发 fetch，从下单页回退时刷新
❌ **DON'T**：不要把 qty 改了直接调 API，先 v-model 本地状态再 debounce 调
