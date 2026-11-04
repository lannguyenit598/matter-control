#!/usr/bin/env bash
# Scheduled logical backup of the MatterControl product database (pilot; ADR-006 addendum).
# Writes a compressed custom-format dump of the SELECTED managed schemas plus its SHA-256 to a
# SECOND location on persistent storage, keeps the most recent MC_BACKUP_RETAIN archives, and
# prints one JSON summary line with no DSN, password or file content. Synthetic data only in the
# pilot; provider-side scheduling (Cloud Run Job / Cloud Scheduler / VM timer) is an operator
# step — see docs/deployment/pilot-deploy-runbook.md. Script behavior is exercised by
# ops/backup/scheduled-dump.test.sh (synthetic databases, restore into a NEW target); a
# provider-scheduled run has never been executed.
#
# Required env:
#   MC_BACKUP_DSN        connection URL of a LOGIN identity that can read the selected objects.
#                        The Supabase project admin (a member of mc_owner) works for all managed
#                        schemas; mc_runtime can only read mcapp (it has no mc_bff rights) and
#                        mc_owner is NOLOGIN — neither is a dump authority for the full set.
#                        Supplied by the scheduler from a secret store; never written to disk by
#                        this script. Argv truth (r1 review): the DSN, including any embedded
#                        password, reaches pg_dump as ONE argv element and is briefly visible
#                        in the same user's process table; prefer a PGPASSWORD-style env
#                        credential with a passwordless DSN where practical.
#   MC_BACKUP_DIR        destination directory (the SECOND location; mode 0700 recommended).
#   MC_BACKUP_SCHEMA     comma-separated schema names to dump, e.g. "mcapp,mc_bff". REQUIRED and
#                        validated: an empty, malformed or duplicated selection exits 2 — a dump
#                        of all managed schemas must never happen silently (on Supabase the
#                        managed auth/storage schemas cannot be dumped by the project admin, and
#                        mc_bff holds encrypted BFF sessions: include it only together with the
#                        unchanged BFF_STATE_KEYS ring, see the runbook). All names are passed to
#                        pg_dump as separate argv entries (-n name): never interpolated into a
#                        shell string.
# Optional env:
#   MC_BACKUP_RETAIN        how many archives to keep (default 7)
#   MC_BACKUP_PG_DUMP       pg_dump binary (default: pg_dump from PATH; client major version must
#                           be >= the server's)
#   MC_BACKUP_PG_RESTORE    pg_restore binary, used only to verify the archive contents
#                           (default: pg_restore from PATH)
#
# Scope truth: a database dump contains ONLY what MC_BACKUP_SCHEMA names. R2 document bytes and
# the BFF encryption keys are NOT in any dump — the runbook documents their separate custody.
set -euo pipefail

: "${MC_BACKUP_DSN:?MC_BACKUP_DSN is required (from the secret store, never committed)}"
: "${MC_BACKUP_DIR:?MC_BACKUP_DIR is required (the second location)}"
if [ -z "${MC_BACKUP_SCHEMA:-}" ]; then
  echo "MC_BACKUP_SCHEMA is required (comma-separated, e.g. mcapp,mc_bff — never dump all schemas silently)" >&2
  exit 2
fi
RETAIN="${MC_BACKUP_RETAIN:-7}"
PG_DUMP_BIN="${MC_BACKUP_PG_DUMP:-pg_dump}"
PG_RESTORE_BIN="${MC_BACKUP_PG_RESTORE:-pg_restore}"

case "$RETAIN" in ''|*[!0-9]*) echo "MC_BACKUP_RETAIN must be a positive integer" >&2; exit 2;; esac
[ "$RETAIN" -ge 1 ] || { echo "MC_BACKUP_RETAIN must be >= 1" >&2; exit 2; }

# Validate the schema selection BEFORE touching the database: lowercase PostgreSQL identifiers
# only (pg_dump -n takes unquoted names), at least one, no duplicates, nothing that could change
# pg_dump argv semantics.
SCHEMA_ARGS=()
SEEN=" "
while IFS= read -r schema; do
  schema="${schema//[[:space:]]/}"
  case "$schema" in
    '') echo "MC_BACKUP_SCHEMA: empty schema entry" >&2; exit 2;;
    *[!a-z0-9_$]*) echo "MC_BACKUP_SCHEMA: invalid schema name '$schema' (lowercase letters, digits, _ and \$ only)" >&2; exit 2;;
  esac
  case "$SEEN" in *" $schema "*) echo "MC_BACKUP_SCHEMA: duplicate schema '$schema'" >&2; exit 2;; esac
  SEEN="$SEEN$schema "
  SCHEMA_ARGS+=(-n "$schema")
done < <(printf '%s\n' "$MC_BACKUP_SCHEMA" | tr ',' '\n')

umask 077
mkdir -p "$MC_BACKUP_DIR"

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
DUMP="$MC_BACKUP_DIR/mcapi-$STAMP.dump"

START="$(date +%s)"
"$PG_DUMP_BIN" --no-owner --no-privileges -Fc -f "$DUMP" "${SCHEMA_ARGS[@]}" "$MC_BACKUP_DSN"
SECONDS_ELAPSED="$(($(date +%s) - START))"
BYTES="$(wc -c < "$DUMP" | tr -d ' ')"
SHA="$(shasum -a 256 "$DUMP" 2>/dev/null | cut -d' ' -f1 || sha256sum "$DUMP" | cut -d' ' -f1)"
printf '%s\n' "$SHA" > "$DUMP.sha256"

# The archive must (a) list its table data — a truncated dump fails here, not at restore time —
# and (b) contain TABLE DATA ONLY for the selected schemas: anything else means the selection
# arguments did not reach pg_dump, which is a silent full-database failure mode.
LISTING="$("$PG_RESTORE_BIN" -l "$DUMP" 2>/dev/null)"
ARCHIVE_TABLES="$(printf '%s\n' "$LISTING" | awk '$4 == "TABLE" && $5 == "DATA"' | wc -l | tr -d ' ')"
[ "$ARCHIVE_TABLES" -ge 1 ] || { echo "backup archive lists no TABLE DATA entries; refusing to keep it" >&2; exit 1; }
UNEXPECTED_SCHEMAS="$(printf '%s\n' "$LISTING" | awk -v want="$SEEN" '$4 == "TABLE" && $5 == "DATA" && index(want, " " $6 " ") == 0 {print $6}' | sort -u)"
if [ -n "$UNEXPECTED_SCHEMAS" ]; then
  # Never echo values from the dump itself; schema names are configuration, not secrets.
  echo "backup archive contains TABLE DATA outside MC_BACKUP_SCHEMA: $UNEXPECTED_SCHEMAS; refusing to keep it" >&2
  exit 1
fi

# Retention: keep the newest RETAIN archives (and their checksums), delete the rest. The list is
# read one path per line (OV-R12-01: the quoted command substitution made every deletion a no-op
# and the counter lied in both directions); PRUNED counts files actually removed.
PRUNED=0
while IFS= read -r old; do
  [ -n "$old" ] || continue
  rm -f -- "$old" "$old.sha256"
  PRUNED=$((PRUNED + 1))
done < <(ls -1t "$MC_BACKUP_DIR"/mcapi-*.dump 2>/dev/null | tail -n +$((RETAIN + 1)))

printf '{"event":"scheduled_backup","stamp":"%s","schemas":"%s","bytes":%s,"sha256":"%s","table_data_entries":%s,"duration_seconds":%s,"retained":%s,"pruned":%s}\n' \
  "$STAMP" "$MC_BACKUP_SCHEMA" "$BYTES" "$SHA" "$ARCHIVE_TABLES" "$SECONDS_ELAPSED" "$RETAIN" "$PRUNED"
