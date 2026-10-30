#!/usr/bin/env bash
# §3 adapter comparison PoC (prepared, not executed in the authoring session).
# Runs BOTH candidates against an isolated copy of the real app on workerd (wrangler dev --local),
# records per-feature results, and never touches shared source or remote accounts.
# Requirements: node, pnpm, network for the pinned installs. Run from the repository root.
set -euo pipefail
ROOT="$(pwd)"
OUT="$ROOT/docs/testing/zcode-adr006-cloud-readiness-20261030-r1/adapter-poc-results"
mkdir -p "$OUT"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
[ -n "${CLOUDFLARE_API_TOKEN:-}" ] && { echo "REFUSING: CLOUDFLARE_API_TOKEN is set; this PoC must stay local-only"; exit 1; }
[ -f .env ] || [ -f apps/frontend/.env ] && echo "NOTE: .env present — it will NOT be copied (private files excluded)"

FEATURES=(
  "route:GET /workspaces renders the workbench shell"
  "rsc:RSC stream + Suspense fallback observable"
  "connection:request-time connection() page renders"
  "cookies:cookies()/headers() readable in RSC"
  "routehandler:Route Handler answers"
  "serveraction:Server Action invokes and revalidates"
  "cachecomponents:cacheComponents=true build+serve"
  "prefetching:partialPrefetching behavior"
  "serveronly:'server-only' import enforced"
  "assets:static assets/fonts/Tailwind CSS served"
  "headers:CSP/security headers present"
  "redirect:/ redirect lands on the real entry route"
  "i18n:EN/VI copy renders"
  "errorboundary:error boundary catches a thrown render error"
  "transfer:1MiB upload -> API -> object -> download SHA equal"
  "transfer25:near-25MiB upload -> API -> object -> download SHA equal"
)

prepare_copy() {
  local dst="$1"
  rm -rf "$dst"; mkdir -p "$dst"
  rsync -a --exclude node_modules --exclude .next --exclude .turbo \
    --exclude '.env*' --exclude '*.pem' --exclude '*.key' \
    "$ROOT/apps/frontend/" "$dst/frontend/"
  cp -cR "$ROOT/apps/frontend/node_modules" "$dst/frontend/node_modules" 2>/dev/null || \
    cp -R "$ROOT/apps/frontend/node_modules" "$dst/frontend/node_modules"
}

run_candidate() {
  local name="$1"; shift
  local work="$ROOT/../mc-adr006-poc-$name-$STAMP"
  echo "== $name ==" | tee "$OUT/$name.log"
  prepare_copy "$work"
  ( cd "$work/frontend" && pnpm add -D "$@" ) 2>&1 | tail -3 | tee -a "$OUT/$name.log"
  # Candidate-specific preview launch + feature probes go here; each probe writes PASS/FAIL lines.
  # wrangler dev --local MUST be the runtime (workerd), never `next dev`:
  #   OpenNext:  pnpm exec opennextjs-cloudflare build && pnpm exec wrangler dev --local --port 8799
  #   vinext:    pnpm exec vinext build --runtime workers && pnpm exec wrangler dev --local --port 8799
  # Probes: curl each feature route; for Server Actions/transfer use a scripted browser session.
  # Record: workerd version, worker bundle gzip size (wrangler output), CPU/ms per request.
  echo "RESULT_LINES_GO_HERE (executed probes replace this marker)" | tee -a "$OUT/$name.log"
}

run_candidate opennext "@opennextjs/cloudflare@1.20.14" "wrangler@4"
run_candidate vinext "vinext@1.4.0" "wrangler@4"
echo "Both candidates recorded under $OUT — keep BOTH logs; selection is implementation evidence."
