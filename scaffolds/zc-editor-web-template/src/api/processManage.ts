import { service } from '@/utils/request'

import { useDevBaseUrl } from "@/utils/util"
//发起流程-发起
export function startProcess(params:any){
  return service({url:useDevBaseUrl('/processManage/process/start'), method:'post', data:params});
}

