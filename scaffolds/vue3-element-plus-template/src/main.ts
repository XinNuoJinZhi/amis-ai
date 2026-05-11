import { createApp } from 'vue';
import ElementPlus from 'element-plus';
import zhCn from 'element-plus/es/locale/lang/zh-cn';
import 'element-plus/dist/index.css';
import App from './App.vue';
import router from './router';
import './styles/global.css';

const app = createApp(App);
app.use(router);
app.use(ElementPlus, { locale: zhCn });
app.mount('#app');

// ===========================================================================
// iframe 预览 ↔ 父窗口（amis-ai IDE）console + 错误 桥
// 三件套：
//   1. 运行时错误（window.onerror / unhandledrejection / vite:error）→ postMessage
//   2. console.{log,info,warn,error,debug} 劫持 → postMessage（ConsolePanel 消费）
//   3. 仅在 iframe 嵌入时启用（window.parent !== window）
//
// 与 react-antd-vite-template / uniapp-wot-h5-template 保持协议一致：
//   - type: 'amis-ai/console' { level, args, ts, stack? }
//   - type: 'amis-ai/runtime-error' { source, message, stack?, href, ts }
// ===========================================================================
if (typeof window !== 'undefined' && window.parent !== window) {
  const reportRuntimeError = (source: string, message: string, stack?: string) => {
    try {
      window.parent.postMessage(
        {
          type: 'amis-ai/runtime-error',
          source,
          message,
          stack,
          href: window.location.href,
          ts: Date.now(),
        },
        '*',
      );
    } catch {
      // 跨域 origin 限制时安静忽略
    }
  };

  window.addEventListener('error', (e) => {
    reportRuntimeError('window.onerror', e.message || String(e), e.error?.stack);
  });

  window.addEventListener('unhandledrejection', (e) => {
    const reason = e.reason;
    const msg = typeof reason === 'string' ? reason : reason?.message || String(reason);
    reportRuntimeError('unhandledrejection', msg, reason?.stack);
  });

  // Vite HMR 的 import-analysis / compile 错误通过 WebSocket 推 overlay，
  // 不会冒泡到 window.onerror。vite 5+ 在 window 派 `vite:error` 自定义事件。
  window.addEventListener('vite:error' as any, (e: any) => {
    const payload = e?.detail?.err || e?.detail || e;
    reportRuntimeError(
      'vite:error',
      payload?.message || '[vite] compile/import error',
      payload?.stack || payload?.frame,
    );
  });

  const safeStringify = (arg: unknown): string => {
    const seen = new WeakSet();
    try {
      if (arg === null || arg === undefined) return String(arg);
      if (typeof arg === 'string') return arg;
      if (typeof arg === 'number' || typeof arg === 'boolean') return String(arg);
      if (arg instanceof Error) return `${arg.name}: ${arg.message}\n${arg.stack ?? ''}`;
      if (typeof arg === 'function') return `[Function ${(arg as any).name || 'anonymous'}]`;
      if (typeof arg === 'bigint') return `${arg.toString()}n`;
      return JSON.stringify(
        arg,
        (_k, v) => {
          if (typeof v === 'bigint') return `${v.toString()}n`;
          if (typeof v === 'function') return `[Function ${v.name || 'anonymous'}]`;
          if (typeof v === 'object' && v !== null) {
            if (seen.has(v)) return '[Circular]';
            seen.add(v);
          }
          return v;
        },
        2,
      );
    } catch {
      return '[Unserializable]';
    }
  };

  (['log', 'info', 'warn', 'error', 'debug'] as const).forEach((level) => {
    const orig = (console as any)[level].bind(console);
    (console as any)[level] = (...args: unknown[]) => {
      orig(...args);
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
      } catch {
        // 序列化失败安静忽略
      }
    };
  });
}
