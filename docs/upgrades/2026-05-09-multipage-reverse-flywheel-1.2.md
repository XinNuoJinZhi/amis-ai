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

总计 **35 commits 在 dev/1.2.0**、5 个 e2e 脚本 + 3 次全量评测（最终 15/15 全 GA）。

## 5 策略评测矩阵（W7.2 最终数据）

数据集：3 个 prompt（3/4/5 页）× 5 策略 = 15 任务。
最终 evaluation（20260510T002700Z）跑完耗时 30 分钟，**15/15 全部 succeeded**。

> 历史：第一次跑（20260509T054605Z, 2h15min）暴露了 6 个 P0 issue（R1/R3/Unified 全挂）。
> 修复后第三次跑全过——5 策略全 GA。详见底部 "1.2 收尾路上修过的 6 个 P0 issue"。

### 策略汇总（最终数据）

| 策略 | 任务成功率 | 页通过率 | 平均 LLM 调用 | 平均 LLM 耗时 | 平均总耗时 | 1.2 推荐 |
|---|---|---|---|---|---|---|
| **R4 baseline** | **100%** (3/3) | **100%** | 60.3 次 | 99s | 106s | ✅ **GA** |
| **R2 prompt** | **100%** (3/3) | **100%** | 73.7 次 | 113s | 94s | ✅ **GA** |
| **R1 skeleton** | **100%** (3/3) | **100%** | 89.0 次 | 128s | 110s | ✅ **GA** |
| **R3 refactor** | **100%** (3/3) | **100%** | 114.0 次 | 167s | 158s | ✅ **GA** |
| **Unified** | **100%** (3/3) | **100%** | **46.0 次** | **67s** | 100s | ✅ **GA** |

### 每 prompt 明细（最终）

| prompt | R4 | R2 | R1 | R3 | Unified |
|---|---|---|---|---|---|
| p1 基础三页 | 3/3, 102s | 3/3, 43s | 3/3, 92s | 3/3, 145s | 3/3, 88s |
| p2 后台四页 | 4/4, 99s | 4/4, 87s | 4/4, 102s | 4/4, 124s | 4/4, 100s |
| p3 电商五页 | 5/5, 118s | 5/5, 151s | 5/5, 136s | 5/5, 206s | 5/5, 112s |

### 关键 finding

1. **5 策略全 GA**：R4/R2/R1/R3/Unified 在 3 个 prompt 上 15/15 任务成功率 + 100% 页通过率。
2. **Unified 最省 LLM 也最快**：46 次调用、67s LLM 耗时——只跑一个 session 处理多页，省了 N 次 session 启动开销。**多页生成场景默认推 Unified**。
3. **R3 最重**：114 次调用、167s LLM 耗时——多了重构后处理阶段，理论上能提复用率（本次数据集触发不到）。**复杂场景需要"事后整合"时选 R3**。
4. **R1 折中**：89 次调用、128s——骨架先行 + 各页填充 + cleanup 三阶段，结构化最强。**需要严格 shared/ 共享时选 R1**。
5. **R2 prompt 注入轻量**：73 次调用、113s——只在每页 prompt 头注入清单，不开新 session。**轻度共享场景的折中**。
6. **R4 是 baseline 兜底**：60 次调用、99s，无任何复用机制——**纯独立页面场景选 R4**。
7. **复用率全 0.00**：本次 prompt 集都太"独立"无共享需求，不是策略问题——下版本补"业务模型驱动"prompt 集（如多页都用同一种用户/订单 model）才能让 R1/R2/R3 的复用价值跑出来。

### 1.2 收尾路上修过的 6 个 P0 issue

第一次评测发现 R1/R3/Unified 全挂，深挖后修了：

| # | Issue | 根因 | 修复 commit |
|---|---|---|---|
| P0-1 | page 表 claw_session_id 没回写 | scheduler 5 处 spawn 都只在终态分支才 update | `e6c45b9` |
| P0-2 + P0-5 + P0-6 | Unified / R3 / R1 全 0 LLM 调用立即失败 | 4 处 stage CreateTaskRequest 都缺 model / tech_stack / llm_config（裸奔），claw-agent 拿不到 LLM 配置就 status_change=failed | `e6c45b9`（一个 helper 三鸟） |
| P0-3 | R1 cleanup 阶段 30 分钟卡死 | cleanup prompt 第 4 步 "启动 dev server 验证不报错" → LLM 跑 `pnpm run dev:h5` 前台 blocking → bash tool 永不返回 | `dd04644` |
| P0-4 | R2 5+ 页偶发单页失败 + page 阶段卡 28 分钟 | 同款 prompt 教坏 LLM —— `build_page_prompt` + `multipage_unified.md` 也让 LLM 启动 dev server | `ef90e24` |

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

## 已知问题

✅ **全部修完**。第一次评测发现的 6 个 P0 issue 在 1.2 收尾路上全部根治（详见 5 策略评测矩阵章节末尾的 "1.2 收尾路上修过的 6 个 P0 issue" 表）：

- ~~R3 重构后处理 100% 失败~~ → cleanup prompt 严禁启动 dev server，修完
- ~~R1 骨架阶段双重失败模式~~ → 跟 R3 同根因 + page prompt 也修，修完
- ~~Unified 创建 session 即挂~~ → 跟 R3 同根因（缺 LLM 配置），一个 helper 三鸟
- ~~page 表 `claw_session_id` 没回写~~ → 加 `update_page_session_id_early` helper，修完
- ~~R2 5+ 页偶发单页失败 (92%)~~ → 同 dev server 卡死，修完
- ~~sandbox tool_call 偶发卡 5-10 分钟~~ → 真因不是 sandbox，是 LLM 跑前台 dev server，prompt 修完根治

## 升级路径

dev/1.2.0 → main：直接 PR 合（无 schema 破坏性变更）。前端 IDE 单页路径 100% 兼容（single_shot 字段默认 None）。

DB schema 兼容：`project_task_page` 表已建好（`alter table` 兼容已建表 + 时间列 TIMESTAMP）。

## 配套测试覆盖

- 33 个测试在 W6 节点全绿（multipage_reuse 4 + multipage_recorder 3 + RAG strategy filter 3 + sandbox reuse_metrics 3 + Semaphore 并发 2 + 1.1 旧测试 13 + 1.2 早期 3 + cargo build / tsc 0 error）
- 5 个 e2e 脚本（`eval/multipage-1.2/test_e2e_*.sh`，5 策略各一个）
- **W7.2 最终评测 15/15 全 succeeded（3 prompts × 5 strategies，30min）**——所有策略 100% 任务成功率 + 100% 页通过率

## 接力 / 下一步

1.2 阶段已完整完成，等用户拍板 PR 合 main + tag v1.2.0。

1.3 启动条件（增量优化，不阻塞 1.2）：
- 补"业务模型驱动"prompt 集（如多页都用同一种用户/订单 model），让 R1/R2/R3 的复用率指标真正跑出来（本次 prompt 集都太独立，复用率全 0.00）
- 把 5 策略的复用率 / token / 耗时差异沉淀成"该选哪个策略"的决策辅助 UI（让用户根据场景一键选）
- 看 task 128 那种 sandbox tool_call 偶发卡 5-10 分钟（已确认不是 sandbox 问题而是 LLM 路径，但仍可加 bash tool 超时兜底防御）
