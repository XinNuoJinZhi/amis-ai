import { service } from '@/utils/request'
import { useDevBaseUrl, useAdminBaseUrl } from "@/utils/util"
//底座-我的流程-重新发起-点击发起。获取form
export function getFormContent(params:any){
  return service({url:useAdminBaseUrl('/processManage/process/getProcessForm'), method:'get', data:params});
}
//底座-我的流程-重新发起-点击发起。获取服务入参
export function getStartVarConfig(params:any){
  return service({url:useAdminBaseUrl('/processManage/process/getStartVarConfig'), method:'get', data:params});
}
//表单管理-设计-获取表单详情
export function getFormDetail(params:any){
  return service({url:useDevBaseUrl('/processManage/form/get'), method:'get', data:params});
}

//表单管理-设计-保存
export function saveFormDetail(params:any){
  return service({url:useDevBaseUrl('/processManage/form/update'), method:'put', data:params});
}

//底座-我的流程-详情-表单回显
export function getProcessFormData(params:any){
  return service({url:useAdminBaseUrl('/processManage/process/detail'), method:'get', data:params});
}
//应用端-我的流程-详情-表单回显
export function getAppProcessFormData(params:any){
  return service({url:useDevBaseUrl('/application/processManage/process/detail'), method:'get', data:params});
}

//移动端-我的流程-重新发起-点击发起。获取form
export function getAppFormContent(params:any){
  return service({url:useDevBaseUrl(`/application/processManage/process/getProcessForm?definitionId=${params.definitionId}&deployId=${params.deployId}&procInsId=${params.procInsId}`), method:'get'});
}
//移动端-我的流程-重新发起-点击发起。获取服务入参
export function getAppStartVarConfig(params:any){
  return service({url:useDevBaseUrl(`/application/processManage/process/getStartVarConfig?processDefId=${params.processDefId}`), method:'get'});
}
