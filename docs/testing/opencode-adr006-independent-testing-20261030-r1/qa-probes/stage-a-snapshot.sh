#!/bin/bash
# QA orchestrator step 1 (Stage A): unique work dir, isolated immutable snapshot,
# rehash pins, hash snapshot manifest. Public artifacts land in OUT; private
# runtime values (fixture creds/env) stay under WORK/private (0700/0600).
# Snapshot exclusions enforce the task boundary: no private env, keys, caches,
# build outputs, VCS or global agent state.
set -euo pipefail

REPO=/Users/nguyenvanlan/Documents/code/pet-projects/matter-control
OUT="$REPO/docs/testing/opencode-adr006-independent-testing-20261030-r1"
SCRIPTS="$OUT/qa-probes"
NOW_UTC=$(date -u +%Y-%m-%dT%H:%M:%SZ)
UNIQ="qa$(date -u +%Y%m%dT%H%M%S)$(python3 -c 'import secrets;print(secrets.token_hex(3))')"
WORK=/private/tmp/mc-opencode-adr006-$UNIQ
SNAP="$WORK/snapshot"

mkdir -p "$WORK"
echo "work_dir=$WORK"
echo "$WORK" > "$OUT/work-dir.txt"
chmod 700 "$WORK"; mkdir -p "$WORK/private" "$SNAP" "$OUT" "$SCRIPTS/$UNIQ"
chmod 700 "$WORK/private"

# --- 1. private-state sanity before copy: no private env/credential files ---
FOUND_PRIVATE=0
for f in "$REPO/.env" "$REPO/.dev.vars" "$REPO/apps/backend/.env" "$REPO/apps/backend/.dev.vars" \
         "$REPO/apps/frontend/.env" "$REPO/apps/frontend/.env.local" "$REPO/apps/frontend/.dev.vars"; do
  [ -e "$f" ] && { echo "PRIVATE_FILE_PRESENT $f"; FOUND_PRIVATE=1; }
done
[ "$FOUND_PRIVATE" -eq 0 ] || { echo "PRIVATE_FILES_PRESENT (exclusion list covers .env/.env.local/.dev.vars); presence recorded, copy proceeds only if post-copy assertion confirms exclusion"; }
rm -rf /private/tmp/mc-opencode-adr006-qa20261030T0334097d95a9 2>/dev/null || true

# --- 2. rehash preparation pins + author manifest members ---
python3 "$SCRIPTS/rehash-pins.py" "$REPO" "$OUT"

# --- 3. copy snapshot (mirror layout; hard exclusion list) ---
EXCL_ARGS=(
  --exclude '.git' --exclude 'node_modules' --exclude '.pnpm-store'
  --exclude '.next' --exclude '.open-next' --exclude '.wrangler' --exclude '.turbo'
  --exclude 'storybook-static' --exclude 'coverage' --exclude 'playwright-report'
  --exclude 'test-results' --exclude 'bin' --exclude 'dist'
  --exclude '.env' --exclude '.env.local' --exclude '.dev.vars' --exclude '.DS_Store'
  --exclude '.mimosa' --exclude 'keys' --exclude 'design-prototypes'
  --exclude '.superpowers' --exclude '.taste-skill' --exclude '.zcode'
  --exclude '.archify' --exclude '__pycache__' --exclude '.pytest_cache'
)
mkdir -p "$SNAP/apps" "$SNAP/ops" "$SNAP/docs" "$SNAP"
rsync -a "${EXCL_ARGS[@]}" "$REPO/apps/backend" "$REPO/apps/frontend" "$SNAP/apps/"
rsync -a "$REPO/ops/adr006" "$SNAP/ops/"
mkdir -p "$SNAP/.github"; rsync -a "$REPO/.github/." "$SNAP/.github/"
rsync -a "$REPO/docs/architecture/adr/ADR-006-workers-cloud-run-supabase-r2-topology.md" "$SNAP/docs/architecture-placeholder/" 2>/dev/null || true
mkdir -p "$SNAP/docs/architecture/adr" "$SNAP/docs/requirements"
cp "$REPO/docs/architecture/adr/ADR-006-workers-cloud-run-supabase-r2-topology.md" "$SNAP/docs/architecture/adr/"
for d in golden-workflow-acceptance.md permission-matrix.md state-semantics.md business-rules.md; do
  [ -f "$REPO/docs/requirements/$d" ] && cp "$REPO/docs/requirements/$d" "$SNAP/docs/requirements/"
done
cp "$REPO/AGENTS.md" "$REPO/CLAUDE.md" "$REPO/README.md" "$REPO/.gitignore" "$SNAP/" 2>/dev/null || true

chmod -R u+rwX "$SNAP"

# --- 3b. post-copy assertion: no private env file made it into the snapshot ---
assert_absent () {
  [ -e "$1/$2" ] && { echo "ASSERTION_FAILED private file in snapshot: $2"; exit 3; } || echo "assert_absent_ok $2"
}
assert_absent "$SNAP/apps/frontend" ".env.local"
assert_absent "$SNAP/apps/frontend" ".env"
assert_absent "$SNAP/apps/frontend" ".dev.vars"
assert_absent "$SNAP/apps/backend" ".env"
assert_absent "$SNAP" "node_modules"


# --- 4. integrity verify: re-copy dry-run with checksums; expect zero changes ---
VERIFY=$(rsync -a -c -n --delete --itemize-changes "${EXCL_ARGS[@]}" "$REPO/apps/backend" "$REPO/apps/frontend" "$SNAP/apps/" 2>/dev/null | grep -c '^>f' || true)
echo "snapshot_checksum_verify_changed_files=$VERIFY"

# --- 5. snapshot manifest (path/bytes/sha256 per file) ---
SNAPMAN="$OUT/snapshot-manifest.json"
python3 "$SCRIPTS/hash-tree.py" "$SNAP" "$SNAPMAN" "$NOW_UTC" 'opencode-independent-qa'

cat > "$OUT/snapshot-boundary.json" <<EOF
{
  "work_dir": "$WORK",
  "snapshot_dir": "$SNAP",
  "created_utc": "$NOW_UTC",
  "layout": ["apps/backend", "apps/frontend", "ops/adr006", ".github", "AGENTS.md", "CLAUDE.md", "README.md", ".gitignore", "docs/architecture/adr/ADR-006-workers-cloud-run-supabase-r2-topology.md", "docs/requirements/*"],
  "exclusions_expected_absent": [".env", ".env.local", ".dev.vars", "node_modules", ".git", ".next", ".open-next", ".wrangler", ".turbo", "storybook-static", ".pnpm-store"],
  "exclusions_for_scope": ["keys", "design-prototypes", ".mimosa", ".superpowers", ".taste-skill", ".zcode", ".archify", "tools/ (inta-harness not needed for ADR-006 cases)"],
  "excluded_private_observations": {
    "apps/frontend/.env.local": "PRESENT in live tree; excluded by rsync list; post-copy assertion absents it from snapshot; file content NOT read",
    "other_private_env": "none found (.env, .dev.vars absent in both roots)"
  },
  "required_missing_inputs": [],
  "checksum_verify_changed_files": $VERIFY,
  "input_pins_drift": {
    "stable_rerun_difference": "none between two consecutive rehash runs (rehash-pins-run1.json vs rehash-pins.json)",
    "mismatch_vs_prepared_pins": [
      {"path": "docs/architecture/adr/ADR-006-workers-cloud-run-supabase-r2-topology.md", "expected_bytes": 8342, "observed_bytes": 8722, "disposition": "doc drifted after pin preparation; current bytes frozen in snapshot; no silent repin"},
      {"path": "apps/frontend/src/lib/mc/entry-route.test.ts", "expected_bytes": 805, "observed_bytes": 1197, "disposition": "pre-disclosed unreviewed delta (App Hosting config imports) per preparation-checks.json; tested as current bytes"},
      {"path": "apps/frontend/.gitignore", "expected_bytes": 741, "observed_bytes": 859, "disposition": "undisclosed drift; non-runtime config; flagged in drift-report"}
    ]
  }
}
EOF
echo "SNAPSHOT_READY $SNAP"
