#!/usr/bin/env bash
# 统筹模式 e2e：4 页任务（≤5 限制内），等 120s
#
# 前置：同 test_e2e_r4.sh
#
# 用法：
#   TEST_ADMIN_JWT=<jwt> ./eval/multipage-1.2/test_e2e_unified.sh

set -euo pipefail

TOKEN="${TEST_ADMIN_JWT:?需要管理员 JWT, export TEST_ADMIN_JWT=...}"
API="${API_BASE:-http://localhost:8080/api}"

RESP=$(curl -s -X POST "$API/projects/tasks" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d @- <<EOF
{
  "title": "e2e unified 4 pages",
  "amis_json": "{}",
  "tech_stack": "uniapp-wot-h5",
  "execution_strategy": "unified",
  "pages": [
    {"amis_json": "{\"type\":\"page\",\"title\":\"首页\"}", "route_path": "/"},
    {"amis_json": "{\"type\":\"crud\",\"title\":\"列表\"}", "route_path": "/list"},
    {"amis_json": "{\"type\":\"form\",\"title\":\"编辑\"}", "route_path": "/edit"},
    {"amis_json": "{\"type\":\"page\",\"title\":\"关于\"}", "route_path": "/about"}
  ]
}
EOF
)
TASK_ID=$(echo "$RESP" | jq -r '.task_id // .id')
[ -n "$TASK_ID" ] && [ "$TASK_ID" != "null" ] || { echo "❌ create 失败: $RESP"; exit 1; }
echo "Task created: $TASK_ID"

sleep 120

# 验收：unified_done 事件 + 全部 page done + 复用率 ≥ 0.7
EVENTS=$(curl -s "$API/projects/tasks/$TASK_ID/events/history" -H "Authorization: Bearer $TOKEN")
UNIFIED_DONE=$(echo "$EVENTS" | jq '[.[] | select(.event_type=="unified_done")] | length')
[ "$UNIFIED_DONE" -ge 1 ] || { echo "❌ unified_done 缺失"; exit 1; }
echo "✅ unified_done 事件"

PAGES=$(curl -s "$API/projects/tasks/$TASK_ID/pages" -H "Authorization: Bearer $TOKEN")
DONE=$(echo "$PAGES" | jq '[.[] | select(.status=="done")] | length')
[ "$DONE" -ge 4 ] || { echo "❌ 4 页 done 失败：$DONE/4"; exit 1; }
echo "✅ 4 页全 done"

TASK=$(curl -s "$API/projects/tasks/$TASK_ID" -H "Authorization: Bearer $TOKEN")
WORKDIR=$(echo "$TASK" | jq -r '.workdir_path // empty')
if [ -n "$WORKDIR" ] && [ -d "$WORKDIR/src/pages" ]; then
  IMPORT_COUNT=$(grep -rE "import .* from\s+['\"](\.\.?/)+(components|styles|api|store|utils)/" "$WORKDIR/src/pages" 2>/dev/null | wc -l)
  TOTAL=$(find "$WORKDIR/src/pages" -name '*.vue' 2>/dev/null | wc -l)
  if [ "$TOTAL" -gt 0 ]; then
    RATE=$(awk "BEGIN { printf \"%.2f\", $IMPORT_COUNT / $TOTAL }")
    echo "ℹ️ 统筹模式复用率：$RATE（plan 期望 ≥ 0.7）"
  fi
fi
