# UniApp + Wot UI H5 脚手架约束

工作目录已预置一份可跑的种子项目。**严禁重新创建 package.json / vite.config.ts / tsconfig.json / App.vue** 等根级文件——它们已经就位且版本被锁定（UniApp 3.0.0-alpha-5000720260416001 + Vue 3.4 + Wot UI ^1.6.0）。

## 核心目录

```
├── package.json            # 已锁定，不要改
├── vite.config.ts          # 已注册 @dcloudio/vite-plugin-uni，不要改
├── tsconfig.json           # strict + @dcloudio/types
├── .npmrc                  # @dcloudio 包走 npmmirror，关键配置不要删
├── src/
│   ├── App.vue             # 根组件
│   ├── main.ts             # 入口，注册 Wot UI
│   ├── pages.json          # 路由 + easycom 配置（需要改）
│   └── pages/              # 你要创建的页面都放这里
│       └── {name}/
│           └── {name}.vue
```

## 只能改动的范围

| 文件/目录 | 允许操作 |
|----------|---------|
| `src/pages.json` | 改（注册新页面、调整 tabBar） |
| `src/pages/**` | 自由创建/修改/删除 |
| `src/components/**` | 自由创建复用组件 |
| `src/api/**` | 自由创建请求封装 |
| `src/utils/**` | 自由创建工具函数 |
| `src/store/**` | 需要 Pinia/状态管理时创建 |

## 严禁操作

- 不要 `pnpm add` 任何新依赖（已有 Wot UI、axios、vue 生态即可覆盖 95% 场景）
- 不要新建 `src/main.ts`（已存在且引入了 Wot UI 样式）
- 不要改 `package.json` 的 scripts（dev:h5 / build:h5 已定）
- 不要修改 UniApp 全家桶版本号
- 不要删 `.npmrc`

## 验证清单

完工后必须执行：
```bash
ls src/pages.json src/main.ts vite.config.ts package.json   # 确保没被删
grep -q "wot-design-uni" package.json                        # Wot 依赖还在
```
