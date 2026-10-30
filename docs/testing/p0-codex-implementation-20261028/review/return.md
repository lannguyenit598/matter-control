# MC-P0-CODEX-PATCH-REVIEW-20261028 — independent nonauthor review

Actual reviewer: Local Codex subagent `/root/p0_final_patch_review_resume`, RTK 1.1.0. The reviewer did not author either isolated patch or the R2 correction. Reference provenance: `codex/unified-project-flow` / `a62d838791ba188838c4ff00b7b6e265ac775056`; uncommitted bytes are identified by `delivery-r2/manifest.json`, not by HEAD.

Verdict: **PASS_SOURCE_REVIEW_WITH_LIMITATIONS** for the frozen R2 source only. This is a partial nonauthor static review, not DONE, product acceptance, runtime/PG/browser proof, architecture approval, live-source integration approval or release approval.

## Scope and byte identity

Reviewed exactly the 7 backend and 5 frontend paths in `delivery-r2/manifest.json` (`d4e71ffc34e2a1fef5508d9d4bede2b5eef7e8836c0f9b998dedd0fe52d1219d`). All 11 existing-file before hashes match the immutable baseline; the new frontend test has no before file. Every R2 after hash matches both its durable delivery copy and the current isolated source. Backend R2 is byte-identical to R1; frontend R2 changes only `intent.ts` and `data-transfer-attempt.test.tsx` from R1. Exact pins and owner receipts are in `inputs.json`.

## Findings and disposition

### Resolved introduced blocker — High / P0 correctness

R1 `intent.ts:78-82` discarded extra unexpected receipts. A response containing one valid receipt for every submitted row plus an unexpected row therefore looked settled to `bulk-section.tsx:140-149` or `import-section.tsx:90-96`; the UI could clear the frozen attempt and hide a possible unintended effect. The original new test covered an unexpected row only when the expected receipt was absent, so it missed this mixed response.

R2 resolves the issue at `delivery-r2/frontend/after/apps/frontend/src/features/data-transfer/intent.ts:78-86`: any unexpected receipt or duplicate submitted identity makes every submitted row `UNKNOWN`; missing or duplicate returned identities remain `UNKNOWN`. Bulk mixed-receipt coverage is at `data-transfer-attempt.test.tsx:97-110`; import coverage is at lines 147-155. This is the smallest safe change and keeps the original payload/keys locked for reconciliation.

No other introduced blocker was found in the reviewed R2 bytes.

## Confirmed source behavior

- Backend receipt lookup remains actor-keyed, authorizes the saved workspace and every represented Matter before replay/error distinctions, then checks exact scope, Matter, workspace, operation, source, row and canonical content binding. Denial clears item/hash/revision fields; storage errors propagate.
- Bulk/import canonical JSON hashes remove delimiter and absent-value ambiguity. Legacy hashes deliberately fail closed. Import registry and row-receipt classification precede mutation, preserving no-duplicate behavior.
- Whole-sheet format/decode/empty/header/row/byte failures propagate as `ErrSheetInvalid`; HTTP maps that class to fixed 400 problem detail without uploaded content. Owner/member lookup failures remain service/storage errors; row/group validation remains represented in rows.
- Frontend commits use frozen preview inputs, synchronously block duplicate dispatch through the busy ref, lock editing/file replacement while pending or unresolved, retain keys after transport loss or denied reconciliation, normalize missing/duplicate/unexpected receipts, and consume a settled preview before a new attempt.

## Evidence assessed, not independently executed

Owner evidence shows genuine backend RED failures followed by a frozen-byte race-enabled focused pass, including HTTP 400/non-disclosure and no-mutation assertions. Owner FE evidence shows the original 7/7 RED seam failures, corrected-environment R1 checks, R2 mixed-receipt RED (2 failed / 7 passed), one retained test-assertion harness failure, then final R2 4 files / 43 tests plus scoped typecheck, lint and format at exit 0. The final child environments omitted HOME rather than overriding it. The historical runner with `HOME=/private/tmp` remains an erratum and was not run.

Reviewer actions were READ/HASH/STATIC_ONLY. No reviewed code, build, test, browser, server, database, provider, private environment or Git command was executed. Owner logs are evidence of owner execution only.

## Residual risk and required follow-up

1. **P0 pre-existing residual:** UNKNOWN attempt identity is component-local. Reload or tab close loses it, so F02 is not fully closed. Do not add a discard/remint path; durable reconciliation remains separate approved work.
2. **P1 rollout/rollback compatibility:** old and new fingerprint formats intentionally refuse replay in both directions. Existing data is preserved, but reconciliation/readback is required and uncertain writes must not be resent under a new key. Integration should retain the documented fail-closed behavior and stage/communicate the compatibility boundary.
3. **Environment evidence gaps:** PostgreSQL adapter behavior, full repository/backend checks, full frontend check/build/generated-route typecheck, browser/accessibility, live API/auth, provider and production remain unverified. Memory/shared seam tests are not PostgreSQL or real-browser proof.
4. **Integration edge:** Claude must compare current live-source hashes, preserve newer edits, integrate the applicable R2 hunks once, and run the authorized final gates. This review did not inspect or approve live Claude-owned source.
5. BQ-05, Brief/Filing findings and full product acceptance remain outside this patch review.

Proposed next status: **R2 IN_REVIEW / SOURCE_REVIEW_PASS_WITH_LIMITATIONS**, ready for controlled live-byte reconciliation; MC-P0/F02 and release gates remain open.

Skipped: independent execution, live-source inspection, PostgreSQL/browser/full-gate validation and out-of-scope Brief/Filing review. Risk: reload loses UNKNOWN identity, and legacy fingerprint upgrade/rollback requires explicit reconciliation.
