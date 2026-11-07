#!/bin/bash
# fault-5xx.sh [code] — inject a 5xx on the product API path (E-4). Default 503.
# The proxy responds immediately; the upstream mcapi is never called.
# Inverse: ./fault-restore.sh
set -Eeuo pipefail
export PATH=/usr/bin:/bin:/usr/sbin:/sbin:/opt/homebrew/bin:/usr/local/bin:$PATH
STATE="${MC_BW_STATE_DIR:-${TMPDIR:-/tmp}/mc-browser-walkthrough}"
PROXY_PORT="${MC_BW_PROXY_PORT:-8082}"
CODE="${1:-503}"
case "$CODE" in ''|*[!0-9]*) echo "usage: $0 [400-599]" >&2; exit 2 ;; esac
[ "$CODE" -ge 400 ] && [ "$CODE" -le 599 ] || { echo "code must be 400..599" >&2; exit 2; }
kill -0 "$(cat "$STATE/faultproxy.pid")" 2>/dev/null || { echo "faultproxy not running (run up.sh first)" >&2; exit 1; }
echo "status=$CODE" > "$STATE/fault-mode"
echo "[fault] status=$CODE active on 127.0.0.1:$PROXY_PORT (product API path); upstream never called. Inverse: ./fault-restore.sh"
