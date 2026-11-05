# Claude implementation intake — 2026-10-28

Actual reviewer: Local Codex. Task `MC-P0-CLAUDE-PROGRESS-INTAKE-20261028`. Branch/head observed `codex/unified-project-flow` / `a62d838791ba188838c4ff00b7b6e265ac775056`. Read/hash/static and retained-log inspection only. No source modifications, test/build reruns, Cloud/private reads, DB/resource or Git mutations.

**Disposition: substantial implementation progress, with source corrections and integrated validation still required. Not full P0 acceptance.** The author label `IMPLEMENTED_WITH_VERIFICATION_BLOCKERS` must not imply only external blockers remain: the source defects below still need implementation work. This is a bounded intake, not exhaustive independent review of all product code.

## Verified progress and author evidence

Current Claude return records contract11 and `CKPT-CLAUDE-02-FINAL-CANDIDATE`, 701 source files at its recorded checkpoint. Contract hash matches the workboard. The evidence manifest's **63 retained payloads all match size/SHA256**. `inputs.json` pins26 selected source/docs inputs copied into a separate read-only snapshot, with zero capture drift. Source is uncommitted and may continue changing.

| Area | Evidence inspected | Interpretation |
|---|---|---|
| W6 import | Connected-group transaction/new-row references, registry/receipt logic, current shared tests and HTTP integration | Real code and broader test reach present; imported claim retention still missing below |
| F01/F02 | Dispute-precedence correction; expectedAssessmentId input/binding and shared/HTTP/FE test reach | Significant corrections exist; no blanket independent acceptance awarded |
| F03 | Mandatory package declaration for every filing, OWNER signature applicability fields, service/store/API/FE path and shared tests | Former missing-wiring finding superseded; actual signature/package semantics still subject to independent review |
| F04/F05 | Room records/titles are sourced from room payload; edit boundary separated; gate/reason presentation added | Substantive changes, rather than the old missing-code state. Remaining names/currentness and complete UX need full review |
| W7 workflows | `contract_gw.go` and12 retained memory/PG ledger artifacts including alternates | Replaces the old generic-Action/vacuous ledger; service/PG evidence, not UI E2E |
| Recovery | Expanded quiescent-boundary rehearsal,32 restored Matters vs33 source including post-boundary marker,3 actual object files, census/object/readback/restart/refusal artifacts | More substantial than original tiny seed; local rehearsal only, with oracle limits below |
| Cloud | Public input/configuration and author summary | Configured and negative/redirect smoke reported; human login/audience/A-B rights/refresh/logout remain unverified. No key contents were inspected |

Read backend final check log: `go mod tidy -diff`, lint0 issues, successful `go test -race` package output. The separate summary reports695 pass/4 skip; raw per-test JSON events are not included in the inspected63-file export, so this intake cannot independently recount695 or establish skip census from events. The four skip names are disclosed, including PG group-fault injection (memory-only), two env-gated tools and the helper's skip-without-env test. Do not claim zero skips.

Read FE final log: `pnpm check` shows **39 files /413 tests passed**, route type generation/lint/format/agent config complete. Production build log completes and lists product routes without demo dashboard/tasks. These are actual retained owner logs, not newly run reviewer checks.

## Findings still requiring work

### CL-01 / P1 — Brief does not reconstruct Filing execution changes

`apps/backend/internal/core/service/brief_replay.go:42–53,117–176` handles creation/generic snapshots and proof/dependency patches, but not `filing.stage_changed`, `filing.closed`, or `filing.reopened`. `filing_service.go:211–217,296–301,393–453` emits observation-only payloads while changing item execution through `commit`; `work_service.go:230–271` persists verification/dependency events without an execution snapshot for this path.

A Filing can reach SUBMISSION/WAITING, approved completion, negative closure/CANCELLED or reopen while the Brief remains at its creation execution, and cancelled filings can remain in outstanding. Adding the events to the change list does not reconstruct their state. Preserve command-owned replayable state and cover actual Filing service transitions at t2 on memory/PG. This remains a source-backed gap, not a new runtime reproduction.

### CL-02 / P1 — Expiry flag is not correct verification/dependency at t2

`brief_replay.go:23–28,158–191` tracks subject/verdict/until/closed and marks a whole subject expired for any unclosed accepted assessment. It does not model criterion identity/revision/mandatory status/alternatives/current proof epoch or recompute dependent readiness. The current return explicitly acknowledges that `proofExpired` does not recompute verification. The UI still prints verification/dependency next to that flag (`brief-section.tsx:144–156`).

This can show VERIFIED/READY after necessary proof expiry, or flag valid proof as expired when an alternative/current-epoch acceptance still satisfies it. RULE-007/016 require real state at the effective instant/t2; this is not merely an external test blocker or an optional new PO policy. Reconstruct enough inputs for approved domain evaluation, or refuse an unsupported reconstruction instead of returning plausible facts. Test expiry boundary, alternative/optional/old-epoch proof and downstream PROOF gates.

### CL-03 / P2 — Imported verification labels are still discarded

`dataops_service.go:480–556` parses known fields and hashes them but never reads the original verification label; `domain/matter/dataops.go:73–94` carries no original claim field. Thus `verification=VERIFIED` correctly does not grant VERIFIED, but its original claim is not retained or included in content identity. RULE-014 explicitly requires retaining it for review. Add typed non-authoritative claim/provenance through preview/persistence/readback and changed-content identity; tests must check retention, not only final UNVERIFIED. This was outside the narrow Codex patch and remains main-assignment work.

### CL-04 / P1 residual — UNKNOWN attempts do not survive reload/tab close

Current bulk/import hold file/payload/attempt keys in component `useState` (`bulk-section.tsx:76–86`, `import-section.tsx:34–42`). In-session locks/retries and R2 receipt normalization are present. Reload/unmount loses the identity needed to reconcile, so complete UNKNOWN recovery/F02 is not established. Use a privacy-appropriate receipt-backed recovery or approved scoped persistence design; do not silently persist raw files/tokens/protected matter data or mint a new key merely because the old state disappeared. No real browser reload test ran in this intake.

### CL-05 / implementation incomplete — R9, localization and history UI

The author explicitly reports W1–W5 R9 re-audit/visual work not done. Source still uses Geist/template palette and24px tracking-tight PageHeader (`app/layout.tsx`, `app/globals.css`, `components/molecules/page-header.tsx`) rather than selected R9 typography/tokens. `MatterHistory` renders only seq/type/recorded time and a “more exist” note without actionable paging (`features/matters/components/matter-history.tsx:15–42`); full provenance and navigation are not implemented there. NFR-010 is still NOT_STARTED/NOT_VERIFIED. These include missing source behavior, not only absent screenshots.

Complete the already-issued R9 FE alignment addendum and relevant localization/history acceptance, then obtain permitted rendered/keyboard/touch/a11y evidence. AC-137 remains a separate real-manager trial; do not substitute component tests.

### CL-06 / validation gap — Green logs precede latest live patch integration

Current source contains saved-scope receipt validation and exact R2 `reconcileOutcomes`/new seam test. Thus the earlier “not yet integrated” whole-file baseline comparison is historical; actual Claude source has moved. Many product files combine further changes and do not exactly match the isolated after-files, so independent R2 source review cannot automatically transfer to the integrated candidate.

Observed source mtimes for dataops service and intent helper are04:21/04:23 UTC, later than the03:56 FE check and03:58 checkpoint. No newer integrated gate receipts/disposition appeared in the inspected current workboard/export. Reconcile each R2 item against actual source and run affected/final gates once stable, recording new source hashes. This is an evidence gap, not a claim the new source fails.

### CL-07 / P2 — Restore runner can exit successfully with failed assertions

`ops/p0-local/restore-rehearsal/run.sh:98–99,107–123,155–174` records DIFFERENT/detection statuses and writes a summary, but has no final assertion requiring all acceptance predicates before exit0. The readback comparison checks only restored keys and accepts any source-only count matching the count difference, rather than binding exclusions to known post-boundary marker identities.

The retained run has positive census/object/readback artifacts; this finding does not negate those observations. It does mean future run exit0 is not an acceptance oracle. Add explicit final predicate checks/exit failure and bind expected post-boundary exclusions; test the checker with deliberately DIFFERENT census/readback/restart and failed detection fixtures without rerunning destructive recovery merely to test the parser.

## Coverage and provenance

Workboard now labels all20 FR implemented,63 AC entries break down into24 NOT_RUN,21 earlier service-only labels,15 service/PG/HTTP/FE labels, and3 special measured/blocked/recovery rows. Three GW rows are author-tested service/PG, not browser. Fourteen NFR rows are mixed partial/measured/review/blocked; no all-NFR PASS. These are owner labels; findings above can invalidate affected completion claims.

The contract11 footer/history says original revision10 cannot be recovered. A pinned revision10 input actually survives in Codex's immutable baseline:46,934 bytes, SHA256 `14fb18e302ffe2d71bfbfcbfbc50bf932d0e58e74abb9cbcab824503b2b5eb66`. This intake retained a byte-identical `retained-contract-rev10.md`. It is the exact revision10 pin Claude records as verified at intake; it does not establish every earlier revision10 variant. Correct “unrecoverable” wording without rewriting historical evidence.

## Next action

Keep actual Claude as implementation owner. Consume this intake in the same assignment, close remaining source defects and R9/localization/history gaps, finish R2 current-source disposition, then bind final checks to the stable new candidate. After that, review the integrated candidate independently; retain exact Cloud/browser/human/production gates. Do not reassign original completed tasks or restart W0.

Skipped: product execution, source fixes, secrets/Cloud/resources, full exhaustive review and Git actions. Risk: source is still moving; old green tests and isolated review cannot certify the latest integrated candidate or full P0.
