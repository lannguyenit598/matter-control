# MC-ZCODE-PM-BA-PHASE2-PLAN-20261030

- Owner: actual ZCode in the combined PM + Business Analyst role (AGENTS.md assigns PM/BA to Codex; ZCode acts at direct PO request, Codex intake). Prepared by actual Claude Code (Solution Architect), 2026-10-30. Status: **READY_NOT_DISPATCHED**.
- Priority: P1. "Phase 2" = Phase 2 / Tier A of `docs/implementation/plans/MC-LEGAL-PERSONA-FLOW-IMPROVEMENT-PLAN-20261030.md` (items A0–A7: ball-holder grouping, smarter import, current-version labels, readable brief/handover, matter access-scope display, cross-matter due/overdue view). Not Phase 2 of the cloud setup.
- Scope: documentation only — per-item BA specification (stories, Given/When/Then AC with negatives, invariants, impact class, permissions, states, tests, metrics), PM delivery plan (vertical slices, dependencies, sizing, RACI owners, entry/exit gates, validation plan, risks, PO decisions). No source/test/config/SQL edits; no edits to approved specs (deltas go in the namespace); no commit/push.
- Dependencies: Phase 0 results if present (`zcode-ba-flow-completeness-20261030-r1`, `uiux-lawyer-experience-audit-20261030-r1`, `zcode-deploy-readiness-finish-20261030-r1`); otherwise items marked `CONDITIONAL_ON_PHASE0`.
- Inputs / full prompt: `docs/implementation/handoffs/MC-ZCODE-PM-BA-PHASE2-PLAN-20261030-PROMPT.md`.
- Outputs: `docs/implementation/plans/phase2-tier-a-20261030/` (phase2-plan, requirements/A0..A7, traceability-delta.csv, spec-delta-proposals, task-backlog, user-validation-plan, risk-and-decision-log, source-manifest, return).
- Acceptance: each item has the 10-part spec; each verified as P0 or flagged `SCOPE_CHANGE_NEEDS_PO`; order, dependencies and entry/exit gates explicit; proposed tasks have owner and independent reviewer; source unchanged (hash).
- Reviewer: Local Codex intake; PO approves scope/trade-offs. Plan is PROPOSED, not validated with real users, not approval to implement.
- Completion evidence: none yet. Not DONE.
