# 业务模式：分页列表（Amis `crud` → uniapp + z-paging + s-goods-card）

> 触发：Amis JSON 顶层 `type: "crud"` + `api` 字段时

## 推荐实现骨架

```vue
<template>
  <s-layout title="商品列表">
    <z-paging
      ref="paging"
      v-model="goodsList"
      @query="loadGoods"
      :auto-show-system-loading="true"
    >
      <view v-for="g in goodsList" :key="g.id">
        <s-goods-card :data="g" @tap="onGoodsTap(g)" />
      </view>
    </z-paging>
  </s-layout>
</template>

<script setup>
import { ref } from 'vue'
import api from '@/sheep/api/goods'

const paging = ref(null)
const goodsList = ref([])

async function loadGoods(pageNo, pageSize) {
  const { data, error } = await api.list({ pageNo, pageSize, ...filters })
  if (error) return paging.value.complete(false)
  paging.value.complete(data.list, data.total)
}

function onGoodsTap(g) {
  sheep.$router.go('/pages/goods/detail', { id: g.id })
}
</script>
```

## 关键决策

| Amis JSON 字段 | 翻译成 uniapp |
|---|---|
| `api: "app://goods/list"` | `sheep/api/goods.js::list()` |
| `columns: [...]` 列定义 | 业务卡片 `s-goods-card` props 映射 |
| `filter` 顶部筛选 | `<s-filter>` 或自定义 `<view>` + `v-model` |
| `pageField` / `perPageField` | z-paging 默认 `pageNo` / `pageSize` |

## 同类参考页（scaffold 内 Read 即可）

- `pages/goods/index.vue` — 完整商品列表
- `pages/order/list.vue` — 订单列表（多 tab + 状态筛选）
- `pages/coupon/list.vue` — 优惠券列表（领取 / 已领 切换）

## DO/DON'T

✅ **DO**：用 `z-paging` 包装列表，下拉刷新 + 触底加载自带
✅ **DO**：列表 item 抽成 `s-*-card` 业务组件，复用统一样式
❌ **DON'T**：不要直接用 `<wd-list>` 写商品列表，没有 paging 状态管理
❌ **DON'T**：不要在 `<template>` 里直接 fetch，用 `@query` 回调让 z-paging 控制时机
