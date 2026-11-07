#!/bin/bash
# browser-check.sh — wrapper for browser-check.mjs (E-2 verification).
# Resolves the GLOBAL playwright package (no dependency is added to the repo) and
# reads user credentials from ops/p0-local/secrets/test-users.json at runtime —
# values never printed, never committed.
# Screenshots + result JSON land in MC_E2E4_SHOTS (default: the task evidence dir).
set -Eeuo pipefail
export PATH=/usr/bin:/bin:/usr/sbin:/sbin:/opt/homebrew/bin:/usr/local/bin:$PATH
BROWSER_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$BROWSER_DIR/../../../.." && pwd)"

export PW_ROOT="${PW_ROOT:-$(npm root -g)}"
export MC_E2E4_BASE="${MC_E2E4_BASE:-http://localhost:3000}"
export MC_E2E4_IDP_ORIGIN="${MC_E2E4_IDP_ORIGIN:-http://localhost:8080}"
export MC_E2E4_USERS="$REPO_ROOT/ops/p0-local/secrets/test-users.json"
export MC_E2E4_SHOTS="${MC_E2E4_SHOTS:-$REPO_ROOT/docs/testing/mc-enable-e2-e4-20261107-r1/evidence}"
[ -f "$MC_E2E4_USERS" ] || { echo "missing $MC_E2E4_USERS" >&2; exit 1; }
[ -d "$MC_E2E4_SHOTS" ] || mkdir -p "$MC_E2E4_SHOTS"
exec node "$BROWSER_DIR/browser-check.mjs"
