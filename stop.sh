#!/usr/bin/env bash
# Stop backend + frontend started by start.sh.
# Postgres container is left running by default; pass --db to stop it too.

set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="$ROOT_DIR/.logs"

stop_pid() {
  local name="$1" file="$2"
  if [ -f "$file" ]; then
    local pid
    pid="$(cat "$file")"
    if kill -0 "$pid" 2>/dev/null; then
      echo "[stop] killing $name (pid $pid)"
      kill "$pid" 2>/dev/null || true
      pkill -P "$pid" 2>/dev/null || true
    fi
    rm -f "$file"
  fi
}

stop_pid backend  "$LOG_DIR/backend.pid"
stop_pid frontend "$LOG_DIR/frontend.pid"

# Best-effort fallback: kill anything still bound to our ports
for port in 5001 4000; do
  pids="$(lsof -ti tcp:$port 2>/dev/null || true)"
  [ -n "$pids" ] && { echo "[stop] killing leftover on :$port ($pids)"; kill $pids 2>/dev/null || true; }
done

if [ "${1:-}" = "--db" ]; then
  echo "[stop] stopping postgres container"
  ( cd "$ROOT_DIR" && docker compose stop db )
fi

echo "[stop] done"
