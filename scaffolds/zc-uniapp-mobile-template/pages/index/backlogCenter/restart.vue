<template>
  <view
    class="page-app"
    :class="['theme-' + sys?.mode, 'main-' + sys?.theme, 'font-' + sys?.fontSize]"
  >
    <view class="page-detail">
      <su-navbar
        title="重新发起流程"
        statusBar
      ></su-navbar>
      <view class="page-body">
        <web-view :src="webUrl" @message="handleMessage" ref="webviewRef"></web-view>
        <!-- <s-tabbar :path="tabbar" /> -->
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
  import { ref, computed, getCurrentInstance } from 'vue';
	import { onLoad, onReady } from '@dcloudio/uni-app';
  import { getAccessToken, getRefreshToken, getTenantId, getAppTenantCode } from '@/sheep/util/auth'
  import sheep from '@/sheep';
	// 隐藏原生tabBar
	uni.hideTabBar();
  const sysStore = sheep.$store('sys');
  const sys = computed(() => sysStore);
  const webUrl = ref()
  const webviewRef = ref(null);
  let wv = null; // 存储原生 WebView 实例
  onLoad((e) => {
    webUrl.value = import.meta.env.SHOPRO_WEB_URL +
      '/app/restart' + "?procInsId=" +  e.procInsId + "&deployId=" + e.deployId + "&definitionId=" + e.definitionId  + "&appid=" +e.appid + "&env=" + e.env + (e.portalKey ? '&portalKey=' + e.portalKey : '')
      + '&token=' + getAccessToken()
      + '&refreshToken=' + getRefreshToken()
      + '&tenantId=' + getTenantId()
      + '&appTenantCode=' + getAppTenantCode()
  })

  const handleMessage = (e) => {
    // e.detail.data 是网页发送的消息数组（通常取第一个元素）
    const message = e.detail.data[0];
    // 判断是否是“需要返回首页”的指令（自定义标识，如 'backToList'）
    if (message.action === 'backToList') {
      // 回到首页（关闭所有页面，打开首页）
      uni.navigateTo({
        url: './todo'
      })
    }
  };
  onReady(() => {
    // 仅在 App 环境生效（H5/小程序不支持 plus API）
    // #ifdef APP-PLUS
    // 获取当前页面的原生 WebView 实例（替代 Vue2 中的 this.$scope.$getAppWebview()）
    const currentInstance = getCurrentInstance();
    const currentWebview = currentInstance.proxy.$getAppWebview();

    // 延迟确保 web-view 组件初始化完成（必加，否则可能获取不到子 WebView）
    setTimeout(() => {
      // 获取 <web-view> 对应的原生子 WebView（通常是第一个子元素）
      wv = currentWebview.children()[0];
      if (wv) {
        // 动态设置 WebView 样式（距离顶部 150px，高度 300px）
        wv.setStyle({
          top: 90,
          width: '100%' // 可选：确保宽度充满屏幕
        });
      }
    }, 1000);
    // #endif
  });
</script>

<style lang="scss" scoped>

</style>
