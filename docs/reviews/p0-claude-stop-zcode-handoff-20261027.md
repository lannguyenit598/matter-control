# Claude stopped — current ZCode continuation intake

Date 2026-10-27, Asia/Ho_Chi_Minh. Task MC-P0-ZCODE-RESUME-AFTER-CLAUDE-STOP; actual Local Codex preparation, priority P0. **Product remains PARTIAL_IMPLEMENTATION.** The PO supplied Claude's explicit stopped return and requests actual ZCode to continue both stacks. This replaces the older W3-resume handoff; no implementation was dispatched by writing this summary.

Root `/Users/nguyenvanlan/Documents/code/pet-projects/matter-control`; branch `codex/unified-project-flow`; HEAD `a62d838791ba188838c4ff00b7b6e265ac775056`. The source is uncommitted. Fresh [inventory.json](../testing/p0-claude-stop-zcode-handoff-20261027/inventory.json) pins **665 public app source/config/doc entries**, aggregate SHA-256 `c6821c3cf3d58fe9dbc8ba510711445f00d10bce5c1b064e373051f0af14e6d7`. Compared with the 472-entry Claude acknowledgement snapshot: 29 modified/193 added/zero missing. Generated/dependency/private paths are excluded by the recorded method; an inherited selected TypeScript cache is not authored feature code.

The original supplied stop report is preserved byte-for-byte as [claude-stop-return.txt](../testing/p0-claude-stop-zcode-handoff-20261027/claude-stop-return.txt), SHA-256 `1663018d262fd2edd6eaf536cb388905dd5f4df715ebc6da0c643c2566f83290`. It is author evidence, not an independent execution certificate. Current inputs are in `input-pins.json` in that directory.

## Current source and author-reported progress

| Wave | Present / author-reported | Still not established |
|---|---|---|
| W1 | PG stores, verifier, product API/composition, BFF/OIDC sessions, Workspace/Matter/Requirement FE; CW1-F01..03 repairs | Real human login/session integration and independent final acceptance |
| W2 | Work graph/domain transitions/AND gates/cycles/milestones/parties/derived reads; Grid/detail/planning/My Actions FE | Browser/keyboard/touch/visual/real-session E2E |
| W3 | Evidence/document service and PG/object adapters, migration 0003, immutable versions/guarded promotion/criteria/claims/independent review/disputes, Proof card, Documents UI and streamed upload/download | Browser/E2E; object-store malware/retention/encryption policy/evidence; some promotion UI polish |
| W4 | Filing service/model, migration 0004, stage/cycles/submissions/observations/reopen/correction, shared memory/PG tests and filing list/detail/forms | Signature-stage waiting coupling and grid integration are author-listed gaps, plus browser/E2E |
| W5 | Single-snapshot Control Room/context service, migration 0005, Decision/Finding/Risk/Entity records, FE Control Room/context forms, shared memory/PG tests | AC-137 real users, browser/mobile/keyboard/visual; author notes no as-of selector |
| W6 | `port/sheet.go`, `adapter/outbound/sheet/{codec,codec_test}.go`: stdlib CSV/XLSX codec | Bulk/import/export/brief domain/service/API/FE are not complete; W6 contract/checkpoint not written |
| W7 | Not completed | Original three Golden Workflow ledgers, final security/regression/restart/load/isolated restore and full handover; old template routes and product API docs remain |

Named source paths and product routes were checked, including `features/proof`, `features/filings`, `features/control`, document/filing/Control Room pages and migrations 0001..0005. This is source presence, not a full W1–W5 code audit.

Current **contract revision 9**, 41,389 B, SHA-256 `06b4c929cc9d7762f3acfc61950ccb691cf84488a9debdba20e1b98005cb3aaa`, covers W1–W5 (§2.1–2.6). Workboard latest session records W5 and W6 next. Its W6 NOT_STARTED label and the return's “W6–W7 not started” omit the fresh codec progress; ZCode must reconcile, not discard those files. Some historical design-input statements still predate R9 consumption.

## Checks and provenance

Claude reports the last W1–W5 gates as `make check` exit 0 with PG fixtures/race and no lint issues, `pnpm check` 34 files/361 tests and `pnpm build` exit 0; after the sheet addition only its package tests were run. These remain author-reported here.

Local Codex freshly ran:

- `go build ./...`: exit 0 on the current backend.
- `go test -race -count=1 -json ./internal/adapter/outbound/sheet`: **4 pass, 0 fail, 0 skip**, exit 0. This is the codec's synthetic unit suite, not end-to-end import/export acceptance or exhaustive spreadsheet security proof.

Exact argv/cwd/UTC/exits/raw stdout/stderr are retained in [the new evidence directory](../testing/p0-claude-stop-zcode-handoff-20261027/). DB environment variables were removed. No real DB/IdP/browser/resource/private data was accessed. The 226 Go/325 frontend results in the older handoff belong to an older snapshot and must not be called current W1–W5 results.

## Required semantic guardrails for W6

1. **Brief:** RULE-016/FR-019 and AC-138 require chosen `(t1,t2]` changes separately from outstanding at t2. Claude's proposed current-t2-only restriction is not PO-approved. P0 does not require managed issued-report archival/retrieval, but that distinction does not automatically remove as-of/window semantics. Implement a compatible temporal/source-revision solution or raise one concrete scoped feasibility decision with the affected requirements; do not silently narrow scope or reconstruct historical facts from current state. Continue independent W6 work while a decision is pending.
2. **Bulk:** row CAS is a lost-update guard, not proof of an earlier attempt's outcome. No automatic resend, success or rollback inference after an ambiguous response. Preserve per-row atomic mutation+audit and distinct success/failure/UNKNOWN, skip proven successes on recovery, recheck current rights and reconcile before retry. The author's no-receipt idea is provisional; choose and document an operation-specific technical recovery contract that meets approved semantics.
3. **Import:** RULE-014/AC-132 source identity + row key + content must prevent duplicate records/events on identical retry; changed content conflicts; connected invalid groups reject as a whole while valid independent groups may succeed. Imported VERIFIED is a claim awaiting review, never an authoritative verification grant.

## Design and continuation

Final R9 is ready as reconciled implementation input, not visual acceptance. Its return/manifest pins remain in `input-pins.json`; the full [R9 consumer addendum](../implementation/handoffs/MC-P0-CLAUDE-CONSUME-DESIGN-R9-ADDENDUM.md) is mandatory for the new ZCode owner despite its legacy Claude filename. It preserves scoped draft/intent cleanup, target/current promotion, error semantics and continued long BE+FE execution. Current contract rev 9 supersedes the addendum's old rev-6 observation; keep validated semantics rather than roll back wire/source.

A design checker still globally forbids 409; product contract uses domain refusals 409 while missing/stale CAS remains 428/412. Keep the documented gap separate, do not delete product 409 or alter pinned design evidence just to make that checker green.

Next action: actual ZCode acknowledges the current source/owner in the existing workboard, establishes a baseline including the codec, consumes R9 and completes W6, repairs requirements-relevant W1–W5 gaps, then completes W7 across BE/API/FE. No W0/reimport, no per-wave independent-review stop and no second workboard. The [new STOP handoff prompt](../implementation/handoffs/MC-P0-ZCODE-RESUME-AFTER-CLAUDE-STOP-PROMPT.md) supersedes the older partial-W3 prompt for execution.

Unchanged blockers: ZITADEL effective redirect config/admin boundary, actual user-token audience, real-session UI→API→PG, browser/a11y/human study. Object security/lifecycle, production hosting/Cloudflare/$0/recovery and Mimosa commit acceptance are not proved. Owner transfer grants no bootstrap/admin-secret or unrelated-resource access. Exact task-owned resources must be checked before reuse; do not rerun provisioning or delete volumes.

Skipped: product implementation, comprehensive W1–W5 review, full `make check`/PG/frontend/build/E2E reruns, lifecycle/private actions, Git changes and actual ZCode invocation. Remaining risk: W6/W7 are unfinished and the temporal/recovery proposals need requirements reconciliation; quota transfer does not close any acceptance gate.
