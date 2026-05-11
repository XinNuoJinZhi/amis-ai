---
name: stack-react
description: React 18 + Vite 技术栈的反向代码生成规则（Amis JSON → React TSX）
kind: stack
platforms: [web]
tech_stacks: [react]
requires: [_common, platform-web]
conflicts: [stack-vue2, stack-vue3]
priority: 50
---

# Skill: stack-react

把 Amis JSON 翻译成 **React 18 + TypeScript + Vite** 项目代码的技术栈规则。
UI 组件库由另外的 `ui.*` skill 决定（常见配对：`ui-antd` / `ui-arco`）。

## 底座关键文件

从零搭建时你需要创建的最小骨架（有模板时跳过这步）：

```
src/
  main.tsx             # ReactDOM.createRoot(root).render(<App />)
  App.tsx              # 顶层路由
  router/index.ts      # react-router-dom v6
  pages/               # 业务页面（懒加载）
  components/          # 复用组件
  api/
    client.ts          # axios 实例 + 拦截器
    <domain>.ts        # 按业务模块分组的请求函数
  hooks/               # 自定义 hooks
  utils/               # 通用工具
  styles/global.css
index.html             # 挂载点 <div id="root" />
vite.config.ts
tsconfig.json
package.json           # dev/build/preview scripts
```

## 依赖基线（参考）

```json
{
  "dependencies": {
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "react-router-dom": "^6.24.0",
    "axios": "^1.7.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.0",
    "typescript": "^5.5.0",
    "vite": "^5.4.0"
  }
}
```

## Amis → React 映射套路

- **page** → 路由组件，用 `<Outlet />` 或组合子组件
- **form** → 受控表单，状态用 `useState` 或 `react-hook-form`
- **crud** → 表格 + 查询表单 + 分页 + 新增/编辑抽屉的组合页
- **service** → 用 `useEffect` + 自定义 hook（`useRequest` / SWR / TanStack Query）

Amis 里的 `${field}` 表达式翻译成 React state 取值；`api: "GET:/foo"` 翻译成 `client.get('/foo')` + `useEffect` 或 `useQuery`。

## 强约束

- 函数组件 only，不允许 class component（除非兼容旧 API）
- 所有 hooks 调用必须在组件顶层，不允许在条件/循环里
- TypeScript 严格模式，尽量不 `any`（允许 `unknown` + 类型守卫）
- 副作用用 `useEffect` / `useCallback` / `useMemo`，不要直接在 render 里改 DOM

## 工作流程

1. 读工作目录（是否有模板）
2. 有模板：`read_file package.json + vite.config.ts + src/main.tsx` 熟悉结构
3. 无模板：按"底座关键文件"章节创建骨架，再 `pnpm install`
4. 按 Amis JSON 创建 `src/pages/<name>/index.tsx` 页面
5. 新页面必须在 `src/router/index.ts` 注册路由
6. API 调用统一封装到 `src/api/<domain>.ts`，不在组件里直接 axios
7. `dev_start` 验证，失败看 vite 日志定位
