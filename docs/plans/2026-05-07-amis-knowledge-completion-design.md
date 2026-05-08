# 1.1.0 设计 · Amis 知识双轨补全

> **状态**：设计稿（已与用户确认整体方案，待 spec review）
> **日期**：2026-05-07
> **目标版本**：amis-ai 1.1.0
> **路线图位置**：1.x 串行第一段（1.1 知识补全 → 1.2 多页面 → 1.3 ZC 融合）

## 1. 背景与目标

### 1.1 背景

amis-ai 1.0 封版后，正向飞轮（自然语言 → Amis JSON）的瓶颈集中在 **知识储备不足**：

- Skills 桶里 amis 相关知识总量约 594 行（[skills/_common/SKILL.md](../../skills/_common/SKILL.md) + 4 份 references），覆盖了概念 / 翻译铁律 / 顶层 type，但**缺乏组件级 schema 与示例**
- RAG `code_samples` 表当前**仅 2 条初始模板**（[agent/src/knowledge/loader.py](../../agent/src/knowledge/loader.py) 的 INITIAL_TEMPLATES），生产环境 0 条已批准样例
- Agent 在生成 amis JSON 时漏组件、属性写错、瞎编字段，根因即在此

### 1.2 目标

把 [baidu/amis](https://github.com/baidu/amis) 6.x 最新稳定 release 的全套知识补齐到 amis-ai 的 Skills/RAG 知识库，达成：

1. amis-core-schema 桶覆盖 ≥ 50 个组件 references
2. `code_samples` 表 amis-core 样例 ≥ 80 条
3. 固定 eval set（20 条 amis 生成任务）的 adopt_rate 相比 1.0 提升 ≥ +10pp
4. 上线后 2 周内，amis 任务的 thumbs_up_ratio ≥ 75%

### 1.3 非目标（明确 1.1 不做）

- 上游升级跟踪自动化（amis 升新版自动 diff 报告） → 排到 1.1.x patch
- 旧版本（amis 3.x / 4.x）兼容 → 等用户提需求再开 patch
- 多页面任务 → 1.2.0
- ZC Amis 扩展 → 1.3.0（融入主仓，参见 zc_amis_inline_decision 项目记忆）

## 2. 关键决策记录

| ID | 决策 | 备选 | 理由 |
|---|---|---|---|
| D1 | 双轨结合（文档 + 类型） | 仅文档 / 仅类型 | 文档喂例子 + 类型卡边界，防漏组件、防瞎编字段 |
| D2 | 分层兜底（高频精修 + 全量自动） | 全量精修 / 全自动 | 工期 4-5 周可控，深度广度双保 |
| D3 | amis 6.x 最新稳定 release 作基线 | 老版本兼容 | 1.0 面向新建项目，旧版本按需开 patch |
| D4 | 类型轨 → 新建 `skills/amis-core-schema/` 桶 | 扩 `_common` | 不爆永久注入预算 |
| D5 | 文档轨 → RAG `code_samples` 表 | 也进 Skills | RAG 检索已就绪、按需召回成本低 |
| D6 | 高频 18 组件走 AI 起草仿写 | 全部脚本批量 | 高频质量需要人工 review 把关 |
| D7 | 冷门 30+ 走脚本批量 + `status=auto_imported` | 全部人工 | 冷门组件 ROI 不值得人工 |
| D8 | 上游升级跟踪 1.1 不做 | 一并做 | amis 不是高频 breaking，月级跟踪足够 |

## 3. 架构总览

```
┌──────────────────────────── baidu/amis 6.x ──────────────────────────────┐
│   docs/zh-CN/components/*.md    +    packages/amis-core/src/types/*.ts   │
└──────────────┬─────────────────────────────────────┬─────────────────────┘
   文档轨 ↓                                                    类型轨 ↓
┌──────────────────────────────┐         ┌──────────────────────────────┐
│  parse_docs.py 切 .md →       │         │  Node + ts-morph 解析 →      │
│  组件示例 JSON + 说明          │         │  amis-schema.json (中间产物) │
└──────┬───────────────────┬───┘         └──────────┬───────────────────┘
       │ 高频 18           │ 冷门 30+               │ 全量 50+
       ↓                   ↓                       ↓
  AI 起草仿写       importer 自动直入      ingest_skills.py 写
  (人工 review)     code_samples           amis-core-schema/references/
       ↓                   ↓                       ↓
  RAG (status=approved) RAG (status=auto_imported)  Skills 桶（全量）
```

**双轨原则**：文档进 RAG（喂例子），类型进 Skills（卡边界）；agent 生成时双查。

## 4. 组件分解

### 4.1 后端 / 工具链

新增目录都落在 [agent/src/knowledge/](../../agent/src/knowledge/) 下，`amis_importer/`（Python 包）与 `amis_types_extractor/`（Node 子项目）平级，中间产物归档到同级 `amis_dump/`：

```
agent/src/knowledge/
├── amis_importer/          # Python 包
│   ├── __init__.py
│   ├── __main__.py         # CLI 入口
│   ├── clone.py
│   ├── parse_docs.py
│   ├── ingest_rag.py
│   └── ingest_skills.py
├── amis_types_extractor/   # Node 子项目（独立 package.json，本地依赖 ts-morph）
│   ├── package.json
│   ├── extractor.ts
│   └── README.md
└── amis_dump/              # 中间产物（提交到仓库）
    ├── amis-schema.json
    └── docs.json
```

| 组件 | 职责 |
|---|---|
| `amis_importer/clone.py` | git clone amis 到临时目录 + 版本 pin（配置 `amis_version`） |
| `amis_types_extractor/extractor.ts` | `ts-morph` 解析 `.ts` 接口，输出 `amis-schema.json` 到 `amis_dump/` |
| `amis_importer/parse_docs.py` | 切 markdown，抽组件名 / 示例 JSON / 属性段，输出到 `amis_dump/docs.json` |
| `amis_importer/ingest_rag.py` | 读 `amis_dump/docs.json` 灌 `code_samples`（`source_team=baidu-amis`、`tech_stack=amis-core`、`status` 区分人工/自动） |
| `amis_importer/ingest_skills.py` | 读 `amis_dump/amis-schema.json` 写 `skills/amis-core-schema/references/<comp>.md` |
| `amis_importer/__main__.py` | CLI 入口；支持 `--dry-run` / `--component <name>` / `--phase docs|types|both` |

### 4.2 Skills 桶

```
skills/amis-core-schema/
├── SKILL.md                       # 顶层概述：amis 6.x 全组件 schema 速查
└── references/
    ├── form.md                    # 表单容器属性表
    ├── crud.md                    # CRUD 列表属性表
    ├── select.md
    ├── dialog.md
    ├── ... (50+ 组件，类型轨自动生成)
```

### 4.3 评测资源

```
eval/amis-1.1/
├── prompts.json                   # 20 条固定 amis 生成任务
├── baseline-1.0.jsonl             # 1.0 基线跑分结果
└── 1.1.jsonl                      # 1.1 跑分结果（验收用）
```

### 4.4 前端

**前端零新增页面。** 复用：
- 高频起草：[SkillAuthoringWizard.tsx](../../frontend/src/views/KnowledgeBase/SkillAuthoringWizard.tsx) `mode=clone_bucket`，源桶选 `amis-core-schema/references/<comp>.md`（类型轨先填好作 few-shot）
- A/B 验收：[SystemSettings.tsx](../../frontend/src/views/Settings/SystemSettings.tsx) 的「RAG 飞轮 → A/B 对比报告」Modal
- 自动入库样例的视觉区分：`status=auto_imported` 的样例在 KnowledgeBase 列表用橙色 Badge（`status=approved` 仍然绿色）

## 5. 数据流

### 5.1 高频精修流（18 组件）

```
docs/.md → parse_docs.py 抽组件文档 → 注入 SkillAuthoringWizard few-shot
       → AI 流式输出 amis 示例 JSON + 说明 → 人工 review 接受
       → 写 code_samples 表（status=approved）
```

**高频组件清单**（18 个，覆盖 80% 用例）：
- 表单类（8）：`form` / `input-text` / `input-number` / `select` / `picker` / `checkboxes` / `radios` / `switch`
- CRUD 列表（4）：`crud` / `table` / `cards` / `list`
- 容器（4）：`page` / `dialog` / `wizard` / `tabs`
- 行动（2）：`button` / `action`

### 5.2 冷门 + 全量批量流（30+ 组件 + 全部类型）

```
clone.py 拉仓库 → Node extractor 出 amis-schema.json
       → parse_docs.py 出 docs.json
       → ingest_rag.py 灌 code_samples (status=auto_imported)
       → ingest_skills.py 写 amis-core-schema/references/*.md
```

importer 是幂等的：`ON CONFLICT (component_name, amis_version) DO UPDATE`，重跑安全。

### 5.3 中间产物归档

`amis-schema.json` / `docs.json` 落在 `agent/src/knowledge/amis_dump/` 并 **提交到仓库**，便于 review、回归对比、不必每次重跑解析。Importer 默认从 `amis_dump/` 读，传 `--rebuild-dump` 才重跑解析器。

## 6. 错误处理 / 边界

| 场景 | 处理 |
|---|---|
| `git clone baidu/amis` 失败 | retry 3 次 + 离线 tarball fallback；最终失败时 importer 退出码非 0，不污染已有数据 |
| TS 类型噪声（union / 泛型 / intersection） | 渐进策略：扁平 props 抽属性表，复杂类型保留 raw 字段在 references 末尾「⚠️ 需人工补充」段 |
| markdown 切分失败（组件文档结构异常） | 跳过该组件，写入 `import-errors.json`，不影响其他组件 |
| 重复入库 | 用 `(component_name, amis_version)` 联合主键 upsert；Skills 桶用 `git status` diff 报告新增/修改 |
| WSL 代理拦截 git clone | importer 启动时 unset `http_proxy`/`HTTPS_PROXY`（与 start-services.sh 一致） |
| AI 起草输出 JSON 不合法 | SkillAuthoringWizard 已有 frontmatter / 长度 / 大小 7 条 prompt 约束；review 阶段人工二次把关 |

## 7. 测试策略

### 7.1 单元测试

测试落在 `agent/tests/knowledge/`：

- `test_parse_types.py`：覆盖 form / crud / select / dialog 4 个代表组件的 schema 解析
- `test_parse_docs.py`：覆盖同上 4 组件的 markdown 切分
- `test_ingest_idempotent.py`：连跑 importer 两次，断言 DB / FS 状态不变（mock pgvector + 临时 Skills 目录）

Node 解析器单测落在 `agent/src/knowledge/amis_types_extractor/__tests__/`，用 `vitest` 跑（与项目其他 Node 工具一致，避免引入 jest）。

### 7.2 集成测试

- `amis_importer --dry-run`：跑完只输出报告（拟新增 / 拟更新 / 错误清单），不写 DB / FS
- 在 CI 跑 dry-run 确保解析器不退化

### 7.3 验收门槛（同 § 1.2 目标）

| 门槛 | 度量 | 达标值 |
|---|---|---|
| 覆盖度 | `amis-core-schema/references/` 文件数 | ≥ 50 |
| 覆盖度 | `code_samples` 表 `tech_stack=amis-core` 样例数 | ≥ 80 |
| 效果 | eval set adopt_rate（vs 1.0 基线） | +10pp |
| 效果 | eval set fail_rate | 不上升 |
| 质量 | 上线 2 周内 amis 任务 thumbs_up_ratio | ≥ 75% |

不达标处理：延期 1 周补样例 / 调 prompt；连续两次不达标 → 升级到方案重审。

## 8. 排期

| 周 | 主线 |
|---|---|
| W1 | clone.py / Node 解析器 / parse_docs.py 骨架 + 单元测试 |
| W2 | ingest_rag + ingest_skills 落 amis-core-schema 桶（全量 50+ 类型轨完成） |
| W3 | 高频 18 组件 AI 起草精修，人工 review 入库 |
| W4 | 冷门 30+ 自动批量灌入；eval set + A/B 跑分；上线灰度 |
| W5 | 验收门槛达标 → tag v1.1.0；不达标延 1 周补样例 |

**总工期 ~4-5 周**。

## 9. 风险与备选

| 风险 | 概率 | 影响 | 备选 |
|---|---|---|---|
| amis docs 结构非标准导致 markdown 切分崩 | 中 | 高 | 切分失败的组件回退到 raw markdown 整段灌入 RAG，不阻塞流程 |
| ts-morph 解析复杂泛型/条件类型不充分 | 中 | 中 | "需人工补充" 段落兜底；后续单独发起类型解析器迭代任务 |
| AI 起草人工 review 工时超估 | 中 | 中 | 高频清单从 18 砍到 12（必须含 form/crud/select/dialog） |
| 上线后 thumbs_up_ratio 不达 75% | 低 | 高 | 延期 1 周补高频样例；触发 RAG Phase 2 LLM 评委兜底 |
| amis 6.x 主分支期间发版 | 低 | 低 | 版本 pin 到 commit sha，不随主分支移动 |

## 10. Backlog（1.1 不做，留待后续）

- **上游升级跟踪自动化**：每月跑 importer 比对新版本 diff，自动出"新增 / 删除组件"报告 → 1.1.x patch
- **类型解析器迭代**：复杂泛型 / 条件类型的精确解析 → 1.1.x patch 或独立小项目
- **多版本兼容**：amis 3.x / 4.x 的 schema 并存 → 待用户提需求再开
- **跨语言适配 references**：每个 amis 组件 → React/Vue/UniApp 各栈映射表 → 与 1.2 多页面合并考量

## 11. 引用

- 项目记忆（仓库外，AI 助手专用）：`roadmap_1_x.md` / `zc_amis_inline_decision.md`（位于 `~/.claude/projects/-home-karl-Working-TianXing-amis-ai/memory/`，git 不跟踪）
- 相关升级文档：
  - [Skills 标准协议 + RAG 飞轮](../upgrades/2026-04-22-knowledge-rag-plugins.md)
  - [AI 辅助 Skill 起草](../upgrades/2026-04-22-synthetic-honey.md)
  - [RAG 质量闭环](../upgrades/2026-04-25-rag-quality-loop.md)
- baidu/amis 仓库：https://github.com/baidu/amis
- amis 文档站：https://aisuda.bce.baidu.com/amis/zh-CN/docs
