# Verification matrix — implemented-system review r1 (2026-10-30)

Reviewer: actual ZCode (review-only session; no source support beyond the declared snapshot-only probe). Candidate identity: `codex/unified-project-flow` @ `20feedbf06c859a9806055d609f5b132fe8bb086` + dirty tree; bytes hash-bound by `source-manifest.csv`; terminal drift 0 on all 1,096 manifest entries + 4 snapshot-only probe files (`drift-report.md`).

Environment pins: `environment.txt` (Go, golangci-lint 2.14.0, Node, pnpm 12.11.2, Docker, sqlc 1.31.1). All commands on this workstation prefixed `rtk`.

## Fixture ownership + cleanup disposition

- **PG fixture:** disposable container `mc-implrev-pg-20261030-r1`, label `mc.owner=MC-ZCODE-IMPLEMENTED-SYSTEM-REVIEW`, port 51483, image `postgres:18.6-alpine` (sha256:898c60cb390d…), app password stored only in `$HOME/tmp`-adjacent scratch `…/pgsec/pgpw` (0700 dir / 0600 file; **never committed**).
- **Disposition:** container removed (`docker rm -f` verified empty label set), scratch secret file removed after final receipt anchoring. No anonymous volume leaked (volume list filtered by label empty). Synthetic data only.

## Command ledger (exact)

| # | Command (rtk-prefixed) | Scope / identity | Result | Output anchored to |
|---|---|---|---|---|
| 1 | `make sqlc-check` (pinned sqlc 1.31.1) | backend snapshot bytes | **PASS** exit 0 | `backend-gates-stepwise.log` context (summary in findings R-04 evidence) |
| 2 | `make check` | backend snapshot bytes | **FAIL exit 1** — stops at gofmt (`postgres/matter_test.go`) | `backend-make-check.log` |
| 3 | `go mod tidy -diff` | backend bytes | PASS exit 0 | `backend-gates-stepwise.log` (`tidy_exit=0`) |
| 4 | `golangci-lint run` | backend bytes | **FAIL exit 1** — 2 issues: errorlint `explain_access_paths_test.go:223:58` (`%v`), gofmt `matter_test.go:5` | `backend-gates-stepwise.log` (`lint_exit=1`) |
| 5 | `go test -race -count=1 ./...` | backend bytes + PG fixture | **PASS exit 0 — 708 PASS / 0 FAIL / 4 SKIP**; 14 `ok` packages, 22 listed | `backend-race-exact-counts.log` (125 KB `-v`) |
| 6 | SKIP inventory (from #5) | — | `TestContract_R2_RealBucket` (no real bucket creds); `TestAccessPathExplainVerification` (opt-in env unset in default run); `TestPerf_LocalWorkloads`; `TestRestoreRehearsal` | line refs in log (205/360/736/739) |
| 7 | `go test -run TestAccessPathExplainVerification` with `MC_EXPLAIN_VERIFY=1` (opt-in) | fixture | PASS exit 0 — ReviewHistoryCell 0.750→0.038 ms; ListMattersOfActor no gain at scale-1; CountAccessibleMatters 0.227→8.233 ms (R-09) | `backend-explain-verify.log` |
| 8 | A-01 probe (4 snapshot-only files; runner in repotest + postgres) | same bytes + probe additions | **REPRODUCED both stores** (`MEM_EXIT=1`, `PG_EXIT=1` — replay returns matter-A receipt from a matter-B command); fingerprint mitigation probe PASS | `a01-crossmatter-replay-probe.log`; probe steps in findings R-02 |
| 9 | `pnpm typecheck` (next typegen + tsc --noEmit) | frontend snapshot (node_modules present) | PASS exit 0 | `frontend-gates-stepwise.log` |
| 10 | `pnpm lint` | frontend | PASS exit 0 | same |
| 11 | `pnpm format:check` | frontend | PASS exit 0 (Mimosa state untouched) | same |
| 12 | `pnpm test` (vitest run) | frontend | **PASS — 80 files / 720 tests**, jsdom | same (`test_exit=0`) |
| 13 | `pnpm agents:check` | frontend | PASS exit 0 (17 skills / 3 scoped rules) | same |
| 14 | `next build` turbopack + CSS guard | frontend | PASS exit 0; 27/27 static pages; 6 route handlers ƒ | `frontend-production-builds.log` |
| 15 | `next build` webpack (alternate bundler) + CSS guard | frontend | PASS exit 0 | same |
| 16 | Hash re-verify workspace (323 entries) + snapshot (214 backend / 559 frontend) vs `source-manifest.csv` | — | **0 drift / 0 missing**; snapshots contain exactly 4 extra probe files | `drift-report.md` |
| 17 | Historical artifact bind checks: ADR-006 dir `outputs-manifest.json` vs files; B1 events (56 pass/0 fail incl. package line); durable-session-events.json content inspection | — | binds OK; **mislabel confirmed** (file is a Go error capture, not a PASS receipt) | findings R-05, R-06 |
| 18 | Web allowance re-verification (public pricing pages) | — | R2/Supabase/ZITADEL/Cloud Run free-tier facts re-confirmed fresh | packet §cost + this review note |

## Not-run ledger (explicit reasons)

| Check | Why NOT_RUN (and why that's acceptable/required here) |
|---|---|
| Browser E2E journeys; a11y audit; visual rendering (incl. liquid tier) | Prompt scopes this review to source/gates/probes; Storybook runtime FAIL (R-08) and no local rendering stack; second-user/IdP journeys reserved for authorized validation stage |
| OIDC against a real IdP; IdP-assurance/MFA behavior | No IdP runtime authorized; unit+contract coverage only (`identity/zitadel` package ok) |
| Real R2 bucket legs (SigV4/multipart/policy) | Provider actions are paid-spend/object creation — prohibited without authorization; tests skip by design (`TestContract_R2_RealBucket`) |
| Supabase/Cloud Run managed-provider validation, deploy/IAM/domain, pooler+PgBouncer | ADR-006 stage-2 gate — requires PO authorization + operator path; packet carries the request with 6 decisions |
| Adapter PoC execution (OpenNext vs vinext on workerd) | `PREPARED_NOT_EXECUTED`; script pinned in `adapter-poc.sh`; heavy isolated installs out of this session's budget per prior chain — remains the gate |
| Storybook runtime build | Known baseline failure (R-08); not rerun per "no rerun of an unchanged suite with a known concern" — risk recorded |
| 0009 application + production-scale EXPLAIN | Additive index migration intentionally not applied; scale-1 counter-evidence logged (R-09) |
| Backend `make check` full green | Impossible on reviewed bytes (R-04) — red gate itself is evidence |

## Receipt hygiene notes

- Every artifact in this evidence dir was written by this review from captured command output; no DSN, token, name-identifying data or signed URL is embedded (password held only in removed scratch; probe log contains UUIDs only).
- Author-chain receipts were **bound-checked, not re-executed** where content matched claimed bytes (ADR-006 dir manifest; B1/B2 event logs); the one receipt that failed semantic inspection (R-05) downgraded its citations.
