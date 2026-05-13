# C 项 · baseline 快照 · 2026-05-13-evening

> **生成方式**：`./shared/scripts/gen-baseline.sh evening`
> **数据窗口**：30 天滚动
> **采集时间**：2026-05-13 13:52:49
> **当前 calibration_factor**：140
> **当前 dual_route**：true
> **当前 page_mode**：disabled
> **当前 auto_page_negative**：false

---

## Q0 · 总览

| total_30d | succ_30d | fail_30d | last_7d | distinct_cat |
|---|---|---|---|---|
| 237 | 201 | 13 | 207 | 8 |

---

## Q1 · category × score 分布（30 天）

| category | task_count | succeeded | failed | has_actual_cost |
|---|---|---|---|---|
| __null__ | 115 | 80 | 13 | 11 |
| oa_form | 31 | 31 | 0 | 25 |
| __other__ | 27 | 26 | 0 | 0 |
| zc_business | 23 | 23 | 0 | 16 |
| data_table | 17 | 17 | 0 | 16 |
| multipage_dashboard | 11 | 11 | 0 | 7 |
| static_page | 6 | 6 | 0 | 6 |
| admin_settings | 6 | 6 | 0 | 6 |
| ecommerce | 1 | 1 | 0 | 1 |

---

## Q2 · actual_cost p50/p90/p99（succeeded only）

| category | p50 | p90 | p99 | avg_cost | n |
|---|---|---|---|---|---|
| oa_form | 187167 | 269567 | 327195 | 195561 | 25 |
| zc_business | 289228 | 424235 | 502500 | 289729 | 16 |
| data_table | 196954 | 275904 | 332894 | 210414 | 16 |
| __null__ | 314809 | 403601 | 409205 | 302596 | 11 |
| multipage_dashboard | 228618 | 330973 | 363231 | 238428 | 7 |
| static_page | 191010 | 212766 | 215961 | 190824 | 6 |
| admin_settings | 194312 | 264128 | 296996 | 204825 | 6 |
| ecommerce | 221854 | 221854 | 221854 | 221854 | 1 |

---

## Q3 · estimate vs actual 比值（⭐ 关键：calibration 调参依据）

| category | avg_est | avg_act | ratio | n |
|---|---|---|---|---|
| oa_form | 263848 | 195561 | 0.94 | 25 |
| zc_business | 364497 | 289729 | 0.78 | 16 |
| data_table | 322017 | 210414 | 0.73 | 16 |
| __null__ | 352126 | 302596 | 21.56 | 11 |
| multipage_dashboard | 367371 | 238428 | 0.66 | 7 |
| admin_settings | 383000 | 204825 | 0.53 | 6 |
| static_page | 362000 | 190824 | 0.53 | 6 |

**期望 ratio**：调 calibration=140 后应趋向 0.9-1.1（之前 200 时多数 0.5-0.76，估算虚高）。

---

## Q4 · ab_variant 分布

| variant | task_count | succeeded | avg_cost |
|---|---|---|---|
| __null__ | 237 | 201 | 232780 |

---

## Q5 · page verdict + 自动入库

### 5a · page_quality_verdict 分布（历史累计）

| verdict | n | last_7d |
|---|---|---|
| needs_review | 35 | 35 |
| bad | 7 | 7 |
| good | 4 | 4 |

### 5b · code_samples 自动入库（source_page_id 不为空）

| status | n |
|---|---|
| pending_review | 1 |

---

## Q6 · 分类器命中率（最近 7 天 vs 30 天）

| window | total | null_cat | other_cat | null_other_pct |
|---|---|---|---|---|
| 7d | 207 | 85 | 27 | 54.1 |
| 30d | 237 | 115 | 27 | 59.9 |

**期望趋势**：1.5 W1.1 分类器修复后，null+other 占比应持续下降（05-09 之前 100% → 05-11 后 47% → 目标 < 30%）。

---

## 决策提示

- 如 Q3 多数 ratio 偏离 0.9-1.1 太多 → 再调 `llm.quota.estimate_calibration_factor`
- 如 Q5b 长期 0 行 + Q5a 持续有 bad → 可考虑开 `rag.judge.auto_page_negative=true`（1% 灰度先）
- 如 Q6 7d null+other 仍 > 50% → 检查 LLM 分类器 prompt 是否 stale

