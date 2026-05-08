#!/usr/bin/env bash
# R2 prompt 注入端到端：3 页任务，等 60s 看 status + 验证产物含全局清单注释
#
# 前置：同 test_e2e_r4.sh
#
# 用法：
#   TEST_ADMIN_JWT=<jwt> ./eval/multipage-1.2/test_e2e_r2.sh

set -euo pipefail

TOKEN="${TEST_ADMIN_JWT:?需要管理员 JWT, export TEST_ADMIN_JWT=...}"
API="${API_BASE:-http://localhost:8080/api}"

# 1. 创建 3 页任务（reuse_strategy=r2_prompt）
RESP=$(curl -s -X POST "$API/projects/tasks" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d @- <<EOF
{
  "title": "e2e r2 prompt-inject 3 pages",
  "amis_json": "{}",
  "tech_stack": "uniapp-wot-h5",
  "execution_strategy": "isolated",
  "reuse_strategy": "r2_prompt",
  "pages": [
    {"amis_json": "{\"type\":\"page\",\"title\":\"首页\",\"body\":\"hello\"}"},
    {"amis_json": "{\"type\":\"crud\",\"title\":\"用户列表\"}", "route_path": "/users/list"},
    {"amis_json": "{\"type\":\"form\",\"title\":\"用户编辑\"}"}
  ]
}
EOF
)
TASK_ID=$(echo "$RESP" | jq -r '.task_id // .id')
[ -n "$TASK_ID" ] && [ "$TASK_ID" != "null" ] || { echo "❌ create 失败: $RESP"; exit 1; }
echo "Task created: $TASK_ID"

# 2. 等 60s
sleep 60

# 3. 查 pages 状态
PAGES=$(curl -s "$API/projects/tasks/$TASK_ID/pages" -H "Authorization: Bearer $TOKEN")
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

# 5. R2 特性验证：产物 .vue 文件应当出现 import shared/ 引用
WORKDIR=$(echo "$TASK" | jq -r '.workdir_path // empty')
if [ -n "$WORKDIR" ] && [ -d "$WORKDIR/src/pages" ]; then
  IMPORT_COUNT=$(grep -rE "import .* from\s+['\"](\.\.?/)+(components|styles|api|store|utils)/" "$WORKDIR/src/pages" 2>/dev/null | wc -l)
  echo "ℹ️ R2 注入清单后产物 import shared/ 次数：$IMPORT_COUNT（≥ 1 即生效）"
fi
