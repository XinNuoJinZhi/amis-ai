/**
 * src/api/index.ts —— api barrel
 *
 * 统一从 client.ts re-export，让 `import { request } from '@/api'` /
 * `import { request } from '@/api/client'` / `import http from '@/api/http'`
 * 三种常见写法都能工作，避免 LLM 写错 path 时整个模块解析失败。
 */
export * from './client'
export { default } from './client'
