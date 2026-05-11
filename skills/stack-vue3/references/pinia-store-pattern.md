# Vue3 模式：Pinia store 拆分 + 持久化

> 触发：跨组件共享状态（用户信息 / 全局配置 / 购物车）/ Amis JSON 含登录状态 / 权限路由

## 何时用 Pinia 而非 composable

| 场景 | 用啥 |
|---|---|
| 单页面内部状态 | `ref` / `reactive`（组件内） |
| 跨组件复用逻辑（无共享状态） | composable |
| 跨页面 / 跨组件**共享**状态 | **Pinia store** |
| 持久化（刷新不丢） | Pinia store + `pinia-plugin-persistedstate` |

## 标准 store 骨架

```ts
// src/stores/user.ts
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { apiClient } from '@/api/client';

export const useUserStore = defineStore('user', () => {
  // state（必须 ref / reactive）
  const profile = ref<UserProfile | null>(null);
  const token = ref<string>(localStorage.getItem('token') || '');

  // getters（computed）
  const isLoggedIn = computed(() => !!token.value);
  const isAdmin = computed(() => profile.value?.role === 'admin');

  // actions
  async function login(username: string, password: string) {
    const resp = await apiClient.post('/api/login', { username, password });
    token.value = resp.data.token;
    profile.value = resp.data.profile;
    localStorage.setItem('token', token.value);
  }

  function logout() {
    token.value = '';
    profile.value = null;
    localStorage.removeItem('token');
  }

  return { profile, token, isLoggedIn, isAdmin, login, logout };
});
```

**业务页面用**：

```vue
<script setup lang="ts">
import { useUserStore } from '@/stores/user';
import { storeToRefs } from 'pinia';

const userStore = useUserStore();
// state / getters 解构必须用 storeToRefs，否则丢响应性
const { profile, isLoggedIn } = storeToRefs(userStore);
// actions 直接解构没问题（不是响应式）
const { logout } = userStore;
</script>
```

## main.ts 注册

```ts
import { createPinia } from 'pinia';
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';

const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);
app.use(pinia);
```

持久化某个 store：

```ts
export const useUserStore = defineStore('user', () => { /* ... */ }, {
  persist: {
    storage: localStorage,
    paths: ['token'],  // 只持久化 token，profile 走 API 重拉
  },
});
```

## Store 间通信

```ts
// stores/cart.ts 依赖 user
import { useUserStore } from './user';

export const useCartStore = defineStore('cart', () => {
  const items = ref<CartItem[]>([]);

  async function checkout() {
    const userStore = useUserStore();
    if (!userStore.isLoggedIn) throw new Error('请先登录');
    // ...
  }

  return { items, checkout };
});
```

## 强约束

- store id 唯一（`defineStore('user', ...)` 第一个参数），重复会 hot-reload 冲突
- 解构 state / getters 必须 `storeToRefs(store)` 否则丢响应性
- action 内不要直接改其他 store 的 state，调它的 action
- 不要在 setup 顶层调用 `useXxxStore()` 之外的 store API（如 `useXxxStore().$patch(...)`）—— 应该把 store 实例存变量
- 持久化只存必要字段（如 token），业务数据走 API 重拉避免 stale
