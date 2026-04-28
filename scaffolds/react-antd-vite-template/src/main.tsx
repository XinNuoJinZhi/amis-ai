import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import App from './App';
import './styles/global.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConfigProvider locale={zhCN} theme={{ token: { colorPrimary: '#1677ff' } }}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ConfigProvider>
  </React.StrictMode>,
);

// iframe 预览 ↔ 父窗口（amis-ai IDE）console 桥：
// 把 console.{log,info,warn,error,debug} 劫持后 postMessage 给父窗。
// 与 uniapp-wot-h5-template 里 main.ts 的做法一致，ConsolePanel 统一消费。
if (window.parent !== window) {
  const safeStringify = (arg: unknown): string => {
    try {
      if (arg === null || arg === undefined) return String(arg);
      if (typeof arg === 'string') return arg;
      if (typeof arg === 'number' || typeof arg === 'boolean') return String(arg);
      if (arg instanceof Error) return `${arg.name}: ${arg.message}\n${arg.stack ?? ''}`;
      if (typeof arg === 'function') return `[Function ${(arg as any).name || 'anonymous'}]`;
      if (typeof arg === 'bigint') return `${arg.toString()}n`;
      return JSON.stringify(arg, (_k, v) => {
        if (typeof v === 'bigint') return `${v.toString()}n`;
        if (typeof v === 'function') return `[Function ${v.name || 'anonymous'}]`;
        return v;
      }, 2);
    } catch {
      return '[Unserializable]';
    }
  };
  (['log', 'info', 'warn', 'error', 'debug'] as const).forEach((level) => {
    const orig = (console as any)[level].bind(console);
    (console as any)[level] = (...args: unknown[]) => {
      try {
        window.parent.postMessage(
          {
            type: 'amis-ai/console',
            level,
            args: args.map(safeStringify),
            ts: Date.now(),
          },
          '*',
        );
      } catch { /* ignore */ }
      orig(...args);
    };
  });
}
