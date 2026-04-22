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
- 不要新建或修改 `src/main.ts`（入口已就绪，Wot UI 样式由 easycom + vite-plugin-uni 自动注入）
- 不要修改 `src/App.vue`（除非用户明确要求改全局样式）
- 不要改 `package.json` 的 scripts（dev:h5 / build:h5 已定）
- 不要修改 UniApp 全家桶版本号
- 不要删 `.npmrc`

## 🚫 绝对禁止（违者 Vite 启动后浏览器必报错）

- **严禁 `import "wot-design-uni/index.css"` 或任何第三方库的 CSS 文件**
  - Wot UI 的样式通过 `easycom` + `@dcloudio/vite-plugin-uni` 在运行时自动注入，你**不需要**手动 import
  - 真实不存在的路径会被 Vite 的 `vite:import-analysis` 插件直接拦截，浏览器打开即报红色错误遮罩
- **严禁手动 import 任何 `*.css` / `*.scss` 文件到 main.ts / App.vue**
- 如果页面需要局部样式，请写在 `.vue` 文件的 `<style scoped>` 块内
- 如果需要全局主题色覆盖，请告知用户由人工在 `uni.scss` 中配置（这是项目级约束，不是 Agent 职责）

## 验证清单

完工后必须执行：
```bash
ls src/pages.json src/main.ts vite.config.ts package.json   # 确保没被删
grep -q "wot-design-uni" package.json                        # Wot 依赖还在
```

## 🚀 如何启动 dev server（重要）

**完成代码编写后，必须调用 `dev_start` 工具启动 Vite**，**绝对不要**用 bash 自己跑 `pnpm run dev:h5`！原因：

- `dev_start` 工具会让沙箱 supervisor 接管 Vite 进程，自动监听 ready/failed
- bash 是同步阻塞的，`pnpm dev:h5` 永不退出会导致 bash 工具 hang 住
- 即使用 `nohup ... &` 后台化，沙箱也无法感知 Vite 是否启动成功

**正确用法**（工具调用，不是 bash）：
```
tool_call: dev_start
arguments: {}
```

调用后 dev_start 立即返回 `{"status":"starting"}`——**你的任务就完成了**，不要循环查 dev-status，不要重复调用。沙箱会在后台监控 Vite 的 ready 信号并向前端上报。

## ⚠️ pnpm install 何时需要

种子项目的 `node_modules/` 通常已经安装好了。只有在你新增了依赖（改了 package.json）时才需要：
```bash
bash: cd /workspace && pnpm install
```
但 MVP 下你不应该加新依赖，现有 Wot UI + axios + vue 应已覆盖。
