# 技术栈解耦迁移手册（2026-04）

本文件记录 amis-ai 从「uniapp-wot-h5 单一直通路」向「platform × tech_stack × ui_lib × template 四维可组合」
重构的产物、兼容策略，以及**什么时候可以真正删除旧列**的前置条件。

## 一、产物总览（已交付）

| 层 | 变更 | 关键文件 |
|---|---|---|
| DB | `code_samples` / `project_generation_task` 各加 4 / 6 个 `text[]` 列 + 4 个 GIN 索引；旧单值列保留 | [backend/src/main.rs](../backend/src/main.rs), [shared/scripts/migrate-dims.sql](../shared/scripts/migrate-dims.sql) |
| Skills | 13 个桶（新 11 维度桶 + `_common` 改 kind: common + `uniapp-wot-h5` 改 kind: legacy） | [skills/](../skills/) |
| 模板注册表 | `scaffolds/registry.yaml`（3 条：uniapp-wot-h5-template、react-antd-vite-template、`__blank__` 伪模板） + `backend/src/services/template_registry.rs` | [scaffolds/registry.yaml](../scaffolds/registry.yaml) |
| Registry API | 4 个新端点 `/api/registry/{platforms,templates,skills,resolve-skills}` | [backend/src/handlers/registry.rs](../backend/src/handlers/registry.rs) |
| claw-agent-server | `TaskSkillContext` 多维选桶 + v2 算法（含 requires 递归、conflicts 按 priority 裁决）+ **完全解封硬锁**（`is_locked_scaffold_file` 永远返回 false） | [claw-code/rust/crates/claw-agent-server/src/skills.rs](../claw-code/rust/crates/claw-agent-server/src/skills.rs), [tool_executor.rs](../claw-code/rust/crates/claw-agent-server/src/tool_executor.rs) |
| sandbox | `Sandbox.dev_command` 参数化；backend 按模板下发命令 | [sandbox/src/handlers.rs](../sandbox/src/handlers.rs), [sandbox/src/state.rs](../sandbox/src/state.rs) |
| backend | `CreateTaskPayload` 多维字段 + 双写；`build_initial_prompt` 软约束；`fetch_rag_extra_sections` / `adopt_task` 传多维标签 | [backend/src/handlers/project_generation.rs](../backend/src/handlers/project_generation.rs) |
| Python agent | `search_code_samples` 加权查询（cos_sim + tag_boost，OR 命中） | [agent/src/services/rag.py](../agent/src/services/rag.py), [agent/src/routers/internal.py](../agent/src/routers/internal.py) |
| 前端 | CreateTaskModal 四维级联 + Skills 预览；CodeSamplesHome 三色 Tag；SkillAuthoringWizard 命名指引 | [frontend/src/views/](../frontend/src/views/) |
| 脚手架 | 新增 `scaffolds/react-antd-vite-template/`（7 文件可直接 `pnpm install && pnpm run dev`） | [scaffolds/react-antd-vite-template/](../scaffolds/react-antd-vite-template/) |
| 冒烟 | `shared/scripts/smoke-test.sh` 追加 Section 10（5 条 Registry + resolve-skills 用例） | [shared/scripts/smoke-test.sh](../shared/scripts/smoke-test.sh) |
| 启动脚本 | `start-services.sh` 支持 auto-rebuild（按 mtime 判断）+ `--rebuild` / `--no-rebuild` 开关 | [shared/scripts/start-services.sh](../shared/scripts/start-services.sh) |

## 二、兼容策略速查

**读（query）**：
- `code_samples.tech_stack` / `project_generation_task.tech_stack` / `project_generation_task.ui_library` 仍然保留**数据**
- backend 大部分查询走 SeaORM entity（entity 未加新字段），新数组列仅在原生 SQL 处读写
- Python RAG 检索同时用数组标签 + 兼容 legacy 单字符串字段

**写（insert/update）**：
- backend 双写：`project_generation_task` 老单值列写入 `tech_stacks[0]` / `ui_libs[0]`；新数组列走原生 UPDATE
- `code_samples` adopt 时从 task copy 四维数组 + `tags`（`template:<name>` + `source:task-<id>`）

**前端 → backend payload**：
- 新前端（2026-04 起）**只发** `platform / tech_stacks / ui_libs / template_name / explicit_buckets`
- 老客户端 / 脚本 / Postman 仍可发 `tech_stack / ui_library` 单字符串，backend 保底兼容
- `CreateTaskPayload.tech_stack` / `ui_library` 的 Rust 结构标 `DEPRECATED` 注释
- `CreateProjectTaskPayload.tech_stack` / `ui_library` TS 类型标 `@deprecated` JSDoc

## 三、真正 DROP 旧列的前置条件（下一轮）

**不要立即 DROP**。等以下条件**全部满足**再执行 `shared/scripts/migrate-dims-drop-legacy.sql`（暂缺，等到时再写）：

1. **生产运行 ≥ 20 天**：确保没有老客户端 / 旧 cron / 外部集成还在依赖老列
2. **grep 全仓无读取路径**：`grep -r "payload.tech_stack\b\|CodeSample.*tech_stack:" backend/src/` 必须为空（或只剩 Phase 4.4 deprecated 注释段）
3. **冒烟对"只发新字段"的请求连续 3 天通过**：smoke-test Section 10 + 常规 7 + 9 全绿
4. **用户自己手动跑** `SELECT tech_stack, tech_stacks FROM code_samples WHERE tech_stacks = '{}' LIMIT 50` 无命中：确保回填 SQL 覆盖了所有历史行

满足后执行 `migrate-dims-drop-legacy.sql`（建议形态）：
```sql
ALTER TABLE code_samples DROP COLUMN tech_stack;
ALTER TABLE project_generation_task DROP COLUMN tech_stack;
ALTER TABLE project_generation_task DROP COLUMN ui_library;
DROP INDEX IF EXISTS idx_code_samples_stack_status;  -- 老单值组合索引
```

同时同步删除：
- `backend/src/entity/code_sample.rs` 的 `tech_stack` 字段
- `backend/src/entity/project_generation_task.rs` 的 `tech_stack` / `ui_library` 字段
- `CreateTaskPayload` 的 `tech_stack` / `ui_library` Optional 字段 + 前端 TS 类型对应项
- Python `SearchCodeSamplesRequest.tech_stack` 字段 + rag.py `legacy_tech_stack` 参数

## 四、紧急回滚

如果上线后需要**完全退回**到解耦前的状态：

```bash
# 1. 停服
./shared/scripts/start-services.sh stop

# 2. 回滚 DB（删除所有新列 + 新索引，保留旧单值列数据）
psql -d amis_ai -f shared/scripts/migrate-dims.sql
# 注意：该脚本会先跑一次 forward（幂等无副作用），再跑 rollback；
# 如果只想单向 rollback，请手工截取文件后半段执行

# 3. 回滚代码
git checkout <pre-2026-04 commit>

# 4. cargo build + 重启
./shared/scripts/start-services.sh start --rebuild
```

## 五、相关文档

- 原实施计划：`/home/karl/.claude/plans/uniapp-wot-h5-skills-rag-ui-ui-web-reac-dreamy-clarke.md`
- 项目总览：[CLAUDE.md](../CLAUDE.md)
- 回归清单：[docs/regression-checklist.md](regression-checklist.md)
- 冒烟脚本：[shared/scripts/smoke-test.sh](../shared/scripts/smoke-test.sh)
