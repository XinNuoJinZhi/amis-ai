import {LinkOutlined} from '@ant-design/icons';
import type {Settings as LayoutSettings, MenuDataItem} from '@ant-design/pro-components';
import {SettingDrawer} from '@ant-design/pro-components';
import type {RequestConfig, RunTimeLayoutConfig} from '@umijs/max';
import {history, Link} from '@umijs/max';
import React from 'react';
import {
  AvatarDropdown,
  AvatarName,
  Footer,
  PreviewButton,
  NotifyMessage
} from '@/components';
import {currentUser as queryCurrentUser, getAppInfo, getPreviewDataApi} from '@/services/ant-design-pro/api';
import defaultSettings from '../config/defaultSettings';
import {errorConfig} from './requestErrorConfig';
import '@ant-design/v5-patch-for-react-19';
import {baseURL, appId, envId, portalKey} from '@/utils/env'
import {getRefreshToken, setTenantId} from "@/utils/auth";
import {getTabIcon} from './utils/util';
import defaultAvatar from "@/assets/imgs/avatar.gif"
import patchRoutes, {
  getRouter,
  loadPortalLoginRoute,
  RouterWhiteList
} from '@/utils/patchClientRoutes'
import {
  fetchContext,
  fetchPermissions,
  fetchAllDept,
  fetchMemoryVariable,
  fetchThemeConfig,
  fetchAllUser,
  fetchInfraConfig, fetchAppTenantCode
} from '@/utils/dataLoader'
import {setAMISGlobalData, getAMISGlobalData} from '@/store/AmisGlobalData'
import {getPortalLoginRouterData} from "@/store/portalLoginRouter"
import {Spin, Menu} from 'antd';
import type {MenuProps} from 'antd';
import '@fortawesome/fontawesome-free/css/all.css';
import '@fortawesome/fontawesome-free/css/v4-shims.css';
// BPMN CSS 已移至各 BPMN 组件内部按需加载（ProcessDesigner/ProcessViewer/BPMNProcessViewer）
import {menuRender} from '@/layout'
const LazyChat = React.lazy(() => import('@/components/Chat').then(m => ({ default: m.Chat })))
import {setToken} from '@/utils/auth'
import appTenantCodeStore from "@/store/appTenantCode"

const isDev = process.env.NODE_ENV === 'development';
const loginPath = '/app/design/user/login';

// 非路由数据的延迟加载 Promise（在 render() 中启动，在 getInitialState() 中等待）
let _deferredDataReady: Promise<void> | null = null;

/**
 * @see https://umijs.org/docs/api/runtime-config#getinitialstate
 * */
export async function getInitialState(): Promise<{
  settings?: Partial<LayoutSettings>;
  currentUser?: API.CurrentUser;
  appInfo?: API.AppInfo;
  loading?: boolean;
  fetchUserInfo?: () => Promise<API.CurrentUser | undefined>;
  fetchAppInfo?: () => Promise<API.AppInfo | undefined>
}> {
  // 等待 render() 中启动的非路由数据加载完成（权限/主题/用户/部门等）
  if (_deferredDataReady) await _deferredDataReady;
  const {location} = history;
  const fetchUserInfo = async () => {
    try {
      const msg = await queryCurrentUser({
        skipErrorHandler: true,
      });
      setAMISGlobalData({
        ...getAMISGlobalData(),
        amisUser: {
          avatar: msg.data.data.avatar || defaultAvatar,
          name: msg.data.data.nickname
        }
      })
      return msg.data.data;
      } catch (_error) {
      if(!RouterWhiteList.includes(location.pathname)) {
        history.push(loginPath);
      }
    }
    return undefined;
  };
  // 加载应用信息
  const fetchAppInfo = async () => {
    try {
      const response = await getAppInfo({
        appId: appId || '',
        portalKey: portalKey || undefined
      })
      return response.data.data
    } catch (_error) {
      history.push(loginPath);
    }
    return undefined;
  }
  // 应用信息
  const appInfo = await fetchAppInfo();
  const portalLoginRoute = getPortalLoginRouterData();
  // 处理门户的应用信息
  if (portalKey && ![loginPath, '/user/register', '/user/register-result', portalLoginRoute.routePath].includes(
    location.pathname,
  )) {
    const portalRouterRes = await getPreviewDataApi(portalKey);
    const {portalName, logo} = portalRouterRes?.data?.data;
    portalName && (appInfo.name = portalName)
    logo && (appInfo.icon = logo)
  }
  // 处理应用图标
  appInfo.icon && getTabIcon(appInfo.icon)
  // set租户id
  setTenantId(appInfo.tenantId)

  // 如果不是登录页面，执行
  if (
    ![loginPath, '/user/register', '/user/register-result', portalLoginRoute.routePath, ...RouterWhiteList].includes(
      location.pathname,
    )
  ) {
    const currentUser = await fetchUserInfo();
    return {
      fetchUserInfo,
      fetchAppInfo,
      currentUser,
      appInfo,
      settings: {
        ...defaultSettings,
        title: appInfo.name,
        logo: appInfo.icon,
      } as Partial<LayoutSettings> & { logo?: string }
    };
  }
  return {
    fetchUserInfo,
    fetchAppInfo,
    appInfo,
    settings: {
      ...defaultSettings,
      title: appInfo.name,
      logo: appInfo.icon,
    } as Partial<LayoutSettings> & { logo?: string }
  };
}

// ProLayout 支持的api https://procomponents.ant.design/components/layout
export const layout: RunTimeLayoutConfig =
  ({
     initialState,
     setInitialState,
   }) => {
    return {
      actionsRender: () => [
        <PreviewButton/>,
        <NotifyMessage/>
      ],
      avatarProps: {
        src: initialState?.currentUser?.avatar || defaultAvatar,
        title: <AvatarName/>,
        render: (_, avatarChildren) => {
          return <AvatarDropdown>{avatarChildren}</AvatarDropdown>;
        },
      },
      waterMarkProps: {
        content: initialState?.currentUser?.name,
      },
      // footerRender: () => <Footer />,
      onPageChange: () => {
        const {location} = history;
        const portalLoginRoute = getPortalLoginRouterData();
        // 路由白名单 - 这些路径不需要登录验证
        const whiteList = [
          loginPath,
          portalLoginRoute.routePath,
          ...RouterWhiteList
        ];

        // 如果没有登录且当前路径不在白名单中，则重定向到登录页
        if (!getRefreshToken() && !whiteList.includes(location.pathname)) {
          history.push(loginPath);
        }
      },
      bgLayoutImgList: [
        {
          src: 'https://mdn.alipayobjects.com/yuyan_qk0oxh/afts/img/D2LWSqNny4sAAAAAAAAAAAAAFl94AQBr',
          left: 85,
          bottom: 100,
          height: '303px',
        },
        {
          src: 'https://mdn.alipayobjects.com/yuyan_qk0oxh/afts/img/C2TWRpJpiC0AAAAAAAAAAAAAFl94AQBr',
          bottom: -68,
          right: -45,
          height: '303px',
        },
        {
          src: 'https://mdn.alipayobjects.com/yuyan_qk0oxh/afts/img/F6vSTbj8KpYAAAAAAAAAAAAAFl94AQBr',
          bottom: 0,
          left: 0,
          width: '331px',
        },
      ],
      links: [],
      menuHeaderRender: undefined,
      // 自定义 403 页面
      // unAccessible: <div>unAccessible</div>,
      // 增加一个 loading 的状态
      childrenRender: (children) => {
        if (initialState?.loading) return <Spin/>;
        return (
          <>
            <div style={{transform: 'scale(1)'}}>
              {children}
            </div>
            {isDev && (
              <SettingDrawer
                disableUrlParams
                enableDarkTheme
                settings={initialState?.settings}
                onSettingChange={(settings) => {
                  setInitialState((preInitialState) => ({
                    ...preInitialState,
                    settings: {
                      ...settings,
                      title: preInitialState?.settings?.title, // 强制使用初始title
                    }
                  }));
                }}
              />
            )}
            <React.Suspense fallback={null}><LazyChat/></React.Suspense>
          </>
        );
      },
      menuRender: menuRender,
      menu: {
        locale: false,
        collapsedShowGroupTitle: true,
        type: 'sub'
      },
      ...initialState?.settings,
    };
  };

/**
 * @name request 配置，可以配置错误处理
 * 它基于 axios 和 ahooks 的 useRequest 提供了一套统一的网络请求和错误处理方案。
 * @doc https://umijs.org/docs/max/request#配置
 */
export const request: RequestConfig = {
  baseURL: baseURL,
  ...errorConfig,
};

export const onRouteChange = async ({location, action}: any) => {
  const newParams = new URLSearchParams(location.search);

  let needUpdate = false;
  if (!newParams.has('appid') && appId) {
    newParams.set('appid', appId);
    needUpdate = true;
  }
  if (!newParams.has('env') && envId) {
    newParams.set('env', envId);
    needUpdate = true;
  }

  if (!newParams.has('portalKey') && portalKey) {
    newParams.set('portalKey', portalKey);
    needUpdate = true;
  }

  const targetSearch = newParams.toString();
  const targetUrl = targetSearch
    ? `${location.pathname}?${targetSearch}`
    : location.pathname;

  if (
    [loginPath, '/user/register', '/user/register-result'].includes(
      location.pathname,
    ) && getRefreshToken()
  ) {
    console.log('在登陆页面 && 在登录状态')
    history.replace(`/app/design?${targetSearch}`);
  }

  // 已经是目标 URL 就直接返回
  if (location.pathname + location.search === targetUrl) {
    return;
  }

  if (action === 'PUSH') {
    history.push(targetUrl);
  } else if (action === 'REPLACE') {
    history.replace(targetUrl);
  }
};

// 动态注册路由
export function patchClientRoutes({routes}: { routes: any }) {
  patchRoutes(routes)
}

export async function render(oldRender: () => void) {
  if (!getRefreshToken()) {
    try {
      await loadPortalLoginRoute()
    } finally {
      oldRender();
    }
    return;
  }
  try {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const refreshToken = params.get('refreshToken');
    const tenantId = params.get('tenantId');
    const appTenantCode = params.get('appTenantCode');
    if(token){
        setToken({'accessToken': token,  'refreshToken': refreshToken})
    }
    if(tenantId){
        setTenantId(tenantId)
    }
    if(appTenantCode) {
        appTenantCodeStore.dispatch({type: "set", payload: appTenantCode});
    }
    // 第一批：门户登录路由 + 租户编号（后续接口请求头需要 App-Tenant-Code）
    await Promise.all([
      loadPortalLoginRoute(),
      fetchAppTenantCode(),
    ]);
    // 第二批：路由数据（必须等待，页面渲染依赖路由）
    await getRouter();
    // 第三批：非路由数据 — 启动加载但不阻塞渲染，让页面先展示出来
    // _deferredDataReady 会在 getInitialState() 中 await
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
  } finally {
    oldRender()
  }
}
