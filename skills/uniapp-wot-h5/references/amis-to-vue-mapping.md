# Amis JSON 顶层结构 → Vue 页面翻译规则

Amis JSON 是**声明式 UI 配置**，最外层描述的是"一个页面"或"一个容器"。翻译时按以下规则拆解：

## 顶层类型映射

| Amis `type` | 对应做法 | 生成文件 |
|-------------|---------|---------|
| `page` | 一个独立页面 | `src/pages/{slug}/{slug}.vue` + 在 `pages.json` 注册 |
| `form` | 表单页（可包在 page 里） | `<wd-form>` + 字段数组遍历 |
| `crud` | 列表页（有分页、筛选、操作） | `<wd-table>` + 顶部筛选栏 + 底部分页 |
| `dialog` | 弹窗 | `<wd-popup>` 或 `<wd-dialog>`，不另立页面 |
| `wizard` | 分步表单 | `<wd-steps>` + 分段 `<wd-form>` |
| `tabs` | 标签页容器 | `<wd-tabs>` + `<wd-tab>` |
| `service` | 数据拉取容器 | `onMounted` 里 `axios.get()` + `ref` 包装数据 |

## 页面拆分规则

### 规则 A：`type: "page"` 直接 1:1 映射
```json
{ "type": "page", "title": "用户管理", "body": {...} }
```
→ 生成 `src/pages/user/user.vue`，`<wd-navbar>` 取 title，`body` 递归处理。

### 规则 B：`type: "crud"` 作为 body 时，列出标准结构
必出现 3 个区块：
1. 顶部筛选栏（`filter` 字段）→ `<wd-form>` + 查询按钮
2. 中部表格（`columns` 字段）→ `<wd-table>`
3. 底部分页 → `<wd-pagination>`（或 Wot UI 里的等价组件）

### 规则 C：`type: "form"` 单独成页 vs 弹窗
- 放在 page 的 body → 单独成页
- 放在 crud 的 `headerToolbar` 或 action 里 → 用 `<wd-popup>` 承载

## 数据源（api 字段）

Amis 的 `api` 可能是字符串或对象：
```json
"api": "get:/api/users"
"api": { "method": "post", "url": "/api/login", "data": {...} }
```

翻译到 Vue：
```ts
import { ref, onMounted } from 'vue'
import axios from '@/utils/request'

const data = ref([])
onMounted(async () => {
  const resp = await axios.get('/api/users')
  data.value = resp.data.items  // Amis 约定返回 { items, total }
})
```

## 动作（actions）

Amis 的 action 类型（ajax/url/dialog/link）翻译：

| Amis action | Vue 对应 |
|-------------|---------|
| `actionType: "ajax"` | `axios.post(api.url, data)` |
| `actionType: "dialog"` | `showDialog.value = true` + `<wd-popup>` |
| `actionType: "url"` | `uni.navigateTo({ url: '/pages/xxx/xxx' })` |
| `actionType: "submit"` | `form.value.validate()` 后 post |

## 严禁

- **不要照搬 Amis JSON 字段到 Vue 模板里**（比如不要输出 `type="input-text"` 这种）
- **不要引用 `amis` 或 `amis-core` npm 包**——我们是"用 Wot UI 实现 Amis 定义的交互"，不是真跑 Amis
- **不要保留 Amis 的 `$ref` / `$schema`** 等机制，直接展开为 Vue 数据
