import { service } from '@/utils/request'

import { useDevBaseUrl } from "@/utils/util"
//共享接口-新增保存
export function saveApiShare(params:any){
  return service({url: useDevBaseUrl('/app/api-share/saveOrUpdateApiShare'), method:'post', data:params});
}

//OpenAPI-保存
export function saveOpenApi(params:any){
  return service({url: useDevBaseUrl('/app/api-share/saveOpenAPI'), method:'post', data:params});
}

export function saveAppOpenApi(params:any){
  return service({url: useDevBaseUrl('/application/app/api-share/saveOpenAPI'), method:'post', data:params});
}

