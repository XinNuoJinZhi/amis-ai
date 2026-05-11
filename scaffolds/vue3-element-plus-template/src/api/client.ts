import axios from 'axios';

// 业务 API 客户端 — Agent 按 amis JSON 中的 api 协议拼接 baseURL / headers
export const apiClient = axios.create({
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // 统一错误日志（通过 console 桥同步到父窗 ConsolePanel）
    console.error('[api] request failed:', error?.message || error);
    return Promise.reject(error);
  },
);
