#!/usr/bin/env bash
#
# 一键生成 C 项 baseline 快照（amis-ai 1.6 起）
#
# 用法：
#   ./shared/scripts/gen-baseline.sh                       # 生成 docs/upgrades/baseline-<today>.md
#   ./shared/scripts/gen-baseline.sh evening               # 生成 docs/upgrades/baseline-<today>-evening.md（同日二快照）
#   ./shared/scripts/gen-baseline.sh 2026-05-20            # 生成指定日期的（手工补档）
#
# 模板源：docs/upgrades/2026-05-13-1.6-c-data-baseline.md §SQL 清单
# 每段 SQL 输出表格化 markdown，结果直接写到 docs/upgrades/baseline-YYYY-MM-DD[-suffix].md

set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
OUT_DIR="$ROOT/docs/upgrades"
TODAY=$(date +%Y-%m-%d)

# 解析参数：第 1 位可以是 suffix（如 evening）或完整日期（YYYY-MM-DD）
SUFFIX=""
TARGET_DATE="$TODAY"
if [[ -n "${1:-}" ]]; then
  if [[ "$1" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ ]]; then
    TARGET_DATE="$1"
  else
    SUFFIX="-$1"
  fi
fi
OUT_FILE="$OUT_DIR/baseline-${TARGET_DATE}${SUFFIX}.md"

PGENV=( "PGPASSWORD=${PGPASSWORD:-amis_ai_dev}" )
PGCMD=( psql -h "${PGHOST:-localhost}" -U "${PGUSER:-amis_ai}" -d "${PGDATABASE:-amis_ai}" --pset=footer=off --pset=tuples_only=off -A -F'|' )

run_sql() {
  env "${PGENV[@]}" "${PGCMD[@]}" -c "$1"
}

# 把 psql `-A -F'|'` 的输出转 markdown 表格
to_md_table() {
  awk -F'|' '
    NR==1 { for (i=1;i<=NF;i++) printf "| %s ", $i; print "|"; for (i=1;i<=NF;i++) printf "|---"; print "|"; next }
    { for (i=1;i<=NF;i++) printf "| %s ", $i; print "|" }
  '
}

cat > "$OUT_FILE" <<EOF
# C 项 · baseline 快照 · $TARGET_DATE${SUFFIX}

> **生成方式**：\`./shared/scripts/gen-baseline.sh${1:+ $1}\`
> **数据窗口**：30 天滚动
> **采集时间**：$(date '+%Y-%m-%d %H:%M:%S')
> **当前 calibration_factor**：$(run_sql "SELECT value FROM system_settings WHERE key='llm.quota.estimate_calibration_factor';" | tail -1)
> **当前 dual_route**：$(run_sql "SELECT value FROM system_settings WHERE key='rag.dual_route.enabled';" | tail -1)
> **当前 page_mode**：$(run_sql "SELECT value FROM system_settings WHERE key='rag.judge.page_mode';" | tail -1)
> **当前 auto_page_negative**：$(run_sql "SELECT value FROM system_settings WHERE key='rag.judge.auto_page_negative';" | tail -1)

---

## Q0 · 总览

EOF

run_sql "SELECT
  COUNT(*) AS total_30d,
  COUNT(*) FILTER (WHERE status='succeeded') AS succ_30d,
  COUNT(*) FILTER (WHERE status='failed') AS fail_30d,
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') AS last_7d,
  COUNT(DISTINCT category) AS distinct_cat
FROM project_generation_task
WHERE created_at >= NOW() - INTERVAL '30 days';" | to_md_table >> "$OUT_FILE"

cat >> "$OUT_FILE" <<'EOF'

---

## Q1 · category × score 分布（30 天）

EOF

run_sql "SELECT
  COALESCE(category, '__null__') AS category,
  COUNT(*) AS task_count,
  COUNT(*) FILTER (WHERE status = 'succeeded') AS succeeded,
  COUNT(*) FILTER (WHERE status = 'failed') AS failed,
  COUNT(*) FILTER (WHERE actual_cost_tokens IS NOT NULL) AS has_actual_cost
FROM project_generation_task
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY 1
ORDER BY task_count DESC
LIMIT 20;" | to_md_table >> "$OUT_FILE"

cat >> "$OUT_FILE" <<'EOF'

---

## Q2 · actual_cost p50/p90/p99（succeeded only）

EOF

run_sql "SELECT
  COALESCE(category, '__null__') AS category,
  PERCENTILE_CONT(0.5)  WITHIN GROUP (ORDER BY actual_cost_tokens)::int AS p50,
  PERCENTILE_CONT(0.9)  WITHIN GROUP (ORDER BY actual_cost_tokens)::int AS p90,
  PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY actual_cost_tokens)::int AS p99,
  AVG(actual_cost_tokens)::int AS avg_cost,
  COUNT(*) AS n
FROM project_generation_task
WHERE actual_cost_tokens IS NOT NULL
  AND status = 'succeeded'
  AND created_at >= NOW() - INTERVAL '30 days'
GROUP BY 1
ORDER BY n DESC;" | to_md_table >> "$OUT_FILE"

cat >> "$OUT_FILE" <<'EOF'

---

## Q3 · estimate vs actual 比值（⭐ 关键：calibration 调参依据）

EOF

run_sql "SELECT
  COALESCE(category, '__null__') AS category,
  AVG(estimated_cost_tokens)::int AS avg_est,
  AVG(actual_cost_tokens)::int AS avg_act,
  ROUND(AVG(actual_cost_tokens::float / NULLIF(estimated_cost_tokens, 0))::numeric, 2) AS ratio,
  COUNT(*) AS n
FROM project_generation_task
WHERE estimated_cost_tokens IS NOT NULL
  AND actual_cost_tokens IS NOT NULL
  AND status = 'succeeded'
  AND created_at >= NOW() - INTERVAL '30 days'
GROUP BY 1
HAVING COUNT(*) >= 3
ORDER BY n DESC;" | to_md_table >> "$OUT_FILE"

cat >> "$OUT_FILE" <<'EOF'

**期望 ratio**：调 calibration=140 后应趋向 0.9-1.1（之前 200 时多数 0.5-0.76，估算虚高）。

---

## Q4 · ab_variant 分布

EOF

run_sql "SELECT
  COALESCE(ab_variant, '__null__') AS variant,
  COUNT(*) AS task_count,
  COUNT(*) FILTER (WHERE status = 'succeeded') AS succeeded,
  AVG(actual_cost_tokens)::int AS avg_cost
FROM project_generation_task
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY 1
ORDER BY task_count DESC;" | to_md_table >> "$OUT_FILE"

cat >> "$OUT_FILE" <<'EOF'

---

## Q5 · page verdict + 自动入库

### 5a · page_quality_verdict 分布（历史累计）

EOF

run_sql "SELECT
  COALESCE(page_quality_verdict, '__null__') AS verdict,
  COUNT(*) AS n,
  COUNT(*) FILTER (WHERE page_quality_judge_at >= NOW() - INTERVAL '7 days') AS last_7d
FROM project_task_page
WHERE page_quality_verdict IS NOT NULL
GROUP BY 1
ORDER BY n DESC;" | to_md_table >> "$OUT_FILE"

cat >> "$OUT_FILE" <<'EOF'

### 5b · code_samples 自动入库（source_page_id 不为空）

EOF

run_sql "SELECT
  COALESCE(status, '__null__') AS status,
  COUNT(*) AS n
FROM code_samples
WHERE source_page_id IS NOT NULL
GROUP BY 1
ORDER BY n DESC;" | to_md_table >> "$OUT_FILE"

cat >> "$OUT_FILE" <<'EOF'

---

## Q6 · 分类器命中率（最近 7 天 vs 30 天）

EOF

run_sql "SELECT
  '7d' AS window,
  COUNT(*) AS total,
  COUNT(*) FILTER (WHERE category IS NULL) AS null_cat,
  COUNT(*) FILTER (WHERE category = '__other__') AS other_cat,
  ROUND(100.0 * COUNT(*) FILTER (WHERE category IS NULL OR category = '__other__') / NULLIF(COUNT(*), 0), 1) AS null_other_pct
FROM project_generation_task
WHERE created_at >= NOW() - INTERVAL '7 days'
UNION ALL
SELECT
  '30d' AS window,
  COUNT(*),
  COUNT(*) FILTER (WHERE category IS NULL),
  COUNT(*) FILTER (WHERE category = '__other__'),
  ROUND(100.0 * COUNT(*) FILTER (WHERE category IS NULL OR category = '__other__') / NULLIF(COUNT(*), 0), 1)
FROM project_generation_task
WHERE created_at >= NOW() - INTERVAL '30 days';" | to_md_table >> "$OUT_FILE"

cat >> "$OUT_FILE" <<'EOF'

**期望趋势**：1.5 W1.1 分类器修复后，null+other 占比应持续下降（05-09 之前 100% → 05-11 后 47% → 目标 < 30%）。

---

## 决策提示

- 如 Q3 多数 ratio 偏离 0.9-1.1 太多 → 再调 `llm.quota.estimate_calibration_factor`
- 如 Q5b 长期 0 行 + Q5a 持续有 bad → 可考虑开 `rag.judge.auto_page_negative=true`（1% 灰度先）
- 如 Q6 7d null+other 仍 > 50% → 检查 LLM 分类器 prompt 是否 stale

EOF

echo "✅ baseline 已生成 → $OUT_FILE"
echo ""
echo "预览前 30 行："
echo "---"
head -30 "$OUT_FILE"
