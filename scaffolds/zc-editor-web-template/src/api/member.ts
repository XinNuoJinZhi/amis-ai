import { service } from '@/utils/request'
import { useDevBaseUrl } from "@/utils/util"

// 获取资源列表
export const getResourceList = () => {
  return service({ url: useDevBaseUrl('/app/member-level/resourceType'), method:'get' })
}

// 获取资源详情列表
export const getResourceDetail = (resourceType:any, memberLevelId:any) => {
  return service({ url: useDevBaseUrl('/app/member-level/detail?resourceType=' + resourceType + '&memberLevelId=' + memberLevelId), method:'get' })
}


//资源权限保存
export const saveResourcePermissions = (params:any) => {
  return service({ url: useDevBaseUrl('/app/member-level/save'), method:'post', data: params })
}

//会员等级-获取会员功能
export const getLevelMenuList = (levelId:any) => {
  return service({ url: useDevBaseUrl('/system/member-level/list-member-level-menus?levelId=' + levelId), method:'get' })
}

// 个人中心-开通会员
export const createMembership = (params:any) => {
  return service({ url: useDevBaseUrl('/pay/member-order/create'), method:'post', data: params })
}
// 个人中心-开通会员-应用端
export const createAppMembership = (params:any) => {
  return service({ url: useDevBaseUrl('/application/pay/member-order/create'), method:'post', data: params })
}
// 个人中心-获得会员支付订单
export const getMemberOrder= (orderId:any, tenantId:any) => {
  return service({ url: useDevBaseUrl('/pay/member-order/getMemberOrder?id='+orderId+"&tenantId=" + tenantId), method:'get' })
}

// 个人中心-获得会员支付订单-应用端
export const getAppMemberOrder= (orderId:any, tenantId:any) => {
  return service({ url: useDevBaseUrl('/application/pay/member-order/getMemberOrder?id='+orderId+"&tenantId=" + tenantId), method:'get' })
}
//个人中心-会员管理-目标等级
export const getMemberLevelList= () => {
  return service({ url: useDevBaseUrl('/system/member-level/list'), method:'get' })
}

//个人中心-会员管理-目标等级-应用端
export const getAppMemberLevelList= () => {
  return service({ url: useDevBaseUrl('/system/member-level/application/list'), method:'get' })
}

//个人中心-会员管理-取消订单
export const setOrderCancel= (orderId:any,tenantId:any) => {
  return service({ url: useDevBaseUrl('/pay/member-order/cancelOrder?id='+orderId+"&tenantId=" + tenantId), method:'get' })
}

//个人中心-会员管理-取消订单-应用端
export const setAppOrderCancel= (orderId:any) => {
  return service({ url: useDevBaseUrl('/application/pay/member-order/cancelOrder?id='+orderId), method:'get' })
}
//个人中心-数据量管理-创建订单
export const createDataManage = (params:any) => {
  return service({ url: useDevBaseUrl('/application/pay/quota-order/create'), method:'post', data: params })
}
//个人中心-数据量管理-取消订单
export const cancelDataManage = (orderId:any) => {
  return service({ url: useDevBaseUrl('/application/pay/quota-order/cancel?id='+orderId), method:'get'})
}

// 个人中心-数据量管理 - 获取订单
export const getDataMangeOrder= (orderId:any) => {
  return service({ url: useDevBaseUrl('/application/pay/quota-order/get?id='+orderId), method:'get' })
}

//个人中心-获得报价
export const getRenewalVal = (params:any) => {
  return service({ url: useDevBaseUrl('/pay/member-order/memberQuote'), method:'post', data: params })
}
// 个人中心-获得报价-应用端
export const getAppRenewalVal = (params:any) => {
  return service({ url: useDevBaseUrl('/application/pay/member-order/memberQuote'), method:'post', data: params })
}