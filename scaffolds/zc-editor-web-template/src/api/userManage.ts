import { service } from '@/utils/request'
import { useDevBaseUrl } from "@/utils/util"
// 用户管理-是否封禁
export function updateStatus(params: any) {
    return service({ url: useDevBaseUrl('/application/system/user/update-status'), method: 'put', data: params })
}


