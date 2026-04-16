<script setup lang="ts">
// UniApp 根组件
</script>

<template>
  <page-meta root-font-size="14px" />
  <router-view />
</template>

<style lang="scss">
/* 引入 Wot 主题变量 */
@import './uni.scss';

/* 全局基础样式 */
* {
  box-sizing: border-box;
}

page {
  background-color: #f5f5f5;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, sans-serif;
}
</style>
