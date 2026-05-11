import { service } from '@/utils/request'
import { useAdminBaseUrl, useDevBaseUrl } from "@/utils/util"
import {getTenantId} from '@/utils/auth';
import axios, { AxiosError } from 'axios';

//退出系统
export const loginOutApi = () => {
  return service({ url: useAdminBaseUrl('/system/auth/logout'), method:'post', })
}
// 修改用户个人信息
export const updateUserProfileApi = (data:any) => {
  return service({ url:  useAdminBaseUrl('/system/user/profile/update'), method:'put',data })
}
// 获取用户个人信息
export const getUserProfileApi = () => {
  return service({ url: useDevBaseUrl('/system/user/profile/get'), method:'get' })
}
// 用户密码重置
export const updateUserPwdApi = (oldPassword: string, newPassword: string) => {
  return service({
    url:  useAdminBaseUrl('/system/user/profile/update-password'),
    data: {
      oldPassword: oldPassword,
      newPassword: newPassword
    },
    method:'put'
  })
}

//手机注册
export const getMobileRegister = (data:any) => {
  return service({ url: useDevBaseUrl('/system/auth/mobileRegister'), data, method:'post'})
}

//邮箱注册
export const getEmailRegister = (data:any) => {
  return service({ url: useDevBaseUrl('/system/auth/register'), data, method:'post'})
}
