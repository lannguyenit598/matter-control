#!/bin/bash
# api-stop.sh — stop the mcapi backend process cleanly (pidfile-owned,
# numeric-validated kill; E-4 "stop/restart the API"). Does NOT touch the PG
# container, the IdP stack, the fault proxy or the frontend.
# Inverse: ./api-start.sh
set -Eeuo pipefail
export PATH=/usr/bin:/bin:/usr/sbin:/sbin:/opt/homebrew/bin:/usr/local/bin:$PATH
STATE="${MC_BW_STATE_DIR:-${TMPDIR:-/tmp}/mc-browser-walkthrough}"
API_PORT="${MC_BW_API_PORT:-8083}"
pid=""
[ -f "$STATE/mcapi.pid" ] && pid=$(cat "$STATE/mcapi.pid")
case "$pid" in ''|*[!0-9]*) echo "mcapi not running (no valid pidfile) — nothing to stop" >&2; exit 0 ;; esac
kill "$pid" 2>/dev/null || { echo "mcapi pid $pid already gone" >&2; rm -f "$STATE/mcapi.pid"; exit 0; }
for _ in $(seq 1 20); do
  kill -0 "$pid" 2>/dev/null || break
  sleep 0.5
done
kill -9 "$pid" 2>/dev/null || true
rm -f "$STATE/mcapi.pid"
lsof -nP -iTCP:"$API_PORT" -sTCP:LISTEN >/dev/null 2>&1 \
  && { echo "[api] WARN: port $API_PORT still listening after stop" >&2; exit 1; }
echo "[api] mcapi stopped cleanly; port $API_PORT free. Restart: ./api-start.sh"
