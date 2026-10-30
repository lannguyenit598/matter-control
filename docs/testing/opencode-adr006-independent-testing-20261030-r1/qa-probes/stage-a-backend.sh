#!/bin/bash
# QA orchestrator step 3 (backend gates, sequential): BE-01 make check (with owned
# fixture DSN), BE-02 full race JSON suite, DB-06 EXPLAIN opt-in verification.
# Private DSN env only via private file; public sanitized logs under commands/.
set -uo pipefail
REPO=/Users/nguyenvanlan/Documents/code/pet-projects/matter-control
OUT="$REPO/docs/testing/opencode-adr006-independent-testing-20261030-r1"
RUNNER="$OUT/qa-probes/qa-run.sh"
WORK=$(cat "$OUT/work-dir.txt")
SNAP="$WORK/snapshot"
DSN="$WORK/private/dsn.env"
PROG="$OUT/commands/.stage-a-backend-progress"
echo "stageA-backend start $(date -u +%Y-%m-%dT%H:%M:%SZ)" | tee -a "$PROG"

echo "[be01 make check] $(date -u +%Y-%m-%dT%H:%M:%SZ)" | tee -a "$PROG"
"$RUNNER" "$DSN" "$SNAP/apps/backend" backend-check make check
BE_ONE_EC=$?
echo "be01_exit=$BE_ONE_EC" | tee -a "$PROG"

echo "[be02 race json] $(date -u +%Y-%m-%dT%H:%M:%SZ)" | tee -a "$PROG"
"$RUNNER" "$DSN" "$SNAP/apps/backend" backend-race go test -race -count=1 -json ./...
BE_TWO_EC=$?
echo "be02_exit=$BE_TWO_EC" | tee -a "$PROG"

echo "[db06 explain verify] $(date -u +%Y-%m-%dT%H:%M:%SZ)" | tee -a "$PROG"
cat "$DSN" | sed '1i MC_EXPLAIN_VERIFY=1' > "$WORK/private/explain.env"
chmod 600 "$WORK/private/explain.env"
"$RUNNER" "$WORK/private/explain.env" "$SNAP/apps/backend" backend-explain go test -race -count=1 -json ./internal/adapter/outbound/postgres -run TestAccessPathExplainVerification
DB_SIX_EC=$?
echo "db06_exit=$DB_SIX_EC" | tee -a "$PROG"
echo "stageA-backend done $(date -u +%Y-%m-%dT%H:%M:%SZ)" | tee -a "$PROG"
