import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import AutoImport from 'unplugin-auto-import/vite';
import Components from 'unplugin-vue-components/vite';
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers';

// Vue3 + Element Plus + Vite 反向飞轮底座（1.4）
// 端口由 sandbox dev_command 控制；host 0.0.0.0 允许沙箱外访问 iframe 预览。
// AutoImport / Components 让 Agent 写业务页面时无需手写 import { ElButton } from 'element-plus'，
// 直接 <el-button /> / <ElButton /> 就能用，对 LLM 生成路径更友好。
export default defineConfig({
  plugins: [
    vue(),
    AutoImport({
      resolvers: [ElementPlusResolver()],
      imports: ['vue', 'vue-router'],
      dts: 'src/auto-imports.d.ts',
    }),
    Components({
      resolvers: [ElementPlusResolver()],
      dts: 'src/components.d.ts',
    }),
  ],
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
