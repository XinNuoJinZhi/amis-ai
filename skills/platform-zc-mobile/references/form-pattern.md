# 业务模式：表单提交（Amis `form` → uniapp + wd-form + 校验）

> 触发：Amis JSON 顶层 `type: "form"` + `controls` 时

## 推荐实现骨架

```vue
<template>
  <s-layout title="提交订单">
    <wd-form ref="formRef" :model="form" :rules="rules">
      <wd-input
        v-model="form.address"
        label="收货地址"
        prop="address"
        required
      />
      <wd-textarea
        v-model="form.remark"
        label="备注"
        prop="remark"
        :maxlength="200"
      />
      <wd-radio-group v-model="form.payment" prop="payment">
        <wd-radio value="wxpay">微信支付</wd-radio>
        <wd-radio value="balance">余额支付</wd-radio>
      </wd-radio-group>
    </wd-form>

    <view class="bottom-bar">
      <wd-button type="primary" block @tap="onSubmit">提交</wd-button>
    </view>
  </s-layout>
</template>

<script setup>
import { ref, reactive } from 'vue'
import api from '@/sheep/api/order'

const formRef = ref(null)
const form = reactive({ address: '', remark: '', payment: 'wxpay' })

const rules = {
  address: [{ required: true, message: '请填写地址' }],
  payment: [{ required: true, message: '请选择支付方式' }],
}

async function onSubmit() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  const { data, error } = await api.create(form)
  if (error) return uni.showToast({ title: error.message, icon: 'none' })
  sheep.$router.go('/pages/pay/index', { orderNo: data.orderNo })
}
</script>
```

## 关键决策

| Amis JSON 字段 | 翻译成 uniapp |
|---|---|
| `controls[].type: "text"` | `<wd-input>` |
| `controls[].type: "textarea"` | `<wd-textarea>` |
| `controls[].type: "select"` / `radios` | `<wd-picker>` / `<wd-radio-group>` |
| `controls[].required: true` | `rules: [{ required: true }]` + `prop` |
| `api` 字段（POST 提交） | `sheep/api/<entity>.js::save()` |

## 同类参考页（scaffold 内 Read 即可）

- `pages/user/info.vue` — 个人资料编辑
- `pages/order/confirm.vue` — 订单确认（form + 商品列表 + 计价摘要混搭）
- `pages/user/setAddress.vue` — 地址新增（含省市区选择）

## DO/DON'T

✅ **DO**：用 `wd-form` 统一校验，避免散在各 button 里手写判断
✅ **DO**：错误提示走 `uni.showToast({ icon: 'none' })`，不要 `alert`
❌ **DON'T**：不要把多步流程写在一个大 form 里，拆 page 走 router
❌ **DON'T**：不要忘 `prop` 字段，没有它 wd-form 的 rules 不生效
