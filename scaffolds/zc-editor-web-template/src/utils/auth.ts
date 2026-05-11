import { useCache } from '@/hooks/web/useCache'
import {outLogin} from "@/services/ant-design-pro/api";
import { history } from '@umijs/max';
import {getPortalLoginRouterData} from "@/store/portalLoginRouter";
import {portalKey, envId, appId} from '@/utils/env';

const { wsCache } = useCache()

const AccessTokenKey = 'ACCESS_TOKEN'
const RefreshTokenKey = 'REFRESH_TOKEN'
const AppIdKey = 'APP_ID'
const envIdKey = 'ENV_ID'

export type TokenType = {
    id: number // 编号
    accessToken: string // 访问令牌
    refreshToken: string // 刷新令牌
    userId: number // 用户编号
    userType: number //用户类型
    clientId: string //客户端编号
    expiresTime: number //过期时间
}

// 获取token
export const getAccessToken = () => {
    // 此处与TokenKey相同，此写法解决初始化时Cookies中不存在TokenKey报错
    return wsCache.get(AccessTokenKey) ? wsCache.get(AccessTokenKey) : wsCache.get('ACCESS_TOKEN')
}

// 刷新token
export const getRefreshToken = () => {
    return wsCache.get(RefreshTokenKey)
}

// 设置token
export const setToken = (token: TokenType) => {
    wsCache.set(RefreshTokenKey, token.refreshToken, { exp: token.expiresTime })
    wsCache.set(AccessTokenKey, token.accessToken)
}

// 删除token
export const removeToken = () => {
    wsCache.delete(AccessTokenKey)
    wsCache.delete(RefreshTokenKey)
}

/** 格式化token（jwt格式） */
export const formatToken = (token: string): string => {
    return 'Bearer ' + token
}

// ========== 租户相关 ==========

const TenantIdKey = 'tenantId'//'TENANT_ID'
const TenantNameKey = 'TENANT_NAME'
const AppTenantCodeKey = 'appTenantCode'
const AppTenantNameKey = 'APP_TENANT_NAME'

export const getTenantName = () => {
    return wsCache.get(TenantNameKey)
}

export const setTenantName = (tenantName: string) => {
    wsCache.set(TenantNameKey, tenantName, { exp: 30 * 24 * 60 * 60 })
}

export const removeTenantName = () => {
    wsCache.delete(TenantNameKey)
}

export const getTenantId = () => {
    return wsCache.get(TenantIdKey)
}

export const setTenantId = (tenantId: string) => {
    wsCache.set(TenantIdKey, tenantId)
}

export const removeAppTenantCode = () => {
    wsCache.delete(AppTenantCodeKey)
}

export const getAppTenantCode = () => {
  return wsCache.get(AppTenantCodeKey)
}

export const setAppTenantCode = (appTenantCode: string) => {
  wsCache.set(AppTenantCodeKey, appTenantCode)
}

export const removeTenantId = () => {
  wsCache.delete(TenantIdKey)
}


export const wsCacheClear = () => {
  wsCache.clear()
}

/**
 * 退出登录，并且将当前的 url 保存
 */
export const loginOut = async () => {
  await outLogin();
  removeToken();
  wsCacheClear();
  const { search, pathname } = window.location;
  const urlParams = new URL(window.location.href).searchParams;
  const searchParams = new URLSearchParams({
    redirect: pathname + search,
  });
  appId && searchParams.set('appid', appId);
  envId && searchParams.set('env', envId);
  portalKey && searchParams.set('portalKey', portalKey);
  const portalLoginRoute = getPortalLoginRouterData();
  /** 此方法会跳转到 redirect 参数所在的位置 */
  const redirect = urlParams.get('redirect');
  // Note: There may be security issues, please note
  if (!['/app/design/user/login', portalLoginRoute.routePath].includes(window.location.pathname) && !redirect) {
    const targetPath = portalKey ? portalLoginRoute.routePath : '/app/design/user/login';
    history.replace({
      pathname: targetPath,
      search: searchParams.toString(),
    });
  }
};



