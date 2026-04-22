import { useEffect, useMemo } from 'react';
import { RouterProvider } from 'react-router-dom';
import { ConfigProvider, App as AntApp } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import router from './router';
import { buildThemeConfig, injectCssVars, useThemeMode } from './theme';

export default function App() {
  const mode = useThemeMode((s) => s.mode);

  // 模式变化时同步 CSS 变量 + <html data-theme>
  useEffect(() => {
    injectCssVars(mode);
  }, [mode]);

  const themeConfig = useMemo(() => buildThemeConfig(mode), [mode]);

  return (
    <ConfigProvider locale={zhCN} theme={themeConfig}>
      <AntApp>
        <RouterProvider router={router} />
      </AntApp>
    </ConfigProvider>
  );
}
