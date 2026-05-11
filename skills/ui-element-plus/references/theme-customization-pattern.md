# Element Plus 模式：主题定制 + 深色模式 + 按需引入

> 触发：用户要求改主题色 / 暗黑模式 / 减包体积 / Amis JSON 含 theme 字段

## 方案 A：CSS 变量覆盖（推荐，零编译开销）

```css
/* src/styles/global.css */
:root {
  --el-color-primary: #1677ff;
  --el-color-success: #52c41a;
  --el-color-warning: #faad14;
  --el-color-danger: #ff4d4f;
  --el-color-info: #909399;

  /* 派生色（手动给 light/dark 系列，不给会用默认） */
  --el-color-primary-light-3: #4096ff;
  --el-color-primary-light-5: #69b1ff;
  --el-color-primary-light-7: #91caff;
  --el-color-primary-light-9: #e6f4ff;
  --el-color-primary-dark-2: #003eb3;

  /* 字号 / 圆角 / 间距 */
  --el-border-radius-base: 6px;
  --el-font-size-base: 14px;
}
```

**优点**：运行时切换，不要重新编译；适合主题色由后端配置的场景

## 方案 B：SCSS 变量覆盖（编译期，包体积更优）

```scss
// src/styles/element-overrides.scss
@use 'element-plus/theme-chalk/src/common/var.scss' as * with (
  $colors: (
    'primary': (
      'base': #1677ff,
    ),
    'success': (
      'base': #52c41a,
    ),
  ),
  $border-radius: (
    'base': 6px,
  ),
);

// 强制重新生成所有组件主题
@use 'element-plus/theme-chalk/src/index.scss' as *;
```

`vite.config.ts`：

```ts
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import AutoImport from 'unplugin-auto-import/vite';
import Components from 'unplugin-vue-components/vite';
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers';

export default defineConfig({
  plugins: [
    vue(),
    AutoImport({
      resolvers: [ElementPlusResolver({ importStyle: 'sass' })],
    }),
    Components({
      resolvers: [ElementPlusResolver({ importStyle: 'sass' })],
    }),
  ],
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@use "@/styles/element-overrides.scss" as *;`,
      },
    },
  },
});
```

## 深色模式

```css
/* 引入 Element Plus 深色 CSS */
@import 'element-plus/theme-chalk/dark/css-vars.css';

/* 自定义切换：在 <html> 加 class="dark" */
html.dark {
  --el-bg-color: #0a0a0a;
  --el-text-color-primary: #e0e0e0;
}
```

**切换逻辑**：

```ts
// src/composables/useTheme.ts
import { ref, watchEffect } from 'vue';

const isDark = ref(localStorage.getItem('theme') === 'dark');

export function useTheme() {
  watchEffect(() => {
    document.documentElement.classList.toggle('dark', isDark.value);
    localStorage.setItem('theme', isDark.value ? 'dark' : 'light');
  });
  return { isDark };
}
```

## 按需引入（减包体积）

通过 `unplugin-vue-components` + `ElementPlusResolver` 自动按需引入（见上面 vite.config.ts），写业务时直接 `<el-button />` 就够了，无需手动 `import { ElButton } from 'element-plus'`。

包体积对比：
- 全量引入：~1.2 MB（gzipped）
- 按需引入：典型 dashboard 项目 ~300-400 KB

## 强约束

- 主题色覆盖**只改 base color**，派生色（light-3 / dark-2 等）让 SCSS 编译期算或手动给定
- CSS 变量方案的派生色如果不手动给，hover/disabled 状态会用默认蓝色，跟主色不协调
- 深色模式不要硬切 `data-theme` 属性，统一用 `html.dark` class，方便 CSS 子选择器
- 按需引入必须配 SCSS（`importStyle: 'sass'`）才能继承 SCSS 变量覆盖；用 CSS 变量则无所谓
- 字体大小/圆角等"语义" token 优先用 CSS 变量，不要直接写死像素
- 不要混用 Element Plus 多版本（package.json 单一 element-plus 依赖）
