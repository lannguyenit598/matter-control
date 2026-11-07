#!/bin/bash
# down.sh — tear down the BROWSER walkthrough environment (MC-ENABLE-E2-E4-20261107).
#
# Reverse of up.sh. Kills ONLY processes recorded in this env's pidfiles; stops ONLY
# the two task-owned containers (mc-p0-claude-pg and the mc-p0-idp compose project).
# Data volumes are retained (mc-p0-claude-pgdata, mc-p0-idp-pgdata); the 0700 state
# dir (pidfiles, logs, fault-mode file, object store, constructed env) is destroyed.
# Ends with an orphan check over every port and container this env owns.
set -Eeuo pipefail
export PATH=/usr/bin:/bin:/usr/sbin:/sbin:/opt/homebrew/bin:/usr/local/bin:$PATH

BROWSER_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$BROWSER_DIR/../../../.." && pwd)"
IDP_DIR="$REPO_ROOT/ops/p0-local"

STATE="${MC_BW_STATE_DIR:-${TMPDIR:-/tmp}/mc-browser-walkthrough}"
API_PORT="${MC_BW_API_PORT:-8083}"
PROXY_PORT="${MC_BW_PROXY_PORT:-8082}"
FE_PORT="${MC_BW_FE_PORT:-3000}"
PG_PORT="${MC_BW_PG_PORT:-55440}"
IDP_PORT="${MC_BW_IDP_PORT:-8080}"
PG_NAME="mc-p0-claude-pg"

log() { printf '[down] %s\n' "$*"; }
warn() { printf '[down] WARN: %s\n' "$*" >&2; }

stop_pid_from() { # pidfile label
  local pid
  if [ -f "$1" ]; then
    pid=$(cat "$1")
    case "$pid" in
      ''|*[!0-9]*) warn "$2: invalid pid value in $1 — not touched"; rm -f "$1"; return ;;
    esac
    if kill -0 "$pid" 2>/dev/null; then
      log "stopping $2 (pid $pid)"
      kill "$pid" 2>/dev/null || true
      for _ in $(seq 1 20); do kill -0 "$pid" 2>/dev/null || break; sleep 0.5; done
      kill -9 "$pid" 2>/dev/null || true
    else
      log "$2 already stopped"
    fi
    rm -f "$1"
  fi
}

# ---- processes (pidfile-owned only) -----------------------------------------
stop_pid_from "$STATE/frontend.pid"  "frontend (next dev)"
stop_pid_from "$STATE/faultproxy.pid" "faultproxy"
stop_pid_from "$STATE/mcapi.pid"     "mcapi"

# ---- containers --------------------------------------------------------------
if docker inspect "$PG_NAME" >/dev/null 2>&1; then
  log "stopping+removing container $PG_NAME (volume mc-p0-claude-pgdata retained)"
  docker stop "$PG_NAME" >/dev/null 2>&1 || warn "docker stop $PG_NAME failed"
  docker rm "$PG_NAME" >/dev/null 2>&1 || warn "docker rm $PG_NAME failed"
fi
if docker compose -f "$IDP_DIR/docker-compose.yml" --env-file "$IDP_DIR/.env" ps -q >/dev/null 2>&1; then
  log "stopping ZITADEL compose stack (volumes retained)"
  (cd "$IDP_DIR" && docker compose --env-file .env down) >/dev/null 2>&1 \
    || warn "IdP compose down failed"
fi

# ---- state dir ----------------------------------------------------------------
if [ -d "$STATE" ]; then
  log "destroying state dir $STATE"
  rm -rf "$STATE"
fi

# ---- orphan check --------------------------------------------------------------
sleep 1
FAIL=0
for p in "$FE_PORT" "$PROXY_PORT" "$API_PORT" "$PG_PORT" "$IDP_PORT"; do
  if lsof -nP -iTCP:"$p" -sTCP:LISTEN >/dev/null 2>&1; then
    warn "ORPHAN: port $p still listening — inspect with lsof -nP -iTCP:$p (NOT killed automatically)"
    FAIL=1
  fi
done
for c in "$PG_NAME" mc-p0-idp-proxy-1 mc-p0-idp-zitadel-api-1 mc-p0-idp-zitadel-login-1 mc-p0-idp-postgres-1; do
  if docker inspect -f '{{.State.Running}}' "$c" 2>/dev/null | grep -q true; then
    warn "ORPHAN: container $c still running"
    FAIL=1
  fi
done
if [ "$FAIL" = 0 ]; then
  log "orphan check CLEAN: 0 listeners, 0 running containers across {$FE_PORT,$PROXY_PORT,$API_PORT,$PG_PORT,$IDP_PORT}"
else
  log "orphan check found leftovers (see WARN lines) — manual follow-up required"
  exit 1
fi
log "DONE — browser walkthrough env down"
