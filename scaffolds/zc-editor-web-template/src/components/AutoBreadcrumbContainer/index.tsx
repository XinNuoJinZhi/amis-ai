import React, { useMemo } from 'react';
import {PageContainer} from '@ant-design/pro-components';
import { history, Link, useLocation } from '@umijs/max';
import { getMatchMenu } from '@umijs/route-utils';
import {isEditorialEnd} from "@/utils";
import { RouteContext } from '@ant-design/pro-layout';
import editMenuStore from '@/store/editMenu';

interface breadcrumbItems {
  breadcrumbName: string;
  component: any;
  linkPath: string;
  path: string;
  title: string;
  isLink: boolean;
}

export const AutoBreadcrumbContainer: React.FC<any> = ({children}) => {
  const location = useLocation();
  const menuData = editMenuStore.getState().editMenuData;

  const matchMenus = useMemo(() => {
    return getMatchMenu(location.pathname || '/', menuData || [], true);
  }, [location.pathname, menuData]);

  const getBreadcrumb = (matchMenus: any): breadcrumbItems[] => {

    // 添加去重逻辑：根据 path
    const uniqueMatchMenus = matchMenus.filter((item: any, index: number, self: any[]) =>
      index === self.findIndex((t: any) => t.path === item.path)
    );

    // matchMenus中是否包含首页route
    const isInHomeRoute = matchMenus.some((item: any) => item.isHomePage);

    // 将首页breadcrumb处理出来
    // todo: 代码生成前面包屑的逻辑是：业务菜单会显示首页，系统菜单不显示，不太符合规范，这块预留逻辑
    const homeRoute = (!isEditorialEnd() && !isInHomeRoute) ? {
      breadcrumbName: '首页',
      component: undefined,
      linkPath: '/app/',
      path: '/app/',
      title: '首页',
      isLink: true
    } : null

    return [
      ...(homeRoute ? [homeRoute] : []),
      ...uniqueMatchMenus
        .map((item: any) => {
        return {
          breadcrumbName: item.name,
          component: undefined,
          linkPath: item.path,
          path: item.path,
          title: item.name,
          isLink: false
        };
      }),
    ]
  }

  const itemRender = (currentRoute: any, params: any, items: any, paths: any) => {
    const isLink = currentRoute?.isLink;

    return isLink ? (
      <Link to={`/${paths.join('/')}`}>{currentRoute.title}</Link>
    ) : (
      <span>{currentRoute.title}</span>
    );
  }

  return (
    <RouteContext.Consumer>
      {(value) => {
        const {matchMenus, currentMenu, title} = value;
        return (
          <PageContainer
            header={{
              // title: currentMenu?.scene === 'system' ? title : null,
              title: null,
              breadcrumb: {
                items: getBreadcrumb(matchMenus) as any,
                itemRender: itemRender
              }
            }}
          >
            {children}
          </PageContainer>
        );
      }}
    </RouteContext.Consumer>

  )
}
