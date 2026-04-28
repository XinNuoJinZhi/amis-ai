import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// React + antd + Vite 反向飞轮底座（2026-04）
// 端口由 sandbox dev_command 控制；host 0.0.0.0 允许沙箱外访问 iframe 预览。
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
