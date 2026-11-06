# MC-BE-FIXWAVE-20261106 — Return (fix-wave, 4 items)

- **Task ID**: MC-BE-FIXWAVE-20261106 · **Executor**: actual ZCode (GLM-5.3-Flash session, backend execution owner per PO routing)
- **Status**: AUTHOR_COMPLETE_PENDING_INDEPENDENT_REVIEW — self-authored wave; **no finding is closed as independently verified**; the separate non-author confirmation pass remains open
- **Base**: `276a1e68` (= pinned, no re-pin) · **Heads**: `66993366` (W1) → `07d6f595` (W2+W3+W4-report) → evidence commit (this one)

## Acceptance per item

| Item | Result | Commit | Notes |
|---|---|---|---|
| W1 GOVULN-01 | ✅ DONE | `66993366` | echo/v5 v5.4.0→v5.4.1; diff = go.mod 1 line + go.sum 4 lines, echo path only, no transitive upgrades (tidy clean). govulncheck after: **0 "your code is affected"**; 2 INFO required-not-called (GO-2026-6866/6860, x/net v0.61.0→v0.62.0) recorded, not bumped (non-goals). Before/after evidence: `evidence/go.mod.before`, `evidence/echo-bump.diff`, `evidence/govulncheck-after.txt` |
| W2 BE-R1-01 | ✅ DONE | `07d6f595` | TDD: failing-before = compile error on the missing field (`evidence/w2-failing-before-compile-error.log`), then green. `Deleted` added to result struct, `TermSheetImported` receipt snapshot, `term_sheet.imported` event map, HTTP response. **Contract semantics preserved**: `Replaced` keeps its pinned meaning ("prior lines that did not survive" — `contract_termsheet.go:256`), `Deleted = Replaced − re-created`; both contract suites (memory + postgres) pass UNTOUCHED. Replay: pre-wave receipts decode `Deleted=0`, documented on the type. Receipt fingerprint inputs unchanged |
| W3 BE-R1-02 | ✅ DONE | `07d6f595` | `(recorded_at, seq) > ($1, $2)` row comparison at `matter.sql:147-148`; `make sqlc-generate` → generated diff is the predicate swap only, parameter names/order unchanged (`$2/$3`); `make sqlc-check` green (inside make check). Boundary test `TestEventsPage_CursorReturnsEqualTimestampGreaterSeq` added (none existed covering equal-timestamp/greater-seq) — green on the PG fixture |
| W4 hygiene | ⚠️ NOT_FOUND | — | `apps/backend/docs/api.md.orig` does **not exist** on disk and was **never in git history** (ERRATUM-1's "sibling exists" claim is stale/wrong). Repo-wide references are prose trail only (erratum, register §12, this dispatch). Nothing removed, reported per dispatch rule. Recommend correcting ERRATUM-1 at its next touch |

## Tests run / NOT_RUN

- **Run**: `make check` (sqlc-check + gofmt + go mod tidy -diff + golangci-lint **0 issues** + `go test -race -count=1 ./...`) — **exit 0** on throwaway PG `mc-be-fixwave-pg` (postgres:18-alpine :5435, spun for this wave, **torn down after the final gate** per dispatch); govulncheck (`./...`, + `-show verbose`); targeted runs of the new W2/W3 tests; contract suites memory+postgres green
- **NOT_RUN**: anything provider/production/cloud; browser; real-bucket R2 (B3, unchanged)

## Changed files

- W1 commit: `apps/backend/go.mod`, `apps/backend/go.sum`
- W2+W3 commit: `internal/core/port/termsheet.go`, `internal/core/domain/matter/termsheet.go`, `internal/core/service/termsheet_service.go`, `internal/core/service/termsheet_import_test.go` (new), `internal/adapter/inbound/productapi/term_sheet_handlers.go`, `internal/adapter/outbound/postgres/queries_mattercontrol/matter.sql`, `internal/adapter/outbound/postgres/mcsqlc/matter.sql.go` (generated), `internal/adapter/outbound/postgres/keyset_boundary_test.go` (new)
- Evidence commit: `docs/testing/mc-be-fixwave-20261106-r1/**` (this dir) + register §13 in `docs/implementation/workboard-findings.md`
- Foreign dirty files untouched: 3 handoff prompts + `docs/testing/fe-design-review-20261106-r1/`

## Iteration notes (honest trail)

1. First W2 assertion encoded MY reading of `Replaced` (changed-identities only); the term-sheet contract suites failed and revealed the pinned semantics — reverted the loop to the contract formulas and derived `Deleted` from them instead. No contract test was edited.
2. Boundary test needed two harness fixes (cast `port.MatterReadSnapshot`; seed the workspace row for the FK).

## Risks

- `Deleted` is new in the wire response and event payload — additive JSON fields; the FE ignores unknown fields today (verified by FE tests staying green in `make check`-scope backend run; FE suite untouched by this wave)
- Consumers keying on `Replaced` see unchanged behavior (contract-pinned); consumers keying on `Created` see unchanged behavior for the pinned scenarios
- govulncheck module-level INFO entries (x/net) age until a dependency intake

## Proposed next status

`AUTHOR_COMPLETE_PENDING_INDEPENDENT_REVIEW` → coordinator routes the non-author confirmation pass (existing prompt at `handoffs/MC-BE-ECHO-REVIEW-20261106-CONFIRMATION-PROMPT.md` covers the ECHO verdict; this wave needs its own lightweight confirmation for the 3 code changes).

## What was skipped / remaining risk

- Skipped: nothing within the dispatch scope. W4 produced no file change (file never existed).
- Open restated (out of scope): org tenancy (PO product decision) · real-bucket B3 test (needs PO bucket/token) · gitleaks docs/ history prose-FP classification (coordinator) · independent confirmation for both the ECHO review and this wave.
