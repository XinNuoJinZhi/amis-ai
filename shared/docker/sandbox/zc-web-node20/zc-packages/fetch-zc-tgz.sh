#!/usr/bin/env bash
# 一次性下载 ZC Amis 全部私有 tgz 到本目录，作为离线 fallback
# 用法：bash fetch-zc-tgz.sh
# 前置：宿主可达 app.xinnuojinzhi.com:8081（C.5 实测公网可达）

set -euo pipefail

NEXUS="http://app.xinnuojinzhi.com:8081/repository/amis"
HERE="$(cd "$(dirname "$0")" && pwd)"

declare -A PKGS=(
  ["amis"]="6.8.0-my324v2"
  ["amis-core"]="6.8.0-my324v2"
  ["amis-editor"]="6.8.0-my324v2"
  ["amis-editor-core"]="6.8.0-my324v2"
  ["amis-formula"]="6.8.0-my324v2"
  ["amis-theme-editor-helper"]="2.0.26-my3v2"
  ["amis-ui"]="6.8.0-my324v2"
)

for name in "${!PKGS[@]}"; do
  ver="${PKGS[$name]}"
  url="${NEXUS}/${name}/-/${name}-${ver}.tgz"
  out="${HERE}/${name}-${ver}.tgz"
  if [[ -f "$out" ]]; then
    echo "[skip] $name-$ver.tgz 已存在"
    continue
  fi
  echo "[fetch] $url"
  curl -fL --connect-timeout 10 --max-time 120 -o "$out" "$url"
done

echo "[done] 全部 ZC 私有包已下载到 $HERE"
ls -la "$HERE"/*.tgz 2>/dev/null
