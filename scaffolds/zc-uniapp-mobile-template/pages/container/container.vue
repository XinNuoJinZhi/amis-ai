<template>
    <view class="container-page">
        <!-- 加载中状态 -->
        <view v-if="loading" class="loading">页面加载中...</view>
        <!-- 核心：动态渲染匹配的组件 -->
        <component
          v-else-if="currentComponent"
          :is="currentComponent"
          :context="context"
        ></component>
        <!-- 页面不存在兜底 -->
        <view v-else class="empty">当前页面暂未上线</view>
    </view>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { onLoad } from '@dcloudio/uni-app';
// 引入映射表核心方法
import { getComponentByPageName } from '@/sheep/util/businessPageMap.js'
import Api from "@/sheep/api/system/api"

uni.hideTabBar();

const loading = ref(true) // 加载状态（ref声明基础类型）
const currentComponent = ref(null) // 当前渲染的动态组件
const pageParams = reactive({}) // 页面传参（reactive声明引用类型）
const context = ref({})
onLoad(async(options) => {
  // 接收跳转传递的「页面名称」和「剩余参数」
  const { pageName, pageCode, ...params } = options
  const res = await Api.getCustomizePermissionsByPageCode(pageCode)
  context.value = res.data.context
  // 赋值页面参数
  Object.assign(pageParams, params)
  // 初始化渲染组件
  initDynamicComponent(pageName)
})
//根据页面名称匹配组件并渲染
const initDynamicComponent = async(pageName) => {
  if (!pageName) {
    loading.value = false
    uni.showToast({ title: "页面地址异常", icon: "none" })
    return
  }
  // 从映射表中获取对应组件
  const targetComponent = getComponentByPageName(pageName)
  if (targetComponent) {
    currentComponent.value = targetComponent
  }
  loading.value = false
}
</script>

<style scoped>
.container-page { 
  width: 100%; 
  height: 80vh;
  box-sizing: border-box;
}
.loading { 
  text-align: center; 
  padding-top: 50vh; 
  font-size: 28rpx; 
  color: #999; 
}
.empty { 
  text-align: center; 
  padding-top: 50vh; 
  font-size: 28rpx; 
  color: #999; 
}
</style>