#!/usr/bin/env bash
# Unified start/stop helper for DAP app (backend + frontend)
# Usage:
#   ./scripts/app.sh start        # dev mode (fallback auth on by default)
#   ./scripts/app.sh stop         # stop processes on dev ports
#   ./scripts/app.sh restart      # stop then start
#   ./scripts/app.sh status       # show listeners
#   PORT_API=4000 PORT_WEB=5173 AUTH_FALLBACK=1 ./scripts/app.sh start

set -euo pipefail

PORT_API="${PORT_API:-4000}"
PORT_WEB="${PORT_WEB:-5173}"
AUTH_FALLBACK_FLAG="${AUTH_FALLBACK:-0}" # default to database in production
BACKEND_DIR="backend"
FRONTEND_DIR="frontend"

color() { local c="$1"; shift; printf "\033[%sm%s\033[0m" "$c" "$*"; }
info() { echo "$(color 36 '[info]') $*"; }
warn() { echo "$(color 33 '[warn]') $*"; }
err() { echo "$(color 31 '[err]')  $*" >&2; }

pids_on_port() { lsof -t -iTCP:"$1" -sTCP:LISTEN 2>/dev/null || true; }

stop_ports() {
  local killed=0
  for p in "$PORT_API" "$PORT_WEB"; do
    local pids; pids=$(pids_on_port "$p") || true
    if [[ -n "$pids" ]]; then
      info "Stopping port $p (pids: $pids)"
      kill $pids || true
      killed=1
    fi
  done
  if [[ $killed -eq 1 ]]; then
    sleep 0.5
    # Force kill any stubborn children
    for p in "$PORT_API" "$PORT_WEB"; do
      local pids; pids=$(pids_on_port "$p") || true
      if [[ -n "$pids" ]]; then
        warn "Force killing remaining pids on $p: $pids"
        kill -9 $pids || true
      fi
    done
  fi
}

start_backend() {
  info "Starting backend on :$PORT_API (AUTH_FALLBACK=$AUTH_FALLBACK_FLAG)"
  (
    cd "$BACKEND_DIR"
    AUTH_FALLBACK="$AUTH_FALLBACK_FLAG" PORT="$PORT_API" npx ts-node-dev --respawn --transpile-only src/server.ts &
    echo $! > ../.backend.pid
  )
}

start_frontend() {
  info "Starting frontend on :$PORT_WEB"
  (
    cd "$FRONTEND_DIR"
    HOST=0.0.0.0 PORT="$PORT_WEB" npx vite --port "$PORT_WEB" --strictPort &
    echo $! > ../.frontend.pid
  )
}

wait_backend() {
  local tries=25
  while (( tries-- > 0 )); do
    if curl -fsS "http://127.0.0.1:$PORT_API/health" >/dev/null 2>&1; then
      info "Backend healthy"
      return 0
    fi
    sleep 0.3
  done
  warn "Backend not responding on /health after wait"
  return 1
}

status() {
  echo "--- Process Status ---"
  for p in "$PORT_API" "$PORT_WEB"; do
    local pids; pids=$(pids_on_port "$p") || true
    if [[ -n "$pids" ]]; then
      info "Port $p: $(color 32 'LISTENING') (pids: $pids)"
    else
      warn "Port $p: not listening"
    fi
  done
  for f in .backend.pid .frontend.pid; do
    if [[ -f $f ]]; then
      local pid; pid=$(cat "$f")
      if ps -p "$pid" > /dev/null 2>&1; then
        info "$f -> $pid (alive)"
      else
        warn "$f -> $pid (stale)"
      fi
    fi
  done
}

case "${1:-}" in
  start)
    stop_ports
  start_backend
  start_frontend
  wait_backend || true
    status
    ;;
  stop)
    stop_ports
    for f in .backend.pid .frontend.pid; do rm -f "$f"; done
    status
    ;;
  restart)
    stop_ports
    start_backend
    start_frontend
    sleep 1
    status
    ;;
  status)
    status
    ;;
  *)
    echo "Usage: $0 {start|stop|restart|status}" >&2
    exit 1
    ;;
 esac
