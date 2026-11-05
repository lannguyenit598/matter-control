# MatterControl Legal-Team Experience — Product Design Brief

**Date:** 2026-10-29  
**Owner:** Product Management  
**Consumers:** Product Design, Solution Architecture, frontend/backend engineering, independent QA  
**Status:** RECOMMENDED_PRODUCT_DIRECTION / READY_FOR_PRODUCT_DESIGN / NOT_RENDERED / NOT_USER_VALIDATED  
**Evidence:** approved MatterControl requirements, source-backed business analysis, public primary-source platform research, and current source-contract inspection  
**Boundary:** This brief changes information priority and interaction entry, not approved business rules, permissions, five-axis semantics, Requirement-versus-Action meaning, or release gates.

## 1. Product decision

MatterControl should operate as an **action-oriented legal control plane**, not a module catalogue, entity dashboard, or wall of forms.

The default experience must support one repeated legal-team loop:

> **See what needs attention → understand why → take the next safe action → confirm the actual result → return to the updated operational picture.**

Use a two-level experience:

1. **My Work** is the personal, cross-Matter triage surface: “What requires my attention now?”
2. **Matter Overview** is the shared operational brief: “What is true in this Matter, what is exposed, and what happens next?”

They must not duplicate each other. My Work selects the user's next context; Matter Overview explains the Matter and supports coordinated execution inside that context.

The recommended model preserves MatterControl's differentiators:

- Requirement remains distinct from Action.
- Completion remains distinct from verification.
- Execution, verification, dependency, timing, and attention remain independent state axes.
- Next actions come from approved rules, current state, assignment, and permission—not AI-generated legal advice.
- Evidence, exact versions, causality, actor, and as-of remain available wherever they change a decision.

## 2. User problem and success definition

### Current problem

The interface makes legal professionals reconstruct their job from the system's data model. Entity navigation, state details, actions, exceptional controls, provenance, and authoring forms compete at the same visual level. This creates three early breaks in the operating loop:

- **Orient:** users enter through Workspaces or modules rather than their current legal work.
- **Recognize:** they see many valid facts but cannot distinguish consequence from supporting detail.
- **Continue:** after reading a screen, they cannot confidently say what should happen next.

This is primarily an information-priority and workflow problem. Styling alone will not fix it.

### Intended users

Personas guide presentation; they do not create new permissions.

| Operating mode | First question | First information needed |
|---|---|---|
| Matter owner / transaction lead | Is the Matter ready, exposed, or blocked, and who must act? | Critical blockers, evidence gaps, decisions, milestone exposure, next owner |
| Contributor | What can I do now, and what am I waiting for? | Assigned ready work, waiting versus blocked cause, due context, required proof |
| Independent reviewer | What exactly am I assessing? | Criterion, exact evidence/document version, submitter, eligibility, dispute/expiry context |
| Legal manager / scoped viewer | What is true now and what materially changed? | Operational brief, exceptions, changes, provenance/as-of, no unauthorized detail |

### Product success

The redesign succeeds when an intended user can, without learning the product's entity architecture:

1. identify what requires attention;
2. explain why it requires attention;
3. predict the consequence of the primary action;
4. distinguish waiting, blocked, completed, and verified states;
5. understand what actually changed after acting.

The existing moderated target remains the acceptance signal: at least 4 of 5 target legal managers identify the correct creation/next-action entry and explain Action versus Requirement within 10 seconds. It remains `NOT_RUN` until tested with a rendered candidate.

## 3. Recommended end-to-end operating model

```text
Sign in
  -> My Work
     -> select actionable / waiting / blocked item
        -> Matter Overview or focused record context
           -> understand current truth and cause
              -> invoke one permitted next action
                 -> focused dialog or dedicated route
                    -> pending / success / refusal / conflict / unknown
                       -> read back actual result
                          -> return to prior context with change visible
```

### Step 1 — Orient in My Work

Lead with the user's assigned operational work, ordered by the authoritative backend rule. Do not begin with Workspace inventory, counts, charts, or creation fields.

### Step 2 — Understand the item

Each row explains the human-readable Matter, work title, due context, accountable person, state class, and concise reason. Waiting and blocked are separate because they require different responses.

### Step 3 — Enter Matter context

Opening an item preserves the originating filter and selection. Matter Overview explains the operational situation before exposing complete documents, proofs, history, administration, or every possible transition.

### Step 4 — Act with one intent

The primary action is named for the legal operation: `Submit evidence`, `Review evidence`, `Record receipt`, or `Resolve blocker`, not generic `Update` or `Continue`. Short single-intent actions use a focused dialog; multi-step, file-based, or high-consequence work uses a stable route.

### Step 5 — Confirm truthfully

The interface distinguishes pending, confirmed success, validation refusal, permission denial, stale conflict, retryable unavailability, partial result, and `OUTCOME_UNKNOWN`. A sent request is never presented as a completed legal outcome.

### Step 6 — Re-orient

After confirmed success, return to the previous list/filter/selection, identify the changed row, explain any downstream effect, and retain attributable history.

## 4. Surface responsibilities

### 4.1 My Work — personal triage, not a dashboard

**Purpose:** answer “What should I handle now?” across authorized Matters.

**Minimal default content:**

1. page title, one-line orientation, and data `as-of`/refresh state;
2. **Next actions** — existing `next` candidates, in backend `RULE-021` order;
3. **Waiting** — named waiting condition/party where available;
4. **Blocked** — failed prerequisite and safe upstream navigation where authorized;
5. **Historical** — collapsed by default, for recently completed/cancelled assigned work.

Each visible row contains only:

- work title and kind (`Action` or `Requirement`);
- human-readable Matter name;
- concise reason for its current classification;
- due/timing context;
- accountable person or waiting party when authorized;
- one primary row action or a clear no-action explanation.

**Current contract constraint:** the current My Actions contract exposes `next`, `waiting`, `blocked`, and `historical`, with `matterId`, `reason`, work item, derived state, and revision data. It does not provide a cross-Matter proof-review queue, decision inbox, or resolved Matter title in the assigned-item schema. Therefore:

- do not fabricate `Review` or `Decisions` sections in the frontend;
- do not issue per-row ad hoc requests that leak or produce an N+1 loading experience;
- add human Matter labels and any future review/decision queues through authorized backend read-model extensions;
- retain backend ordering rather than re-ranking with client-side AI or guessed urgency.

### 4.2 Matters — find context

**Purpose:** find an authorized Matter when the user is not entering from assigned work.

Default columns:

- Matter name;
- type/classification already approved for disclosure;
- primary client/counterparty label where permitted;
- responsible legal owner;
- next due item;
- concise attention reason;
- last meaningful change.

Search and filters update the results region without full-page reload. Internal IDs, revisions, counts, and secondary axes belong in optional columns or details.

### 4.3 Matter Overview — shared operational brief

**Purpose:** answer the team's six operational questions:

1. What Matter is this and who owns it?
2. What is true now, at what as-of?
3. What materially changed?
4. What is blocked or waiting, and why?
5. What is the next permitted action and who owns it?
6. What evidence gap, decision, filing outcome, or critical date creates exposure?

**Minimal default content:**

- human Matter identity, owner, scope, and as-of;
- one short operational brief;
- one primary next action with its reason/evidence;
- top blockers and waiting conditions with causal links;
- next critical milestone/date;
- recent material changes.

The five state axes remain independently inspectable, but the first view leads with operational consequence and causality. Do not replace them with one composite progress percentage or generic status.

### 4.4 Focused domain areas

Use progressive disclosure after the overview:

- **Work** — Actions and Requirements, separately labeled;
- **Evidence** — proof criteria, supplied evidence, verifier context, exact versions;
- **Documents** — document identity, current/superseded versions;
- **Filings** — stage, submission, receipt, authority wait, supplement/response, outcome;
- **Planning** — milestones, workstreams, parties, dependencies;
- **History / Data / Administration** — deliberate secondary destinations.

Do not reproduce Actionstep's many peer tabs. Product Design may group related destinations in local navigation or a `More` disclosure without changing route or API semantics. High-frequency domain work must remain directly discoverable.

### 4.5 Audit and support drilldown

Record IDs, revisions, hashes, correlation keys, raw before/after fields, complete history, and superseded material remain available under explicit `Details`, `History`, or support affordances. They are not default labels or picker values.

Decision-critical provenance is not hidden: exact document/evidence version, criterion, submitter/reviewer identity, authority outcome reference, blocker cause, and as-of stay adjacent to the claim or action they govern.

## 5. Primary next-action contract

Every promoted next action must have a system-backed explanation. The UI consumes authoritative candidates; it does not determine legal readiness.

| Field | Required meaning |
|---|---|
| Human action label | Specific legal operation, not generic `Update` |
| Target | Human-readable Matter and record title/kind |
| Why now | State/rule-derived reason in plain language |
| Authority | Caller is permitted under existing role and record rules |
| Evidence/context | Criterion, exact version, prerequisite, waiting party, or filing observation needed to decide safely |
| Timing | Due/as-of context when applicable |
| Consequence | What object is expected to change; no guarantee before confirmed readback |
| Recovery | What happens for refusal, conflict, unavailability, partial, or unknown outcome |

Examples of truthful treatments:

- `COMPLETED + UNVERIFIED`: “Work is recorded complete; proof is not yet accepted.” Submitter and eligible reviewer see different permitted actions.
- `WAITING`: name the party/condition; offer follow-up only when a real follow-up Action exists.
- `BLOCKED`: name failed gate and upstream record; offer navigation, never `Force ready`.
- Filing after submission: distinguish receipt from approval and external wait from internal blocker.
- No authorized action: explain read-only role, waiting condition, blocker, or missing assignment; show no disabled pseudo-action.

## 6. Navigation and progressive disclosure

### Primary application navigation

Ship with the smallest reliable set:

1. **My Work** — default landing after sign-in;
2. **Matters** — search/list entry;
3. **Reports** only when an approved P0 report has a complete, authorized read model.

Workspace switching, profile, locale/time zone, and administration are secondary shell functions. A role/persona must never create permission or data access not already granted.

### Disclosure rules

- Keep the current object, Matter, role-relevant state, and as-of visible while drilling down.
- Show frequent and high-consequence information before optional metadata.
- Defer complete history and system metadata, not decision-critical provenance.
- Keep exception/owner-only actions in contextual overflow with explicit consequences.
- Use list-and-detail for operational work: scan a compact list, inspect one selected item, reveal attachments/history/details on demand.
- Do not use `Advanced` as a dumping ground and do not hide a required decision until after work depends on it.

## 7. Creation and action entry

All pages open in browse mode.

1. No create/edit fields appear until an authorized user invokes a named action.
2. Each page or section has at most one visually primary action.
3. Empty states repeat the same action; they do not expose a permanent form.
4. A short single-intent command uses a keep-mounted dialog.
5. Multi-step, high-consequence, file-based, or reconciliation-sensitive work uses a stable route.
6. Closing an editor preserves a valid draft and unresolved attempt where policy permits; it never silently retries or mints a new operation identity.
7. Access loss closes the editor and purges scoped draft/selection/pending preview according to the existing security contract.
8. Confirmed creation returns to the relevant list/overview, shows the new object, and preserves prior context.

Matter creation starts from explicit `New matter`, not an inline form. Ask only for facts required by the approved contract. Do not invent a draft-matter lifecycle or setup checklist unless persistence and business semantics support it.

People selection uses searchable human identity (name, permitted email/role, membership status), not typed subject IDs. `Invite/add person` is a separate authorized path, not a fallback that silently creates identity.

## 8. Safety, freshness, permission, and recovery

### Permission

- Hide unauthorized mutation controls; do not show disabled controls that imply entitlement.
- Preserve OWNER/EDITOR/VIEWER, submitter, and designated-verifier rules.
- Do not leak inaccessible Matter names, counts, people, parties, or document metadata through aggregation or search.

### Freshness and conflict

- Show operational `as-of` and a clear refresh state where staleness changes a decision.
- Carry expected revision/ETag for mutation; on stale conflict preserve the user's input, show what changed, and require a new informed decision.
- Never silently overwrite a newer record.

### Outcome handling

- Disable duplicate activation while pending.
- Show pending, confirmed success, failure, partial, and `OUTCOME_UNKNOWN` as distinct states.
- For `OUTCOME_UNKNOWN`, retain operation identity and reconcile/read back before retry.
- For retryable unavailability, preserve valid work and explain the safe next step.
- Confirm actual saved/authorized state, not only that the request was dispatched.

### Access loss

- Sign-out always purges scoped private drafts.
- Forbidden/hidden access closes private UI and purges the affected scoped state under the existing contract.
- Re-grant does not resurrect purged sensitive input.

## 9. Options considered

| Option | Impact | Effort/risk | Decision |
|---|---|---|---|
| Restyle the current module dashboard | Low: visual polish leaves job reconstruction and unclear next action intact | Low effort, high risk of false progress | Reject as primary response |
| Action-first My Work + operational Matter brief | High: directly serves approved JTBD and reduces early decision density | Medium; needs read-model enrichment and careful state semantics | **Recommend** |
| Chat-first or AI-copilot control plane | Unproven and conflicts with deterministic operational truth if used as authority | High policy, provenance, and trust risk | Defer; not P0 |
| Highly customizable dashboards now | May help experts later but adds decisions before the default is proven | Medium/high complexity and testing cost | Defer |

The recommendation borrows concepts, not product surfaces or code: LegalWork's scoped context and source adjacency, Clio's agenda/intake/list/detail separation, and Actionstep's current/next/history distinction. Do not copy LegalWork's chat-first navigation, Clio's billing prominence, or Actionstep's tab proliferation.

## 10. Scope and sequencing

### Ship now

1. Make **My Work** the post-login emphasis using the existing authoritative queues and ordering.
2. Simplify shell hierarchy to My Work and Matters; move Workspace/admin controls to secondary context.
3. Add human Matter labels to My Work through a privacy-safe read-model change; remove visible/typed IDs from normal interaction.
4. Recompose Matter Overview around current truth, next action, blockers/waiting, evidence gap, critical date, and material change.
5. Keep browse mode and explicit action entry from the existing action-entry brief.
6. Distinguish waiting, blocked, completion, verification, receipt, and approval in language and visual grammar.
7. Preserve and expose safe pending/conflict/unknown/reconciliation behavior.

### Next

1. Add authorized proof-review and owner-decision inboxes only after backend contracts define scope, privacy, reason, and ordering.
2. Add global search/recents with explicit privacy rules and authorized human labels.
3. Add provenance previews beside review/decision surfaces.
4. Offer saved/personal list views without changing another user's view.
5. Consider human-readable route aliases with stable identity/redirect compatibility; do not replace durable internal identity casually.

### Defer

- AI assistant, generated legal priority, or natural-language state mutation;
- configurable dashboard/widget layout;
- global command palette and generalized batch creation;
- cross-Matter templates and reusable intake automation;
- analytics or metrics that do not support an approved immediate decision;
- P1/P2 practice-management features such as billing prominence.

## 11. Implementation sequence and dependencies

1. **Contract check:** inventory the data already available to My Work and Matter Overview. Record missing human labels, reasons, provenance, and as-of.
2. **Backend/read model:** add only the minimum authorized fields needed for the default surfaces. Preserve `RULE-021` order and privacy boundaries.
3. **Product Design compositions:** design the same data in Owner, Contributor, Reviewer, and Viewer modes without creating new permissions.
4. **Frontend shell and pages:** recompose presentation while reusing existing safe dialog, draft, idempotency, and error-mapping behavior.
5. **State coverage:** implement loading, empty, fresh, stale, pending, success, failure, partial, permission, access-loss, and unknown states.
6. **Independent verification:** source/contract tests first; authenticated rendered keyboard/accessibility checks second; moderated legal-user validation last.

Do not start broad visual polish before the operating loop, read models, and state/recovery contracts are coherent.

## 12. Implementable acceptance criteria

1. After sign-in, the product emphasizes My Work rather than Workspace/entity inventory or an inline creation form.
2. My Work uses the backend's `next`, `waiting`, `blocked`, and `historical` classifications and preserves authoritative ordering.
3. Every My Work row shows a human Matter label, work label/kind, concise reason, due context, and one allowed next action or no-action explanation; users never type or interpret an internal ID.
4. `WAITING` and dependency `BLOCKED` are distinct in copy, structure, and next-step behavior.
5. Matter Overview answers the six questions in section 4.3 before full module content or mutation controls.
6. Requirement and Action remain separately labeled and never share an ambiguous creation or completion treatment.
7. Execution, verification, dependency, timing, and attention remain independently available; no aggregate badge or progress bar overwrites them.
8. Every promoted next action shows why it is available and the criterion/version/prerequisite/observation needed for a safe choice.
9. Unauthorized actions are absent, and aggregated surfaces reveal no unauthorized Matter, people, evidence, or count information.
10. Initial list/overview render contains no create/edit input. Each mutation begins from one named action with one intent.
11. After confirmed success, the changed object is visible in the preserved list/filter context and attributable history is reachable.
12. Stale conflict preserves input and shows the newer state; retryable failure preserves work; `OUTCOME_UNKNOWN` retains operation identity and requires reconciliation.
13. Human-readable breadcrumbs, pickers, tables, and headers never use an ID as the primary label. IDs remain copyable from details/support only.
14. Keyboard-only use covers primary navigation, row selection, dialogs/routes, error focus, confirmation, and focus return; status is not color-only.
15. EN/VI labels, long Matter/person names, dark/light themes, zoom/reflow, and narrow layouts are verified in a real authenticated browser.
16. Moderated target legal users can find the correct next/creation action and explain Action versus Requirement under the approved acceptance target; results are recorded, not inferred.

## 13. Product Design handoff compositions

Product Design should deliver one connected prototype/state specification containing:

1. My Work for Owner, Contributor, Reviewer, and Viewer using only data each role may see;
2. Matter Overview for the same Matter under those four operating modes;
3. one actionable flow through pending to confirmed readback/history;
4. one blocked flow with causal upstream navigation;
5. one proof flow separating submitter from designated independent reviewer;
6. one filing flow that distinguishes submission, receipt, authority wait, supplement/response, and outcome;
7. loading, empty, stale, refusal, access-loss, partial, and `OUTCOME_UNKNOWN` states;
8. desktop and narrow responsive composition plus keyboard/focus specification.

This brief is the design hypothesis. It is not accepted UX until semantic review, rendered inspection, accessibility checks, and moderated legal-team trials are completed.

## 14. Risks and mitigation

| Risk | Consequence | Mitigation |
|---|---|---|
| Frontend invents queues or joins missing labels client-side | Leakage, N+1 behavior, inconsistent ordering | Add bounded authorized read models; keep unavailable queues out of P0 UI |
| “Simplification” hides legal truth | Unsafe confidence | Keep decision-critical provenance adjacent; preserve axes and drilldown |
| Role personas become new authorization | Incorrect access | Treat persona as presentation only; backend permission remains authoritative |
| Next action becomes an opaque recommendation | Distrust or unsafe action | Show rule/state reason and evidence; no AI authority |
| Matter overview grows into another dashboard | Density returns | Enforce six-question contract and minimal default content |
| Route ID removal breaks deep links/identity | Broken references and auditability | Separate human labels/aliases from durable identity; design migration explicitly |
| Static prototype is mistaken for usability proof | Premature acceptance | Keep rendered/browser/user validation as explicit gates |

## 15. Remaining decisions and owners

| Decision | Recommended default | Owner |
|---|---|---|
| Post-login landing | My Work for all roles; presentation varies by permitted data, not new roles | Product Owner confirms product default; architecture confirms routing/session behavior |
| Review/decision inbox | Do not ship until authorized cross-Matter read models exist | Product + Architecture + Backend |
| Matter navigation grouping | Group presentation without changing domain/routes first | Product Design + Frontend |
| Human-readable URL aliases | Next, after stable identity/deep-link/redirect design | Architecture + Product |
| Matter creation minimum fields | Use approved contract only; no invented draft lifecycle | Product + BA + Architecture |
| Large-picker dialog/route threshold | Determine from rendered scale/accessibility tests | Product Design + Frontend + QA |

## 16. Source basis and limitations

Internal sources:

- `docs/product/canonical-product-context.md`
- `docs/requirements/state-semantics.md`
- `docs/requirements/golden-workflow-acceptance.md`
- `docs/design/action-entry-ux-20261029/product-brief.md`
- `docs/design/legal-team-experience-20261029/business-analysis.md`
- `apps/frontend/src/features/work/schemas.ts`
- `apps/backend/internal/core/domain/matter/derive.go`

Research synthesis:

- `docs/design/legal-team-experience-20261029/platform-research.md`
- LegalWork official repository/product page
- Clio official help documentation
- Actionstep official help documentation

Research establishes transferable patterns, not measured superiority. No authenticated competitor demo, code reuse, rendered MatterControl prototype, accessibility audit, or moderated legal-team test was performed for this brief. All usability outcomes remain hypotheses until observed.
