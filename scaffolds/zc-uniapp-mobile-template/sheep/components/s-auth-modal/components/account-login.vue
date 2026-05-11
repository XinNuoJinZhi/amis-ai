<!-- 账号密码登录 accountLogin  -->
<template>
  <view>
    <!-- 表单项 -->
    <wd-form :model="loginData.loginForm" ref="loginForm">
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
      @click="handleLogin"
    >
      <text>登录</text>
    </wd-button>
    <!-- 提示组件 -->
    <wd-toast />
  </wd-form>
  </view>
</template>

<script setup>
  import { ref, reactive} from 'vue';
  import { showAuthModal, closeAuthModal } from '@/sheep/hooks/useModal';
  import { useToast } from 'wot-design-uni'
  import { setTenantId, setToken, setAppTenantCode } from '@/sheep/util/auth'
  import Api from '@/sheep/api/system/api'
  import $store from '@/sheep/store'


  const emits = defineEmits(['onConfirm']);
  const props = defineProps({
    agreeStatus: {
      // 同意登录协议
      type: Boolean,
      required: true,
      default: false
    }
  })

  const toast = useToast() // 提示组件
  const loginForm = ref() // 登录表单 Ref
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
  const handleLogin = async () => {
    if (!props.agreeStatus) {
      emits('onConfirm', false)
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
      // 调用登录接口
      const data = await Api.login(loginData.loginForm)
      // 设置 token
      setToken(data.data);
      
      // const codeRes = await Api.getAppTenantByLoginUser()
      // setAppTenantCode(codeRes.data.code)
      // 获取用户信息，保存到 store
      const userStore = $store('user');
      await userStore.setUserInfoAction();
      closeAuthModal();
      // 跳转到首页
      uni.reLaunch({
        url: '/pages/index/index'
      })
    } catch (error) {
      console.error('[handleLogin][执行登录失败]', error)
    } finally {
      toast.close()
    }
    return
  }
</script>

<style lang="scss" scoped>
  @import '../index.scss';
</style>
