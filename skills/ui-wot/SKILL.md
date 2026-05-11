---
name: ui-wot
description: Wot UI（uni-app Vue 3 移动端组件库）映射规则
kind: ui
ui_libs: [wot]
requires: [_common]
conflicts: [ui-antd, ui-element-plus, ui-element-ui]
priority: 30
---

# Skill: ui-wot

把 Amis 组件翻译成 **Wot UI（`wot-design-uni`）** 组件的映射表。
前提：当前任务 `tech_stack = uniapp`。

## 依赖引入

```json
{
  "dependencies": {
    "wot-design-uni": "^1.4.0"
  }
}
```

**easycom 自动注册**：uni-app 的 easycom 规则会自动把 `wd-*` 前缀解析到 `wot-design-uni`，**无需手动 import**。
`pages.json` 里配置：

```json
{
  "easycom": {
    "^wd-(.*)": "wot-design-uni/components/wd-$1/wd-$1.vue"
  }
}
```

⚠️ 主题 CSS：由 easycom 按需注入，**不要手动 `import "wot-design-uni/index.css"`**（会引起重复加载）。

## Amis → wot-design-uni 组件对照

⚠️ **翻译铁律**：见到 Amis 字段的 `type` 就映射到下表对应 wot 组件，**不要用别的 wot 组件代替**（哪怕你觉得别的"更好看"）。`label` 字段无论何时都生成"标签在上、输入在下"的 form-field 包装（详见骨架段）。

| Amis              | Wot UI                       |
|-------------------|------------------------------|
| `input-text`      | `<wd-input />`               |
| `input-password`  | `<wd-input type="password" show-password />` |
| `textarea`        | `<wd-textarea />`            |
| `input-number`    | `<wd-input-number />`        |
| `select`          | `<wd-picker />` / `<wd-select-picker />` |
| `radios`          | `<wd-radio-group />`         |
| `checkboxes`      | `<wd-checkbox-group />`      |
| `switch`          | `<wd-switch />`              |
| `date`            | `<wd-datetime-picker />`     |
| `button`          | `<wd-button />`              |
| `form`            | `<wd-form>` + 自定义 `<view class="form-field">`（标签在上、输入在下） |
| `crud` / `table`  | `<wd-table />` 或 `<wd-cell-group border>` + `<wd-cell>` 列表项 |
| `dialog`          | `<wd-message-box />` 命令式 API |
| `popup`           | `<wd-popup />`               |
| `tabs`            | `<wd-tabs />` + `<wd-tab>`   |
| `tag`             | `<wd-tag />`                 |

**关键反例**：
- ❌ `form` 字段绝对不要用 `<wd-cell title="用户名"><wd-input/></wd-cell>` —— wd-cell 是「列表行」组件，title 在左 slot 在右是 PC 后台审美，移动端表单不该这么排
- ✅ `form` 字段必须用「`<text class="form-label">` 在上、`<wd-input>` 在下」的 form-field 包装（见下方登录骨架）
- ✅ `crud / list` 才是 wd-cell-group + wd-cell 的正经场景（每行一条数据，title 是数据标题，slot/value 是数据值）

## 强约束（违反即判失败）

1. **只用 `wd-*` 前缀组件**，禁止混入 Vant / uView / TMUI
2. **不要手动 import Wot 主题 CSS**
3. 图标用 `<wd-icon name="xxx" />` 内置集；自定义图标走 `<text class="custom-icon-foo" />` 配合字体
4. 颜色主题变量：`--wot-*`，可在 `App.vue` 全局覆盖
5. **Amis form 字段绝对禁止用 `<wd-cell title="X"><wd-input/></wd-cell>`** —— wd-cell 是列表行，移动端表单审美用「标签在上、输入在下」的 form-field 自定义包装；wd-cell 只用于 crud/list/详情场景
6. **`<wd-cell-group>` 用于 list/详情页时必须带 `border`**，避免分隔线消失（form 场景见上一条，不该出现 cell-group）
7. **主操作 `wd-button` 必须 `type="primary" block size="large"`** —— 移动端按钮就该贴底大按钮，不靠 `style="width:100%"` 凑合
8. **任何含输入字段的页面必须包 `<wd-form ref="formRef" :model="form" :rules="rules">`**，提交前调 `formRef.value.validate()`
9. **「记住我」/ 单 checkbox 不要单独占一行** —— 紧贴最后一行表单或放进 extras 区文字链接旁；移动端默认就该记住登录
10. **登录 / 首页禁止加 `wd-navbar` 返回箭头** —— 入口页没有"上一级"
11. **次级动作（注册账号 / 忘记密码 / 切换登录方式）用 `<text class="link">` 文字链接**，禁止用 `wd-button` 二次按钮
12. **🔥 翻译纪律**：Amis JSON 里没的字段不要凭空加（连"忘记密码"链接都不行——除非 Amis 显式声明）；JSON 里有的字段必须翻译（`required:true`、`validations:{...}`、`api:"POST:/login"` 都得变成代码）

## 典型页面骨架（**生成业务页面前必读，必须照抄结构**）

下面三类骨架是反向飞轮沉淀的「移动端正确打开方式」，**生成同类页面时直接抄结构再换业务字段**。
不许凭通用 Vue 知识自由发挥——LLM 内部的"登录页"知识多半偏 Web 后台审美，照搬会被判负。

### 1. 登录 / 注册 / 找回密码页（最高频）

⚠️ **核心**：这是 Amis `form` 类型在移动端的标准翻译。**字段「标签在上、输入在下」、单列堆叠**——这是现代移动端登录的统一形态（参考 iOS 系统设置之外的所有第三方 App）。

```vue
<!-- src/pages/login/login.vue -->
<template>
  <view class="login-page">
    <!-- 顶部品牌区：仅当 Amis schema 显式声明 logo/title 时生成；没声明就省略 -->
    <view class="brand" v-if="false">
      <!-- 例：Amis JSON 里若没 brand 配置，不要凭空加 logo/标题 -->
    </view>

    <!-- 表单：标签在上 + 输入在下，单列堆叠；这是移动端表单标准形态 -->
    <wd-form ref="formRef" :model="form" :rules="rules">
      <!-- form-field 是自定义包装，不用 wd-cell。每个 Amis 字段对应一个 form-field -->
      <view class="form-field">
        <text class="form-label">用户名</text>
        <wd-input
          v-model="form.username"
          placeholder="请输入用户名 / 手机号"
          clearable
          custom-class="form-input"
        />
      </view>

      <view class="form-field">
        <text class="form-label">密码</text>
        <wd-input
          v-model="form.password"
          type="password"
          placeholder="请输入密码"
          show-password
          custom-class="form-input"
        />
      </view>

      <!-- 主操作：贴表单下方、block、primary -->
      <view class="actions">
        <wd-button type="primary" size="large" block :loading="loading" @click="submit">
          登 录
        </wd-button>
      </view>

      <!-- 次级行（仅当 Amis schema 显式声明这些功能时才生成对应链接，否则全部省略） -->
      <view class="extras" v-if="false">
        <!-- 例：Amis 没声明"记住我"/"忘记密码"就别凭空加 -->
      </view>
    </wd-form>
  </view>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { login } from '@/api/auth'   // ← Amis JSON 的 api 字段决定调哪个 API

const formRef = ref()
const loading = ref(false)
// 🔥 reactive 字段名严格对应 Amis schema 里 form fields[].name
const form = reactive({ username: '', password: '' })
// 🔥 rules 严格按 Amis fields[].required / validations 翻译
const rules = {
  username: [{ required: true, message: '请输入用户名' }],
  password: [{ required: true, message: '请输入密码' }],
}

const submit = async () => {
  try { await formRef.value.validate() } catch { return }
  loading.value = true
  try {
    // 🔥 接口路径严格按 Amis schema 的 api 字段；不要自己加 /api 前缀或改 method
    const res = await login(form)
    // 🔥 提交后行为按 Amis schema 的 redirect / onEvent 字段；schema 没声明就只 toast
    uni.showToast({ title: '登录成功', icon: 'success' })
  } catch (e: any) {
    uni.showToast({ title: e?.message || '登录失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss" scoped>
.login-page {
  min-height: 100vh;
  background: #ffffff;          /* 单列表单页用纯白底就够；不需要灰底层次 */
  padding: 48rpx 32rpx 32rpx;
  box-sizing: border-box;
}

/* form-field：标签在上、输入在下、单列堆叠的现代移动端表单 */
.form-field {
  margin-bottom: 32rpx;
  display: flex;
  flex-direction: column;
}
.form-label {
  font-size: 28rpx;
  color: #333333;
  font-weight: 500;
  margin-bottom: 16rpx;
  padding: 0 4rpx;
}
:deep(.form-input) {
  /* wd-input 默认有内边距；这里给个底边线让它视觉上像"输入框"而非 cell-row */
  border-bottom: 1rpx solid #e5e7eb;
}

.actions {
  margin-top: 48rpx;
}

/* 次级动作（如有） */
.extras {
  margin-top: 32rpx; padding: 0 8rpx;
  display: flex; justify-content: space-between; align-items: center;
}
.link { color: #4f46e5; font-size: 26rpx; }
</style>
```

**翻译纪律自检表**（Amis JSON → 代码字段对照）：

| Amis schema | 翻译到代码 |
|---|---|
| `fields[i].name` | `form` reactive 的字段名（一字不改） |
| `fields[i].label` | `<text class="form-label">` 的文字 |
| `fields[i].type:"input-text"` | `<wd-input>` |
| `fields[i].type:"input-password"` | `<wd-input type="password" show-password>` |
| `fields[i].placeholder` | `<wd-input placeholder="...">` |
| `fields[i].required:true` | `rules` 里加 `{required:true, message:"..."}` |
| `fields[i].validations` | `rules` 里加对应规则 |
| `api` / `submitApi` | `login(form)` 的实现走 `api` 指定的 URL/method |
| `redirectOn`/`onEvent.submit` | submit 成功后的 `uni.navigateTo`/`uni.reLaunch` |

**自由发挥红线**（没在 Amis schema 里就**别加**）：
- ❌ logo / 品牌标题 / 副标题
- ❌ 「记住我」勾选框
- ❌ 「忘记密码」/「立即注册」链接
- ❌ 验证码 / 短信登录 / 三方登录入口
- ❌ 任何 Amis schema 没声明的 toast/dialog 流程

### 2. 列表页（含下拉刷新 + 上拉加载 + 空状态）

```vue
<template>
  <view class="list-page">
    <view class="toolbar">
      <wd-search v-model="keyword" placeholder="搜索" @search="refresh" />
    </view>

    <wd-cell-group v-if="list.length > 0" border>
      <wd-cell
        v-for="item in list" :key="item.id"
        :title="item.name" :label="item.email"
        is-link @click="goDetail(item.id)"
      >
        <template #icon>
          <wd-img :src="item.avatar" :width="64" :height="64" round />
        </template>
      </wd-cell>
    </wd-cell-group>

    <wd-status-tip v-else-if="!loading" image="content" tip="还没有数据" />

    <wd-loadmore v-if="list.length > 0" :state="loadMoreState" @reload="loadMore" />
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { onPullDownRefresh, onReachBottom } from '@dcloudio/uni-app'
import { fetchUsers, type User } from '@/api/users'

const keyword = ref('')
const list = ref<User[]>([])
const page = ref(1)
const loading = ref(false)
const loadMoreState = ref<'loading' | 'finished' | 'error'>('loading')

const fetchPage = async (reset = false) => {
  if (loading.value) return
  loading.value = true
  try {
    const res = await fetchUsers({ q: keyword.value, page: page.value, pageSize: 20 })
    if (reset) list.value = res.items
    else list.value.push(...res.items)
    loadMoreState.value = res.items.length < 20 ? 'finished' : 'loading'
  } catch { loadMoreState.value = 'error' }
  finally { loading.value = false; uni.stopPullDownRefresh() }
}
const refresh = () => { page.value = 1; fetchPage(true) }
const loadMore = () => { page.value += 1; fetchPage(false) }
const goDetail = (id: number) => uni.navigateTo({ url: `/pages/user-detail/user-detail?id=${id}` })

onMounted(refresh)
onPullDownRefresh(refresh)
onReachBottom(loadMore)
</script>

<style lang="scss" scoped>
.list-page { min-height: 100vh; background: #f7f8fa; }
.toolbar { padding: 16rpx 24rpx; background: #fff; }
</style>
```

**`pages.json` 里该页**必须**配 `"enablePullDownRefresh": true`**：

```json
{
  "path": "pages/user-list/user-list",
  "style": { "navigationBarTitleText": "用户列表", "enablePullDownRefresh": true }
}
```

### 3. 详情页（含分组信息 + 固定底部操作）

```vue
<template>
  <view class="detail-page">
    <view class="hero" v-if="data">
      <wd-img :src="data.avatar" :width="160" :height="160" round />
      <text class="name">{{ data.name }}</text>
      <text class="desc">{{ data.role }}</text>
    </view>

    <wd-cell-group title="基本信息" border v-if="data">
      <wd-cell title="手机号" :value="data.phone" />
      <wd-cell title="邮箱" :value="data.email" />
      <wd-cell title="注册时间" :value="data.createdAt" />
    </wd-cell-group>

    <wd-cell-group title="账户设置" border v-if="data">
      <wd-cell title="修改密码" is-link @click="goChangePwd" />
      <wd-cell title="绑定手机" is-link @click="goBindPhone" />
    </wd-cell-group>

    <view class="footer-bar">
      <wd-button plain block @click="logout">退出登录</wd-button>
    </view>
  </view>
</template>

<style lang="scss" scoped>
.detail-page { min-height: 100vh; background: #f7f8fa; padding-bottom: 200rpx; }
.hero {
  padding: 64rpx 32rpx 48rpx;
  display: flex; flex-direction: column; align-items: center;
  background: #fff;
}
.name { font-size: 36rpx; font-weight: 600; margin-top: 24rpx; }
.desc { font-size: 26rpx; color: #9ca3af; margin-top: 8rpx; }
.footer-bar {
  position: fixed; left: 0; right: 0; bottom: 0;
  padding: 24rpx 32rpx calc(24rpx + env(safe-area-inset-bottom));
  background: rgba(255, 255, 255, 0.95);
  border-top: 1rpx solid #e5e7eb;
  backdrop-filter: blur(12px);
}
</style>
```

**关键点**：
- 头部背景区分（白底）+ 头像 + 主次文字
- 信息分组用 `wd-cell-group title border` 作为分组标题
- 可跳转项加 `is-link` 自动右箭头
- 底部固定按钮做 `safe-area-inset-bottom` 防 Home Indicator 盖
- 主容器 `padding-bottom` 防底部按钮盖最后一行

## 表单校验最佳实践

```vue
<wd-form ref="formRef" :model="form" :rules="rules">
  <wd-cell-group border>
    <wd-cell title="手机号" prop="phone" required>
      <wd-input v-model="form.phone" placeholder="请输入手机号" />
    </wd-cell>
    <wd-cell title="验证码" prop="code" required>
      <wd-input v-model="form.code" placeholder="6 位数字" maxlength="6" />
    </wd-cell>
  </wd-cell-group>
  <view style="margin-top: 48rpx;">
    <wd-button type="primary" block size="large" @click="submit">提交</wd-button>
  </view>
</wd-form>
```

```ts
const rules = {
  phone: [
    { required: true, message: '请输入手机号' },
    { validator: (_: any, v: string) => /^1[3-9]\d{9}$/.test(v), message: '手机号格式错误' },
  ],
  code: [
    { required: true, message: '请输入验证码' },
    { min: 6, max: 6, message: '验证码是 6 位数字' },
  ],
}
const submit = async () => {
  try { await formRef.value.validate() } catch { return }
  // ... 业务调用
}
```

- `wd-form :rules` 自动红字提示；`wd-cell prop="xxx" required` 关联规则
- 自定义 `validator: (rule, value) => boolean` 兜复杂规则（正则 / 跨字段依赖）
- 单位一律 `rpx`

## 常见踩坑速查

| 症状 | 根因 | 正确姿势 |
|---|---|---|
| **表单字段左右布局像 iOS 设置页** | **用了 `<wd-cell title slot>` 当表单包装** | 改用 `<view class="form-field">` 自定义包装，「标签在上、输入在下」 |
| 登录页凭空多出"记住我 / 忘记密码 / 注册" | LLM 自由发挥加的 | 严格遵循 Amis JSON——schema 没声明就别加（翻译纪律） |
| 主按钮不够醒目 | 用了 inline `style="width:100%"` 不用 `block size="large"` | 永远 `<wd-button type="primary" block size="large">` |
| 列表滚到底部无反应 | 漏 `onReachBottom` | import `@dcloudio/uni-app` 的 `onReachBottom` |
| 下拉刷新转圈不停 | 漏 `uni.stopPullDownRefresh()` | 请求完成 `finally` 里调 stop |
| 底部按钮被 Home Indicator 盖 | 没 safe-area | `padding-bottom: env(safe-area-inset-bottom)` |
| 页面没出现在路由里 | 漏更新 `pages.json` | **每增一页就同步 `pages.json`**，#1 高频失败 |

## 更深骨架文档

更多骨架（注册页、找回密码页、表单分组、Tabbar 首页等）见 `references/page-patterns.md`。
本主体已覆盖 80% 高频场景，**没必要每次都 Read**。

## 资产

`assets/`：未来沉淀典型组件最小可运行片段。
