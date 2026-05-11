import { apiPath, baseUrl, devApiPath, adminApiPath, } from '@/sheep/config';
const AccessTokenKey = 'ACCESS_TOKEN'
const RefreshTokenKey = 'REFRESH_TOKEN'
const TenantIdKey = 'tenantId'

// ========== Token 相关 ==========

// 获取 Token
export function getAccessToken() {
  return uni.getStorageSync(AccessTokenKey)
}

// 获取 RefreshToken
export function getRefreshToken() {
  return uni.getStorageSync(RefreshTokenKey)
}

// 设置 Token
export function setToken(token) {
  uni.setStorageSync(AccessTokenKey, token.accessToken)
  uni.setStorageSync(RefreshTokenKey, token.refreshToken)
}

// 移除 Token
export function removeToken() {
  uni.removeStorageSync(AccessTokenKey)
  uni.removeStorageSync(RefreshTokenKey)
  uni.removeStorageSync('permissions')
  uni.removeStorageSync('appTenantCode')
  uni.removeStorageSync('tenantId')
}

export function setAppTenantCode(code) {
  uni.setStorageSync('appTenantCode', code)
}
export function getAppTenantCode() {
  return uni.getStorageSync('appTenantCode')
}
// ========== 租户相关 ==========

export const getTenantId = () => {
  return uni.getStorageSync(TenantIdKey)
}

export const setTenantId = (tenantId) => {
  uni.setStorageSync(TenantIdKey, tenantId)
}

export const useAppBaseUrl = (url, appid, tenantId, onlyUrl = true) => {
  if (onlyUrl) {
    return baseUrl + apiPath + url
  }
  return {
    url: baseUrl + apiPath + url,
    appid: appid,
    tenantId: tenantId
  }
}

export const useDevBaseUrl = (url, appid, tenantId, onlyUrl = true) => {
  if (onlyUrl) {
    return baseUrl + devApiPath + url
  }
  return {
    url: baseUrl + devApiPath + url,
    appid: appid,
    tenantId: tenantId
  }
}

export const useAdminBaseUrl = (url, appid, tenantId, onlyUrl = true) => {
  if (onlyUrl) {
    return baseUrl + adminApiPath + url
  }
  return {
    url: baseUrl + adminApiPath + url,
    appid: appid,
    tenantId: tenantId
  }
}
