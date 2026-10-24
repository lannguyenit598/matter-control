# Change Management

Codex owns change records. Product positioning is fixed by the approved brief; reopening it requires an explicit Product Owner instruction.

Before changing an accepted requirement/contract/design/cost/release plan, create CHG-XXX in this file (or a linked record) containing: requester, date, reason, baseline revision, affected REQ/task/test/ADR/design/release IDs, alternatives, scope/time/cost/security/data impact, recommendation, reviewer, Human decision where required and effective revision.

Workflow: PROPOSED → IMPACT_ASSESSED → WAITING_APPROVAL when required → APPROVED or REJECTED → IMPLEMENTED → VERIFIED. Keep the former baseline in Git. Update affected tasks and invalidate stale tests/reviews.

Human approval is required for product scope, critical rules, architecture trade-offs, design direction, infrastructure costs and production release. Routine documentation corrections within the authorized task can proceed with a diff and review; they do not need an invented approval step.

No changes to the approved product baseline were made in Step 00.

## CHG-001 — Explicit Step 00A scope rebaseline

Requester/authority: Product Owner, 2026-10-24. Baseline: initial governance at 7a13894. Input: step-00a-request.md. Status: AUTHORIZED_SCOPE_APPLIED; source consolidation remains BLOCKED.

The PO-defined Canonical Product Context replaces Codex's unapproved technical-audit proposal for Step 00A. Adds approved P0/P1/P2 and three workflow targets; preserves identity, vertical, template and infrastructure constraints. Impact: MC-00A, charter, instructions, status, requirement traceability and new product artifacts. No runtime/data migration/cost change.

No additional approval needed for this direct instruction. Missing A/B are recorded in DEC-009 / OBD-01; no source gate waived. Detailed mapping and stop conditions: [scope-rebaseline](scope-rebaseline.md).

Incident hotfixes still require scoped evidence, independent review and the applicable release decision. A chat agreement must be transcribed into a decision record with actor, date and source; do not fabricate approval.
