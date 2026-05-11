/**
 * RouterContext — 跨组件共享菜单数据 + 路由元信息
 *
 * 由 router/index.tsx 在加载完 menu API 后填充，
 * AppLayout 消费 menuData 用于 ProLayout 菜单渲染。
 */
import { createContext } from 'react';

export interface RouterContextValue {
  menuData: any[];
  homeRoute: any;
  loading: boolean;
}

export const RouterContext = createContext<RouterContextValue>({
  menuData: [],
  homeRoute: null,
  loading: true,
});
