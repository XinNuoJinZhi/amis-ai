/*
 * @Author: qiuliang qiuliang@detadata.com
 * @Date: 2024-04-28 13:43:06
 * @LastEditors: qiuliang qiuliang@detadata.com
 * @LastEditTime: 2024-05-08 17:56:50
 * @FilePath: \ruoyi_zc_vue3d:\WorkSpace\tx\zc_editor\src\api\theme.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { service } from '@/utils/request'
import { useDevBaseUrl, useAdminBaseUrl } from "@/utils/util"

// 应用设置-主题管理-共享应用主题
export function shareTheme(params: any) { // code
    return service({ url: useDevBaseUrl('/app/theme/shareTheme'), method: 'get', data: params })
}

// 应用设置-主题管理-更新应用主题
export function updateTheme(params: any) { // code
    return service({ url: useDevBaseUrl('/app/theme/update'), method: 'put', data: params })
}

export function uploadFile(file: any) {
    return service({url: useAdminBaseUrl('/infra/file/upload'), method: 'post', data: file})
}

export const delFile = (data: any) => {
    return service({url: useAdminBaseUrl('/infra/file/deleteByUrl?url=' + data.url), method: 'delete'})
}
