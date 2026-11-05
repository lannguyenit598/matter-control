# MatterControl Legal-Team Experience — Business Analysis

**Date:** 2026-10-29  
**Owner:** Business Analysis  
**Consumer:** Product Manager and Product Design  
**Status:** SOURCE_BACKED_RECOMMENDATION / NOT_USER_VALIDATED  
**Boundary:** This analysis clarifies the approved product intent and requirements. It does not change business policy, permissions, workflow semantics, or release status. Rendered, browser, and moderated-user validation remain unknown.

## 1. Clarified problem statement

MatterControl must help a legal team understand operational truth and decide the next safe action. The present experience is overwhelming when it exposes entity structure, all possible operations, all state details, and authoring controls at once. Users must reconstruct their job from the data model before they can act.

This is an information-priority problem, not primarily a visual-style problem. The approved product jobs are to understand current state, identify blockers, know the next action, track dependencies, prove completion, preserve history, and report progress. The default experience therefore needs to answer, in order:

1. **What needs my attention?**
2. **Why does it need attention?**
3. **What may I do next?**
4. **What proof, version, dependency, or decision constrains that action?**
5. **What changed after I acted?**

Entity inventories and full history support these questions; they are not the primary navigation model.

## 2. Confirmed users and their first information need

Personas describe jobs, not authorization. Every mutation and disclosure still follows active Workspace membership, explicit Matter membership, and the approved Matter role.

| Persona / operating mode | First question on arrival | Information needed first | Secondary detail |
|---|---|---|---|
| Transaction Owner | “Is this Matter ready, exposed, or blocked, and who must act?” | Critical blockers, milestone exposure, unresolved proof gaps, decisions required, accountable next owner, due/overdue items, meaningful recent changes | Complete dependency graph, full audit history, configuration and membership administration |
| Contributor | “What can I act on now, and what am I waiting for?” | Assigned actionable work, waiting/blocked separation, due date, required proof/version, blocker explanation, scoped quick action | Matter-wide records, historical proof decisions, bulk/import tooling when explicitly entered |
| Reviewer | “What exactly am I being asked to assess?” | Criterion, supplied evidence, exact document version, submitter, independence eligibility, expiry/dispute context, downstream impact | Earlier decisions and full evidence lineage |
| Manager / scoped viewer | “What is true now and what changed?” | Current state summary, changes versus baseline, outstanding work, blockers, decisions and provenance/as-of | Operational edit controls, raw event fields, administrative configuration |

The same person may operate in more than one persona, but the interface must only offer actions permitted by the caller's actual role and the record's current state.

## 3. Primary operating loop

The legal-team experience should use one consistent loop across the three approved Golden Workflows:

1. **Orient:** land on a prioritized work/attention view, not a create form or raw entity list.
2. **Understand:** see a human-readable Matter, record, accountable person, due context, state summary, and the reason the item is actionable, waiting, blocked, or exposed.
3. **Choose:** select the one permitted next action or open the upstream prerequisite/decision that prevents it.
4. **Act in context:** open a focused dialog or route with the exact criterion, version, dependency, party, and expected outcome retained.
5. **Confirm:** show confirmed success, refusal, stale conflict, retryable failure, or `OUTCOME_UNKNOWN` distinctly. Never imply completion or verification from a request being sent.
6. **Re-orient:** return to the prior filter/selection and show the updated row, causal downstream effect, and attributable history.

This loop applies to Transaction/Restructuring, Due Diligence, and Regulatory Filing. Their domain steps differ; their comprehension and action-entry structure should not.

## 4. Why the current pages become cognitively heavy

The approved requirements and the action-entry brief identify six compounding causes:

1. **Browse and author modes are mixed.** Permanent forms visually announce that data entry is the page's main purpose, before the user has understood current state.
2. **All capabilities receive equal weight.** Creation, transitions, proof operations, dependencies, metadata, exports, and exceptions compete with the record that the user came to understand.
3. **The model is presented before the job.** Workspaces, Matters, Requirements, Actions, Evidence, Documents, Filings, and IDs are necessary concepts, but users should enter through their goal and context rather than assemble a workflow from entity screens.
4. **Five state axes can become five status widgets.** The axes must remain independent, but the first view should explain their combined operational consequence instead of making users decode several badges without causality.
5. **Exceptional and owner-only actions are too visible.** Reopen, cancellation, correction, applicability, promotion, and membership changes should not compete with normal work.
6. **Provenance can overpower meaning.** Version, as-of, actor, reason, and source are essential for trust, but raw IDs, revisions, hashes, and event fields belong behind contextual details unless needed to decide or verify.

## 5. Recommended information hierarchy

### Level 1 — “My work and attention”

The post-login/default operating surface should prioritize:

- **Do now:** assigned Actions that are `NOT_STARTED` or `IN_PROGRESS` and dependency `READY`, ordered under RULE-021.
- **Waiting on:** `WAITING` work with the named party/reason and follow-up context.
- **Blocked:** causal unsatisfied prerequisite, upstream owner, and the safe navigation target; never an unexplained red badge.
- **Review:** proof awaiting an eligible independent reviewer, where the caller is authorized and not the submitter.
- **Decisions/attention:** role-appropriate owner decisions, critical milestone exposure, due-soon/overdue items, and disputes.

Each item should show a human label, Matter, accountable person, due context, concise reason, and one next action. Internal IDs are support details, never the primary label.

### Level 2 — Matter operational summary

The Matter landing view should answer:

- what is true now, with scope and as-of;
- what materially changed;
- what is blocked and why;
- what is waiting and on whom;
- what needs action or a decision;
- what evidence is missing, disputed, expired, or tied to the wrong/current version;
- what milestone or filing outcome is exposed.

The five axes remain visible as independent facts, but the dominant element is the **operational consequence and its cause**, for example: “Closing is blocked because signature proof for the current agreement version is still unverified.” A single composite “Matter status” must not replace the axes.

### Level 3 — Domain workspaces

Work, Planning, Documents, Filings, Proof, Data, and History remain available for focused execution and investigation. They should open in browse mode, preserve the user's filter/selection, and expose one clear primary action or no primary action when the caller has no legal mutation to perform.

### Level 4 — Evidence and audit drilldown

Exact record IDs, revisions, hashes, before/after fields, full causal references, previous document versions, and complete Event History should remain available through explicit details/history affordances. This information must be accessible for verification and support without occupying the default reading hierarchy.

## 6. Role- and state-based next-action model

The interface must select from existing authorized candidates; it must not invent work or change authoritative state.

| Current operational condition | First explanation | Next-action treatment |
|---|---|---|
| Assigned Action is actionable | Ready because its declared prerequisites are satisfied | Contributor/Owner sees the named action; Viewer sees state only |
| Action is `WAITING` | Name the external/internal party and follow-up context | Show follow-up when an explicit follow-up Action exists; otherwise show waiting context, not a fabricated action |
| Requirement/Action is `BLOCKED` | Name failed gate(s), upstream record, and gate type | Navigate to the upstream prerequisite if authorized; never offer force-ready |
| Execution is `COMPLETED` but proof is not verified | Explain that completion is a work claim, not accepted proof | Eligible submitter sees proof submission; eligible independent verifier sees review; other users see the gap |
| Evidence is disputed, rejected, withdrawn, or expired | Show criterion/version and why proof is non-satisfying | Offer only the policy-permitted submit/review/resolve operation for the caller |
| Filing is awaiting authority | Show stage, receipt/outcome evidence, external party, and elapsed/due context | “Record next step” only when a valid observation exists; receipt never becomes approval |
| An upstream item was reopened | Explain downstream exposure without erasing prior completion | Navigate to newly unsatisfied gates; preserve historical observations |
| Write result is `OUTCOME_UNKNOWN` | State that commit is unknown and identity is retained | Reconcile/read back; do not silently retry or mint a new operation |
| No authorized next action exists | Explain waiting, blocker, missing assignment, or read-only role | Show no disabled pseudo-action and no generic “Update” button |

## 7. What belongs in drilldown, not the first view

Defer the following until the user asks for context or starts a relevant action:

- internal IDs, revisions, correlation keys, hashes, and raw API/status values;
- complete Event History and unchanged historical versions;
- all possible transitions, especially cancel/reopen/correction/applicability operations;
- membership and verifier administration for non-owners;
- dependency editing when the user is only inspecting a blocker;
- full criteria definitions when a concise gap explanation is sufficient;
- import/export/bulk controls outside the dedicated Data operation entry;
- permanently mounted create/edit forms;
- raw provenance fields that are not needed for the current decision.

Do **not** defer the provenance required to make a safe decision: exact document version, criterion, submitter/reviewer identity, as-of, authority outcome reference, and blocker cause must remain adjacent to the relevant action or claim.

## 8. Normalized experience scope

### In scope for the redesign

- Job-first navigation and progressive disclosure for the approved P0 capabilities.
- A prioritized My Actions/attention entry surface and an operational Matter summary.
- Role/state-aware next actions using existing permission and transition rules.
- Browse-first pages with focused, explicit action entry.
- Human labels for people, Matters, work, documents, filings, parties, and prerequisites.
- Clear actionable/waiting/blocked/review/decision distinctions.
- Context preservation after navigation and confirmed mutation.
- Compact but truthful presentation of all five independent state axes.
- Contextual evidence provenance and full drilldown availability.

### Out of scope

- Reopening positioning, P0 scope, Golden Workflow policy, state semantics, or permission policy.
- Automated legal advice, legal-effectiveness decisions, e-filing, e-signature, payment, or external messaging.
- Inferring verification, readiness, severity, or next work from labels or AI-generated content.
- New workflow builders, cross-Matter dependency policy, document-level ACLs, or role taxonomy.
- Production claims, rendered acceptance, or usability success without actual validation.

### Deferred

- Global command palette, saved default create type, cross-Matter templates, and generalized batch creation.
- New role-specific personalization beyond approved current context.
- Large-selector thresholds and any route/modal breakpoint that needs rendered performance/accessibility evidence.

## 9. Implementation-ready acceptance criteria

1. An authorized user can identify the highest-priority role-appropriate next item, its Matter, why it is actionable/waiting/blocked, its accountable person, and due context without opening an edit form.
2. A Matter landing view states current truth, meaningful change, blocker cause, next owner/action, evidence gap, and next deadline/milestone without collapsing the five axes into one status.
3. Requirement and Action use distinct labels, creation choices, summaries, and outcomes everywhere; completing an Action never visually marks its Requirement verified.
4. `WAITING` and dependency `BLOCKED` are visually and textually distinct. A blocked item names the unsatisfied prerequisite; a waiting item names the waiting party/context.
5. OWNER-, EDITOR-, VIEWER-, designated-verifier-, and submitter-dependent controls follow the existing matrix. Unauthorized actions are absent; no disabled control implies a possible request.
6. Every list, picker, breadcrumb, header, and decision surface uses human-readable labels. IDs are available only through a support/details affordance.
7. Initial list/overview render contains no visible create/edit fields. Each permitted mutation starts from one explicitly named action and one focused intent surface.
8. Proof review always shows criterion, exact evidence/document version, submitter, verifier eligibility, current decision state, and downstream consequence before confirmation.
9. Success, refusal, stale conflict, unavailable/retryable failure, and `OUTCOME_UNKNOWN` are distinguishable. Unknown outcomes retain operation identity and direct the user to reconciliation rather than blind retry.
10. After confirmed success, the user returns to the prior list/filter/selection, can locate the changed row, and can inspect attributable history without a global search.
11. Viewer/manager reporting distinguishes changes in the selected window from outstanding work at as-of and exposes source/baseline provenance without showing unauthorized counts or records.
12. Moderated validation retains the approved target: at least 4 of 5 target legal managers identify the correct creation/next-action entry and explain Action versus Requirement within 10 seconds. This remains `NOT_RUN` until executed.

## 10. Dependencies, assumptions, and risks

- **Data completeness:** human labels, blocker explanations, eligible reviewer state, and role-aware candidates depend on backend read models returning authorized contextual data rather than IDs alone.
- **Policy authority:** the UI can recommend only candidates produced from approved rules; it cannot become the source of authoritative state.
- **Privacy:** aggregation must not leak inaccessible Matters, counts, names, parties, or document metadata.
- **Scale:** dense Grid work remains necessary for 50–200 rows, but it should be entered deliberately rather than dominate every page.
- **Evidence trust:** compact summaries must retain accessible source/version/as-of detail; hiding provenance completely would trade clutter for unsafe confidence.
- **Validation gap:** current conclusions are source-backed. Browser behavior, visual hierarchy, keyboard/focus behavior, screen-reader output, narrow-screen behavior, and target-user comprehension are not established.

## 11. Decisions for Product Manager / Product Design

These are design decisions within approved policy, not requests to reopen product scope:

1. Confirm the default post-login emphasis: recommended **My Actions/Attention first**, with Workspace/Matter selection as context rather than the primary job.
2. Define the compact visual grammar for the five axes so causality is dominant and no axis disappears.
3. Define page-specific action priority when multiple authorized actions exist; keep at most one primary action and place exception/destructive actions in contextual overflow.
4. Define a responsive disclosure pattern for provenance and history that keeps decision-critical version/as-of evidence visible.
5. Define the bounded-picker threshold at which a dialog becomes a dedicated route; engineering must verify real dataset behavior.

## 12. Engineering handoff recommendation

Product Design should translate this analysis plus the action-entry brief into a small set of connected compositions before broad visual polish:

1. My Actions/Attention landing state for Owner, Contributor, Reviewer, and Viewer.
2. Matter operational summary showing the same underlying Matter under each role.
3. One end-to-end Action flow: actionable → focused edit → confirmed readback/history.
4. One blocked flow with causal prerequisite navigation.
5. One proof flow separating submitter and designated independent verifier.
6. One filing flow preserving submission, receipt, authority wait, supplement, and outcome distinctions.

Use the three approved Golden Workflows as scenario content. Review the compositions first for semantic correctness and only then for visual refinement. Engineering should receive explicit screen states, role visibility, action predicates, human-label requirements, provenance disclosure, loading/empty/refusal/unknown states, and testable acceptance criteria.

## 13. Source basis

- `docs/product/canonical-product-context.md`
- `docs/product/product-definition.md`
- `docs/product/jtbd.md`
- `docs/product/user-journeys.md`
- `docs/product/three-golden-workflows.md`
- `docs/requirements/prd.md`
- `docs/requirements/business-rules.md`
- `docs/requirements/state-semantics.md`
- `docs/requirements/permission-matrix.md`
- `docs/requirements/golden-workflow-acceptance.md`
- `docs/design/action-entry-ux-20261029/product-brief.md`

No external product behavior is claimed in this report. Competitive research and rendered design assessment require their own sourced returns.
