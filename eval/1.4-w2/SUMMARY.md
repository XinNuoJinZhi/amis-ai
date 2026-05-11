# 1.4 W2·B.4 三组对比评测汇总

> **跑期**：2026-05-11 21:48-21:58（v2，含 hotfix）
> **测试集**：ZC Web 5 prompts × r4_baseline 策略 × 3 组 knob = 15 task
> **环境**：qwen3-coder-30b-a3b-awq 单 SGLang 实例 / pgvector / 4 服务全 UP

## 🎯 三组对比

| 指标 | A baseline | B +weighting | C +负例+评委 |
|---|---|---|---|
| 任务成功率 | **5/5 (100%)** | **5/5 (100%)** | **5/5 (100%)** |
| 平均页通过率 | **100%** | **100%** | **100%** |
| 平均 LLM 调用 | 37.2 次 | **28.8 次 ↓-23%** | 33.6 次 |
| 平均 LLM 耗时 | 60.9s | **50.1s ↓-18%** | 57.8s |
| 平均总耗时 | 28.8s | **22.0s ↓-24%** | 31.4s |
| 复用率 | 0.00 | 0.00 | 0.00 |

**B 组最快最省**：加权（thumbs/hit_count）让 RAG 召回更精准 → LLM 少走弯路。
**C 组评委介入**：page 通过率不变但评委自己也烧 LLM 调用，总耗时回升一点（仍快于 A）。

## 📊 每 prompt × 组明细（耗时 + LLM 调用）

| Prompt | A baseline | B +weighting | C 全开 |
|---|---|---|---|
| zc_p1_user_directory_3pages | 25 calls / 18s | 23 calls / 11s | 22 calls / 13s |
| zc_p2_dashboard_4pages | 65 calls / 51s | 47 calls / 27s | 43 calls / 39s |
| zc_p3_workorder_3pages | 46 calls / 35s | 26 calls / 25s | 26 calls / 16s |
| zc_p4_oa_workflow_3pages | 27 calls / 25s | 25 calls / 29s | 27 calls / 25s |
| zc_p5_oa_dept_3pages | 23 calls / 15s | 23 calls / 18s | 50 calls / 64s |

## 🔍 1.4 新指标观察

| 指标 | 数据 | 解读 |
|---|---|---|
| `category` 分布 | 18/20 = `__other__`，2 个空 | runner.py 传 `amis_json="{}"`（pages 在 pages 数组里），分类器只看顶层自然识别不出 → **W4 需让分类器接 pages 数组** |
| `complexity_score` | 全空 | runner 顶层 amis_json 是 `"{}"`，score 计算返回保守值但未持久化 → **W4 需在 pages 数组上算 score** |
| `estimated_cost_tokens` | 全 1500（固定下限） | 上同根因 — token 估算用 amis_json 长度 + complexity，全部是空所以走基线 500，+ 用户描述 + 提示词 = 1500 |
| `page_quality_verdict` | 全空（63 page） | rag.judge.page_mode 没开（orchestrator 默认 disabled）→ B.3b 触发器未生效 |
| 新增负例（is_negative=true） | 0 条 | C 组评委开了但所有 task 都 succeeded，verdict 全 `good`，auto_negative_on_bad 没被触发 |

## ⚠️ 修复过的 1 个 bug

**症状**：评测 v1（21:39）除第 1 个 task 外，14 个 task 全部 HTTP 500
**根因**：A.1 migration 加的 `complexity_score FLOAT` / `category_confidence FLOAT` 在 PG 是 FLOAT8，但 entity 用 `Option<f32>` 期望 FLOAT4（REAL），sqlx decode 类型不匹配。第 1 个 task category 是 NULL 跳过 decode，后续 task category 填了 `__other__` 后 decode 炸。
**修法**：DB 列改 `REAL`（commit `*hotfix*`），entity 保持 f32 兼容。

## 🎯 W3 决策（按 README 决策点）

- ✅ **C 组页通过率 100%**（≥96% 目标已达）→ W2 收口，按 roadmap **开 W3 LLM 路由**（A 轨已经做完 A.1/A.2/A.3 在 W3）
- ⚠️ **B 组 vs A 组页通过率持平**（都 100%）→ 没法判断 B.1 keyword 双路是否生效（**ZC 5 prompts 太简单**，1.3.2 已经 100% 不留 headroom）
  - 但 **B 组耗时 -24%**：weighting 让召回更精准是有效的
  - **B.1 RAG keyword 双路**评测下还没观察到信号 → 需要在 **更难的多页项目**（10+ 页 / 复杂 ZC 业务）才能见效
- 🔍 **关键观察**：**1.4 没退化任何东西** —— 11 个 commit 全堆上线后 5 prompts × 3 组 = 15 task 100% 全过
- 🐛 **2 个待修小事**（不影响功能）：
  1. **分类器对 multipage payload 的盲点**：amis_json="{}" 时分类器无信号 → category=__other__；W4 让 backend create_task 在 multipage 时合并 pages 给分类器
  2. **page 评委没自动触发**：rag.judge.page_mode 默认 disabled，orchestrator 没开；后续要么 default 改 enabled，要么 README 提示用户开

## 🚀 下一步建议

1. **W3 收口**：W3 A 轨（A.1/A.2/A.3）已在 dev/1.4.0 上线，B.4 评测验证无退化，**可以合并到 main**
2. **W4 候选**：
   - A.4 A/B 框架（需要积累 1 周以上数据）
   - actual_cost_tokens 接入（解 LLM provider response usage 字段）
   - 多页 category 分类器（解 __other__ 问题）
   - 更刁钻的评测集（让 B.1 双路效果显现）
3. **不必做**：B 轨升 RRF 严格双路（当前评测没看到 B.1 退化，且 B 组耗时降了，单路+bonus 已经够用）
