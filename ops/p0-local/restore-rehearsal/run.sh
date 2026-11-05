#!/usr/bin/env bash
# Isolated whole-product restore rehearsal (synthetic data only).
#   source  : a NEW database in the task-owned product-test container + a NEW object directory
#   target  : a NEW database in the task-owned restore-target container + a NEW object directory
# It refuses an existing target, never touches mc_p0_run, the native/test schemas, the IdP cluster or
# any other database, and prints no DSN or password. Evidence goes to $OUT.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
ENVFILE="${MC_TESTENV:-/tmp/mc-p0-zcode-testenv/dsns.env}"
SRC_C="${MC_SRC_CONTAINER:-mc-p0-zcode-pg-product-test}"
DST_C="${MC_DST_CONTAINER:-mc-p0-zcode-pg-restore-target}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
LSTAMP="$(printf %s "$STAMP" | tr A-Z a-z)"
SRC_DB="mc_rr_src_${LSTAMP}"; DST_DB="mc_rr_dst_${LSTAMP}"; NEG_DB="mc_rr_neg_${LSTAMP}"
WORK="${MC_RR_WORK:-/tmp/mc-rr-${STAMP}}"
OUT="${MC_RR_OUT:-$ROOT/docs/testing/p0-codex-remediation-20261028/restore/runs/${STAMP}}"
VERIFY="$ROOT/ops/p0-local/restore-rehearsal/verify.py"
[ ! -e "$OUT" ] && [ ! -e "$WORK" ] || { echo "evidence and work directories must be new" >&2; exit 2; }
mkdir -p "$OUT" "$WORK"; chmod 700 "$WORK"
set -a; . "$ENVFILE"; set +a

dsn_for() { # <base dsn> <db>
  printf '%s' "$1" | python3 "$VERIFY" dsn "$2"
}
user_of() { printf '%s' "$1" | python3 "$VERIFY" dsn-user; }
SRC_USER="$(user_of "$PRODUCT_DSN")"; DST_USER="$(user_of "$RESTORE_DSN")"
SRC_DSN="$(dsn_for "$PRODUCT_DSN" "$SRC_DB")"; DST_DSN="$(dsn_for "$RESTORE_DSN" "$DST_DB")"
SRC_OBJ="$WORK/objects-src"; DST_OBJ="$WORK/objects-dst"
psql_src() { docker exec -i "$SRC_C" psql -U "$SRC_USER" -d "$1" -v ON_ERROR_STOP=1 -At "${@:2}"; }
psql_dst() { docker exec -i "$DST_C" psql -U "$DST_USER" -d "$1" -v ON_ERROR_STOP=1 -At "${@:2}"; }
now() { python3 -c 'import time;print(time.time())'; }
dur() { python3 -c "print(round($2-$1,3))"; }
log() { printf '%s %s\n' "$(date -u +%FT%TZ)" "$*" | tee -a "$OUT/steps.log"; }

# ---- preflight: distinct, owned, empty targets -------------------------------------------------
[ "$SRC_C" != "$DST_C" ] || { echo "source and target containers must differ" >&2; exit 2; }
for c in "$SRC_C" "$DST_C"; do
  docker inspect "$c" --format '{{index .Config.Labels "mc.task"}}' | grep -q 'MC-P0' || { echo "container $c is not task-owned" >&2; exit 2; }
done
[ -z "$(psql_dst postgres -c "select 1 from pg_database where datname = '$DST_DB'")" ] || { echo "target database exists" >&2; exit 2; }
[ -z "$(psql_src postgres -c "select 1 from pg_database where datname = '$SRC_DB'")" ] || { echo "source database exists" >&2; exit 2; }
[ ! -e "$SRC_OBJ" ] && [ ! -e "$DST_OBJ" ] || { echo "object roots must not exist" >&2; exit 2; }
SRC_SYS="$(psql_src postgres -c 'select system_identifier from pg_control_system()')"
DST_SYS="$(psql_dst postgres -c 'select system_identifier from pg_control_system()')"
[ "$SRC_SYS" != "$DST_SYS" ] || { echo "source and target are the same cluster" >&2; exit 2; }
log "preflight ok: src=$SRC_C/$SRC_DB dst=$DST_C/$DST_DB tools=$(docker exec "$SRC_C" pg_dump --version) / $(docker exec "$DST_C" pg_restore --version)"
psql_src postgres -c "CREATE DATABASE $SRC_DB" >/dev/null
psql_dst postgres -c "CREATE DATABASE $DST_DB" >/dev/null
mkdir -p "$SRC_OBJ" && chmod 700 "$SRC_OBJ"

gotest() { # <mode> [env...]
  local mode="$1"; shift
  (cd "$ROOT/apps/backend" && env MC_RESTORE_MODE="$mode" "$@" go test ./internal/adapter/outbound/postgres -run '^TestRestoreRehearsal$' -count=1 -timeout 20m -v 2>&1)
}

# ---- seed the complete synthetic source -------------------------------------------------------
t0=$(now)
gotest seed MC_RESTORE_SRC_DSN="$SRC_DSN" MC_RESTORE_SRC_OBJECTS="$SRC_OBJ" > "$WORK/seed.log" || { tail -30 "$WORK/seed.log" | sed -E 's#postgres://[^ ]*#postgres://REDACTED#g'; exit 1; }
t1=$(now); log "seed done in $(dur $t0 $t1)s"
grep -E '^(--- |ok|PASS|FAIL)' "$WORK/seed.log" | sed -E 's#postgres://[^ ]*#postgres://REDACTED#g' > "$OUT/seed-summary.txt" || true

# ---- census (stable canonical row hashes) -----------------------------------------------------
census() { # <psql fn> <db> <out>
  local fn="$1" db="$2" out="$3"
  local tables; tables="$($fn "$db" -c "select tablename from pg_tables where schemaname='public' order by 1")"
  : > "$out"
  for tb in $tables; do
    $fn "$db" -c "select '$tb' || E'\t' || count(*) || E'\t' || coalesce(md5(string_agg(x::text, '|' order by x::text)), '-') from \"$tb\" x" >> "$out"
  done
}
objcensus() { (cd "$1" && find . -type f -not -path '*/tmp/*' -print0 | sort -z | xargs -0 shasum -a 256 2>/dev/null) > "$2"; }
census psql_src "$SRC_DB" "$OUT/census-source-at-B.tsv"
objcensus "$SRC_OBJ" "$OUT/objects-source-at-B.txt"
BOUNDARY="$(psql_src "$SRC_DB" -c "select coalesce(max(recorded_at)::text,'-') || ' seq-sum ' || coalesce(sum(seq),0) from domain_events")"
log "boundary B (quiescent: the seeding process has exited; nothing else writes this database): last event $BOUNDARY; $(wc -l < "$OUT/objects-source-at-B.txt") object files"

# Pin the exact pre-marker readback so missing restored Matters cannot be excused as new source data.
gotest readback MC_RESTORE_DSN="$SRC_DSN" MC_RESTORE_OBJECTS="$SRC_OBJ" MC_RESTORE_OUT="$OUT/readback-source-at-B.json" > "$WORK/rb-boundary.log" || { echo "boundary readback failed" >&2; exit 1; }

# ---- backup -----------------------------------------------------------------------------------
t0=$(now)
docker exec "$SRC_C" pg_dump -U "$SRC_USER" -d "$SRC_DB" -Fc -f /tmp/rr-${STAMP}.dump
docker cp "$SRC_C:/tmp/rr-${STAMP}.dump" "$WORK/rr.dump"; docker exec "$SRC_C" rm -f /tmp/rr-${STAMP}.dump
t1=$(now)
shasum -a 256 "$WORK/rr.dump" | cut -d' ' -f1 > "$OUT/archive.sha256"; stat -f %z "$WORK/rr.dump" > "$OUT/archive.bytes"
log "backup done in $(dur $t0 $t1)s, $(cat "$OUT/archive.bytes") bytes, sha256 $(cat "$OUT/archive.sha256")"
BACKUP_S="$(dur $t0 $t1)"
# archive readable?
docker cp "$WORK/rr.dump" "$DST_C:/tmp/rr-${STAMP}.dump"
docker exec "$DST_C" pg_restore -l /tmp/rr-${STAMP}.dump | grep -c 'TABLE DATA' > "$OUT/archive-table-data-entries.txt"

# ---- post-boundary marker (must be absent from the restore) -----------------------------------
gotest marker MC_RESTORE_SRC_DSN="$SRC_DSN" MC_RESTORE_SRC_OBJECTS="$SRC_OBJ" > "$WORK/marker.log" || { tail -10 "$WORK/marker.log"; exit 1; }
MARKER_SRC="$(psql_src "$SRC_DB" -c "select count(*) from workspaces where name = 'POST-BOUNDARY-MARKER'")"

# ---- restore into the fresh target ------------------------------------------------------------
t0=$(now)
docker exec "$DST_C" pg_restore -U "$DST_USER" -d "$DST_DB" --exit-on-error --single-transaction --no-owner /tmp/rr-${STAMP}.dump
cp -Rn "$SRC_OBJ" "$DST_OBJ"; chmod -R go-rwx "$DST_OBJ"
t1=$(now); RESTORE_S="$(dur $t0 $t1)"; log "restore done in ${RESTORE_S}s"
census psql_dst "$DST_DB" "$OUT/census-restored.tsv"
objcensus "$DST_OBJ" "$OUT/objects-restored.txt"
diff -u "$OUT/census-source-at-B.tsv" "$OUT/census-restored.tsv" > "$OUT/census.diff" && CENSUS=IDENTICAL || CENSUS=DIFFERENT
diff -u "$OUT/objects-source-at-B.txt" "$OUT/objects-restored.txt" > "$OUT/objects.diff" && OBJECTS=IDENTICAL || OBJECTS=DIFFERENT
MARKER_DST="$(psql_dst "$DST_DB" -c "select count(*) from workspaces where name = 'POST-BOUNDARY-MARKER'")"
log "census=$CENSUS objects=$OBJECTS marker(src=$MARKER_SRC,restored=$MARKER_DST)"

# ---- readback through the real services, then after a fresh process (restart) -----------------
gotest readback MC_RESTORE_DSN="$DST_DSN" MC_RESTORE_OBJECTS="$DST_OBJ" MC_RESTORE_OUT="$OUT/readback-restored.json" > "$WORK/rb1.log" || { tail -15 "$WORK/rb1.log"; exit 1; }
gotest readback MC_RESTORE_DSN="$DST_DSN" MC_RESTORE_OBJECTS="$DST_OBJ" MC_RESTORE_OUT="$WORK/readback-restart.json" > "$WORK/rb2.log" || { tail -15 "$WORK/rb2.log"; exit 1; }
diff -q "$OUT/readback-restored.json" "$WORK/readback-restart.json" >/dev/null && RESTART=IDENTICAL || RESTART=DIFFERENT
# Compare the restored identities and facts to the exact readback captured at boundary B.
if READBACK="$(python3 "$VERIFY" readback "$OUT/readback-source-at-B.json" "$OUT/readback-restored.json" "$OUT/readback.diff")"; then
  :
else
  READBACK=DIFFERENT
fi
shasum -a 256 "$OUT/readback-restored.json" | cut -d' ' -f1 > "$OUT/readback-restored.sha256"
log "readback restored-vs-source=$READBACK restart=$RESTART"

# ---- refusal cases on disposable copies --------------------------------------------------------
neg() { # <label> <archive>
  docker cp "$2" "$DST_C:/tmp/rr-neg-${STAMP}.dump"
  [ -z "$(psql_dst postgres -c "select 1 from pg_database where datname = '$NEG_DB'")" ] || { echo "negative target database exists; refusing" >&2; return 2; }
  psql_dst postgres -c "CREATE DATABASE $NEG_DB" >/dev/null
  set +e
  docker exec "$DST_C" pg_restore -U "$DST_USER" -d "$NEG_DB" --exit-on-error --single-transaction --no-owner /tmp/rr-neg-${STAMP}.dump > "$WORK/neg-$1.log" 2>&1
  rc=$?
  set -e
  tables="$(psql_dst "$NEG_DB" -c "select count(*) from pg_tables where schemaname='public'")"
  docker exec "$DST_C" rm -f /tmp/rr-neg-${STAMP}.dump
  psql_dst postgres -c "DROP DATABASE $NEG_DB" >/dev/null
  printf '%s %s\n' "$rc" "$tables" > "$WORK/neg-$1-status.txt"
  echo "$1: pg_restore exit=$rc; tables left in the throwaway target=$tables"
}
python3 - "$WORK/rr.dump" "$WORK/rr-corrupt.dump" "$WORK/rr-truncated.dump" <<'PY'
import sys
b=bytearray(open(sys.argv[1],'rb').read())
c=bytearray(b); mid=len(c)//2
for i in range(mid,mid+64): c[i]^=0xFF
open(sys.argv[2],'wb').write(c)
open(sys.argv[3],'wb').write(b[:len(b)//2])
PY
{ neg corrupt "$WORK/rr-corrupt.dump"; neg truncated "$WORK/rr-truncated.dump"; } | tee "$OUT/refusals.txt"
# missing and altered objects on a disposable copy of the restored object root
cp -R "$DST_OBJ" "$WORK/objects-neg"
VICTIM_REL="$(cd "$WORK/objects-neg" && find . -type f -not -path '*/tmp/*' | sort | head -1)"
[ -n "$VICTIM_REL" ] || { echo "no object to damage" >&2; exit 1; }
VICTIM="$WORK/objects-neg/${VICTIM_REL#./}"
cp "$VICTIM" "$WORK/victim.bak"; printf 'X' | dd of="$VICTIM" bs=1 seek=0 conv=notrunc 2>/dev/null
set +e; gotest readback MC_RESTORE_DSN="$DST_DSN" MC_RESTORE_OBJECTS="$WORK/objects-neg" MC_RESTORE_OUT="$WORK/neg-altered.json" > "$WORK/neg-altered.log" 2>&1; ALT=$?; set -e
cp "$WORK/victim.bak" "$VICTIM"; rm "$VICTIM"
set +e; gotest readback MC_RESTORE_DSN="$DST_DSN" MC_RESTORE_OBJECTS="$WORK/objects-neg" MC_RESTORE_OUT="$WORK/neg-missing.json" > "$WORK/neg-missing.log" 2>&1; MISS=$?; set -e
if [ -f "$WORK/neg-missing.json" ]; then diff -q "$WORK/neg-missing.json" "$OUT/readback-restored.json" >/dev/null && MISSDIFF=NONE || MISSDIFF=DETECTED; else MISSDIFF=DETECTED; fi
echo "altered object: readback exit=$ALT (non-zero = detected)" | tee -a "$OUT/refusals.txt"
echo "missing object: readback exit=$MISS, output differs from the good restore: $MISSDIFF" | tee -a "$OUT/refusals.txt"

# ---- summary ----------------------------------------------------------------------------------
python3 - "$OUT" "$WORK" <<PY
import json, sys
from pathlib import Path
out=sys.argv[1]
refusals = {}
for kind in ("corrupt", "truncated"):
    code, tables = map(int, (Path(sys.argv[2]) / ("neg-" + kind + "-status.txt")).read_text().split())
    refusals[kind] = {"exit": code, "tables_left": tables}
json.dump({
 "stamp":"$STAMP","source":{"container":"$SRC_C","database":"$SRC_DB"},"target":{"container":"$DST_C","database":"$DST_DB"},
 "boundary":"$BOUNDARY","backup_seconds":$BACKUP_S,"restore_seconds":$RESTORE_S,
 "archive_bytes":int(open(out+"/archive.bytes").read()),"archive_sha256":open(out+"/archive.sha256").read().strip(),
 "census":"$CENSUS","objects":"$OBJECTS","marker_in_source":"$MARKER_SRC","marker_in_restore":"$MARKER_DST",
 "readback_restored_vs_source":"$READBACK","readback_after_restart":"$RESTART",
 "altered_object_readback_exit":$ALT,"missing_object":"$MISSDIFF",
 "archive_refusals":refusals,
 "scope":"local synthetic rehearsal; not a production RPO/RTO commitment; IdP recovery is a separate scope"
},open(out+"/summary.json","w"),indent=1)
PY
log "summary written to $OUT/summary.json"

# Exit status is an acceptance gate, not merely evidence that a summary was written.
python3 "$VERIFY" summary "$OUT/summary.json"
