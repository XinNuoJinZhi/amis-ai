# Element Plus 模式：el-dialog / el-drawer / el-message-box

> 触发：Amis JSON 含 `dialog` / `drawer` / `confirm` / 弹窗内嵌表单

## 弹窗内表单（含异步提交）

```vue
<script setup lang="ts">
import { reactive, ref } from 'vue';
import { ElMessage } from 'element-plus';
import type { FormInstance } from 'element-plus';

const visible = ref(false);
const submitting = ref(false);
const formRef = ref<FormInstance>();
const form = reactive({ name: '', email: '' });

function open(initial?: typeof form) {
  Object.assign(form, initial || { name: '', email: '' });
  visible.value = true;
}

async function submit() {
  if (!formRef.value) return;
  try {
    await formRef.value.validate();
  } catch {
    return;  // 校验失败
  }
  submitting.value = true;
  try {
    await apiClient.post('/api/users', form);
    ElMessage.success('保存成功');
    visible.value = false;
    emit('saved');
  } catch (e: any) {
    ElMessage.error(e.message || '保存失败');
  } finally {
    submitting.value = false;
  }
}

const emit = defineEmits<{ saved: [] }>();
defineExpose({ open });
</script>

<template>
  <el-dialog
    v-model="visible"
    title="新增用户"
    width="500"
    :close-on-click-modal="false"
    destroy-on-close
  >
    <el-form :model="form" ref="formRef" label-width="80px">
      <el-form-item label="姓名" prop="name" :rules="[{ required: true }]">
        <el-input v-model="form.name" />
      </el-form-item>
      <el-form-item label="邮箱" prop="email" :rules="[{ required: true, type: 'email' }]">
        <el-input v-model="form.email" />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="submit">保存</el-button>
    </template>
  </el-dialog>
</template>
```

**父组件用法**：

```vue
<UserDialog ref="dialogRef" @saved="refresh" />
<el-button @click="dialogRef?.open()">新增</el-button>
<el-button @click="dialogRef?.open({ name: 'Alice', email: 'a@x.com' })">编辑</el-button>
```

## el-drawer（侧滑抽屉，相同 API）

```vue
<el-drawer v-model="visible" title="详情" direction="rtl" size="40%">
  <!-- ... -->
</el-drawer>
```

## el-message-box（命令式 confirm）

```ts
import { ElMessageBox, ElMessage } from 'element-plus';

async function deleteUser(id: number) {
  try {
    await ElMessageBox.confirm(
      '此操作将永久删除该用户，是否继续？',
      '提示',
      { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' },
    );
    await apiClient.delete(`/api/users/${id}`);
    ElMessage.success('删除成功');
    refresh();
  } catch {
    // 用户取消 / 删除失败：不报错（confirm 取消会 reject）
  }
}
```

## 多级弹窗（弹窗内打开弹窗）

```vue
<el-dialog v-model="outerVisible" title="选择用户">
  <el-button @click="innerVisible = true">新增用户</el-button>
  <el-dialog v-model="innerVisible" title="新增" append-to-body>
    <!-- 必须 append-to-body 否则被父 dialog 遮挡 -->
  </el-dialog>
</el-dialog>
```

## 强约束

- `destroy-on-close`：弹窗关闭销毁内容，避免表单状态残留下次打开（特别是编辑/新增切换场景）
- `close-on-click-modal="false"`：表单弹窗禁止点遮罩关闭，防误操作丢失输入
- `append-to-body`：嵌套弹窗 / 跨 z-index 场景必备
- 异步提交按钮必须绑 `:loading="submitting"`，避免重复点击
- `ElMessageBox.confirm` 取消会 reject，不要在 catch 里报错（用空 catch 或区分 error message）
- 弹窗内表单：每次打开都要 `Object.assign(form, initial)` 或 `formRef.value?.resetFields()` 重置
- 不要用 `:visible.sync`（Vue 2 语法），Vue 3 用 `v-model`
