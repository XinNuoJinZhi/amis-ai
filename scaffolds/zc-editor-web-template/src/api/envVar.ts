import { service } from '@/utils/request'
import { useDevBaseUrl } from "@/utils/util"

// 获取环境变量
export const getEnvVar = () => {
  return service({ url: useDevBaseUrl('/app/var/list'), method:'get' })
}
//获取注入环境变量和app.user.company信息
export const getContext = () => {
  return service({ url: useDevBaseUrl('/app/info/context'), method:'get' })
}
