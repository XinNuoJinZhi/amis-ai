#!/usr/bin/env bash
# amis-ai 反向代码生成飞轮 - 一键启动三个 Rust 服务
#
# 用法：
#   ./shared/scripts/start-services.sh                 # 启动三服务（前台，日志到 /tmp）
#   ./shared/scripts/start-services.sh stop            # 停止三服务
#   ./shared/scripts/start-services.sh status          # 查看端口状态
#   ./shared/scripts/start-services.sh restart         # 停止后重启（默认自动检测是否需要 cargo build）
#
#   --rebuild     强制对三个 Rust crate 跑 cargo build（忽略 mtime 判断）
#   --no-rebuild  跳过所有 cargo build（哪怕检测到源码更新，也用现有二进制）
#   --purge-sandboxes  stop/restart 时强制清掉所有 amis-ai-sandbox-* 容器
#                      （默认会保留 DB status=running/succeeded 的 task 容器，避免误杀预览）
#
#   环境变量 AMISAI_REBUILD=always / never 等价于上面两个开关。
#
# 设计要点：
# - 2026-04 起：默认行为 = 检测每个 crate 的源码 mtime 是否晚于二进制，若新则自动 cargo build
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
AGENT_DIR="$AMIS_ROOT/agent"
AGENT_PORT="${AGENT_PORT:-8000}"

# REBUILD 策略：
#   auto（默认）——按 mtime 检测，源码新于二进制就 cargo build
#   always        ——每次都 cargo build（--rebuild 或 AMISAI_REBUILD=always）
#   never         ——从不 cargo build（--no-rebuild 或 AMISAI_REBUILD=never）
REBUILD_MODE="${AMISAI_REBUILD:-auto}"

# 检测 TCP 端口是否真的有进程在监听。
# 2026-04-25：原来用 `nc -z localhost $port`，但 OpenBSD netcat 在 IPv6 优先解析时
# 会把 v4-only listener 误判为 DOWN（已知 bug）。改用 ss 通过内核 socket 表查，最稳。
# 兜底：ss 不在 PATH 时退回 nc。
is_port_listening() {
  local port="$1"
  if command -v ss >/dev/null 2>&1; then
    ss -lnt "sport = :$port" 2>/dev/null | grep -q LISTEN
    return
  fi
  nc -z localhost "$port" 2>/dev/null
}

# 从 cargo crate 目录算出最新源文件 mtime；找不到源就返回 0
crate_latest_mtime() {
  local dir="$1"
  if [[ ! -d "$dir/src" ]]; then
    echo 0
    return
  fi
  # 只看 .rs / Cargo.toml，避免被 target/ node_modules 等干扰
  local paths=("$dir/src" "$dir/Cargo.toml")
  find "${paths[@]}" -type f \( -name '*.rs' -o -name 'Cargo.toml' \) -printf '%T@\n' 2>/dev/null \
    | sort -rn | head -1 | cut -d. -f1
}

# 需要 rebuild 吗？
need_rebuild() {
  local bin="$1" src_dir="$2"
  [[ "$REBUILD_MODE" == "always" ]] && return 0
  [[ "$REBUILD_MODE" == "never" ]] && return 1
  # auto：二进制不存在 → 必须 build
  [[ ! -x "$bin" ]] && return 0
  local bin_mtime src_mtime
  bin_mtime=$(stat -c '%Y' "$bin" 2>/dev/null || echo 0)
  src_mtime=$(crate_latest_mtime "$src_dir")
  [[ "$src_mtime" -gt "$bin_mtime" ]]
}

# 对一个 crate：需要 build 就调 cargo build；失败则 exit 1 中止启动
build_one() {
  local label="$1" crate_dir="$2" bin="$3" cargo_args="$4"
  if need_rebuild "$bin" "$crate_dir"; then
    echo "🔨 [rebuild] $label（源码新于二进制或二进制缺失）"
    if ! (cd "$crate_dir" && env -u http_proxy -u HTTP_PROXY -u https_proxy -u HTTPS_PROXY \
          cargo build $cargo_args); then
      echo "❌ cargo build 失败：$label（$crate_dir）"
      exit 1
    fi
  else
    echo "✓  $label 二进制是新的（跳过 cargo build）"
  fi
}

# 启动前统一跑三个 Rust crate 的按需 build
rebuild_if_needed() {
  if [[ "$REBUILD_MODE" == "never" ]]; then
    echo "=== 跳过 cargo build（REBUILD_MODE=never）==="
    return
  fi
  echo "=== cargo build 按需检测（mode=$REBUILD_MODE）==="
  build_one "sandbox-service" "$AMIS_ROOT/sandbox" "$SANDBOX_BIN" ""
  build_one "claw-agent-server" "$AMIS_ROOT/claw-code/rust/crates/claw-agent-server" "$CLAW_BIN" "-p claw-agent-server"
  build_one "backend" "$AMIS_ROOT/backend" "$BACKEND_BIN" ""
}

start_one() {
  local name="$1" bin="$2" port="$3" extra_env="$4" cwd="${5:-$AMIS_ROOT}"
  if is_port_listening "$port"; then
    echo "⚠️  $name 端口 :$port 已被占用，跳过"
    return
  fi
  if [[ ! -x "$bin" ]]; then
    echo "❌ $name 二进制不存在: $bin"
    echo "   请先 cargo build"
    return 1
  fi
  # 用 --chdir 切换 cwd 到服务目录，让 dotenvy 能读到该服务下的 .env 文件
  # 代理：用 env -u 局部清掉 HTTP_PROXY/HTTPS_PROXY/ALL_PROXY 等，避免请求被 Clash 拦截。
  # - 内网 LLM（如 192.168.*、本地 Ollama）：本来就靠这个清理来直连，否则 502
  # - 公网 LLM（如 d.vencho.cn）：Clash 规则若不覆盖也会走代理失败，统一不走代理最稳
  # - 4 个服务的对外通信目标都是 localhost / 内网，不需要走代理
  # - 不动当前 shell 的 env，只对 nohup 子进程生效
  nohup env --chdir="$cwd" \
    -u http_proxy -u HTTP_PROXY -u https_proxy -u HTTPS_PROXY -u all_proxy -u ALL_PROXY \
    RUST_LOG=info $extra_env "$bin" \
    > "$LOG_DIR/$name.log" 2>&1 &
  local pid=$!
  echo "✅ $name 启动 (PID $pid, log $LOG_DIR/$name.log, cwd $cwd)"
  sleep 1
}

start_all() {
  rebuild_if_needed
  echo "=== 启动 sandbox-service (:8091) ==="
  # 传 UID/GID 给 sandbox-service，让它以宿主机用户身份拉起容器和 exec，
  # 避免容器 root 创建的文件在宿主机是 root-owned → claw-agent-server (karl) 写不进去
  local host_uid
  host_uid="$(id -u)"
  local host_gid
  host_gid="$(id -g)"
  start_one sandbox-service "$SANDBOX_BIN" 8091 \
    "SANDBOX_CONTAINER_UID=$host_uid SANDBOX_CONTAINER_GID=$host_gid" \
    "$AMIS_ROOT/sandbox"

  echo "=== 启动 claw-agent-server (:8090) ==="
  # A.5：显式注入 Skills 发现配置
  # - CLAW_CONFIG_HOME：让 amis-ai/skills/* 被 claw-code 的 discover_skill_roots 自动扫到
  # - SKILLS_PLUGIN_PATHS：逗号分隔的外部插件包根目录（C 阶段会让 ZC Amis 团队提供）
  #   形如 "SKILLS_PLUGIN_PATHS=/opt/zc-amis-skills,/opt/another-team-skills"
  #   每个路径下应该放一个或多个标准 skill 包（含 SKILL.md）
  local plugin_paths="${SKILLS_PLUGIN_PATHS:-}"
  start_one claw-agent-server "$CLAW_BIN" 8090 \
    "CLAW_CONFIG_HOME=$AMIS_ROOT SKILLS_PLUGIN_PATHS=$plugin_paths" \
    "$AMIS_ROOT/claw-code/rust"

  echo "=== 启动 backend (:8080) ==="
  start_one backend "$BACKEND_BIN" 8080 \
    "SANDBOX_SERVICE_URL=http://localhost:8091 CLAW_AGENT_URL=http://localhost:8090" \
    "$AMIS_ROOT/backend"

  echo "=== 启动 agent (Python FastAPI :$AGENT_PORT) ==="
  start_python_agent

  sleep 2
  status
}

# 启动 Python agent（正向飞轮 + RAG 入库/检索）。
# 用 uv run uvicorn，不带 --reload（后台 nohup 不稳）。
# 如果 uv 不可用，退回 python -m uvicorn（要求 venv 已激活或全局装了 uvicorn）。
start_python_agent() {
  local name="agent"
  if is_port_listening "$AGENT_PORT"; then
    echo "⚠️  $name 端口 :$AGENT_PORT 已被占用，跳过"
    return
  fi
  if [[ ! -d "$AGENT_DIR" ]]; then
    echo "❌ agent 目录不存在: $AGENT_DIR"
    return 1
  fi
  local launcher
  if command -v uv >/dev/null 2>&1; then
    launcher="uv run uvicorn"
  elif command -v uvicorn >/dev/null 2>&1; then
    launcher="uvicorn"
  else
    echo "❌ 找不到 uv 或 uvicorn，请先 pip install uv 或 pip install uvicorn"
    return 1
  fi
  # 跟 start_one 一致：清代理，agent 只跟 PG / 本地 embedding 通信，不需要走 Clash
  nohup env --chdir="$AGENT_DIR" \
    -u http_proxy -u HTTP_PROXY -u https_proxy -u HTTPS_PROXY -u all_proxy -u ALL_PROXY \
    PYTHONUNBUFFERED=1 \
    $launcher src.main:app --host 0.0.0.0 --port "$AGENT_PORT" \
    > "$LOG_DIR/$name.log" 2>&1 &
  local pid=$!
  echo "✅ $name 启动 (PID $pid, log $LOG_DIR/$name.log, cwd $AGENT_DIR, port $AGENT_PORT)"
  sleep 2
}

stop_all() {
  echo "=== 停止所有服务 ==="
  for name in sandbox-service claw-agent-server amis-ai-backend; do
    if pkill -x "$name" 2>/dev/null; then
      echo "🛑 已停 $name"
    fi
  done
  # Python agent：按端口杀（uvicorn 进程名不固定，用端口最稳）
  if fuser -k -n tcp "$AGENT_PORT" 2>/dev/null; then
    echo "🛑 已释放 agent :$AGENT_PORT"
  fi
  for port in 8080 8090 8091; do
    fuser -k -n tcp "$port" 2>/dev/null && echo "🛑 已释放 :$port"
  done

  # 清理 sandbox 容器（2026-05-13 起：默认保护 running / succeeded task 的容器，
  # 避免 restart 误杀用户正在用的预览；--purge-sandboxes 强制全清回退旧行为）
  cleanup_sandboxes
  echo "✅ 清理完成"
}

# 列出"应保留"的 task_id（DB 里 status 仍 running/succeeded 的）。
# DB 不可达时返回空串 → fallback 清所有（旧行为，安全降级）。
list_active_task_ids() {
  PGPASSWORD="${PGPASSWORD:-amis_ai_dev}" psql \
    -h "${PGHOST:-localhost}" -U "${PGUSER:-amis_ai}" -d "${PGDATABASE:-amis_ai}" \
    -tA -c "SELECT id FROM project_generation_task
            WHERE status IN ('running','succeeded')
              AND sandbox_id IS NOT NULL" 2>/dev/null | tr '\n' ' '
}

cleanup_sandboxes() {
  if [[ "${PURGE_SANDBOXES:-no}" == "yes" ]]; then
    echo "🧹 --purge-sandboxes：强制清所有 amis-ai-sandbox 容器"
    docker ps -a --filter "name=amis-ai-sandbox" -q 2>/dev/null | xargs -r docker rm -f >/dev/null 2>&1
    return
  fi
  local keep_ids
  keep_ids=" $(list_active_task_ids)"
  local kept=0 removed=0
  for name in $(docker ps -a --filter "name=amis-ai-sandbox" --format '{{.Names}}' 2>/dev/null); do
    # 容器名形如 amis-ai-sandbox-task-357
    local tid="${name##*-task-}"
    if [[ "$keep_ids" == *" $tid "* ]]; then
      kept=$((kept+1))
      continue
    fi
    docker rm -f "$name" >/dev/null 2>&1 && removed=$((removed+1))
  done
  if [[ $kept -gt 0 ]]; then
    echo "🛡  保护 $kept 个 active task 的 sandbox（DB status=running/succeeded）"
  fi
  if [[ $removed -gt 0 ]]; then
    echo "🗑  清掉 $removed 个非 active sandbox"
  fi
}

status() {
  echo "=== 端口状态 ==="
  for port in 8080 8090 8091 "$AGENT_PORT"; do
    local label=":$port"
    case "$port" in
      8080) label=":8080 backend" ;;
      8090) label=":8090 claw-agent" ;;
      8091) label=":8091 sandbox" ;;
      "$AGENT_PORT") label=":$AGENT_PORT agent (Python)" ;;
    esac
    if is_port_listening "$port"; then
      echo "  ✅ $label UP"
    else
      echo "  ❌ $label DOWN"
    fi
  done
}

check() {
  local fail=0
  echo "=== amis-ai 启动依赖体检 ==="

  # 1. PostgreSQL
  if pg_isready -h localhost -p 5432 >/dev/null 2>&1; then
    echo "  ✅ PostgreSQL :5432 可达"
  else
    echo "  ❌ PostgreSQL :5432 不可达。检查 docker-compose up -d postgres"
    fail=1
  fi

  # 2. pgvector 扩展
  if PGPASSWORD=amis_ai_dev psql -h localhost -U amis_ai -d amis_ai -tAc \
      "SELECT 1 FROM pg_extension WHERE extname='vector'" 2>/dev/null | grep -q 1; then
    echo "  ✅ pgvector 扩展已启用"
  else
    echo "  ⚠️  pgvector 扩展未启用（需要 CREATE EXTENSION vector，backend 启动时自动建）"
  fi

  # 3. Docker daemon（sandbox-service 用）
  if docker info >/dev/null 2>&1; then
    echo "  ✅ Docker daemon 可达"
  else
    echo "  ❌ Docker daemon 不可达。systemctl start docker / 启动 Docker Desktop"
    fail=1
  fi

  # 4. 沙箱镜像
  if docker images --format '{{.Repository}}:{{.Tag}}' 2>/dev/null \
      | grep -q '^amis-ai-sandbox:uniapp-node20$'; then
    echo "  ✅ 沙箱镜像 amis-ai-sandbox:uniapp-node20 已存在"
  else
    echo "  ❌ 沙箱镜像 amis-ai-sandbox:uniapp-node20 不存在"
    echo "     cd $AMIS_ROOT/shared/docker/sandbox/uniapp-node20 && docker build -t amis-ai-sandbox:uniapp-node20 ."
    fail=1
  fi

  # 4.1 ZC Web 沙箱镜像（1.3 引入；非必须，ZC Web 模板任务才需要）
  if docker images --format '{{.Repository}}:{{.Tag}}' 2>/dev/null \
      | grep -q '^amis-ai-sandbox:zc-web-node20$'; then
    echo "  ✅ 沙箱镜像 amis-ai-sandbox:zc-web-node20 已存在（1.3 ZC Web 用）"
  else
    echo "  ⚠️  沙箱镜像 amis-ai-sandbox:zc-web-node20 不存在（仅 ZC Web 模板任务需要）"
    echo "     cd $AMIS_ROOT/shared/docker/sandbox/zc-web-node20 && docker build -t amis-ai-sandbox:zc-web-node20 ."
  fi

  # 5. Rust 二进制
  for bin in "$SANDBOX_BIN" "$CLAW_BIN" "$BACKEND_BIN"; do
    if [[ -x "$bin" ]]; then
      echo "  ✅ $(basename $bin) 二进制存在"
    else
      echo "  ❌ $(basename $bin) 缺失：$bin"
      echo "     需先 cargo build"
      fail=1
    fi
  done

  # 6. Python agent venv（uv 或 uvicorn 至少有一个）
  if command -v uv >/dev/null 2>&1; then
    echo "  ✅ uv 可用"
  elif command -v uvicorn >/dev/null 2>&1; then
    echo "  ✅ uvicorn 可用（无 uv 但能跑）"
  else
    echo "  ❌ uv 和 uvicorn 都没装。pip install uv 或 pip install uvicorn"
    fail=1
  fi

  # 7. Skills 根目录
  if [[ -d "$AMIS_ROOT/skills/_common" ]]; then
    echo "  ✅ skills/_common 桶存在"
  else
    echo "  ❌ skills/_common 桶缺失（A.2 应已建好）"
    fail=1
  fi

  # 8. 端口冲突（提示，不算 fail）
  for port in 8080 8090 8091 "$AGENT_PORT" 5173; do
    if is_port_listening "$port"; then
      echo "  ⚠️  :$port 已被占用（如要 fresh start 先 stop）"
    fi
  done

  # 9. 代理 env（如果你设了 HTTP_PROXY 指向 Clash 等，会拦截内网 LLM 请求）
  if [[ -n "${HTTP_PROXY:-}${http_proxy:-}${HTTPS_PROXY:-}${https_proxy:-}" ]]; then
    echo "  ⚠️  HTTP_PROXY 等代理 env 已设。start-services.sh 启动时会清掉，但你手动 cargo run 时要自己 unset"
  fi

  echo ""
  if [[ $fail -eq 0 ]]; then
    echo "✅ 体检通过，可以 ./start-services.sh start"
    return 0
  else
    echo "❌ 体检发现 $fail 项致命问题，先修了再启动"
    return 1
  fi
}

# 扫一遍参数取命令 + --rebuild / --no-rebuild 开关
CMD="start"
for arg in "$@"; do
  case "$arg" in
    --rebuild) REBUILD_MODE="always" ;;
    --no-rebuild) REBUILD_MODE="never" ;;
    --purge-sandboxes) PURGE_SANDBOXES="yes" ;;
    start|stop|restart|status|check) CMD="$arg" ;;
    *) echo "未知参数: $arg"; echo "Usage: $0 {start|stop|restart|status|check} [--rebuild|--no-rebuild] [--purge-sandboxes]"; exit 1 ;;
  esac
done

case "$CMD" in
  start)   start_all ;;
  stop)    stop_all ;;
  restart) stop_all; sleep 2; start_all ;;
  status)  status ;;
  check)   check ;;
  *) echo "Usage: $0 {start|stop|restart|status|check} [--rebuild|--no-rebuild] [--purge-sandboxes]"; exit 1 ;;
esac
