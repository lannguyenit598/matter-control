# MC-ZCODE-SOLID-GLASS-20261029

Owner: actual ZCode (combined assignment: system review → Solid Glass). Priority: P1 visual. Status: **IN_REVIEW (AUTHOR_VERIFICATION) — rendered evidence is fixture-level; authenticated product rendering NOT_RUN** (final candidate for nonauthor review; no DONE).

## Phase C completion record (2026-10-30)

Handoff receipt: `docs/testing/zcode-solid-glass-20261029-r1/handoff-receipt-20261030.md`. Plan revision 2 corrections applied. Implemented exactly per plan §6:

- `globals.css`: Solid Glass token block (light+dark) — `--panel`, `--popover` ladder, `--glass-rim/-edge/-shade/-popover-edge/-state-rim/-field-rim`, `--glass-blur`; pane finishes composed into the existing `--shadow-xs/sm/md/lg` stacks (zero component class changes); surface rules via `data-slot` hooks; `@supports not (backdrop-filter…)` opaque fallback; `@media (forced-colors: active)` reset. All pre-existing tokens, Be Vietnam Pro, compact geometry and legal-state colors unchanged.
- Explicit hooks (one line each): `data-slot="button|input|textarea|select-trigger|badge|card"` on the atoms; `data-slot="dialog-panel"` on the native `<dialog>` in the Dialog molecule (real DOM owner — no invented backdrop).
- Verification (all fresh receipts in `verification-record.md`): tsc 0; full `pnpm test` 78/707 pass (one intermediate run hit a KNOWN baseline flake in the untouched `action-entry` test — file passes alone ×2 and full suite passes on rerun; retained, not weakened); both production engines + CSS guard in private output (1 Turbopack / 2 Webpack assets); eslint + prettier clean; Storybook builds (its static-build RUNTIME is a pre-existing baseline failure across all stories — retained for the tooling owner).
- Rendered evidence: fixture-level (compiled production CSS over representative markup) — light/dark 1440px screenshots + computed-style receipts (dialog `backdrop-filter: blur(26px) saturate(1.5)`, rim/hairline/shadow stacks, card opaque face) + 320px no-overflow. One real fix found by measurement: hand-written `-webkit-` prefixes made lightningcss drop the standard `backdrop-filter` — corrected to standard-only and re-verified.
- NOT_RUN: authenticated product rendering (OWNER/EDITOR/VIEWER journeys, My Work live geometry, EN/VI in situ), screen-reader pass — need the runtime handoff + human-assisted login.

Requirements unchanged from above. Reviewer: a separate non-author (proposed next: Codex intake of this packet + rendered journeys after runtime handoff).

Requirements: reuse of the approved legal-team-experience concept (visual direction only; option 3, sha 88c32cee…); BR-001..007 unaffected; REQ traceability via the P0 UI tasks (P0-03/04/09/10/18/20) — no new approvals invented.

Scope (Phase C, authorized frontend-presentation-only): design tokens/styles in `globals.css`, explicit `data-slot` hooks on existing primitives, presentation-only caller changes, tests/stories, task/evidence docs. Out of scope: DB/SQL, backend/domain/API contracts, tenant policy, auth/session/draft/UNKNOWN/recovery behavior, new product features.

Dependencies/inputs: Phase A audit packet (`docs/testing/zcode-system-multitenancy-review-20261029-r1/`); upstream pin `deeplethe/solid-glass@6e8903e4…` (MIT); compatibility matrix + skill compliance (`docs/testing/zcode-solid-glass-20261029-r1/`); plan `docs/implementation/plans/MC-ZCODE-SOLID-GLASS-PLAN-20261029.md`; the existing Storybook + test toolchains.

Acceptance: plan §7 pilot criteria then §8 verification matrix; AUTHOR_VERIFICATION only — no independent acceptance, no MC-002/P0/release closure.

Current factual status:
- Phase B complete: upstream revision/license pinned and inspected; compatibility matrix written (14 mapped rows); approach selected (limited source-derived token adaptation); skill compliance recorded (4 skills, actual paths; 2 path-version errata).
- Implementation blocker (exact): `globals.css`, app shell/layout, `atoms/{button,input,select,textarea,badge}`, `organisms/form-dialog`, My Work routes and font setup are actively owned by Local Codex under `MC-P0-CODEX-UI-FIDELITY-20261029` (task file updated 2026-10-29 19:57; PO-assigned direct). No actual file/task handoff to this session exists. Per the combined assignment, shared-file edits wait; research/plan/prep complete.
- Nonoverlapping work done meanwhile: this task record, the plan, evidence namespace setup, and the sealed Phase A audit.
