# Element Plus 模式：表单校验（同步 / 异步 / 联动）

> 触发：Amis JSON 含 `form` + `validations` / 字段间联动 / 异步唯一性校验（如用户名查重）

## 同步校验：rules 对象

```vue
<script setup lang="ts">
import { reactive, ref } from 'vue';
import type { FormInstance, FormRules } from 'element-plus';

interface UserForm {
  username: string;
  email: string;
  age: number;
}

const formRef = ref<FormInstance>();
const form = reactive<UserForm>({ username: '', email: '', age: 0 });

const rules: FormRules<UserForm> = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '长度 3-20', trigger: 'blur' },
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '邮箱格式错误', trigger: ['blur', 'change'] },
  ],
  age: [
    { type: 'number', required: true, message: '请输入年龄', trigger: 'blur' },
    { validator: (_, v, cb) => v >= 18 ? cb() : cb(new Error('必须 18 岁以上')), trigger: 'blur' },
  ],
};

async function submit() {
  if (!formRef.value) return;
  try {
    await formRef.value.validate();
    // 校验通过 → 提交
  } catch {
    // 校验失败（el-form 会自动高亮错误）
  }
}
</script>

<template>
  <el-form :model="form" :rules="rules" ref="formRef" label-width="80px">
    <el-form-item label="用户名" prop="username">
      <el-input v-model="form.username" />
    </el-form-item>
    <el-form-item label="邮箱" prop="email">
      <el-input v-model="form.email" />
    </el-form-item>
    <el-form-item label="年龄" prop="age">
      <el-input-number v-model="form.age" :min="0" :max="120" />
    </el-form-item>
    <el-button type="primary" @click="submit">提交</el-button>
  </el-form>
</template>
```

## 异步校验：唯一性查重

```ts
const checkUsernameAvailable = async (_: any, value: string, callback: any) => {
  if (!value) return callback();
  try {
    const resp = await apiClient.get(`/api/users/check-username?u=${value}`);
    resp.data.available ? callback() : callback(new Error('用户名已被占用'));
  } catch {
    callback(new Error('校验失败，请重试'));
  }
};

const rules: FormRules = {
  username: [
    { required: true, message: '请输入', trigger: 'blur' },
    { validator: checkUsernameAvailable, trigger: 'blur' },
  ],
};
```

## 联动校验：确认密码

```ts
const rules: FormRules = {
  password: [{ required: true, min: 6, trigger: 'blur' }],
  confirmPassword: [
    {
      required: true,
      validator: (_, value, callback) => {
        if (value !== form.password) callback(new Error('两次密码不一致'));
        else callback();
      },
      trigger: 'blur',
    },
  ],
};

// 当 password 改变时，重新校验 confirmPassword
watch(() => form.password, () => {
  if (form.confirmPassword) formRef.value?.validateField('confirmPassword');
});
```

## 动态校验规则（按场景切换）

```ts
const dynamicRules = computed<FormRules>(() => ({
  phone: form.contactType === 'phone'
    ? [{ required: true, pattern: /^1\d{10}$/, message: '11 位手机号', trigger: 'blur' }]
    : [],
  email: form.contactType === 'email'
    ? [{ required: true, type: 'email', trigger: 'blur' }]
    : [],
}));
```

## 强约束

- `prop` 必须和 `rules` 的 key、`form` 对象的 key 三者完全对齐（最常见 bug 来源）
- `trigger: 'blur'` 比 `'change'` 友好，避免输入中频闪错误提示
- 异步校验回调签名必须 `(rule, value, callback)`，不要忘 `callback()`（忘了等于永远 pending）
- 提交前永远 `await formRef.value.validate()`，不要相信前端校验直接发请求
- 重置表单用 `formRef.value?.resetFields()`，不要手动重置 form 对象（会丢失校验状态）
