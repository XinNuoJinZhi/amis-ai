---
name: uniapp-wot-h5
description: UniApp + Wot UI（H5 模式）反向代码生成规则手册：把 Amis JSON 翻译成可运行的 Vue 3 + Wot 组件代码
---

# Skill: uniapp-wot-h5

把 amis-ai 平台生成的 Amis JSON 翻译成 **UniApp + Wot UI（H5 模式）** 项目代码的完整规则手册。
本 skill 的内容**不是一次性全部塞进上下文**——下面的"工作流程"会告诉你**什么时候**该用 `Read`/`Skill` 工具拉哪份 reference。

## 适用场景

任务的 `tech_stack = uniapp-wot-h5` 时，本 skill 自动作为当前栈装载。Agent 应优先按本手册行事，**而不是凭通用 Vue 知识自由发挥**。

## 工作流程（请严格按顺序）

### 第 1 步：开局拷脚手架（任何任务都要做）
**先读 →** `references/scaffold.md`
里面规定了：
- 怎么把 `scaffolds/uniapp-wot-h5-template/` 复制到工作目录
- 目录约束（src/pages、src/api、src/components、pages.json、App.vue 等）
- **不能动**的文件清单（main.ts、Wot 主题注入等"底座"内容）

### 第 2 步：理解 Amis → Vue 的顶层结构翻译
**按需读 →** `references/amis-to-vue-mapping.md`
里面写了：
- Amis 顶层 schema（page / form / crud / service）怎么映射到 Vue SFC
- 数据域（data）和表达式 `${...}` 在 Vue 端怎么落地
- 当 Amis JSON 里出现具体类型时，**先查它该走哪种 SFC 模板**

### 第 3 步：单组件级别的映射（生成具体页面时反复查）
**按需读 →** `references/component-mapping.md`
里面是 Amis 组件 → Wot UI 组件的对照表（input-text → wd-input、button → wd-button 等）。
**每生成一个 Vue 组件就该回查一遍**，避免用错组件库（绝对禁止 import van-* / el-* / a-* 等其他组件库）。

### 第 4 步：API 调用适配
**按需读 →** `references/api-adapter.md`
里面规定了：
- axios 实例和拦截器怎么写
- Amis JSON 里的 `api: "GET:/api/foo"` 怎么翻译成 `useApi.get('/foo')`
- 错误处理范式（与 `_common/references/error-handling.md` 配合）

### 第 5 步：路由注册（任何新增页面都要做）
**必读 →** `references/pages-json-rules.md`
里面规定了：
- 新增 `src/pages/{name}/index.vue` 后**必须**同步往 `pages.json` 的 `pages` 数组追加路径
- tabbar 怎么写、style 怎么写
- 漏写 pages.json 是反向飞轮里**最高频的失败原因**之一

### 第 6 步：踩坑手册（dev start 失败时立刻查）
**触发性读 →** `references/common-errors.md`
里面汇总了已知错误（pnpm install 报错、Vite 启动失败、Wot 样式不生效等）和**标准修法**。
当沙箱 dev-status 报 failed 时，**先扫这一份再决定怎么改**。

## 强约束（违反会被判失败）

1. **不允许用其他组件库**——只用 Wot UI（wd-* 前缀）
2. **不允许动 main.ts、App.vue 的 Wot 主题注入**——属于脚手架"底座"
3. **新增页面必须同步 pages.json**
4. **API 调用必须经 `src/api/` 模块化封装**——禁止在组件里直接 `axios.get`

## 资产（assets/）

`assets/` 目录预留给后续可复用代码片段（如典型组件的最小可运行示例）。当前为空，会随飞轮增长填充。

## 与 _common 的关系

`_common` 提供"理解 Amis 是什么"的产品哲学（amis-core-concepts、reverse-flywheel-philosophy 等），本 skill 提供"在 UniApp+Wot 上怎么写"的执行细节。**两者都遵守**。
