import { service } from '@/utils/request'
import { useDevBaseUrl, useAdminBaseUrl } from "@/utils/util"
//我的流程-重新发起
export function getProcessDetail(params:any){
  return service({url:useDevBaseUrl('/application/processManage/process/detail'), method:'get', data:params});
}
//待签任务-签收
export const claimTask = (data:any) => {
  return service({ url:useDevBaseUrl('/application/processManage/task/claim'),  method:'post', data: data })
}

// 查询部门（精简)列表
export const listSimpleDeptApi = async () => {
  return await service({ url: useDevBaseUrl('/system/dept/all_list'), method:'get' })
}

// 查询部门列表
export const listAllDeptApi = async () => {
  return await service({ url: useDevBaseUrl('/system/dept/list-all-simple'), method:'get' })
}
// 查询用户（精简)列表
export const listUserApi = async () => {
  return await service({ url: useDevBaseUrl('/system/user/list-all-simple'), method:'get' })
}
// 部门
export const listAllsimpleApi = async () => {
  return await service({ url: useDevBaseUrl('/system/dept/all_list'), method:'get' })
}
// 查询人员
export const userDepartUserApi = async () => {
  return await service({ url: useDevBaseUrl('/system/user/departUser'), method:'get' })
}
// 查询角色
export const rolePageApi = async () => {
  return await service({ url: useDevBaseUrl('/app/role/page?status=0'), method:'get' })
}

// 查询用户管理列表
export const getUserPageApi = (params:any) => {
  return service({ url: useDevBaseUrl('/system/user/all_page'), method:'get', data:params })
}

//通过
export const complete = (content:any) => {
  return service({ url: useDevBaseUrl('/application/processManage/task/complete'), method:'post', data: content })
}

//委派
export const delegateTask = (content:any) => {
  return service({ url: useDevBaseUrl('/application/processManage/task/delegate'), method:'post', data: content })
}

//转办
export const transferTask = (content:any) => {
  return service({ url: useDevBaseUrl('/application/processManage/task/transfer'), method:'post', data: content })
}

//拒绝
export const rejectTask = (content:any) => {
  return service({ url: useDevBaseUrl('/application/processManage/task/reject'), method:'post', data: content })
}

//审批任务填写
export const writeTask = (content:any) => {
  return service({ url: useDevBaseUrl('/application/processManage/task/submit'), method:'post', data: content })
}

//暂存
export const saveTask = (content:any) => {
  return service({ url: useDevBaseUrl('/application/processManage/task/save'), method:'post', data: content })
}

//退回任务列表
export const returnTaskListApi = (content:any) => {
  return service({ url: useDevBaseUrl('/application/processManage/task/returnList'), method:'post', data: content })
}

//退回
export const returnTask = (content:any) => {
  return service({ url: useDevBaseUrl('/application/processManage/task/return'), method:'post', data: content })
}

//已读
export const updateRead = (id:any) => {
  return service({ url: useDevBaseUrl('/system/notify-message/update-read?ids='+id), method:'put' })
}


