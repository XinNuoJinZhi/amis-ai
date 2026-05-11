<template>
  <s-layout 
    title="待办中心"
    tabbar="/pages/index/backlog"
    navbar="inner"
    :bgStyle="template.page"
    :navbarStyle="template.navigationBar"
    onShareAppMessage>
    <wd-grid clickable :column="2" :gutter="10">
      <wd-grid-item @itemclick="toOwn" icon="notification" text="我的流程" v-hasPermi="['appProcessManage:process:queryOwnList']"/>
      <wd-grid-item @itemclick="toTodo" icon="check-circle" text="待办任务" v-hasPermi="['appProcessManage:process:queryTodo']"/>
      <wd-grid-item @itemclick="toFinish" icon="list" text="已办任务" v-hasPermi="['appProcessManage:process:queryFinished']"/>
      <wd-grid-item @itemclick="toCopy" icon="copy" text="抄送我的" v-hasPermi="['appProcessManage:process:queryCopy']"/>
    </wd-grid>
  </s-layout>
</template>

<script lang="ts" setup>
  import { computed } from 'vue';
	import sheep from '@/sheep';
	// 隐藏原生tabBar
	uni.hideTabBar();
	const template = computed(() => sheep.$store('app').template?.home);
  const toOwn = () => {
    uni.navigateTo({
      url: '/pages/index/backlogCenter/own'
    })
  }
  const toTodo = () => {
    uni.navigateTo({
      url: '/pages/index/backlogCenter/todo'
    })
  }
  const toFinish = () => {
    uni.navigateTo({
      url: '/pages/index/backlogCenter/finish'
    })
  }
  const toCopy = () => {
    uni.navigateTo({
      url: '/pages/index/backlogCenter/copy'
    })
  }
</script>

<style lang="scss" scoped>

</style>
  
