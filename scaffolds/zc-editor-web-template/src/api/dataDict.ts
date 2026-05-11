import { service } from '@/utils/request'
import { useDevBaseUrl } from "@/utils/util"
//应用级字典
export function getAppDictData(){
  return service({url:useDevBaseUrl('/app/dict-type/list'), method:'get'});
}
//组织级字典
export function getAdminDictData(){
  return service({url:useDevBaseUrl('/app/dict-type/shared/list'), method:'get'});
}


