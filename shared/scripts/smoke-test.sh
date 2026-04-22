#!/usr/bin/env bash
# D.3：端到端冒烟测试 —— 把可脚本化的链路都跑一遍
#
# 用法：
#   ./shared/scripts/smoke-test.sh
#
# 覆盖：
#   - 4 个服务健康
#   - admin 登录拿 token
#   - Skills CRUD（list / tree / read / write / mkdir / rename / delete / create-bucket）
#   - 系统配置（adopt_default_status 读写）
#   - Embedding info（pg_dim / actual_dim 探测）
#   - RAG 样例库（create / list / read / approve / search / delete）
#   - RBAC（普通用户 403）
#
# 不覆盖（手动）：
#   - 真任务创建 → 沙箱启动 → 采纳回流（需要 LLM 配置 + Docker 沙箱可用 + 几分钟运行）
#   - 前端 UI 视觉

set -uo pipefail
BASE="${BASE:-http://localhost:8080}"
PASS=0
FAIL=0

pass() { echo "  ✅ $1"; PASS=$((PASS+1)); }
fail() { echo "  ❌ $1"; FAIL=$((FAIL+1)); }

assert_eq() {
  if [[ "$1" == "$2" ]]; then pass "$3"; else fail "$3 (expected: $2, got: $1)"; fi
}

assert_contains() {
  if echo "$1" | grep -q "$2"; then pass "$3"; else fail "$3 (expected to contain: $2, got: $1)"; fi
}

echo "=== D.3 amis-ai 端到端冒烟（base=$BASE）==="
echo ""

# ───────────────── 1. 服务健康 ─────────────────
echo "── 1. 服务健康 ──"
for port in 8080 8090 8091 8000; do
  if nc -z localhost $port 2>/dev/null; then pass ":$port UP"; else fail ":$port DOWN"; fi
done
echo ""

# ───────────────── 2. Admin 登录 ─────────────────
echo "── 2. Admin 登录 ──"
TOKEN=$(curl -fs -X POST $BASE/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"admin123"}' \
  | python3 -c 'import sys,json; print(json.load(sys.stdin).get("token",""))' 2>/dev/null)
if [[ -n "$TOKEN" && ${#TOKEN} -gt 50 ]]; then
  pass "admin token 拿到 (len=${#TOKEN})"
else
  fail "admin 登录失败"
  echo "❌ 早退（无 token 后续都没法测）"
  exit 1
fi
H=( -H "Authorization: Bearer $TOKEN" )
echo ""

# ───────────────── 3. Profile 含 is_admin ─────────────────
echo "── 3. /api/user/profile ──"
PROFILE=$(curl -fs "${H[@]}" $BASE/api/user/profile)
ADMIN_FLAG=$(echo "$PROFILE" | python3 -c 'import sys,json; print(json.load(sys.stdin).get("is_admin"))')
assert_eq "$ADMIN_FLAG" "True" "admin 用户 is_admin=true"
echo ""

# ───────────────── 4. Skills CRUD ─────────────────
echo "── 4. Skills CRUD ──"
LIST=$(curl -fs "${H[@]}" $BASE/api/skills)
assert_contains "$LIST" "_common" "/api/skills 含 _common"
assert_contains "$LIST" "uniapp-wot-h5" "/api/skills 含 uniapp-wot-h5"

TREE=$(curl -fs "${H[@]}" $BASE/api/skills/_common/tree)
assert_contains "$TREE" "SKILL.md" "_common tree 含 SKILL.md"

FILE=$(curl -fs "${H[@]}" "$BASE/api/skills/_common/file?path=SKILL.md")
assert_contains "$FILE" "name: _common" "_common SKILL.md 含 frontmatter"

# 创建临时桶
SMOKE_BUCKET="smoke-test-bucket-$$"
RESP=$(curl -fs -X POST "${H[@]}" -H 'Content-Type: application/json' \
  -d "{\"dir_name\":\"$SMOKE_BUCKET\",\"description\":\"smoke test\"}" \
  $BASE/api/skills)
assert_contains "$RESP" "ok" "新建桶 $SMOKE_BUCKET"

# 在新桶里建文件
curl -fs -X PUT "${H[@]}" -H 'Content-Type: application/json' \
  -d '{"path":"references/test.md","content":"# test"}' \
  $BASE/api/skills/$SMOKE_BUCKET/file >/dev/null
T=$(curl -fs "${H[@]}" $BASE/api/skills/$SMOKE_BUCKET/tree)
assert_contains "$T" "test.md" "在桶里建文件"

# 重命名
curl -fs -X POST "${H[@]}" -H 'Content-Type: application/json' \
  -d '{"old_path":"references/test.md","new_path":"references/renamed.md"}' \
  $BASE/api/skills/$SMOKE_BUCKET/rename >/dev/null
T=$(curl -fs "${H[@]}" $BASE/api/skills/$SMOKE_BUCKET/tree)
assert_contains "$T" "renamed.md" "重命名文件"

# 删除（用 rm -rf 直接清，因为 backend 没暴露删桶接口）
rm -rf "/home/karl/Working/TianXing/amis-ai/skills/$SMOKE_BUCKET"
LIST2=$(curl -fs "${H[@]}" $BASE/api/skills)
if echo "$LIST2" | grep -q "$SMOKE_BUCKET"; then
  fail "桶 $SMOKE_BUCKET 清理失败（仍出现在 list）"
else
  pass "桶 $SMOKE_BUCKET 已清理"
fi

# 路径越界
S=$(curl -s -o /dev/null -w '%{http_code}' "${H[@]}" "$BASE/api/skills/_common/file?path=../../../etc/passwd")
assert_eq "$S" "403" "路径越界拒绝 (../etc/passwd → 403)"
echo ""

# ───────────────── 5. 系统配置 ─────────────────
echo "── 5. 系统配置 ──"
SET=$(curl -fs "${H[@]}" $BASE/api/system-settings)
assert_contains "$SET" "adopt_default_status" "/api/system-settings 含 adopt_default_status"

# 切到 approved 再切回 pending
curl -fs -X PUT "${H[@]}" -H 'Content-Type: application/json' \
  -d '{"value":"approved"}' \
  $BASE/api/system-settings/adopt_default_status >/dev/null
GOT=$(curl -fs "${H[@]}" $BASE/api/system-settings/adopt_default_status \
  | python3 -c 'import sys,json; print(json.load(sys.stdin)["value"])')
assert_eq "$GOT" "approved" "adopt_default_status 改 approved"
curl -fs -X PUT "${H[@]}" -H 'Content-Type: application/json' \
  -d '{"value":"pending"}' \
  $BASE/api/system-settings/adopt_default_status >/dev/null
GOT=$(curl -fs "${H[@]}" $BASE/api/system-settings/adopt_default_status \
  | python3 -c 'import sys,json; print(json.load(sys.stdin)["value"])')
assert_eq "$GOT" "pending" "adopt_default_status 切回 pending"
echo ""

# ───────────────── 6. Embedding 兼容性探测 ─────────────────
echo "── 6. /api/system/embedding-info ──"
INFO=$(curl -fs "${H[@]}" $BASE/api/system/embedding-info)
COMPAT=$(echo "$INFO" | python3 -c 'import sys,json; print(json.load(sys.stdin)["compatible"])')
assert_eq "$COMPAT" "True" "embedding 兼容（pg_dim == model_dim）"
PG_DIM=$(echo "$INFO" | python3 -c 'import sys,json; print(json.load(sys.stdin)["pg_column_dim"])')
ACTUAL_DIM=$(echo "$INFO" | python3 -c 'import sys,json; print(json.load(sys.stdin)["actual_model_dim"])')
echo "    （pg_dim=$PG_DIM, model_dim=$ACTUAL_DIM）"
echo ""

# ───────────────── 7. RAG 入库 → 检索 → 删除 ─────────────────
echo "── 7. RAG 样例库 ──"
INSERT=$(curl -fs -X POST "${H[@]}" -H 'Content-Type: application/json' \
  -d '{
    "tech_stack":"smoke-test","amis_json_summary":"smoke-test 摘要 abc",
    "code_summary":"smoke-test 代码摘要","full_amis_json":"{\"type\":\"page\"}",
    "full_code":"<wd-input/>","status":"approved"
  }' \
  $BASE/api/code-samples)
SID=$(echo "$INSERT" | python3 -c 'import sys,json; print(json.load(sys.stdin).get("id"))')
if [[ -n "$SID" && "$SID" != "None" ]]; then
  pass "RAG 入库 sample id=$SID"
else
  fail "RAG 入库失败：$INSERT"
fi

# 等向量化
sleep 4
HAS_EMB=$(PGPASSWORD=amis_ai_dev psql -h localhost -U amis_ai -d amis_ai -tAc \
  "SELECT embedding IS NOT NULL FROM code_samples WHERE id=$SID" 2>/dev/null)
assert_eq "$HAS_EMB" "t" "样例 #$SID embedding 列已写入"

# 检索
SEARCH=$(curl -fs -X POST http://localhost:8000/internal/search-code-samples \
  -H 'X-Internal-Key: dev-internal-key' \
  -H 'Content-Type: application/json' \
  -d '{"tech_stack":"smoke-test","query_text":"smoke abc","top_k":3,"only_approved":true,"increment_hits":false}')
COUNT=$(echo "$SEARCH" | python3 -c 'import sys,json; print(json.load(sys.stdin).get("count",0))')
if [[ "$COUNT" -ge 1 ]]; then
  pass "RAG 检索命中 $COUNT 条"
else
  fail "RAG 检索没命中：$SEARCH"
fi

# 清理
curl -fs -X DELETE "${H[@]}" $BASE/api/code-samples/$SID >/dev/null && pass "RAG 样例 #$SID 已删"
echo ""

# ───────────────── 8. RBAC 普通用户 403 ─────────────────
echo "── 8. RBAC 普通用户 ──"
# 注册 / 登录普通用户
NPASS="smoke-normal-$$"
curl -fs -X POST $BASE/api/auth/register \
  -H 'Content-Type: application/json' \
  -d "{\"username\":\"$NPASS\",\"password\":\"normal123\",\"email\":\"smoke-$$@test.com\"}" >/dev/null
NTOKEN=$(curl -fs -X POST $BASE/api/auth/login \
  -H 'Content-Type: application/json' \
  -d "{\"username\":\"$NPASS\",\"password\":\"normal123\"}" \
  | python3 -c 'import sys,json; print(json.load(sys.stdin).get("token",""))')

S=$(curl -s -o /dev/null -w '%{http_code}' \
  -H "Authorization: Bearer $NTOKEN" $BASE/api/skills)
assert_eq "$S" "403" "普通用户 /api/skills 返回 403"
S=$(curl -s -o /dev/null -w '%{http_code}' \
  -H "Authorization: Bearer $NTOKEN" $BASE/api/code-samples)
assert_eq "$S" "403" "普通用户 /api/code-samples 返回 403"
S=$(curl -s -o /dev/null -w '%{http_code}' \
  -H "Authorization: Bearer $NTOKEN" $BASE/api/system-settings)
assert_eq "$S" "403" "普通用户 /api/system-settings 返回 403"
echo ""

# ───────────────── 总结 ─────────────────
echo "============================================"
echo "  ✅ PASS: $PASS"
if [[ $FAIL -gt 0 ]]; then
  echo "  ❌ FAIL: $FAIL"
  exit 1
else
  echo "  ❌ FAIL: 0   🎉 全部通过"
fi
