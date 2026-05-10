---
name: zc-amis-schema
description: ZC Amis 6.8.0-my242v2 二开组件 schema 速查（121 个 references 覆盖：36 个 ZC 全新组件 + 85 个 ZC 改造的原版组件 patch）
type: knowledge
---

# ZC Amis 二开组件 Schema 速查

本桶为 **ZC 智搭低代码平台**（基于 baidu/amis 6.8.0 二开）的组件 schema 速查表。
内容自动抽取自 ZC fork 源码 (`packages/amis-editor/src/plugin/*.tsx` + `packages/amis/src/renderers/*.tsx`)，**勿手工编辑** `references/*.md`（会被下次 importer 覆盖）。

## 用途

- 给 Agent 生成 ZC 风格 amis JSON 时，校验 ZC 特有组件 type / props
- 防止 LLM 在 ZC 任务中误用原版 amis 组件名（如 ZC 用 `department-select` 而非 amis 通用 `select`）
- 跟原版 [`amis-core-schema/`](../amis-core-schema/) 桶**同时被检索**：原版 component → 看 amis-core-schema，ZC 二开 component → 看本桶

## 何时被检索

system_prompt 不直接注入本桶（避免预算爆），由 `Skill` 工具按需检索 `references/<component>.md`：

- 用户任务 `template_name=zc-editor-web-template` → 本桶 priority 升高
- 用户提到 ZC 业务关键词（部门 / 用户 / 模型 / 报表 / 工作流） → 检索对应 ZC 组件 schema
- LLM 在 amis JSON 里输出 ZC 特有 type（如 `modelform`/`department-select`） → RAG 召回本桶对应文件

## 数据来源

- 源码：`~/Working/TianXing/amis-codegen/.claude/skills/zc_amis/assets/packages/` 的 ZC fork
- 基线：[baidu/amis](https://github.com/baidu/amis) 6.8.0（用 `git clone -b 6.8.0` 拉来跑 diff）
- 解析器：`agent/src/knowledge/zc_amis_extractor/`（待写，沿用 1.1 `amis_types_extractor` 风格）
- 二开点报告：[../../docs/zc-amis-diff-report.md](../../docs/zc-amis-diff-report.md)

## 协议

每份 `references/<component>.md` 格式：

```markdown
---
component: <rendererName>
source: zc-amis-6.8.0-my242v2
category: <new|patched>
zc_suite: <oa|model|reportforms|apicenter|action-panel|ai|other>
---

# <中文名>（type: `<rendererName>`）

> ZC 描述

## 属性

| 属性 | 类型 | 必选 | 默认值 | 说明 |
|---|---|---|---|---|
| `type` | `"<rendererName>"` | 是 | — | — |
| ... | ... | ... | ... | ... |

## 默认 scaffold（建议起手用法）

```json
{ ...从 plugin.scaffold 抽出来 }
```

## 事件（如有）

| eventName | eventLabel | 触发条件 |
|---|---|---|
| change | 值变化 | ... |

## 跟原版 amis 差异（仅 category=patched 时填）

- 修改点 1
- 修改点 2
```

## ZC 二开规模总览

- 全新组件（category=new）：**36 个**
  - 9 个 ZC plugin（OA + 数据建模 + 工作流）
  - 11 个 ZC renderer 控件（编辑器配置面板）
  - 16 个 ZC 主包 renderer（运行时新组件 + 图表系列）
- 改造的原版组件（category=patched）：**85 个**
  - 28 个 plugin patch
  - 19 个 renderer patch
  - 38 个主包 renderer patch
- ReportForms 子系统：作为 1 个套件描述（不展开 125 文件）
- actionsPanelPlugins 34 文件：编辑器内部行为，不灌 LLM 知识

## 关联桶

- [`amis-core-schema/`](../amis-core-schema/) — 原版 amis 6.x schema 速查（本桶仅描述 ZC 增量 / 差异，原版组件用法看那个桶）
- [`platform-zc-web/`](../platform-zc-web/) — ZC Web 平台业务规则（apicenter 协议 / 组件命名约定等）
