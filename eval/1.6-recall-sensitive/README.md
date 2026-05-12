# 1.6 W2 · B 项 — 召回敏感评测集

> **日期**：2026-05-13 起
> **设计文档**：[../../docs/plans/2026-05-13-roadmap-1.6.md](../../docs/plans/2026-05-13-roadmap-1.6.md) §二 B
> **目的**：让 1.4 B.1 / 1.5 W4 修的双路召回（向量 + amis JSON 关键字）真实价值显化

---

## 为什么再做一次评测集

1.5 W1.3 跑过的 [eval/1.5-rag-stress/](../1.5-rag-stress/) 压力集**两组都 100% 通过**（B 组 33 hits / A 组 0 hits 仅在 keyword_hits 指标显化，下游 LLM 没把"不同样本组合"翻译成"不同生成结果"）。原因是评测里用的 prompts 即使没召回到关键样本，下游模型也能"凑出能跑的代码"，区分度太弱。

1.6 W2 重新设计**召回敏感样本**：
- amis_json 里大量含 **ZC 二开特征组件**（`modeltable` / `report-forms` / `flowCreate` / `dynamic-form` / `user-select` / `department-select` / `tree-select`）
- extra_prompt 用**平淡通用业务描述**，不出现 ZC / 模板 / 工作流引擎 等字眼
- 期望：
  - **B 组**（dual_route=true）：靠 amis JSON 关键字 hit `zc-web-1.3` 入库的 ZC 样本（`zc_p1 / zc_p2 / zc_p4 / zc_p5`）→ LLM 生成 ZC 模板兼容代码
  - **A 组**（dual_route=false）：纯向量召回被中性业务描述拉去普通 react-antd-vite 样本 → LLM 生成普通 antd Table，运行时 `modeltable` / `report-forms` / `flowCreate` 等 ZC 控件没法渲染（缺 schema 处理）

如果设计有效，**B 组页通过率应 ≥ A 组 + 10pp**。

---

## 数据集

- 8 prompts × 3 pages = 24 pages
- 全部 prompts 走 `react-antd-vite` 技术栈（与样本库 `zc-editor-web` 的差异维度仅在 ZC 二开组件 vs 原生 antd）
- 覆盖场景：员工目录 / BI 看板 / OA 流程 / 工单 / CRM / 组织权限 / 资产管理 / 项目协作

| ID | 标题 | 关键 ZC 特征 |
|---|---|---|
| rs1 | 员工目录 | modeltable + department-select + user-select |
| rs2 | 销售看板 | report-forms + chart |
| rs3 | OA 请假 | flowCreate + user-select 抄送 |
| rs4 | 客户工单 | dynamic-form schemaApi + flowCreate |
| rs5 | CRM 档案 | modeltable + modelform + 双 select |
| rs6 | 组织权限 | tree + department-select 嵌套 + transfer |
| rs7 | 资产报修 | tree-select + dynamic-form + flowCreate |
| rs8 | 项目协作 | user-select 多选 + cards 看板 |

---

## 跑法（A/B 对照）

前置：amis-ai 已起、`zc-web-1.3` 样本已入库（首次启动 admin 跑过 zc-web-1.3 评测即可）。

### A 组（纯向量召回）

```bash
# 1. admin 关掉 dual_route 总闸
curl -X PUT http://localhost:8080/api/admin/system-settings/rag.dual_route.enabled \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"value":"false"}'

# 2. 跑评测
python3 eval/multipage-1.2/runner.py \
  --prompts-file eval/1.6-recall-sensitive/prompts.json \
  --strategies r4_baseline \
  --tech-stack react-antd-vite \
  --output-csv eval/1.6-recall-sensitive/run-a-vector-only.csv \
  --max-wait-sec 1200
```

### B 组（双路召回）

```bash
# 1. admin 开 dual_route
curl -X PUT http://localhost:8080/api/admin/system-settings/rag.dual_route.enabled \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"value":"true"}'

# 2. 跑评测
python3 eval/multipage-1.2/runner.py \
  --prompts-file eval/1.6-recall-sensitive/prompts.json \
  --strategies r4_baseline \
  --tech-stack react-antd-vite \
  --output-csv eval/1.6-recall-sensitive/run-b-dual-route.csv \
  --max-wait-sec 1200
```

### 对比

```bash
# 用 Python 算 PASS 率 + keyword_hits 均值
python3 eval/multipage-1.2/compare.py \
  --csv-a eval/1.6-recall-sensitive/run-a-vector-only.csv \
  --csv-b eval/1.6-recall-sensitive/run-b-dual-route.csv
```

---

## 期望结果

| 指标 | A 组（纯向量） | B 组（双路） | 期望差 |
|---|---|---|---|
| 页通过率 | < 70% | > 80% | **≥ 10pp** |
| keyword_hits 均值 | 0 | > 2/page | — |
| 失败 case 中 cos_sim>0.5 + kw=0 占比 | > 50% | < 20% | — |

如果差 < 10pp，说明：
1. prompts 设计不够刁钻（amis 没足够拉开关键字差） → 加 ZC 特征密度
2. 或 LLM 太聪明，根本不需要 ZC 样本就能凑出 ZC 兼容代码 → 调 generation 模型 / 降 temperature

---

## baseline 记录格式

跑完后在本目录建 `baseline-YYYYMMDD.md`，记录：

```markdown
# 2026-05-XX baseline

## A 组（纯向量）
- runner cmd: ...
- 总 pages: 24
- PASS: X
- keyword_hits 均值: 0

## B 组（双路）
- runner cmd: ...
- 总 pages: 24
- PASS: Y
- keyword_hits 均值: Z

## diff
- 通过率差: Y/24 - X/24 = Δpp
- 期望 ≥ 10pp: ✅ / ❌
```

未达预期时，附上 1-2 个失败 case 的 cos_sim Top-3 召回 ID 和 keyword Top-3 召回 ID，看是 prompt 设计问题还是召回 + LLM 链路问题。
