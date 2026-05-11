import { service } from '@/utils/request'
import { useAdminBaseUrl, useDevBaseUrl } from "@/utils/util"

/** 获取应用详情 */
export const getAppInfo = (appId: string | number) => {
    return service({
        url: useAdminBaseUrl('/app/info/getAppInfo?appId='+appId),
        method: 'get'
    })
}

export const getUserInfo = () =>{
    return service({
        url:useDevBaseUrl('/system/user/profile/get'),
        method: 'get'
    });
}
export const getQueryKeyByCode  = (code:any) =>{
    return service({
        url:useDevBaseUrl('/app/page/getQueryKeyByCode?code='+ code),
        method: 'get'
    });
}

export function genAppCode(params:any) {
    return service({
        url: useDevBaseUrl('/app/publish/genAppCode'),
        data: params,
        method: 'post',
        responseType: 'blob',
        config: {
            timeout: 1200000,
        },
    })
}

export function testConnectivity(params:any) {
    return service({
        url: useDevBaseUrl('/app/publish/testConnectivity'),
        data: params,
        method: 'post',
    })
}
