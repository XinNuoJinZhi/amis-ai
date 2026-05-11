/**
 * InitialState — 替代 UMI 的 initialState 插件
 *
 * 提供全局初始状态（currentUser、settings、appInfo 等），
 * 通过 Context 暴露给 useModel('@@initialState') shim。
 *
 * 迁移自原 app.tsx 的 getInitialState()。
 */
import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { currentUser as queryCurrentUser, getAppInfo, getPreviewDataApi } from '@/services/ant-design-pro/api';
import { setAMISGlobalData, getAMISGlobalData } from '@/store/AmisGlobalData';
import { getPortalLoginRouterData } from '@/store/portalLoginRouter';
import { getRefreshToken, setTenantId } from '@/utils/auth';
import { appId, portalKey } from '@/utils/env';
import { getTabIcon } from '@/utils/util';
import defaultSettings from '../../config/defaultSettings';
import defaultAvatar from '@/assets/imgs/avatar.gif';
import { RouterWhiteList } from '@/utils/patchClientRoutes';
import { history } from '@umijs/max';
import {
  fetchContext,
  fetchPermissions,
  fetchThemeConfig,
  fetchAllDept,
  fetchMemoryVariable,
  fetchAllUser,
  fetchInfraConfig,
} from '@/utils/dataLoader';

const loginPath = '/app/design/user/login';

// ============== 类型定义 ==============
export interface InitialState {
  settings?: any;
  currentUser?: any;
  appInfo?: any;
  fetchUserInfo?: () => Promise<any>;
  fetchAppInfo?: () => Promise<any>;
}

export interface InitialStateContextValue {
  initialState: InitialState | undefined;
  setInitialState: React.Dispatch<React.SetStateAction<InitialState | undefined>>;
  loading: boolean;
  refresh: () => Promise<void>;
}

export const InitialStateContext = createContext<InitialStateContextValue>({
  initialState: undefined,
  setInitialState: () => {},
  loading: true,
  refresh: async () => {},
});

// ============== 非路由数据延迟加载（原 app.tsx render 的第三批）==============
let _deferredDataReady: Promise<void> | null = null;

const kickoffDeferredDataLoad = () => {
  if (_deferredDataReady) return _deferredDataReady;
  _deferredDataReady = (async () => {
    await Promise.all([
      fetchInfraConfig(),
      fetchPermissions(),
      fetchThemeConfig(),
      fetchAllDept(),
      fetchMemoryVariable(),
      fetchAllUser(),
    ]);
    await fetchContext();
  })();
  return _deferredDataReady;
};

// ============== 核心加载逻辑（迁移自 app.tsx getInitialState）==============
async function loadInitialState(): Promise<InitialState> {
  // 等待非路由数据（权限、主题、用户列表等）加载完
  await kickoffDeferredDataLoad();

  const fetchUserInfo = async () => {
    try {
      const msg = await queryCurrentUser({ skipErrorHandler: true });
      setAMISGlobalData({
        ...getAMISGlobalData(),
        amisUser: {
          avatar: msg.data.data.avatar || defaultAvatar,
          name: msg.data.data.nickname,
        },
      });
      return msg.data.data;
    } catch (_error) {
      if (!RouterWhiteList.includes(window.location.pathname)) {
        history.push(loginPath);
      }
    }
    return undefined;
  };

  const fetchAppInfo = async () => {
    try {
      const response = await getAppInfo({
        appId: appId || '',
        portalKey: portalKey || undefined,
      });
      return response.data.data;
    } catch (_error) {
      history.push(loginPath);
    }
    return undefined;
  };

  const appInfo = await fetchAppInfo();
  const portalLoginRoute = getPortalLoginRouterData();

  if (
    portalKey &&
    ![loginPath, '/user/register', '/user/register-result', portalLoginRoute.routePath].includes(
      window.location.pathname,
    )
  ) {
    const portalRouterRes = await getPreviewDataApi(portalKey);
    const { portalName, logo } = portalRouterRes?.data?.data || {};
    if (appInfo) {
      if (portalName) appInfo.name = portalName;
      if (logo) appInfo.icon = logo;
    }
  }

  if (appInfo?.icon) getTabIcon(appInfo.icon);
  if (appInfo?.tenantId) setTenantId(appInfo.tenantId);

  const settings = {
    ...defaultSettings,
    title: appInfo?.name,
    logo: appInfo?.icon,
  };

  const whitelist = [
    loginPath,
    '/user/register',
    '/user/register-result',
    portalLoginRoute.routePath,
    ...RouterWhiteList,
  ];

  if (!whitelist.includes(window.location.pathname)) {
    const currentUser = await fetchUserInfo();
    return { fetchUserInfo, fetchAppInfo, currentUser, appInfo, settings };
  }
  return { fetchUserInfo, fetchAppInfo, appInfo, settings };
}

// ============== Provider ==============
export const InitialStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [initialState, setInitialState] = useState<InitialState | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const state = await loadInitialState();
      setInitialState(state);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // 未登录时跳过加载（避免无 token 空跑接口）
    if (!getRefreshToken()) {
      setLoading(false);
      return;
    }
    refresh();
  }, [refresh]);

  const ctx = useMemo<InitialStateContextValue>(
    () => ({ initialState, setInitialState, loading, refresh }),
    [initialState, loading, refresh],
  );

  return <InitialStateContext.Provider value={ctx}>{children}</InitialStateContext.Provider>;
};
