/**
 * AppLayout — 替代 UMI layout 插件
 *
 * 用 ProLayout 直接接管布局，子路由通过 <Outlet /> 渲染。
 * 菜单数据由 RouterContext 注入（来自 getRouter() 的远程菜单）。
 */
import React, { useContext } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { ProLayout } from '@ant-design/pro-components';
import defaultSettings from '../../config/defaultSettings';
import { menuRender } from './index';
import { RouterContext } from '@/router/RouterContext';

const AppLayout: React.FC = () => {
  const location = useLocation();
  const { menuData } = useContext(RouterContext);

  return (
    <ProLayout
      {...defaultSettings}
      location={{ pathname: location.pathname }}
      route={{
        path: '/',
        routes: menuData,
      }}
      menuDataRender={() => menuData || []}
      menuRender={menuRender}
      menuItemRender={(item, dom) => <span>{dom}</span>}
    >
      <Outlet />
    </ProLayout>
  );
};

export default AppLayout;
