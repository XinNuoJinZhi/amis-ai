# Element Plus 模式：el-table 列表（远程分页 + 行编辑 + slot 渲染）

> 触发：Amis JSON `crud` / `table` + 分页 + 操作列 / 自定义渲染单元格

## 远程分页 + 排序 + 搜索

```vue
<script setup lang="ts">
import { reactive, ref, onMounted, watch } from 'vue';
import { apiClient } from '@/api/client';

interface User { id: number; name: string; email: string; createdAt: string }

const data = ref<User[]>([]);
const loading = ref(false);
const total = ref(0);

const query = reactive({
  page: 1,
  pageSize: 20,
  keyword: '',
  sortBy: '' as 'name' | 'createdAt' | '',
  order: '' as 'asc' | 'desc' | '',
});

async function fetchData() {
  loading.value = true;
  try {
    const { data: resp } = await apiClient.get('/api/users', { params: query });
    data.value = resp.list;
    total.value = resp.total;
  } finally {
    loading.value = false;
  }
}

function onSortChange({ prop, order }: { prop: string; order: 'ascending' | 'descending' | null }) {
  query.sortBy = (prop as any) || '';
  query.order = order === 'ascending' ? 'asc' : order === 'descending' ? 'desc' : '';
  query.page = 1;  // 排序变化重置到第一页
  fetchData();
}

onMounted(fetchData);
watch(() => [query.page, query.pageSize], fetchData);
</script>

<template>
  <div class="user-list">
    <div class="toolbar">
      <el-input v-model="query.keyword" placeholder="搜索用户名" clearable @clear="fetchData"
                @keyup.enter="fetchData" style="width: 240px" />
      <el-button type="primary" @click="fetchData">搜索</el-button>
    </div>

    <el-table v-loading="loading" :data="data" border @sort-change="onSortChange">
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="name" label="姓名" sortable="custom" />
      <el-table-column prop="email" label="邮箱" />
      <el-table-column prop="createdAt" label="创建时间" sortable="custom" width="180" />
      <el-table-column label="操作" width="180" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="onEdit(row)">编辑</el-button>
          <el-button size="small" type="danger" @click="onDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      v-model:current-page="query.page"
      v-model:page-size="query.pageSize"
      :total="total"
      :page-sizes="[10, 20, 50, 100]"
      layout="total, sizes, prev, pager, next, jumper"
      background
    />
  </div>
</template>

<style scoped>
.toolbar { margin-bottom: 16px; display: flex; gap: 8px; }
.el-pagination { margin-top: 16px; justify-content: flex-end; }
</style>
```

## 行内编辑（双击 → input）

```vue
<el-table-column prop="name" label="姓名">
  <template #default="{ row, $index }">
    <el-input v-if="editingRow === $index" v-model="row.name" @blur="onCellSave(row, $index)" />
    <span v-else @dblclick="editingRow = $index">{{ row.name }}</span>
  </template>
</el-table-column>
```

## 固定列 + 多选 + 展开行

```vue
<el-table :data="data" border>
  <!-- 多选列 -->
  <el-table-column type="selection" width="48" fixed="left" />
  <!-- 展开行 -->
  <el-table-column type="expand">
    <template #default="{ row }">
      <pre>{{ JSON.stringify(row.detail, null, 2) }}</pre>
    </template>
  </el-table-column>
  <!-- 业务列... -->
  <el-table-column label="操作" fixed="right" width="200">
    <template #default="{ row }">
      <el-button size="small">编辑</el-button>
    </template>
  </el-table-column>
</el-table>
```

## 强约束

- 远程数据：`v-loading` 必须配合 `loading.value` 设置 true/false，否则有竞态
- 排序：`sortable="custom"` 才走 `@sort-change`；`sortable` 会走前端排序（小数据可以，大数据不要）
- 操作列固定：必须 `fixed="right"` + 设 `width` 否则窄屏不可见
- 分页用 `v-model:current-page` / `v-model:page-size` 双向，不要手动 `@current-change`
- `page-size` 必须在 `page-sizes` 数组内，否则下拉显示空
- `<template #default="{ row }">` 必须解构 row，直接 `slot-scope` 是 Vue 2 用法
- 大表格（>5000 行）必须用虚拟滚动 `el-table-v2`，普通 `el-table` 会卡
