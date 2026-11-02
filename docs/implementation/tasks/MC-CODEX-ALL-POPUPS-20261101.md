# MC-CODEX-ALL-POPUPS-20261101

Owner: Actual Local Codex. Priority: P1 UI quality. Status: IN_REVIEW_WITH_VERIFICATION_BLOCKERS.
Requirement: PO request “kiểm tra với tất cả popup”; shared dialog corner defect scope of MC-CODEX-DIALOG-CORNERS-20261101.
Inputs: current source/runtime at HEAD 978d8fc, shared corner correction, existing synthetic B session and QA fixtures. Scope: inventory every shared popup/callsite, open available non-mutating UI, inspect corners/overflow/focus, record blocked conditional forms. Dependencies: local frontend/API and official browser access.
Allowed writes: this task record and docs/testing/codex-all-popups-20261101-r1 only. No application/source/business writes.
Outputs/evidence: docs/testing/codex-all-popups-20261101-r1/return.md, coverage.json, source-inventory.json, browser-cases.json, AX/PNG captures and manifest.
Acceptance: all source callsites enumerated; 37/37 source hashes stable; 22/22 observed dialogs clean; 14/23 business callsites opened, 9 honestly source-only; fixture error surfaced. Tests: rendered browser checks only, no new source delta/full suite. Reviewer: independent reviewer not yet assigned; no self-awarded DONE.
Skipped/risk: conditional forms/confirmation fixture require follow-up, physical device and screen-reader checks not run.
