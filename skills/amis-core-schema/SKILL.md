---
name: amis-core-schema
description: baidu/amis 6.x 全组件属性 schema 速查（自动生成自源码 .ts 接口）
type: knowledge
---

# Amis 核心组件 Schema 速查

本桶为 baidu/amis 6.x 各组件属性的结构化速查表，由 `amis_types_extractor` 自动从 amis 源码 .ts 接口抽出，**勿手工编辑** `references/*.md`（会被下次 importer 跑覆盖）。

## 用途

- 给 Agent 生成 amis JSON 时校验属性名、类型、必选标记
- 防止瞎编不存在的字段（类型轨硬约束）

## 何时被检索

system_prompt 不直接注入本桶（避免预算爆），由 `Skill` 工具按需检索 `references/<component>.md`：

- 用户提到具体组件名（form / crud / select / ...）→ 检索对应 references
- 用户描述高频场景（"建一个登录表单"）→ 由 amis-core 桶里 RAG 召回示例 + 本桶 schema 双查

## 数据来源

- 源码：[baidu/amis](https://github.com/baidu/amis) 6.x 最新稳定 release（commit pin 见 `agent/src/knowledge/amis_dump/amis-schema.json` 顶层 `amis_version` 字段）
- 解析器：`agent/src/knowledge/amis_types_extractor/extractor.ts`

## 协议

每份 `references/<component>.md` 格式：

```markdown
---
component: form
amis_version: 6.10.0
---

# form

| 属性 | 类型 | 必选 | 说明 |
|---|---|---|---|
| `type` | `"form"` | 是 | 控件类型固定为 form |
| ... | ... | ... | ... |
```
