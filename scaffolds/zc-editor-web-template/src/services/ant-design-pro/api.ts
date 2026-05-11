// @ts-ignore
/* eslint-disable */
import { request } from '@umijs/max';
import { service } from "@/utils/request";
import {getAdminBaseURL, getDevBaseURL} from '@/utils/env';
import { isAppEnd } from '@/utils';

/** 获取当前的用户 GET /system/user/profile/get */
export async function currentUser(options?: { [key: string]: any }) {
  return service( {
    url: getDevBaseURL('/system/user/profile/get'),
    method: 'get',
    ...(options || {}),
  });
}

/** 退出登录接口 POST /system/auth/logout */
export async function outLogin(options?: { [key: string]: any }) {
  return service( {
    url: getAdminBaseURL('/system/auth/logout'),
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
    },
    ...(options || {}),
  });
}

/** 获取租户id */
export async function getTenantName(tenantName: string) {
  return service( {
    url: getAdminBaseURL('/system/tenant/get-id-by-name'),
    method: 'get',
    data: {
      name: tenantName
    },
  });
}

/** 获取APP租户id */
export async function getAppTenantName(appTenantName: string) {
  return service( {
    url: getAdminBaseURL('/app/tenant/get-appTenant-by-name'),
    method: 'get',
    data: {
      name: appTenantName
    },
  });
}
/** 获取应用信息 */
export async function getAppInfo({appId, portalKey}: {
  appId: string,
  portalKey?: string
}) {
  return service( {
    url: getAdminBaseURL('/app/info/getAppInfo'),
    method: 'get',
    data: {
      appId: appId,
      portalKey: portalKey
    },
  });
}

/** 获取全部应用租户 */
export async function getAllTenantByAppId() {
  return service( {
    url: getAdminBaseURL('/app/tenant/getAllTenantByAppId'),
    method: 'get',
    data: {
    },
  });
}

/** 根据租户获取部门列表 */
export async function queryDeptByAppTenantCode(appTenantCode: string) {
  return service( {
    url: getDevBaseURL('/app/tenant/queryDeptByAppTenantCode'),
    method: 'get',
    data: {
      appTenantCode: appTenantCode
    },
  });
}

/** 获取手机验证码 */
export async function sendSmsMobileCode(data: any) {
  return service( {
    url: getDevBaseURL('/system/auth/send-sms-mobile-code'),
    method: 'post',
    data: data,
  });
}

/** 获取手机验证码 */
export async function sendSmsEmailCode(data: any) {
  return service( {
    url: getDevBaseURL('/system/auth/send-sms-email-code'),
    method: 'post',
    data: data,
  });
}

/** 登录接口 POST /system/auth/login */
export async function login(body: API.LoginParams, options?: { [key: string]: any }) {
  return service( {
    url: getAdminBaseURL('/system/auth/login'),
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** 获取编辑端菜单 */
export async function getEditMenuApi() {
  return service( {
    url: getAdminBaseURL('/system/auth/list-menus/edit'),
    method: 'get'
  });
}

/** 获取应用端系统菜单 */
export async function getAppSysMenuApi() {
  return service( {
    url: getAdminBaseURL('/system/auth/list-menus/app'),
    method: 'get'
  });
}

/** 获取应用端业务菜单 */
export async function getAppMenuApi() {
  return service( {
    url: getDevBaseURL('/application/app/page/menu'),
    method: 'get'
  });
}

/**
 * 获取预览门户数据
 * 策略：sessionStorage 缓存 + stale-while-revalidate
 * - 有缓存：立即返回缓存数据（~0ms），后台静默刷新
 * - 无缓存：发起真实请求，结果写入缓存
 * - 同一页面加载内 Promise 去重（不会重复发请求）
 */
const _previewDataCache = new Map<string, Promise<any>>();
export function getPreviewDataApi(portalKey: string) {
  // 同一页面加载内的 Promise 去重
  if (_previewDataCache.has(portalKey)) {
    return _previewDataCache.get(portalKey)!;
  }
  const cacheKey = `_portal_preview_${portalKey}`;
  const cached = sessionStorage.getItem(cacheKey);

  if (cached) {
    // 有缓存：立即返回，后台静默刷新
    const promise = Promise.resolve(JSON.parse(cached));
    _previewDataCache.set(portalKey, promise);
    // 后台刷新缓存（不阻塞当前流程）
    service({
      url: getDevBaseURL('/app/portal/getPreviewData?portalKey=' + portalKey),
      method: 'get'
    }).then(res => {
      if (res?.data?.code === 0) {
        sessionStorage.setItem(cacheKey, JSON.stringify(res));
      }
    }).catch(() => {});
    return promise;
  }

  // 无缓存：发起真实请求，写入缓存
  const promise = service({
    url: getDevBaseURL('/app/portal/getPreviewData?portalKey=' + portalKey),
    method: 'get'
  }).then(res => {
    if (res?.data?.code === 0) {
      sessionStorage.setItem(cacheKey, JSON.stringify(res));
    }
    return res;
  });
  _previewDataCache.set(portalKey, promise);
  return promise;
}
/** 获取门户列表数据 */
export async function getPortalListApi() {
  return service( {
    url: getDevBaseURL('/app/portal/portalPreviewDropdownBox'),
    method: 'get'
  });
}
/** 获取应用门户列表数据 */
export async function getApplicationPortalListApi() {
  return service( {
    url: getDevBaseURL('/app/portal/application/portalPreviewDropdownBox'),
    method: 'get'
  });
}
/** 获取自定义权限 */
export async function getCustomizePermissionsByPageCode(pageCode: string) {
  return service( {
    url: getDevBaseURL('/application/app/permission/getCustomizePermissionsByPageCode?pageCode=' + pageCode),
    method: 'get'
  });
}

/** 获取功能权限 */
export async function getPermissionsOwnedByLoginUser() {
  return service( {
    url: getDevBaseURL('/app/permission/getPermissionsOwnedByLoginUser'),
    method: 'get'
  });
}

/** 获取所有用户数据 */
export async function getAllUserApi() {
  return service( {
    url: getDevBaseURL('/system/user/allList'),
    method: 'get'
  });
}

/** 获取所有部门数据 */
export async function getAllDeptApi() {
  return service( {
    url: getDevBaseURL('/system/dept/all_list'),
    method: 'get'
  });
}

/** 获取主题配置数据 */
export async function getThemeApi() {
  return service( {
    url: getDevBaseURL('/app/theme/getAppTheme'),
    method: 'get'
  });
}

/** 获取内存变量数据 */
export async function getVariableApi() {
  return service( {
    url: getDevBaseURL(isAppEnd() ? '/application/app/variable/list' : '/app/variable/list'),
    method: 'get'
  });
}

/** 获取应用租户编码 */
export async function getAppTenantByLoginUser() {
  return service( {
    url: getAdminBaseURL('/app/tenant/getAppTenantByLoginUser'),
    method: 'get'
  });
}

/** 获取门户登录页信息 */
export async function getPortalLoginInfo(options: any) {
  return service( {
    url: getAdminBaseURL('/app/info/getPortalInfo'),
    method: 'get',
    ...options
  });
}

/** 此处后端没有提供注释 GET /api/notices */
export async function getNotices(options?: { [key: string]: any }) {
  return request<API.NoticeIconList>('/api/notices', {
    method: 'GET',
    ...(options || {}),
  });
}

/** 获取规则列表 GET /api/rule */
export async function rule(
  params: {
    // query
    /** 当前的页码 */
    current?: number;
    /** 页面的容量 */
    pageSize?: number;
  },
  options?: { [key: string]: any },
) {
  return request<API.RuleList>('/api/rule', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** 更新规则 PUT /api/rule */
export async function updateRule(options?: { [key: string]: any }) {
  return request<API.RuleListItem>('/api/rule', {
    method: 'POST',
    data: {
      method: 'update',
      ...(options || {}),
    },
  });
}

/** 新建规则 POST /api/rule */
export async function addRule(options?: { [key: string]: any }) {
  return request<API.RuleListItem>('/api/rule', {
    method: 'POST',
    data: {
      method: 'post',
      ...(options || {}),
    },
  });
}

/** 删除规则 DELETE /api/rule */
export async function removeRule(options?: { [key: string]: any }) {
  return request<Record<string, any>>('/api/rule', {
    method: 'POST',
    data: {
      method: 'delete',
      ...(options || {}),
    },
  });
}
