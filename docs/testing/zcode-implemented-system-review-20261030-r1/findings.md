# Findings — implemented-system review r1 (2026-10-30)

Reviewer: actual ZCode (author-review; independent acceptance reserved for a non-author). Namespace `R-` proposed so these do not collide with historical finding IDs from the reviewed chains (historical `F-01` maps to `R-07`, listed in the mapping table at the bottom). No speculative findings; every entry carries its evidence class.

Evidence dir: `docs/testing/zcode-implemented-system-review-20261030-r1/`. Reviewed bytes: workspace dirty tree at HEAD `20feedbf06c859a9806055d609f5b132fe8bb086` (hash-bound by `source-manifest.csv`; drift 0 — see `drift-report.md`).

---

## R-01 — P1 · CONFIRMED BUG — Entry redirect `/` → nonexistent `/dashboard` (fresh entry = 404)

- **Source/hash:** `apps/frontend/next.config.ts:49-52` — `redirects(): [{ source: '/', destination: '/dashboard', permanent: false }]`; `sha256` in `source-manifest.csv` (`apps/frontend/next.config.ts` line). `/dashboard` route does not exist in `src/app/`; the real in-app fallback `src/app/page.tsx` (`redirect('/workspaces')`) is shadowed because `redirects()` is evaluated before filesystem routes; no middleware exists to intercept.
- **Impact:** every visitor to the origin root lands on `/_not-found` (404). The primary entry journey of the product is broken for all fresh sessions until the path is typed manually.
- **Trigger/repro:** open `http://<origin>/` in any browser → 404. Expected: `/workspaces` (per `src/app/page.tsx` intent and `DEFAULT_RETURN` `src/lib/oidc/flow.ts:84`). Also independently confirmed in the ADR-006 artifacts ("Known local defects" #1 and runbook delta #2) — the defect was known to the author chain and remains in shipped config.
- **Expected vs actual:** entry routing consistent with `(app)/{workspaces,my-actions,matters,requirements}` vs redirect to a removed `/dashboard` name.
- **Root cause:** stale route name carried through a config-rename cycle (`/dashboard` → `(app)` family); comment at `next.config.ts:8` still references `/tasks`.
- **Smallest fix:** drop the `redirects()` entry (the `/` page already redirects to `/workspaces`), or retarget it to `/workspaces`; one file, no behavior change in app router.
- **Affected callers:** all users; OIDC return-journey unaffected (`DEFAULT_RETURN` is independent).
- **Regression coverage:** add a route-level smoke test or build assert that every `redirects()` destination exists in `src/app/`.
- **Confidence/evidence class:** CONFIRMED (bytes-verified: `next.config.ts:49-52`, `page.tsx`, absent route dir; two prior artifacts concur). Not browser-run this session (browser out of scope) — flagged where relevant in verification matrix.

## R-02 — P2 · CONFIRMED CONTRACT GAP (defense-in-depth) — Cross-matter command-receipt replay accepted at the service layer; HTTP layer mitigates

- **Source/hash:** `internal/core/service/evidence_service.go` (`createReceipt` dedup path), `internal/core/service/work_service.go:401` (`CreateAction` receipt creation), `internal/core/service/matter_service.go:111` (`authorizeReceiptScope`); receipts keyed on actor+idempotency-key+entity-hash without a matter-scope join at this path.
- **Repro (probe, snapshot-only, reversible):** 4 vendored probe files exist only in the review snapshot `/private/tmp/mc-implrev-20261030-r1/` (`mca01_probe.go`, `mca01_probe_memory_test.go`, `mca01_probe_pg_test.go`, `mca01_fingerprint_probe_test.go`; never written to the workspace):
  1. Create command on matter A with key K + payload hash H → receipt id R.
  2. Directly invoke the same service method from matter B's context with the same actor + K + H.
  3. Actual (memory + PostgreSQL): replay returns matter A's record R to the command on matter B. `R-` log: `a01-crossmatter-replay-probe.log` (`MEM_EXIT=1`, `PG_EXIT=1` — probe REPRODUCED on both stores).
- **Mitigation verified at the HTTP layer:** the concrete matter path is part of the admission fingerprint (`productapi` probe test PASS) — fingerprints differ between the two matters, so the cross-matter replay is refused through the HTTP API today.
- **User-visible impact today:** none via HTTP (mitigated). Residual risk: any future non-HTTP caller path (worker/initiator, internal automation, new adapter) that reaches the service layer directly can mint a receipt in the wrong matter scope from a replayed key — the exact class of state corruption that the receipt contract was built to prevent.
- **Root cause:** the dedup constraint at the service layer does not include matter/receipt-matter scope binding for the (actor, key, hash) triple.
- **Smallest fix:** scope the dedup lookup by matter membership binding (e.g., include MatterID in the primary dedup assertion) or return the existing receipt only if its matter binding matches the command's matter.
- **Regression coverage:** encode the probe as a permanent test: same key+hash on cross-matter paths → refuse-or-scope, memory + PG.
- **Confidence:** CONFIRMED by reproduced probe on both memory and PostgreSQL; HTTP mitigation CONFIRMED by fingerprint probe.

## R-03 — P2 · DECISION REQUIRED — OIDC/JWKS cache TTL: approved 30s vs configured default 15s

- **Source/hash:** `apps/backend/internal/config/product.go:104` (`MC_OIDC_CACHE_TTL` default `15s`). Approved records: ADR-004 Decision 4 and ADR-005 fix both carry TTL **30s** for the identity cache.
- **Impact:** runtime deviates from approved architecture in the conservative direction (fresh keysets fetched twice as often); no security regression, but the config contract no longer matches the approved decision, so provider validation and disruption modeling based on the approved numbers are stale.
- **Smallest fix:** either change the default to `30s` (conform to ADR-004/005) or update the ADRs to 15s with rationale — one of the two must be decided/approved, not silently shipped.
- **Confidence:** CONFIRMED mismatch (code line vs ADR text). Classification: design/approval decision, not a code bug.

## R-04 — P3 · CONFIRMED HYGIENE — Backend quality gates FAIL on the reviewed bytes (`make check` exits 1)

- **Source/hash:** `internal/adapter/outbound/postgres/matter_test.go:5` (`"net/netip"` import order — gofmt unclean); `internal/adapter/outbound/postgres/explain_access_paths_test.go:223:58` — `fmt.Errorf("explain rows: %v", err)` fails the errorlint `non-wrapping format verb` rule (should be `%w`).
- **Evidence:** `backend-make-check.log` (`Run gofmt -w on: …postgres/matter_test.go`; `make: *** [check] Error 1`), `backend-gates-stepwise.log` (`lint_exit=1`, `%v` used; `tidy_exit=0`; `sqlc-check` PASS). Both files remain unformatted in workspace, snapshot, and manifest (hashes agree — `drift-report.md`).
- **Impact:** no behavioral change; but `make check` cannot pass ⇒ the repository's own gate is red ⇒ any historical claim of a green backend gate is unverified for these bytes (the reviewed bytes are byte-identical to the candidate tree).
- **Smallest fix:** `gofmt -w` on `matter_test.go` + change `%v`→`%w` at `explain_access_paths_test.go:223`; rerun `make check`.
- **Root cause:** hygiene drift entered between the audit-fixes return and the review-matrix rework window, undeclared in any return.
- **Confidence:** CONFIRMED (exit codes + two independent detectors; hash-bound to reviewed bytes).

## R-05 — P3 · EVIDENCE INTEGRITY — `durable-session-events.json` is a captured Go error, not the PASS receipt that two docs cite

- **Source/hash:** `docs/testing/zcode-adr006-cloud-readiness-20261030-r1/durable-session-events.json` (162 B; sha `1dc13a11…` self-recorded in that dir's `outputs-manifest.json`). Content: `go: cannot find main module, but found .git/config …` — an invocation artifact of running `go` at the repo root, not a test receipt.
- **Cites it:** `durable-state-design.md:3` ("Reference semantics VERIFIED …: durable-session-events.json — rotation atomic under 10-way concurrency …") and `readiness-matrix.md` row 2.
- **Semantics actually verified (independently, this review):** `TestDurableSessionRotationSemantics` (4 subtests: atomic rotation/concurrent refresh; stale generation matches nothing; destroyed fail-closed; expired absolute fail) PASS in this session's race run on a real PG 18.6 fixture (`backend-race-exact-counts.log` lines 348–357). So the design claim is TRUE; only the cited receipt is wrong/missing.
- **Smallest fix:** regenerate the receipt inside the backend module (e.g., `go test -json ./internal/adapter/outbound/postgres -run TestDurableSessionRotationSemantics > durable-session-events.json`) and correct the two citations to the new file.
- **Confidence:** CONFIRMED (file content inspected byte-level).

## R-06 — P3 · DOC POINTER — `readiness-matrix.md` cites a nonexistent `ci-cd-templates.md`

- Row 9 of `readiness-matrix.md` references "Templates prepared (`ci-cd-templates.md`)"; the actual artifact in that directory is `ci-cd-and-runbook.md`. Workflows `backend.yml`/`frontend.yml` exist in the repo.
- **Smallest fix:** one-word correction in `readiness-matrix.md`.
- **Confidence:** CONFIRMED (filename check both directions).

## R-07 — P3 · CONFIRMED CONSISTENCY — Unread review filter is a raw `<button>`, not the design-system Button

- **Source/hash:** `apps/frontend/src/features/reviews/components/review-filters.tsx:63` — unread filter uses a native `<button>` instead of the atoms Button (historical finding `F-01` from the ui-ux-consistency chain, still unresolved in these bytes).
- **Impact:** keyboard/AT-assisted focus order and hover/focus states may not match shipped variants; no functional failure in jsdom tests.
- **Smallest fix:** swap to the shared Button primitive with the `aria-pressed` pattern already used by sibling filters.
- **Confidence:** CONFIRMED in source; visual/a11y verification NOT_RUN (browser out of scope this session).

## R-08 — P3 · ENVIRONMENT BLOCKER — Storybook runtime build FAIL (all stories) — visual pipeline unusable

- Baseline carried from the liquid-glass chain (tooling issue predating this review; not rerun per strategy §5 — unchanged suite with a known baseline failure). Effect: no story-level visual confirmation is possible for solid/liquid variants while this stands (jsdom unit tests pass; `molecules/dialog.tsx:96` ships product dialogs through `GlassSurface`).
- **Smallest fix (proposal):** restore Storybook deps/vite config to a green runtime build in a dedicated tooling task before the next visual acceptance round.

## R-09 — P3 · MEASUREMENT NOTE (not a bug) — Proposed 0009 indexes regressed `CountAccessibleMatters` at review-fixture scale-1

- This session's opt-in EXPLAIN run (`MC_EXPLAIN_VERIFY=1`, disposable fixture, `backend-explain-verify.log`): `ReviewHistoryCell` 0.750→0.038 ms (~20×; consistent with B2's 54× at larger scale); `ListMattersOfActor` 0.462→0.568 ms (no gain at scale-1); `CountAccessibleMatters` 0.227→8.233 ms (planner correctly kept seq scans after index; regression at this tiny scale only).
- The B2 chain's improvements at larger measured scale are recorded in its own artifacts; the two scale sets agree on no blanket claim. Migration `0009` remains **drafted, NOT applied**; application should require production-scale measurement or a scale-aware note. No code action now — recorded as decision input for the B2/SQL-fixes owner.

## Historical-ID mapping (for remediation)

| Historical | This review | Status redetermined on reviewed bytes |
|---|---|---|
| ui-ux `F-01` (raw button) | **R-07** | still open (confirmed) |
| A-01 (ADR-006 chain, probe envelope) | **R-02** (service layer) | probe re-reproduced this review (memory + PG); HTTP mitigation re-verified |
| SQL-fixes `0009` proposal | **R-09 / matrix** | unchanged: drafted, NOT applied |
| review-matrix-rework claims of green gates | **R-04** | stale vs reviewed bytes: `make check` FAIL |
| audit-fixes TTL disposition | **R-03** | code/ADR mismatch confirmed open |

Separation per prompt: confirmed bugs = R-01, R-02 (with scope limits), R-04, R-05, R-06, R-07 · design decisions = R-03, R-09 · missing implementation (not applied by design) = 0009 apply, Workers-side durable store, adapter PoC · environment blockers = R-08, browser/a11y/IdP/runtime (NOT_RUN set).
