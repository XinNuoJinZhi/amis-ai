<script setup lang="ts">
// 示例首页 — Agent 会替换为按 Amis JSON 生成的业务页面
</script>

<template>
  <el-card shadow="never">
    <template #header>
      <span style="font-size: 18px; font-weight: 600">🎉 Vue 3 + Element Plus 底座已就绪</span>
    </template>
    <p style="color: #666">
      这是 amis-ai 反向飞轮的 Vue 3 底座模板。Agent 会在这个基础上按你的 Amis JSON 生成业务页面。
    </p>
    <el-space wrap>
      <el-tag type="primary">Vue 3</el-tag>
      <el-tag type="info">TypeScript</el-tag>
      <el-tag type="warning">Vite 5</el-tag>
      <el-tag type="success">Element Plus 2.x</el-tag>
      <el-tag>Vue Router 4</el-tag>
    </el-space>
  </el-card>
</template>
