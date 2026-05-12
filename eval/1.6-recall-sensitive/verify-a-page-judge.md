# 1.2.0 多页 5 策略评测报告（20260512T231749Z）

## 策略汇总（按 strategy 聚合）

| 策略 | 任务成功率 | 平均页通过率 | 平均复用率 | 平均 LLM 调用 | 平均 LLM 耗时 | 平均总耗时 |
|---|---|---|---|---|---|---|
| **r4_baseline** | 1/1（100%）| 100% | 0.00 | 44.0 次 | 67.2s | 94.0s |

**指标说明**：
- 任务成功率：task 主表 status=succeeded 占比
- 页通过率：所有 page 中 status=done 的比例（即使 task succeeded 也可能有个别 page 失败）
- 复用率：reuse_metric 事件里 import_count / file_count（只统计成功任务）
- LLM 调用次数 / 总耗时：events 表 llm_request_end 累加（代理 token 消耗）
- 总耗时：task created_at → updated_at（含 watcher 等真完成）

## 每 prompt × 策略 明细

### rs2_sales_bi_dashboard — RS2 · 销售数据看板（3 页）

| 策略 | task_status | 页通过 | 复用率 | LLM 次数 | LLM 总耗时 | 总耗时 | rag_recorded |
|---|---|---|---|---|---|---|---|
| r4_baseline | succeeded | 3/3 | 0.00 | 44 | 67s | 94s | ✓ |
