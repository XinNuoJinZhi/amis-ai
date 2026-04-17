#!/usr/bin/env bash
# amis-ai 反向代码生成飞轮 - 一键启动三个 Rust 服务
#
# 用法：
#   ./shared/scripts/start-services.sh          # 启动三服务（前台，日志到 /tmp）
#   ./shared/scripts/start-services.sh stop     # 停止三服务
#   ./shared/scripts/start-services.sh status   # 查看端口状态
#
# 设计要点：
# - 在子进程启动时局部清空代理环境变量（避免请求内网 Ollama 时被系统代理拦截 502）
# - 不修改当前 shell 的代理配置，也不修改 ~/.bashrc / /etc/environment
# - 日志统一写 /tmp，方便 tail 调试

set -uo pipefail

AMIS_ROOT="${AMIS_ROOT:-/home/karl/Working/TianXing/amis-ai}"
LOG_DIR="${LOG_DIR:-/tmp/amis-ai-logs}"
mkdir -p "$LOG_DIR"

SANDBOX_BIN="$AMIS_ROOT/sandbox/target/debug/sandbox-service"
CLAW_BIN="$AMIS_ROOT/claw-code/rust/target/debug/claw-agent-server"
BACKEND_BIN="$AMIS_ROOT/backend/target/debug/amis-ai-backend"

start_one() {
  local name="$1" bin="$2" port="$3" extra_env="$4"
  if nc -z localhost "$port" 2>/dev/null; then
    echo "⚠️  $name 端口 :$port 已被占用，跳过"
    return
  fi
  if [[ ! -x "$bin" ]]; then
    echo "❌ $name 二进制不存在: $bin"
    echo "   请先 cargo build"
    return 1
  fi
  # 关键：用 env -u 局部 unset 代理变量（仅影响这个子进程，不改当前 shell）
  nohup env -u http_proxy -u HTTP_PROXY -u https_proxy -u HTTPS_PROXY -u all_proxy -u ALL_PROXY \
    RUST_LOG=info $extra_env "$bin" \
    > "$LOG_DIR/$name.log" 2>&1 &
  local pid=$!
  echo "✅ $name 启动 (PID $pid, log $LOG_DIR/$name.log)"
  sleep 1
}

start_all() {
  echo "=== 启动 sandbox-service (:8091) ==="
  start_one sandbox-service "$SANDBOX_BIN" 8091 ""

  echo "=== 启动 claw-agent-server (:8090) ==="
  start_one claw-agent-server "$CLAW_BIN" 8090 ""

  echo "=== 启动 backend (:8080) ==="
  start_one backend "$BACKEND_BIN" 8080 \
    "SANDBOX_SERVICE_URL=http://localhost:8091 CLAW_AGENT_URL=http://localhost:8090"

  sleep 2
  status
}

stop_all() {
  echo "=== 停止所有服务 ==="
  for name in sandbox-service claw-agent-server amis-ai-backend; do
    if pkill -x "$name" 2>/dev/null; then
      echo "🛑 已停 $name"
    fi
  done
  for port in 8080 8090 8091; do
    fuser -k -n tcp "$port" 2>/dev/null && echo "🛑 已释放 :$port"
  done
  # 清理 sandbox 容器
  docker ps --filter "name=amis-ai-sandbox" -q 2>/dev/null | xargs -r docker rm -f >/dev/null 2>&1
  echo "✅ 清理完成"
}

status() {
  echo "=== 端口状态 ==="
  for port in 8080 8090 8091; do
    if nc -z localhost "$port" 2>/dev/null; then
      echo "  ✅ :$port UP"
    else
      echo "  ❌ :$port DOWN"
    fi
  done
}

case "${1:-start}" in
  start) start_all ;;
  stop)  stop_all ;;
  restart) stop_all; sleep 2; start_all ;;
  status) status ;;
  *) echo "Usage: $0 {start|stop|restart|status}"; exit 1 ;;
esac
