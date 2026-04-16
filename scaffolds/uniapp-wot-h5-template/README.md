# amis-ai UniApp + Wot UI H5 脚手架

> 供 amis-ai 反向代码生成流水线使用的最小可跑种子项目。

## 技术栈

| 技术 | 版本 |
|------|------|
| Vue | ^3.4 |
| UniApp | 3.0.0-401092025... |
| Wot Design Uni | ^1.6.0 |
| Vite | ^5.2 |
| TypeScript | ^5.4 (strict) |
| Axios | ^1.7 |

## 快速开始

```bash
# 安装依赖（推荐 pnpm）
pnpm install

# 启动 H5 开发服务器（监听 0.0.0.0:5173）
pnpm run dev:h5

# 生产构建
pnpm run build:h5
```

启动成功后控制台会输出：
```
Local:   http://localhost:5173/
Network: http://0.0.0.0:5173/
```

## 项目结构

```
src/
├── api/
│   └── http.ts          # axios 实例封装（响应拦截、错误处理）
├── pages/
│   └── index/
│       └── index.vue    # 首页（含 wd-button 示例）
├── App.vue              # 根组件
├── main.ts              # UniApp 入口
├── manifest.json        # UniApp manifest（appid 占位）
├── pages.json           # 页面注册 + easycom 配置
└── uni.scss             # Wot 主题变量占位
```

## Wot UI easycom

`pages.json` 中已配置 easycom 自动引入，直接在模板中使用 `<wd-*>` 组件，无需手动 import：

```json
"easycom": {
  "autoscan": true,
  "custom": {
    "^wd-(.*)": "wot-design-uni/components/wd-$1/wd-$1.vue"
  }
}
```

## 环境变量

在项目根目录创建 `.env.local` 文件：

```env
VITE_API_BASE_URL=http://localhost:8080/api
```

## 注意事项

- Node.js >= 20 必须
- 此项目仅针对 H5 端，不包含微信小程序/App 端配置
- `src/manifest.json` 中的 `appid` 为占位值 `__UNI__AAAAAA`，生产环境请替换为真实 appid
