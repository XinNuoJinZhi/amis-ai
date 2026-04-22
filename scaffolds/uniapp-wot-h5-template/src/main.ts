import { createSSRApp } from 'vue'
import App from './App.vue'

// ==== amis-ai 反向飞轮：运行时错误上报 ====
// 当页面跑在 amis-ai 的 iframe 预览里（H5 端），把浏览器运行时错误
// 通过 postMessage 冒泡给父窗口（/projects/:id 详情页），由其转发到 backend
// 自修复闭环喂给 Agent。
// Vite 的 import-analysis / HMR 错误只通过 WebSocket 推 overlay 不写 stdout，
// 这是唯一可以捕获它们的路径。
// #ifdef H5
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
      )
    } catch {
      // 父窗口 origin 不允许跨域 postMessage 时安静忽略
    }
  }

  window.addEventListener('error', (e) => {
    reportRuntimeError('window.onerror', e.message || String(e), e.error?.stack)
  })

  window.addEventListener('unhandledrejection', (e) => {
    const reason = e.reason
    const msg = typeof reason === 'string' ? reason : reason?.message || String(reason)
    reportRuntimeError('unhandledrejection', msg, reason?.stack)
  })

  // Vite HMR 的 error overlay 通过 import.meta.hot API 推送；
  // 我们监听 vite 在 window 上派发的自定义事件（vite 5+ 会派 `vite:error`）
  window.addEventListener('vite:error' as any, (e: any) => {
    const payload = e?.detail?.err || e?.detail || e
    reportRuntimeError(
      'vite:error',
      payload?.message || '[vite] compile/import error',
      payload?.stack || payload?.frame,
    )
  })

  // ==== 浏览器控制台劫持 ====
  // 把 console.log/info/warn/error/debug 通过 postMessage 发给父窗口
  // （/projects/:id 详情页的 ConsolePanel），实现"预览页面 console 实时同步"
  const LEVELS = ['log', 'info', 'warn', 'error', 'debug'] as const
  const safeStringify = (v: any): string => {
    const seen = new WeakSet()
    try {
      return JSON.stringify(v, (_k, val) => {
        if (typeof val === 'bigint') return val.toString() + 'n'
        if (val instanceof Error) {
          return { name: val.name, message: val.message, stack: val.stack }
        }
        if (typeof val === 'function') {
          return `[Function ${val.name || 'anonymous'}]`
        }
        if (typeof val === 'object' && val !== null) {
          if (seen.has(val)) return '[Circular]'
          seen.add(val)
        }
        return val
      })
    } catch {
      return String(v)
    }
  }
  LEVELS.forEach((level) => {
    const orig = (console as any)[level].bind(console)
    ;(console as any)[level] = (...args: any[]) => {
      orig(...args)
      try {
        const serialized = args.map((a) => {
          try {
            return JSON.parse(safeStringify(a))
          } catch {
            return String(a)
          }
        })
        const stack = new Error().stack
        window.parent.postMessage(
          {
            type: 'amis-ai/console',
            level,
            args: serialized,
            ts: Date.now(),
            stack: stack ? stack.split('\n').slice(2, 6).join('\n') : undefined,
          },
          '*',
        )
      } catch {
        // 忽略序列化失败
      }
    }
  })
}
// #endif

export function createApp() {
  const app = createSSRApp(App)
  return {
    app,
  }
}
