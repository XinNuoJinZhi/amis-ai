import { SiderMenu } from './components/SiderMenu'
import { clearMenuItem } from './utils/utils';
import { getMatchMenu } from '@umijs/route-utils';
import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

export const menuRender = (props: any) => {
  const { menuData } = props;

  const matchMenus = useMemo(() => {
    return getMatchMenu(location.pathname || '/', menuData || [], true);
  }, [location.pathname, menuData]);

  const matchMenuKeys = useMemo(
    () =>
      Array.from(
        new Set(matchMenus.map((item) => item.key || item.path || '')),
      ),
    [matchMenus],
  );

  const clearMenuData = clearMenuItem(menuData || []);

  return (
     <SiderMenu
       matchMenuKeys={matchMenuKeys}
       {...props}
       // 这里走了可以少一次循环
       menuData={clearMenuData}
       stylish={props.stylish?.sider}
     />
   )
}
