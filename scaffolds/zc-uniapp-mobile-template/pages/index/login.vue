<!-- 账号密码登录 accountLogin  -->
<template>
  <view :style="{background: dynamicBgUrl ? `url(${dynamicBgUrl}) no-repeat center center / cover fixed` : ``, minHeight: '100%'}">
  <view class="full pb-3">
    <view class="top">
      <wd-img :width="80" :height="80" :src="appIcon" />
      <text class="appName">{{appName}}</text>
    </view>
    <view class="p-4">
      <view class="mt-4 enter-x mb-3 text-center text-2xl font-bold xl:text-center xl:text-3xl">
        <text class="title">账号密码登录</text>
      </view>
      <!-- 表单项 -->
      <wd-form :model="loginData.loginForm" ref="loginForm">
        <wd-drop-menu>
          <wd-drop-menu-item v-model="portalKey" :options="portalList" @change="changePortal" />
        </wd-drop-menu>
        <wd-input
          v-model="loginData.loginForm.appTenantName"
          prop="appTenantName"
          :rules="[{ required: true, message: '请输入租户名称' }]"
          placeholder="请输入租户名称"
          prefix-icon="home"
        />
        <wd-input
          v-model="loginData.loginForm.username"
          prop="username"
          :rules="[{ required: true, message: '请填写用户名' }]"
          placeholder="请输入用户名"
          prefixIcon="user"
        />
        <wd-input
          v-model="loginData.loginForm.password"
          prop="password"
          :rules="[{ required: true, message: '请填写密码' }]"
          placeholder="请输入密码"
          show-password
          prefixIcon="lock-on"
        />
        <wd-button
          :block="true"
          :round="false"
          style="margin-top: 32px;"
          @click="getCode"
        >
          <text>登录</text>
        </wd-button>
        <Verify
          @success="handleLogin"
          mode="pop"
          :captchaType="captchaType"  
          :imgSize="{ width: '330px', height: '155px' }"
          ref="verify"
        ></Verify>
        <!-- 提示组件 -->
        <wd-toast />
      </wd-form>
    </view>
    <view class="bottom">
      <wd-checkbox v-model="isAgree" @change="toggleAgree" />
      <text>已阅读并同意</text>
      <text class="tcp-text" @click="userInfo">《用户协议》</text>
      <text>和</text>
      <text class="tcp-text" @click="privacyState">《隐私政策》</text>
    </view>
  </view>
  </view>
</template>

<script setup>
  import Verify from "@/sheep/components/verify/verify";
  import { ref, reactive} from 'vue';
  import { useToast } from 'wot-design-uni'
  import { setTenantId, setToken, setAppTenantCode } from '@/sheep/util/auth'
  import Api from '@/sheep/api/system/api'
  import $store from '@/sheep/store'
  import {onLoad} from '@dcloudio/uni-app';

  const emits = defineEmits(['onConfirm']);
  const isAgree = ref(true)
  const appName = import.meta.env.SHOPRO_APP_NAME
  const appIcon = import.meta.env.SHOPRO_APP_icon
  const toast = useToast() // 提示组件
  const loginForm = ref() // 登录表单 Ref
  const verify = ref()
  const captchaType = ref('blockPuzzle') 
  const loginData = reactive({
    // 登录信息
    captchaEnable: import.meta.env.SHOPRO_APP_CAPTCHA_ENABLE,
    tenantEnable: import.meta.env.SHOPRO_APP_TENANT_ENABLE,
    loginForm: {
      appTenantName: '', // 应用租户名称
      tenantName: 'system',
      username: '',
      password: '',
      captchaVerification: '',
      rememberMe: true // 默认记录我。如果不需要，可手动修改
    }
  })

  // 获取租户 ID
  const getTenantId = async () => {
    if (loginData.tenantEnable === 'true') {
      const res = await Api.getTenantIdByNameApi(loginData.loginForm.tenantName)
      setTenantId(res.data)
    }
  }
  // 获取应用租户名称查询租户编码
  const getAppTenantCode = async () => {
      const res = await Api.getAppTenantCodeByNameApi(loginData.loginForm.appTenantName)
      const appTenantCode = res.data.code;
      setAppTenantCode(appTenantCode)
  }
  /** 执行登录 */
  const handleLogin = async (params) => {
    if (!isAgree.value) {
      toast.warning('请阅读并同意《用户协议》和《隐私政策》')
      return
    }
    try {
      await getTenantId()
      // 校验表单
      const { valid } = await loginForm.value.validate()
      if (!valid) {
        return
      }
      // 设置appTenantCode
      await getAppTenantCode()
      //验证码
      loginData.loginForm.captchaVerification = params.captchaVerification
      // 调用登录接口
      const data = await Api.login(loginData.loginForm)
      if(data.code == 0) {
        // 设置 token
        setToken(data?.data);
        const userStore = $store('user');
        await userStore.setUserInfoAction();
        // 登录完成后启动角标定时更新
        const appStore = $store('app');
        appStore.startBadgeTimer();
        // 跳转到首页
        uni.reLaunch({
          url: '/pages/index/index'
        })
      }
    } catch (error) {
      console.error('[handleLogin][执行登录失败]', error)
    } finally {
      toast.close()
    }
    return
  }

  const toggleAgree = ({ value }) =>{
    isAgree.value = value
  }
   // 用户协议
  const userInfo = () => {
    uni.navigateTo({
      url: `/pages/index/components/userInfo`
    })
  }
  // 隐私政策
  const privacyState = () => {
    uni.navigateTo({
      url: '/pages/index/components/privacy'
    })
  }

  const showPortal = ref(true)
  const portalKey = ref('')
  const portalList = ref([])
  const dynamicBgUrl = ref()
  const changePortal = (e) => {
    const selected = portalList.value.filter(i=>i.value == e.value)[0]
    dynamicBgUrl.value = selected.background ? selected.background : ''
    uni.setStorageSync('portalVal', selected.value)
  }
  const getPortalList = async() => {
    const res = await Api.getLoginPortalList()
    const result = res?.data ? res.data : []
    result.forEach(i=>{
      i.label = i.portalName
      i.value = i.portalKey
    })
    portalList.value = res?.data ? res.data : []
    if(portalList.value.length > 0) {
      showPortal.value = true
      if(uni.getStorageSync('portalVal')) {
        portalKey.value = uni.getStorageSync('portalVal')
      } else {
        portalKey.value = portalList.value[0].value
        dynamicBgUrl.value = portalList.value[0].background
        uni.setStorageSync('portalVal', portalList.value[0].value)
      }
      const filterPortal = portalList.value.filter(i=>i.portalKey == portalKey.value)
      dynamicBgUrl.value = filterPortal[0].background
    } else {
      showPortal.value = false
      if(uni.getStorageSync('portalVal')) {
        uni.removeStorageSync('portalVal')
      }
    }
  }
  onLoad(async () => {
    await getPortalList()
  })
  // 获取验证码
  const getCode = async () => {
    // 情况一，未开启：则直接登录
    if (loginData.captchaEnable === 'false') {
      await handleLogin({})
    } else {
      // 情况二，已开启：则展示验证码；只有完成验证码的情况，才进行登录
      // 弹出验证码
      // const data = await validForm()
      // if (!data) {
      //   return
      // }
      const { valid } = await loginForm.value.validate()
      if (!valid) {
        return
      }
      verify.value.show()
    }
  }
</script>

<style lang="scss" scoped>
.top {
  padding: 8rem 3rem 3rem 3rem;
  display: flex;
  justify-content: space-around;
  align-items: center;
}
.appName {
  font-size: 60rpx;
}
.full {
  height: 100%;

}
.bottom{
  position: fixed;
  height: 7.5rem;
  right: 0;
  left: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  // background-color: rgba(255,255,255,0.8);
}
.tcp-text {
  color:  #0B5EFF;
}
.title {
  font-size: 38rpx;
}
</style>
