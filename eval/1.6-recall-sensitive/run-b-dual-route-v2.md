# 1.2.0 多页 5 策略评测报告（20260513T021428Z）

## 策略汇总（按 strategy 聚合）

| 策略 | 任务成功率 | 平均页通过率 | 平均复用率 | 平均 LLM 调用 | 平均 LLM 耗时 | 平均总耗时 |
|---|---|---|---|---|---|---|
| **r4_baseline** | 8/8（100%）| 88% | 0.00 | 33.2 次 | 69.2s | 40.9s |

**指标说明**：
- 任务成功率：task 主表 status=succeeded 占比
- 页通过率：所有 page 中 status=done 的比例（即使 task succeeded 也可能有个别 page 失败）
- 复用率：reuse_metric 事件里 import_count / file_count（只统计成功任务）
- LLM 调用次数 / 总耗时：events 表 llm_request_end 累加（代理 token 消耗）
- 总耗时：task created_at → updated_at（含 watcher 等真完成）

## 每 prompt × 策略 明细

### rs1_employee_directory — RS1 · 内部员工目录与档案（3 页）

| 策略 | task_status | 页通过 | 复用率 | LLM 次数 | LLM 总耗时 | 总耗时 | rag_recorded |
|---|---|---|---|---|---|---|---|
| r4_baseline | succeeded | 2/3 | 0.00 | 39 | 130s | 70s | ✓ |

### rs2_sales_bi_dashboard — RS2 · 销售数据看板（3 页）

| 策略 | task_status | 页通过 | 复用率 | LLM 次数 | LLM 总耗时 | 总耗时 | rag_recorded |
|---|---|---|---|---|---|---|---|
| r4_baseline | succeeded | 3/3 | 0.00 | 46 | 51s | 22s | ✓ |

### rs3_oa_leave_flow — RS3 · OA 请假流程（3 页）

| 策略 | task_status | 页通过 | 复用率 | LLM 次数 | LLM 总耗时 | 总耗时 | rag_recorded |
|---|---|---|---|---|---|---|---|
| r4_baseline | succeeded | 3/3 | 0.00 | 39 | 51s | 26s | ✓ |

### rs4_workorder_dynamic — RS4 · 客户服务工单（动态表单）（3 页）

| 策略 | task_status | 页通过 | 复用率 | LLM 次数 | LLM 总耗时 | 总耗时 | rag_recorded |
|---|---|---|---|---|---|---|---|
| r4_baseline | succeeded | 3/3 | 0.00 | 33 | 43s | 42s | ✓ |

### rs5_crm_customer — RS5 · 客户档案与销售记录（3 页）

| 策略 | task_status | 页通过 | 复用率 | LLM 次数 | LLM 总耗时 | 总耗时 | rag_recorded |
|---|---|---|---|---|---|---|---|
| r4_baseline | succeeded | 2/3 | 0.00 | 40 | 91s | 74s | ✓ |

### rs6_org_permission — RS6 · 组织架构与权限矩阵（3 页）

| 策略 | task_status | 页通过 | 复用率 | LLM 次数 | LLM 总耗时 | 总耗时 | rag_recorded |
|---|---|---|---|---|---|---|---|
| r4_baseline | succeeded | 3/3 | 0.00 | 22 | 38s | 17s | ✓ |

### rs7_asset_repair — RS7 · 资产管理与报修工单（3 页）

| 策略 | task_status | 页通过 | 复用率 | LLM 次数 | LLM 总耗时 | 总耗时 | rag_recorded |
|---|---|---|---|---|---|---|---|
| r4_baseline | succeeded | 2/3 | 0.00 | 23 | 84s | 48s | ✓ |

### rs8_project_collab — RS8 · 项目协作看板（3 页）

| 策略 | task_status | 页通过 | 复用率 | LLM 次数 | LLM 总耗时 | 总耗时 | rag_recorded |
|---|---|---|---|---|---|---|---|
| r4_baseline | succeeded | 3/3 | 0.00 | 24 | 66s | 28s | ✓ |
