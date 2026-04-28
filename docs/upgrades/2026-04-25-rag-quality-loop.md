# 2026-04-25 大升级 · RAG 质量闭环（评分 / 负例 / 审核可视化 / 全量可配置）

> 本文迁移自原 CLAUDE.md（第 410–580 行），为保证历史信息零损耗，内容原样保留。

把「采纳→入库→召回」的飞轮主回路从「只靠 admin 手工 approve/reject」升级到**质量信号驱动**的全套基建。设计原则源自 Plan agent 评审：**默认保守，建齐基建，按数据分阶段激活**。

设计文档：`/home/karl/.claude/plans/shiny-honking-backus.md`

## 全景图（4 段能力，全部 admin 可在线开关）

| 段 | 能力 | 默认状态 | 文件 |
|---|---|---|---|
| **Phase 0** | 审核可视化（统计卡片 / Badge / audit timeline / tags 黑名单） | **MVP 即用** | 后端 stats / pending-count / audit + 前端顶部 6 卡片 + 菜单角标 + Drawer |
| **Phase 1** | 信号埋点（thumbs / rating，**只记不入 ranking**） | UI 已 live，权重 OFF | 列表 👍👎 + 详情 Rate + audit 同步 |
| **Phase 2** | LLM 评委（二元 good/needs_review/bad，跨 provider） | `rag.judge.mode=disabled` | quality_judge service + Python `/internal/judge-code-sample` |
| **Phase 4** | 反向飞轮（负例注入，**默认 OFF**） | `rag.negative.enabled=false` | mark-negative + 详情面板 + Python `/internal/search-negative-samples` |

## 6 条评审原则（写入代码，不可绕过）

| 原则 | 落地位置 |
|---|---|
| **埋点先于加权** | thumbs/rating Phase 1 入库不入 ranking；`rag.weighting.enabled` 默认 false |
| **quality 走硬过滤而非加权** | Python `search_code_samples` 用 WHERE `min_rating` / `min_verdict`，不进 score 公式 |
| **LLM 评委强制二元 + 跨 provider** | `select_for_quality_judge` fallback 链跳过 code_generation；UI 提示绑不同 provider |
| **rating COALESCE 覆盖 quality_score** | rating 与 quality_verdict 两列分存；min_rating 与 min_verdict 各自独立硬过滤 |
| **负例仅结构性 + 必须 A/B** | Python `search_negative_samples` 强制 `only_structural=true`（backend 也硬编码） |
| **批量评分预算闸 + 并发闸** | `quality_judge::is_over_budget`（按 audit 当日计数）+ `OnceLock<Semaphore>` |

## Schema 改动

`code_samples` 加 13 列：
- 反馈：`thumbs_up / thumbs_down`（INT 默认 0）
- 评分：`rating REAL` / `rating_note TEXT` / `rating_by INT` / `rating_at TIMESTAMP`
- 评委：`quality_verdict TEXT` / `quality_reason TEXT` / `quality_judge_at TIMESTAMP` / `quality_judge_model TEXT`
- 负例：`is_negative BOOLEAN` / `negative_kind TEXT` / `rejection_reason TEXT`

新表 `code_sample_audit`：sample_id / operator_id / operator_kind（admin/system/llm_judge）/ action / before_json / after_json / note / created_at。所有状态变更（approve / reject / rate / thumbs / mark_negative / judge / config_change）都写一行。`ON DELETE CASCADE` 跟随样例删。

迁移全部在 [../../backend/src/main.rs](../../backend/src/main.rs) 用 `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` 幂等执行，旧库零改动启动即升级。

## 新路由（全 admin 校验，prefix `/api/code-samples`）

| Method | 路径 | 用途 | Phase |
|---|---|---|---|
| GET  | `/stats` | 顶部 6 卡片：pending / approved / rejected / negative / avg_rating / judge 覆盖率 / 总赞踩 | 0 |
| GET  | `/pending-count` | 菜单 Badge 轻量接口 | 0 |
| GET  | `/:id/audit` | 审计 timeline（最多 200 条 desc） | 0 |
| POST | `/:id/feedback` | body `{kind:"up"|"down"}`，原子 +1 + audit | 1 |
| PUT  | `/:id/rating` | body `{rating:0-5|null, note?}` + audit | 1 |
| POST | `/:id/score-async` | 触发 LLM 评委（异步队列，立即返回 queued） | 2 |
| POST | `/batch-score` | body `{ids?, scope?:"pending_only"|"all_unscored", limit?}` | 2 |
| POST | `/:id/mark-negative` | body `{negative_kind, rejection_reason?, also_reject?:true}` | 4 |
| POST | `/:id/unmark-negative` | 清 is_negative | 4 |

## System Settings 全量 knob（前缀 `rag.`，admin 可在「系统设置 → RAG 飞轮」实时改）

| Key | 默认 | 备注 |
|---|---|---|
| `rag.quality_filter.exclude_tags` | `antipattern` | tags 黑名单（逗号分隔，硬过滤）—— **MVP 即生效** |
| `rag.quality_filter.min_rating` | `` | 人工 rating 下限（留空=不过滤）|
| `rag.quality_filter.min_verdict` | `` | LLM verdict 下限（good / needs_review；留空=不过滤）|
| `rag.weighting.enabled` | `false` | 主总闸：ON 后 thumbs / hit_count 才进 ranking |
| `rag.weighting.thumbs_mode` | `tiebreaker` | off / tiebreaker（cos_sim 差<0.05 时 0.05 权重）/ boost（0.2，慎用）|
| `rag.weighting.hit_count_enabled` | `false` | `ln(1+hit/10)` 权重 0.1，N<100 无意义 |
| `rag.judge.mode` | `disabled` | disabled / manual / auto_on_adopt |
| `rag.judge.task_type` | `quality_judge` | LLM task_type，admin 在 LLM 供应商页绑跨 provider 模型 |
| `rag.judge.budget_per_day` | `50` | 每日 LLM 评委调用上限（用 audit 当日计数闸） |
| `rag.judge.batch_concurrency` | `3` | 进程内 semaphore；改后需重启生效 |
| `rag.negative.enabled` | `false` | 总闸；`fetch_rag_extra_sections` 据此决定是否调 `/internal/search-negative-samples` |
| `rag.negative.top_k` | `1` | 最多注入几条负例（硬上限 3） |
| `rag.negative.only_structural` | `true` | **强制 true**（Python 端硬编码；UI 仅展示） |
| `rag.pending_badge.poll_interval_sec` | `60` | 菜单 Badge 轮询周期 |
| `rag.stats.cache_ttl_sec` | `30` | 统计卡片缓存 TTL（当前未实现服务端缓存，预留） |

## Python Agent 改动

| 接口 | 用途 |
|---|---|
| `/internal/search-code-samples` | 扩 7 个新参数：`exclude_tags / min_rating / min_verdict / weighting_enabled / thumbs_mode / hit_count_enabled`；硬过滤 WHERE，软加权 score_expr 分支构造 |
| `/internal/search-negative-samples` **新** | 按 tech_stacks/platforms 查 `is_negative=true`；强制 `only_structural=true`；不返回 full_code（防 LLM negation blindness） |
| `/internal/judge-code-sample` **新** | LLM 评委二元打分；JSON 清洗（兼容 \`\`\`json fence + 找 `{...}` 子串兜底）；输出严格 `{verdict, reason, model_used}` |

## 反向飞轮 prompt 注入逻辑（fetch_rag_extra_sections）

[../../backend/src/handlers/project_generation.rs](../../backend/src/handlers/project_generation.rs) 的关键流程：

1. 读 `rag.*` knob（带 `read_value_or` 兜底）
2. 调 `/internal/search-code-samples` 透传所有 knob → 拼 `# RAG 参考样例（Top-3）` 段
3. 若 `rag.negative.enabled=true`：调 `/internal/search-negative-samples`（强制 `only_structural=true`） → 追加 `# ⚠️ 避免以下结构性反例` 段（**只给摘要 + 原因，不给代码**）
4. 写 `rag_samples_injected` event 入审计

## 前端关键路径

| 关心点 | 文件 |
|---|---|
| 列表统计卡片 + 4 新列 + 批量评分弹窗 + AI 打分按钮 | [../../frontend/src/views/KnowledgeBase/CodeSamplesHome.tsx](../../frontend/src/views/KnowledgeBase/CodeSamplesHome.tsx) |
| 详情 Rate + verdict 块 + 负例 Collapse + audit Timeline Drawer | [../../frontend/src/views/KnowledgeBase/CodeSampleDetail.tsx](../../frontend/src/views/KnowledgeBase/CodeSampleDetail.tsx) |
| 菜单 Badge + 轮询逻辑 | [../../frontend/src/components/Layout/index.tsx](../../frontend/src/components/Layout/index.tsx)（getPendingCount + interval） |
| SystemSettings 分组 + 全量 rag.* knob 编辑 | [../../frontend/src/views/Settings/SystemSettings.tsx](../../frontend/src/views/Settings/SystemSettings.tsx)（KnobRow 组件按 KnobDef.kind 渲染 Switch/InputNumber/Select 等） |
| 服务层 12 个新 API | [../../frontend/src/services/codeSamples.ts](../../frontend/src/services/codeSamples.ts) |

## 后端关键路径

| 关心点 | 文件 |
|---|---|
| audit helper + 9 个新 handler | [../../backend/src/handlers/code_samples.rs](../../backend/src/handlers/code_samples.rs)（`record_audit` / `stats` / `pending_count` / `list_audit` / `submit_feedback` / `submit_rating` / `mark_negative` / `unmark_negative` / `score_sample_async` / `batch_score`） |
| Schema migration + rag.* defaults | [../../backend/src/main.rs](../../backend/src/main.rs)（ALTER + CREATE TABLE + INSERT ON CONFLICT） |
| code_sample entity 13 新字段 | [../../backend/src/entity/code_sample.rs](../../backend/src/entity/code_sample.rs) |
| audit entity（新建） | [../../backend/src/entity/code_sample_audit.rs](../../backend/src/entity/code_sample_audit.rs) |
| LLM 评委选择器（跨 provider fallback） | [../../backend/src/services/llm_selector.rs](../../backend/src/services/llm_selector.rs)（`select_for_quality_judge`） |
| 评委异步桥（预算闸 + semaphore） | [../../backend/src/services/quality_judge.rs](../../backend/src/services/quality_judge.rs)（新建；`spawn_judge_for_sample`） |
| 检索注入 RAG 配置透传 + 负例分支 | [../../backend/src/handlers/project_generation.rs](../../backend/src/handlers/project_generation.rs)（`fetch_rag_extra_sections`） |

## 分阶段交付节奏（admin 操作步骤）

**Phase 0（已 live，无需操作）**：刷新前端就能看到统计卡片 + Badge + audit timeline。`exclude_tags=antipattern` 默认生效。

**Phase 1（数据采集 2 周）**：admin 在样例列表点 👍👎、详情打 0-5 星 + note。**`rag.weighting.enabled` 仍保持 false**，数据进表不进分。2 周后跑 SQL 看分布：
```sql
SELECT COUNT(*) FILTER (WHERE rating IS NOT NULL) AS rated,
       AVG(rating) AS avg_rating,
       SUM(thumbs_up) AS up, SUM(thumbs_down) AS down
FROM code_samples;
```
若 rated < 10 → **不要升 Phase 3**，样本不足权重无意义。

**Phase 2（启 LLM 评委）**：
1. 在「系统设置 → LLM 供应商」给 `task_type=quality_judge` 绑一个**与 generation 不同 provider** 的模型（避同族偏见）
2. 「系统设置 → RAG 飞轮」把 `rag.judge.mode` 改 `manual`
3. 列表勾几条 → 「批量 AI 评分」试跑（弹窗会显示本次消耗）
4. admin 与 LLM verdict 一致率 ≥ 70% 才升 `auto_on_adopt`

**Phase 3（激活权重 + 硬过滤）**：
1. `rag.weighting.enabled=true` + `thumbs_mode=tiebreaker`
2. `min_verdict=needs_review`（bad 不再召回）
3. 必须 A/B：开启前后 2 周对比任务 adopt 率，无明显正向**立刻回滚**

**Phase 4（负例）**：
1. 先在样例详情打 5 个典型 `structural` 反例（A/B 数据集）
2. `rag.negative.enabled=true`，`only_structural=true`（**勿关**）
3. A/B：相应反模式出现率下降 ≥ 20% 才正式启；否则回滚，负例只作「审核复盘」资产

## 验证（已通过的部分）

- `cargo check`：✅ 0 错误（仅 2 条无关历史 warning）
- `tsc --noEmit`：✅ 0 错误

## 待补 / 未做

- ✅ smoke-test.sh 已追加 7.5 节 RAG 质量闭环冒烟（feedback / rating / score-async / mark-negative / stats / pending-count / audit / rag.* 默认配置）—— 2026-04-25 完成
- ❌ 没启动服务跑端到端验证（按 CLAUDE.md 约定不主动启动）
- ✅ A/B 报告工具 2026-04-25 完成：`GET /api/code-samples/ab-report?from_a&to_a&from_b&to_b` + 「系统设置 → RAG 飞轮 → A/B 对比报告」按钮 + Modal（按 succeeded 作 adopt_rate 分母；样本 <10 时弹警告）
- ✅ `judge_good_pct` 卡片样本量 <10 时不显示百分比改成 `judge_good/judge_covered` 分数 + tooltip 解释（不上 Wilson 置信区间，简单防误判即可）

## 验证操作（admin 跑 A/B 对比的标准动作）

启用 Phase 3 (`rag.weighting.enabled` / `min_verdict`) 或 Phase 4 (`rag.negative.enabled`) 前后必跑：

1. 切换前在「系统设置 → RAG 飞轮 → A/B 对比报告」选 A 段（最近 14 天作基线）→ 记下成功率 / 采纳率
2. 改 knob 保存 → 等 ≥ 14 天攒数据
3. 再次打开 Modal，A 段保留切换前那段 / B 段填切换后这段 → 看 diff
4. 决策准则：
   - **diff.adopt_rate ≥ +5pp** 且 **diff.fail_rate ≤ +0pp** → 保留新配置
   - **adopt_rate 下降 或 fail_rate 上升 ≥ +3pp** → 立即回滚
   - **diff 不显著（绝对值 <2pp）+ 样本足够** → knob 没意义，回滚
5. 后端 API 也可直接 curl，便于写到自动化报告里

## 已知限制

- LLM 评委挂在 generation 同 provider 时会有 5–15% systematic bias（Plan agent 警告）；UI 已强提示，但**没有强制校验**——admin 自觉
- `rag.judge.batch_concurrency` 用 `OnceLock<Semaphore>` 实现，**改了配置后需要重启进程**才能生效（防止 admin 反复调耗 permit）
- audit 表无归档机制，长期可能变大；建议每季度归档老于 90 天的行（暂未实现）
- 统计卡片是单次聚合查询直查，没有服务端缓存（`rag.stats.cache_ttl_sec` 是预留 knob，当前不读）
