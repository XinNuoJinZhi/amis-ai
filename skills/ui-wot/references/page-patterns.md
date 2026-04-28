# Wot UI 典型页面模式（uni-app + Vue 3）

本文档给出**移动端最高频**的三类页面骨架 + 标准写法。凡是生成同类页面都**优先抄这里的结构**，再替换业务字段。
避免用 Web 后台审美套移动端。

设计原则先复习一遍（来自 `platform-mobile/SKILL.md`）：

- 全屏铺满，不嵌阴影卡片
- 表单走 `wd-cell-group` + `wd-cell` 列表形态（标签在 title、输入在插槽）
- 主按钮贴底或紧随表单、`width: 100%`；次级动作用文字链接
- 登录 / 首页**不加返回箭头**

---

## 1. 登录 / 注册页

```vue
<!-- src/pages/login/login.vue -->
<template>
  <view class="login-page">
    <!-- 顶部品牌区：Logo + 主标题 + 副标题；不要返回箭头 -->
    <view class="brand">
      <image class="logo" src="/static/logo.png" mode="aspectFit" />
      <text class="title">欢迎回来</text>
      <text class="subtitle">登录以继续</text>
    </view>

    <!-- 表单：列表感 cell-group，不是 Web 卡片 -->
    <wd-form ref="formRef" :model="form" :rules="rules">
      <wd-cell-group border>
        <wd-cell title="用户名" prop="username" required>
          <wd-input
            v-model="form.username"
            placeholder="请输入用户名 / 手机号"
            clearable
          />
        </wd-cell>
        <wd-cell title="密码" prop="password" required>
          <wd-input
            v-model="form.password"
            type="password"
            placeholder="请输入密码"
            show-password
          />
        </wd-cell>
      </wd-cell-group>

      <!-- 主操作：贴下方、100% 宽、primary -->
      <view class="actions">
        <wd-button type="primary" size="large" block :loading="loading" @click="submit">
          登 录
        </wd-button>
      </view>

      <!-- 次级动作：两侧文字链接，不用按钮 -->
      <view class="extras">
        <text class="link" @click="goRegister">注册账号</text>
        <text class="link" @click="goForgot">忘记密码</text>
      </view>
    </wd-form>
  </view>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { login } from '@/api/auth';

const formRef = ref();
const loading = ref(false);
const form = reactive({ username: '', password: '' });
const rules = {
  username: [{ required: true, message: '请输入用户名' }],
  password: [{ required: true, message: '请输入密码', min: 6 }],
};

const submit = async () => {
  try {
    await formRef.value.validate();
  } catch {
    return;
  }
  loading.value = true;
  try {
    const { token } = await login(form);
    uni.setStorageSync('token', token);
    uni.reLaunch({ url: '/pages/index/index' });
  } catch (e: any) {
    uni.showToast({ title: e?.message || '登录失败', icon: 'none' });
  } finally {
    loading.value = false;
  }
};

const goRegister = () => uni.navigateTo({ url: '/pages/register/register' });
const goForgot = () => uni.navigateTo({ url: '/pages/forgot/forgot' });
</script>

<style lang="scss" scoped>
.login-page {
  min-height: 100vh;
  background: #f7f8fa;
  padding: 48rpx 32rpx 32rpx;
  box-sizing: border-box;
}
.brand {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 64rpx 0 56rpx;
}
.logo { width: 128rpx; height: 128rpx; margin-bottom: 24rpx; }
.title {
  font-size: 44rpx;
  font-weight: 600;
  color: #1a1a1a;
}
.subtitle {
  font-size: 26rpx;
  color: #9ca3af;
  margin-top: 8rpx;
}
.actions { margin-top: 56rpx; }
.extras {
  margin-top: 32rpx;
  display: flex;
  justify-content: space-between;
  padding: 0 8rpx;
}
.link {
  color: #4f46e5;
  font-size: 26rpx;
}
</style>
```

**关键点**：
- 没有外层阴影卡片；背景色直接作用于 `.login-page`
- `wd-cell-group border` 给分隔线；`wd-cell` 的 `title` 作标签
- 主按钮 `block size="large"`，100% 宽，贴紧表单下方
- "注册 / 忘记密码"用 `<text class="link">` 文字链接，不用按钮
- 不写 `wd-navbar` 返回箭头（登录是入口）

---

## 2. 列表页（含下拉刷新 + 上拉加载 + 空状态）

```vue
<!-- src/pages/user-list/user-list.vue -->
<template>
  <view class="list-page">
    <!-- 顶部搜索 / 筛选（可选） -->
    <view class="toolbar">
      <wd-search v-model="keyword" placeholder="搜索用户名" @search="refresh" />
    </view>

    <!-- 列表主体 -->
    <wd-cell-group v-if="list.length > 0" border>
      <wd-cell
        v-for="item in list"
        :key="item.id"
        :title="item.name"
        :label="item.email"
        is-link
        @click="goDetail(item.id)"
      >
        <template #icon>
          <wd-img :src="item.avatar" :width="64" :height="64" round />
        </template>
      </wd-cell>
    </wd-cell-group>

    <!-- 空状态 -->
    <wd-status-tip
      v-else-if="!loading"
      image="content"
      tip="还没有数据"
    />

    <!-- 加载更多 -->
    <wd-loadmore
      v-if="list.length > 0"
      :state="loadMoreState"
      @reload="loadMore"
    />
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { onPullDownRefresh, onReachBottom } from '@dcloudio/uni-app';
import { fetchUsers, type User } from '@/api/users';

const keyword = ref('');
const list = ref<User[]>([]);
const page = ref(1);
const loading = ref(false);
const loadMoreState = ref<'loading' | 'finished' | 'error'>('loading');

const fetchPage = async (reset = false) => {
  if (loading.value) return;
  loading.value = true;
  try {
    const res = await fetchUsers({ q: keyword.value, page: page.value, pageSize: 20 });
    if (reset) {
      list.value = res.items;
    } else {
      list.value.push(...res.items);
    }
    loadMoreState.value = res.items.length < 20 ? 'finished' : 'loading';
  } catch {
    loadMoreState.value = 'error';
  } finally {
    loading.value = false;
    uni.stopPullDownRefresh();
  }
};

const refresh = () => {
  page.value = 1;
  fetchPage(true);
};

const loadMore = () => {
  page.value += 1;
  fetchPage(false);
};

const goDetail = (id: number) => {
  uni.navigateTo({ url: `/pages/user-detail/user-detail?id=${id}` });
};

onMounted(refresh);
onPullDownRefresh(refresh);
onReachBottom(loadMore);
</script>

<style lang="scss" scoped>
.list-page {
  min-height: 100vh;
  background: #f7f8fa;
}
.toolbar {
  padding: 16rpx 24rpx;
  background: #fff;
}
</style>
```

**关键点**：
- `wd-cell is-link` 自带右箭头表示可点击
- 下拉刷新走 uni-app 钩子 `onPullDownRefresh` + `pages.json` 里该页配 `"enablePullDownRefresh": true`
- 上拉加载走 `onReachBottom`
- `wd-status-tip` 空状态图；`wd-loadmore` 展示加载状态
- 头像用 `wd-img round` 圆形

**`pages.json` 路由注册必做**：
```json
{
  "path": "pages/user-list/user-list",
  "style": {
    "navigationBarTitleText": "用户列表",
    "enablePullDownRefresh": true
  }
}
```

---

## 3. 详情页（含分组信息 + 固定底部操作）

```vue
<!-- src/pages/user-detail/user-detail.vue -->
<template>
  <view class="detail-page">
    <!-- 头部信息卡：大图 + 主标题 -->
    <view class="hero" v-if="data">
      <wd-img :src="data.avatar" :width="160" :height="160" round />
      <text class="name">{{ data.name }}</text>
      <text class="desc">{{ data.role }}</text>
    </view>

    <!-- 分组信息：cell-group 列表感 -->
    <wd-cell-group title="基本信息" border v-if="data">
      <wd-cell title="手机号" :value="data.phone" />
      <wd-cell title="邮箱" :value="data.email" />
      <wd-cell title="注册时间" :value="data.createdAt" />
    </wd-cell-group>

    <wd-cell-group title="账户设置" border v-if="data">
      <wd-cell title="修改密码" is-link @click="goChangePwd" />
      <wd-cell title="绑定手机" is-link @click="goBindPhone" />
    </wd-cell-group>

    <!-- 底部固定操作栏 -->
    <view class="footer-bar" :style="{ paddingBottom: `calc(24rpx + env(safe-area-inset-bottom))` }">
      <wd-button plain block @click="logout">退出登录</wd-button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { fetchUser, type User } from '@/api/users';

const data = ref<User | null>(null);
const id = ref<number | null>(null);

onLoad((opts: any) => {
  id.value = Number(opts.id);
});

onMounted(async () => {
  if (id.value) {
    try {
      data.value = await fetchUser(id.value);
    } catch (e: any) {
      uni.showToast({ title: e?.message || '加载失败', icon: 'none' });
    }
  }
});

const goChangePwd = () => uni.navigateTo({ url: '/pages/change-pwd/change-pwd' });
const goBindPhone = () => uni.navigateTo({ url: '/pages/bind-phone/bind-phone' });
const logout = () => {
  uni.removeStorageSync('token');
  uni.reLaunch({ url: '/pages/login/login' });
};
</script>

<style lang="scss" scoped>
.detail-page {
  min-height: 100vh;
  background: #f7f8fa;
  padding-bottom: 200rpx; /* 给底部固定按钮留空间 */
}
.hero {
  padding: 64rpx 32rpx 48rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  background: #fff;
}
.name {
  font-size: 36rpx;
  font-weight: 600;
  margin-top: 24rpx;
}
.desc {
  font-size: 26rpx;
  color: #9ca3af;
  margin-top: 8rpx;
}
.footer-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 24rpx 32rpx;
  background: rgba(255, 255, 255, 0.95);
  border-top: 1rpx solid #e5e7eb;
  backdrop-filter: blur(12px);
}
</style>
```

**关键点**：
- 头部用背景色区分（白底）+ 头像 + 主次文字
- 信息分组用 `wd-cell-group title` 作为分组标题
- 可跳转的项加 `is-link` 属性，自动右箭头
- 底部固定按钮注意 `safe-area-inset-bottom` 避免被 Home Indicator 盖
- 页面主容器加 `padding-bottom` 防底部按钮盖住最后一项

---

## 4. 表单校验模式

```vue
<wd-form ref="formRef" :model="form" :rules="rules">
  <wd-cell-group border>
    <wd-cell title="手机号" prop="phone" required>
      <wd-input v-model="form.phone" placeholder="请输入手机号" />
    </wd-cell>
    <wd-cell title="验证码" prop="code" required>
      <wd-input v-model="form.code" placeholder="请输入 6 位验证码" maxlength="6" />
    </wd-cell>
  </wd-cell-group>
  <view style="margin-top: 48rpx;">
    <wd-button type="primary" block size="large" @click="submit">提交</wd-button>
  </view>
</wd-form>

<script setup lang="ts">
const formRef = ref();
const form = reactive({ phone: '', code: '' });
const rules = {
  phone: [
    { required: true, message: '请输入手机号' },
    {
      validator: (_: any, value: string) => /^1[3-9]\d{9}$/.test(value),
      message: '手机号格式错误',
    },
  ],
  code: [
    { required: true, message: '请输入验证码' },
    { min: 6, max: 6, message: '验证码是 6 位数字' },
  ],
};

const submit = async () => {
  try {
    await formRef.value.validate();
  } catch { return; }
  // ... 业务调用
};
</script>
```

**关键点**：
- `wd-form :rules` 自动红字提示；`wd-cell prop="xxx" required` 关联规则
- 自定义 `validator: (rule, value) => boolean` 兜复杂规则（正则 / 跨字段依赖）
- 提交前调 `formRef.value.validate()` 统一校验

---

## 5. 常见踩坑

| 症状 | 根因 | 正确姿势 |
|---|---|---|
| 登录页长得像 Web 后台 | 套了 box-shadow 的卡片 | 去掉卡片，直接用 `wd-cell-group` |
| 列表滚到底部无反应 | 忘了 `onReachBottom` 钩子 | 在页面里 import `@dcloudio/uni-app` 的 `onReachBottom` |
| 下拉刷新转圈不停 | 忘了 `uni.stopPullDownRefresh()` | 请求完成（finally）里调 stop |
| 底部按钮被 Home Indicator 盖 | 没做 safe-area | `padding-bottom: env(safe-area-inset-bottom)` |
| 点击按钮无反馈 | 写成 `@tap` 且无 `hover-class` | Wot 按钮自带按下态，用 `<wd-button>` 不要自己写 `<view>` 做按钮 |
| 页面没出现在路由里 | 忘了更新 `pages.json` | **每增一个页面就同步 `pages.json`**，这是移动端 #1 失败原因 |
