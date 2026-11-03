# MC-ZCODE-REMAINING-LOCAL-FEATURES-20261102

Owner: actual ZCode (this session; model account:zai-start-plan/GLM-5.3 via ZCode Desktop). Priority P1. Status IN_PROGRESS.
Prompt: `docs/implementation/handoffs/MC-ZCODE-REMAINING-LOCAL-FEATURES-20261102-PROMPT.md` (delivered to this session 2026-11-02; delivery activates the assignment).
Evidence namespace: `docs/testing/zcode-remaining-local-features-20261102-r1/`.

## Assignment parameters

- Root `/Users/nguyenvanlan/Documents/code/pet-projects/matter-control`, branch `codex/unified-project-flow`.
- Base HEAD `7bf198c103476f490ebbdf58b1bd563d0bba8a61` (verified at intake; matches prepared source HEAD).
- Untracked at intake (pre-existing, not mine): prompt, `remaining-features-audit-20261102.md`, `MC-REMAINING-FEATURES-20261102.md`. No staged/unstaged source changes. No competing writer on any path I touch.
- Runtime boundary honored: ports 3000/3109/8081/18084/18094/8080/55440/55441/55462 all closed at intake (verified 2026-11-02); retained stack NOT started; tests use only new task-owned fixtures.
- Contract `local-contract.md` verified at revision 13 (same as preparation); §8 Focus/Search included. D-BF1 unchanged.

## Scope (PO-approved 2026-11-02, do not re-ask)

RLF-01 Filing stale-transition fix · RLF-02 core preservation + contextual work composition · RLF-03 My Agenda `/me/agenda` + honest calendar coverage · RLF-04 private Saved Views (REQ-MC-P1-12) · RLF-05 versioned playbooks (publish/preview/apply, atomic idempotent) · RLF-06 Matter-scoped intake (record/triage/convert, atomic idempotent) · RLF-07 Matter-only versioned guidance · RLF-08 integrated acceptance.

Out of scope per §2: other P1 depth, exports, snapshots, connectors, Office, DOCX, reminders, LegalMemory/MCP, AI, voice, cloud/paid/provider actions, placeholder adapters.

## Execution log (append-only; UTC)

- 2026-11-02Z intake: repo/branch/HEAD verified; intake docs read (audit r1, task MC-REMAINING-FEATURES-20261102, contract rev13, RTK.md); ports closed; task record + evidence namespace created. Next: RLF-01 RED reproduction in filing-forms.tsx.

## RLF-REV rework (2026-11-03, PO instruction)

All 7 review findings fixed: B1 saved_views DELETE grant (Go profile + ops/adr006/db/b1-roles.sql + positive runtime probe); duplicate-name 409s (saved views create+update, playbooks) with wire/contract tests; GetIntake store-error propagation; guidance title parity (0016 UNIQUE amended in place — uncommitted, fixtures-only — plus typed 409 pre-check); localized delete/save/publish submit labels + per-row delete aria-labels (IntentForm.submitAriaLabel, additive); WorkContext criteria-null ("unavailable" instead of false absence) + test. Gates: make check EXIT=0 + pnpm check EXIT=0 (920/12) on fixture mc-rlf-review-pg-20261103 (stopped). Author-level only; delta re-review pending.
