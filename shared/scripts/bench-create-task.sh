#!/usr/bin/env bash
# ================================================================
# POST /api/projects/tasks 性能基准脚本
# ================================================================
# 目的：量化 create_task 接口时延，供优化前后对比。
#
# 用法：
#   TOKEN=<JWT> ./shared/scripts/bench-create-task.sh [N]      # 串行 N 次（默认 5）
#   TOKEN=<JWT> ./shared/scripts/bench-create-task.sh 5 --cleanup   # 跑完清理本次 bench 任务
#
# JWT 获取：
#   curl -s -X POST http://localhost:8080/api/auth/login \
#     -H 'Content-Type: application/json' \
#     -d '{"username":"admin","password":"admin123"}' | jq -r .token
#
# 说明：
#   - 每次都会真实创建 docker sandbox + 拷贝 scaffold（~300ms–3s）+ 调 LLM/RAG，副作用较大
#   - --cleanup 会按 bench 开始时间过滤 DELETE 本次任务
#   - 脚本不调 /stop（保持简单）；如需彻底清理容器，跑完手动：
#       ./shared/scripts/start-services.sh stop && start
# ================================================================
set -uo pipefail

HOST=${HOST:-http://localhost:8080}
TOKEN=${TOKEN:?需要 JWT (export TOKEN=<jwt>)}
N=${1:-5}
CLEANUP=0
[[ "${2:-}" == "--cleanup" ]] && CLEANUP=1

# 最小 amis payload：一个 form + 两个输入。避免复杂度打分进 auto 高档，用 default 模式绕开
PAYLOAD='{
  "amis_json": "{\"type\":\"page\",\"title\":\"bench\",\"body\":{\"type\":\"form\",\"api\":\"post:/api/bench\",\"body\":[{\"type\":\"input-text\",\"name\":\"a\"},{\"type\":\"input-text\",\"name\":\"b\"}]}}",
  "platform": "mobile",
  "tech_stacks": ["uniapp"],
  "ui_libs": ["wot"],
  "template_name": "uniapp-wot-h5-template",
  "permission_config": {"mode": "danger_full_access"},
  "llm_mode": "default"
}'

echo "=== bench POST $HOST/api/projects/tasks × $N ==="
T_START=$(date +%s)
echo "T_START=$T_START"

# durations 数组存每次耗时 ms
declare -a DURS=()
TASK_IDS=()

for i in $(seq 1 $N); do
  t0=$(date +%s%N)
  body_file=$(mktemp /tmp/bench-body.XXXXXX.json)
  code=$(curl -s -o "$body_file" -w '%{http_code}' \
    -X POST "$HOST/api/projects/tasks" \
    -H "Authorization: Bearer $TOKEN" \
    -H 'Content-Type: application/json' \
    --data "$PAYLOAD")
  t1=$(date +%s%N)
  dur_ms=$(( (t1 - t0) / 1000000 ))
  DURS+=("$dur_ms")

  tid=""
  if [[ "$code" == "201" ]] && command -v jq >/dev/null 2>&1; then
    tid=$(jq -r '.id // empty' "$body_file" 2>/dev/null || true)
    [[ -n "$tid" ]] && TASK_IDS+=("$tid")
  fi

  printf "#%02d  http=%s  %6dms  task_id=%s\n" "$i" "$code" "$dur_ms" "${tid:-?}"
  rm -f "$body_file"
done

# 统计 p50 / avg / min / max
IFS=$'\n' sorted=($(sort -n <<<"${DURS[*]}"))
unset IFS
n=${#sorted[@]}
p50=${sorted[$((n/2))]}
min=${sorted[0]}
max=${sorted[$((n-1))]}
sum=0
for d in "${DURS[@]}"; do sum=$(( sum + d )); done
avg=$(( sum / n ))

echo ""
echo "=== 统计 (n=$n) ==="
printf "min=%dms  p50=%dms  avg=%dms  max=%dms\n" "$min" "$p50" "$avg" "$max"
echo "raw: ${DURS[*]}"

if [[ "$CLEANUP" == "1" ]]; then
  echo ""
  echo "=== cleanup: 调 stop 接口 + SQL 删除本次 bench 任务 ==="
  for tid in "${TASK_IDS[@]}"; do
    curl -s -X POST "$HOST/api/projects/tasks/$tid/stop" \
      -H "Authorization: Bearer $TOKEN" >/dev/null
    echo "  stop task $tid"
  done
  if command -v psql >/dev/null 2>&1; then
    PGPASSWORD=${PGPASSWORD:-amis_ai_dev} psql -h localhost -U amis_ai -d amis_ai \
      -c "DELETE FROM project_generation_task WHERE user_id = (SELECT id FROM users WHERE username='admin') AND created_at >= to_timestamp($T_START);" \
      2>/dev/null || echo "  (psql 清理跳过，数据库凭据不对；任务已 stop，可手动清理)"
  fi
fi
