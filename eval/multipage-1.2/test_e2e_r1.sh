#!/usr/bin/env bash
# R1 骨架先行端到端：5 页任务，等 120s 看 status + 复用率
#
# 前置：同 test_e2e_r4.sh
# 三阶段：骨架 30s + 5 页并发 60s + 收尾 30s = 约 120s
#
# 用法：
#   TEST_ADMIN_JWT=<jwt> ./eval/multipage-1.2/test_e2e_r1.sh

set -euo pipefail

TOKEN="${TEST_ADMIN_JWT:?需要管理员 JWT, export TEST_ADMIN_JWT=...}"
API="${API_BASE:-http://localhost:8080/api}"

# 1. 创建 5 页任务（reuse_strategy=r1_skeleton）
RESP=$(curl -s -X POST "$API/projects/tasks" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d @- <<EOF
{
  "title": "e2e r1 skeleton 5 pages",
  "amis_json": "{}",
  "tech_stack": "uniapp-wot-h5",
  "execution_strategy": "isolated",
  "reuse_strategy": "r1_skeleton",
  "pages": [
    {"amis_json": "{\"type\":\"page\",\"title\":\"首页\"}", "route_path": "/"},
    {"amis_json": "{\"type\":\"crud\",\"title\":\"用户列表\"}"},
    {"amis_json": "{\"type\":\"form\",\"title\":\"用户编辑\"}"},
    {"amis_json": "{\"type\":\"page\",\"title\":\"个人中心\"}", "route_path": "/profile"},
    {"amis_json": "{\"type\":\"page\",\"title\":\"设置\"}", "route_path": "/settings"}
  ]
}
EOF
)
TASK_ID=$(echo "$RESP" | jq -r '.task_id // .id')
[ -n "$TASK_ID" ] && [ "$TASK_ID" != "null" ] || { echo "❌ create 失败: $RESP"; exit 1; }
echo "Task created: $TASK_ID"

# 2. 等 120s（骨架 + 5 页 + 收尾）
sleep 120

# 3. 校验 5 页全 done
PAGES=$(curl -s "$API/projects/tasks/$TASK_ID/db-pages" -H "Authorization: Bearer $TOKEN")
echo "$PAGES" | jq '.'
DONE_COUNT=$(echo "$PAGES" | jq '[.[] | select(.status=="done")] | length')
[ "$DONE_COUNT" -ge 5 ] || { echo "❌ 5 页 done 失败：$DONE_COUNT/5"; exit 1; }
echo "✅ 5 页全 done"

# 4. 校验 R1 三阶段事件都到位
EVENTS=$(curl -s "$API/projects/tasks/$TASK_ID/events/history" -H "Authorization: Bearer $TOKEN")
echo "$EVENTS" | jq '[.[] | select((.event_type // "") | startswith("skeleton_") or startswith("cleanup_"))] | map(.event_type)'
SKELETON_DONE=$(echo "$EVENTS" | jq '[.[] | select(.event_type=="skeleton_done")] | length')
CLEANUP_DONE=$(echo "$EVENTS" | jq '[.[] | select(.event_type=="cleanup_done")] | length')
[ "$SKELETON_DONE" -ge 1 ] || { echo "❌ skeleton_done 缺失"; exit 1; }
[ "$CLEANUP_DONE" -ge 1 ] || { echo "❌ cleanup_done 缺失"; exit 1; }
echo "✅ R1 三阶段事件齐全"

# 5. 复用率检查：grep workdir 里 import shared/ 出现次数
TASK=$(curl -s "$API/projects/tasks/$TASK_ID" -H "Authorization: Bearer $TOKEN")
WORKDIR=$(echo "$TASK" | jq -r '.workdir_path // empty')
if [ -n "$WORKDIR" ] && [ -d "$WORKDIR/src/pages" ]; then
  IMPORT_COUNT=$(grep -rE "import .* from\s+['\"](\.\.?/)+(components|styles|api|store|utils)/" "$WORKDIR/src/pages" 2>/dev/null | wc -l)
  TOTAL_FILES=$(find "$WORKDIR/src/pages" -name '*.vue' 2>/dev/null | wc -l)
  if [ "$TOTAL_FILES" -gt 0 ]; then
    RATE=$(awk "BEGIN { printf \"%.2f\", $IMPORT_COUNT / $TOTAL_FILES }")
    echo "ℹ️ R1 复用率：$IMPORT_COUNT imports / $TOTAL_FILES files = $RATE"
    awk "BEGIN { exit !($RATE >= 0.6) }" \
      && echo "✅ 复用率达标（≥ 0.6）" \
      || echo "⚠️ 复用率 $RATE < 期望 0.6（plan 验收门槛）"
  fi
fi

# 6. dev server preview port 校验
PORT=$(echo "$TASK" | jq -r '.preview_port // empty')
if [ -n "$PORT" ]; then
  curl -sf "http://localhost:$PORT" > /dev/null && echo "✅ dev server :$PORT OK" || echo "⚠️ dev server :$PORT 不可访问"
fi
