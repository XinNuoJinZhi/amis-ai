# Vue3 模式：自定义 composable（useXxx）

> 触发：跨组件复用逻辑（数据加载 / 表单管理 / 防抖 / 鼠标位置等），任何超过 1 处的"组件内逻辑"都该抽 composable

## 命名约定

- 文件名 `src/composables/useUsers.ts`
- 函数名 `useUsers()`（必须 `use` 开头）
- 返回 reactive 对象：`{ data, loading, error, refresh }`

## 套路一：远程数据加载

```ts
// src/composables/useFetch.ts
import { ref, watch, type Ref } from 'vue';
import { apiClient } from '@/api/client';

export function useFetch<T>(url: Ref<string> | string) {
  const data = ref<T | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const refresh = async () => {
    loading.value = true;
    error.value = null;
    try {
      const resp = await apiClient.get(typeof url === 'string' ? url : url.value);
      data.value = resp.data;
    } catch (e: any) {
      error.value = e.message || '请求失败';
    } finally {
      loading.value = false;
    }
  };

  // 响应式 url 自动重拉
  if (typeof url !== 'string') {
    watch(url, refresh, { immediate: true });
  } else {
    refresh();
  }

  return { data, loading, error, refresh };
}
```

**业务页面用**：

```vue
<script setup lang="ts">
import { useFetch } from '@/composables/useFetch';
const { data: users, loading, refresh } = useFetch<User[]>('/api/users');
</script>
```

## 套路二：表单状态管理

```ts
// src/composables/useForm.ts
import { reactive, ref } from 'vue';

export function useForm<T extends object>(initial: T) {
  const form = reactive({ ...initial });
  const errors = ref<Record<string, string>>({});

  const reset = () => Object.assign(form, initial);
  const setErrors = (e: Record<string, string>) => (errors.value = e);

  return { form, errors, reset, setErrors };
}
```

## 强约束

- 不要在 composable 里 `import { useRoute }` 之外的 Vue 顶级 API 当全局变量用——composable 必须能在 setup 上下文内复用
- 返回值必须 reactive（`ref` / `reactive` / `computed`），不要返回普通对象（解构后丢响应性）
- 副作用清理：用 `onScopeDispose()` 或 `onUnmounted()` 注销 timer / event listener
- 不要在 composable 内做 DOM 操作；DOM 操作放组件里
