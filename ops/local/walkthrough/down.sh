#!/bin/bash
# down.sh — full teardown of the local MatterControl walkthrough environment
# (CO-17, D-1(b)). Mandatory after every walkthrough: kill mcapi + stub IdP by
# pidfile, remove the PG container, delete the disposable key material and the
# whole state dir, then PROVE nothing of ours is still listening (the r1 run
# left an orphan mcapi on 18082 — never repeat that).
#
# Idempotent: safe to run when nothing is up. Never touches other tasks'
# processes, containers, or ports.
set -uo pipefail
export PATH=/usr/bin:/bin:/usr/sbin:/sbin:/opt/homebrew/bin:/usr/local/bin:$PATH

STATE="${MC_WT_STATE_DIR:-${TMPDIR:-/tmp}/mc-walkthrough-state}"
PG_NAME="mc-walkthrough-pg"
PG_PORT="${MC_WT_PG_PORT:-15432}"
API_PORT="${MC_WT_API_PORT:-18083}"
IDP_PORT="${MC_WT_IDP_PORT:-18093}"

log() { echo "[down] $*"; }

# stop_pidfile: SIGTERM, wait up to 5s, then SIGKILL. Only plain numeric PIDs
# are honoured — anything else in the pidfile is ignored, never executed
# (Mimosa: command-injection hardening).
stop_pidfile() {
  local f="$1" pid i
  [[ -f "$f" ]] || return 0
  pid="$(cat "$f" 2>/dev/null)"
  case "$pid" in
    '' | *[!0-9]*) rm -f "$f"; return 0 ;;
  esac
  if kill -0 "$pid" 2>/dev/null; then
    kill "$pid" 2>/dev/null
    for i in $(seq 1 10); do
      kill -0 "$pid" 2>/dev/null || break
      sleep 0.5
    done
    kill -0 "$pid" 2>/dev/null && kill -9 "$pid" 2>/dev/null
  fi
  rm -f "$f"
  return 0
}

# --- 1. stop processes we started (by pidfile only — never by name/port scan) ---
stop_pidfile "$STATE/mcapi.pid"
stop_pidfile "$STATE/stubidp.pid"

# --- 2. remove the walkthrough PG container ---
if docker ps -a --format '{{.Names}}' | grep -qx "$PG_NAME"; then
  docker rm -f "$PG_NAME" >/dev/null
  log "container $PG_NAME removed"
else
  log "container $PG_NAME not present"
fi

# --- 3. delete disposable key material + state ---
case "$STATE" in
  */mc-walkthrough*)
    rm -rf "$STATE"
    log "state dir $STATE removed (stub key material destroyed)"
    ;;
  *)
    # Refuse to rm an unexpected path; the operator can remove it by hand.
    log "NOTE: state dir $STATE has an unexpected name — NOT removed; remove it manually if intended"
    ;;
esac

# --- 4. orphan check: our three ports must be free ---
FAILED=0
for p in "$PG_PORT" "$API_PORT" "$IDP_PORT"; do
  if lsof -nP -iTCP:"$p" -sTCP:LISTEN >/dev/null 2>&1; then
    echo "[down] WARNING: port $p still held:" >&2
    lsof -nP -iTCP:"$p" -sTCP:LISTEN >&2
    FAILED=1
  fi
done
# Any walkthrough binary still alive from any state dir?
LEFTOVERS="$(pgrep -fl 'mc-walkthrough-state/mcapi|mc-walkthrough-state/stubidp' 2>/dev/null || true)"
if [[ -n "$LEFTOVERS" ]]; then
  echo "[down] WARNING: leftover walkthrough processes:" >&2
  echo "$LEFTOVERS" >&2
  FAILED=1
fi

if [[ "$FAILED" = "1" ]]; then
  log "teardown INCOMPLETE — see warnings above"
  exit 1
fi
log "teardown complete: no walkthrough processes, no container, no state, no orphans"
