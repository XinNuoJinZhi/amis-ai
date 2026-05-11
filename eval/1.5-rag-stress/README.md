# 1.5 W1.3 · D 项 RAG 压力评测手册

> **目标**：让 1.4 B.1 双路召回（向量 + amis JSON 关键字）的真实价值可观测
> **背景**：1.4 B.4 评测三组全 100% 通过 → 无 headroom → 无法判断 B.1 单路 vs 双路谁更优
> **思路**：设计三类「容易让纯向量召回翻车」的样本，看双路是否能纠偏

## 数据集设计（共 9 prompts，每个 3-4 页）

### A 类 · 对抗样本（描述与 amis 故意不一致）

向量召回会被 `extra_prompt` 拉去错的样本，关键字应能从 amis JSON 纠偏回去。

| ID | 描述 | amis 真身 | 期望纠偏 |
|---|---|---|---|
| `adv_a1_desc_user_amis_product` | "员工用户管理后台" | 商品价目表 | keyword=commodity/price/sku → 抓电商样本 |
| `adv_a2_desc_oa_amis_static` | "OA 请假流程" | 公司新闻图文 | keyword=banner/markdown/article → 抓静态页样本 |
| `adv_a3_desc_report_amis_settings` | "销售报表 dashboard" | 系统配置/字典/权限 | keyword=config/dict/permission → 抓 settings 样本 |

### B 类 · 混淆样本（相同 type 不同 ui_lib 或不同布局）

| ID | 描述 | 看点 |
|---|---|---|
| `conf_b1_mixed_select` | select/department-select/user-select 同页 | tech-stack=react-antd-vite 是否优先 amis 原生而非 ZC 二开 |
| `conf_b2_date_mixed` | date/datetime/date-range/month 四变体同页 | 是否区分日期类型，避免笼统抓 form |
| `conf_b3_form_layout` | fieldSet/inline/visibleOn 联动 | 是否抓到布局策略样本而非通用 form |

### C 类 · 冷启动样本（训练集无此领域）

| ID | 领域 | 看点 |
|---|---|---|
| `cold_c1_medical` | 医疗病历 | 向量信号弱，keyword=patient/diagnosis/prescription 能否补 |
| `cold_c2_education` | 教育课程 | keyword=course/enrollment/grade 能否补 |
| `cold_c3_legal` | 法律案件 | keyword=case/court/hearing 能否补 |

## 三组对比

跟 1.4 B.4 同样方法切 RAG 配置开关，跑同一套 prompts × r4_baseline 策略。

### A 组 · Pure Vector（关 B.1 双路）

```bash
# admin 关 B.1 keyword 加分（如果后端没暴露开关，可改 backend code 临时禁 query_amis_json）
# 实际操作：在 agent/src/services/rag.py search_code_samples 调用前临时把 query_amis_json 置 None
# 或者：admin → rag.search.keyword_bonus = 0（如有该 knob）

# 跑评测
TEST_ADMIN_JWT=<token> python3 eval/multipage-1.2/runner.py \
  --prompts-file eval/1.5-rag-stress/prompts.json \
  --strategies r4_baseline \
  --tech-stack react-antd-vite \
  --max-wait-sec 1200 \
  --out eval/1.5-rag-stress/results-A-pure-vector.csv
```

### B 组 · B.1 双路（线上现状）

```bash
# 恢复 B.1 keyword 加分（默认开启）
TEST_ADMIN_JWT=<token> python3 eval/multipage-1.2/runner.py \
  --prompts-file eval/1.5-rag-stress/prompts.json \
  --strategies r4_baseline \
  --tech-stack react-antd-vite \
  --max-wait-sec 1200 \
  --out eval/1.5-rag-stress/results-B-dual-route.csv
```

### C 组（可选） · B.1 + 负例（1.4 W2 全集）

```bash
# admin 开 rag.negative.enabled / rag.judge.mode=auto_on_adopt
TEST_ADMIN_JWT=<token> python3 eval/multipage-1.2/runner.py \
  --prompts-file eval/1.5-rag-stress/prompts.json \
  --strategies r4_baseline \
  --tech-stack react-antd-vite \
  --max-wait-sec 1200 \
  --out eval/1.5-rag-stress/results-C-dual-negative.csv
```

## 指标定义

| 指标 | 含义 | 期望（B vs A） |
|---|---|---|
| 页通过率 avg | 9 prompt × 3-4 page，跑过启动的 page 占比 | B ≥ A + 5pp（在压力集上 B 必须明显胜出，否则 B.1 价值弱） |
| `keyword_hits` avg Top-3 | 每个 page 召回的 Top-3 样本平均命中几个 keyword | 0（A） vs >0（B） |
| cos_sim 高但 kw=0 失败比例 | 失败 case 中 cos_sim ≥0.7 但 kw=0 的占比 | B 应该 < A（B 能用 kw 兜底） |
| 总耗时 / actual_cost_tokens | LLM 调用代价 | B 不应显著增加（kw 加分是同一次召回内 rerank） |

## 决策点

跑完 A vs B 对比后，按以下分支决策：

- **B - A ≥ +5pp**：B.1 单路+bonus 在压力集下显著胜出 → 维持现状，写 1.5 升级文档
- **B - A 在 [+1pp, +5pp]**：B.1 有用但 marginal → 评估是否升严格 RRF（参考 memory: b1_keyword_design.md）
- **B - A < +1pp**：B.1 没起作用 → 检查 `query_amis_json` 是否真的传到 agent，或 keyword_index 召回不准
- **B - A < 0**：B.1 反作用 → 立即关 B.1（或仅特定 category 开），并定位 keyword 噪音来源

## 跑前检查

```bash
# 1. 服务起好（4 个 + postgres）
./shared/scripts/start-services.sh check
./shared/scripts/start-services.sh start

# 2. keyword_index 已回填（1.4 W1 已做，新装机器需补）
cd agent && uv run python scripts/backfill_keyword_index.py

# 3. 检查 339 个 code_samples 都有 keyword_index
psql -h localhost -U postgres -d amis_ai -c \
  "SELECT count(*) as has_kw FROM code_samples WHERE keyword_index IS NOT NULL;"
# 期望：≥300

# 4. token 有效（admin JWT）
echo "$TEST_ADMIN_JWT" | head -c 20  # 别打全，截一下确认非空
```

## 故障排查

- runner 报 401：JWT 过期，到 frontend 重新登录拷新 token
- task 卡 running 不退出：sandbox 起不来，查 `tail -f /tmp/amis-ai-logs/sandbox-service.log`
- keyword_hits 全 0：backend 没把 `amis_json` 传到 agent 的 `search_code_samples`，查 `backend/src/handlers/project_generation.rs` 调 search_code_samples 调用点
- 评测费用爆：评测期间临时关评委 `rag.judge.mode=disabled`

## 产出

- `results-A-pure-vector.csv` / `.md` — A 组（关 B.1）
- `results-B-dual-route.csv` / `.md` — B 组（B.1 开）
- `SUMMARY.md` — 三组对比 + 决策结论 + 异常 case 截屏

跑完后把 SUMMARY 同步进 `docs/upgrades/2026-MM-DD-1.5-rag-stress.md`，作为 1.5 升级一节。
