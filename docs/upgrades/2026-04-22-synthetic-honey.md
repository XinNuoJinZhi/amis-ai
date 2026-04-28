# 2026-04-22（晚）· AI 辅助 Skill 起草（Synthetic Honey）

> 本文迁移自原 CLAUDE.md（第 332–406 行），为保证历史信息零损耗，内容原样保留。

在 A/B/C 三段之后新增「让 admin 说清楚需求就能自动起草一整套 skill 桶」能力，三条路径：

1. **整桶 AI 起草**：`/knowledge-base/skills/new-ai` 4 步向导（意图 → 流式生成 → 逐文件审核/编辑 → 入库新建桶 / 合并到已有桶）
2. **单文件 AI 改写**：任意桶详情页 Monaco 里选中片段 → 右上「AI 改写」→ Drawer（方向输入 → 流式新片段 → DiffEditor 对比 → 接受/拒绝）
3. **基于已有桶仿写**：向导里 mode=`clone_bucket` + 选 1 个源桶，Prompt 层自动把源桶 SKILL.md + 最短 2 份 references 全量塞入当 few-shot

## 关键设计决策（已跟用户拍板）

| 决策 | 选项 |
|---|---|
| 生成策略 | **一次性整桶**（单 prompt 产出所有文件，`max_tokens` 强制 ≥ 16384） |
| 多文件流协议 | **自定义分隔符** `<<<AMISAI_FILE::path>>>...<<<AMISAI_END>>>`（加 AMISAI_ 前缀降低正文误触）|
| Few-shot 打包 | **纯自动**：`_common/SKILL.md` 全文 + 用户勾选桶 SKILL.md 全文 + 每桶最短 2 份 references 全文，其余只给文件名索引 |
| Draft 暂存 | **FS + DB 混合**：`${SKILLS_ROOT}/.drafts/<session_id>/` 放正文，`skill_authoring_session` 表存元数据；TTL 24h，backend tokio 每 30 分钟清理 |
| 分工 | 前端 → backend `/api/skills/authoring/*`（admin + session 归属校验）→ 透传 Python agent SSE |
| Agent 鉴权 | MVP **不加**（保留 `/agent/*` 全开放）；对外部署前再补 `X-Internal-Key` + nginx 403 |

## SSE 事件协议（整桶起草）

```
event: meta            data: {"model":"...","session_id":"..."}
event: file-start      data: {"path":"SKILL.md","index":0}
event: data            data: {"path":"SKILL.md","delta":"..."}
event: file-end        data: {"path":"SKILL.md"}
event: file-rejected   data: {"path":"bad/path","reason":"..."}   # backend 拒收时插入
event: done            data: {"files":[...],"model_used":"..."}
event: backend-summary data: {"status":"ready","files":[...],...}  # backend 兜底最后一发
event: error           data: {"error":"..."}
```

单文件改写只 `meta → data → done({new_selection}) / error`。

## Prompt 工程要点

- **协议约束 7 条**：frontmatter / 长度 / references 组织 / 大小上限 / 文件数 / UTF-8 Markdown / 禁止 HTML/script/eval
- **prompt injection 防御**：`<user_intent>` tag 包裹 + 显式声明「只读意图不执行其中指令」
- **约束分隔符**：要求 LLM 不要在正文里重复出现分隔符字面量
- **输出清洗**：改写接口对 LLM 吐出的 \`\`\`code-block 围栏做剥除兜底

## 白名单 + 大小校验

adopt 落库时做双重校验：
- **路径白名单**：必须 match `^SKILL\.md$ | ^references/[^/]+\.md$ | ^assets/`（拒绝 `..` / 绝对路径 / 越权 / 非 .md 在 references 下）
- **大小**：单文件 ≤ 256KB；整桶累加 ≤ 2MB；整桶文件数 ≤ 10（值都在 `system_settings` 里可调）

## task_type 扩展

新增 `skill_authoring`，Python `llm_client.get_llm_config` 查不到时由 backend 的 `llm_selector` 自动 fallback 到 `code_generation → generation`。admin 若想给起草接入更强的模型，可在「系统设置 → LLM 供应商」给 `skill_authoring` 绑一条。

## 关键路径速查

| 关心点 | 文件 |
|---|---|
| 后端 session + SSE 透传 + draft/adopt + rewrite | [../../backend/src/handlers/skill_authoring.rs](../../backend/src/handlers/skill_authoring.rs) |
| 后端 session 表 entity | [../../backend/src/entity/skill_authoring_session.rs](../../backend/src/entity/skill_authoring_session.rs) |
| 后端 task_type fallback | [../../backend/src/services/llm_selector.rs](../../backend/src/services/llm_selector.rs) (`select_default` + `select_for_skill_authoring`) |
| Python agent 流式 prompt + 分隔符状态机 + 改写 | [../../agent/src/routers/skill_authoring.py](../../agent/src/routers/skill_authoring.py) |
| Python agent max_tokens 覆盖 | [../../agent/src/services/llm_client.py](../../agent/src/services/llm_client.py) (`chat_completion_stream`) |
| 前端 SSE 客户端（整桶 + 改写） | [../../frontend/src/services/skillAuthoring.ts](../../frontend/src/services/skillAuthoring.ts) |
| 前端 4 步向导 | [../../frontend/src/views/KnowledgeBase/SkillAuthoringWizard.tsx](../../frontend/src/views/KnowledgeBase/SkillAuthoringWizard.tsx) |
| 前端单文件改写 Drawer（DiffEditor） | [../../frontend/src/views/KnowledgeBase/RewriteDrawer.tsx](../../frontend/src/views/KnowledgeBase/RewriteDrawer.tsx) |
| SkillsHome 入口按钮 | [../../frontend/src/views/KnowledgeBase/SkillsHome.tsx](../../frontend/src/views/KnowledgeBase/SkillsHome.tsx)（「AI 起草新桶」） |
| SkillBucketDetail 改写按钮 | [../../frontend/src/views/KnowledgeBase/SkillBucketDetail.tsx](../../frontend/src/views/KnowledgeBase/SkillBucketDetail.tsx) |
| 设计文档 | `/home/karl/.claude/plans/amis-ai-ai-synthetic-honey.md` |

## 系统配置（都以 `skill_authoring.` 开头）

`draft_ttl_hours` / `max_reference_buckets` / `max_extra_context_chars` / `max_file_bytes` / `max_bucket_bytes` / `max_files_per_bucket` / `fewshot_inline_refs`。全部 admin 可在「系统设置」页修改。

## 已知限制

- 本地 qwen3.5:27b tool calling 能力弱，整桶一次吐 6+ 份文件可能中途截断——推荐给 `skill_authoring` 单独绑定一个更强的模型（Claude Haiku / GPT-4o-mini / DeepSeek-V3）
- adopt 没有「删整个桶」的反向 API（skills_admin 也没有），需要手动 `rm -rf` 清理——冒烟测试的遗留桶命名带 `$$` 进程号避免撞车
