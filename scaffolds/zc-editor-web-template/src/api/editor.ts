import {service} from '@/utils/request'
import { useDevBaseUrl } from "@/utils/util"

//页面管理-编辑器-保存接口
export function savePageManage(params: any) {
    return service({url: useDevBaseUrl('/app/page/update'), method: 'put', data: params});
}

export function getPageManageContent(params: any) {
    return service({url: useDevBaseUrl('/app/page/get'), method: 'get', data: params});
}

//获取页面管理的所有页面

export function getPageOption(portalKey: any) {
    return service({url: useDevBaseUrl('/app/page/pageTree?portalKey='+portalKey), method: 'get'});
}

//获取编辑器的历史记录数据

export function getHistoryData(params: any) {
    return service({url: useDevBaseUrl('/app/page/getPageHistory'), method: 'get', data: params});
}

//启用此版本

export function getEnableVersion(params: any) {
    return service({url: useDevBaseUrl('/app/page/switchHistoryData'), method: 'get', data: params});
}

//对比的数据
export function getCompareData(params: any) {
    return service({url: useDevBaseUrl('/app/page/getPageHistoryContrastData'), method: 'get', data: params});
}

//api权限上传
export function savePageApiPer(params: any) {
    return service({url: useDevBaseUrl('/app/page/savePageApiPer'), method: 'post', data: params});
}

//编辑版本描述
export function getEditVersion(params: any) {
    return service({url: useDevBaseUrl('/app/page/updateVersionDescription'), method: 'put', data: params});
}