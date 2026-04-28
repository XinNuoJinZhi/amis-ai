/**
 * src/api/client.ts —— uni-app HTTP 客户端门面
 *
 * 2026-04-25 加这层是防 LLM/翻译器 import 幻觉：
 * task #92 实锤——LLM 凭通用 Vue 项目习惯写 `import { request } from '@/api/client'`，
 * 但种子原本只有 `http.ts`（且仅 default export），导致 vite import-analysis 报
 * `Cannot find module "/workspace/src/api/client"`，dev server 起来但页面空白。
 *
 * 这里同时提供：
 *   - 命名导出 `request` —— LLM 最常用的 helper 形态
 *   - 命名导出 `http` —— 拿到原始 axios 实例（自定义拦截器场景）
 *   - 默认导出 = http —— 兼容 `import http from '@/api/client'`
 *   - re-export `ApiResponse` 类型
 *
 * 业务端调用：
 *   ```ts
 *   import { request } from '@/api/client'
 *   const data = await request({ url: '/login', method: 'post', data: { ... } })
 *   ```
 */
import http from './http'

export { http }
export default http
export type { ApiResponse } from './http'

/** axios 支持的所有 method（大小写都接） */
export type HttpMethod =
  | 'get' | 'post' | 'put' | 'delete' | 'patch' | 'head' | 'options'
  | 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS'

export interface RequestOptions {
  url: string
  method?: HttpMethod
  data?: unknown
  params?: Record<string, unknown>
  headers?: Record<string, string>
}

/**
 * 简化版 request：屏蔽 axios 细节、统一拆 response.data 出来。
 *
 * 注：响应拦截器已在 http.ts 配好（业务码非 0/200 会 toast + reject）。
 * 这里只负责把成功的 response.data 透传给业务。
 */
export async function request<T = unknown>(opts: RequestOptions): Promise<T> {
  const res = await http.request<T>({
    url: opts.url,
    method: (opts.method ?? 'get').toLowerCase() as HttpMethod,
    data: opts.data,
    params: opts.params,
    headers: opts.headers,
  })
  return res.data
}
