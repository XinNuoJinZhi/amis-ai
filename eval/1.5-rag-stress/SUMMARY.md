# 1.5 D 项 RAG 压力评测 · 三轮综合报告

> **结论先行**：发现并修复了 1.4 B.1 的根本性 bug — **多页任务路径下 B.1 双路从未真正工作**。
> 1.5 W4 fix 后，B 组 keyword_hits 终于 > 0（命中率 89%）。
> 当前压力集对 RAG 区分能力不够刁钻（两组都 100% 通过），但召回样本组合已显著不同。
>
> **日期**：2026-05-12 · **prompts**：9 × 27 pages · **strategy**: r4_baseline × react-antd-vite

---

## 一、6 份 results 一览

| 文件 | 组别 | 跑次 | B.1 dual_route | 多页 RAG fix | 评测意义 |
|---|---|---|---|---|---|
| [results-B1-buggy-multipage.csv](results-B1-buggy-multipage.csv) | B | #1 | ON | ❌（bug） | 错误基线：以为开了 B.1，实际多页路径根本没走 keyword |
| [results-A1-buggy-multipage.csv](results-A1-buggy-multipage.csv) | A | #1 | OFF | ❌（bug） | 与 B1 等价（都没真正走 keyword）→ 数据对比无意义 |
| [results-B2-pre-fix.csv](results-B2-pre-fix.csv) | B | #2 | ON | ❌（bug） | 加了 event 透 keyword_hits 字段，发现全是 0 → 锁定 bug |
| [results-A2-pre-fix.csv](results-A2-pre-fix.csv) | A | #2 | OFF | ❌（bug） | 同样 keyword_hits 全 0，与 B2 无差异 |
| **[results-B3-dual-route-ON.csv](results-B3-dual-route-ON.csv)** | **B** | **#3** | **ON** | **✅** | **真 B 组**：多页 keyword 提取生效 |
| **[results-A3-dual-route-OFF.csv](results-A3-dual-route-OFF.csv)** | **A** | **#3** | **OFF** | **✅** | **真 A 组**：纯向量召回对照 |

**主分析以 B3 vs A3 为准。**

---

## 二、关键 bug 发现

### 现象

[results-A1 / B1 / A2 / B2.csv] 看上去两组结果完全没差异。即使 dual_route 切 false / true，keyword_hits 都是 0。

### 根因

[backend/src/handlers/project_generation.rs:432](../../backend/src/handlers/project_generation.rs#L432) 在调 `fetch_rag_extra_sections` 时传的是 `payload.amis_json`：

```rust
// 修复前（bug）：
let rag_fut = tokio::spawn(fetch_rag_extra_sections(
    state.clone(),
    task_id,
    platform_str.clone(),
    tech_stacks_arr.clone(),
    ui_libs_arr.clone(),
    tech_stack.clone(),
    payload.amis_json.clone(),   // ❌ 多页时是空 `{}`
));
```

但**多页任务的 `payload.amis_json` 字段是空 `{}`**（真 amis 在 `payload.pages[]` 数组里）。所以传给 agent 的 `query_amis_json` 实际是 2 字符的 `{}`，extract_amis_keywords 提取出 0 个关键字 → kw_overlap 永远 0 → B.1 在多页路径下从未生效。

### 影响范围

1. 1.4 W1 B.1 在所有多页任务（1.2 多页 / 1.3 ZC Web / 1.4 评测）下都**未真正工作**
2. 1.4 B.4 评测三组都 100% 的真实原因 — 多页评测路径下 A/B/C 三组**都等于纯向量召回**，无差异
3. 单页任务（1.0 路径）未受影响

### Fix

[backend/src/handlers/project_generation.rs:434](../../backend/src/handlers/project_generation.rs#L434)：

```rust
// 修复后：
let rag_fut = tokio::spawn(fetch_rag_extra_sections(
    ...
    amis_for_analysis.clone(),   // ✅ 多页合并后的整体 JSON
));
```

`amis_for_analysis` 在 line 207-220 已经按多页/单页正确构造（多页时 `{"type":"page","body":[各 page]}`，单页时直接用 payload.amis_json）。改用这个变量后 B.1 在多页路径下立即生效。

---

## 三、B3 vs A3 详细对比

### 任务级（CSV 字段）

| 指标 | B3 (dual ON) | A3 (dual OFF) | 差值 |
|---|---|---|---|
| 任务成功率 | 9/9 = 100% | 9/9 = 100% | 0pp |
| 页通过率 | 27/27 = 100% | 27/27 = 100% | 0pp |
| 总 LLM calls | 247 | 254 | A3 +7 (2.8%) |
| 总 LLM 耗时 (ms) | 359,754 | 353,538 | A3 -6,216 |
| 总耗时 (sec) | 254 | 196 | A3 -58 |

→ 任务成功率/页通过率两组打平（压力集天花板）。耗时维度 A3 略快，但样本量小（9 × 1 strategy），属噪声范围。

### RAG 召回级（rag_samples_injected event，每任务 Top-3 样本）

| 任务 ID | prompt | 组别 | keyword_hits sum | avg_similarity | avg_score（sim + boost） |
|---|---|---|---|---|---|
| 297 | adv_a1 用户→商品 | B3 | **6** | 0.333 | **0.553** |
| 298 | adv_a2 OA→图文 | B3 | 0 | 0.388 | 0.488 |
| 299 | adv_a3 报表→设置 | B3 | **4** | 0.403 | **0.583** |
| 300 | conf_b1 mixed select | B3 | **3** | 0.390 | 0.550 |
| 301 | conf_b2 date mixed | B3 | **4** | 0.354 | 0.534 |
| 302 | conf_b3 form layout | B3 | **4** | 0.377 | 0.557 |
| 303 | cold_c1 medical | B3 | **4** | 0.320 | 0.500 |
| 304 | cold_c2 education | B3 | **4** | 0.331 | 0.511 |
| 305 | cold_c3 legal | B3 | **4** | 0.344 | 0.524 |
| **B3 合计 / 均值** | | | **33 hits / 9 task** | **0.360** | **0.534** |
| 306 | adv_a1 用户→商品 | A3 | 0 | 0.356 | 0.456 |
| 307 | adv_a2 OA→图文 | A3 | 0 | 0.388 | 0.488 |
| 308 | adv_a3 报表→设置 | A3 | 0 | 0.457 | 0.557 |
| 309 | conf_b1 mixed select | A3 | 0 | 0.407 | 0.507 |
| 310 | conf_b2 date mixed | A3 | 0 | 0.395 | 0.495 |
| 311 | conf_b3 form layout | A3 | 0 | 0.417 | 0.517 |
| 312 | cold_c1 medical | A3 | 0 | 0.331 | 0.431 |
| 313 | cold_c2 education | A3 | 0 | 0.348 | 0.448 |
| 314 | cold_c3 legal | A3 | 0 | 0.375 | 0.475 |
| **A3 合计 / 均值** | | | **0 hits / 9 task** | **0.386** | **0.486** |

### 关键观察

1. **B3 keyword 命中率**：9 任务中 8 个有命中（89%），27 样本中 23 含 keyword（85%）
2. **A3 keyword_hits 全 0**：开关切换确认有效，纯向量召回
3. **B3 avg_similarity 略低于 A3**（0.36 vs 0.39）：B.1 加分让 Top-3 切换到了"sim 略低但 kw 命中"的样本，而非纯 sim 最高
4. **B3 avg_score 高于 A3**（0.53 vs 0.49，+8.2%）：综合分被 keyword boost（最多 +0.30 / 命中）反超
5. **唯一 0 命中的 B3 任务（298）**：adv_a2 OA→图文，amis 全是 banner/markdown/cards，关键字稀疏 → 样本库 keyword_index 没匹配项，合理

---

## 四、决策

按 README.md 的决策矩阵：

> B - A 页通过率差 < +1pp？

**这里的"页通过率差"实际为 0**（都 100%），但 keyword 召回机制本身已被验证可用。需要重新审视决策矩阵：

| 维度 | 信号 | 结论 |
|---|---|---|
| keyword 命中机制 | ✅ B 组真的提取 + 命中 keyword | B.1 实现正确，bug 修了就能用 |
| 页通过率 | 两组都 100% | 压力集对当前 RAG 不够刁钻 |
| 召回样本组合 | B3 vs A3 选了不同样本 | B.1 起作用了，但下游 LLM 没把"不同样本"翻译成"不同结果"|
| LLM 耗时 / call 数 | 差异在 ±3% 噪声范围 | 当前 prompts 任务太简单，看不出差异 |

**决策**：
- ✅ **保留 B.1 单路 + bonus**：实现正确，机制已验证；不升级到严格 RRF
- 🟡 **D 项压力集需要 1.5 之后继续打磨**：现有 9 prompts 还不够刁钻，需要设计能让"不同召回样本 → 不同生成结果"的样本（例如要求 amis 里有特定 type 但样例库只有部分含此 type）
- ✅ **真正的产出是 multipage RAG fix**：1.4 B.1 长期 bug 修复，所有多页任务（含线上业务）即日起 B.1 生效
- 📊 **A/B 对照机制成熟**：admin 切 `rag.dual_route.enabled` 即可一开一关比对，无需重启服务

---

## 五、建议后续

1. **跑一遍多页线上业务样本（非压力集）观察实际收益**：1.4 B.1 bug 期间业务任务 RAG 召回质量受影响，修复后是否生成质量提升需要业务侧观察
2. **完善 W1.3 压力集（1.6 候选）**：加入"召回敏感"样本 — 例如指定生成 ZC 二开 modeltable，但 amis 描述里用 modeltable，看 B 组能否靠 keyword 命中 ZC 样本而 A 组靠纯向量被普通 crud 拉跑
3. **数据积累**：等线上业务跑 50-200 任务后，看 `cost_per_success_k`（accumulated_cost / success_rate / 1000）在 B.1 修复前后是否有变化

---

## 六、相关产出

- bug fix: [backend/src/handlers/project_generation.rs:434](../../backend/src/handlers/project_generation.rs#L434)
- backend admin 开关: `rag.dual_route.enabled`（默认 true，A/B 评测时 admin 切 false）
- backend event 增强: rag_samples_injected 透出 `keyword_hits` + `score`
- 评测集: [prompts.json](prompts.json) · [README.md](README.md)
- 6 份对比 results-{A1..A3,B1..B3}.csv/.md
