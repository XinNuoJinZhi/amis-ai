import axios, { type AxiosInstance, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'

/** 统一响应结构 */
export interface ApiResponse<T = unknown> {
  code: number
  message: string
  data: T
}

/** 创建 axios 实例 */
const http: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
})

/** 请求拦截器 */
http.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 可在此注入 token
    const token = uni.getStorageSync('token') as string | undefined
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error: unknown) => Promise.reject(error),
)

/** 响应拦截器 */
http.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    const { data } = response
    // 业务错误码统一处理
    if (data.code !== 0 && data.code !== 200) {
      uni.showToast({
        title: data.message ?? '请求失败',
        icon: 'none',
      })
      return Promise.reject(new Error(data.message ?? '请求失败'))
    }
    return response
  },
  (error: unknown) => {
    // 网络/超时错误
    const message =
      error instanceof Error ? error.message : '网络异常，请检查连接'
    uni.showToast({
      title: message,
      icon: 'none',
    })
    return Promise.reject(error)
  },
)

export default http
