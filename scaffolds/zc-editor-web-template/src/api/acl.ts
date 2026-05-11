import { service } from '@/utils/request'
import { useDevBaseUrl } from "@/utils/util"

// 获取角色列表-用于【资源权限】界面 - 编辑端
export const getRoleList = () => {
  return service({ url:  useDevBaseUrl('/app/permission/roles'), method:'get' })
}

// 获取角色列表-用于【资源权限】界面 - 应用端
export const getRoleListApp = () => {
  return service({ url:  useDevBaseUrl('/application/app/permission/roles'), method:'get' })
}

// 获取资源列表-用于【资源权限】界面
export const getResourceList = () => {
  return service({ url:  useDevBaseUrl('/app/permission/resourceType'), method:'get' })
}

// 获取资源详情列表-用于【资源权限】界面 - 编辑端
export const getResourceDetail = (resourceType:any, roleId:any) => {
  return service({ url:  useDevBaseUrl('/app/permission/resourceDetail?resourceType=' + resourceType + '&roleId=' + roleId), method:'get' })
}

// 获取资源详情列表-用于【资源权限】界面 - 应用端
export const getResourceDetailApp = ( roleId:any) => {
  return service({ url:  useDevBaseUrl('/application/app/permission/app-resourceDetail?roleId=' + roleId), method:'get' })
}

//资源权限保存
export const saveResourcePermissions = (params:any) => {
  return service({ url:  useDevBaseUrl('/app/permission/saveResourcePermissions'), method:'post', data: params })
}
//资源权限保存-应用端
export const saveResourcePermissionsApp = (params:any) => {
  return service({ url:  useDevBaseUrl('/application/app/permission/saveResourcePermissions'), method:'post', data: params })
}

//功能权限授权后调用权限接口-重新获取数据
export const getPermissions = () => {
  return service({ url:  useDevBaseUrl('/app/permission/getPermissionsOwnedByLoginUser'), method:'get'})
}