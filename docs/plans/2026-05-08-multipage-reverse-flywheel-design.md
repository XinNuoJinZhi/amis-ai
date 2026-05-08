# 1.2.0 设计 · 反向飞轮多页面 + 多策略 + RAG 自学习

> **状态**：设计稿（已与用户确认整体方案，待 spec review）
> **日期**：2026-05-08
> **目标版本**：amis-ai 1.2.0
> **路线图位置**：1.x 串行第二段（1.1 知识补全 ✅ → **1.2 多页面（先反向飞轮）** → 1.3 ZC Amis 主仓融合）
> **配套 plan（待写）**：`2026-05-08-multipage-reverse-flywheel-plan.md`

## 1. 背景与目标

### 1.1 背景

amis-ai 1.0/1.1 完成的反向飞轮（Amis JSON → UniApp Wot H5 项目）只能处理**单页面**：
- [`project_generation_task`](../../backend/src/entity/project_generation_task.rs) 表 `amis_json` 是 **单条 String**
- [脚手架 pages.json](../../scaffolds/uniapp-wot-h5-template/src/pages.json) 仅 1 个 `pages/index/index`
- 前端 [反向飞轮 IDE](../../frontend/src/views/Projects/detail/index.tsx) 单任务单展示，无 pages tab

但实际业务大多是多页项目（用户列表 → 详情 / 注册向导 → 引导页 / 仪表盘 + 设置页 + 个人中心），单页生成无法满足。

### 1.2 目标

把反向飞轮从「单 amis_json → 单 UniApp 项目」扩到「**N 段 amis JSON + 可选路由 → UniApp 多页项目（带路由 + 跳转 + 共享组件 + 统一样式）**」，并提供多种**执行 / 复用策略**让用户按场景选择，全程数据回喂 RAG 自学习闭环。

### 1.3 非目标（明确 1.2 不做）

- **正向飞轮多页面**（chat 一次出多个 amis 页面 JSON）→ 排到 1.x 后续
- 跨项目页面复用（不同任务间共享组件）→ 不做
- 多人协作多页编辑 → 不做
- 多页 mocap 拖拽编辑器 → 不做（仍用 amis JSON 文本输入）

## 2. 关键决策记录

| ID | 决策 | 备选 | 理由 |
|---|---|---|---|
| D1 | 输入形态：**B = 多段独立 amis JSON**（每段一页 + 可选路由） | A 单 app schema / C 多 chat 任务合并 / D 在线编辑器逐页加 | 用户体验明确（一段对一页）；amis_json 字段沿用 String 不破坏数据库；与 amis 生态 app schema 解耦更通用 |
| D2 | 路由路径：**用户可选填，不填交 LLM 推断** | 必填 / 全部 LLM | 兼顾灵活性与易用性；LLM 已能从 amis JSON 内容（含 title、type、列表→详情语义）推断合理路径 |
| D3 | 双执行模式：**独立 + 统筹** 用户在创建任务时选 | 仅独立 / 仅统筹 / 系统自动判 | 业务场景差异大（快速 prototyping vs 大型项目），决策权给用户 |
| D4 | 复用策略：**全 5 种组合**（独立·R1/R2/R3/R4 + 统筹）一期吞下 | B 核心 3 种 / C 最小 2 种 / D MVP 1 种 | 用户明确「决策权全给用户 + 全过程入库 + 数据回喂 RAG 飞轮」，多策略数据是飞轮的输入 |
| D5 | 数据模型：tasks 加 strategy 字段 + 新建 `project_task_page` 子表 + 复用现有 `project_task_event` 扩展 vocab | 全新 multipage_tasks 表 / 不加子表用 JSON 列 | 渐进改造、子表更便于查询单页状态、event 表已有就别造轮子 |
| D6 | RAG 闭环：复用 1.1 的 [`code_samples`](../upgrades/2026-04-22-knowledge-rag-plugins.md) + tags 机制，加 `execution_strategy` / `reuse_strategy` / `multipage:1` / `page_count:N` 标签 | 新建 multipage_samples 表 | 与 1.1 RAG 质量闭环（thumbs/rating/LLM judge/A-B）无缝衔接 |
| D7 | 默认推荐策略：**独立·R1 骨架先行** | 统筹默认 / R2 默认 | 兼顾速度（N 页并发）与复用（骨架确保基线一致）；失败可单页重试 |

## 3. 架构总览

```
┌──── 输入 ────────────────────────────────────────────────────────┐
│  [Page 1] amis JSON + 路由路径（可选）                             │
│  [Page 2] amis JSON + 路由路径（可选）                             │
│  [Page N] amis JSON + 路由路径（可选）                             │
│  执行模式：[独立 ▾] / [统筹 ▾]                                      │
│  复用策略（仅独立时显示）：[R1 骨架先行 ▾]                         │
└────────────────────────────────┬─────────────────────────────────┘
                                  │
                                  ↓
                 ┌────────────────┴────────────────┐
                 ↓                                  ↓
        【统筹模式】                        【独立模式调度器】
   1 claw-agent session                ┌──────┬──────┬──────┬──────┐
   prompt 含全部 N 段 + 路由           R1 骨架  R2 注入 R3 重构 R4 baseline
   一次跑完整项目                       ↓      ↓      ↓      ↓
                                  3 阶段  1 阶段 2 阶段 1 阶段
                                  骨架→各 各页并 各页→重 各页完
                                  页→收尾 发(全局 构合并 全并发
                                          prompt)
                 ↓                                  ↓
                 └────────────────┬────────────────┘
                                  ↓
              全程事件 / 产物 / 复用率 / 用户 thumbs 入库
                                  ↓
        RAG `code_samples` 加 `execution_strategy` / `reuse_strategy`
        / `multipage:1` / `page_count:N` 标签
                                  ↓
        按策略 + 历史成功率 召回相似样例 → 自学习闭环
```

## 4. 数据模型

### 4.1 `project_generation_task` 表扩展

| 列 | 类型 | 说明 |
|---|---|---|
| `execution_strategy` | `varchar(16) NOT NULL DEFAULT 'unified'` | `isolated` / `unified`；单页旧任务默认 `unified` 兼容 |
| `reuse_strategy` | `varchar(16)` | 仅 isolated 时填：`r1_skeleton` / `r2_prompt` / `r3_refactor` / `r4_none`；统筹任务为 `NULL` |
| `page_count` | `int NOT NULL DEFAULT 1` | 多页任务的总页数；单页任务保持 1 兼容 |

兼容策略：现有所有单页任务执行后续读取自然为 `unified` + `page_count=1`，无需 backfill。

### 4.2 新表 `project_task_page`

```sql
CREATE TABLE project_task_page (
  id              SERIAL PRIMARY KEY,
  task_id         INT NOT NULL REFERENCES project_generation_task(id) ON DELETE CASCADE,
  page_idx        INT NOT NULL,                     -- 用户输入顺序，从 0 开始
  route_path      VARCHAR(255) NOT NULL,            -- 用户填或 LLM 推断后填，最终都有值
  amis_json       TEXT NOT NULL,                    -- 这一页的 amis JSON
  claw_session_id VARCHAR(64),                      -- 独立模式下的子 session；统筹模式 NULL
  status          VARCHAR(16) NOT NULL DEFAULT 'pending',  -- pending/running/done/failed
  started_at      TIMESTAMPTZ,
  finished_at     TIMESTAMPTZ,
  error_msg       TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (task_id, page_idx),
  UNIQUE (task_id, route_path)                       -- 路由唯一约束
);
CREATE INDEX idx_ptp_task_status ON project_task_page (task_id, status);
```

### 4.3 `project_task_event` 表（已存在）扩展 event_type vocab

| 新增 event_type | 触发时机 |
|---|---|
| `skeleton_started` / `skeleton_done` / `skeleton_failed` | R1 第 1 阶段（骨架 session） |
| `page_started:{page_idx}` / `page_done:{page_idx}` / `page_failed:{page_idx}` | 每页 session 启停 |
| `cleanup_started` / `cleanup_done` / `cleanup_failed` | R1 第 3 阶段（收尾 session：lint / 跨页修复） |
| `refactor_started` / `refactor_done` / `refactor_failed` | R3 第 2 阶段（重构 session：抽 shared/） |
| `unified_started` / `unified_done` / `unified_failed` | 统筹模式 |
| `route_inferred:{page_idx}:{path}` | 用户没填路由，LLM 推断后写回 |
| `reuse_metric:{value}` | 完成后统计 shared/ import 次数 / 总组件数（百分比） |

### 4.4 `code_samples` 表（已存在）扩展 tags vocab

完成且采纳的多页任务回写 tags：
- `multipage:1`（区分 1.1 的单页样例）
- `execution_strategy:isolated` / `execution_strategy:unified`
- `reuse_strategy:r1_skeleton` / `reuse_strategy:r2_prompt` / `reuse_strategy:r3_refactor` / `reuse_strategy:r4_none`
- `page_count:N`（多页规模）
- `reuse_rate:high` (≥ 60%) / `reuse_rate:medium` (30%-60%) / `reuse_rate:low` (< 30%)（按 reuse_metric 分桶）

复用 1.1 的 thumbs/rating/LLM judge/A-B 机制；RAG 检索时按 strategy 标签优先召回成功样例。

## 5. 关键组件

| 组件 | 路径 | 职责 |
|---|---|---|
| 多页输入 UI | [`frontend/src/views/Projects/CreateMultipageTask.tsx`](../../frontend/src/views/Projects/) 新建 | N 段 amis JSON + 路由 + 策略下拉 + 提交 |
| 调度器 | [`backend/src/services/multipage_scheduler.rs`](../../backend/src/services/) 新建 | 5 种策略的 session 编排 + 状态机驱动 |
| 骨架生成器 prompt | `claw-code/rust/crates/claw-agent-server/prompts/scaffold_skeleton.md` 新建 | R1 第 1 阶段：仅生成 shared/ + pages.json stub |
| 全局 prompt 构造器 | [`backend/src/services/global_prompt_builder.rs`](../../backend/src/services/) 新建 | R2：扫 sandbox 现有 components/styles 生成全局清单 prompt 段 |
| 重构 session prompt | `claw-code/rust/crates/claw-agent-server/prompts/scaffold_refactor.md` 新建 | R3 第 2 阶段：抽重复代码到 shared/ |
| 路由解析器 | [`agent/src/services/route_inferer.py`](../../agent/src/services/) 新建 | 用户没填路由时调 LLM 按 amis JSON 内容推断 path |
| 复用率统计 | [`sandbox/src/reuse_metrics.rs`](../../sandbox/src/) 新建 | 完工后扫产物 grep `import.*from\s+['"](\.\.?/)+shared/` 算复用率 |
| 前端 pages tab | [`frontend/src/views/Projects/detail/panels/PagesPanel.tsx`](../../frontend/src/views/Projects/detail/panels/) 新建 | 侧栏每页状态徽章 + 阶段进度条 + 复用率显示 |
| RAG 标签注入 | [`agent/src/knowledge/loader.py`](../../agent/src/knowledge/loader.py) 扩展 | 任务采纳时把 strategy / reuse_metric / outcome 写进 code_samples tags |

## 6. 数据流（5 种策略）

### 6.1 统筹模式

```
用户输入 → backend create_task（execution_strategy=unified）
        → 创建 N 行 project_task_page（claw_session_id=NULL）
        → 1 个 claw-agent session
            prompt 包：全局头 + 路由表 + 全部 N 段 amis JSON
        → claw-agent 跑完整项目
        → 入库：execution_strategy:unified + page_count:N + reuse_metric
```

### 6.2 独立·R1 骨架先行（推荐默认）

```
阶段 1【骨架】
  独立 session A，prompt 模板 scaffold_skeleton.md
  产物：shared/components/* + shared/styles/* + pages.json stub + router/index.ts
  事件：skeleton_started → skeleton_done

阶段 2【各页】
  N 个 session 并发（max_concurrent=3）
  每个 session prompt 注入：
    - 该页 amis JSON
    - 路由路径（用户填或 LLM 推断）
    - 「shared/ 清单」硬约束（必须 import 不准重复造）
  事件：page_started:0 → page_done:0 / page_started:1 → ...

阶段 3【收尾】
  独立 session B
  跑：lint / 修跨页路由跳转 bug / dev server 启动验证
  事件：cleanup_started → cleanup_done / 或 fix_attempt:N
```

### 6.3 独立·R2 prompt 注入

```
N 个 session 并发，每个 prompt 包：
  - 全局头（amis app schema + UniApp 路由约定）
  - 「全局组件清单」（来自 _common 桶 SKILL.md + amis-core-schema 的 button/form/select 等基线 schema）
  - 该页 amis JSON + 路由
事件：page_started:N / page_done:N
```

### 6.4 独立·R3 后处理重构

```
阶段 1【各页】
  N 个 session 并发，无共享约束（同 R4 baseline）

阶段 2【重构】
  独立 session，prompt 模板 scaffold_refactor.md
  输入：全部 N 页产物文件清单 + 部分 component 内容
  动作：识别重复 → 抽到 shared/ → 改 import
事件：refactor_started → refactor_done
```

### 6.5 独立·R4 不复用（baseline）

```
N 个 session 完全并发，无任何共享提示
等价于 N 个并发的单页任务（但归到同一个 task_id 下）
```

## 7. RAG 自学习闭环细节

### 7.1 写入路径（任务完成后）

`agent/src/knowledge/loader.py` 加 `record_multipage_outcome(task_id)`：

1. 从 DB 读 `project_generation_task` + `project_task_page` 全部行
2. 拼成 1 条 `code_samples` 记录（一个多页项目 = 一条 RAG 样例）：
   - `full_amis_json`：JSON 数组，含 N 段页面 schema
   - `full_code`：拼接所有页面的关键 .vue / shared/ 内容（≤ 2MB）
   - `tags`：含上述全部 strategy 标签 + `multipage:1` + `page_count:N` + `reuse_rate:high/medium/low`
3. 状态：默认 `pending`（等用户在前端 thumbs / rating 后批准）

### 7.2 检索路径（新任务创建时）

`agent/src/services/rag.py` 的 `search_code_samples` 加 `multipage_filter` 参数：
- 多页任务检索时优先按 `(execution_strategy, reuse_strategy, page_count_bucket)` 三元组召回相似样例
- 二级过滤：`status=approved` 且 `quality_verdict ∈ {good, needs_review}`
- 三级排序：thumbs_up_ratio + LLM judge score + reuse_rate

### 7.3 飞轮闭环

- **数据收集**：每完成一个多页任务自动写库（pending）
- **人工审核**：admin 在 [SystemSettings → RAG 飞轮](../../frontend/src/views/Settings/SystemSettings.tsx) 复用 1.1 的 thumbs/rating/judge UI，对多页样例打分
- **A/B 报告**：扩 RAG 飞轮 A/B 工具，加「按 strategy 维度对比 adopt_rate」视图

## 8. 评测验收门槛

| 门槛 | 度量 | 达标值 |
|---|---|---|
| 端到端 | dev server 启动 + 全部 N 页能渲染 | 3 页 / 5 页 / 8 页测试 case 都 pass |
| 路由 | 跳转不 404（运行时 console error 自动收集） | 100% |
| 复用率（按策略对比） | shared/ import 次数 / 总组件数 | R1 ≥ 60% · R2 ≥ 30% · R3 ≥ 50% · R4 ≤ 10%（baseline）· 统筹 ≥ 70% |
| RAG 闭环 | 上线 2 周内多页任务 thumbs_up_ratio | ≥ 70% |
| 数据完整性 | 5 种策略每种至少 5 条 RAG 样例入库 | 25 条多页样例 |

不达标处理：延期 1 周补样例 / 调 prompt；连续两次不达标 → 升级到方案重审。

## 9. 排期估算

| 周 | 主线 |
|---|---|
| W1 | DB schema 迁移（兼容老任务）+ 多页输入 UI 骨架 + 路由解析器 |
| W2 | 调度器骨架 + R4 baseline 跑通 + sandbox max_concurrent_sessions 限流 |
| W3 | R2 prompt 注入 + 全局 prompt 构造器（扫 sandbox 现有产物） |
| W4 | R1 骨架先行（骨架 prompt 模板 + 收尾两阶段编排）|
| W5 | R3 后处理重构（重构 prompt 模板）+ 统筹模式（多页 prompt 拼装） |
| W6 | 前端 pages tab + 复用率统计 + RAG 闭环 strategy 标签注入 |
| W7 | 评测：3/5/8 页 case + 5 种策略对比 + dev server 启动验证 + 上线灰度 |

**总工期 ~6-7 周**。

## 10. 风险与备选

| 风险 | 概率 | 影响 | 备选 |
|---|---|---|---|
| R3 重构 session 上下文管理难、产物变烂 | 中 | 高 | 砍 R3 到 1.2.1，1.2.0 一期只 4 种 |
| 统筹模式 token 爆炸（N 页 amis JSON 全塞 prompt） | 中 | 中 | 限 N ≤ 5 页走统筹，超过强制走独立 |
| 多 session 并发压垮 sandbox 资源 | 低 | 中 | 限 max_concurrent_sessions = 3；超时 600s 强制 stop |
| 路由冲突（用户填了重复路径） | 低 | 低 | 输入校验 + LLM 兜底改名（前端校验 + DB UNIQUE） |
| 多页项目 dev server 启动慢 | 中 | 低 | preview port 提前预热 + ready 信号超时延长到 90s |
| 前端 pages tab 与现有 IDE 冲突 | 低 | 中 | 单页任务隐藏 tab；多页任务 tab 默认展开 |
| RAG 召回错策略（如 R1 任务召到 R4 样例污染） | 中 | 中 | strategy 标签作硬过滤而非加权，无匹配宁缺勿滥 |

## 11. Backlog（1.2.x patch）

| 项 | 优先级 | 说明 |
|---|---|---|
| 正向飞轮多页 | 高 | chat 一次出多个 amis 页面 JSON；1.2 不做 |
| 多页 mocap 拖拽编辑器 | 中 | 不再用 amis JSON 文本输入；UI 重投入 |
| 跨项目页面复用 | 低 | 不同任务间共享 components 库；需要全局 component registry |
| 路由参数化（`/crud/view/:id`）| 中 | 1.2.0 仅支持静态路由，参数化路由排到 1.2.1 |
| 多人协作多页编辑 | 低 | 多端同时编辑同一任务的不同页 |

## 12. 引用

- 项目记忆（仓库外，AI 助手专用）：`roadmap_1_x.md`（位于 `~/.claude/projects/-home-karl-Working-TianXing-amis-ai/memory/`）
- 1.1 升级文档：[../upgrades/2026-05-07-amis-knowledge-completion.md](../upgrades/2026-05-07-amis-knowledge-completion.md)
- 反向飞轮架构：[../architecture/reverse-flywheel.md](../architecture/reverse-flywheel.md)
- 反向代码生成原始设计：[2026-04-16-reverse-code-generation.md](2026-04-16-reverse-code-generation.md)
- Skills + RAG 飞轮：[../upgrades/2026-04-22-knowledge-rag-plugins.md](../upgrades/2026-04-22-knowledge-rag-plugins.md)
- RAG 质量闭环：[../upgrades/2026-04-25-rag-quality-loop.md](../upgrades/2026-04-25-rag-quality-loop.md)
- AI 起草工具：[../upgrades/2026-04-22-synthetic-honey.md](../upgrades/2026-04-22-synthetic-honey.md)
