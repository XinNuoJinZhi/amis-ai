#!/usr/bin/env bash
# R3 后处理重构 e2e：3 页任务，等 90s（各页 60s + 重构 30s）
#
# 前置：同 test_e2e_r4.sh
#
# 用法：
#   TEST_ADMIN_JWT=<jwt> ./eval/multipage-1.2/test_e2e_r3.sh

set -euo pipefail

TOKEN="${TEST_ADMIN_JWT:?需要管理员 JWT, export TEST_ADMIN_JWT=...}"
API="${API_BASE:-http://localhost:8080/api}"

RESP=$(curl -s -X POST "$API/projects/tasks" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d @- <<EOF
{
  "title": "e2e r3 refactor 3 pages",
  "amis_json": "{}",
  "tech_stack": "uniapp-wot-h5",
  "execution_strategy": "isolated",
  "reuse_strategy": "r3_refactor",
  "pages": [
    {"amis_json": "{\"type\":\"page\",\"title\":\"首页\"}", "route_path": "/"},
    {"amis_json": "{\"type\":\"crud\",\"title\":\"列表\"}", "route_path": "/list"},
    {"amis_json": "{\"type\":\"form\",\"title\":\"表单\"}"}
  ]
}
EOF
)
TASK_ID=$(echo "$RESP" | jq -r '.task_id // .id')
[ -n "$TASK_ID" ] && [ "$TASK_ID" != "null" ] || { echo "❌ create 失败: $RESP"; exit 1; }
echo "Task created: $TASK_ID"

sleep 90

PAGES=$(curl -s "$API/projects/tasks/$TASK_ID/db-pages" -H "Authorization: Bearer $TOKEN")
DONE=$(echo "$PAGES" | jq '[.[] | select(.status=="done")] | length')
[ "$DONE" -ge 3 ] || { echo "❌ 3 页 done 失败：$DONE/3"; exit 1; }
echo "✅ 3 页全 done"

# R3 特性：refactor session 应该有事件
EVENTS=$(curl -s "$API/projects/tasks/$TASK_ID/events/history" -H "Authorization: Bearer $TOKEN")
REFACTOR_DONE=$(echo "$EVENTS" | jq '[.[] | select(.event_type=="refactor_done")] | length')
[ "$REFACTOR_DONE" -ge 1 ] || { echo "❌ refactor_done 缺失"; exit 1; }
echo "✅ refactor session 完成"

# 复用率：R3 的 refactor session 应抽出 shared/，复用率 ≥ 0.5
TASK=$(curl -s "$API/projects/tasks/$TASK_ID" -H "Authorization: Bearer $TOKEN")
WORKDIR=$(echo "$TASK" | jq -r '.workdir_path // empty')
if [ -n "$WORKDIR" ] && [ -d "$WORKDIR/src/pages" ]; then
  IMPORT_COUNT=$(grep -rE "import .* from\s+['\"](\.\.?/)+(components|styles|api|store|utils)/" "$WORKDIR/src/pages" 2>/dev/null | wc -l)
  TOTAL=$(find "$WORKDIR/src/pages" -name '*.vue' 2>/dev/null | wc -l)
  if [ "$TOTAL" -gt 0 ]; then
    RATE=$(awk "BEGIN { printf \"%.2f\", $IMPORT_COUNT / $TOTAL }")
    echo "ℹ️ R3 复用率（重构后）：$RATE"
  fi
fi
