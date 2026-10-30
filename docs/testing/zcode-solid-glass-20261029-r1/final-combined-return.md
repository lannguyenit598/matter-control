# Final combined return — MC-ZCODE system review THEN Solid Glass (one continuous assignment)

Actual identity: ZCode session (model account:zai-start-plan/GLM-5.3-Flash), 2026-10-29. Branch `codex/unified-project-flow`, HEAD `20feedbf06c859a9806055d609f5b132fe8bb086` throughout; nothing committed/pushed/merged/deployed; all dirty work, other writers' files and `leonx.me/matter-control` preserved. Two evidence boundaries kept separate and cross-linked:

- **Phase A audit packet (sealed)**: `docs/testing/zcode-system-multitenancy-review-20261029-r1/` — describes the PINNED pre-implementation candidate (763 files, SHA-256, rehashed at close: 0 drift) and stays immutable.
- **Phase B/C Solid Glass packet**: `docs/testing/zcode-solid-glass-20261029-r1/` — research/provenance, compatibility matrix, skill compliance, writer-handoff boundary, and this return. Plan: `docs/implementation/plans/MC-ZCODE-SOLID-GLASS-PLAN-20261029.md` (revision 1). Task: `docs/implementation/tasks/MC-ZCODE-SOLID-GLASS-20261029.md`.

## 1. Phase A verdicts (audit-before-change)

- **Tenant model**: identity = `(idp_issuer, idp_subject)` UNIQUE; tenant key in code/DB/API = **Workspace**; confidentiality sub-scope = explicit **Matter** membership (OWNER/EDITOR/VIEWER). One person may hold many workspaces; a workspace holds many matters. **No organization/customer entity exists.**
- **Multi-tenancy conclusion**: `SUPPORTED_WITH_LIMITS` at Workspace+Matter level (boundary holds end to end: central gate `execute`/`readSnapshot` re-resolves membership in-transaction; 9 negative-case classes re-executed fresh on an isolated copy with a fresh PG 18.6 fixture; backend 656 passed/0 failed/20 packages incl. contracts on memory+PG; frontend 88×3 pass). `NOT_SATISFIED` for organization-level SaaS tenancy (absent by design — not certified for multiple independent customer firms on one issuer).
- **RMV-F01..04 on corrected bytes**: F01/F02/F03 CORRECTED_SOURCE_CONFIRMED with fresh reviewer-run tests (HTTP/service/memory/PG, foreign-cursor probe); F04 CORRECTED_SOURCE_CONFIRMED at component level with rendered revocation NOT_RUN; timing-fix diagnosis re-exercised (3 clean repeats). Author evidence citations preserved verbatim (literal `pnpm check` not reported green; Mimosa-state files untouched; fixture-prose port erratum noted as benign).
- **Confirmed findings**: A-01 (P2, CONFIRMED on memory AND PostgreSQL — service-layer cross-matter receipt replay; HTTP URL-path fingerprint mitigates; probe + smallest fix + regression handed off), A-02 (P2 issuer-wide local people directory; flag default-false verified), A-03 (P2 decision-required — org tenancy absent), A-04 (P3 no RLS), A-05 (P3 review-schema minors), A-06 (browser/live-uptake NOT_RUN — retained API is not the corrected binary; handoff required). Ranked plan with owners: `remediation-plan.md`.
- **Limits**: source/local isolation results cannot certify production or multi-company readiness; authorship overlap declared (Review-Matrix correction = AUTHOR_REVIEW; the rest nonauthor, freshly tested).

## 2. Writer handoff, provenance, plan, implementation state

- **Writer handoff**: NOT ESTABLISHED. Exact overlapping files (globals.css, `(app)/layout.tsx`+shell, Button/Input/Select/Textarea/Badge, form-dialog, My Work routes, font setup) are actively owned by Local Codex under `MC-P0-CODEX-UI-FIDELITY-20261029` (task updated 2026-10-29 19:57, five same-day increments, receipts recorded). Per the assignment rules no edit was made to them; `writer-handoff-boundary.md` records the blocked set and the one-line unblock action.
- **Upstream provenance**: `deeplethe/solid-glass` pinned at `6e8903e494a15491ceda38fafea5056c95a74d44` (main, 2026-10-16), MIT, files hashed locally; six reference repositories recorded with licenses and one adopted practice each; Context7 gap handled by direct official-source research.
- **Saved plan**: complete (goal/non-goals, inventory, full token mapping incl. light/dark/fallbacks/forced-colors, component+button specs preserving the compact geometry and `.control-target` targets, ordered change list with rollback, pilot criteria, verification matrix, compliance refs). **Selected approach**: limited source-derived CSS/token adaptation in MatterControl's own token system (upstream's delete-variables instruction, `.dark` class activation, and 133 unmatched `data-slot` selectors rejected with reasons).
- **Implemented steps/routes/components**: NONE yet — deliberately. With the handoff absent, plan steps 1–5 (tokens → hooks → mapping → pilot → propagation) have not started; no file was touched that could collide with the active writer. This is the assignment's own boundary rule applied, not a stall: all independent work that does not require the blocked files is done.

## 3. Before/after visuals and measurements

NOT_RUN — requires the blocked shared-file edits plus a permitted browser path. The evidence directory reserves the capture protocol (matched viewport/zoom/theme/locale, 1440/1100/800/390/320px, light/dark, EN/VI, empty/populated/error, overlays, `getBoundingClientRect` measurements, contrast over composited glass, fallback via `@supports not (backdrop-filter…)`, perf spot check). No visual claim is made.

## 4. Current final source pins, tests, baseline failures, unresolved findings

- Final source state: identical to the Phase A pin (0 drifted files at close). The only new files are evidence/plan/task documents listed in `outputs-manifest.json` files.
- Tests executed by this session (fresh receipts): backend 656/0/20 (race, isolated copy, fresh PG fixture, incl. reviewer probes); frontend 88×3 (isolated copy). Cited-not-rerun: author's 640/707 full-suite receipts, Codex intake 313/42.
- Baseline failures known: literal `pnpm format:check` fails on two tool-owned Mimosa state files (environment artifact; source scope clean) — recorded, not "fixed" (tool state untouched).
- Unresolved: A-01..A-06 above; Solid Glass implementation steps 1–5; browser/operator journeys for BOTH packets (one checklist serves both after the runtime handoff).

## 5. Runtime/resource ownership, cleanup, next reviewer action

- Owned resources used and removed after label checks: `mc-review-verify`-style fixtures from this session's earlier rework (previously removed), audit PG `mc-zcode-audit-pg-20261029-r1` (label `MC-ZCODE-SYSTEM-MULTITENANCY-AUDIT`, port 51980, removed with volume; secrets dir removed; no password/port values in evidence). Retained on purpose: `/private/tmp/solid-glass-upstream-6e8903e/` (upstream provenance copy, 74KB) and `/private/tmp/mc-zcode-audit-20261029-r1/` (isolated review copy + GOCACHE; removable on request — manifest in the audit packet can rebuild it). Retained runtimes (API 3000, Next dev, IdP, PG) untouched and not used for any proof.
- **Next independent action**: 1) Codex/non-author intake of the audit packet; schedule A-01 into the next backend window; 2) runtime owner provides a disposable corrected-binary handoff → browser/operator checklist (serves both evidence boundaries); 3) PO or the Codex task owner records the frontend file handoff → this session executes plan steps 1–5 with the §8 matrix as the gate.

**Overall status: `IN_REVIEW_WITH_VERIFICATION_BLOCKERS`.** Phase A audit: COMPLETE (sealed). Phase B research/plan: COMPLETE. Phase C implementation: BLOCKED on an actual writer handoff (exact files named) — resumed immediately when provided. No AUTHOR_COMPLETE claim beyond the declared research/plan scope; no stage/commit/push/merge/deploy/paid/external transmission; no approval-hook bypass.

Skipped and residual risks: rendered/browser/a11y/screen-reader verification (both packets), live IdP/R2/runtime configuration review, production/multi-company certification (explicitly out of scope), A-01 fix (handed off, not applied here — self-fix would be self-review). Risks: the audit binds to pinned bytes and later implementation changes require the delta rereview; the people-directory and receipt-scope findings compound if multi-company deployment happens without the A-02/A-03 decisions; the timing-fix reliability is mechanism-explained, not universally proven.
