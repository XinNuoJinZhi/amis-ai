# `pages.json` 配置规则

`pages.json` 是 UniApp 的路由+导航配置文件，**每次新建页面都必须在此注册**，否则 `uni.navigateTo` 找不到路由。

## 基础结构

```json
{
  "easycom": {
    "autoscan": true,
    "custom": {
      "^wd-(.*)": "wot-design-uni/components/wd-$1/wd-$1.vue"
    }
  },
  "pages": [
    { "path": "pages/index/index", "style": { "navigationBarTitleText": "首页" } }
  ],
  "globalStyle": { "navigationBarBackgroundColor": "#ffffff" }
}
```

`easycom` 段（种子项目已配置）让 `<wd-button>` 这类组件不用手动 import，直接在模板里用即可——**不要删掉这段**。

## 新增页面的两步流程

### 步骤 1：创建页面文件
```
src/pages/user-list/user-list.vue
```
路径约定：`src/pages/{kebab-case-name}/{kebab-case-name}.vue`（文件名和目录名一致）。

### 步骤 2：注册到 `pages.json`
```json
{
  "path": "pages/user-list/user-list",
  "style": {
    "navigationBarTitleText": "用户列表"
  }
}
```
**注意**：`path` 不带 `src/`、不带 `.vue` 后缀。

## tabBar（底部标签栏）

首页类应用常需要底部标签栏：
```json
{
  "pages": [...],
  "tabBar": {
    "color": "#7A7E83",
    "selectedColor": "#3cc51f",
    "list": [
      { "pagePath": "pages/index/index", "text": "首页", "iconPath": "/static/icon/home.png", "selectedIconPath": "/static/icon/home-a.png" },
      { "pagePath": "pages/user/user", "text": "我的", "iconPath": "/static/icon/me.png", "selectedIconPath": "/static/icon/me-a.png" }
    ]
  }
}
```
**tabBar 的页面必须在 `pages` 数组的前几项**（UniApp 规定）。

## 页面跳转

```ts
uni.navigateTo({ url: '/pages/user-list/user-list?id=123' })    // push
uni.redirectTo({ url: '/pages/login/login' })                    // 替换
uni.switchTab({ url: '/pages/index/index' })                     // 切换 tab
uni.navigateBack()                                                // 返回
```
路径必须以 `/` 开头，参数用 query string。

## 页面接收参数

```vue
<script setup lang="ts">
import { onLoad } from '@dcloudio/uni-app'

const id = ref<string>('')
onLoad((options) => {
  id.value = options?.id || ''
})
</script>
```

## 常见错误

- **忘记注册**：页面创建了但 `pages.json` 没加 → 跳转 404
- **路径带后缀**：写成 `pages/user-list/user-list.vue` → 路由找不到
- **删了 easycom**：`<wd-button>` 模板报"未找到组件"
- **tabBar 页面顺序错**：H5 能跑但小程序构建失败（虽然 MVP 只做 H5，但要守规矩）
