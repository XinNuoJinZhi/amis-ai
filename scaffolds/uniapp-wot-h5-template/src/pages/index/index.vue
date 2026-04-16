<script setup lang="ts">
import { ref } from 'vue'

const count = ref(0)

function handleClick() {
  count.value++
  uni.showToast({
    title: `点击了 ${count.value} 次`,
    icon: 'none',
  })
}
</script>

<template>
  <view class="container">
    <view class="header">
      <text class="title">amis-ai 脚手架</text>
      <text class="subtitle">UniApp + Wot UI H5 种子项目</text>
    </view>

    <view class="card">
      <text class="card-title">环境验证</text>
      <text class="card-desc">点击下方按钮，验证 Wot UI 组件是否正常工作</text>
      <wd-button type="primary" @click="handleClick">
        Wot 按钮 (已点击 {{ count }} 次)
      </wd-button>
    </view>

    <view class="card">
      <text class="card-title">技术栈</text>
      <wd-cell-group>
        <wd-cell title="框架" value="Vue 3 + TypeScript" />
        <wd-cell title="构建工具" value="Vite + UniApp" />
        <wd-cell title="UI 组件库" value="Wot Design Uni" />
        <wd-cell title="HTTP 客户端" value="Axios" />
      </wd-cell-group>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.container {
  padding: 32rpx;
}

.header {
  text-align: center;
  margin-bottom: 48rpx;
  padding-top: 40rpx;
}

.title {
  display: block;
  font-size: 48rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 12rpx;
}

.subtitle {
  display: block;
  font-size: 28rpx;
  color: #999;
}

.card {
  background: #fff;
  border-radius: 16rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.08);
}

.card-title {
  display: block;
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 16rpx;
}

.card-desc {
  display: block;
  font-size: 26rpx;
  color: #666;
  margin-bottom: 24rpx;
  line-height: 1.6;
}
</style>
