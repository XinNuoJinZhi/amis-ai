import {service} from '@/utils/request'
import {useDevBaseUrl, useAdminBaseUrl} from "@/utils/util"

// 获取高级打印数据
export function getPrintConfigByKey(params?: any) {
    return service({
        url: useDevBaseUrl('/app/page/getPrintConfigByKey'),
        method: 'get',
        data: params
    });
}
