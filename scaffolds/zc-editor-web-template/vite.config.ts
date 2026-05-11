import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

// Vite 配置 — 替代 UMI/webpack
// 关键策略：通过 alias 将 @umijs/max 重定向到本地 shim，避免一次性改 48 个文件

export default defineConfig(({ mode }) => {
  // 加载 .env 文件（兼容现有 REACT_APP_* 前缀）
  const env = loadEnv(mode, path.resolve(__dirname), ['REACT_APP_', 'VITE_']);

  // 将 REACT_APP_* 环境变量注入 process.env
  const defineEnv = Object.keys(env).reduce(
    (acc, key) => {
      acc[`process.env.${key}`] = JSON.stringify(env[key]);
      return acc;
    },
    {} as Record<string, string>,
  );
  defineEnv['process.env.NODE_ENV'] = JSON.stringify(mode);

  return {
    base: env.REACT_APP_BASE_PATH || '/',
    define: defineEnv,

    resolve: {
      alias: {
        // 路径别名（保持与 tsconfig 一致）
        '@': path.resolve(__dirname, 'src'),
        '@@': path.resolve(__dirname, 'src/.umi'),

        // @umijs/max 兼容层 — 让现有 48 处 import 不用改
        '@umijs/max': path.resolve(__dirname, 'src/shims/umi-max.tsx'),

        // UMI 插件请求类型 shim
        '@@/plugin-request/request': path.resolve(__dirname, 'src/shims/plugin-request.ts'),

        // React/ReactDOM 单例 — 防止 amis 内部 Module Federation 创建独立副本
        react: path.resolve(__dirname, 'node_modules/react'),
        'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),

        // moment locale 优化
        'moment/locale': 'moment/dist/locale',
      },
    },

    css: {
      preprocessorOptions: {
        less: {
          javascriptEnabled: true, // antd 需要
        },
      },
      // PostCSS 配置走独立的 postcss.config.js（避免 ESM/CJS 互操作问题）
    },

    plugins: [
      react({
        // 兼容老旧 JSX 写法（amis 等可能用到）
        jsxRuntime: 'automatic',
      }),
    ],

    server: {
      // sandbox 默认走 VITE_PORT=5173；本机调试覆盖成 5000 兼容老脚本
      port: Number(process.env.VITE_PORT) || 5173,
      host: '0.0.0.0',
      open: false,
      proxy: env.REACT_APP_BASE_URL
        ? {
            '/admin-api': {
              target: env.REACT_APP_BASE_URL,
              changeOrigin: true,
            },
            '/app-api': {
              target: env.REACT_APP_BASE_URL,
              changeOrigin: true,
            },
          }
        : undefined,
    },

    build: {
      target: 'es2020',
      outDir: env.REACT_APP_OUT_DIR || 'dist',
      sourcemap: env.REACT_APP_SOURCEMAP === 'true',
      chunkSizeWarningLimit: 2000,
      rollupOptions: {
        output: {
          // 手动分包 — 把重型依赖独立 chunk
          manualChunks: {
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            antd: ['antd', '@ant-design/icons'],
            'antd-pro': ['@ant-design/pro-components', '@ant-design/pro-layout'],
            amis: ['amis', 'amis-core', 'amis-ui', 'amis-formula'],
            echarts: ['echarts'],
          },
        },
      },
    },

    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        'antd',
        '@ant-design/icons',
        'lodash',
        'lodash-es',
        'dayjs',
        'axios',
        'classnames',
        // amis 生态必须预构建，否则其内部 `import x from 'lodash/xxx'` 这类 CJS 默认导入会报错
        'amis',
        'amis-core',
        'amis-ui',
        'amis-formula',
        'amis-editor',
        'amis-editor-core',
      ],
      // 处理 CJS 互操作：amis 依赖链里有不少 CJS 包
      esbuildOptions: {
        mainFields: ['module', 'main'],
      },
    },
  };
});
