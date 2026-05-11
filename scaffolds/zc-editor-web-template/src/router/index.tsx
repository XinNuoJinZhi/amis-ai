/**
 * 路由组装器 — 替代 UMI patchClientRoutes 自动机制
 *
 * 启动流程：
 *  1. 调用 getRouter() 拉远程菜单数据（写入 patchClientRoutes 内部状态）
 *  2. 调用 patchRoutes() 将菜单转为带 element 的路由树
 *  3. 拍平所有真正的路由节点（带 element），作为 AppLayout 的 children
 *  4. 完整菜单树通过 RouterContext 传给 AppLayout，用于 ProLayout 菜单渲染
 */
import React, { useEffect, useMemo, useState } from 'react';
import { useRoutes, type RouteObject } from 'react-router-dom';
import patchRoutes, {
  getRouter,
  loadPortalLoginRoute,
  RouterWhiteList,
} from '@/utils/patchClientRoutes';
import { fetchAppTenantCode } from '@/utils/dataLoader';
import { getRefreshToken, setTenantId } from '@/utils/auth';
import appTenantCodeStore from '@/store/appTenantCode';
import { setToken } from '@/utils/auth';
import AppLayout from '@/layout/AppLayout';
import { RouterContext, type RouterContextValue } from './RouterContext';
import {
  noLayoutRoutes,
  layoutSystemRoutes,
  redirectRoutes,
  notFoundRoute,
} from './staticRoutes';

/**
 * 拍平菜单路由树 — 抽出所有带 element 的"叶子菜单"节点
 * 目录、分组等组织节点被忽略（它们只为菜单渲染服务）
 */
function flattenRoutes(tree: any[]): RouteObject[] {
  const result: RouteObject[] = [];
  const walk = (nodes: any[]) => {
    for (const node of nodes) {
      if (node.element && node.path) {
        result.push({
          path: node.path,
          element: node.element,
        });
      }
      if (node.children && Array.isArray(node.children)) {
        walk(node.children);
      }
    }
  };
  walk(tree);
  return result;
}

/**
 * 启动加载 — 复用原 UMI app.tsx 的 render() 逻辑
 */
async function bootstrap(): Promise<void> {
  // URL 参数预处理（token、租户）
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');
  const refreshToken = params.get('refreshToken');
  const tenantId = params.get('tenantId');
  const appTenantCode = params.get('appTenantCode');
  if (token) setToken({ accessToken: token, refreshToken: refreshToken || undefined });
  if (tenantId) setTenantId(tenantId);
  if (appTenantCode) appTenantCodeStore.dispatch({ type: 'set', payload: appTenantCode });

  // 未登录场景：只加载门户登录路由
  if (!getRefreshToken()) {
    try {
      await loadPortalLoginRoute();
    } catch {
      /* 静默 */
    }
    return;
  }

  // 第一批：门户登录路由 + 租户编号
  await Promise.all([loadPortalLoginRoute(), fetchAppTenantCode()]);
  // 第二批：远程菜单
  await getRouter();
}

/**
 * 用 patchRoutes 把远程菜单转成路由树
 *
 * 原 UMI patchRoutes 是直接 mutate 一个传入的 routes 数组，
 * 这里我们传入一个最小骨架，让 patchRoutes 把动态路由 push 到 layout 子节点中。
 */
function buildDynamicRoutes(): { menuTree: any[]; flatRoutes: RouteObject[] } {
  // 兼容 patchRoutes 的输入结构：必须有一个 id='ant-design-pro-layout' 的节点
  const skeleton: any[] = [
    {
      id: 'ant-design-pro-layout',
      children: [],
    },
    {
      path: '*',
      id: 'wildcard',
    },
  ];

  patchRoutes(skeleton);

  const layoutNode = skeleton.find((r) => r.id === 'ant-design-pro-layout');
  const menuTree = layoutNode?.children || [];

  return {
    menuTree,
    flatRoutes: flattenRoutes(menuTree),
  };
}

/**
 * 顶层 Router 组件 — 处理启动加载，加载完后渲染路由
 */
const AppRouter: React.FC = () => {
  const [ready, setReady] = useState(false);
  const [{ menuTree, flatRoutes }, setRouterData] = useState<{
    menuTree: any[];
    flatRoutes: RouteObject[];
  }>({ menuTree: [], flatRoutes: [] });

  useEffect(() => {
    let mounted = true;
    bootstrap()
      .then(() => {
        if (!mounted) return;
        setRouterData(buildDynamicRoutes());
      })
      .catch((err) => {
        console.error('路由启动失败：', err);
      })
      .finally(() => {
        if (mounted) setReady(true);
      });
    return () => {
      mounted = false;
    };
  }, []);

  // 组装 React Router 路由表
  const routes = useMemo<RouteObject[]>(
    () => [
      // 1. layout: false 的独立路由
      ...noLayoutRoutes,
      // 2. 包在 AppLayout 内的路由
      {
        element: React.createElement(AppLayout),
        children: [
          ...layoutSystemRoutes,
          ...flatRoutes, // 来自远程菜单的动态路由
          ...redirectRoutes,
        ],
      },
      // 3. 404 兜底
      notFoundRoute,
    ],
    [flatRoutes],
  );

  const elements = useRoutes(routes);

  const ctxValue = useMemo<RouterContextValue>(
    () => ({
      menuData: menuTree,
      homeRoute: null,
      loading: !ready,
    }),
    [menuTree, ready],
  );

  if (!ready) {
    return (
      <div style={{ padding: 48, textAlign: 'center' }}>
        正在加载路由数据...
      </div>
    );
  }

  return <RouterContext.Provider value={ctxValue}>{elements}</RouterContext.Provider>;
};

export default AppRouter;
export { RouterWhiteList };
