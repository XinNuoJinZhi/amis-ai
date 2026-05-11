#!/usr/bin/env bash
# 1.4 W2·B.4 评测 orchestrator — 自动三组对比 ZC Web 通过率
#
# 跑顺序：A baseline → B +weighting → C 全开 + 评委 + 负例回流
# 每组：5 prompts × r4_baseline 策略
#
# 用法：
#   先 export TEST_ADMIN_JWT=<token> 或者放 /tmp/amis-admin-jwt.txt
#   ./eval/1.4-w2/run-three-rounds.sh
#
# 输出：eval/1.4-w2/results-{A,B,C}.{csv,md}

set -euo pipefail

JWT_FILE="/tmp/amis-admin-jwt.txt"
if [[ -z "${TEST_ADMIN_JWT:-}" ]] && [[ -f "$JWT_FILE" ]]; then
  export TEST_ADMIN_JWT=$(cat "$JWT_FILE")
fi
: "${TEST_ADMIN_JWT:?需要 admin JWT（export TEST_ADMIN_JWT 或写入 $JWT_FILE）}"

REPO=/home/karl/Working/TianXing/amis-ai
API=http://localhost:8080/api
PROMPTS=$REPO/eval/zc-web-1.3/prompts.json
OUT_DIR=$REPO/eval/1.4-w2
mkdir -p "$OUT_DIR"

set_knob() {
  local key=$1 val=$2
  local resp
  resp=$(curl -s -X PUT "$API/system-settings/$key" \
    -H "Authorization: Bearer $TEST_ADMIN_JWT" \
    -H "Content-Type: application/json" \
    -d "{\"value\":\"$val\"}")
  echo "  $key = $val  ← $(echo "$resp" | head -c 100)"
}

run_group() {
  local label=$1
  echo ""
  echo "════════════════════════════════════════════════════"
  echo "$(date '+%H:%M:%S')  ▶ Group $label 开跑（5 prompts × r4_baseline）"
  echo "════════════════════════════════════════════════════"
  # 跑评测；runner 把 results-<ts>.csv/md 写到 prompts-file 同目录（eval/zc-web-1.3/）
  python3 "$REPO/eval/multipage-1.2/runner.py" \
    --prompts-file "$PROMPTS" \
    --strategies r4_baseline \
    --tech-stack zc-editor-web \
    --max-wait-sec 1500 2>&1 | tee "$OUT_DIR/log-$label.txt"

  # 把最新 results 文件挪到 1.4-w2/ 并改名带标签
  local latest_csv latest_md
  latest_csv=$(ls -1t "$REPO/eval/zc-web-1.3/results-"*.csv 2>/dev/null | head -1)
  latest_md=$(ls -1t  "$REPO/eval/zc-web-1.3/results-"*.md  2>/dev/null | head -1)
  if [[ -n "$latest_csv" ]]; then
    cp "$latest_csv" "$OUT_DIR/results-$label.csv"
    cp "$latest_md"  "$OUT_DIR/results-$label.md"
    echo "  → 已保存 $OUT_DIR/results-$label.{csv,md}"
  fi
}

echo "════════ Group A: baseline（关掉所有 1.4 可选增强）════════"
set_knob rag.weighting.enabled false
set_knob rag.weighting.thumbs_mode tiebreaker
set_knob rag.weighting.hit_count_enabled false
set_knob rag.negative.enabled false
set_knob rag.judge.mode disabled
set_knob rag.judge.auto_negative_on_bad false
run_group A

echo ""
echo "════════ Group B: +weighting（开 thumbs/hit_count 加权）════════"
set_knob rag.weighting.enabled true
set_knob rag.weighting.thumbs_mode boost
set_knob rag.weighting.hit_count_enabled true
run_group B

echo ""
echo "════════ Group C: full stack（+ 负例 + 评委 + page 评委 + 自动回流）════════"
set_knob rag.negative.enabled true
set_knob rag.negative.top_k 1
set_knob rag.negative.only_structural true
set_knob rag.judge.mode auto_on_adopt
set_knob rag.judge.auto_negative_on_bad true
set_knob rag.judge.page_mode auto_on_complete   # 1.4 W4 #2：B.3b page 级评委也启用
run_group C

echo ""
echo "════════════════════════════════════════════════════"
echo "$(date '+%H:%M:%S')  ✅ 三组评测完成"
echo "  - $OUT_DIR/results-A.{csv,md}  baseline"
echo "  - $OUT_DIR/results-B.{csv,md}  +weighting"
echo "  - $OUT_DIR/results-C.{csv,md}  full stack"
echo "════════════════════════════════════════════════════"

# 收尾：把 knob 切回 A baseline，避免线上残留评测配置
echo ""
echo "▶ 收尾：knob 切回 baseline 状态"
set_knob rag.weighting.enabled false
set_knob rag.weighting.thumbs_mode tiebreaker
set_knob rag.weighting.hit_count_enabled false
set_knob rag.negative.enabled false
set_knob rag.judge.mode disabled
set_knob rag.judge.auto_negative_on_bad false
set_knob rag.judge.page_mode disabled
echo "✅ 完成"
