import request from '@/sheep/request';
import { useAppBaseUrl, useAdminBaseUrl, useDevBaseUrl } from "@/sheep/util/auth"
const Api = {
  // 获得租户tenantId
  getTenantIdByNameApi: (name) => {
    return request({
      url: useAppBaseUrl('/system/auth/get-id-by-name?name=' + name),
      method: 'GET'
    });
  },
  getAppTenantCodeByNameApi: (name) => {
      return request({
        url: useAppBaseUrl('/app/tenant/get-appTenant-by-name?name=' + name),
        method: 'GET'
      });
  },
  login : (data) => {
    return request({
      url: useAppBaseUrl('/system/auth/login'),
      method: 'POST',
      data
    })
  },
  logout : () => {
    return request({
      url: useAppBaseUrl('/system/auth/logout'),
      method: 'POST',
    })
  },
  // 获得基本信息
  getUserInfo: () => {
    return request({
      url: useAdminBaseUrl('/system/auth/get-permission-info'),
      method: 'GET',
    });
  },
  getAppTenantByLoginUser: () => {
    return request({
      url: useDevBaseUrl('/app/tenant/getAppTenantByLoginUser'),
      method: 'GET',
    });
  },
  //站内信列表
  getNotifyList: (params) => {
    return request({
      url: useDevBaseUrl('/system/notify-message/my-page'),
      method: 'GET',
      params
    });
  },
  //站内信列表 - 已读
  getUpdateRead: (id) => {
    return request({
      url: useDevBaseUrl('/system/notify-message/update-read?ids='+id),
      method: 'PUT',
    });
  },
  //我的流程列表
  getOwnList: (params) => {
    return request({
      url: useDevBaseUrl('/application/processManage/process/ownList'),
      method: 'GET',
      params
    });
  },
  getCategoryList: () => {
    return request({
      url: useDevBaseUrl('/processManage/category/list'),
      method: 'GET',
    });
  },
  //我的流程-取消
  getStopProcess: (data) => {
    return request({
      url: useDevBaseUrl('/application/processManage/task/stopProcess'),
      method: 'POST',
      data
    });
  },
  //我的流程-重新发起
  getRestart: (data) => {
    return request({
      url: useDevBaseUrl('/application/processManage/process/restartTheProcess'),
      method: 'POST',
      data
    });
  },
  //待办任务列表
  getTodoList: (params) => {
    return request({
      url: useDevBaseUrl('/application/processManage/process/todoList'),
      method: 'GET',
      params
    });
  },
  //已办任务列表
  getFinishList: (params) => {
    return request({
      url: useDevBaseUrl('/application/processManage/process/finishedList'),
      method: 'GET',
      params
    });
  },
  //已办任务-撤回
  getRevokeProcess: (data) => {
    return request({
      url: useDevBaseUrl('/application/processManage/task/revokeProcess'),
      method: 'POST',
      data
    });
  },
  //抄送我的列表
  getCopyList: (params) => {
    return request({
      url: useDevBaseUrl('/application/processManage/process/copyList'),
      method: 'GET',
      params
    });
  },
  //获取所有门户列表
  getPortalList: () => {
    return request({
      url: useDevBaseUrl('/app/portal/getPreviewDataByMobileAcl'),
      method: 'GET',
    });
  },
  //获取门户下动态页面
  getPortalDynamicPage: (portalKey) => {
    return request({
      url: useDevBaseUrl('/app/portal/getPreviewData?portalKey=' + portalKey),
      method: 'GET',
    });
  },
  //获取页面管理下动态页面
  getDynamicPage: () => {
    return request({
      url: useDevBaseUrl('/app/page/pageTree?pageName='),
      method: 'GET',
    });
  },

  // 获取验证图片以及token
  getCodeApi: async(data) => {
    return request({
      url: useAdminBaseUrl('/system/captcha/get'),
      method: 'POST',
      data
    });
  },
  // 滑动或者点选验证
  reqCheckApi: async (data) => {
    return request({
      url: useAdminBaseUrl('/system/captcha/check'),
      method: 'POST',
      data
    });
  },
  getAppProcessDetail: (params) => {
    const procInsId = params.procInsId
    const taskId = params.taskId
    const ccIdentification = params.ccIdentification
    return request({
      url: useDevBaseUrl(`/application/processManage/process/detail?procInsId=${procInsId}&taskId=${taskId}&ccIdentification=${ccIdentification}`),
      method: 'GET',
    });
  },
  getCustomizePermissionsByPageCode: (pageCode) => {
    return request({
      url: useDevBaseUrl(`/application/app/permission/getCustomizePermissionsByPageCode?pageCode=${pageCode}`),
      method: 'GET',
    });
  },
  //抄送人下拉框数据
  getCopyListData: () => {
    return request({
      url: useDevBaseUrl(`/application/system/user/allList`),
      method: 'GET',
    });
  },
  //任务办理-提交
  writeTask: (content) => {
    return request({
      url: useDevBaseUrl('/application/processManage/task/submit'),
      method: 'POST',
      data: content
    });
  },
  //任务办理-暂存
  saveTask: (content) => {
    return request({
      url: useDevBaseUrl('/application/processManage/task/save'),
      method: 'POST',
      data: content
    });
  },
  //任务办理-拒绝
  rejectTask: (content) => {
    return request({
      url: useDevBaseUrl('/application/processManage/task/reject'),
      method: 'POST',
      data: content
    });
  },
  //退回任务列表
  returnTaskListApi: (content) => {
    return request({
      url: useDevBaseUrl('/application/processManage/task/returnList'),
      method: 'POST',
      data: content
    });
  },
  //任务办理-退回
  returnTask: (content) => {
    return request({
      url: useDevBaseUrl('/application/processManage/task/return'),
      method: 'POST',
      data: content
    });
  },
  //转办任务-部门
  getDeptList: () => {
    return request({
      url: useDevBaseUrl('/system/dept/all_list'),
      method: 'GET',
    });
  },
  //转办任务-人员
  getUserList: (deptId) => {
    return request({
      url: useDevBaseUrl('/system/user/allList?deptId='+deptId),
      method: 'GET',
    });
  },
  //任务办理-转办
  transferTask: (content) => {
    return request({
      url: useDevBaseUrl('/application/processManage/task/transfer'),
      method: 'POST',
      data: content
    });
  },
  //任务办理-委派
  delegateTask: (content) => {
    return request({
      url: useDevBaseUrl('/application/processManage/task/delegate'),
      method: 'POST',
      data: content
    });
  },
  //任务办理-通过
  complete: (content) => {
    return request({
      url: useDevBaseUrl('/application/processManage/task/complete'),
      method: 'POST',
      data: content
    });
  },
  //转办任务-人员
  getUnreadCount: () => {
    return request({
      url: useDevBaseUrl('/system/notify-message/get-unread-count'),
      method: 'GET',
    });
  },
  //登录页门户下拉框
  getLoginPortalList: () => {
    return request({
      url: useDevBaseUrl('/app/portal/getPreviewDataByMobile'),
      method: 'GET',
    });
  },
};

export default Api;
