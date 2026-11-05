# MatterControl Product Requirements Document

Owner: Codex — Business Analyst / PM. Baseline: `20f12fe` + [Step 01 directive](../ai-sdlc/step-01-request.md). Status: **APPROVED_BY_PO**, 2026-10-24, subject `572835a`; [approval record](../ai-sdlc/step-01-approval.md). Detailed policy/permissions and acceptance protocol approved; numeric budgets remain deferred/pending validation. Independent reviews are separate from author checks.

## 1. Product Vision

[Vision](../product/product-vision.md): make operational truth understandable and actionable; reduce uncertainty without replacing legal judgment.

## 2. Core Positioning

**MatterControl — Control Plane for High-Stakes Legal Work**.

MatterControl gives legal and transaction teams a single operational view of matter state, dependencies, blockers, evidence, decisions, and change history.

**The System of Operational Truth for Complex Legal Matters.** Initial vertical: Transactions & Corporate Legal Work. Discovery remains closed.

## 3. Problem Statement

Working hypothesis grounded in approved context: scattered trackers, attachments and status updates obscure conditions, owners, dependencies, version authority and proof. A completed task or uploaded file can be mistaken for satisfied legal conditions; stale summaries conceal reopened blockers. This is product framing, not a newly conducted market study.

## 4. Target Users

[Product definition](../product/product-definition.md) distinguishes Transaction Owner, Contributor and Reviewer / Manager. Owners coordinate readiness/decisions; contributors execute assigned work; reviewers assess evidence/exceptions and communicate deltas. Persona does not grant authorization.

## 5. Jobs to Be Done

Seven exact JTBD and their BR/FR/UX/AC mapping live in [JTBD](../product/jtbd.md); no new discovery or renaming.

## 6. Value Proposition

One operational view of current matter state, blockers, next actions, dependencies, Waiting On, verified/missing evidence, decisions and history, with useful status updates. Dense execution tools make existing tracker migration and routine edits practical.

## 7. Product Principles

Condition ≠ work; criterion ≠ proof; completion ≠ verification; waiting ≠ dependency blockage. Explain computed states, preserve version/history, enforce confidentiality, and make changes accountable. Deterministic reports never invent legal facts. UX quality is comprehension and fewer errors.

## 8. Product Scope

[MVP scope](../product/mvp-scope.md) preserves the 20 P0, 14 P1 and 7 P2 boundaries and slice/alpha/full-MVP distinction. All three Golden Workflows are full-MVP targets. No feasibility-driven scope reduction is authorized.

## 9. MVP Capabilities

[SRS FR-001..020](srs.md) maps one stable functional contract to every REQ-MC-P0 entry, including separate states, typed requirements/actions, dependency/blocker logic, milestones, evidence, history, next/waiting/own work, Control Room/Grid/bulk, import/export, versions, filings, external parties, roles/ownership and delta brief. Full original labels remain in the [priority register](p0-p1-p2-priorities.md).

## 10. Golden Workflows

[Workflow acceptance](golden-workflow-acceptance.md) specifies actors, preconditions, paths/exceptions, states, proof, permissions, outputs/history and concrete end-to-end tests. A mock screen cannot satisfy a workflow.

## 11. User Journeys

[User journeys](../product/user-journeys.md) connects daily comprehension, accountable execution and proof/reporting to the three workflows; no high-fidelity design.

## 12. Business Requirements

| ID | Required business outcome | JTBD | Functional coverage | Acceptance |
|---|---|---|---|---|
| BR-001 | Members must distinguish execution, proof, dependency, time and attention with scope/as-of and source context | JTBD-01 | FR-009, FR-018, FR-020 | AC-109, AC-118, AC-120 |
| BR-002 | Owners must see causal unsatisfied prerequisites and milestone exposure, not unexplained red badges | JTBD-02 | FR-002, FR-005, FR-009 | AC-102, AC-105, AC-122, AC-141 |
| BR-003 | Contributors must identify assigned actionable work, waiting party and due/required proof with efficient dense editing | JTBD-03 | FR-003, FR-004, FR-010, FR-011, FR-012, FR-013, FR-017 | AC-103, AC-104, AC-110, AC-111, AC-112, AC-113, AC-117, AC-130, AC-144 |
| BR-004 | Dependency changes must preserve causal consistency through verification and reopen, reject cycles and unauthorized overrides | JTBD-04 | FR-005, FR-020 | AC-123, AC-124, AC-125, AC-139, AC-146 |
| BR-005 | Separate claimed execution from applicable criteria and accepted current proof, including filings and version/signature observations | JTBD-05 | FR-001, FR-006, FR-007, FR-015, FR-016 | AC-101, AC-106, AC-107, AC-115, AC-116, AC-121, AC-126, AC-127, AC-128, AC-129, AC-145, AC-159 |
| BR-006 | Retain attributable domain changes, previous document versions and corrections; restrict history access with matter scope | JTBD-06 | FR-008, FR-015 | AC-108, AC-128, AC-136, AC-149 |
| BR-007 | Generate authorized meaningful tables and deterministic delta drafts with baseline/as-of and outstanding work distinguished | JTBD-07 | FR-014, FR-019 | AC-114, AC-119, AC-138, AC-148 |

BR scope and specific RULE policies behind the FR/AC are approved under the recorded OBD decisions. Requirements are product behavior, not API endpoint or database entity lists.

## 13. UX Requirements

Control Room must answer: what is true now, what changed, what is blocked and why, what needs action/owner, Waiting On, missing evidence and next meaningful deadline/milestone. Grid must support 50–200 rows, inline edits, multi-select/bulk, filtering, Excel/CSV import, Excel export and keyboard navigation with explicit blocked/actionable distinction. My Actions, evidence review, document-version identity and filing visibility share contextual navigation without forcing repeated global searches.

Desktop-first; responsive secondary reading, review and simple updates rather than assumed full bulk parity. Visible dates/timezones, bilingual-ready labels, accessible focus/text status, loading/error/empty/permission states and draft preservation are required. AC-137/150/151/152/156 specify validation; OpenDesign owns detailed Step 03 design.

## 14. Success Criteria

All P0 and three end-to-end workflow contracts must pass with test evidence. Approximately 10-second manager comprehension is a target, not proven; sample/protocol threshold in AC-137 is PO-approved; execution remains NOT_RUN. Track task time/errors for dense work before asserting productivity gain. NFR/security/recovery budgets must be accepted and measured; no invented SLA, ROI or legal compliance guarantee.

## 15. Risks and Assumptions

[Open decisions](open-business-decisions.md) contains alternatives, risk, recommendation and approval status for all OBDs. Approved policy: proof authority/reversal, dependency/waiver/readiness, filing semantics, membership, document authority and reporting boundaries. Numeric retention/workload/RPO/RTO are explicitly deferred; other measurement/lifecycle gates remain downstream. Atlas is synthetic and has demonstration assumptions, not approved production policy. [Risk register](../ai-sdlc/risk-register.md) retains confidentiality, tool review and Go/Echo/PostgreSQL/Cloudflare Free Tier/$0 feasibility uncertainty. No real legal documents used.

## 16. Explicit Non-Goals and Approval Boundary

Not a generic task manager, legal-themed Jira, simple spreadsheet replacement, virtual data room, legal AI chatbot or generic workflow builder. No legal advice, automated payment/transfer/e-sign/e-filing promise. P1/P2 are not automatically P0. Step 01 creates requirements only; no solution schema/hosting architecture, UI, product code or deployment. Stop at Product Requirements Approval Gate; no automatic Step 02. [Architecture handoff](../architecture/solution-architecture-handoff.md) identifies approved requirements and deferred numeric/feasibility inputs.

Cross-JTBD end-to-end acceptance: AC-161 (GW-01), AC-162 (GW-02) and AC-163 (GW-03) integrate BR-001..007 / JTBD-01..07 across state comprehension, blockers, actions, proof, history and reporting. Full contract ownership is in the workflow rows of requirements-traceability.md.
