<script setup lang="ts">
// amis-ai 反向飞轮 · Vue3 + Element Plus 底座
// Agent 会在这个基础上按你的 Amis JSON 生成业务页面（直接覆盖 router 和 pages/）
</script>

<template>
  <el-container class="app-container">
    <el-header class="app-header">amis-ai 生成 · Vue 3 + Element Plus</el-header>
    <el-main class="app-main">
      <router-view />
    </el-main>
    <el-footer class="app-footer">
      由 amis-ai 反向飞轮生成 · Vue 3 + Vite + Element Plus
    </el-footer>
  </el-container>
</template>

<style scoped>
.app-container {
  min-height: 100vh;
}
.app-header {
  background: #1677ff;
  color: #fff;
  font-weight: 600;
  display: flex;
  align-items: center;
}
.app-main {
  padding: 24px;
  background: #f5f5f5;
}
.app-footer {
  text-align: center;
  color: #999;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
