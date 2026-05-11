<template>
  <!--退出系统-->
  <view class="customer-card">
    <wd-row :gutter="0" style="display: block; height: 34px" @click="handleLogOut">
      <wd-col custom-class="card-line" :span="3">
        <wd-icon name="logout" size="22px"></wd-icon>
      </wd-col>
      <wd-col custom-class="card-line card-title" :span="14"> 退出系统 </wd-col>
    </wd-row>
  </view>
</template>

<script setup>
import sheep from '@/sheep';
const handleLogOut = async() => {

  uni.showModal({
    title: '提示',
    content: '是否退出本系统？',
    success: function (res) {
      if (res.confirm) {
        // 清除缓存起来的用户信息
        sheep.$store('user').logout().then((res) => {
          sheep.$router.go('/pages/index/login')
        })
      }
    },
  });
}
</script>

<style lang="scss" scoped>
.customer-card {
  padding-top: 10px;
  padding-bottom: 10px;
  margin: var(--wot-card-margin, 0 var(--wot-size-side-padding, 15px));
  font-size: var(--wot-card-fs, var(--wot-fs-content, 14px));
  line-height: var(--wot-card-line-height, 1.1);
  background-color: var(--wot-card-bg, var(--wot-color-white, white));
  border-radius: var(--wot-card-radius, 8px);
  box-shadow: var(
    --wot-card-shadow-color,
    0px 4px 8px 0px rgba(0, 0, 0, 0.02)
  );
}
:deep(.card-line) {
  display: flex;
  align-items: center;
  float: left;
  height: 100%;
  font-size: var(--wot-card-fs, var(--wot-fs-content, 14px));
  line-height: var(--wot-card-fs, var(--wot-fs-content, 24px));
}

:deep(.card-title) {
  font-weight: bold;
  white-space: nowrap;
}
</style>
