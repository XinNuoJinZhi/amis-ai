import axios, { AxiosError, type AxiosInstance } from 'axios';

/**
 * 通用 HTTP 客户端：
 *   - baseURL 可通过 VITE_API_BASE 环境变量覆盖，默认 '/api'（开发时配合 vite proxy）
 *   - 请求拦截器：注入 JWT（如 localStorage 里有 token）
 *   - 响应拦截器：401 自动清 token；其他错误统一抛出带 message 的 AxiosError
 */
const client: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || '/api',
  timeout: 30_000,
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

client.interceptors.response.use(
  (resp) => resp,
  (err: AxiosError<any>) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
    }
    return Promise.reject(err);
  },
);

export default client;
