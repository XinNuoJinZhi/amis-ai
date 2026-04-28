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
#   - Skill AI 起草会话（create / draft CRUD / adopt / delete）← Synthetic Honey
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

echo ""

# ───────────────── 7.5 RAG 质量闭环（2026-04-25 新增）─────────────────
# 复用上一节的 $SID，依次跑 thumbs / rating / mark-negative / stats / pending-count / audit
echo "── 7.5 RAG 质量闭环（feedback / rating / negative / stats / audit）──"

# 7.5.1 thumbs feedback 原子 +1
FB1=$(curl -fs "${H[@]}" -H 'Content-Type: application/json' \
  -X POST $BASE/api/code-samples/$SID/feedback -d '{"kind":"up"}')
FB1_VAL=$(echo "$FB1" | python3 -c 'import sys,json; print(json.load(sys.stdin).get("value",0))')
assert_eq "$FB1_VAL" "1" "POST /:id/feedback up → thumbs_up=1"

FB2=$(curl -fs "${H[@]}" -H 'Content-Type: application/json' \
  -X POST $BASE/api/code-samples/$SID/feedback -d '{"kind":"down"}')
FB2_VAL=$(echo "$FB2" | python3 -c 'import sys,json; print(json.load(sys.stdin).get("value",0))')
assert_eq "$FB2_VAL" "1" "POST /:id/feedback down → thumbs_down=1"

# 7.5.2 rating 0-5 + note
RT=$(curl -fs "${H[@]}" -H 'Content-Type: application/json' \
  -X PUT $BASE/api/code-samples/$SID/rating -d '{"rating":4.5,"note":"smoke-test 评分"}')
RT_VAL=$(echo "$RT" | python3 -c 'import sys,json; print(json.load(sys.stdin).get("sample",{}).get("rating",""))')
assert_contains "$RT_VAL" "4.5" "PUT /:id/rating → rating=4.5"

# 7.5.3 stats 聚合
STATS=$(curl -fs "${H[@]}" $BASE/api/code-samples/stats)
STATS_TOTAL=$(echo "$STATS" | python3 -c 'import sys,json; d=json.load(sys.stdin); print(d.get("total",0))')
if [[ "$STATS_TOTAL" -ge 1 ]]; then pass "GET /stats 返回 total=$STATS_TOTAL"; else fail "/stats 异常：$STATS"; fi
assert_contains "$STATS" "\"approved\"" "/stats 含 approved 字段"
assert_contains "$STATS" "\"avg_rating\"" "/stats 含 avg_rating 字段"
assert_contains "$STATS" "\"thumbs_up_total\"" "/stats 含 thumbs_up_total 字段"

# 7.5.4 pending-count 轻量接口
PC=$(curl -fs "${H[@]}" $BASE/api/code-samples/pending-count)
assert_contains "$PC" "\"pending\"" "/pending-count 返回 pending 字段"

# 7.5.5 mark-negative + 回滚
MN=$(curl -fs "${H[@]}" -H 'Content-Type: application/json' \
  -X POST $BASE/api/code-samples/$SID/mark-negative \
  -d '{"negative_kind":"structural","rejection_reason":"smoke-test 反例","also_reject":true}')
MN_NEG=$(echo "$MN" | python3 -c 'import sys,json; print(json.load(sys.stdin).get("sample",{}).get("is_negative",False))')
assert_eq "$MN_NEG" "True" "POST /:id/mark-negative → is_negative=true"
MN_STATUS=$(echo "$MN" | python3 -c 'import sys,json; print(json.load(sys.stdin).get("sample",{}).get("status",""))')
assert_eq "$MN_STATUS" "rejected" "mark-negative also_reject=true → status=rejected"

UMN=$(curl -fs "${H[@]}" -X POST $BASE/api/code-samples/$SID/unmark-negative)
UMN_NEG=$(echo "$UMN" | python3 -c 'import sys,json; print(json.load(sys.stdin).get("sample",{}).get("is_negative",True))')
assert_eq "$UMN_NEG" "False" "POST /:id/unmark-negative → is_negative=false"

# 7.5.6 score-async（仅校验 200 + queued 字段；verdict 是否真回填取决于 rag.judge.mode 是否启）
SCORE=$(curl -fs "${H[@]}" -X POST $BASE/api/code-samples/$SID/score-async)
SCORE_STATUS=$(echo "$SCORE" | python3 -c 'import sys,json; print(json.load(sys.stdin).get("status",""))')
assert_eq "$SCORE_STATUS" "queued" "POST /:id/score-async → queued"

# 7.5.7 audit timeline（前面操作已写多条）
AUDIT=$(curl -fs "${H[@]}" $BASE/api/code-samples/$SID/audit)
AUDIT_N=$(echo "$AUDIT" | python3 -c 'import sys,json; print(len(json.load(sys.stdin).get("items",[])))')
if [[ "$AUDIT_N" -ge 4 ]]; then
  pass "GET /:id/audit 返回 $AUDIT_N 条（含 create / thumbs / rate / mark-negative 等）"
else
  fail "audit 条数不足（期望 ≥ 4，实际 $AUDIT_N）：$AUDIT"
fi

# 7.5.8 rag.* 系统配置已注入默认值
RAG_CFG=$(curl -fs "${H[@]}" "$BASE/api/system-settings/rag.quality_filter.exclude_tags")
assert_contains "$RAG_CFG" "antipattern" "system_settings 默认 rag.quality_filter.exclude_tags=antipattern"
RAG_CFG2=$(curl -fs "${H[@]}" "$BASE/api/system-settings/rag.judge.mode")
assert_contains "$RAG_CFG2" "disabled" "system_settings 默认 rag.judge.mode=disabled"

# 清理：删了 sample，audit 行随 ON DELETE CASCADE 一起清掉
curl -fs -X DELETE "${H[@]}" $BASE/api/code-samples/$SID >/dev/null && pass "RAG 样例 #$SID 已删（含 audit cascade）"
echo ""

# ───────────────── 7.6 Tracelog 配置 + API（2026-04-25 新增）─────────────────
echo "── 7.6 Tracelog 配置 + API ──"

# 7.6.1 tracelog.mode 已注入合法值
# 注：之前这里硬断言 == "disabled"，导致管理员手动开过 all_tasks 后冒烟必 FAIL，
# 且 7.6.3 退场会把 admin 真实配置覆盖回 disabled。2026-04-25 改成「值在合法集合即 OK」+
# 7.6.3 切完后**恢复原值**（保存 → 改 → 还原），避免 smoke 破坏运维状态。
TR_MODE_BEFORE=$(curl -fs "${H[@]}" "$BASE/api/system-settings/tracelog.mode" | python3 -c 'import sys,json; print(json.load(sys.stdin).get("value",""))')
case "$TR_MODE_BEFORE" in
  disabled|smart|all_tasks)
    pass "tracelog.mode 已注入合法值（当前 admin 配置: $TR_MODE_BEFORE）"
    ;;
  *)
    fail "tracelog.mode 值非法或缺失: '$TR_MODE_BEFORE'"
    ;;
esac

# 7.6.2 其他 3 个 knob 默认值都注入了
for k in tracelog.dir tracelog.retention_days tracelog.compress; do
  V=$(curl -fs "${H[@]}" "$BASE/api/system-settings/$k" | python3 -c 'import sys,json; v=json.load(sys.stdin); print(v.get("value","?"))')
  if [[ -n "$V" && "$V" != "?" ]]; then
    pass "$k 默认值已注入：$V"
  else
    fail "$k 默认值缺失"
  fi
done

# 7.6.3 tracelog.mode 切到 all_tasks 验证持久化，再恢复原值（不强制写 disabled）
curl -fs "${H[@]}" -X PUT "$BASE/api/system-settings/tracelog.mode" -H 'Content-Type: application/json' -d '{"value":"all_tasks"}' >/dev/null
TR_MODE_AFTER=$(curl -fs "${H[@]}" "$BASE/api/system-settings/tracelog.mode" | python3 -c 'import sys,json; print(json.load(sys.stdin).get("value",""))')
assert_eq "$TR_MODE_AFTER" "all_tasks" "tracelog.mode 切到 all_tasks 持久化"
# 还原 admin 入场前的真实配置，避免冒烟副作用
curl -fs "${H[@]}" -X PUT "$BASE/api/system-settings/tracelog.mode" -H 'Content-Type: application/json' -d "{\"value\":\"$TR_MODE_BEFORE\"}" >/dev/null

# 7.6.4 GET /tracelog 不存在 task → 404（admin 校验通畅，路由生效）
S=$(curl -s -o /dev/null -w '%{http_code}' "${H[@]}" "$BASE/api/projects/tasks/999999/tracelog")
assert_eq "$S" "404" "GET /tasks/:id/tracelog 不存在 task → 404"

# 7.6.5 普通用户访问下载接口被 admin 校验拦（用 7.5 之后的 NTOKEN 做不到，因为 NTOKEN 是普通用户但路由仅校验任务归属——
# 这里只做 admin 也访问不到不存在 task 的负向验证就够；归属校验另外测）
S2=$(curl -s -o /dev/null -w '%{http_code}' "${H[@]}" "$BASE/api/projects/tasks/999999/tracelog/download")
assert_eq "$S2" "404" "GET /tasks/:id/tracelog/download 不存在 task → 404"

# 7.6.6 Phase E：在线浏览归档接口（不存在 task → 404）
S3=$(curl -s -o /dev/null -w '%{http_code}' "${H[@]}" "$BASE/api/projects/tasks/999999/tracelog/ls")
assert_eq "$S3" "404" "GET /tasks/:id/tracelog/ls 不存在 task → 404"
S4=$(curl -s -o /dev/null -w '%{http_code}' "${H[@]}" "$BASE/api/projects/tasks/999999/tracelog/file?path=manifest.json")
assert_eq "$S4" "404" "GET /tasks/:id/tracelog/file 不存在 task → 404"

# 7.6.7 Phase E：路径白名单拒绝越权（即使任务存在也应 404，因为路径含 ..）
# 取一个真实任务 id（取最后一个 task）；不存在的话跳过此项
LAST_TASK=$(PGPASSWORD=amis_ai_dev psql -h localhost -U amis_ai -d amis_ai -tAc \
  "SELECT id FROM project_generation_task ORDER BY id DESC LIMIT 1" 2>/dev/null | tr -d ' ')
if [[ -n "$LAST_TASK" && "$LAST_TASK" =~ ^[0-9]+$ ]]; then
  S5=$(curl -s -o /dev/null -w '%{http_code}' "${H[@]}" \
    "$BASE/api/projects/tasks/$LAST_TASK/tracelog/file?path=../../etc/passwd")
  assert_eq "$S5" "404" "GET /tracelog/file path=../etc/passwd → 404（白名单拒绝）"
  S6=$(curl -s -o /dev/null -w '%{http_code}' "${H[@]}" \
    "$BASE/api/projects/tasks/$LAST_TASK/tracelog/file?path=/etc/hosts")
  assert_eq "$S6" "404" "GET /tracelog/file path=/etc/hosts → 404（绝对路径拒绝）"
else
  pass "白名单测试跳过（库里无 project_task 记录）"
fi
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

# ───────────────── 9. Skill AI 起草 (Synthetic Honey) ─────────────────
echo "── 9. Skill AI 起草 ──"

# 9.1 创建 session
SH_INTENT=$(cat <<'EOF'
{
  "mode": "draft_bucket",
  "dir_name": "smoke-synthetic-honey",
  "display_name": "Smoke Synthetic Honey",
  "description": "冒烟测试的 AI 起草会话",
  "target_stack": "smoke-stack",
  "reference_bucket_ids": ["_common"],
  "extra_context": "冒烟测试，不调 LLM"
}
EOF
)
SH_CREATE=$(curl -fs "${H[@]}" -H 'Content-Type: application/json' \
  -X POST $BASE/api/skills/authoring/sessions -d "$SH_INTENT")
SH_SID=$(echo "$SH_CREATE" | python3 -c 'import sys,json; print(json.load(sys.stdin)["session_id"])' 2>/dev/null)
if [[ -n "$SH_SID" ]]; then
  pass "创建 authoring session ($SH_SID)"
else
  fail "创建 authoring session：$SH_CREATE"
fi

# 9.2 GET session 回显 draft 状态
SH_GET=$(curl -fs "${H[@]}" $BASE/api/skills/authoring/sessions/$SH_SID)
assert_contains "$SH_GET" "\"status\":\"draft\"" "session 初始 status=draft"

# 9.3 非法路径 → 400
S=$(curl -s -o /dev/null -w '%{http_code}' -X PUT "${H[@]}" \
  -H 'Content-Type: application/json' \
  -d '{"path":"../../etc/passwd","content":"x"}' \
  $BASE/api/skills/authoring/sessions/$SH_SID/draft)
assert_eq "$S" "400" "越权路径 ../../etc/passwd → 400"

# 9.4 手动写一份草稿（绕过 LLM）
SH_WRITE_BODY=$(cat <<'EOF'
{
  "path": "SKILL.md",
  "content": "---\nname: smoke-synthetic-honey\ndescription: smoke\n---\n# smoke\n"
}
EOF
)
SH_W=$(curl -fs "${H[@]}" -H 'Content-Type: application/json' \
  -X PUT $BASE/api/skills/authoring/sessions/$SH_SID/draft -d "$SH_WRITE_BODY")
assert_contains "$SH_W" "\"ok\":true" "写 SKILL.md 草稿"

# 9.5 GET 草稿回显
SH_R=$(curl -fs "${H[@]}" "$BASE/api/skills/authoring/sessions/$SH_SID/draft?path=SKILL.md")
assert_contains "$SH_R" "smoke-synthetic-honey" "读回草稿 SKILL.md"

# 9.6 采纳到新桶（每次进程不同后缀避免冲突）
SH_ADOPT_BODY=$(cat <<EOF
{
  "mode": "new_bucket",
  "target_bucket": "smoke-synthetic-honey-$$",
  "selected_paths": ["SKILL.md"],
  "conflict_policy": "overwrite"
}
EOF
)
SH_A=$(curl -fs "${H[@]}" -H 'Content-Type: application/json' \
  -X POST $BASE/api/skills/authoring/sessions/$SH_SID/adopt -d "$SH_ADOPT_BODY")
assert_contains "$SH_A" "\"ok\":true" "采纳到新桶"

# 9.7 验证桶已落库
SH_LIST=$(curl -fs "${H[@]}" $BASE/api/skills)
assert_contains "$SH_LIST" "smoke-synthetic-honey-$$" "新桶出现在 /api/skills"

# 9.8 DELETE session
S=$(curl -s -o /dev/null -w '%{http_code}' -X DELETE "${H[@]}" \
  $BASE/api/skills/authoring/sessions/$SH_SID)
assert_eq "$S" "200" "删除 authoring session"

# 9.8.1 清理采纳的冒烟桶（后端目前没有"删整桶"的 API，直接从磁盘擦除）
#       参考本脚本 line 104 的做法，避免每次冒烟都在 skills/ 目录堆残留
rm -rf "/home/karl/Working/TianXing/amis-ai/skills/smoke-synthetic-honey-$$"

# 9.9 普通用户 POST 起草 → 403
S=$(curl -s -o /dev/null -w '%{http_code}' \
  -H "Authorization: Bearer $NTOKEN" \
  -H 'Content-Type: application/json' \
  -X POST $BASE/api/skills/authoring/sessions \
  -d '{"mode":"draft_bucket","dir_name":"x","display_name":"x","description":"x","target_stack":"x","reference_bucket_ids":[]}')
assert_eq "$S" "403" "普通用户起草返回 403"

echo "    (冒烟桶 smoke-synthetic-honey-$$ 已落库并已自动清理)"
echo ""

# ───────────────── 10. 2026-04 技术栈解耦冒烟（5 条） ─────────────────
echo ""
echo "=== 10. 技术栈解耦：Registry API + 维度化选桶 + RAG 标签 ==="

# 10.1 Registry platforms API（登录即可读，admin token 够用）
R10_1=$(curl -fs "${H[@]}" $BASE/api/registry/platforms)
assert_contains "$R10_1" "\"web\"" "Registry platforms 返回 web"
assert_contains "$R10_1" "\"mobile\"" "Registry platforms 返回 mobile"

# 10.2 Registry templates API 至少含 legacy + __blank__
R10_2=$(curl -fs "${H[@]}" $BASE/api/registry/templates)
assert_contains "$R10_2" "\"uniapp-wot-h5-template\"" "Registry templates 含 uniapp-wot-h5-template"
assert_contains "$R10_2" "\"__blank__\"" "Registry templates 含 __blank__ 伪模板"

# 10.3 Registry skills API 扫到新维度桶
R10_3=$(curl -fs "${H[@]}" $BASE/api/registry/skills)
assert_contains "$R10_3" "\"platform-web\"" "Registry skills 扫到 platform-web"
assert_contains "$R10_3" "\"stack-react\"" "Registry skills 扫到 stack-react"
assert_contains "$R10_3" "\"ui-antd\"" "Registry skills 扫到 ui-antd"
assert_contains "$R10_3" "\"scaffold-from-scratch\"" "Registry skills 扫到 scaffold-from-scratch"

# 10.4 resolve-skills：web+react+antd 组合
R10_4_BODY='{"platform":"web","tech_stacks":["react"],"ui_libs":["antd"],"template_name":"react-antd-vite-template"}'
R10_4=$(curl -fs "${H[@]}" -H 'Content-Type: application/json' \
  -X POST $BASE/api/registry/resolve-skills -d "$R10_4_BODY")
assert_contains "$R10_4" "\"platform-web\"" "resolve-skills 命中 platform-web"
assert_contains "$R10_4" "\"stack-react\"" "resolve-skills 命中 stack-react"
assert_contains "$R10_4" "\"ui-antd\"" "resolve-skills 命中 ui-antd"

# 10.5 resolve-skills：无模板应追加 scaffold-from-scratch
R10_5_BODY='{"platform":"web","tech_stacks":["vue3"],"ui_libs":["element-plus"],"template_name":null}'
R10_5=$(curl -fs "${H[@]}" -H 'Content-Type: application/json' \
  -X POST $BASE/api/registry/resolve-skills -d "$R10_5_BODY")
assert_contains "$R10_5" "\"scaffold-from-scratch\"" "无模板时 resolve-skills 追加 scaffold-from-scratch"

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
