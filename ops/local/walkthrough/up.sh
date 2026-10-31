#!/bin/bash
# up.sh — bring up the local MatterControl walkthrough environment (CO-17, D-1(b)).
#
# Four disposable loopback-only pieces, following the BA flow-completeness r2
# pattern (docs/testing/zcode-ba-flow-completeness-20261030-r1/r2/):
#   1. PG container          mc-walkthrough-pg, label mc.task=MC-WALKTHROUGH
#   2. mcapi backend         built from the current tree (go build ./cmd/mcapi)
#   3. Stub IdP              RFC 7662 introspection for synthetic tokens (stubidp/)
#   4. Synthetic principals  5 users seeded in PG (issuer+subject, explicit provisioning)
#
# The stub API key pair is generated fresh here (0700 state dir, 0600 files,
# outside git, never printed) and is destroyed by down.sh. No secrets of any
# other task are read. Teardown: down.sh (mandatory when done — no orphans).
#
# Overrides: MC_WT_STATE_DIR, MC_WT_PG_PORT (15432), MC_WT_API_PORT (18083),
#            MC_WT_IDP_PORT (18093), MC_WT_PG_IMAGE (postgres:18.6-alpine).
set -Eeuo pipefail
export PATH=/usr/bin:/bin:/usr/sbin:/sbin:/opt/homebrew/bin:/usr/local/bin:$PATH

WALK_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$WALK_DIR/../../.." && pwd)"
BACKEND="$REPO_ROOT/apps/backend"

STATE="${MC_WT_STATE_DIR:-${TMPDIR:-/tmp}/mc-walkthrough-state}"
PG_NAME="mc-walkthrough-pg"
PG_PORT="${MC_WT_PG_PORT:-15432}"
API_PORT="${MC_WT_API_PORT:-18083}"
IDP_PORT="${MC_WT_IDP_PORT:-18093}"
PG_IMAGE="${MC_WT_PG_IMAGE:-postgres:18.6-alpine}"
PG_USER="mcwt"
PG_DB="mc_walkthrough"
ISSUER="http://127.0.0.1:${IDP_PORT}"
AUDIENCE="mc-walkthrough-aud"
API_CLIENT_ID="mc-walkthrough-api"
KEY_ID="mc-walkthrough-key-1"

log() { echo "[up] $*"; }
fail() { echo "[up] ERROR: $*" >&2; exit 1; }

# stop_pid_from kills only a plain numeric PID recorded in a pidfile; anything
# else is ignored, never executed (Mimosa: command-injection hardening).
stop_pid_from() {
  local f="$1" pid
  [[ -f "$f" ]] || return 0
  pid="$(cat "$f" 2>/dev/null)"
  case "$pid" in
    '' | *[!0-9]*) return 0 ;;
  esac
  kill "$pid" 2>/dev/null
  return 0
}

# --- failure trap: best-effort teardown so a failed up never leaves orphans ---
cleanup_on_fail() {
  trap - ERR
  echo "[up] failed — best-effort teardown (no orphans)" >&2
  stop_pid_from "$STATE/mcapi.pid"
  stop_pid_from "$STATE/stubidp.pid"
  docker rm -f "$PG_NAME" >/dev/null 2>&1
  rm -rf "$STATE"
  return 0
}
trap cleanup_on_fail ERR

# --- preflight ---
for tool in docker go openssl python3 curl lsof; do
  command -v "$tool" >/dev/null 2>&1 || fail "missing tool: $tool"
done
docker info >/dev/null 2>&1 || fail "docker daemon not reachable"
if docker ps -a --format '{{.Names}}' | grep -qx "$PG_NAME"; then
  fail "container $PG_NAME already exists — run ops/local/walkthrough/down.sh first"
fi
for p in "$PG_PORT" "$API_PORT" "$IDP_PORT"; do
  if lsof -nP -iTCP:"$p" -sTCP:LISTEN >/dev/null 2>&1; then
    fail "port $p already in use — choose another via MC_WT_PG_PORT/MC_WT_API_PORT/MC_WT_IDP_PORT"
  fi
done
if [[ -e "$STATE" ]]; then
  fail "state dir $STATE exists — run ops/local/walkthrough/down.sh first (or set MC_WT_STATE_DIR)"
fi
[[ -f "$BACKEND/cmd/mcapi/main.go" ]] || fail "apps/backend tree not found at $BACKEND"

log "state dir $STATE (0700)"
mkdir -p "$STATE/objects"
chmod 700 "$STATE"

# --- 1. PG container ---
log "starting PG container $PG_NAME ($PG_IMAGE, 127.0.0.1:${PG_PORT})"
PG_PW="$(openssl rand -hex 16)"
docker run -d --name "$PG_NAME" --label mc.task=MC-WALKTHROUGH \
  -e POSTGRES_USER="$PG_USER" -e POSTGRES_PASSWORD="$PG_PW" -e POSTGRES_DB="$PG_DB" \
  -p "127.0.0.1:${PG_PORT}:5432" "$PG_IMAGE" >/dev/null
PG_READY=0
for _ in $(seq 1 30); do
  if docker exec "$PG_NAME" pg_isready -q -U "$PG_USER" -d "$PG_DB" 2>/dev/null; then PG_READY=1; break; fi
  sleep 1
done
[[ "$PG_READY" = "1" ]] || fail "PG not ready after 30s"
log "PG ready (db $PG_DB, user $PG_USER)"

# --- 2. build mcapi + stub ---
log "building mcapi from apps/backend (current tree)"
(cd "$BACKEND" && go build -o "$STATE/mcapi" ./cmd/mcapi)
log "building stub IdP"
go build -o "$STATE/stubidp" "$WALK_DIR/stubidp/main.go"

# --- 3. stub API key (fresh, disposable, never leaves the state dir) ---
log "generating walkthrough API key pair (one-time, 0600, outside git)"
openssl genrsa -out "$STATE/stub-key.pem" 2048 >/dev/null 2>&1
chmod 600 "$STATE/stub-key.pem"
python3 - "$STATE/stub-key.pem" "$STATE/key.json" "$KEY_ID" "$API_CLIENT_ID" <<'PY'
import json, sys
pem = open(sys.argv[1], encoding="utf-8").read()
json.dump({"keyId": sys.argv[3], "key": pem, "clientId": sys.argv[4]},
          open(sys.argv[2], "w", encoding="utf-8"))
PY
chmod 600 "$STATE/key.json"

# --- 4. runtime env (0600; contains the synthetic DB password; removed by down.sh) ---
cat > "$STATE/run.env" <<ENV
export MC_HTTP_ADDR=127.0.0.1:${API_PORT}
export MC_DATABASE_URL=postgres://${PG_USER}:${PG_PW}@127.0.0.1:${PG_PORT}/${PG_DB}?sslmode=disable
export MC_MIGRATE_ON_START=true
export MC_OIDC_ISSUER=${ISSUER}
export MC_OIDC_INTROSPECTION_URL=${ISSUER}/introspect
export MC_OIDC_AUDIENCE=${AUDIENCE}
export MC_OIDC_API_KEY_FILE=${STATE}/key.json
export MC_OIDC_API_CLIENT_ID=${API_CLIENT_ID}
export MC_OBJECT_DIR=${STATE}/objects
export MC_LOG_LEVEL=warn
ENV
chmod 600 "$STATE/run.env"
set -a
# shellcheck disable=SC1091
. "$STATE/run.env"
set +a

# --- 5. stub IdP ---
log "starting stub IdP on 127.0.0.1:${IDP_PORT} (issuer ${ISSUER})"
MC_WT_IDP_ADDR="127.0.0.1:${IDP_PORT}" MC_WT_IDP_ISSUER="$ISSUER" \
  MC_WT_IDP_AUDIENCE="$AUDIENCE" MC_WT_IDP_LOG="$STATE/stubidp.log" \
  "$STATE/stubidp" >>"$STATE/stubidp.stdout.log" 2>&1 &
echo $! >"$STATE/stubidp.pid"
for _ in $(seq 1 60); do
  curl -fsS -o /dev/null "http://127.0.0.1:${IDP_PORT}/healthz" 2>/dev/null && break
  sleep 0.5
done
curl -fsS -o /dev/null "http://127.0.0.1:${IDP_PORT}/healthz" || fail "stub IdP not healthy"

# --- 6. migrations + serve ---
log "applying product migrations (mcapi migrate)"
"$STATE/mcapi" migrate
log "starting mcapi on 127.0.0.1:${API_PORT}"
"$STATE/mcapi" >>"$STATE/mcapi.log" 2>&1 &
echo $! >"$STATE/mcapi.pid"
for _ in $(seq 1 120); do
  curl -fsS -o /dev/null "http://127.0.0.1:${API_PORT}/readyz" 2>/dev/null && break
  sleep 0.5
done
curl -fsS -o /dev/null "http://127.0.0.1:${API_PORT}/readyz" || fail "mcapi not ready (see $STATE/mcapi.log)"

# --- 7. seed the 5 synthetic principals (explicit provisioning; fixed synthetic UUIDs) ---
log "seeding 5 synthetic users (issuer ${ISSUER})"
docker exec -i "$PG_NAME" psql -v ON_ERROR_STOP=1 -U "$PG_USER" -d "$PG_DB" \
  -v issuer="$ISSUER" <<'SQL' >/dev/null
INSERT INTO users (id, idp_issuer, idp_subject, display_name) VALUES
 ('00000000-0000-0000-0000-0000000000a1', :'issuer', 'wt-alice',   'Walkthrough Alice (OWNER persona)'),
 ('00000000-0000-0000-0000-0000000000a2', :'issuer', 'wt-binh',    'Walkthrough Binh (EDITOR, designated verifier)'),
 ('00000000-0000-0000-0000-0000000000a3', :'issuer', 'wt-editor2', 'Walkthrough Editor2 (EDITOR, submit/verify separation)'),
 ('00000000-0000-0000-0000-0000000000a4', :'issuer', 'wt-cuc',     'Walkthrough Cuc (VIEWER persona)'),
 ('00000000-0000-0000-0000-0000000000a5', :'issuer', 'wt-dung',    'Walkthrough Dung (non-member persona)')
ON CONFLICT (idp_issuer, idp_subject) DO NOTHING;
SQL
CNT="$(docker exec "$PG_NAME" psql -tA -U "$PG_USER" -d "$PG_DB" -c 'SELECT count(*) FROM users')"
[[ "$CNT" = "5" ]] || fail "unexpected user count after seed: $CNT"

trap - ERR
cat <<SUMMARY

== MatterControl walkthrough is up ==
  PG:        docker container "$PG_NAME" (label mc.task=MC-WALKTHROUGH) on 127.0.0.1:${PG_PORT}
  API:       http://127.0.0.1:${API_PORT}  (readyz OK; migrations applied)
  Stub IdP:  http://127.0.0.1:${IDP_PORT}  (introspection; issuer ${ISSUER})
  Users:     wt-alice (OWNER) / wt-binh (EDITOR, verifier) / wt-editor2 (EDITOR)
             wt-cuc (VIEWER) / wt-dung (non-member)
  Next:      ops/local/walkthrough/mint-token.sh wt-alice
  Teardown:  ops/local/walkthrough/down.sh   (mandatory when done — no orphans)
  State:     $STATE (0700, disposable keys, removed by down.sh)
SUMMARY
