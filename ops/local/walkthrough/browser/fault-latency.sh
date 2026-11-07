#!/bin/bash
# fault-latency.sh [ms] — inject added latency on the product API path (E-4).
# Writes the faultproxy mode file; the proxy applies it from the next request on.
# Inverse: ./fault-restore.sh
set -Eeuo pipefail
export PATH=/usr/bin:/bin:/usr/sbin:/sbin:/opt/homebrew/bin:/usr/local/bin:$PATH
STATE="${MC_BW_STATE_DIR:-${TMPDIR:-/tmp}/mc-browser-walkthrough}"
PROXY_PORT="${MC_BW_PROXY_PORT:-8082}"
MS="${1:-2000}"
case "$MS" in ''|*[!0-9]*) echo "usage: $0 [ms]" >&2; exit 2 ;; esac
[ "$MS" -ge 0 ] && [ "$MS" -le 600000 ] || { echo "ms out of range 0..600000" >&2; exit 2; }
kill -0 "$(cat "$STATE/faultproxy.pid")" 2>/dev/null || { echo "faultproxy not running (run up.sh first)" >&2; exit 1; }
echo "latency-ms=$MS" > "$STATE/fault-mode"
echo "[fault] latency-ms=$MS active on 127.0.0.1:$PROXY_PORT (product API path). Inverse: ./fault-restore.sh"
