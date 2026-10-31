#!/usr/bin/env bash
# Scheduled logical backup of the MatterControl product database (pilot; ADR-006 addendum).
# Writes a compressed custom-format dump plus its SHA-256 to a SECOND location on persistent
# storage, keeps the most recent MC_BACKUP_RETAIN archives, and prints one JSON summary line with
# no DSN, password or file content. Synthetic data only in the pilot; provider-side scheduling
# (Cloud Run Job / Cloud Scheduler / VM timer) is an operator step — see
# docs/deployment/pilot-deploy-runbook.md. This script has never touched a provider.
#
# Required env:
#   MC_BACKUP_DSN   the product database URL (runtime or owner role). Supplied by the scheduler
#                   from a secret store; never written to disk by this script.
#   MC_BACKUP_DIR   destination directory (the SECOND location; mode 0700 recommended).
# Optional env:
#   MC_BACKUP_RETAIN        how many archives to keep (default 7)
#   MC_BACKUP_SCHEMA        schema to dump (default: the DSN's search_path/public — pg_dump of the
#                           whole database is the pilot default; the runbook pins the schema set)
#   MC_BACKUP_PG_DUMP       pg_dump binary (default: pg_dump from PATH)
#   MC_BACKUP_PG_RESTORE    pg_restore binary, used only to verify the archive lists its data
#                           (default: pg_restore from PATH)
set -euo pipefail

: "${MC_BACKUP_DSN:?MC_BACKUP_DSN is required (from the secret store, never committed)}"
: "${MC_BACKUP_DIR:?MC_BACKUP_DIR is required (the second location)}"
RETAIN="${MC_BACKUP_RETAIN:-7}"
PG_DUMP_BIN="${MC_BACKUP_PG_DUMP:-pg_dump}"
PG_RESTORE_BIN="${MC_BACKUP_PG_RESTORE:-pg_restore}"

case "$RETAIN" in ''|*[!0-9]*) echo "MC_BACKUP_RETAIN must be a positive integer" >&2; exit 2;; esac
[ "$RETAIN" -ge 1 ] || { echo "MC_BACKUP_RETAIN must be >= 1" >&2; exit 2; }

umask 077
mkdir -p "$MC_BACKUP_DIR"
[ "$(stat -f %Lp "$MC_BACKUP_DIR" 2>/dev/null || stat -c %a "$MC_BACKUP_DIR" 2>/dev/null)" ] || true

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
DUMP="$MC_BACKUP_DIR/mcapi-$STAMP.dump"

START="$(date +%s)"
"$PG_DUMP_BIN" --no-owner --no-privileges -Fc -f "$DUMP" "$MC_BACKUP_DSN"
SECONDS_ELAPSED="$(($(date +%s) - START))"
BYTES="$(wc -c < "$DUMP" | tr -d ' ')"
SHA="$(shasum -a 256 "$DUMP" 2>/dev/null | cut -d' ' -f1 || sha256sum "$DUMP" | cut -d' ' -f1)"
printf '%s\n' "$SHA" > "$DUMP.sha256"

# The archive must at least list its table data; a truncated dump fails here, not at restore time.
ARCHIVE_TABLES="$("$PG_RESTORE_BIN" -l "$DUMP" 2>/dev/null | grep -c 'TABLE DATA' || true)"
[ "$ARCHIVE_TABLES" -ge 1 ] || { echo "backup archive lists no TABLE DATA entries; refusing to keep it" >&2; exit 1; }

# Retention: keep the newest RETAIN archives (and their checksums), delete the rest.
PRUNED=0
for old in "$(ls -1t "$MC_BACKUP_DIR"/mcapi-*.dump 2>/dev/null | tail -n +$((RETAIN + 1)))"; do
  rm -f "$old" "$old.sha256"
  PRUNED=$((PRUNED + 1))
done

printf '{"event":"scheduled_backup","stamp":"%s","bytes":%s,"sha256":"%s","table_data_entries":%s,"duration_seconds":%s,"retained":%s,"pruned":%s}\n' \
  "$STAMP" "$BYTES" "$SHA" "$ARCHIVE_TABLES" "$SECONDS_ELAPSED" "$RETAIN" "$PRUNED"
