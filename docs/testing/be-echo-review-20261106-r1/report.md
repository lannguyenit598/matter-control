# MC-BE-ECHO-REVIEW-20261106 — Backend Review Report (r1)

- **Task**: MC-BE-ECHO-REVIEW-20261106 · **Mode**: REVIEW_ONLY · **Status**: RETURNED
- **Actual agent identity**: ZCode session (GLM-5.3-Flash via account:zai-start-plan), executing the dispatch prompt pasted by the PO in-session 2026-11-06. Skills invoked by exact name: `/go-architecture-review`, `/codebase-design`, `/go-database`, `/sql-queries`, `/go-concurrency-review`, `/go-security-audit`, `/go-test-quality`, `/go-test-table-driven`. This is an in-session fresh review, not the "Echo" external product; the PO dispatched this session directly.
- **Pinning**: pinned base in prompt `41098a4d` ≠ actual HEAD at review start **`b86152d2`** — re-pinned per §1. The delta `41098a4d..b86152d2` is the R2 storage fix wave (38ae2458 + 26680dc1 + merge 06a60016 + b86152d2): it touches `apps/frontend`, `ops/`, `docs/` only — **zero files under `apps/backend`**, so all backend bytes under review are identical to the pinned base. Verdicts bind to `b86152d2`.
- **Dirty tree**: 4 untracked files, none inside `apps/backend` (other sessions' handoff prompts + evidence dir). Recorded.

## 0. Toolchain / environment (pre-flight evidence)

| Tool | Version | Note |
|---|---|---|
| go | 1.27.3 darwin/arm64 | |
| golangci-lint | 2.14.0 | depguard + forbidigo + gochecknoglobals + errorlint + bodyclose + noctx + gosec active |
| sqlc | v1.31.1 | pinned in Makefile via `go run github.com/sqlc-dev/sqlc/cmd/sqlc@v1.31.1`; binary not separately installed |
| goose | v3.29.0 (library) | embedded runner via `cmd/mcapi migrate`; no CLI installed |
| gitleaks | installed (homebrew) | ran, see §3 BE-R1-05 |
| govulncheck | **NOT INSTALLED** | skipped per dispatch §3 rule; NOT_RUN |
| PG fixture | `mc-r2-check-pg` postgres:18-alpine @5434 (started this session, kept for reviewer) | `mc-preflight-pg:5433` no longer exists |
| Ports 8080/8081/18082 | nothing listening | the historical orphan mcapi on :18082 is gone |

## 1. Pass results

### Pass A — Architecture: PASS
- **Domain purity (runtime `go list`)**: `internal/core/domain` imports only stdlib (`sort`, `strings`); `domain/matter` imports stdlib + `internal/core/domain`. Zero infrastructure deps.
- **Dependency direction (runtime `go list` filter)**: `internal/core/{service,port,policy}` import **no adapter packages** (empty result). Enforced by depguard rules in `.golangci.yml` (core file set), forbidigo (no global clock/logger in core), gochecknoglobals.
- **cmd thin**: `cmd/mcapi/main.go` 54 lines, `cmd/mcbffcleanup/main.go` 26 lines; composition root lives in `internal/app/product.go` (718 lines incl. tests).
- **No side-effect `init()`**: zero `func init()` in non-test `internal/`+`cmd/`.
- **State axes**: requirement/action separation intact in domain (`filing.go` stage machine + purpose-typed criteria); term-sheet additions follow the axes (facts never complete/verify — see §2).
- Layout is hexagonal and proportional — no over-layering (single adapter per port where only one exists; interfaces at consumer).

### Pass B — Database: PASS (with 2 P3 notes)
**Binding scan (binding criterion) — 0 violations.**
- Scan commands + counts (full transcripts in `commands/`):
  - `fmt.Sprintf` near SQL keywords in non-test Go: **1 hit, and it is an error MESSAGE, not SQL** (`domain/matter/filing.go:386`).
  - String-concatenated SQL literals: **0 hits**.
  - Raw `Exec/Query/QueryRow` outside sqlc-generated code: 255 matches in 22 files, of which hand-written production SQL = **2 files only**: `bff_retention.go` (ctid-batched DELETE, `$1/$2` parameterized) and `matter_migrate.go` (goose provider + `to_regclass` constant). Everything else is `mcsqlc` (sqlc-generated, pgx/v5) or test infra.
  - sqlc bundle: 10 query files, schema = goose migrations, `make sqlc-check` in `make check` fails on drift.
- **Term-sheet code (newest surface) covered by the scan**: handlers (`term_sheet_handlers.go`) bind the multipart body with `http.MaxBytesReader(limit+64KiB)`, hash exact bytes for the receipt fingerprint; queries (`matter.sql`, `term_lines.sql`) are sqlc-parameterized. No concatenation.
- **Transaction boundaries**: spine uses per-request tx via `workEnv`; receipt + business writes + `StoreReceipt` in one tx (verified reading `termsheet_service.go` ImportTermSheet flow). No `tx.Exec` captured in closures.
- **Optimistic concurrency / CAS**: header CAS mandatory — `matterHeaderRevisionCAS` (`workspace_service.go:449-457`): expected==0 → `ErrPreconditionRequired` (428), mismatch → `ErrPreconditionFailed` (412). Row-level CAS in SQL: `context.sql:6-7` (expected_revision), `matter.sql:132-134` membership `UPDATE … AND revision = sqlc.arg(expected_revision) RETURNING revision`.
- **Index coverage — EXPLAIN-verified on a real fixture (runtime-backed)**: migrations applied to schema `becho_explain` on `mc-r2-check-pg` (17/17 applied, log in `evidence/`); synthetic rows (4000 memberships, 3000 review answers); `EXPLAIN ANALYZE`:
  - review-history cell query → **`Index Scan using review_answers_cell_history`** (Index Cond grid+version+question, 0.014 ms)
  - memberships-by-user → **`Bitmap Index Scan on matter_memberships_user`** (0.032 ms)
  - Probe method recorded honestly: FK constraints dropped **inside the probe transaction** (DDL transactional) and `ROLLBACK` restored all 8 constraints (verified count=8, tables empty). Source queries unchanged; index choice is unaffected by FKs for these plans.
- **Migration hygiene**: `statement_timestamp()` present in 3 migrations (paired defaults); `+goose Down` sections present (0010 read in full — reversible); no concat-built SQL in migrations; `StatementBegin/End` present where plpgsql exists (0001, 0012 — checked by list).
- **sqlc null-override**: `security_audit_events` insert uses `sqlc.narg('client_ip')::inet` / `narg('request_id')` — nullable by design, populated from ctx RequestMeta.

### Pass C — Concurrency: PASS
- Production goroutines: exactly **1** — `internal/app/product.go:252` (`srv.Serve` in fx lifecycle OnStart, `ErrServerClosed` filtered, OnStop graceful with draining `atomic.Bool` + ShutdownDelay/Timeout). All other `go func` occurrences are in `repotest` contract suites under `sync.WaitGroup`.
- Package-level vars in core: interface-assertion vars + one immutable `regexp.MustCompile` — no mutable global state.
- Race: `make check` runs `go test -race -count=1 ./...` — **green at pinned HEAD** (log in `evidence/`).
- Bulk operations (`attemptKey` flat rows) exercised by repotest w6 concurrency tests (green).
- No `time.Sleep`-based synchronization anywhere in the suite.

### Pass D — Security: PASS
- Scanners: gosec active inside golangci (0 issues). gitleaks: working tree `apps/backend` = **8 hits, all FALSE POSITIVES** — go.sum module checksums (`h1:6P7Q…`) snapshotted inside git-ignored `.mimosa/hook-state/` tool artifacts. Git history scan = 1171 hits **all under `docs/`** (historical evidence prose, the already-classified prose-FP family — out of backend scope; coordinator pointer only). **0 secret findings in Go code, working tree or history.**
- Targeted patterns: `math/rand` in non-test code: 0. `InsecureSkipVerify`: 0. `exec.Command`: 0. Hardcoded-credential assignment patterns: 0.
- Authz: uniform-404 posture via `readSnapshot`; receipt replay re-authorization `authorizeReceiptScope` (`matter_service.go:299-319`) checks active workspace membership + per-matter read access for every represented matter, hiding replay on lost access.
- Tenancy: **org-level tenancy remains absent** (workspace-level only) — known accepted posture, carried as STILL_OPEN in §4, not a regression.

### Pass F — Tests: PASS
- `make check` (sqlc-check + gofmt + tidy + golangci-lint + `go test -race -count=1 ./...` with `MC_TEST_DATABASE_URL` on the fixture) — **exit 0 at pinned HEAD `b86152d2`**; packages green incl. productapi 2.7s, postgres 104.4s, app 17.2s, objectstore 4.1s.
- 296 test functions; table-driven pattern present (core domain/service tests); no `time.Sleep` sync; F01/F02/F03 subtests present in productapi server tests and green.
- Test-design judgment: tests assert behavior through the HTTP seam with expected statuses (428/412/409 discipline visible in test comments); repotest contract suites run against real PG with per-test schemas — matches the go-database "test SQL against a real database" rule.

**Passes E and G: SKIPPED** (optional per dispatch; capacity spent on the binding criteria + term-sheet full review).

## 2. Term-sheet workflows (fc367ce1 / 8e32e424 / dd4cd526) — full review (first independent)

Layering: `domain/matter/termsheet.go` (closed 8-field enum, total field→promotion mapping, per-field validation) → `port/termsheet.go` → `service/termsheet_service.go` (510 lines) → `term_sheet_handlers.go` → `queries_mattercontrol` + migration 0017 (closed CHECK enum, UNIQUE(document_version_id, field, row_key), composite FK to document_versions, reversible).

Verified behaviors (SOURCE_ONLY unless noted):
- Receipt discipline: same-key replay returns the stored snapshot result; scope checks (ScopeKind/WorkspaceID/MatterID/RequestHash) → `ErrIdempotencyKeyReuse`; replay of a different Kind → `ErrSnapshotKind`; a rejected-sheet import does **not** burn the idempotency key (no receipt on rejection).
- CAS mandatory on import (0 → 428) and promotion (line revision mismatch → 412-style `ErrVersionConflict`).
- Auth-before-decode: sheet bytes are decoded only after authorization and CAS (cost moves into lock time — commented, deliberate).
- Promoted-fact protection: a re-import can neither change nor drop a promoted line (two named rejection codes `promoted`), preventing double promotion and provenance loss.
- Empty-sheet guard: importing zero data rows is rejected (would silently erase the version's lines).
- Promotion atomicity: target creation + `MarkTermLinePromoted` in the same tx; replay path re-reads the graph and reports `targetMissing` instead of asserting success (honest OUTCOME_UNKNOWN handling).
- No injection vectors: all storage via sqlc/typed tx methods; fingerprint = method+path+revision+versionID+format+sha256(bytes).

## 3. Findings

| ID | Sev | Location | Finding | Basis |
|---|---|---|---|---|
| BE-R1-01 | P3 | `core/service/termsheet_service.go:326-331` | Import result counts `created/replaced/unchanged` but **not deletions**: replace-per-version semantics silently drops prior lines absent from the new sheet, and the dropped count is not reported in the result, the event payload, or the receipt. Observability gap only; correctness unaffected. Proposal: add a `deleted` counter to `TermSheetImported` + event map (proposal only — not implemented). | SOURCE_ONLY |
| BE-R1-02 | P3 | `queries_mattercontrol/matter.sql:147-148` | OR-form keyset remains: `(recorded_at > $1 OR (recorded_at = $1 AND seq > $2))`. A row-comparison `(recorded_at, seq) > ($1, $2)` gives the planner a cleaner index condition. Known prior P3, correctness unaffected at pilot scale. | SOURCE_ONLY |
| BE-R1-03 | P3 | `adapter/inbound/productapi/data_server_test.go.orig` | Leftover `.orig` file from an earlier edit (not compiled by `go build`; repo hygiene). | SOURCE_ONLY |
| BE-R1-04 | P3 (cross-cutting pointer) | `adapter/outbound/objectstore/r2.go:92-93` + `ops/deploy/*` | `R2.Put` buffers the whole upload (≤ `MC_MAX_UPLOAD_BYTES` 25 MiB) in memory per in-flight request — deliberate, bounded by `MC_MAX_IN_FLIGHT`; deploy manifests merged today cap Cloud Run at concurrency 4 (100 MiB worst case on 512 Mi). Backend code unchanged by this note. | SOURCE_ONLY |
| BE-R1-05 | Info | dispatch §3 | `/sql-queries` skill is a query **generator**, not a review skill — invoked as ordered but contributed no review criteria; the binding Pass-B criteria came from `/go-database` + the dispatch text. Recorded for dispatch-authoring accuracy. | — |

**No P0/P1/P2 findings.**

## 4. Delta verification (§5 of the dispatch) — dispositions

| Prior finding | Disposition | Evidence |
|---|---|---|
| SQL P2: review_answers_cell missing `answered_at` index | **REMEDIATED** | `0010_access_path_indexes.sql` creates `review_answers_cell_history (grid_id, version_id, question_id, answered_at DESC, id DESC)`; EXPLAIN ANALYZE on fixture → Index Scan, 0.014 ms (runtime-backed) |
| SQL P2: missing user_id/workspace_id access-path indexes | **REMEDIATED** | 0010 creates `matter_memberships_user`, `workspace_memberships_user`, `matters_workspace`; EXPLAIN → Bitmap Index Scan on `matter_memberships_user`, 0.032 ms (runtime-backed) |
| SQL P2: count-per-page cost | **REMEDIATED (by construction)** | 0 `COUNT(` in all 10 sqlc query files; page totals are computed from snapshots in memory |
| SQL P3: OR-form keyset | **STILL_OPEN** (= BE-R1-02) | matter.sql:147-148 |
| SQL P3: membership update without CAS-in-SQL | **REMEDIATED** | matter.sql:132-134 `AND revision = sqlc.arg(expected_revision) RETURNING revision` |
| SQL P3: security_audit dead columns client_ip/request_id | **REMEDIATED** | matter.sql:75-78 INSERT populates `client_ip::inet`, `request_id` via narg params (ctx RequestMeta plumbing) |
| BE-01 rework F01/F02/F03 failing-before→green | **REMEDIATED (green at HEAD)** | Subtests present in productapi server tests; `make check -race` green at b86152d2 |
| Z-F-01 purpose-blind filing guard / Z-F-02 signature gate / Z-F-03 visibility | **REMEDIATED** | Migration 0011; purpose-aware guards at `filing.go:246,290-297,410-414,436-460` (PACKAGE vs SIGNATURE purpose-typing per D-9) |
| A-01 cross-matter receipt replay | **REMEDIATED** | `authorizeReceiptScope` (matter_service.go:299-319) re-authorizes all represented matters on replay; `replayHidden` on lost access |
| Org tenancy absence | **STILL_OPEN** | Workspace-level tenancy only — unchanged design posture, not a regression |
| Rerun `make check` once on pinned HEAD | **RUN — exit 0** | PG (postgres 104.4s) + race, log in `evidence/` |

## 5. Verdict

**PASS_WITH_LIMITATIONS**

Limitations:
1. `govulncheck` NOT_RUN (not installed on this workstation).
2. EXPLAIN evidence gathered on a disposable schema of this session's own PG 18 container, with FKs dropped inside the (rolled-back) probe transaction; the 0010 migration comment's own measured numbers (54×/4× at larger volumes) remain the authoritative scale measurements.
3. Runtime evidence is local-only: no production, provider, cloud or billing behavior is claimed anywhere.
4. Passes E/G skipped (optional).
5. `TestContract_R2_RealBucket` (gate B3) remains NOT_RUN — needs the PO's real bucket/token; out of backend-code scope.

## 6. What was skipped / remaining risk

- Skipped: passes E (API/contract conformance sweep) and G (ctx/error/performance deepening) — optional; org-tenancy architecture question remains a product-level decision (STILL_OPEN).
- Remaining risk: the 4 P3s above are non-blocking; historical `docs/` secret-scan prose-FP family (1171) still awaits the coordinator's classified disposition list (out of backend scope).

## 7. Return format (orchestration-protocol)

- **Task ID**: MC-BE-ECHO-REVIEW-20261106 · **Agent**: ZCode session (GLM-5.3-Flash) · **Base/Head reviewed**: `41098a4d` (pinned) → re-pinned `b86152d2` (backend bytes identical)
- **Changed files**: none outside this evidence directory
- **Acceptance**: binding criteria §3 Pass B all met (scan + EXPLAIN + CAS + migration hygiene); §5 delta dispositions returned for 11/11 items
- **Tests run**: `make check` (PG+race) exit 0; gitleaks (tree+history); `go list` import-direction probes; EXPLAIN ANALYZE ×2
- **Tests NOT run**: govulncheck; real-bucket R2 contract test; anything provider/production
- **Proposed next status**: findings + dispositions ready for coordinator intake; no code changes proposed as blocking
