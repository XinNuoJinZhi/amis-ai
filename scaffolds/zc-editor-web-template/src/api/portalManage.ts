import { service } from '@/utils/request'

import { useDevBaseUrl } from "@/utils/util"
//门户管理-关联页面接口
export function getCorrelationPage(type:any){
  return service({url:useDevBaseUrl('/app/portal/getAssociatePage?type='+type), method:'get'});
}

//门户管理-编辑页面
export function getUpdatePortal(params:any){
  return service({url:useDevBaseUrl('/app/portal/update'), method:'put',data:params});
}
//门户管理-大屏
export function getCorrelationLarge(){
  return service({url:useDevBaseUrl('/api/goview/project/getListData'), method:'get'});
}
