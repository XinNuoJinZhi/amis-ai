# 1.4.0 · LLM 路由智能化 + RAG 质量收口 + Vue3 模板

> **状态**：已落地（dev/1.4.0，15 commits）；待 PR 合 main + tag v1.4.0
> **配套 roadmap**：[../plans/2026-05-11-roadmap-1.4.md](../plans/2026-05-11-roadmap-1.4.md)
> **评测汇总**：[../../eval/1.4-w2/SUMMARY.md](../../eval/1.4-w2/SUMMARY.md)

## 目标

继 1.3.x 完成 ZC Amis 业务扩展后，1.4 三轨并行打：
- **B 轨 · RAG 质量收口**：双路召回（语义 + 关键字精确）+ 负例生成 + LLM 评委自动回流，目标把 ZC 任务页通过率从 1.3.2 baseline 80-90% 拉到 ≥95%
- **A 轨 · LLM 路由智能化**：业务类别分类器 + tier 偏置覆盖现有 score 决策 + 用户级 token 配额 + 真实 cost 接入
- **C 轨 · Vue3 + Element Plus 模板**：Web 端补 Vue3 底座（弥补 1.3 只有 React 系），并把 stack/ui 桶冲突矩阵补齐

## 核心成果

| 轨 | 项 | 数据 |
|---|---|---|
| B.1 | RAG 双路召回 | `keyword_index text[]` 列 + GIN 索引 + `keyword_extractor.py`（type/subType/api 提取，64 token 上限）+ score 加分公式 `LEAST(0.3, 0.06 × kw_overlap)` |
| B.2 | 负例样本生成器 | 5 种 minimal-mutation（api 协议降级 / ZC 组件替换 / 删必填 / 字段类型错配 / multiple 反转）；73 ZC 样例生成 60 条负例入库 |
| B.3 | LLM 评委回流 | sample 级 `verdict=bad → 自动 mark is_negative=true`（B.3a）+ page 级 `/internal/judge-page-schema` + `spawn_judge_for_page`（B.3b，含 schema 4 列） |
| B.4 | 评测三组对比手册 + orchestrator | `eval/1.4-w2/run-three-rounds.sh` admin knob 切换 + 3 组对比 v4 全 100% |
| A.1 | 任务类别分类器 | 8 类标签（static_page / data_table / multipage_dashboard / oa_form / ecommerce / admin_settings / zc_business / __other__）；fast 模型一次调用，confidence ≥0.5 才参与路由 |
| A.2 | category × tier 路由偏置 | `llm.routing.category_tier_overrides_json` 配置驱动；force_tier 覆盖 score 决策 |
| A.3 | 用户 token 成本预算 | `user_token_quota` 表惰性 24h 重置；over_budget 时 downgrade 到 fast tier 或 reject 返回 429 |
| C.1/C.2 | vue3-element-plus 脚手架 | 14 文件 / AutoImport + Components 让 LLM 写业务零样板 / 复用 uniapp-node20 镜像（无新建） |
| C.3 | references 库 | stack-vue3 + ui-element-plus 各补 4 个业务模式 references（composables / router / pinia / script-setup-pitfalls / form-validation / table / dialog / theme） |
| C.4 | 桶冲突矩阵测试 | 9 个桶补 conflicts 字段 + `check_skill_bucket_conflicts.py` 5/5 PASS（同 platform stack 互斥 + 所有 ui 互斥 + priority 梯度 + DAG + 对称） |
| W4 #1 | 分类器 multipage 修复 | runner 传 `amis_json="{}"` 时合并 `pages[].amis_json` 给分类器 / score / estimate 三处 |
| W4 #2 | page 评委评测真接通 | orchestrator C 组开 `rag.judge.page_mode=auto_on_complete`；41 page 被评（good=4 / needs_review=31 / bad=6） |
| W4 #3 | actual_cost_tokens 接入 | claw-agent 加 `stream_options.include_usage=true` + UsageChunk 解析；backend watcher 监听 llm_call_snapshot 累加到 `task.actual_cost_tokens` |

总计 **15 commits** 在 dev/1.4.0，**4 个 bug 修复**（claw-agent 字段缺失 / B.2 hit_count / float 类型 mismatch / 分类器盲点）。

## v4 评测三组对比（W4 修复后）

数据集：5 个 ZC Web prompts × r4_baseline × 3 组 knob = 15 任务，5 分钟跑完。

| 指标 | A baseline | B +weighting | C 全开 + page 评委 |
|---|---|---|---|
| **任务成功率** | **5/5 (100%)** | **5/5 (100%)** | **5/5 (100%)** |
| **平均页通过率** | **100%** | **100%** | **100%** |
| 平均 LLM 调用 | 37.2 | **28.8 ↓-23%** | 33.6 |
| 平均 LLM 耗时 | 60.9s | **50.1s ↓-18%** | 57.8s |
| 平均总耗时 | 28.8s | **22.0s ↓-24%** | 31.4s |

**关键观察**：
- 三组任务/页通过率全 100%——15 commits 上线后**零退化**
- B 组耗时 -24% 证明 weighting（thumbs / hit_count 加权）让 RAG 召回更精准，LLM 少走弯路
- C 组评委介入后总耗时回升一点（评委本身烧 LLM），但页通过率仍 100%

## A.1/A.2 路由路径验证（v4）

15 task 的 category 分布命中真实业务类型：

```
zc_business:        7 task   (avg cost: 1933 tokens)
oa_form:            6 task   (avg cost: 2072 tokens)
multipage_dashboard: 4 task   (avg cost: 1894 tokens)
data_table:         1 task   (avg cost: 1785 tokens)
__other__:          1 task   (分类器超时容错)
```

**结论**：A.2 路由偏置真正进入工作状态，按 `llm.routing.category_tier_overrides_json` 配置的映射可以让不同业务走不同 tier（zc_business → strong / oa_form → strong / dashboard → strong / data_table → balanced / static_page → fast）。

## B.3b page 评委质量信号

41 个 page 在 C 组被 LLM 评委评了：

```
good:           4 page   (10%)
needs_review:  31 page   (76%)
bad:            6 page   (15%)
```

**76% needs_review** 说明评委有意见可表达（不是把所有页都标 good），是有效的质量信号。**6 个 bad page** 当前不自动入库为 is_negative=true 的 code_sample（设计上 B.3a 只对 sample 级触发，page 级留人审）——W5 可考虑加 page-bad → 单独入库 negative sample 链路。

## A.3 quota + actual_cost 真实数据

```
estimated_cost_tokens: 1500-2215   (按 amis_json 长度 + complexity 粗估)
actual_cost_tokens:    409,828     (真实 LLM token 消耗，task 260 测试)
```

**估算公式偏低 200×**——后续可基于积累的 actual_cost 数据校准 `estimate_task_cost` 公式（W5）。当前 W4 #3 已经把真实数据通道打通，evaluation 时可观察 cost-per-success。

## 配置 knob 速查（1.4 新增）

```
# A.2 路由偏置
llm.routing.category_tier_overrides_json = {"static_page":"fast","data_table":"balanced","multipage_dashboard":"strong","oa_form":"strong","ecommerce":"strong","admin_settings":"balanced","zc_business":"strong"}

# A.3 成本预算
llm.quota.enabled               = false      (总闸默认关，admin 启)
llm.quota.default_daily_budget  = 100000     (用户首次访问的初始预算)
llm.quota.over_budget_action    = downgrade  (downgrade / reject)

# B.3 评委
rag.judge.mode                  = disabled   (disabled / manual / auto_on_adopt)
rag.judge.page_mode             = disabled   (disabled / auto_on_complete) ← 1.4 新增
rag.judge.auto_negative_on_bad  = false      (true 时 sample verdict=bad 自动 mark is_negative)

# RAG weighting（1.2 已有，1.4 评测时新尝试效果）
rag.weighting.enabled           = false
rag.weighting.thumbs_mode       = tiebreaker (tiebreaker / boost)
rag.weighting.hit_count_enabled = false

# B.1 双路召回：无开关（query_amis_json 默认自动传，无需配置）
```

## DB schema 变更

```sql
-- 1.4 B.1 双路召回
ALTER TABLE code_samples
  ADD COLUMN IF NOT EXISTS keyword_index text[] NOT NULL DEFAULT '{}';
CREATE INDEX IF NOT EXISTS idx_code_samples_keyword_index ON code_samples USING GIN (keyword_index);

-- 1.4 B.3b page 评委
ALTER TABLE project_task_page
  ADD COLUMN IF NOT EXISTS page_quality_verdict  TEXT      NULL,
  ADD COLUMN IF NOT EXISTS page_quality_reason   TEXT      NULL,
  ADD COLUMN IF NOT EXISTS page_quality_judge_at TIMESTAMP NULL,
  ADD COLUMN IF NOT EXISTS page_quality_judge_model TEXT   NULL;

-- 1.4 A.1/A.3 路由智能化 + 成本预算
ALTER TABLE project_generation_task
  ADD COLUMN IF NOT EXISTS complexity_score    REAL,
  ADD COLUMN IF NOT EXISTS category            VARCHAR(32),
  ADD COLUMN IF NOT EXISTS category_confidence REAL,
  ADD COLUMN IF NOT EXISTS estimated_cost_tokens INT,
  ADD COLUMN IF NOT EXISTS actual_cost_tokens    INT;

-- 1.4 A.3 用户配额表
CREATE TABLE IF NOT EXISTS user_token_quota (
  user_id       INT       PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  daily_budget  INT       NOT NULL DEFAULT 100000,
  used_today    INT       NOT NULL DEFAULT 0,
  reset_at      TIMESTAMP NOT NULL DEFAULT NOW(),
  ...
);
```

**所有 migration 由 backend startup 自动跑，幂等可重启**。

## Skill 桶变更

| 桶 | 1.3 状态 | 1.4 状态 |
|---|---|---|
| stack-vue3 | SKILL.md only | + 4 个 references（composables / router / pinia / pitfalls） |
| ui-element-plus | SKILL.md only | + 4 个 references（form-validation / table / dialog / theme） |
| stack-react / stack-vue2 / stack-uniapp / stack-rn | 部分缺 conflicts | 全部补齐同 platform 互斥 |
| ui-antd / ui-element-plus / ui-element-ui / ui-wot | 全缺 conflicts | 四方互斥 |

## 工具链

| 工具 | 路径 | 用途 |
|---|---|---|
| keyword 回填 | `agent/scripts/backfill_keyword_index.py` | 一次性给历史 code_samples 补 keyword_index（240/279 已回填，39 个 amis_json 空跳过） |
| 负例生成 | `agent/scripts/generate_negative_samples.py` | 5 种 mutation × 73 ZC 样例 → 60 条负例（含 `--dry-run`） |
| 桶冲突测试 | `agent/scripts/check_skill_bucket_conflicts.py` | 5 项一致性检查 + 同 kind 桶矩阵可视化 |
| 评测 orchestrator | `eval/1.4-w2/run-three-rounds.sh` | admin knob 切换 + 3 组 r4_baseline 串跑 + 收尾还原 |
| 评测手册 | `eval/1.4-w2/README.md` | 三组对比配置 + 决策点指南 |

## 1.4 收尾路上修过的 4 个 bug

1. **`70ab34f`** · claw-agent-server `TaskSkillContext` 缺 `template_default_buckets` 字段
   - 病因：1.3.2 加字段时 task_loop.rs:312 漏填
   - 影响：claw-agent 编译失败
   - 修：补 `&[]` 空切片（template defaults 已经在 explicit_buckets 里）

2. **`838ae02`** · B.2 负例 INSERT 缺 `hit_count=0`
   - 病因：`code_samples.hit_count INT NOT NULL` 没 default，INSERT 列不全
   - 影响：全部 73 条负例入库失败
   - 修：INSERT 列加 hit_count，值 0

3. **`088c612`** · A.1 `complexity_score` / `category_confidence` 列建成 FLOAT8 但 entity 是 `Option<f32>`（FLOAT4）
   - 病因：PG `FLOAT` = `double precision`（FLOAT8），不是 REAL
   - 影响：并发 task 创建报 sqlx decode 类型不匹配 500（第一个 NULL 跳过，后续填了非 NULL 就炸）
   - 修：DB 列改 REAL（`ALTER COLUMN ... TYPE REAL` 幂等）+ entity 保 f32

4. **`6c018e1`** · 分类器对 multipage payload 的盲点
   - 病因：runner 传 `amis_json="{}"`，真实内容在 `pages[].amis_json`，分类器只看顶层 → category=__other__ 100% 命中
   - 影响：A.2 路由偏置完全没生效（v2/v3 评测全 __other__）
   - 修：backend create_task 合并 pages → `{"type":"page","body":[...]}` 给分类器 / score / estimate 三处

## 升级注意

1. **首次重启 backend** 会自动跑所有 migration（含 ALTER COLUMN TYPE REAL 修复历史 DB），无需手工 SQL
2. **已入库的 code_samples 没 keyword_index**：跑一次 `agent/scripts/backfill_keyword_index.py` 回填（~30s）
3. **历史 task 没 category / complexity_score / actual_cost_tokens**：不影响新任务，新 task 会正常填充
4. **WSL Docker socket 时序坑**（与 1.4 无关，但开机首次启动 sandbox-service 会因 docker socket 没就绪而退出）：跑第二次 `start-services.sh restart` 即可
5. **`page_quality_verdict` 默认 disabled**：要真触发 page 评委需要 admin 把 `rag.judge.page_mode=auto_on_complete`，评测 orchestrator C 组已自动切

## 未做（留 1.5 / 后续）

- **A.4 A/B 框架**：需要积累 1 周以上数据才有意义，roadmap W4 候选但未落地
- **estimate_task_cost 公式校准**：当前估算偏低 200×（v4 实测 actual=409,828 vs estimated=1785），基于积累的 actual_cost 数据 W5 可校准
- **page-bad 自动入库为 negative sample**：B.3b 只回填 page_quality_*，bad 不自动 mark；按真实评测数据判断价值后再做
- **更刁钻的评测集**：当前 ZC 5 prompts 太简单（baseline 已 100%），B.1 双路 keyword 命中率提升不可见——需要更难的多页业务或者引入"误判用户描述"的对抗样本