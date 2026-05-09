# 1.2.0 · 多页面反向飞轮 + 5 策略评测矩阵

> **状态**：已落地（dev/1.2.0）；待 PR 合 main + tag v1.2.0
> **配套设计**：[../plans/2026-05-08-multipage-reverse-flywheel-design.md](../plans/2026-05-08-multipage-reverse-flywheel-design.md)
> **配套 plan**：[../plans/2026-05-08-multipage-reverse-flywheel-plan.md](../plans/2026-05-08-multipage-reverse-flywheel-plan.md)
> **接力文档**：[../plans/2026-05-08-1.2-handoff.md](../plans/2026-05-08-1.2-handoff.md)

## 目标

把单页反向飞轮升级为多页面 SPA 工程：用户给 N 段 amis JSON，系统在沙箱里自动生成 / 启动 / 自修复**整套** UniApp + Wot UI H5 项目（含路由 / 共享组件 / 状态管理）。同时落地 5 种"页间复用策略"并通过端到端评测拿到对比矩阵，把"该选哪个策略"从拍脑袋变成"看数据"。

## 核心成果

| 项 | 数据 |
|---|---|
| 多页面调度器（5 策略：R4 baseline / R2 prompt / R1 skeleton / R3 refactor / Unified） | ✅ 全部实现 |
| W6.5 闭环 4 项缺陷修复 | ✅ session 真完成等待 + reuse_metric/RAG epilog + 时区统一 + e2e jq null 守护 |
| claw-agent-server `single_shot` 模式 | ✅ 解决多页 session 不发 succeeded 的 race condition |
| W7.1 评测 runner + 3 prompts × 5 策略对比矩阵 | ✅ `eval/multipage-1.2/runner.py`，2h15min 跑完 15 任务 |
| RAG 多页样本入库 + strategy 标签硬过滤 | ✅ `multipage_recorder` + `/multipage/record` 端点 |
| 多页前端 PagesPanel + 输入页 | ✅ `frontend/src/views/Projects/CreateMultipageTask.tsx` |
| 启动脚本代理坑修复 | ✅ `start-services.sh` 启动子进程时清代理 env |

总计 **30+ commits 在 dev/1.2.0**、5 个 e2e 脚本 + 15 任务全量评测。

## 5 策略评测矩阵（W7.2 真实数据）

数据集：3 个 prompt（3/4/5 页）× 5 策略 = 15 任务，跑完耗时 2h15min。

### 策略汇总

| 策略 | 任务成功率 | 平均页通过率 | 平均 LLM 调用 | 平均 LLM 耗时 | 平均总耗时 | 1.2 推荐 |
|---|---|---|---|---|---|---|
| **R4 baseline** | **100%** (3/3) | **100%** | 96.7 次 | 202s | 122s | ✅ **GA 推生产** |
| **R2 prompt** | **100%** (3/3) | 92% (11/12) | 97.0 次 | 176s | 161s | ✅ **GA 推生产** |
| R3 refactor | 0% (0/3) | 100% (12/12)\* | 95.7 次 | 198s | 627s | ⚠️ Experimental |
| R1 skeleton | 0% (0/3) | 0% | 0 次 | 0s | 1147s | ⚠️ Experimental |
| Unified | 0% (0/3) | 0% | 0 次 | 0s | 3s | ⚠️ Experimental |

\* R3 的"页生成全 OK 但重构后处理 100% 挂"——失败定位清晰，重构阶段是后续重点修复目标。

### 每 prompt 明细

详见 `eval/multipage-1.2/results-<timestamp>.md`（不入 git，每次跑会带时间戳产出）。本次跑（20260509T054605Z）的关键观察：

- **p1 基础三页**：R4 89s / R2 160s 全过；R1 卡死 28.7min；R3 90s 快速失败但页 3/3 OK；Unified 1.3s 极快失败
- **p2 后台四页**：R4 202s / R2 189s 全过；R1 卡死 28.8min；R3 4/4 页 OK 但重构卡 30min；Unified 18.6s 极快失败
- **p3 电商五页**：R4 100% / R2 4/5 页（1 页失败但 task succeeded）；R1 这次反而 2.2s 极快失败；R3 5/5 页 OK 但重构 30min；Unified 18.9s 极快失败

### 关键 finding

1. **R4 + R2 是 1.2 GA 推荐**：3 prompt 全过、性能稳。R2 比 R4 慢 32%（多注入清单 prompt），但 R2 在更复杂场景下应该有复用价值（本次 prompt 集没有强复用诱导，下版本补"业务模型驱动"prompt 集）。
2. **R3 失败模式清晰**：所有 prompt 都"页生成 100% OK 但重构后处理 100% 挂"——固定的失败点，下版本重点修。
3. **R1 失败模式不一致**：要么卡死 28+ min，要么 2.2s 极快挂——实现有 race condition / 前置检查问题。
4. **Unified 创建 session 后立刻挂**：0 LLM 调用、极快失败——可能 prompt 太长或协议字段。
5. **复用率全 0.00**：本次 prompt 集太"独立"无共享需求，不能体现 R1/R2 的设计价值——这是 W7.2 数据集的局限，不是策略本身的局限。

## 关键代码路径

### 后端调度器

[`backend/src/services/multipage_scheduler.rs`](../../backend/src/services/multipage_scheduler.rs)：

- `dispatch(task_id)`：按 `execution_strategy` + `reuse_strategy` 分派 5 策略实现
- `run_unified` / `run_r1_skeleton` / `run_r2_prompt` / `run_r3_refactor` / `run_r4_baseline`
- `run_epilog`：算 shared/ 复用率 + 写 `reuse_metric` event + 调 agent `/multipage/record` 写 RAG（成功任务）+ 回写 task 主表 status

[`backend/src/services/multipage_session_watcher.rs`](../../backend/src/services/multipage_session_watcher.rs)：

- 订阅 claw-agent-server 的 ws 事件流
- 每条事件持久化到 `project_task_event`（前端 history REST 可回放）
- 等到 `status_change=succeeded/failed/stopped` 才返回，30 分钟兜底超时

[`backend/src/services/multipage_reuse.rs`](../../backend/src/services/multipage_reuse.rs)：

- backend 内联复用率算法（不依赖 sandbox HTTP，纯 str 扫 `import shared/`）
- 4 个单元测试（zero / shared imports / dir missing / two-layer depth）

### claw-agent-server `single_shot` 模式

[`claw-code/rust/crates/claw-agent-server/src/task_loop.rs`](../../claw-code/rust/crates/claw-agent-server/src/task_loop.rs) `TaskLoopConfig.single_shot`：

- `false`（默认）= interactive 模式（前端 IDE 聊天，等 follow-up message）
- `true` = single-shot：跑完 initial turn 立刻退出 spawn_blocking → 自然走到 `event_tx_outer.send(StatusChange(Succeeded))`
- 多页 scheduler 5 个策略的 5 处 `CreateTaskRequest` 都设 `single_shot: Some(true)`
- 单页 IDE 路径 `project_generation::create_task` 设 `single_shot: None`（保持 interactive）

### 评测 runner

[`eval/multipage-1.2/runner.py`](../../eval/multipage-1.2/runner.py)：

- 标准库 Python（无第三方依赖）
- 调 backend POST `/api/projects/tasks` 创建多页任务
- 直查 PG 拿指标（task / page / events 表）
- 输出 CSV（逐任务）+ Markdown（聚合矩阵）
- 增量写 CSV（中途跑挂保住已有数据）
- `--prompts` / `--strategies` / `--max-wait-sec` 选子集

[`eval/multipage-1.2/prompts.json`](../../eval/multipage-1.2/prompts.json)：3 个核心 prompt（3/4/5 页）。

## 已知问题（1.2 不阻塞，下版本修）

| ID | 问题 | 影响 | 状态 |
|---|---|---|---|
| 1 | R3 重构后处理阶段 100% 失败 | R3 不可用 | 评测捕获，下版本重点修 |
| 2 | R1 骨架阶段双重失败模式（卡死 / 极快挂） | R1 不可用 | 评测捕获，下版本重做 |
| 3 | Unified 创建 session 即挂 | Unified 不可用 | 评测捕获，下版本查 prompt 长度 |
| 4 | page 表 `claw_session_id` 列没回写 | 调试不便（需从 events 反查 session） | 小修，下版本顺手 |
| 5 | `R2` 复杂场景偶发单页失败（p3：4/5） | 92% 页通过率 | 数据点已采集，看 5+ 页是否同样 |
| 6 | sandbox tool_call 偶发卡 5-10 分钟（W6.5 task 128 案例） | 不影响最终成功，但拉长尾延迟 | 后续看是 sandbox 还是 LLM 工具循环 |

## 升级路径

dev/1.2.0 → main：直接 PR 合（无 schema 破坏性变更）。前端 IDE 单页路径 100% 兼容（single_shot 字段默认 None）。

DB schema 兼容：`project_task_page` 表已建好（`alter table` 兼容已建表 + 时间列 TIMESTAMP）。

## 配套测试覆盖

- 33 个测试在 W6 节点全绿（multipage_reuse 4 + multipage_recorder 3 + RAG strategy filter 3 + sandbox reuse_metrics 3 + Semaphore 并发 2 + 1.1 旧测试 13 + 1.2 早期 3 + cargo build / tsc 0 error）
- 5 个 e2e 脚本（`eval/multipage-1.2/test_e2e_*.sh`，5 策略各一个）
- W7.2 全量评测 15/15 任务（3 prompts × 5 strategies，2h15min）

## 接力 / 下一步

- 1.2 阶段已完成，等用户拍板 PR 合 main + tag v1.2.0
- 1.3 启动条件：把 R3 重构 / R1 骨架 / Unified 三个 experimental 策略修到 GA；补"业务模型驱动"prompt 集让复用率有意义；补 page 表 `claw_session_id` 回写
