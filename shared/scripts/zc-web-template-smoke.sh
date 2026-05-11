#!/usr/bin/env bash
# zc-editor-web-template scaffold + sandbox image 冒烟测试
#
# 用法：bash shared/scripts/zc-web-template-smoke.sh
#
# 流程：
#   1) 起一个临时容器，挂 /tmp/zc-web-template-smoke 当 workspace
#   2) 复制 scaffolds/zc-editor-web-template/ 到 workspace（root 拥有以便容器内可写）
#   3) 容器内跑 pnpm install
#   4) 检查 node_modules/amis 是否落地 + lockfile 是否生成
#
# 成功条件：pnpm exit 0 + node_modules/amis 存在 + pnpm-lock.yaml 存在

set -euo pipefail

WORKDIR=/tmp/zc-web-template-smoke
LOG=/tmp/zc-web-template-smoke.log
IMAGE=amis-ai-sandbox:zc-web-node20
REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"

# WSL 代理避坑（与 start-services.sh 对齐）
unset http_proxy HTTP_PROXY https_proxy HTTPS_PROXY all_proxy ALL_PROXY 2>/dev/null || true

echo "[smoke] 清理 workdir：$WORKDIR"
if [[ -d "$WORKDIR" ]]; then
  # 旧的 .pnpm-store/node_modules 可能是 root-owned，借容器 rm 一次
  docker run --rm -v "$WORKDIR:/cleanup" "$IMAGE" sh -c "rm -rf /cleanup/* /cleanup/.[!.]*" || true
fi
rm -rf "$WORKDIR"
mkdir -p "$WORKDIR"

echo "[smoke] 复制 scaffold → $WORKDIR"
cp -r "$REPO_ROOT/scaffolds/zc-editor-web-template/." "$WORKDIR/"

echo "[smoke] 容器内跑 pnpm install（最多 12 分钟）"
START=$SECONDS
if docker run --rm \
  -v "$WORKDIR:/workspace" \
  -w /workspace \
  -e HOME=/tmp \
  "$IMAGE" \
  sh -c "pnpm install 2>&1" > "$LOG" 2>&1; then
  EXIT=0
else
  EXIT=$?
fi
ELAPSED=$((SECONDS - START))
echo "[smoke] pnpm install exit=$EXIT  耗时=${ELAPSED}s  日志=$LOG"

echo "[smoke] 验证 node_modules/amis"
if [[ -d "$WORKDIR/node_modules/amis" ]]; then
  echo "[smoke] ✅ node_modules/amis 存在"
else
  echo "[smoke] ❌ node_modules/amis 缺失"
  tail -30 "$LOG"
  exit 1
fi

echo "[smoke] 验证 lockfile"
if [[ -f "$WORKDIR/pnpm-lock.yaml" ]]; then
  echo "[smoke] ✅ pnpm-lock.yaml 已生成（$(wc -l < "$WORKDIR/pnpm-lock.yaml") 行）"
else
  echo "[smoke] ❌ pnpm-lock.yaml 缺失"
  exit 1
fi

if [[ $EXIT -ne 0 ]]; then
  echo "[smoke] ❌ pnpm install exit code != 0：$EXIT"
  tail -30 "$LOG"
  exit "$EXIT"
fi

echo "[smoke] 🎉 全部通过"
