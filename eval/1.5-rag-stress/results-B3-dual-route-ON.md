# 1.2.0 多页 5 策略评测报告（20260511T194256Z）

## 策略汇总（按 strategy 聚合）

| 策略 | 任务成功率 | 平均页通过率 | 平均复用率 | 平均 LLM 调用 | 平均 LLM 耗时 | 平均总耗时 |
|---|---|---|---|---|---|---|
| **r4_baseline** | 9/9（100%）| 100% | 0.00 | 26.3 次 | 37.8s | 20.1s |

**指标说明**：
- 任务成功率：task 主表 status=succeeded 占比
- 页通过率：所有 page 中 status=done 的比例（即使 task succeeded 也可能有个别 page 失败）
- 复用率：reuse_metric 事件里 import_count / file_count（只统计成功任务）
- LLM 调用次数 / 总耗时：events 表 llm_request_end 累加（代理 token 消耗）
- 总耗时：task created_at → updated_at（含 watcher 等真完成）

## 每 prompt × 策略 明细

### adv_a1_desc_user_amis_product — A1 对抗 · 描述说"用户管理"但 amis 是商品价目表（3 页）

| 策略 | task_status | 页通过 | 复用率 | LLM 次数 | LLM 总耗时 | 总耗时 | rag_recorded |
|---|---|---|---|---|---|---|---|
| r4_baseline | succeeded | 3/3 | 0.00 | 26 | 38s | 19s | ✓ |

### adv_a2_desc_oa_amis_static — A2 对抗 · 描述说"OA 请假流程"但 amis 是图文卡片（3 页）

| 策略 | task_status | 页通过 | 复用率 | LLM 次数 | LLM 总耗时 | 总耗时 | rag_recorded |
|---|---|---|---|---|---|---|---|
| r4_baseline | succeeded | 3/3 | 0.00 | 27 | 41s | 24s | ✓ |

### adv_a3_desc_report_amis_settings — A3 对抗 · 描述说"销售报表 dashboard"但 amis 是系统设置（3 页）

| 策略 | task_status | 页通过 | 复用率 | LLM 次数 | LLM 总耗时 | 总耗时 | rag_recorded |
|---|---|---|---|---|---|---|---|
| r4_baseline | succeeded | 3/3 | 0.00 | 25 | 36s | 15s | ✓ |

### cold_c1_medical — C1 冷启动 · 医疗病历（病人档案+病历+处方）（3 页）

| 策略 | task_status | 页通过 | 复用率 | LLM 次数 | LLM 总耗时 | 总耗时 | rag_recorded |
|---|---|---|---|---|---|---|---|
| r4_baseline | succeeded | 3/3 | 0.00 | 26 | 44s | 24s | ✓ |

### cold_c2_education — C2 冷启动 · 教育课程（课程列表+选课+成绩）（3 页）

| 策略 | task_status | 页通过 | 复用率 | LLM 次数 | LLM 总耗时 | 总耗时 | rag_recorded |
|---|---|---|---|---|---|---|---|
| r4_baseline | succeeded | 3/3 | 0.00 | 25 | 34s | 20s | ✓ |

### cold_c3_legal — C3 冷启动 · 法律案件（案件登记+卷宗+庭审）（3 页）

| 策略 | task_status | 页通过 | 复用率 | LLM 次数 | LLM 总耗时 | 总耗时 | rag_recorded |
|---|---|---|---|---|---|---|---|
| r4_baseline | succeeded | 3/3 | 0.00 | 31 | 48s | 31s | ✓ |

### conf_b1_mixed_select — B1 混淆 · select 控件三种来源同页（amis 原生 / element 风格 / ZC 二开）（3 页）

| 策略 | task_status | 页通过 | 复用率 | LLM 次数 | LLM 总耗时 | 总耗时 | rag_recorded |
|---|---|---|---|---|---|---|---|
| r4_baseline | succeeded | 3/3 | 0.00 | 23 | 33s | 14s | ✓ |

### conf_b2_date_mixed — B2 混淆 · 多 date 控件混合（date / datetime / date-range / month）（4 页）

| 策略 | task_status | 页通过 | 复用率 | LLM 次数 | LLM 总耗时 | 总耗时 | rag_recorded |
|---|---|---|---|---|---|---|---|
| r4_baseline | succeeded | 4/4 | 0.00 | 36 | 47s | 22s | ✓ |

### conf_b3_form_layout — B3 混淆 · form 布局多变体（grid / fieldSet / inline / 分组联动）（2 页）

| 策略 | task_status | 页通过 | 复用率 | LLM 次数 | LLM 总耗时 | 总耗时 | rag_recorded |
|---|---|---|---|---|---|---|---|
| r4_baseline | succeeded | 2/2 | 0.00 | 18 | 17s | 12s | ✓ |
