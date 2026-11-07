#!/bin/bash
# up.sh — bring up the MatterControl BROWSER walkthrough environment
# (MC-ENABLE-E2-E4-20261107, E-2): real-browser login against the local ZITADEL
# profile landing in the populated product UI.
#
# Five loopback-only pieces:
#   1. ZITADEL IdP stack     ops/p0-local compose project mc-p0-idp (:8080, retained data)
#   2. Product run DB        container mc-p0-claude-pg (:55440, volume mc-p0-claude-pgdata)
#   3. mcapi backend         built from the current tree (:8083, introspection against ZITADEL)
#   4. Fault proxy (E-4)     :8082 -> :8083, mode-file controlled (frontend's API_BASE_URL)
#   5. Frontend              next dev on 127.0.0.1:3000 (registered OIDC callback origin)
#
# State (pidfiles, logs, fault-mode file, object store, constructed mcapi env)
# lives in a 0700 dir outside git and is destroyed by down.sh. Secret VALUES are
# read from ops/p0-local/secrets/ at runtime and never printed or committed.
#
# Prerequisites: ops/p0-local prepared (prepare.sh ran once; runtime/mc-api-app-key.json
# exists); apps/frontend/.env.local present (never committed — see .env.local.example);
# pnpm + go + docker on PATH. Teardown: down.sh (mandatory when done — no orphans).
#
# Overrides: MC_BW_STATE_DIR, MC_BW_API_PORT (8083), MC_BW_PROXY_PORT (8082),
#            MC_BW_FE_PORT (3000), MC_BW_PG_PORT (55440), MC_BW_IDP_PORT (8080).
set -Eeuo pipefail
export PATH=/usr/bin:/bin:/usr/sbin:/sbin:/opt/homebrew/bin:/usr/local/bin:$PATH

BROWSER_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$BROWSER_DIR/../../../.." && pwd)"
IDP_DIR="$REPO_ROOT/ops/p0-local"
BACKEND="$REPO_ROOT/apps/backend"
FRONTEND="$REPO_ROOT/apps/frontend"

STATE="${MC_BW_STATE_DIR:-${TMPDIR:-/tmp}/mc-browser-walkthrough}"
API_PORT="${MC_BW_API_PORT:-8083}"
PROXY_PORT="${MC_BW_PROXY_PORT:-8082}"
FE_PORT="${MC_BW_FE_PORT:-3000}"
PG_PORT="${MC_BW_PG_PORT:-55440}"
IDP_PORT="${MC_BW_IDP_PORT:-8080}"
PG_NAME="mc-p0-claude-pg"

# Public identifier pins (ops/p0-local/runtime/provisioning.json, no secrets here).
OIDC_ISSUER="http://localhost:${IDP_PORT}"
OIDC_AUDIENCE="396855005832806403"      # ZITADEL project id — the resource audience
OIDC_API_CLIENT_ID="396855361123975171" # API application (authenticates introspection only)

log() { printf '[up] %s\n' "$*"; }
die() { printf '[up] FAIL: %s\n' "$*" >&2; exit 1; }

pid_alive() { [ -f "$1" ] && kill -0 "$(cat "$1")" 2>/dev/null; }

# Start a long-lived child in its OWN session (setsid equivalent — macOS has no
# setsid binary): survives the invoking shell's teardown, including process-group
# kills. stdin is /dev/null; stdout/stderr append to the component log.
start_detached() { # logfile pidfile cmd [args...]
  local logf="$1" pidf="$2"; shift 2
  nohup python3 -c 'import os,sys; os.setsid(); os.execvp(sys.argv[1], sys.argv[1:])' \
    "$@" >>"$logf" 2>&1 </dev/null &
  echo $! > "$pidf"
}

port_free() { ! lsof -nP -iTCP:"$1" -sTCP:LISTEN >/dev/null 2>&1; }

wait_http() { # url want_code label
  for _ in $(seq 1 60); do
    code=$(curl -s -o /dev/null -w '%{http_code}' "$1" 2>/dev/null || true)
    [ "$code" = "$2" ] && { log "$3 ready ($code)"; return 0; }
    sleep 1
  done
  die "$3 not ready (last code $code)"
}

mkdir -p "$STATE"; chmod 700 "$STATE"
: > "$STATE/up.log"

# ---- 0. preconditions -------------------------------------------------------
for f in "$IDP_DIR/docker-compose.yml" "$IDP_DIR/.env" \
         "$IDP_DIR/secrets/claude-pg.env" "$IDP_DIR/runtime/mc-api-app-key.json"; do
  [ -f "$f" ] || die "missing $f — run ops/p0-local/prepare.sh (+provision.sh) once first"
done
[ -f "$FRONTEND/.env.local" ] || die "missing apps/frontend/.env.local (copy .env.local.example; API_BASE_URL must point at http://127.0.0.1:${PROXY_PORT}/api/v1)"
for pair in "$API_PORT:mcapi.pid" "$PROXY_PORT:faultproxy.pid" "$FE_PORT:frontend.pid"; do
  p="${pair%%:*}"; pidf="${pair#*:}"
  if ! port_free "$p"; then
    pid_alive "$STATE/$pidf" || die "port $p busy — refusing to start over an unknown listener (check lsof -nP -iTCP:$p)"
    log "port $p held by this env's $pidf process"
  fi
done

# ---- 1. ZITADEL IdP stack ---------------------------------------------------
if curl -fsS "$OIDC_ISSUER/.well-known/openid-configuration" -o /dev/null 2>/dev/null; then
  log "IdP already serving on $OIDC_ISSUER"
else
  log "starting ZITADEL compose stack (mc-p0-idp)"
  (cd "$IDP_DIR" && docker compose --env-file .env up -d --wait) >>"$STATE/up.log" 2>&1 \
    || die "IdP compose failed (see $STATE/up.log)"
fi
wait_http "$OIDC_ISSUER/.well-known/openid-configuration" 200 "IdP discovery"

# ---- 2. product run database ------------------------------------------------
if docker inspect "$PG_NAME" >/dev/null 2>&1; then
  running=$(docker inspect -f '{{.State.Running}}' "$PG_NAME")
  [ "$running" = "true" ] || { log "starting existing container $PG_NAME"; docker start "$PG_NAME" >>"$STATE/up.log" 2>&1; }
else
  log "creating container $PG_NAME (retained volume mc-p0-claude-pgdata)"
  docker run -d --name "$PG_NAME" --label mc.task=MC-ENABLE-E2-E4 \
    --env-file "$IDP_DIR/secrets/claude-pg.env" \
    -p "127.0.0.1:${PG_PORT}:5432" \
    -v mc-p0-claude-pgdata:/var/lib/postgresql postgres:18 >>"$STATE/up.log" 2>&1
fi
for _ in $(seq 1 30); do
  docker exec "$PG_NAME" pg_isready -U mcp0 -d mc_p0_run >/dev/null 2>&1 && break
  [ "$_" = 30 ] && die "product DB never became ready"
  sleep 1
done
log "product DB ready on 127.0.0.1:$PG_PORT"

# ---- 3. mcapi backend -------------------------------------------------------
# Constructed env: DB password is read from the secret file at runtime, never echoed.
PG_PW=$(cut -d= -f2 "$IDP_DIR/secrets/claude-pg.env")
umask 077
cat > "$STATE/mcapi.env" <<EOF
MC_DATABASE_URL=postgres://mcp0:${PG_PW}@127.0.0.1:${PG_PORT}/mc_p0_run
MC_OBJECT_BACKEND=fs
MC_OBJECT_DIR=$STATE/object-store
MC_OIDC_ISSUER=$OIDC_ISSUER
MC_OIDC_INTROSPECTION_URL=$OIDC_ISSUER/oauth/v2/introspect
MC_OIDC_AUDIENCE=$OIDC_AUDIENCE
MC_OIDC_API_KEY_FILE=$IDP_DIR/runtime/mc-api-app-key.json
MC_OIDC_API_CLIENT_ID=$OIDC_API_CLIENT_ID
MC_HTTP_ADDR=127.0.0.1:$API_PORT
MC_LOG_LEVEL=info
# Local/dev only (.env.example): enables the people-directory endpoint the UI uses
# to pick members — needed for the two-actor walkthrough (adding mc-bob).
MC_LOCAL_PEOPLE_DIRECTORY=true
EOF
unset PG_PW

if pid_alive "$STATE/mcapi.pid"; then
  log "mcapi already running"
else
  log "building mcapi from tree"
  (cd "$BACKEND" && go build -o "$STATE/mcapi" ./cmd/mcapi) >>"$STATE/up.log" 2>&1 \
    || die "mcapi build failed (see $STATE/up.log)"
  log "applying migrations"
  (set -a; . "$STATE/mcapi.env"; set +a; "$STATE/mcapi" migrate) >>"$STATE/up.log" 2>&1 \
    || die "mcapi migrate failed (see $STATE/up.log)"
  log "seeding synthetic product users (idempotent)"
  "$IDP_DIR/seed-users.sh" >>"$STATE/up.log" 2>&1 || die "seed-users failed (see $STATE/up.log)"
  (set -a; . "$STATE/mcapi.env"; set +a
   start_detached "$STATE/mcapi.log" "$STATE/mcapi.pid" "$STATE/mcapi")
fi
wait_http "http://127.0.0.1:${API_PORT}/readyz" 200 "mcapi"

# ---- 4. fault proxy (E-4) ---------------------------------------------------
echo off > "$STATE/fault-mode"
if pid_alive "$STATE/faultproxy.pid"; then
  log "faultproxy already running"
else
  go build -o "$STATE/faultproxy" "$BROWSER_DIR/faultproxy/main.go" >>"$STATE/up.log" 2>&1 \
    || die "faultproxy build failed (see $STATE/up.log)"
  start_detached "$STATE/faultproxy.log" "$STATE/faultproxy.pid" \
    "$STATE/faultproxy" -listen "127.0.0.1:${PROXY_PORT}" -upstream "127.0.0.1:${API_PORT}" \
    -mode-file "$STATE/fault-mode"
fi
wait_http "http://127.0.0.1:${PROXY_PORT}/readyz" 200 "fault proxy (pass-through)"

# ---- 5. frontend ------------------------------------------------------------
if pid_alive "$STATE/frontend.pid"; then
  log "frontend already running"
else
  log "starting next dev on 127.0.0.1:$FE_PORT (log $STATE/frontend.log)"
  (cd "$FRONTEND" && start_detached "$STATE/frontend.log" "$STATE/frontend.pid" \
    ./node_modules/.bin/next dev -H 127.0.0.1 -p "$FE_PORT")
fi
for _ in $(seq 1 90); do
  code=$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:${FE_PORT}/" 2>/dev/null || true)
  [ "$code" != "000" ] && [ -n "$code" ] && { log "frontend ready (HTTP $code)"; break; }
  [ "$_" = 90 ] && die "frontend not ready — see $STATE/frontend.log"
  sleep 1
done

# ---- 6. summary -------------------------------------------------------------
cat <<SUMMARY

[up] BROWSER WALKTHROUGH ENV UP (loopback-only)
[up]   IdP        $OIDC_ISSUER            (mc-p0-idp compose)
[up]   Product DB 127.0.0.1:$PG_PORT        (container $PG_NAME)
[up]   mcapi      http://127.0.0.1:$API_PORT (direct; via proxy below)
[up]   Fault proxy http://127.0.0.1:$PROXY_PORT  (frontend API_BASE_URL target; mode: off)
[up]   Frontend   http://localhost:$FE_PORT        (registered OIDC callback origin)
[up] Login: open http://localhost:$FE_PORT — seeded users mc-alice / mc-bob
[up] Faults: ./fault-latency.sh / ./fault-5xx.sh / ./fault-restore.sh
[up] Teardown (mandatory): ./down.sh
SUMMARY
