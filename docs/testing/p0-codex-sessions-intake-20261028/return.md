# Codex sessions — coordinator intake, 2026-10-28

Actual coordinator/reviewer: Local Codex. Task `MC-P0-CODEX-SESSIONS-INTAKE-20261028`. Read/hash/log inspection only; no source fix, product test rerun, private read, provider/resource action, patch application or Git mutation. Reference branch/head rechecked: `codex/unified-project-flow` / `a62d838791ba188838c4ff00b7b6e265ac775056`.

## Result

All three Codex lanes have concrete returns. The isolated preparation is complete; exact R2 source has an independent nonauthor verdict **PASS_SOURCE_REVIEW_WITH_LIMITATIONS**. Product/MC-P0/F02/release acceptance remains open. No extra Codex author session is needed just to repeat already-successful checks.

| Session | Return/evidence checked | Current disposition |
|---|---|---|
| Backend resume | `backend/return.md`; resume integrity/coverage/closeout; final frozen command/log | Seven-file isolated patch remains unchanged and valid. Genuine regression RED/GREEN and focused race evidence retained; no unnecessary rerun. Source review supersedes historical author wording “review pending” |
| Frontend resume | `frontend/return.md`; timestamped corrected-env receipts/summary; R2 rework return and final checks | Environment correction complete. R1 had41tests; reviewed R2 has43tests/4files, scoped strict typecheck/lint/format exit0. Original logs/erratum preserved |
| Independent reviewer | `review/return.md`, `review/inputs.json` | Finished on exact7BE+5FE R2 files; original unexpected-receipt blocker fixed in R2; no other introduced blocker found within scope |

Packet root: `docs/testing/p0-codex-implementation-20261028/`.
Current adoption input: `HANDOFF.md` + `delivery-r2/manifest.json`. Historical `delivery/` is R1 and must not be used for integration.

## Integrity and evidence

- Checked all **140 files** listed in `final-manifest.json`: zero missing, zero byte/hash mismatches, zero undeclared extra files at intake.
- Verified all12 R2 after-file pins and both patch hashes.
- Verified the review's pinned patches and execution-receipt inputs: zero hash mismatches.
- Read final backend focused race receipt (exit0) and FE R2 tests/typecheck/lint/format receipts (all exit0). These establish the retained owner executions; this intake did not independently execute product tests.
- Separate JSON `checks.json` records exact current live-file comparisons. The sealed original packet was not edited by this intake.

## Integration state is separate

Claude has since advanced the live candidate: current workboard says `IMPLEMENTED_WITH_VERIFICATION_BLOCKERS_PENDING_NONAUTHOR_REVIEW`; current return identifies `CKPT-CLAUDE-02-FINAL-CANDIDATE`/contract11 and reports its own broader gates. Those claims are not independently validated by checking these Codex sessions.

Of12 patch paths,9 current live files differ from both frozen before and after bytes. Two existing files match their baseline exactly (`matter_service.go`, FE `intent.ts`); the added FE seam test remains absent. None of the12 whole files exactly equals the delivered after-file. This is **not proof that every behavioral fix is absent**: Claude may have manually implemented equivalent or newer changes. It is proof that one cannot transfer the isolated source verdict to the live candidate or blindly replace those files.

Exact next action: Claude compares each reviewed R2 change against its latest implementation, records applied/already-fixed/conflicting disposition, integrates only still-needed behavior, preserves its new work, and runs affected/final gates on current bytes. In particular check the unexpected/missing/duplicate row-receipt invariant; current `intent.ts` still matches the pre-patch baseline at this intake. Do not apply R1 and then R2; R2 is already a complete baseline-relative diff.

## Still open

1. UNKNOWN identity persistence across reload/tab-close; current patch only handles mounted-session recovery. F02 is not fully closed.
2. Legacy receipt/import fingerprint upgrade and rollback compatibility: preserve old records and resolve through authorized readback/receipts, never fresh-key retry of an uncertain mutation or silent hash rewriting.
3. Integrated PostgreSQL/full BE/FE gates and actual Cloud/browser/accessibility/human workflows; isolated source review does not prove them. Claude's broader author receipts require their own exact-candidate intake/review.
4. R9 visual alignment, Brief/Filing and other main-assignment findings are outside these narrow patches.

Skipped: product test reruns, source modifications, whole live-candidate semantic review, Cloud/private/resource/Git operations. Risk: current live source differs from reviewed patch bytes; adoption needs semantic reconciliation and new integrated evidence.
