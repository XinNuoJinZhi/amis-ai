/**
 * 静态路由 — 从 config/routes.ts 翻译为 React Router 7 的 RouteObject
 *
 * 分两组：
 *  - layoutRoutes：包裹在 AppLayout 内的路由（与原 UMI 'ant-design-pro-layout' 对应）
 *  - noLayoutRoutes：layout: false 的独立路由（登录、表单编辑、流程设计等）
 *
 * 动态业务路由（来自 menu API）由 router/index.tsx 在运行时合并到 layoutRoutes 中。
 */
import React, { lazy } from 'react';
import { Navigate, type RouteObject } from 'react-router-dom';

// ============== 懒加载工具 ==============
const lazyEl = (factory: () => Promise<{ default: React.ComponentType<any> }>) =>
  React.createElement(lazy(factory));

// ============== layout: false 的独立路由 ==============
export const noLayoutRoutes: RouteObject[] = [
  // 登录
  {
    path: '/app/design/user/login',
    element: lazyEl(() => import('@/pages/user/login/login')),
  },
  // 表单编辑
  {
    path: '/app/design/formManage/form/edit',
    element: lazyEl(() => import('@/components/AMISFormEditor')),
  },
  {
    path: '/app/formManage/form/edit',
    element: lazyEl(() => import('@/components/AMISFormEditor')),
  },
  // 流程设计
  {
    path: '/app/design/processManage/model/edit',
    element: lazyEl(() => import('@/components/ProcessDesigner')),
  },
  // 高级打印
  {
    path: '/app/design/sheetEditor',
    element: lazyEl(() => import('@/components/UniverModule')),
  },
  // 流程展示与重新发起
  {
    path: '/page/pageEdit',
    element: lazyEl(() => import('@/components/PageEdit')),
  },
  {
    path: '/page/formInfo',
    element: lazyEl(() => import('@/components/FormInfo')),
  },
  {
    path: '/page/pageRestart',
    element: lazyEl(() => import('@/components/PageRestart')),
  },
  {
    path: '/app/restart',
    element: lazyEl(() => import('@/components/AppRestart')),
  },
  {
    path: '/app/process/handleTask',
    element: lazyEl(() => import('@/components/AppFlowSubmitData')),
  },
  {
    path: '/app/process/submitData',
    element: lazyEl(() => import('@/components/PageView')),
  },
  {
    path: '/app/design/pageManage/chart',
    element: lazyEl(() => import('@/components/PageChart')),
  },
];

// ============== 包在 AppLayout 内的固定系统路由 ==============
export const layoutSystemRoutes: RouteObject[] = [
  {
    path: '/app/design/user/profile',
    element: lazyEl(() => import('@/pages/UserProfile')),
  },
  {
    path: '/app/user/profile',
    element: lazyEl(() => import('@/pages/UserProfile')),
  },
  {
    path: '/app/user/notify-message',
    element: lazyEl(() => import('@/pages/NotifyMessage')),
  },
  {
    path: '/app/design/user/notify-message',
    element: lazyEl(() => import('@/pages/NotifyMessage')),
  },
];

// ============== 重定向规则 ==============
export const redirectRoutes: RouteObject[] = [
  { path: '/', element: <Navigate to="/app/design/" replace /> },
  { path: '/app/design/', element: <Navigate to="/app/design/pageManage" replace /> },
];

// ============== 404 兜底 ==============
export const notFoundRoute: RouteObject = {
  path: '*',
  element: lazyEl(() => import('@/pages/404')),
};
