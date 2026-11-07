#!/bin/bash
# fault-restore.sh — restore normal pass-through (the inverse of every E-4 fault).
set -Eeuo pipefail
export PATH=/usr/bin:/bin:/usr/sbin:/sbin:/opt/homebrew/bin:/usr/local/bin:$PATH
STATE="${MC_BW_STATE_DIR:-${TMPDIR:-/tmp}/mc-browser-walkthrough}"
PROXY_PORT="${MC_BW_PROXY_PORT:-8082}"
kill -0 "$(cat "$STATE/faultproxy.pid")" 2>/dev/null || { echo "faultproxy not running (run up.sh first)" >&2; exit 1; }
echo "off" > "$STATE/fault-mode"
echo "[fault] restored normal pass-through on 127.0.0.1:$PROXY_PORT (product API path)"
