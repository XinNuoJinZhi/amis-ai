-- ==============================================================
-- amis-ai 2026-04 技术栈解耦重构：DB 变更 + Rollback 脚本
-- ==============================================================
-- 本文件提供两套 SQL 命令：
--   1. forward.sql（上线时 backend 启动会自动做一次，这里的 SQL 仅供查阅/手工补跑）
--   2. rollback.sql（紧急退回时执行，会保留旧 tech_stack / ui_library 数据）
--
-- 重要规则：
--   - 所有 DROP 都使用 IF EXISTS，幂等
--   - 旧 tech_stack / ui_library 单值列**不删**，Phase 4.4 才正式 deprecated
--   - 向量列不动（pgvector 兼容不受影响）
--
-- 使用方式（影子库验证）：
--   psql -d amis_ai_shadow -f shared/scripts/migrate-dims.sql
--   (默认只执行 rollback 段；如果要重放 forward 请先把 rollback 段注释掉)
--

-- ---------- forward.sql（一致性复制自 backend/src/main.rs 启动 migration） ----------

-- code_samples 加 4 个 text[] 列 + GIN 索引
ALTER TABLE code_samples
  ADD COLUMN IF NOT EXISTS platforms   text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS tech_stacks text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS ui_libs     text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS tags        text[] NOT NULL DEFAULT '{}';

UPDATE code_samples
   SET tech_stacks = ARRAY[tech_stack]
 WHERE tech_stacks = '{}' AND tech_stack IS NOT NULL AND tech_stack <> '';

UPDATE code_samples SET platforms = CASE
  WHEN tech_stack LIKE 'uniapp%' OR tech_stack LIKE 'rn-%' THEN ARRAY['mobile']
  WHEN tech_stack LIKE 'react%' OR tech_stack LIKE 'vue%'  THEN ARRAY['web']
  ELSE ARRAY[]::text[]
END WHERE platforms = '{}' AND tech_stack IS NOT NULL;

UPDATE code_samples SET ui_libs = CASE
  WHEN tech_stack = 'uniapp-wot-h5'       THEN ARRAY['wot']
  WHEN tech_stack LIKE '%-antd'           THEN ARRAY['antd']
  WHEN tech_stack LIKE '%-element'        THEN ARRAY['element-plus']
  WHEN tech_stack LIKE '%-element-plus'   THEN ARRAY['element-plus']
  ELSE ARRAY[]::text[]
END WHERE ui_libs = '{}' AND tech_stack IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_code_samples_platforms   ON code_samples USING GIN (platforms);
CREATE INDEX IF NOT EXISTS idx_code_samples_tech_stacks ON code_samples USING GIN (tech_stacks);
CREATE INDEX IF NOT EXISTS idx_code_samples_ui_libs     ON code_samples USING GIN (ui_libs);
CREATE INDEX IF NOT EXISTS idx_code_samples_tags        ON code_samples USING GIN (tags);

-- 1.4 B.1：keyword_index 列 + GIN（双路召回的精确侧；入库时由
-- agent/src/services/keyword_extractor.py 从 amis_json 提取 type/subType/api 关键字）
ALTER TABLE code_samples
  ADD COLUMN IF NOT EXISTS keyword_index text[] NOT NULL DEFAULT '{}';
CREATE INDEX IF NOT EXISTS idx_code_samples_keyword_index ON code_samples USING GIN (keyword_index);

-- project_generation_task 加多维字段
ALTER TABLE project_generation_task
  ADD COLUMN IF NOT EXISTS platform               VARCHAR(32) NOT NULL DEFAULT 'mobile',
  ADD COLUMN IF NOT EXISTS template_name          VARCHAR(64),
  ADD COLUMN IF NOT EXISTS selected_skill_buckets text[]     NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS platforms              text[]     NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS tech_stacks            text[]     NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS ui_libs                text[]     NOT NULL DEFAULT '{}';

UPDATE project_generation_task SET
  platform      = CASE WHEN tech_stack LIKE 'uniapp%' THEN 'mobile' ELSE 'web' END,
  template_name = CASE WHEN template_name IS NULL THEN CONCAT(tech_stack, '-template') ELSE template_name END,
  tech_stacks   = ARRAY[tech_stack],
  ui_libs       = ARRAY[ui_library],
  platforms     = CASE WHEN tech_stack LIKE 'uniapp%' THEN ARRAY['mobile'] ELSE ARRAY['web'] END
WHERE tech_stacks = '{}' AND tech_stack IS NOT NULL;


-- ---------- rollback.sql（紧急回滚时运行） ----------
--
-- 下面每条语句都是 "DROP IF EXISTS"，幂等可重跑。
-- 旧 tech_stack / ui_library 单值列保留——不做退级数据损失。
--

-- code_samples
DROP INDEX IF EXISTS idx_code_samples_platforms;
DROP INDEX IF EXISTS idx_code_samples_tech_stacks;
DROP INDEX IF EXISTS idx_code_samples_ui_libs;
DROP INDEX IF EXISTS idx_code_samples_tags;
DROP INDEX IF EXISTS idx_code_samples_keyword_index;
ALTER TABLE code_samples DROP COLUMN IF EXISTS platforms;
ALTER TABLE code_samples DROP COLUMN IF EXISTS tech_stacks;
ALTER TABLE code_samples DROP COLUMN IF EXISTS ui_libs;
ALTER TABLE code_samples DROP COLUMN IF EXISTS tags;
ALTER TABLE code_samples DROP COLUMN IF EXISTS keyword_index;

-- project_generation_task
ALTER TABLE project_generation_task DROP COLUMN IF EXISTS platform;
ALTER TABLE project_generation_task DROP COLUMN IF EXISTS template_name;
ALTER TABLE project_generation_task DROP COLUMN IF EXISTS selected_skill_buckets;
ALTER TABLE project_generation_task DROP COLUMN IF EXISTS platforms;
ALTER TABLE project_generation_task DROP COLUMN IF EXISTS tech_stacks;
ALTER TABLE project_generation_task DROP COLUMN IF EXISTS ui_libs;

-- 验证：
--   \d+ code_samples
--   \d+ project_generation_task
--   SELECT column_name FROM information_schema.columns
--     WHERE table_name IN ('code_samples', 'project_generation_task')
--     ORDER BY table_name, ordinal_position;
