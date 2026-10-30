#!/bin/bash
# QA orchestrator step 4 (frontend, Stage A): frozen-lockfile standalone install,
# then pnpm check, concurrent BFF PG suites (owned fixture), webpack/worker/
# storybook builds and a Turbopack attempt. Install runs immediately; test/build
# phases wait for stage-a-backend progress marker be02_exit to avoid CPU race
# contention that could distort correctness evidence.
set -uo pipefail
REPO=/Users/nguyenvanlan/Documents/code/pet-projects/matter-control
OUT="$REPO/docs/testing/opencode-adr006-independent-testing-20261030-r1"
RUNNER="$OUT/qa-probes/qa-run.sh"
WORK=$(cat "$OUT/work-dir.txt")
SNAP="$WORK/snapshot"
FE="$SNAP/apps/frontend"
DSN="$WORK/private/dsn.env"
PROG="$OUT/commands/.stage-a-frontend-progress"
echo "stageA-frontend start $(date -u +%Y-%m-%dT%H:%M:%SZ)" | tee -a "$PROG"

echo "[install frozen-lockfile] $(date -u +%Y-%m-%dT%H:%M:%SZ)" | tee -a "$PROG"
CI=true "$RUNNER" NONE "$FE" frontend-install pnpm install --frozen-lockfile --store-dir "$WORK/private/pnpm-store"
echo "install_exit=$?" | tee -a "$PROG"

# wait for backend race suite to finish (marker present) before CPU-heavy phases
WAITED=0
while ! grep -q "be02_exit" "$OUT/commands/.stage-a-backend-progress" 2>/dev/null; do
  sleep 30; WAITED=$((WAITED+30))
  if [ $WAITED -gt 3600 ]; then echo "WAIT_TIMEOUT_60m" | tee -a "$PROG"; break; fi
done

echo "[env-placeholder static check] $(date -u +%Y-%m-%dT%H:%M:%SZ)" | tee -a "$PROG"
python3 - "$FE/.env.example" <<'PY' | tee -a "$PROG"
import pathlib, sys
t = pathlib.Path(sys.argv[1]).read_text()
real_assigns = []
for ln in t.splitlines():
    name, _, value = ln.partition("=")
    if not _: continue
    if value and value.strip() and not (value.startswith('"') and value.strip('"\' ') in ("", "<synthetic>")) \
       and "{" not in value and "<" not in value and "example" not in value.lower() and "placeholder" not in value.lower():
        real_assigns.append(name)
print("PLACEHOLDER_CONFIRMED" if not real_assigns else f"REAL_ASSIGNMENTS_FOUND {real_assigns}")
print(".env creation intentionally skipped in snapshot (OpenNext embeds .env defaults)")
PY

echo "[bff concurrent suites] $(date -u +%Y-%m-%dT%H:%M:%SZ)" | tee -a "$PROG"
"$RUNNER" "$DSN" "$FE" frontend-bff-suite node node_modules/vitest/vitest.mjs run src/lib/oidc/durable-state.test.ts src/features/data-transfer/durable-attempts.test.ts
echo "bff_exit=$?" | tee -a "$PROG"

echo "[full gate check] $(date -u +%Y-%m-%dT%H:%M:%SZ)" | tee -a "$PROG"
CI=true "$RUNNER" NONE "$FE" frontend-check pnpm check
echo "check_exit=$?" | tee -a "$PROG"

echo "[build webpack] $(date -u +%Y-%m-%dT%H:%M:%SZ)" | tee -a "$PROG"
CI=true "$RUNNER" NONE "$FE" frontend-build-webpack pnpm build:webpack
echo "webpack_exit=$?" | tee -a "$PROG"

echo "[build worker] $(date -u +%Y-%m-%dT%H:%M:%SZ)" | tee -a "$PROG"
CI=true "$RUNNER" NONE "$FE" frontend-build-worker pnpm build:worker
echo "worker_exit=$?" | tee -a "$PROG"

echo "[build storybook] $(date -u +%Y-%m-%dT%H:%M:%SZ)" | tee -a "$PROG"
CI=true "$RUNNER" NONE "$FE" frontend-build-storybook pnpm build-storybook
echo "storybook_exit=$?" | tee -a "$PROG"

echo "[build turbopack attempt] $(date -u +%Y-%m-%dT%H:%M:%SZ)" | tee -a "$PROG"
CI=true "$RUNNER" NONE "$FE" frontend-build-turbopack pnpm build
echo "turbopack_exit=$?" | tee -a "$PROG"
echo "stageA-frontend done $(date -u +%Y-%m-%dT%H:%M:%SZ)" | tee -a "$PROG"
