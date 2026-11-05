# Codex isolated patches — R2 handoff to the current Claude session

Status: **SCOPED_IMPLEMENTATION_COMPLETE / SOURCE_REVIEW_PASS_WITH_LIMITATIONS / NOT_APPLIED_TO_LIVE_SOURCE**. This closes the assigned isolated patch preparation, not MC-P0, F02, product acceptance or release gates.

Actual implementers: Local Codex internal backend/FE workers; root Local Codex authored the narrow FE R2 review correction. Actual independent nonauthor reviewer: `/root/p0_final_patch_review_resume`. No external Claude/ZCode/OpenCode invocation is claimed by this packet.

## What is ready

| Lane | Delivered behavior | Checks actually evidenced |
|---|---|---|
| Backend, 7 files | Saved-scope authorization and full supported intent binding on bulk/import receipt replay; collision-safe fingerprints; malformed whole-import errors mapped to safe HTTP400; regression tests and API documentation | Genuine RED→GREEN; final focused race run across service/shared-memory/HTTP packages exit0. PostgreSQL/full make-check NOT_RUN |
| Frontend, 5 files | Exact preview invalidation, pending/edit locks, same-payload/key UNKNOWN recovery during mounted session, row outcome reconciliation, settled-preview consumption; R2 refuses mixed expected/unexpected receipts | Genuine RED→GREEN; **43 tests /4 files**, scoped strict typecheck/lint/format exit0. Full check/build/browser NOT_RUN |
| Independent review | Exact 7+5 R2 paths, before/after pins, owner regression evidence and compatibility limits | `review/return.md`: **PASS_SOURCE_REVIEW_WITH_LIMITATIONS**; reviewer execution NOT_RUN |

Current delivery: **`delivery-r2/manifest.json`**, SHA256 `d4e71ffc34e2a1fef5508d9d4bede2b5eef7e8836c0f9b998dedd0fe52d1219d`.

- `delivery-r2/backend/changes.patch`
- `delivery-r2/frontend/changes.patch`
- Exact source before/after files under each lane's `before/` and `after/` directories.
- `backend/return.md`, `frontend/return.md`, `frontend/verification-closeout.md`, `frontend/rework-r2-return.md` and raw evidence contain provenance and limits.
- `review/return.md` and `review/inputs.json` identify independent review evidence.
- `coordinator-integrity.json` and `coordinator-integrity-r2.json` identify baseline and delivered-byte verification at their respective checkpoints.

R1 `delivery/` is preserved for history; its FE response-normalization blocker was corrected in R2. Do not apply R1 or combine R1+R2 patches. R2 is a complete diff from the original immutable baseline, not an incremental patch requiring R1 first.

## Exact next action for Claude

Continue the existing full implementation session; no restart or new writer. Read this handoff, actual review verdict and R2 manifest. For every touched file compare the manifest's before hash with your current live bytes. If changed, merge only the reviewed still-applicable behavior manually and preserve your newer fixes; if already correct, record already-fixed with current evidence. Never replace an entire directory or reset to the snapshot. Integrate each change once.

After integration, run the relevant current tests and authorized full backend/native-product-PG-separated and FE gates against the stable integrated source. Record applied/already-fixed/conflicting hunks, current source hash and evidence in the same workboard/final return, retaining Codex authorship. The isolated packet's source verdict and test results do not automatically transfer to changed integrated bytes.

## Limits that remain open

- UNKNOWN attempt persistence across reload/tab close is not implemented here. This patch is in-session recovery only; F02 remains partially open. Durable recovery must preserve privacy and never generate a fresh mutation merely because the old identity was lost.
- Fingerprints intentionally change. Legacy receipts/registry rows are preserved, but old/new replay may conflict. Use authorized readback/receipt reconciliation; do not rewrite hashes silently or resend uncertain commands with new keys. Rollback has the same compatibility concern.
- PostgreSQL/full gates, live Cloud login/audience/identity mapping, browser/visual/accessibility/human trial and full recovery remain with the current main assignment and applicable reviewers.
- Brief temporal correctness, Filing/package policy, imported verification claim retention and R9 global alignment are outside these narrow patches and remain assigned to Claude.

Skipped: live source application, actual Cloud/private/resource/database/Git/deploy actions. Risk: concurrent Claude changes may supersede or conflict with isolated hunks; reconcile before integrating and keep remaining gates explicit.
