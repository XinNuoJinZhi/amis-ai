# 1.2.0 多页 5 策略评测报告（20260511T150605Z）

## 策略汇总（按 strategy 聚合）

| 策略 | 任务成功率 | 平均页通过率 | 平均复用率 | 平均 LLM 调用 | 平均 LLM 耗时 | 平均总耗时 |
|---|---|---|---|---|---|---|
| **r4_baseline** | 5/5（100%）| 100% | 0.00 | 31.2 次 | 45.4s | 19.0s |

**指标说明**：
- 任务成功率：task 主表 status=succeeded 占比
- 页通过率：所有 page 中 status=done 的比例（即使 task succeeded 也可能有个别 page 失败）
- 复用率：reuse_metric 事件里 import_count / file_count（只统计成功任务）
- LLM 调用次数 / 总耗时：events 表 llm_request_end 累加（代理 token 消耗）
- 总耗时：task created_at → updated_at（含 watcher 等真完成）

## 每 prompt × 策略 明细

### zc_p1_user_directory_3pages — ZC 用户与部门管理三页（列表+详情+编辑）（3 页）

| 策略 | task_status | 页通过 | 复用率 | LLM 次数 | LLM 总耗时 | 总耗时 | rag_recorded |
|---|---|---|---|---|---|---|---|
| r4_baseline | succeeded | 3/3 | 0.00 | 27 | 30s | 12s | ✓ |

### zc_p2_dashboard_4pages — ZC 后台仪表盘四页（首页+报表+订单 CRUD+客户档案）（4 页）

| 策略 | task_status | 页通过 | 复用率 | LLM 次数 | LLM 总耗时 | 总耗时 | rag_recorded |
|---|---|---|---|---|---|---|---|
| r4_baseline | succeeded | 4/4 | 0.00 | 44 | 65s | 28s | ✓ |

### zc_p3_workorder_3pages — ZC 工单 CRUD 三页（列表+详情+动态表单提交）（3 页）

| 策略 | task_status | 页通过 | 复用率 | LLM 次数 | LLM 总耗时 | 总耗时 | rag_recorded |
|---|---|---|---|---|---|---|---|
| r4_baseline | succeeded | 3/3 | 0.00 | 34 | 47s | 20s | ✓ |

### zc_p4_oa_workflow_3pages — ZC OA 工作流三页（启动+流转+我的待办）（3 页）

| 策略 | task_status | 页通过 | 复用率 | LLM 次数 | LLM 总耗时 | 总耗时 | rag_recorded |
|---|---|---|---|---|---|---|---|
| r4_baseline | succeeded | 3/3 | 0.00 | 23 | 45s | 16s | ✓ |

### zc_p5_oa_dept_3pages — ZC OA 组织架构三页（部门树+人员+角色权限）（3 页）

| 策略 | task_status | 页通过 | 复用率 | LLM 次数 | LLM 总耗时 | 总耗时 | rag_recorded |
|---|---|---|---|---|---|---|---|
| r4_baseline | succeeded | 3/3 | 0.00 | 28 | 40s | 19s | ✓ |
