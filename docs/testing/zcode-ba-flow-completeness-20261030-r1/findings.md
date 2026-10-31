# Findings — MC-ZCODE-BA-FLOW-COMPLETENESS-20261030-r1

- Agent: actual ZCode acting as BA (author-adjacent — NOT independent QA; OpenCode owns independent verification).
- Base: HEAD `0de3e5d` + dirty tree (remediation candidate for BF-01..10, author-verified by Claude Code). Machine-readable: `findings.json`. Severity per prompt §5: P0 business-truth/leak/data-loss, P1 golden-workflow blocked, P2 misleading/slow, P3 polish.

## 1. BF-01..BF-10 recheck on the current tree

Method: each finding was re-derived from the Codex review (`docs/testing/codex-business-flow-review-20261030-r1/findings.json`), then checked against the current dirty tree by (a) running the full backend suite with `-race` against a fresh PostgreSQL fixture (734 pass / 5 fail / 6 skip; the 5 failures are the deploy-readiness task's `TestB1LeastPrivilegeProfile`, out of BA scope — see `commands/`), and (b) exercising the behavior live over HTTP against the fixture runtime (`journey-walkthroughs.md`). The remediation return's claims were not trusted without (a)/(b).

| BF | Verdict | Evidence (this run) |
|---|---|---|
| BF-01 package vs outcome verification split | **CLOSED_VERIFIED** | Live: OUTCOME criterion refused on a non-filing (`outcome-criterion-not-applicable`); early submission refused `guard-failed (MISSING)` naming only PACKAGE; APPROVAL reached with `verification: PARTIALLY_VERIFIED` + `outcomeVerification: PENDING`, then `VERIFIED`/`ACCEPTED` after the designated non-submitter assessed. Migration `0009_criterion_purpose` applied on the fixture; `TestCriterionPurposeMigrationKeepsLegacyRowsAsPackage`, `TestMatterSuiteBF_Postgres`, `TestMatterSuiteGW_Postgres` green. Residual (from remediation §9, confirmed open): a `proofRequired=true` filing with no declared OUTCOME criterion still reads VERIFIED from package acceptance; grids/Control Room show the package-driven value (displayed `outcomeVerification` exists only on filing/work-item detail). Kept open as PO decision D-BF1. |
| BF-02 no-proof filing dead end | **CLOSED_VERIFIED** | Live: `proofRequired=false` filing completed the whole package path (criterion → evidence → independent accept → OWNER no-signature applicability → SIGNATURE → SUBMISSION) with no dead end; `guard-failed`/`signature-required` messages name the exact missing prerequisite. UI label wording NOT_RUN (browser). |
| BF-03 date entry UTC default | **CLOSED_SOURCE_ONLY** | `lib/mc/local-time.ts` + callers in tree; 11-case zone/DST/gap/overlap tests green (run in this tree's receipts; not re-run here). Browser input behavior NOT_RUN. |
| BF-04 pickers stop at 200 | **CLOSED_SOURCE_ONLY** | `searchWorkItemsAction` + `SearchPicker` in DependencyPanel/CreateFilingForm; truncation-notice component tests green; work-items grid `q=` parameter contract-tested. >200-record browser search NOT_RUN. |
| BF-05 verifier queue | **CLOSED_VERIFIED** | Live: designated verifier sees pending claims (`total: 13`, subject/criterion titles); non-designated VIEWER `total: 0`; revocation-emptying covered by SuiteBF (memory+PG green). `/my-reviews` rendered page NOT_RUN. |
| BF-06 root/login landing | **CLOSED_SOURCE_ONLY** | `app/page.tsx` + `DEFAULT_RETURN` in `oidc/flow.ts` target `/my-actions`; entry-route/flow tests green. Browser redirect NOT_RUN. |
| BF-07 matter root lacks operational brief | **CLOSED_SOURCE_ONLY** | Matter landing = shared `ControlRoomView` (brief variant) + "Your work here"; landing/tab tests green. Rendered comprehension (AC-137 with humans) NOT_RUN. |
| BF-08 matters discovery | **CLOSED_VERIFIED** | Live: `GET /matters?q=ACME` returns exact total with `workspaceName`, keyset paging; role-scoped (Binh sees only his workspace's matter). Search client-nav per remediation §9 NOT_RUN in browser (component tests green). |
| BF-09 work detail lacks one primary action | **CLOSED_SOURCE_ONLY** | `WorkNow` + role-derived `primaryTransition`; viewer offered no step (`offeredTransitions VIEWER → []` tests). Rendered decision-load check NOT_RUN. |
| BF-10 brief technical timestamps/raw ids | **CLOSED_VERIFIED (API tier)** | Live: brief accepts plain RFC3339 t1/t2 with client-zone UI windows (BF-10 fix), returns `targetLabel` for work-item events; reversed window 400 `invalid-window`; raw ids remain in a details toggle by design. Readability of the rendered draft NOT_RUN (browser). Note: `targetLabel` is empty for membership-type events (contracted "may be empty") — see ZBA-F04. |

No REGRESSED findings. No new P0/P1 DEFECT or GAP found in the implemented flows this run.

## 2. New BA findings

### ZBA-F01 — Contract drift: bulk preview request shape (P3, DEFECT, doc-only)
- Flow F13. `local-contract.md` §2.7 documents bulk preview rows as `{itemId, expectedRevision, set:{…}}`; the handler (`data_handlers.go` `bulkRowRequest`) actually requires flat fields plus `rowKey` (`{rowKey, itemId, expectedRevision, title|description|internalOwner|due}`), as the commit table already documents. Live: preview with the documented `set{}` shape → 400 `malformed body`; commit with the flat shape → 200.
- Expected: contract and wire agree. Suggested correction: contract revision 14 delta fixing the §2.7 preview row shape (no code change).
- acceptance_to_add: a doc-sync check or the existing contract-sync review covers the preview shape.

### ZBA-F02 — Contract drift: review-grid answers omit `questionRevision` (P3, DEFECT, doc-only)
- Flow F10. The review-matrix section of `api.md`/contract lists `{versionId, questionId, expectedAnswerId, state, …}` for answers, but the handler requires `questionRevision` (stale-question guard); omitting it → 428 `precondition-required`. Live: answer 428 without it, 201 with it.
- Suggested correction: add `questionRevision` to the answer body docs (contract revision).

### ZBA-F03 — Workspace role vocabulary under-documented (P3, GAP, doc)
- Flow F02. Workspace membership roles are `OWNER|MEMBER` (`access.go`), while all matter-level prose uses `OWNER|EDITOR|VIEWER`; permission-matrix.md speaks only of "Workspace OWNER". A first-time API consumer naturally sends `role:"EDITOR"` for a workspace member → 422 `must be a valid role`. Live probe hit exactly that.
- Suggested correction: one line in `api.md`/contract: workspace roles are `OWNER|MEMBER`; matter roles `OWNER|EDITOR|VIEWER`.

### ZBA-F04 — Brief `targetLabel` empty for membership-type events (P3, UX_FRICTION)
- Flow F14/BF-10. Live brief shows readable labels for work-item events but `""` for several membership/lifecycle events. The contract states the label "may be empty", so this is within spec; a manager reading a brief full of empty attributions is still a comprehension cost. UI rendering of the fallback NOT_RUN.
- Suggested correction (business-level): record a target label at membership grant/revoke and filing stage events, or state explicitly in the UI when no label was recorded.

### ZBA-F05 — Evidence create response is minimal (P3, UX_FRICTION, API ergonomics)
- Flow F07. `POST /evidence` returns `{id, kind, seq}`; the claims linkage and criterion effect are visible only through the proof readback (extra roundtrip for API consumers; the BFF handles it). Not a defect; RECOMMENDATION to consider returning the affected criterion summary or accepting it as-is.

### ZBA-F06 — WAITING requires owner via separate PATCH (P3, UX_FRICTION, correct guards)
- Flow F05/F06. `POST …/execution {to: WAITING}` without a responsible owner → 409 `waiting-owner-required`; the owner must be set by a prior `PATCH /work-items/{id} {ownerId}` (the execution body has no `ownerId` field — verified against `work_handlers.go`). The error message is actionable and the UI pre-set owners, so this is an API-tier friction note only.

### ZBA-F07 — OUTCOME_UNKNOWN reconciliation not exercised live (NOT_VERIFIED at HTTP tier)
- Flow F15. Deterministic 503 `outcome-unknown` requires fault injection not available through the public API. Semantics verified by SuiteW6/AC-139 tests (memory+PG green) and contract §2.1; live reconciliation of a real lost response remains NOT_RUN. UI OUTCOME_UNKNOWN affordance NOT_RUN (browser).

## 3. Counts

- DEFECT: 2 (both P3, doc/contract drift: ZBA-F01, ZBA-F02)
- GAP: 1 (P3 doc: ZBA-F03)
- UX_FRICTION: 2 (P3: ZBA-F04, ZBA-F05) + 1 API friction (ZBA-F06)
- NOT_VERIFIED: 1 (ZBA-F07, scoped to live execution only)
- RECOMMENDATION: 1 (ZBA-F05 dual-classed)
- P0: 0. P1: 0. P2: 0. P3: 7.
