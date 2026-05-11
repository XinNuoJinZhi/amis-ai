<template>
  <view
    class="page-app"
    :class="['theme-' + sys?.mode, 'main-' + sys?.theme, 'font-' + sys?.fontSize]"
  >
    <view class="page-detail">
      <su-navbar
        title="办理时数据"
        statusBar
      ></su-navbar>
      <view class="page-body">
        <web-view :src="webUrl"></web-view>
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
  const currentInstance = getCurrentInstance();
  let wv = null; // 存储原生 WebView 实例
  const webUrl = ref()
  onLoad(async(e) => {
    webUrl.value = import.meta.env.SHOPRO_WEB_URL +
      '/app/process/submitData' + "?procInsId=" +  e.procInsId + "&taskId=" + (e.taskId ? e.taskId : '') + "&processed=" + e.processed + "&appid=" +e.appid + "&env=" + e.env + (e.portalKey ? '&portalKey=' + e.portalKey : '') + "&ccIdentification=" + e.ccIdentification
      + '&token=' + getAccessToken()
      + '&refreshToken=' + getRefreshToken()
      + '&tenantId=' + getTenantId()
      + '&appTenantCode=' + getAppTenantCode()
  })
  // App端设置web-view样式（核心）
  const setAppWebViewStyle = () => {
    // #ifdef APP-PLUS
    if (!currentInstance) return;
    // 获取当前页面的原生webview容器
    const currentWebview = currentInstance.proxy?.$getAppWebview();
    if (!currentWebview) return;
    // 获取web-view原生实例（子元素第一个）
    wv = currentWebview.children()[0];
    if (wv) {
      // 关键：top设为tab栏高度（50px），避开tab栏
      wv.setStyle({
        top: 80, // tab栏高度，可根据实际调整
        width: '100%',
        left: 0,
        border: "none",
      });
    }
    // #endif
  };

  // 页面渲染完成后初始化App端web-view样式
  onReady(() => {
    // #ifdef APP-PLUS
    setTimeout(() => {
      setAppWebViewStyle();
    }, 3000); // 延迟确保web-view初始化完成
    // #endif
  });
</script>

<style lang="scss" scoped>
</style>
