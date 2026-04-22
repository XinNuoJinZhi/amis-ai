# Amis 核心概念（生成代码前必读）

Amis 是百度开源的**低代码前端框架**。给你的输入 JSON 不是"任意 JSON"，是**有严格语义的 Amis schema**。本文是浓缩版，足够你理解一份典型的 Amis JSON 该翻译成什么样的代码。

## 1. JSON 即 UI（声明式渲染）

Amis 的核心思想：**用 JSON 描述一颗 UI 组件树**，运行时由 amis 渲染器解析成 DOM。所以一份 Amis JSON 本质上等价于一棵组件树。

最小例子：
```json
{
  "type": "page",
  "title": "我的页面",
  "body": {
    "type": "form",
    "body": [
      { "type": "input-text", "name": "username", "label": "用户名" }
    ]
  }
}
```
对应的组件树：
```
Page
└── Form
    └── InputText (name=username)
```

**翻译铁律**：每个 `type` 对应目标技术栈的一个组件；嵌套关系完全保留。

## 2. 顶层 type 一览（最常见 5 种）

| Amis type | 语义 | 翻译要点 |
|---|---|---|
| `page` | 页面级容器 | 通常对应一个完整的路由页面（如 `pages/xxx/index.vue`） |
| `form` | 表单 | 数据收集 + 提交，要把 `name` 字段映射到 v-model |
| `crud` | 列表 + 增删改查 | 包含表格、筛选、分页、批量操作；最复杂，需拆成多个子组件 |
| `service` | 数据加载容器 | 一开局调 api 拉数据，再渲染 body；要在 onMounted 触发 |
| `wizard` | 多步骤向导 | 翻译成多步表单 + 步骤指示器 |

## 3. 数据域（data scope）

Amis 的核心特性之一是**作用域数据**：每一层组件可以从父级继承数据，也可以本地修改。表达式 `${foo}` 会在当前数据域里求值。

例子：
```json
{
  "type": "service",
  "api": "/api/user/info",
  "body": {
    "type": "tpl",
    "tpl": "你好，${name}！"
  }
}
```
service 拉到的 `{name: "张三"}` 进入数据域，`${name}` 被替换为"张三"。

**翻译要点**：
- 用响应式状态管理（Vue 的 `ref`/`reactive`，React 的 `useState`）模拟数据域
- `${foo}` 翻译成模板插值（Vue 的 `{{ foo }}` / React 的 `{foo}`）
- 复杂表达式 `${foo|truncate:10}` 翻译成计算属性/选择器

## 4. API 字段（最容易出错）

Amis 里的 `api` 字段有多种形态：

```json
"api": "/api/user/list"                    // 默认 GET
"api": "post:/api/user/create"             // 显式指定方法
"api": {
  "method": "put",
  "url": "/api/user/${id}",
  "data": { "name": "${name}" }
}                                           // 完整对象，含 body 模板
```

**翻译要点**：
- 字符串短形式 → axios 调用，方法默认 GET
- `method:url` 形式 → 拆出方法和 URL
- 对象形式 → `data` 里的 `${...}` 用当前数据域的值填充
- **所有 API 调用必须经 `src/api/` 模块化封装，禁止在组件里直接 `axios.get`**

## 5. actions（按钮 / 交互）

```json
{
  "type": "button",
  "label": "提交",
  "actionType": "ajax",
  "api": "post:/api/save"
}
```

常见 `actionType`：
- `ajax`：调 api（最常见）
- `dialog`：弹窗
- `link`：跳转
- `submit`：提交所属表单
- `reload`：重载某个目标组件

## 6. 表达式系统（条件渲染、可见性）

```json
{
  "type": "input-text",
  "name": "vipLevel",
  "visibleOn": "data.userType === 'vip'"
}
```

`visibleOn` / `disabledOn` / `requiredOn` 都接受表达式字符串。

**翻译要点**：
- `visibleOn: "data.x === 'y'"` → Vue 里 `v-if="x === 'y'"`，React 里 `{x === 'y' && <...>}`
- 表达式里的 `data.` 前缀是引用当前数据域，翻译时去掉

## 7. 命名约定与陷阱

| Amis 约定 | 翻译时注意 |
|---|---|
| `type` 决定组件 | 大小写敏感，`form` 不等于 `Form` |
| `name` 是数据键 | 不是 DOM id，是数据域里的字段名 |
| `label` 是显示文案 | 国际化时要走 i18n token（详见 i18n-logging.md） |
| `body` 是子节点容器 | 可能是单个对象也可能是数组 |
| `id`/`name` 都不允许重复 | 同层级唯一 |

## 完整阅读建议

需要深入时，去看 ZC Amis 的 references（`Skill({skill: "zc_amis"})` 然后 `Read` 它的 references/concepts/）。本文够你启动一次正常的代码生成任务了。
