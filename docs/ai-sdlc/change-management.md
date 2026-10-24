# Change Management

Codex owns change records. Product positioning is fixed by the approved brief; reopening it requires an explicit Product Owner instruction.

Before changing an accepted requirement/contract/design/cost/release plan, create CHG-XXX in this file (or a linked record) containing: requester, date, reason, baseline revision, affected REQ/task/test/ADR/design/release IDs, alternatives, scope/time/cost/security/data impact, recommendation, reviewer, Human decision where required and effective revision.

Workflow: PROPOSED → IMPACT_ASSESSED → WAITING_APPROVAL when required → APPROVED or REJECTED → IMPLEMENTED → VERIFIED. Keep the former baseline in Git. Update affected tasks and invalidate stale tests/reviews.

Human approval is required for product scope, critical rules, architecture trade-offs, design direction, infrastructure costs and production release. Routine documentation corrections within the authorized task can proceed with a diff and review; they do not need an invented approval step.

No changes to the approved product baseline were made in Step 00.

## CHG-001 — Explicit Step 00A scope rebaseline

Requester/authority: Product Owner, 2026-10-24. Baseline: initial governance at 7a13894. Input: step-00a-request.md. Status: AUTHORIZED_SCOPE_APPLIED; historical source gate at b5224ce superseded by CHG-002.

The PO-defined Canonical Product Context replaces Codex's unapproved technical-audit proposal for Step 00A. Adds approved P0/P1/P2 and three workflow targets; preserves identity, vertical, template and infrastructure constraints. Impact: MC-00A, charter, instructions, status, requirement traceability and new product artifacts. No runtime/data migration/cost change.

No additional approval needed for this direct instruction. The historical A/B gate recorded in DEC-009 / OBD-01 is corrected by CHG-002 / DEC-011. Detailed mapping and stop conditions: [scope-rebaseline](scope-rebaseline.md).

Incident hotfixes still require scoped evidence, independent review and the applicable release decision. A chat agreement must be transcribed into a decision record with actor, date and source; do not fabricate approval.

## CHG-002 — Prompt-based context validation and closure

Requester/authority: Product Owner, 2026-10-24. Baseline: b5224ce. Input: [Step 00A.1](step-00a1-request.md). Status: AUTHORIZED_CORRECTION_APPLIED; author checks recorded, independent review Pending.

Reason: originals A/B were never in the initially empty repository/workspace; approved prompts provide valid product context. Apply explicit seven JTBD and refined P0/P1/P2 coverage, add state-axis capability trace, clarify inline editing/ownership and correct source/status gates. Keep existing capability IDs and eight delta axes; no P1/P2 promotion. Alternative of requiring original import rejected by the PO directive; optional archival remains available.

Affected: REQ-S00A-001..010, REQ-MC capability labels/coverage, MC-00A, S00A1 validation, REV-00A, governance/source records; no ADR/design/release changes. Scope/time impact: documentation correction only, no implementation schedule promised. No runtime, data, security-boundary, infrastructure or cost changes. Roles remain unchanged. Reviewer: OpenCode when assigned; independent review not performed. Effective revision: local commit containing this CHG-002 and validation report; prior evidence retained in Git and the historical validation section.

## CHG-003 — Step 01 requirements and policy proposals

Requester/authority: PO, 2026-10-24; baseline 20f12fe; source step-01-request.md. Status: DOCUMENTATION_AUTHORIZED; detailed policy WAITING_PO_APPROVAL. Alternatives and consequences are in OBD-02..11, not silently chosen by implementation. Added PRD/SRS, product outcomes/journeys/scope, rules/states, stories/AC, permissions, workflow specs and conditional Claude handoff; stable parent IDs preserved. New AC-101..163 avoids Atlas Action IDs and task-local AC IDs. No P1/P2 promotion, architecture, migration, runtime/data or cost changes. Task MC-001, reviews REV-00A/REV-01 and validation S01 linked. Effective revision: local Step 01 commit; approved rules require later recorded PO decisions. Timing/cost commitments not invented.
