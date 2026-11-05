# MC-P0 — kiểm tra tiến độ ZCode ngày 2026-10-28

Reviewer: actual Local Codex, task `MC-P0-ZCODE-PROGRESS-CHECK`, read/static/log inspection only. Root `/Users/nguyenvanlan/Documents/code/pet-projects/matter-control`, branch `codex/unified-project-flow`, observed HEAD `a62d838791ba188838c4ff00b7b6e265ac775056`. Working source is uncommitted; HEAD does not identify its current bytes. No product edits, private reads, runtime commands, test execution, resource changes or Git mutations in this inspection. This is a progress intake, not full independent acceptance. Source may continue changing under the implementation owner.

## Kết luận

ZCode has substantially continued the stopped Claude implementation: W6 backend/API/frontend source exists, W7 has service-level workflow tests, API documentation/template cleanup, and a reported isolated restore experiment. Current author label is `IMPLEMENTED_WITH_VERIFICATION_BLOCKERS`. That label is not sufficient evidence that all implementation gaps are closed: the observed W6 source still has defects below, follow-up QA changes are incomplete, Cloud login is unverified, and coverage/ownership/contract pointers are stale.

W1–W5 must retain the original Claude/ZCode contributions; they were not newly authored entirely by ZCode in this continuation.

## Phần đã có

| Phần | Source/evidence observed | Giới hạn |
|---|---|---|
| W1 access/workspaces/matters/history | Existing backend/API, identity verifier, BFF session, membership UI and history infrastructure retained | No verified real human Cloud session reaching API/PG; current role/history FR rows are stale |
| W2 work/dependencies/planning/My Actions | Existing service/store/API/FE and author tests retained | Browser/E2E and final independent review pending |
| W3 documents/proof | Existing immutable versions, guarded promotion, claims/assessments/disputes and FE retained; new QA F01/F02 edits visible | F02 producer/consumer propagation incomplete at observation; no fresh full gate proving these edits |
| W4 filings | Existing stages/cycles/observations/FE retained; F03 domain edits visible | New no-signature applicability fields/guards require complete service/store/API/FE wiring and regressions; not accepted by this check |
| W5 Control Room/context | Existing BE/API/FE retained | F04 mixed read boundary and F05 omitted causal reasons still visible |
| W6 bulk/import/export/Brief | `dataops_service.go`, port/domain, PG/memory adapters, migration 0006/sqlc, `productapi/data_handlers.go`, FE `features/data-transfer`, `/matters/[matterId]/data`, export BFF | Code exists, but observed defects and test gaps below prevent a code-complete conclusion |
| W7 stabilization | `gw_ledger_test.go`, product API documentation/examples, demo route removal; restore narrative and retained dump/probe locations | Service assertions are not full golden workflows; restore is a small synthetic sample, not full product recovery coverage |

## Kiểm thử thực sự nhìn thấy trong log

Read retained `/tmp/mc-p0-zcode-testenv/make-check-final.log`: lint `0 issues`, `go test -race -count=1 ./...`, successful package results including PostgreSQL. No fresh reviewer run; package-level output alone does not independently enumerate every test skip. The author's narrative says 19 packages/0 skips; raw package count is not used as an acceptance count here.

Read `pnpm-final2.log`: **34 test files / 361 tests passed**. Read `pnpm-build-final.log`: build route output contains product data route, but also `/dashboard` and `/tasks`. Those two source pages are now absent, so this build log does **not** verify the later cleanup/current complete source. Author records a prior proof-UI timeout followed by successful reruns.

New W6 behavioral tests are in `internal/core/service/dataops_service_w6_test.go` and explicitly use a memory store. No W6 DataOps/BulkCommit/ImportCommit/Brief references were found in PostgreSQL `*_test.go`, product API tests, or FE test files in the targeted search. Running existing PG/FE suites does not demonstrate new W6 PG/API/FE behavior coverage. Add targeted meaningful tests, then a stable final combined gate.

## Những phần sửa còn thiếu hoặc chưa chứng minh

### P1 — W6 import cannot create the approved intra-file dependency graph

`apps/backend/internal/core/service/dataops_service.go:409` (`parseSheet`) validates each dependency using only `findItem(g, d)` against the existing graph and records an error when a referenced row is a new row key in the same file. It does not resolve new source-row keys to imported item IDs. Later `commitImportRow` only inserts edges when `findItem(g, d)` succeeds. A valid new Requirement row plus a new Action depending on it cannot yield the required typed records and links (AC-113/RULE-014).

`ImportCommit` around line 572 loops valid groups, then calls `commitImportRow` for each row; each call opens its own `s.store.Execute` around line 694. Thus the narrative “group-tx import” is not implemented as one transaction over the connected group. Runtime failures after a prior row commit need explicit group rollback/recovery coverage. The existing test only proves a preview-invalid group is refused; it does not prove valid group link creation or failure atomicity.

### P1 — Brief replay ignores important state changes and imported records

`dataops_service.go:930` (`Brief`) replays only `requirement.created`, `action.created`, `work.updated`, `bulk.updated`. It ignores `work.execution_changed` and `import.requirement.created` / `import.action.created`, even though current producers emit those events. Execution at t2 can remain at creation state; imported work can be absent from outstanding-at-t2. Proof/dependency-derived changes also require a correct temporal reconstruction strategy, rather than treating a small event allowlist as a complete historical state.

Current tests cover creation/window endpoints, not the full transition/import/proof/dependency replay. Do not approve a current-t2-only restriction or remove domain events merely to make this pass; preserve RULE-016/AC-138 semantics.

### Parallel QA F01..F05: incomplete disposition

These refer to `docs/testing/p0-parallel-20261027/qa/return.md`, not historical CW1-F01..03.

- **F01:** new current-epoch open-dispute-before-withdrawal handling is visible in `domain/matter/evidence.go:366`. Source correction present; regression/current suite and nonauthor closure not established.
- **F02:** port and service now contain `ExpectedAssessmentID` and atomic stale comparison (`evidence_service.go:1044`). Observed HTTP `evidence_handlers.go:417` still does not populate the new field and FE proof consumer has no matching field in the targeted search. This is an incomplete contract change: follow callers/DTO/schema/action/test paths before claiming fixed.
- **F03:** `domain/matter/filing.go` adds explicit signature-applicability fields/guards. No completed current return/gate establishes the complete producer/store/API/FE path. Keep as in-progress source change, not a passed finding.
- **F04:** Control Room page still concurrently reads room/work/parties/members/context, then labels the room with the separately fetched data (`.../control-room/page.tsx:34`). No matching snapshot binding/refusal established.
- **F05:** `features/control/components/control-room-view.tsx:115` still renders execution/verification only for upstream blockers, omitting the returned transitive gate reasons.

### W7 evidence is narrower than its title

`gw_ledger_test.go:195` GW03 creates a generic Action, completes it and checks not VERIFIED. It does not execute a Filing cycle in that test. `checkpoint(stageEvents >= 0, ...)` always passes, even with zero filing events. Existing W4 tests may cover individual stages, but that does not make this a complete original GW03 ledger. All three golden workflow rows in the workboard remain NOT_RUN.

The restore narrative uses 2 users / 1 workspace / 1 Matter / 1 Requirement / 1 event / 1 receipt and a copied synthetic object probe. It does not establish recovery of actual complete document versions, memberships/relationships, import registry contents, full history/receipts, consistent DB/object snapshot, corruption handling or measured RPO/RTO. It is useful partial local evidence, not full recovery closure.

### Cloud/runtime and user validation

The supplied ZITADEL Cloud input bundle/public discovery exists. No current return, Cloud human login receipt, user-token audience confirmation, explicit A/B product identity mapping or real UI→API→PG run was found in the inspected workboard/return/evidence. This check did not open private env/key files, so it does not infer private configuration absence from public source search. The local IdP redirect error in the inherited narrative must not be assumed to describe the new Cloud client.

Rendered UI, keyboard/focus/touch/zoom/screen reader, real-session E2E, AC-137 with five real managers, final independent P0 review, Mimosa commit gate, INT-A closure and production/Cloudflare/cost/retention remain open/unverified. Do not convert source/unit tests into these results.

## Bàn giao/coverage cần đồng bộ

- Actual contract file is **revision 10**, but `workboard.local_contract` still points to revision 9/hash.
- `execution_owner` and `current_source_checkpoint` still describe historical Claude state, despite later ZCode transition/session entries.
- Workboard has 20 FR rows: 14 marked implemented and 6 NOT_STARTED (history, bulk, import, export, roles, Brief), even though corresponding source exists. These labels cannot serve as a truthful current completion percentage.
- 63 AC rows: 21 `AUTHOR_TESTED_SERVICE_LEVEL__NOT_UI_E2E`, 42 NOT_RUN; evidence arrays in inspected examples empty. All 14 NFR results NOT_RUN; all 3 GW rows NOT_RUN.
- W7 remaining list says restore not done while a later restore receipt says it ran; final return retains clearly historical sections with obsolete W6/W7 status. Historical text can remain, but one explicit current coverage table/manifest must bind the final candidate.
- All app source remains untracked/uncommitted in this checkout; no current accepted product-source commit. Do not reset/stage/commit around the unresolved gate.

## Exact next action

Keep actual ZCode as the only product writer. Let it finish the existing follow-up against its latest checkpoint; incorporate the import/Brief/GW03 and integration-test gaps above into that same execution, finish F02/F03 propagation and F04/F05, consume supplied Cloud profile, then synchronize contract/coverage/source manifest and rerun applicable final gates on stable bytes. Prepare final nonauthor review after a real consolidated return; browser/human/external gates stay explicit.

Skipped: product edits, tests/build reruns, live resource/auth/secret checks, full acceptance audit and commit operations. Remaining risk: current source is mutable and prior green logs do not prove the latest partial changes or full P0 behavior.
