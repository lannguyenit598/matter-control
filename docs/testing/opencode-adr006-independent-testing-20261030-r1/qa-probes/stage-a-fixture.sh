#!/bin/bash
# QA orchestrator step 2: owned PostgreSQL 18.6 fixture + private env + backend/FE gates.
# Fixture: fresh container, unique name/labels (owner=opencode), loopback-only port,
# random credential in 0600 env file; DB name mc_fixture (required by BFF test guard).
set -euo pipefail

OUT=/Users/nguyenvanlan/Documents/code/pet-projects/matter-control/docs/testing/opencode-adr006-independent-testing-20261030-r1
WORK=$(cat "$OUT/work-dir.txt")
SNAP="$WORK/snapshot"
PRIVATE="$WORK/private"
FENV="$PRIVATE/fixture.env"          # contains constructed env lines incl. password (0600)
DSNFILE="$PRIVATE/dsn.env"           # MC_TEST_DATABASE_URL + MC_BFF_TEST_DATABASE_URL (0600)
NOW_UTC() { date -u +%Y-%m-%dT%H:%M:%SZ; }
docker info >/dev/null 2>&1 || { echo "DOCKER_UNAVAILABLE"; exit 4; }

NAME="mc-opencode-qa-$(date -u +%H%M%S)$(python3 -c 'import secrets;print(secrets.token_hex(3))')"
PORTS=""
for i in 1 2; do PORTS="$PORTS $(python3 -c 'import secrets;print(20000+secrets.randbelow(20000))')"; done
PORT=""
for p in $PORTS; do
  if ! nc -z 127.0.0.1 "$p" 2>/dev/null; then PORT=$p; break; fi
done
[ -n "$PORT" ] || { echo "NO_FREE_PORT candidates=$PORTS"; exit 5; }

PASS_HEX=$(openssl rand -hex 24)
USER_DB="mcqa$(date -u +%H%M%S)$(openssl rand -hex 2)"
umask 177
cat > "$FENV" <<EOF
POSTGRES_PASSWORD=$PASS_HEX
EOF
chmod 600 "$FENV"
cat > "$DSNFILE" <<EOF
MC_TEST_DATABASE_URL=postgres://$USER_DB:$PASS_HEX@127.0.0.1:$PORT/mc_fixture?sslmode=disable
MC_BFF_TEST_DATABASE_URL=postgres://$USER_DB:$PASS_HEX@127.0.0.1:$PORT/mc_fixture?sslmode=disable
EOF
chmod 600 "$DSNFILE"

CID=$(docker run -d --name "$NAME" \
  --label qa.owner=opencode --label qa.task=MC-OPENCODE-ADR006-INDEPENDENT-TESTING-20261030 \
  --label qa.stage=A --label qa.created="$(NOW_UTC)" \
  --env-file "$FENV" \
  -e POSTGRES_USER="$USER_DB" -e POSTGRES_DB=mc_fixture \
  --memory 2g --cpus 2 --publish "127.0.0.1:$PORT:5432" postgres:18.6-alpine)

python3 - <<PY
import json, os, time
out={"container_name":"$NAME","container_id":"$CID","port":$PORT,
     "owner_labels":{"qa.owner":"opencode","qa.task":"MC-OPENCODE-ADR006-INDEPENDENT-TESTING-20261030","qa.stage":"A"},
     "started_utc":"$(NOW_UTC)","image":"postgres:18.6-alpine","memory":"2g","cpus":"2",
     "binding":"127.0.0.1-only (--publish 127.0.0.1:$PORT:5432)","database":"mc_fixture",
     "credentials_file":"work-dir private/fixture.env (0600)","dsn_file":"work-dir private/dsn.env (0600)",
     "user":"$USER_DB"}
import pathlib; p=pathlib.Path("$PRIVATE"); (p/"fixture-identity.json").write_text(json.dumps(out,indent=2))
PY
chmod 600 "$PRIVATE/fixture-identity.json"

READY=no
for i in $(seq 1 40); do
  if docker exec "$NAME" pg_isready -U "$USER_DB" -d mc_fixture >/dev/null 2>&1; then READY=yes; break; fi
  sleep 2
done
SERVER_VER=$(docker exec "$NAME" psql -U "$USER_DB" -d mc_fixture -tA -c "select version();" 2>/dev/null | head -1 || true)
echo "READY=$READY"
echo "PG_VERSION=$SERVER_VER"
python3 - "$PRIVATE" "$SERVER_VER" <<'PY'
import json, pathlib, sys
DBNAME = 'mc_fixture'
p=pathlib.Path(sys.argv[1])
d=json.loads((p/"fixture-identity.json").read_text())
d["pg_readiness_wait"]="ready" if len(sys.argv)>2 and sys.argv[2] else "NOT_READY"
d["server_version_string"]=sys.argv[2] if len(sys.argv)>2 else None
(p/"fixture-identity.json").write_text(json.dumps(d,indent=2))
PY
echo "FIXTURE_READY $NAME port=$PORT"
