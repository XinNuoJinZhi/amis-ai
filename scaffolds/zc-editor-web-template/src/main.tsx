import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, useNavigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { IntlProvider } from 'react-intl';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import { setNavigator } from './shims/umi-max';
import { InitialStateProvider } from './initialState';
import App from './__AppRoot_tmp';
import zhCNMessages from './locales/zh-CN';
import './global.less';

dayjs.locale('zh-cn');

// 把 react-router 的 navigate 注入到 history shim
const NavigatorBridge: React.FC = () => {
  const navigate = useNavigate();
  React.useEffect(() => {
    setNavigator(navigate);
  }, [navigate]);
  return null;
};

const Root: React.FC = () => (
  <ConfigProvider locale={zhCN}>
    <IntlProvider locale="zh-CN" messages={zhCNMessages} defaultLocale="zh-CN">
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <NavigatorBridge />
        <InitialStateProvider>
          <App />
        </InitialStateProvider>
      </BrowserRouter>
    </IntlProvider>
  </ConfigProvider>
);

ReactDOM.createRoot(document.getElementById('root')!).render(<Root />);
