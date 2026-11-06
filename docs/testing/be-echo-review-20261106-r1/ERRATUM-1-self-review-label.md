# ERRATUM-1 — Self-review label (2026-11-06)

- Task: MC-BE-ECHO-REVIEW-20261106 · Recorded by: ZCode session on explicit PO instruction ("thực hiện theo khuyến nghị và zcode làm hết", 2026-11-06).
- `report.md` and all of its verdicts are retroactively labelled **SELF-REVIEW / OWNER-CONFIRMATION** (MC-003A.8 precedent).

## Reason

§0 of the dispatch requires a non-author reviewer. The executing agent was a ZCode session (GLM-5.3-Flash) and most in-scope backend surfaces are ZCode-authored (BE-01 transaction spine, audit fixes A1–A5, preflight, term-sheet backend). The reviewer stated its identity honestly but did not apply §0's COI gate; the design dispatch of the same identity class **did** return `CONFLICT_OF_INTEREST` the same day. This erratum harmonizes the two runs by applying the label retroactively rather than discarding the work.

## Effect

- The verdict (`PASS_WITH_LIMITATIONS`) and §1/§4 results are **owner confirmations**.
- They cannot gate a release, a stage, or the closure of any `FIXED_PENDING_VERIFY` item until a **non-author confirmation pass** returns `CONFIRMED`. Confirmation prompt: `docs/implementation/handoffs/MC-BE-ECHO-REVIEW-20261106-CONFIRMATION-PROMPT.md` (PREPARED_NOT_DISPATCHED; routing is the PO's call).
- Citing the review's delta results (9/11 REMEDIATED) in readiness gates is allowed only with attribution "owner-confirmed, pending non-author confirmation".

## Own-work note

All three code findings (BE-R1-01/02/03) target ZCode-authored surfaces and were self-identified — consistent with good faith, but not a substitute for independent review.

## Corrections

- BE-R1-03 exact path is `apps/backend/internal/adapter/inbound/productapi/data_server_test.go.orig` (report abbreviated the `internal/` prefix).
- A sibling leftover `apps/backend/docs/api.md.orig` (same hygiene class) exists and was **not** flagged by the review — left for a later hygiene intake, out of this disposition's scope.

## Dispositions executed (2026-11-06)

| Finding | Disposition |
|---|---|
| BE-R1-03 | DONE — `data_server_test.go.orig` removed (chore commit; sha in register §12) |
| BE-R1-01 (term-sheet deleted-count) | BACKLOG — next backend fix-wave, non-blocking |
| BE-R1-02 (OR-form keyset → row comparison) | BACKLOG — next backend fix-wave, non-blocking |
| BE-R1-04 (R2.Put 25MiB pointer) | CLOSED — handled at deploy layer by `38ae2458` (merged 2026-11-06); backend code unchanged |
| BE-R1-05 (Info) | Recorded for dispatch authoring: `/sql-queries` is a generator skill, not a review skill — drop from Pass B in future prompts |

## Follow-up evidence added after return

`evidence/govulncheck-followup.txt` — post-return govulncheck scan (the tool was NOT_RUN at review time). This file does not amend the sealed report; if it surfaces findings, they are new intake items, not report edits.

Nothing else in `report.md` or `evidence/` was modified.
