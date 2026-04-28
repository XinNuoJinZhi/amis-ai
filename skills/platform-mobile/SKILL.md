---
name: platform-mobile
description: 移动端目标平台通用规则 —— 小程序/H5/原生 App 共用的约束
kind: platform
platforms: [mobile]
priority: 20
---

# Skill: platform-mobile

当前任务目标平台是**移动端**（uni-app 小程序/H5、React Native 原生 App 等）。本 skill 定义与具体 tech_stack 无关的移动端通用约束。

与 `platform-web` 互斥：移动端路由、生命周期、容器 API 与 Web SPA 差异较大。

## 路由与生命周期

- uni-app：所有页面必须在 `src/pages.json` 的 `pages` 数组显式注册，**漏写是 #1 高频失败原因**
- React Native：用 `@react-navigation/native` 栈式路由
- 页面生命周期钩子与 Web 不同（uni-app 有 `onShow`/`onLoad`，RN 有 `useFocusEffect`）

## 尺寸与单位

- uni-app 推荐 `rpx`（750 等分）；注意 Wot UI 也全用 `rpx`
- RN 用 `StyleSheet` + 数值（dp）
- 避免硬编码 `px`，特别是在 uni-app 项目里

## 网络与权限

- 部分 API 平台差异大：
  - uni-app：`uni.request` / `uni.chooseImage` 等
  - RN：`fetch` / 原生权限桥（相机、定位）
- 网络请求要处理**弱网/离线**场景（loading 超时、重试、缓存）

## 性能要点

- 列表使用虚拟滚动（uni-app 有 `recycle-view`、RN 有 `FlatList`）
- 图片走 CDN 并加缩略图参数
- 避免在主线程做重计算（RN 可用 Hermes JIT）

## 交互与视觉

- 点击反馈（按下态、loading）是必备，不能只有静态按钮
- 顶部/底部 safe-area（刘海屏、home indicator）要做
- 键盘遮挡输入框时要主动滚动或调整布局

## 移动端设计 DO / DON'T（**最易踩的坑**）

移动端 ≠ Web 页面缩小版。生成代码时**不要**把 PC 后台的审美直接搬过来。下面清单每条都是飞轮沉淀的反面案例：

### ✅ DO

- **全屏铺满 viewport**：背景色直接作用于 `page / view` 根元素，内容按**单列竖排**堆叠
- **🔥 表单字段「标签在上、输入在下」单列堆叠**：用 `<view class="form-field"><text class="form-label">标签</text><wd-input/></view>` 自定义包装，**这是现代移动端表单标准形态**
- **主按钮贴底或紧随表单**：用 `<wd-button block size="large" type="primary">`（不靠 inline `style="width:100%"` 凑合）
- **空状态 / 加载态 / 错误态**三件套齐全：空列表要 `wd-status-tip`，首屏请求要 `wd-loading`，错误要 Toast
- **🔥 严格按 Amis schema 翻译**：JSON 有什么字段写什么字段，没声明的功能（"记住我"、"忘记密码"、"注册"链接、第三方登录、品牌 logo）**禁止凭空加**——`_common/SKILL.md` 第 0 条铁律「翻译器宪法」管这个

### ❌ DON'T

- **不要嵌套"阴影 + 圆角卡片"容器**：这是 Web 后台 / 桌面应用的审美
- **不要把表单字段做成左右布局**：包括 `<wd-cell title="X"><wd-input/></wd-cell>`（标题在左、输入在右）—— wd-cell 是**列表行**组件，是 iOS 系统设置那种范式，不是现代登录/注册表单的范式。**Amis form 类型一律用 form-field 自定义包装**
- **不要给登录页 / 首页加"返回箭头"**：入口页没有"上一级"可返回；只有**从其他页跳进来的子页**才加 `wd-navbar` 的左箭头
- **不要 Web 风 footer**：什么 "© 2024 xxx" 在移动端底部基本无意义
- **不要凭空加"记住我"等次级元素**：Amis JSON 没声明就别加（翻译纪律）；如果 schema 真有，紧贴表单最后一行
- **不要硬编码 px 尺寸**：一律 `rpx`（或 `%`），否则小屏 / 大屏上比例会崩
- **不要"美化"超出 schema 的元素**：渐变背景、装饰图标、动画过渡——Amis schema 没要求就别做

### 登录页 / 列表页 / 详情页的标准写法

下面三段是**生成同类页面前必抄结构**的最小骨架。**不要凭通用 Vue 知识自由发挥**——LLM 内部"登录页"知识多半偏 Web 后台审美，照搬大概率被判负。
具体 Wot UI 完整版（含校验、loading、品牌区、文字链接）见 `ui-wot/SKILL.md` 的「典型页面骨架」段（Skills 加载时主体已注入 system prompt，无需 Read references）。

#### 登录页骨架（最简，「标签在上」现代移动端形态）

⚠️ 完整骨架（含品牌区、API 调用、redirect 处理）见 `ui-wot/SKILL.md` 「典型页面骨架」段。这里只示范**字段排版**——**不要再用 `<wd-cell title slot>` 做表单字段**。

```vue
<template>
  <view class="page">
    <wd-form ref="formRef" :model="form" :rules="rules">
      <!-- 每个 Amis fields[i] 对应一个 form-field：标签在上、输入在下 -->
      <view class="form-field">
        <text class="form-label">用户名</text>
        <wd-input v-model="form.username" placeholder="请输入用户名" clearable />
      </view>
      <view class="form-field">
        <text class="form-label">密码</text>
        <wd-input v-model="form.password" type="password" placeholder="请输入密码" show-password />
      </view>
      <view class="actions">
        <wd-button type="primary" size="large" block :loading="loading" @click="submit">登 录</wd-button>
      </view>
    </wd-form>
  </view>
</template>

<style lang="scss" scoped>
.page { min-height: 100vh; background: #ffffff; padding: 48rpx 32rpx; }
.form-field { margin-bottom: 32rpx; display: flex; flex-direction: column; }
.form-label { font-size: 28rpx; color: #333; margin-bottom: 16rpx; padding: 0 4rpx; }
.actions { margin-top: 48rpx; }
</style>
```

**自检表**：
- [x] 表单字段「标签在上、输入在下」单列堆叠（`form-field` 包装）
- [x] **绝不**用 `<wd-cell title="X"><wd-input/></wd-cell>` 做表单字段（那是列表/详情场景）
- [x] 主按钮 `type="primary" size="large" block`，**禁止** inline `style="width:100%"`
- [x] `wd-form :rules` 校验
- [x] 不写 `wd-navbar` 返回箭头
- [x] **Amis schema 没声明的功能（记住我 / 忘记密码 / 注册 / 第三方登录 / 品牌 logo）一律不生成**

#### 列表页骨架（最简）

```vue
<template>
  <view class="page">
    <wd-cell-group v-if="list.length" border>
      <wd-cell v-for="i in list" :key="i.id" :title="i.name" :label="i.desc" is-link @click="goDetail(i.id)" />
    </wd-cell-group>
    <wd-status-tip v-else image="content" tip="还没有数据" />
    <wd-loadmore v-if="list.length" :state="loadMoreState" />
  </view>
</template>
```

- 配套 `pages.json` 该页加 `"enablePullDownRefresh": true`
- script 里 `import { onPullDownRefresh, onReachBottom } from '@dcloudio/uni-app'`，刷新完 `uni.stopPullDownRefresh()`

#### 详情页骨架（最简）

```vue
<template>
  <view class="page">
    <view class="hero"><wd-img :src="data.avatar" round /><text class="name">{{ data.name }}</text></view>
    <wd-cell-group title="基本信息" border>
      <wd-cell title="手机" :value="data.phone" />
      <wd-cell title="邮箱" :value="data.email" />
    </wd-cell-group>
    <view class="footer-bar"><wd-button plain block @click="logout">退出</wd-button></view>
  </view>
</template>

<style lang="scss" scoped>
.page { min-height: 100vh; background: #f7f8fa; padding-bottom: 200rpx; }
.footer-bar {
  position: fixed; left: 0; right: 0; bottom: 0;
  padding: 24rpx 32rpx calc(24rpx + env(safe-area-inset-bottom));
  background: rgba(255,255,255,.95); border-top: 1rpx solid #e5e7eb;
}
</style>
```

- 底部固定按钮**必须**带 `safe-area-inset-bottom`，否则被 Home Indicator 盖
- 主容器 `padding-bottom` 防底部按钮盖最后一行

## 与其他 skill 协作

- uni-app 技术细节 → `stack-uniapp` + `ui-wot` / `ui-uview`
- React Native 细节 → `stack-rn` + UI 库对应 skill
- 从零搭建流程 → `scaffold-from-scratch`
