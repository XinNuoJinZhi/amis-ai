#!/usr/bin/env bash
# R4 baseline 端到端：3 页任务，等 60s 看 status + dev server 启动
#
# 前置：
#   - 4 服务在线（./shared/scripts/start-services.sh restart）
#   - admin JWT 在 env：export TEST_ADMIN_JWT=<token>
#   - 依赖 W6.2 实现的 GET /api/projects/tasks/:id/pages endpoint
#
# 用法：
#   TEST_ADMIN_JWT=<jwt> ./eval/multipage-1.2/test_e2e_r4.sh

set -euo pipefail

TOKEN="${TEST_ADMIN_JWT:?需要管理员 JWT, export TEST_ADMIN_JWT=...}"
API="${API_BASE:-http://localhost:8080/api}"

# 1. 创建 3 页任务
RESP=$(curl -s -X POST "$API/projects/tasks" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d @- <<EOF
{
  "title": "e2e r4 3 pages",
  "amis_json": "{}",
  "tech_stack": "uniapp-wot-h5",
  "execution_strategy": "isolated",
  "reuse_strategy": "r4_none",
  "pages": [
    {"amis_json": "{\"type\":\"page\",\"title\":\"首页\",\"body\":\"hello\"}"},
    {"amis_json": "{\"type\":\"crud\",\"title\":\"列表\"}", "route_path": "/list"},
    {"amis_json": "{\"type\":\"form\",\"title\":\"表单\"}"}
  ]
}
EOF
)
TASK_ID=$(echo "$RESP" | jq -r '.task_id // .id')
[ -n "$TASK_ID" ] && [ "$TASK_ID" != "null" ] || { echo "❌ create 失败: $RESP"; exit 1; }
echo "Task created: $TASK_ID"

# 2. 等 60s
sleep 60

# 3. 查 pages 状态（依赖 W6.2 endpoint）
PAGES=$(curl -s "$API/projects/tasks/$TASK_ID/db-pages" -H "Authorization: Bearer $TOKEN")
echo "$PAGES" | jq '.'
DONE_COUNT=$(echo "$PAGES" | jq '[.[] | select(.status == "done")] | length')
[ "$DONE_COUNT" -ge 3 ] || { echo "❌ 期望 3 页 done，实际 $DONE_COUNT"; exit 1; }
echo "✅ 3 页全 done"

# 4. dev server preview port 校验
TASK=$(curl -s "$API/projects/tasks/$TASK_ID" -H "Authorization: Bearer $TOKEN")
PORT=$(echo "$TASK" | jq -r '.preview_port // empty')
if [ -n "$PORT" ]; then
  curl -sf "http://localhost:$PORT" > /dev/null && echo "✅ dev server :$PORT OK" || echo "⚠️ dev server :$PORT 不可访问"
fi
