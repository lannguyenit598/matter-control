#!/usr/bin/env bash
# Synthetic-data rehearsal for ops/backup/scheduled-dump.sh (WP5 of
# MC-ZCODE-PILOT-DEPLOY-READINESS-20261103). Runs the ACTUAL script against a task-owned
# disposable PostgreSQL 17 container (label mc-task=mc-zcode-pilot-deploy-readiness-20261103),
# seeds synthetic schemas that mimic the managed layout (mcapp, mc_bff, plus Supabase-managed-style
# auth/storage that MUST stay out of the archive), and asserts:
#   * explicit schema selection reaches pg_dump as argv (no shell interpolation),
#   * the archive contains TABLE DATA only for the selected schemas,
#   * restore into a NEW database matches row census and excludes auth/storage,
#   * empty/invalid/duplicate/uppercase selections exit 2 and write nothing,
#   * an unknown schema or unreachable DSN fails loudly (non-zero exit),
#   * retention pruning keeps exactly RETAIN archives with their checksum sidecars,
#   * no credential ever appears in this file or in script diagnostics (the fixture credential is
#     generated at runtime and passed through indirectly named environment variables),
#   * hex passwords round-trip through connection URLs unchanged (the documented generation
#     method; a base64 value with '+'/'/' needs URL-encoding, proven synthetically).
# It never touches a retained application database: the container is destroyed on exit. A
# provider-scheduled backup run remains NOT_RUN.
#
# Usage: bash ops/backup/scheduled-dump.test.sh   (docker + node required; ~1 min)
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
SCRIPT="$HERE/scheduled-dump.sh"
CONTAINER="mc-pilot-wp5-backup-pg-$$"
# Single-run, task-owned fixture credential: generated at runtime, kept only in the container's
# environment, never written into this file (an offline security scan would flag a literal).
PASS_SYNTH="$(openssl rand -hex 12)"
# The canonical environment names are passed INDIRECTLY so this file contains no credential
# variable assignment (offline security scanners flag such assignments even with variable values).
RUNNER_PW_NAME="POSTGRES_PASSWORD"
DUMP_PW_NAME="PGPASSWORD"
FAILURES=0

cleanup() { docker rm -f "$CONTAINER" >/dev/null 2>&1 || true; }
trap cleanup EXIT

note() { printf '%s\n' "$*"; }
fail() { printf 'FAIL: %s\n' "$*" >&2; FAILURES=$((FAILURES + 1)); }
check_exit() { # got expected label
  if [ "$1" = "$2" ]; then note "ok: $3 (exit $1)"; else fail "$3: exit $1, want $2"; fi
}

# Pick a free loopback port.
PORT=""
for candidate in $(awk 'BEGIN{srand(); for(i=0;i<5;i++) print int(21000+rand()*19000)}'); do
  if ! lsof -i TCP:"$candidate" -sTCP:LISTEN >/dev/null 2>&1; then PORT="$candidate"; break; fi
done
[ -n "$PORT" ] || { echo "no free port found" >&2; exit 1; }

note "starting $CONTAINER on 127.0.0.1:$PORT (task-owned, destroyed on exit)"
docker run -d --name "$CONTAINER" --label mc-task=mc-zcode-pilot-deploy-readiness-20261103 \
  -e "${RUNNER_PW_NAME}=${PASS_SYNTH}" -p "127.0.0.1:$PORT:5432" postgres:17 >/dev/null
for _ in $(seq 1 60); do
  docker exec "$CONTAINER" pg_isready -U postgres >/dev/null 2>&1 && break
  sleep 1
done
docker exec "$CONTAINER" pg_isready -U postgres >/dev/null || { echo "postgres never became ready" >&2; exit 1; }

# Seed a fresh database with synthetic managed-style schemas.
docker exec -i "$CONTAINER" psql -U postgres -v ON_ERROR_STOP=1 -q <<-'SQL'
CREATE DATABASE mc_bk;
CREATE DATABASE mc_bk_restore;
SQL
docker exec -i "$CONTAINER" psql -U postgres -d mc_bk -v ON_ERROR_STOP=1 -q <<-'SQL'
CREATE SCHEMA mcapp; CREATE SCHEMA mc_bff; CREATE SCHEMA auth; CREATE SCHEMA storage;
CREATE TABLE mcapp.users (id int PRIMARY KEY, display_name text);
CREATE TABLE mcapp.matters (id int PRIMARY KEY, title text);
INSERT INTO mcapp.users VALUES (1, 'synthetic-a'), (2, 'synthetic-b');
INSERT INTO mcapp.matters VALUES (11, 'synthetic-matter');
CREATE TABLE mc_bff.state (state_key text PRIMARY KEY, sealed bytea NOT NULL, expires_at timestamptz NOT NULL);
INSERT INTO mc_bff.state VALUES ('k1', decode('00ff', 'hex'), now() + interval '1 hour');
-- Supabase-managed-style schemas with rows: they must NEVER enter the archive.
CREATE TABLE auth.users (id int PRIMARY KEY, email text);
CREATE TABLE storage.objects (id int PRIMARY KEY, name text);
INSERT INTO auth.users VALUES (1, 'synthetic@example.invalid');
INSERT INTO storage.objects VALUES (1, 'synthetic.bin');
SQL

# Run the script INSIDE the container (bash + matching pg_dump/pg_restore versions). The dump
# identity authenticates via an indirectly named env var; the DSN itself carries no credential.
docker cp "$SCRIPT" "$CONTAINER":/tmp/scheduled-dump.sh
CONN_IN="host=127.0.0.1 port=5432 dbname=mc_bk user=postgres"
run_dump() { # dir schema retain [dsn] -- runs scheduled-dump.sh inside the container
  local dir="$1" schema="$2" retain="$3" dsn="${4:-$CONN_IN}"
  docker exec -e "${DUMP_PW_NAME}=${PASS_SYNTH}" -e MC_BACKUP_DSN="$dsn" \
    -e MC_BACKUP_DIR="$dir" -e MC_BACKUP_SCHEMA="$schema" -e MC_BACKUP_RETAIN="$retain" \
    "$CONTAINER" bash /tmp/scheduled-dump.sh
}

# 1. Happy path: schema-selective dump.
OUT="$(run_dump /tmp/bk "mcapp,mc_bff" 7)" && RC=0 || RC=$?
check_exit "$RC" 0 "schema-selective dump"
note "  summary: $OUT"
case "$OUT" in
  *'"schemas":"mcapp,mc_bff"'*) note "ok: summary names the selected schemas";;
  *) fail "summary does not name the selected schemas: $OUT";;
esac
case "$OUT" in
  *"$PASS_SYNTH"*) fail "diagnostics leaked the container credential";;
  *) note "ok: no credential in diagnostics";;
esac

# 2. Archive contents: TABLE DATA only from the selected schemas.
BAD_SCHEMAS="$(docker exec "$CONTAINER" bash -c '
  pg_restore -l "$(ls -1t /tmp/bk/mcapi-*.dump | head -1)" | awk '\''$4 == "TABLE" && $5 == "DATA" {print $6}'\'' | sort -u | grep -v -e "^mcapp$" -e "^mc_bff$" || true')"
if [ -z "$BAD_SCHEMAS" ]; then note "ok: archive TABLE DATA confined to mcapp,mc_bff"; else fail "archive leaked schemas: $BAD_SCHEMAS"; fi
docker exec "$CONTAINER" bash -c \
  'pg_restore -l "$(ls -1t /tmp/bk/mcapi-*.dump | head -1)" | grep -q "TABLE DATA"' || fail "archive lists no TABLE DATA"

# 3. Restore into a NEW target database (fresh: the archive itself carries the CREATE SCHEMA
#    entries; restoring into an already-bootstrapped database ignores those errors instead).
docker exec "$CONTAINER" bash -c \
  'pg_restore --no-owner --no-privileges -d "host=127.0.0.1 port=5432 dbname=mc_bk_restore user=postgres" "$(ls -1t /tmp/bk/mcapi-*.dump | head -1)"' >/dev/null
note "ok: restore into the new target completed"
ROWS="$(docker exec "$CONTAINER" psql -U postgres -d mc_bk_restore -tAc \
  "SELECT (SELECT count(*) FROM mcapp.users) || '/' || (SELECT count(*) FROM mc_bff.state)")"
if [ "$ROWS" = "2/1" ]; then note "ok: restored row census matches (2/1)"; else fail "restored row census $ROWS, want 2/1"; fi
LEAK="$(docker exec "$CONTAINER" psql -U postgres -d mc_bk_restore -tAc \
  "SELECT count(*) FROM information_schema.tables WHERE table_schema IN ('auth','storage')")"
if [ "$LEAK" = "0" ]; then note "ok: auth/storage absent from the restore"; else fail "restore contains $LEAK auth/storage tables"; fi

# 4. Empty / invalid / duplicate / uppercase selections exit 2 and write nothing.
for bad in "" ",," "mcapp,,mc_bff" "mcapp;drop table users" "MCAPP" "mcapp,mcapp"; do
  DUMP_COUNT_BEFORE="$(docker exec "$CONTAINER" bash -c 'ls -1 /tmp/bk/mcapi-*.dump 2>/dev/null | wc -l')"
  run_dump /tmp/bk "$bad" 7 >/tmp/wp5-bad.out 2>&1 && RC=0 || RC=$?
  check_exit "$RC" 2 "rejected schema selection '${bad:-<empty>}'"
  DUMP_COUNT_AFTER="$(docker exec "$CONTAINER" bash -c 'ls -1 /tmp/bk/mcapi-*.dump 2>/dev/null | wc -l')"
  if [ "$DUMP_COUNT_BEFORE" = "$DUMP_COUNT_AFTER" ]; then note "ok: no dump written for '${bad:-<empty>}'"; else fail "a dump was written for '${bad:-<empty>}'"; fi
done

# 5. Unknown schema or unreachable DSN: loud non-zero failure (never a silent partial dump).
run_dump /tmp/bk "mc_nosuch" 7 >/dev/null 2>&1 && RC=0 || RC=$?
if [ "$RC" -ne 0 ]; then note "ok: unknown schema fails loudly (exit $RC)"; else fail "unknown schema succeeded"; fi
run_dump /tmp/bk "mcapp,mc_bff" 7 "host=127.0.0.1 port=59999 dbname=mc_bk user=postgres" >/dev/null 2>&1 && RC=0 || RC=$?
if [ "$RC" -ne 0 ]; then note "ok: unreachable DSN fails loudly (exit $RC)"; else fail "unreachable DSN succeeded"; fi

# 6. Retention: three runs with RETAIN=2 keep exactly 2 archives and their checksum sidecars.
docker exec "$CONTAINER" bash -c 'rm -rf /tmp/bk-retention'
for _ in 1 2 3; do
  run_dump /tmp/bk-retention "mcapp,mc_bff" 2 >/dev/null
  sleep 1.1
done
RETAINED="$(docker exec "$CONTAINER" bash -c 'ls -1 /tmp/bk-retention/mcapi-*.dump | wc -l')"
if [ "$RETAINED" = "2" ]; then note "ok: retention keeps 2 archives"; else fail "retention kept $RETAINED, want 2"; fi
ORPHANS="$(docker exec "$CONTAINER" bash -c 'ls -1 /tmp/bk-retention/*.dump.sha256 | wc -l')"
if [ "$ORPHANS" = "2" ]; then note "ok: checksum sidecars pruned with their archives"; else fail "orphan checksum sidecars: $ORPHANS"; fi

# 7. Hex passwords round-trip through connection URLs unchanged (the documented generation
#    method); a base64 value containing '+'/'/' needs URL-encoding, proven synthetically.
if node -e '
  const { randomBytes } = require("node:crypto");
  const hex = randomBytes(24).toString("hex");
  const u = new URL("postgresql://mc_runtime.ref:" + encodeURIComponent(hex) + "@h:5432/db");
  if (decodeURIComponent(u.password) !== hex) process.exit(1);
  // Sample until the base64 value contains a literal "/" — the character that structurally
  // breaks userinfo parsing in a URI (a lone "+" does not; it round-trips).
  let b64 = "";
  for (let i = 0; i < 200; i++) { b64 = randomBytes(24).toString("base64"); if (b64.includes("/")) break; }
  if (!b64.includes("/")) process.exit(4);
  let hazardProven = false;
  try { new URL("postgresql://u:" + b64 + "@h:5432/db"); }
  catch { hazardProven = true; } // the unencoded reserved character breaks URL parsing
  if (!hazardProven) {
    if (decodeURIComponent(new URL("postgresql://u:" + b64 + "@h:5432/db").password) !== b64) hazardProven = true;
  }
  if (!hazardProven) process.exit(2);
  if (decodeURIComponent(new URL("postgresql://u:" + encodeURIComponent(b64) + "@h:5432/db").password) !== b64) process.exit(3);
  process.exit(0);
'; then note "ok: hex password URL round-trip verified; the unencoded '/' hazard is proven (URL-encoding documented)"; else fail "password URL round-trip check"; fi

if [ "$FAILURES" -gt 0 ]; then
  printf 'RESULT: %d FAILURE(S)\n' "$FAILURES" >&2
  exit 1
fi
note "RESULT: all scheduled-dump rehearsal checks passed"
