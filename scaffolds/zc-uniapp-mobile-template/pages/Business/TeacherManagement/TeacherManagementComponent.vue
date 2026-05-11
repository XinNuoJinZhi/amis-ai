<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import request from '@/sheep/request';

const f3332e6d9 = reactive({});

/*初始化页面数据*/
const n62824453_initPageData = async () => {
  let resData: any = {};
  resData = await request({
    url: `api://def/f58wowe56y9s`,
    method: 'get',
  });
  Object.assign(f3332e6d9, resData.data);
};

/*页面初始化*/
onLoad(() => {
  n62824453_initPageData();
});
</script>

<template>
  <view
    class="layout-container page"
    style="display: flex; flex-direction: column; min-height: 100vh"
  >
    <view
      class="layout-container page-container"
      style="display: flex; flex-direction: column; min-height: 100vh"
    >
      <view
        class="layout-header page-header"
        style="padding: 0 32rpx; background-color: #fff; border-bottom: 1rpx solid #eee"
      >
        <div class="page-title">添加初始化接口</div></view
      >
      <view class="layout-content page-content" style="flex: 1; padding: 24rpx">
        date is {{ f3332e6d9.datatime ?? '' }}</view
      ></view
    ></view
  >
</template>

<style scoped lang="scss">
/* 页面样式 */
</style>
