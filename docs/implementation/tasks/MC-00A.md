# MC-00A — Canonical Product Context

- Task ID: MC-00A
- Status: BLOCKED
- Requirement references: REQ-S00A-001 through REQ-S00A-010; approved REQ-MC-P0/P1/P2 capability baseline
- Agent owner: Codex — Business Analyst, Product Requirements Owner, Project Manager
- Priority: P1 (delivery task priority; not product capability tier)
- Scope: ten requested product/requirements/rebaseline artifacts, source provenance, governance status and traceability updates
- Out of scope: code, solution architecture, high-fidelity UI, deployment, technical template audit and integration changes
- Dependencies: SRC-00A explicit authorization received; Document A and B unavailable, confirmed by PO
- Repository / worktree: matter-control governance repository, main
- Base commit / branch: 7a13894ee5f4aeedb203a4e4c7af97e9eff6cfdd / main
- Input artifacts: docs/ai-sdlc/step-00a-request.md; Step 00 operating model; PO answer “chưa có” about A/B
- Output artifacts: ten files mapped in docs/ai-sdlc/scope-rebaseline.md; governance updates; validation/review packet
- Acceptance criteria: AC-1 preserve identity/constraints; AC-2 read and reconcile A/B with precedence; AC-3 define 19 terms and five state axes; AC-4 preserve exact 19/14/7 capability lists and three workflows; AC-5 synthetic Atlas within requested counts and cases; AC-6 eight verified delta dimensions and open decisions; AC-7 truthful Step 01 readiness
- Test requirements: S00A-01 through S00A-07 structural/consistency checks; S00A-SOURCE and S00A-DOMAIN need originals; runtime tests not in scope
- Reviewer: OpenCode for independent consistency review when assigned; Human only for actual material trade-offs
- Required human approvals: direction/P0/Step 00A already approved via request; no blanket reapproval needed; OBD-01 requires missing sources, not approval
- Completion evidence: docs/testing/step-00a-validation.md; docs/reviews/step-00a-review.md; versioned documentation diff
- Blocker / next action / owner: PO supplies A/B or explicitly changes source/gate requirement; Codex then reads full sources and reconciles. Partial artifacts are prepared; no source consolidation claim
- Created / last updated: 2026-10-24, Asia/Ho_Chi_Minh
- Sender / receiver acknowledgement: PO supplied full Step 00A directive; Codex acknowledged and executed source-independent work

## Acceptance state

AC-1/3/4/5/7: author structural checks PASS (S00A-01..07); this does not establish domain reconciliation or runtime acceptance. AC-2 blocked; AC-6 partial (eight topics documented, comparison blocked). No DONE or full Step 01 readiness. Independent review not run.

## Status history

Original Step 00 proposal: WAITING_APPROVAL for a technical feasibility audit, never executed.
Current PO request supersedes that proposal and authorizes Canonical Product Context. Entered IN_PROGRESS for available inputs; after workspace inventory and PO confirmation of missing A/B, completed independent documentation work and recorded BLOCKED on remaining source-dependent consolidation.
