# Vue3 模式：vue-router v4 守卫 + 嵌套路由 + 动态路由

> 触发：登录鉴权 / 角色权限 / 嵌套布局 / 路由参数驱动页面 / Amis JSON 含多 page

## 嵌套路由（按布局复用）

```ts
// src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router';
import DefaultLayout from '@/layouts/Default.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      component: DefaultLayout,
      children: [
        { path: '', name: 'home', component: () => import('@/pages/Home.vue') },
        { path: 'users', name: 'users', component: () => import('@/pages/Users.vue') },
        { path: 'users/:id', name: 'user-detail', component: () => import('@/pages/UserDetail.vue') },
      ],
    },
    { path: '/login', name: 'login', component: () => import('@/pages/Login.vue') },
  ],
});

export default router;
```

布局组件 `<router-view />` 渲染子路由：

```vue
<!-- src/layouts/Default.vue -->
<template>
  <el-container>
    <el-aside><Sidebar /></el-aside>
    <el-main><router-view /></el-main>
  </el-container>
</template>
```

## 路由守卫：全局 + 单路由

```ts
// 全局前置守卫（鉴权）
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token');
  if (to.meta.requiresAuth && !token) {
    next({ name: 'login', query: { redirect: to.fullPath } });
  } else {
    next();
  }
});

// 单路由守卫（脏数据离开确认）
{
  path: 'users/:id/edit',
  component: UserEdit,
  beforeEnter: (to, from, next) => {
    // ...
    next();
  },
  meta: { requiresAuth: true, role: 'admin' },
}
```

## 动态路由 + 参数

```ts
// 取参
import { useRoute, useRouter } from 'vue-router';
const route = useRoute();
const userId = computed(() => route.params.id);

// 编程式导航
const router = useRouter();
router.push({ name: 'user-detail', params: { id: 42 } });
```

## 多页面任务的路由生成

Amis JSON 多页项目 → router/index.ts 一次性注册所有路由 + pages/ 一一对应：

```ts
// 自动收集 pages/*.vue 注册路由（vite-plugin-pages 风格手写版）
const modules = import.meta.glob('@/pages/*.vue');
const routes = Object.entries(modules).map(([path, comp]) => {
  const name = path.match(/\/(\w+)\.vue/)?.[1]?.toLowerCase() ?? 'unknown';
  return { path: `/${name === 'home' ? '' : name}`, name, component: comp };
});
```

## 强约束

- `lazy import`：业务页面用 `() => import('@/pages/X.vue')` 而非顶部 import，启用代码分割
- `meta.requiresAuth` 统一用 boolean 标识，守卫只判一次，不要每个组件 onMounted 里查 token
- 守卫内 `next()` 必须调用且只调一次（多次调用或忘调用 = 路由卡死）
- 业务页面不要直接 `window.location.href = ...`，破坏 SPA；用 `router.push()`
