import { service } from '@/utils/request'

import { useDevBaseUrl } from "@/utils/util"
//页面管理-设计页面-按钮是否显示
export function getDesignButton(params:any){
  return service({url:useDevBaseUrl('/app/page/get'), method:'get', data:params});
}

export function deletePage(params:any){
  return service({url:useDevBaseUrl('/app/page/delete?queryKey='+params), method:'delete'});
}
export function getChartData(pageCode:any, appid:any, env: env){
  return service({url:useDevBaseUrl(`/app/page/getByPageCode?pageCode=${pageCode}&appid=${appid}&env=${env}`), method:'get',});
}


