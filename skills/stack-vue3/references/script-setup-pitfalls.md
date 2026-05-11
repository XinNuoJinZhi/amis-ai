# Vue3 模式：`<script setup>` 高频陷阱

> 触发：任何 Vue3 业务页面（默认全用 `<script setup>`），尤其涉及 props / ref / template

## 陷阱 1：解构 props 丢失响应性

```ts
// ❌ 错：destructure 后失去响应性
const { user } = defineProps<{ user: User }>();
watch(() => user.name, console.log);  // 不会触发

// ✅ 对：保持 props 对象 / 用 toRefs
const props = defineProps<{ user: User }>();
watch(() => props.user.name, console.log);

// 或者 Vue 3.5+ 用响应式解构（需要 reactivityTransform 或 propsDestructure）
const { user } = defineProps<{ user: User }>();  // 3.5+ 支持响应式
```

## 陷阱 2：ref 在 template 自动 unwrap，但 setup 内不行

```ts
const count = ref(0);
console.log(count);          // ref 对象，需要 count.value
console.log(count.value);    // ✅ 0

// 模板里自动 unwrap：
// <div>{{ count }}</div>  → 渲染 0（不需要 .value）
```

## 陷阱 3：reactive 解构丢响应性

```ts
const state = reactive({ count: 0 });

// ❌ 解构后 count 是普通 number
const { count } = state;
count++;  // 不会触发更新

// ✅ 用 toRefs 保留响应性
const { count } = toRefs(state);
count.value++;  // 触发更新
```

## 陷阱 4：template ref 必须同名 + onMounted 才能拿到

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue';
const inputRef = ref<HTMLInputElement | null>(null);

// ❌ setup 顶层访问：永远是 null（DOM 还没渲染）
console.log(inputRef.value);  // null

// ✅ onMounted 内访问
onMounted(() => {
  inputRef.value?.focus();
});
</script>

<template>
  <!-- ref 名必须和变量一致 -->
  <input ref="inputRef" />
</template>
```

## 陷阱 5：defineProps / defineEmits 是宏，不能用变量

```ts
// ❌ 不能传变量
const propsDef = { user: Object };
defineProps(propsDef);  // 编译失败

// ✅ 必须字面量
defineProps<{ user: User }>();
// 或
defineProps({ user: { type: Object, required: true } });
```

## 陷阱 6：v-model 和 props 同步

```vue
<!-- 子组件 -->
<script setup lang="ts">
const props = defineProps<{ modelValue: string }>();
const emit = defineEmits<{ 'update:modelValue': [v: string] }>();

// ❌ 直接修改 props
function onInput(e: Event) {
  props.modelValue = (e.target as HTMLInputElement).value;  // 警告
}

// ✅ 通过 emit 让父组件改
function onInput(e: Event) {
  emit('update:modelValue', (e.target as HTMLInputElement).value);
}
</script>
```

## 陷阱 7：watch 监听 ref vs reactive

```ts
const count = ref(0);
const state = reactive({ count: 0 });

watch(count, (v) => console.log(v));        // ✅ ref 直接传
watch(() => state.count, (v) => console.log(v));  // ✅ reactive 用 getter
watch(state, (s) => console.log(s));         // ✅ 监听整个 reactive 对象（deep 默认 true）

// ❌ 监听 reactive 属性传值
watch(state.count, (v) => console.log(v));  // 传的是 number，不响应
```

## 强约束（再次强调）

- props 永远只读，不要解构后修改
- ref 在 setup / composable 内必须 `.value`，在 template 中自动 unwrap
- template ref 必须 onMounted 后访问
- emit 类型用元组 `'update:x': [v: string]`（Vue 3.3+）
- 不要在 v-for 内用 ref 数组以外的方式拿 DOM（用函数式 ref：`ref="el => refs[i] = el"`）
