# Backend/API static review — MC-P0-CODEX-PARALLEL-20261028

Actual reviewer: **Local Codex internal subagent** `/root/p0_backend_qa_20261028`; no external QA product was invoked. Proposed status: **IN_REVIEW / CHANGES_REQUIRED_STATIC**, never acceptance PASS or DONE. Owner of implementation remains actual Claude Code under the parent assignment; this reviewer owns only this report and `inputs.json`. Independent final acceptance reviewer: actual OpenCode when dispatched by orchestration.

Baseline: manifest branch `codex/unified-project-flow`, HEAD `a62d838791ba188838c4ff00b7b6e265ac775056`; selected source is uncommitted and identified by hashes, not HEAD. All **535/535** frozen file hashes match manifest SHA-256 `39fc4961995958e850d9261c77db7514c983bd0c9b22dab8b68f6d9d6b2ad841`. Snapshot captured `2026-10-28T03:10:38.929789+00:00` at `/private/tmp/mc-p0-codex-parallel-20261028-h9mtoxwx`. Every source reference below resolves under that frozen root. It is a selected-public snapshot, not an atomic full repository image. Selected evidence hashes are in `inputs.json`.

Scope: W6 import/receipt/Brief behavior and F01–F03 propagation, schema/store/HTTP consumers and meaningful regression coverage. Requirements: FR-013/016/018/019; RULE-007/012/014/016/017; AC-113/132/138/145/160. Dependencies: frozen local contract v10, approved rules/ACs, historical progress/QA reports and owner stop checkpoint. Acceptance for this review: verify frozen identity, report concrete source traces and distinguish existing fixes from remaining defects; met as a static report, with runtime correctness unverified. No product source, tests, fixtures, configuration or exports were changed.

## Already corrected in the frozen source

These supersede the older progress report and `postrun_stop_checkpoint`; do not reassign them as absent code:

- **Import new-row references/group transaction:** `dataops_service.go` now collects `fileKeys` (436–440), accepts intra-file references (498–507), marks cycles (`markImportCycles`, 524), orders dependencies (`orderRows`, 668), and invokes one `store.Execute` per connected group (`commitImportGroup`, 740–746). New rows, edges, derived states, registry and receipts are inside that transaction. The former per-row transaction finding is corrected at source level.
- **Brief initial allowlist gap:** `brief_replay.go:31–52` now handles `work.execution_changed`, imported creations and verification/dependency patches. This does not close the temporal findings below.
- **F01:** current-epoch disputes are inspected before withdrawn/revoked early returns (`domain/matter/evidence.go:382–414`); shared `SuiteW7QA` has both regression variants.
- **F02:** nil versus explicit empty binding exists in `port/evidence.go:176–180`; `EvidenceService.Assess:1044–1055` checks under the transaction; HTTP request and handler propagate it (`evidence_handlers.go:78–80,428–431`). FE schema/action/form intent also carry `expectedAssessmentId` (`schemas.ts:243`, `actions.ts:186`, `proof-panel.tsx:404`). `evidence_server_test.go` and shared `SuiteW7QA` cover missing/stale/fresh intent at source level.
- **F03 wiring:** `SetFilingSignatureApplicabilityCmd`/service method/HTTP route/DTO now exist (`port/filing.go:71`, `filing_service.go:479`, `productapi/server.go:160`, `filing_dto.go:18–21`). Migration 0007, PostgreSQL read/write mapping (`filing_store.go:63–70,177–184`) and whole-struct memory persistence (`memory_filing.go:47–52`) retain the decision. Existing insert path correctly starts with the default false decision. This is no longer a missing-wiring finding; remaining package-policy concern is BQ-06.
- **Shared W6 tests exist:** `contract_w6.go` covers exact new-row edges, invalid/cyclic groups, independent success, replay/conflict, extension of an imported group, injected rollback, lost acknowledgement, concurrency and revocation. `TestSuiteW6_MemoryStore` and `TestMatterSuiteW6_Postgres` register them. Product API `data_server_test.go` now covers import graph/readback/replay and basic export/Brief endpoints. Presence is not a test result.

## Remaining actionable findings

### BQ-01 — P1 — Import receipt replay is not bound to saved scope or source-row identity (new)

**Evidence:** [dataops_service.go:803](/private/tmp/mc-p0-codex-parallel-20261028-h9mtoxwx/apps/backend/internal/core/service/dataops_service.go:803), especially 807–815. Receipt lookup is global per actor/key (`postgres/queries_mattercontrol/matter.sql:34–37`, `postgres/matter_store.go:167–168`, memory `memory.go:434–439`). Only kind/content hash is checked. The command authorizes the requested Matter at 748–764; it never authorizes `rcpt.WorkspaceID/Matters` or compares `ImportSnapshot.SourceName/RowKey`.

**Trigger/impact:** import a row into A, revoke A membership, then reuse its key and equal row content on accessible B. B's empty registry falls through to the global receipt and returns A's item as `SUCCESS_REPLAYED`, even without read authority on A. Within one Matter, equal content with a different row key/source can also replay the earlier item without creating/registering the intended source identity. FR-018/RULE-017 isolation and RULE-014/AC-132 intent are violated. Bulk has the same saved-scope exposure when replaying A's identical row payload through B (`dataops_service.go:227–250`); its authorization also uses B's header rather than the saved receipt scope.

**Minimum correction:** authorize the receipt's saved scope before exposing any replay; bind reuse to the complete original operation/scope/source/row intent and reject incompatible reuse. Use the existing saved-scope rule (`matter_service.go:292–319`) consistently. **Regression:** two Matters with revocation; same key with changed Matter/source/row; no foreign outcome/ID, no duplicate write/audit. Run shared memory/PG and HTTP regressions; NOT_RUN here.

### BQ-02 — P1 — Brief misses filing execution changes and terminal exclusion (residual of known Brief completeness gap)

**Evidence:** [brief_replay.go:128](/private/tmp/mc-p0-codex-parallel-20261028-h9mtoxwx/apps/backend/internal/core/service/brief_replay.go:128); full event map at 42–44 and switch through 166 omit `filing.stage_changed`, `filing.closed`, `filing.reopened`. Filing advance emits only stage/observation payload (`filing_service.go:296–301`, `obsPayload:211–216`); `commit:65–81` persists the changed execution, while shared `persistGraph` emits verification/dependency changes only (`work_service.go:258–270`). Close/reopen explicitly change execution (`filing_service.go:393–422`).

**Trigger/impact:** filing creation → Package Preparation → Submission changes stored execution to WAITING (`domain/matter/filing.go:407–409`), but historical Brief retains NOT_STARTED. Closing a rejected filing to CANCELLED still leaves it outstanding; approval completion is also not reconstructed. FR-019/RULE-016/AC-138 facts are wrong even though the changes list contains the event.

**Minimum correction:** make command-owned filing execution snapshots replayable without fabricating state from incomplete observation payloads. **Regression:** real filing service/API sequence with t2 before/after submission, approval, negative close and reopen; compare expected execution/outstanding at each boundary on memory and PG. The new W6 shared Brief tests use generic Action transitions, not this filing lifecycle.

### BQ-03 — P1 — Brief expiry heuristic disagrees with domain proof/dependency state (new residual temporal defect)

**Evidence:** [brief_replay.go:157](/private/tmp/mc-p0-codex-parallel-20261028-h9mtoxwx/apps/backend/internal/core/service/brief_replay.go:157), 161 and 168–185. Any unclosed accepted assessment expiring marks its entire subject `expired`, irrespective of criterion identity/revision, mandatory status, alternatives, applicability or proof epoch. Domain evaluation instead accepts a criterion if **any** current claim satisfies it (`domain/matter/evidence.go:341–349`), and ignores older epochs (375–377). Replay retains recorded `verification` and `dependency` rather than evaluating their temporal effects.

**Trigger/impact:** a completed Requirement has two accepted claims for the same mandatory criterion; one expires at t2 and the other remains valid. Domain remains VERIFIED, but Brief puts it back in outstanding with `proofExpired=true`. Conversely, a real necessary-proof expiry can leave downstream dependency READY and the expired subject's displayed verification VERIFIED. No intervening command is required for expiry to take effect (RULE-007). FR-019/RULE-016/AC-138 are affected.

**Minimum correction:** reconstruct enough historical proof/graph inputs to use domain semantics at t2, or explicitly refuse history that cannot be reconstructed. **Regression:** alternate accepted claims, optional criterion expiry, old-epoch expiry after reopen/reverification, and transitive PROOF-gate readiness at the exact expiry instant. Existing replay expiry unit test is a single-assessment fixture and cannot distinguish these cases.

### BQ-04 — P2 — Whole-file parse failures become successful empty imports (new)

**Evidence:** [dataops_service.go:392](/private/tmp/mc-p0-codex-parallel-20261028-h9mtoxwx/apps/backend/internal/core/service/dataops_service.go:392), 396–397 suppress `parseSheet` errors. Those errors are global: unsupported format, malformed codec data, missing required columns, empty sheet and row limit (410–434); they are not stored as row errors. `ImportCommit:646–664` then sees no groups and returns an empty success list; HTTP handlers respond 200.

**Impact:** an invalid/unsafe upload refusal can appear as a successful empty preview/commit instead of the declared validation error. No mutation occurs, but the user receives no actionable failure. RULE-014 preview validation is not fulfilled.

**Minimum correction:** propagate global parser/storage errors; retain row/group errors only where they are actually represented. **Regression:** malformed CSV/XLSX, missing rowkey/kind/title columns, unsupported format, oversized row count; assert non-success error and no writes via service + HTTP. Existing HTTP test checks missing multipart file and body size, not invalid sheet contents.

### BQ-05 — P2 — Imported verification claim is discarded rather than retained for review (new confirmation)

**Evidence:** [dataops_service.go:452](/private/tmp/mc-p0-codex-parallel-20261028-h9mtoxwx/apps/backend/internal/core/service/dataops_service.go:452), parsing through 516 never reads `verification`; `ImportRowPlan` has no claim field (`domain/matter/dataops.go:84–94`), and `insertImportItem:938–962` constructs no original claim. SQL `InsertRequirement` omits `imported_verification_claim` (`queries_mattercontrol/matter.sql:46–50`) despite existing columns in migration 0001:105/140.

**Impact:** `verification=VERIFIED` correctly does not grant authority, but the original claim disappears. Changing only that supplied claim also does not change ContentHash. This violates the explicit retention part of RULE-014/AC-113 and local contract §2.7; the historical return's claim-retention statement is unsupported by these bytes.

**Minimum correction:** carry and persist the original label as a non-authoritative, reviewable claim for both typed imports and include it in content identity. **Regression:** read back original label after import and replay on memory/PG/API, retain UNVERIFIED; changed label alone must not silently replay. Existing `TestImportCommit_VerifiedClaimStaysUnverified` only asserts the final state (253–255), not retention.

### BQ-06 — P1 — F03 package completeness still depends on outcome-proof flag (known F03, partially corrected)

**Evidence:** [domain/matter/filing.go:351](/private/tmp/mc-p0-codex-parallel-20261028-h9mtoxwx/apps/backend/internal/core/domain/matter/filing.go:351), 360–361 permits no-proof filings into Package with zero declared package criteria. Criteria cannot be added through the current proof API for no-proof records (`evidence_service.go:430`). `unsatisfied:238–248` then has nothing to reject; the new submission guard at 382–391 requires only a signature observation on one submitted version or the OWNER signature decision.

**Trigger/impact:** no-proof filing with no declared package requirements + an observed signature, or OWNER no-signature decision + arbitrary named package versions, can submit without any package completeness assessment. The signature guard is now present, but it does not resolve the independent package guard from original F03/RULE-012/AC-145/160. The finish prompt explicitly says no-signature must not mean no-package.

**Minimum correction:** preserve the no-proof outcome axis and represent/validate applicable package requirements independently; a no-signature decision must waive signatures only. Keep this as residual original F03, not a missing service/store/API finding. **Regression:** no-proof/owner-no-signature filing with missing required package document is refused without submission/revision/event; complete legitimate package succeeds. Do not claim F03 closure from only signature-observation/waiver tests.

## Validation and remaining gates

Read/hash/static checks only; no reviewed code execution, tests, builds, migrations, auth, credentials, providers, runtime evidence, Git commands or source mutations. Semble succeeded against the exact frozen root; subsequent commands used `rtk proxy` and known paths/exhaustive symbol references. Output collision preflight found the owned directory empty, with both output files absent.

`workboard.postrun_stop_checkpoint.current_build_state` and `final-return.md:3–14` are **historical author reports** of build failure, not reviewer runs or proof of a current failure. Several listed errors are visibly corrected: `ClaimStatus.Current`, the `newBundle` parameter, pointer assessment binding, actual filing method and tests now exist. Current compile/build result: **NOT_RUN / UNVERIFIED**; do not quote the old diagnostic list as a current reproduced error. Likewise no historical green log is accepted as verification of these frozen changes.

The selected snapshot omits project-status/current-workflow/task/orchestration-protocol files. This review did not fetch those from mutable live root, nor read `/tmp` runtime logs or private inputs to fill that gap. Final implementation acceptance requires owner corrections and stable-byte tests followed by the separately authorized independent review.

Skipped: runtime/build/test execution, live source inspection, broad W0/security/style re-audit and external-agent acceptance. Risk: findings are source-backed and unexecuted; the live Claude source may already differ from this frozen capture.
