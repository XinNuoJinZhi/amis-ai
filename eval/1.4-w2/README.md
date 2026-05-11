# 1.4 W2 评测手册 · B.4

> 目标：把 ZC 任务页通过率从 1.3 baseline 的 80-90% 拉到 ≥95%
> 三组对比：baseline / B.1 only / B.1 + 负例

## 前置：上线 1.4 改动

```bash
# 1. 起服务（startup migration 自动加 keyword_index 列 + page_quality_* 列）
./shared/scripts/start-services.sh restart

# 2. 回填已入库样例的 keyword_index（一次性，~30s）
cd agent
uv run python scripts/backfill_keyword_index.py

# 3. 校验冲突矩阵无回归（W2 C.4 测试，10s）
uv run python scripts/check_skill_bucket_conflicts.py
#   期望：5/5 PASS

# 4. (可选) 生成负例样本（dry-run 先看预览）
uv run python scripts/generate_negative_samples.py --dry-run
#   确认 ~360 条会生成（5 mode × 73 sample，部分 mode 不命中跳过）
uv run python scripts/generate_negative_samples.py
```

## A 组：Baseline（关掉 B.1 双路 + 负例注入）

> 1.3 的状态：纯向量召回 + 多维标签过滤，无负例

```bash
# 评测前在 admin 把 RAG knob 全调到 baseline 状态：
#   rag.weighting.enabled    = false
#   rag.negative.enabled     = false
#   rag.judge.mode           = disabled

# 跑 ZC Web 9 prompts × R4 策略（1.3 baseline 参考组）
TEST_ADMIN_JWT=<token> python3 eval/zc-web-1.3/runner.py \
  --strategies r4 \
  --max-wait-sec 1200 \
  --out eval/1.4-w2/results-A-baseline.csv
```

期望（来自 1.3.2 实测）：**页通过率 ~94%（已包括 0.5.0 references 补全）**

## B 组：B.1 双路召回（关键字精确召回 + 软加分）

> 1.4 W1 B.1 已上线，无开关 — query_amis_json 自动传，kw_overlap 自动加分

```bash
# 配置不变（A 组完后 B.1 自动生效，因为 backend 传 query_amis_json 是无条件的）
# 直接跑同一组 prompts，复用 runner

TEST_ADMIN_JWT=<token> python3 eval/zc-web-1.3/runner.py \
  --strategies r4 \
  --max-wait-sec 1200 \
  --out eval/1.4-w2/results-B-rag-dual.csv
```

期望：**页通过率 ≥95%**（B.1 的目标 +1-5pp）
重点观察：
- `keyword_hits` 字段：每个任务召回的 Top-3 样本平均命中几个关键字（>0 即生效）
- 失败 case：检查是否 cos_sim 高但 keyword_hits=0 → 说明 B.1 没起作用，要看 query_amis_json 是不是传了

## C 组：B.1 + 负例注入（W2 全集）

> 加上 W1 B.2 生成的负例 + W2 B.3a 自动回流通道

```bash
# admin 配置：
#   rag.negative.enabled         = true
#   rag.negative.top_k           = 1
#   rag.negative.only_structural = true
#   rag.judge.mode               = auto_on_adopt   # 评委介入
#   rag.judge.auto_negative_on_bad = true          # bad 自动 mark

# 跑同一组 prompts
TEST_ADMIN_JWT=<token> python3 eval/zc-web-1.3/runner.py \
  --strategies r4 \
  --max-wait-sec 1200 \
  --out eval/1.4-w2/results-C-rag-dual-negative.csv
```

期望：**页通过率 ≥96-97%**（负例 + 评委带来增量 1-2pp）

## 多页评测（multipage-1.2）

ZC 任务跑完后，跑通用 multipage 验证 B.1 对非 ZC 任务无副作用：

```bash
TEST_ADMIN_JWT=<token> python3 eval/multipage-1.2/runner.py \
  --prompts p1_basic_3pages,p3_ecommerce_5pages \
  --strategies r4,r1 \
  --max-wait-sec 1200 \
  --out eval/1.4-w2/results-multipage-1.2-with-1.4.csv
```

期望：与 1.2 baseline 一致或更好（不退化）。

## 三组对比汇总

跑完三组后，对比汇总到 `eval/1.4-w2/SUMMARY.md`：

| 指标 | A baseline | B +RAG 双路 | C +负例 |
|---|---|---|---|
| 任务成功率 | ? % | ? % | ? % |
| 页通过率（avg） | ? % | ? % | ? % |
| LLM 调用次数（avg） | ? | ? | ? |
| 任务总耗时（avg） | ? min | ? min | ? min |
| keyword_hits（avg Top-3） | 0 | ? | ? |

## 决策点（B.4 完成后）

- 如果 **B 组页通过率 < +3pp**：B.1 单路+bonus 不够，升级严格 RRF 双路（参考 memory: b1_keyword_design.md）
- 如果 **C 组 vs B 组 < +1pp**：负例注入价值低，先关掉 rag.negative.enabled，集中精力做 W3-4 的 A 轨（LLM 路由智能化）
- 如果 **C 组 ≥96%**：W2 收口，按 roadmap 开 W3 LLM 路由

## 故障排查

- 评测 timeout：单 task `--max-wait-sec` 调大；多页项目 R4 策略普通 8-15 min
- 评委费用爆：把 `rag.judge.budget_per_day` 调大，或评测期间临时禁评委 `rag.judge.mode=disabled`
- 反向飞轮自修复频繁触发：`fix_attempts` 字段查看，>3 即可能是 LLM 选错模型
