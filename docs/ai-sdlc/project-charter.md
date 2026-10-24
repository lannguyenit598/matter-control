# Project Charter

Date: 2026-10-24. Owner: Codex. Approver: Human Product Owner. Status: IN_REVIEW for this operating charter; product positioning already approved.

## Purpose

Deliver MatterControl under the [approved product baseline](../product/README.md), with evidence connecting every requirement to implementation, tests, review and release. Enable legal and transaction teams to see matter state, dependencies, blockers, evidence, decisions and change history.

## Step 00 scope

Establish the operating model, roles, observed agent capabilities, Git handoffs, task lifecycle, quality gates, risks, traceability and a Step 00A handoff. Bootstrap success is a complete, checked, reviewable documentation baseline with honest tool limitations.

Excluded: discovery, product features, final architecture selection, new integrations requiring permissions, production deployment and unapproved cost changes.

## Constraints and sources

- Backend source: [go-hexa-template](https://github.com/lannguyenit598/go-hexa-template).
- Frontend source: [nextjs-atomic-starter](https://github.com/lannguyenit598/nextjs-atomic-starter).
- UI/UX: OpenDesign.
- Deployment target: Cloudflare Free Tier.
- Infrastructure target: $0/month **within verified MVP workload**; verification has not occurred.
- Template reuse is intended; repository ownership, pinned source SHAs and deployment compatibility remain open for a separately scoped technical audit. Step 00A is product-context consolidation and excludes solution architecture. This governance repo does not replace or mutate either template.
- AI tool subscriptions/credits, domains and ancillary services must be separately disclosed; never silently exclude a required service to make a cost claim.

## Authority and success

Codex manages delivery, scope records and risk escalation. Human approves product scope, critical rules, architecture trade-offs, design, costs and production release. External agents own their listed disciplines; independent evidence is mandatory.

Detailed MVP success metrics and release dates are not set in this bootstrap. Codex will propose them after requirements and feasibility evidence; no invented delivery commitment.

## Milestones

| Milestone | Deliverable | Exit condition | Current state |
|---|---|---|---|
| M0 / Step 00 | Governance and capability baseline | Structural checks plus Human review | IN_REVIEW |
| M0A / Step 00A | Canonical Product Context under explicit PO instruction | Both briefs reconciled; baseline, workflows, dataset and Step 01 inputs documented | BLOCKED on missing A/B; partial artifacts prepared |
| M1 | Approved requirements and architecture/design | Relevant quality gates pass | Not scheduled |
| M2 | Implemented and verified MVP | Traceability, tests and independent review | Not scheduled |
| M3 | Approved release and observation | Human go/no-go and release evidence | Not scheduled |

Step 00A scope is now defined by the [Product Owner request](step-00a-request.md) and [rebaseline](scope-rebaseline.md), replacing the earlier unapproved technical-audit proposal. Product direction and all P0 capabilities are already approved; missing A/B source inputs do not reopen product discovery.
