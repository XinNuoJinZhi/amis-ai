---
name: _common
description: amis-ai 反向飞轮的"产品哲学"与跨技术栈通用规范，所有任务必读必守
---

# Skill: _common（必读）

本 skill 不绑定任何具体技术栈（不是 uniapp-wot-h5、不是 react-element 等），它装的是 **amis-ai 反向飞轮的"产品哲学"和跨栈通用规范**。无论当前任务是哪个 tech_stack，本 skill 的内容**都被永久注入到 system_prompt**，且**违反即判失败**。

## 永远遵守的 4 条铁律

1. **理解 Amis 是前提**：你拿到的输入是一份 Amis JSON。Amis 是声明式 UI 配置，不是任意 JSON。生成代码前必须先理解它的渲染语义（详见 `references/amis-core-concepts.md`）
2. **不动底座**：脚手架已经预置了 main.ts、App.vue、构建配置、主题注入等"底座"。**只允许在 `src/pages/`、`src/api/`、`src/components/` 等业务目录里增量编辑**（详见 `references/reverse-flywheel-philosophy.md`）
3. **Skills 优先于自由发挥**：当前栈的 SKILL.md 和 references 已经把"该怎么写"讲清楚了。**先读、再写**。凭通用 Vue/React 知识硬怼，多半会被采纳环节打回
4. **错误就是反馈，不是终点**：dev 启动失败、控制台报错、用户从 IDE 塞日志进对话——这些都是诊断证据，**先修代码再说话**，不要请用户"再试一次"

## 工作流程（任何任务的开局都该走一遍）

### 第 1 步：理解输入
- 读懂传入的 Amis JSON 顶层 schema（page / form / crud / service / wizard）
- 必要时 `Skill({skill: "_common"})` 重读本 SKILL.md，再 `Read` 拉 `references/amis-core-concepts.md` 复习核心概念

### 第 2 步：选好"该用哪个 stack 的 skill"
- 默认按任务的 `tech_stack` 字段加载对应 skill（已自动加载，无需手动）
- 如果任务声明了 ZC Amis 等扩展栈，**主动 `Skill({skill: "zc_amis"})` 拉它的 SKILL.md** 读懂二开规则

### 第 3 步：按当前栈的 SKILL.md 工作流推进
- 跟着栈 SKILL.md 里的"工作流程"一步步做（拷脚手架 → 翻译顶层 → 单组件映射 → API 适配 → 路由注册）
- 错误处理统一遵循 `references/error-handling.md`
- 国际化与日志输出遵循 `references/i18n-logging.md`

### 第 4 步：自检后再交付
- pages.json 同步了吗？
- API 模块化封装了吗？
- 控制台有 error / warning 吗？
- 沙箱 dev-status 是 running 吗？

## 可用的 references（按需 `Read` 拉）

- `references/amis-core-concepts.md`：Amis 渲染原理、组件树、数据域、表达式、API 数据流
- `references/reverse-flywheel-philosophy.md`：为什么不动底座、Skills 优先、采纳即沉淀的设计哲学
- `references/error-handling.md`：网络/校验/业务异常的统一处理范式
- `references/i18n-logging.md`：国际化 token 与日志输出规范

## 与各 stack skill 的关系

`_common` 定义"是什么、为什么"，stack skill（如 `uniapp-wot-h5`）定义"在这个栈下怎么写"。两者**从不冲突**：
- 出现"哲学约束 vs 技术约束"二选一时 → **优先哲学约束**（_common 赢）
- 出现"_common 没明说 vs stack 明确规定"时 → **跟 stack 走**
