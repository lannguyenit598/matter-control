# Decision Log

| ID | Date | Decision / proposal | Authority | Status | Evidence / consequence |
|---|---|---|---|---|---|
| DEC-001 | 2026-10-24 | MatterControl positioning and Transactions & Corporate vertical; discovery closed | Human | APPROVED_INPUT | [Original request](step-00-request.md), [baseline](../product/README.md) |
| DEC-002 | 2026-10-24 | Official team roles and Human approval areas | Human | APPROVED_INPUT | Original request; RACI translates the assignments |
| DEC-003 | 2026-10-24 | Use supplied Go/Next.js templates, OpenDesign, Cloudflare Free Tier; target $0/month for verified workload | Human | APPROVED_CONSTRAINT | Feasibility is unverified; no architecture/cost exception approved |
| DEC-004 | 2026-10-24 | Create a local governance Git repo and use structured Git handoff as current baseline | Codex, within Step 00 scope | IMPLEMENTED_WITHIN_SCOPE | Empty folder observed; task files and protocol created; no remote configured |
| DEC-005 | 2026-10-24 | Do not execute invalidly signed OpenDesign | Codex, verification boundary | HISTORICAL_BOUNDARY | Later user logs report valid signature and MCP registration; live readiness remains unverified |
| DEC-006 | 2026-10-24 | Use Step 00 operating model; old proposed Step 00A audit superseded | Human | ADOPTED_FOR_USE / PROPOSAL_SUPERSEDED | Explicit Step 00A directive; no inference that all Step 00 evidence passed independent review |
| DEC-007 | 2026-10-24 | Step 00A is Canonical Product Context, not technical audit | Human | APPROVED_INPUT | [Step 00A request](step-00a-request.md), [rebaseline](scope-rebaseline.md); no code/architecture/UI/deploy |
| DEC-008 | 2026-10-24 | Product direction and 19 P0 / 14 P1 / 7 P2 baseline approved; three workflows are MVP acceptance targets | Human | APPROVED_INPUT | [Capability register](../requirements/p0-p1-p2-priorities.md); no blanket reapproval needed |
| DEC-009 | 2026-10-24 | A/B full documents unavailable | Human confirms input fact | CONFIRMED_MISSING_INPUT | PO answer “chưa có”; do not reconstruct briefs or mark consolidated |
| DEC-010 | 2026-10-24 | Produce source-independent artifacts with explicit partial/assumption labels; retain source gate | Codex within scope | APPLIED_WITH_LIMITS | Canonical context partial; actual delta and JTBD reconciliation blocked; no waiver inferred |

APPROVED_INPUT is evidence from the supplied request, not an approval of all generated documents. Later decisions need context, options, consequences, approver and source/revision. Architecture ADRs will live under docs/architecture/ when assigned.
