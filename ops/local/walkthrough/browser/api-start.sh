#!/bin/bash
# api-start.sh — start the mcapi backend process (rebuilds only if the built
# binary is missing; migrate/seed are idempotent). E-4 "restart the API cleanly".
# Inverse: ./api-stop.sh. Full env bring-up: ./up.sh
set -Eeuo pipefail
export PATH=/usr/bin:/bin:/usr/sbin:/sbin:/opt/homebrew/bin:/usr/local/bin:$PATH
BROWSER_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$BROWSER_DIR/../../../.." && pwd)"
IDP_DIR="$REPO_ROOT/ops/p0-local"
BACKEND="$REPO_ROOT/apps/backend"
STATE="${MC_BW_STATE_DIR:-${TMPDIR:-/tmp}/mc-browser-walkthrough}"
API_PORT="${MC_BW_API_PORT:-8083}"
PG_PORT="${MC_BW_PG_PORT:-55440}"
log() { printf '[api] %s\n' "$*"; }

if kill -0 "$(cat "$STATE/mcapi.pid" 2>/dev/null)" 2>/dev/null; then
  log "mcapi already running (pid $(cat "$STATE/mcapi.pid"))"; exit 0
fi
[ -f "$STATE/mcapi.env" ] || { echo "mcapi.env missing — run ./up.sh first" >&2; exit 1; }
[ -f "$STATE/mcapi" ] || {
  log "building mcapi from tree"
  (cd "$BACKEND" && go build -o "$STATE/mcapi" ./cmd/mcapi) || exit 1
}
log "applying pending migrations (idempotent)"
(set -a; . "$STATE/mcapi.env"; set +a; "$STATE/mcapi" migrate) >>"$STATE/mcapi.log" 2>&1 || exit 1
log "seeding users (idempotent)"
"$IDP_DIR/seed-users.sh" >>"$STATE/mcapi.log" 2>&1 || exit 1
(set -a; . "$STATE/mcapi.env"; set +a
 nohup python3 -c 'import os,sys; os.setsid(); os.execvp(sys.argv[1], sys.argv[1:])' \
   "$STATE/mcapi" >>"$STATE/mcapi.log" 2>&1 </dev/null &
 echo $! > "$STATE/mcapi.pid")
for _ in $(seq 1 30); do
  code=$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:${API_PORT}/readyz" 2>/dev/null || true)
  [ "$code" = "200" ] && { log "mcapi ready on 127.0.0.1:$API_PORT"; exit 0; }
  sleep 1
done
log "FAIL: mcapi not ready — see $STATE/mcapi.log"
exit 1
