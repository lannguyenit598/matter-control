# MatterControl creation flow — business analysis

Status: `PROPOSED_UI_REQUIREMENTS`  
Owner: Codex Business Analyst  
Scope: first-time local product journey from Workspace to Matter and its first operational records  
Evidence boundary: source and approved-requirement analysis only; no browser or human-usability result is claimed.

## 1. Problem and intended outcome

The current product exposes creation forms near the underlying records rather than explaining the user's next decision. In particular, the Work page presents full Requirement and Action forms together, while the Matter overview presents only Requirement creation. A new user must already understand the domain model, prerequisites and identifiers before the interface becomes useful.

The improvement must let an authorized user create a useful Matter without learning internal IDs or state-machine details. It must also preserve the approved distinction between a Requirement (a condition or outcome that must be true) and an Action (work somebody performs). This is a presentation and journey change, not authorization to merge commands, loosen permissions, or infer completion or verification from creation.

Success means that the user can answer one question at a time:

1. Where will the work live? Create or select a Workspace.
2. What legal engagement is being controlled? Create a Matter.
3. What should be added next? Choose a Requirement or an Action using plain-language examples.
4. What supporting people, proof, documents or Filing records are needed? Add them when relevant and when their prerequisites exist.

## 2. Canonical constraints that the UI must preserve

- `RULE-001`: Requirement is a condition or outcome; Action is work. An Action can support a Requirement, but completing it never verifies the Requirement.
- `RULE-002`: execution, verification, dependency, timing and attention are independent. The creation UI must not ask the user to manually initialize derived state axes.
- `RULE-005`, `RULE-006`: proof criteria and independent review are added after a Requirement exists; evidence submission and verification are separate, and a submitter cannot verify the same proof.
- `RULE-011`: creating a Document and uploading a version are separate; upload never makes a version authoritative. Promotion remains an explicit OWNER operation with current-revision protection.
- `RULE-012`: Filing creation does not collapse package, submission, receipt, authority review, supplement or outcome into one event.
- `RULE-017`: active Workspace membership, explicit Matter membership and the operation-specific role are all required. Assignment never grants Matter access.
- `RULE-018`: writes remain revision-guarded and history-producing. Accepted retries must not duplicate records; an uncertain outcome must be reconciled rather than submitted as a fresh create.
- Permission matrix: Workspace OWNER creates Matters; Matter OWNER/EDITOR creates Requirements and Actions, supplies evidence, adds Document versions and records normal Filing observations. OWNER-only controls remain OWNER-only. VIEWER remains read/export only.
- Access denial must not reveal hidden Matter names or details. Workspace access loss removes derived Matter access immediately.

Sources: `docs/requirements/business-rules.md`, `docs/requirements/permission-matrix.md`, `docs/requirements/state-semantics.md`, `docs/requirements/golden-workflow-acceptance.md`.

## 3. Minimal coherent journey

### 3.1 Workspace

When no Workspace is available, show one primary empty-state action: **Create your first workspace**. Ask only for the Workspace name, which is the only current required product input. On confirmed success, land in the named Workspace and show **Create first Matter** as the recommended next action. Inviting people is available but not mandatory.

When Workspaces already exist, the list is primary and **New workspace** becomes a secondary action rather than a permanently competing form.

### 3.2 Matter

When the Workspace has no Matter, show **Create first Matter** and ask only for the title. The creating Workspace OWNER receives the initial Matter OWNER grant under the existing command. Do not ask for an owner ID, revision, ETag or generated identifier.

On confirmed success, land in the named Matter and show a short, dismissible getting-started guide:

1. **Define what must be true** — add a Requirement.
2. **Add work to perform** — add an Action.
3. **Add people, documents or proof when needed**.

The guide recommends choices but does not require Requirement-first. Both Requirement and Action are legitimate first records.

### 3.3 Requirement versus Action

Replace simultaneous full forms with a first decision: **What are you creating?**

| Choice | User-facing explanation | Example | Required now |
|---|---|---|---|
| Requirement | A condition or outcome that must be true | “Board approval obtained” | title; intended outcome |
| Action | Work a person needs to perform | “Prepare board resolutions” | title; expected outcome |

Only the selected form is shown. Owner/assignee, due date, workstream and dependencies are follow-up configuration after the base record exists. If assignment is requested, the selectable person must already be an active Matter member. The same choice and language should be used from Matter overview and Work so the two entry points do not teach different models.

### 3.4 Documents and proof

Document creation first asks for a readable document name. Version upload is the next operation, and authoritative promotion remains a later OWNER decision. The UI must not label an uploaded version as “current” merely because it is newest.

Requirement proof is configured after Requirement creation: define proof criteria, supply Evidence, and designate an eligible independent verifier before review. The UI must distinguish **evidence supplied** from **requirement verified**.

### 3.5 Filing

Filing creation currently requires title, intended outcome, a linked Requirement, an authority Party and the proof-required choice. Filing owner is optional at creation but must be assigned before package preparation.

The creation surface must convert missing prerequisites into actionable empty states:

- no eligible Requirement: **Create a requirement first**;
- no authority Party: **Add an authority under Planning**;
- no owner: explain that one is required before package preparation, without blocking current creation;
- creation from a Requirement context should preselect that Requirement where the existing action supports it.

Do not show an empty selector filled with raw IDs. Creating a missing Requirement or Party inline as part of the same transaction would require a new product/API decision.

## 4. Ask now versus configure later

| Record | Required at creation under the current contract | Configure later |
|---|---|---|
| Workspace | name | members and roles |
| Matter | title | additional members, planning data |
| Requirement | title, intended outcome | proof criteria, dependencies, verifier, evidence |
| Action | title, expected outcome | assignee, due date, workstream, dependencies |
| Document | name | versions, signature observations, authoritative promotion |
| Filing | title, intended outcome, Requirement, authority Party, proof-required choice | owner before package prep; later Filing stages and observations |

Generated UUIDs, receipt/idempotency keys, revisions/ETags, event sequence numbers and proof epochs are never form fields or primary labels. Technical keys may remain in routes, but breadcrumbs, page headings and selectors must use readable names. Provenance details may be available in an expandable audit view after creation.

## 5. Transaction and recovery behavior

Each record is a separately confirmed transaction. A completed earlier step remains useful if the user leaves before the next one; the guide resumes from current state.

| Condition | Required UI behavior |
|---|---|
| validation error | Focus the first invalid field, explain it inline and retain all other values. |
| pending request | Disable duplicate submission and label the operation as in progress. |
| confirmed success or replay | Navigate to the created, human-readable context and offer the next recommended action. Do not imply completed or verified status. |
| `409`/`412` conflict | Retain input; explain that the underlying state changed; reload current state and let the user reconcile. Never silently overwrite. |
| network/`503` before a confirmed outcome | Retain draft and allow a later retry. Do not clear or redirect. |
| `OUTCOME_UNKNOWN` | Say that creation could not be confirmed; check/reread current state and retry only the same operation identity where permitted. Never issue a fresh “Create another” request to discover the result. |
| known read-only role | Do not render an unexplained disabled create form. Show a concise read-only explanation. |
| forbidden/not found/access loss | Remove the creation affordance, avoid leaking object details, purge protected draft/selection/preview state for the lost scope, and do not resurrect it after re-grant. |
| empty prerequisite list | Explain which prerequisite is missing and link to the authorized way to create it; do not render a raw-ID field as a workaround. |

## 6. Implementation acceptance cases

These are journey-level acceptance checks, not new canonical requirement IDs.

1. With no Workspace, the page presents one primary **Create your first workspace** action; its form requires only a name.
2. Confirmed Workspace creation shows its name and a clear **Create first Matter** next action; the user is not forced to invite anyone.
3. Matter creation requires only a title and never exposes an ID, revision or receipt key.
4. A new Matter explains Requirement and Action with distinct examples and lets the user choose either first.
5. Matter overview and Work use the same choice model; two full creation forms are not shown simultaneously.
6. Selecting Requirement shows only title and intended outcome. Selecting Action shows only title and expected outcome. Optional assignment/planning fields do not block creation.
7. Completing an Action never changes Requirement verification in the creation journey or its success message.
8. A VIEWER sees the records and a read-only explanation, not a create form that will predictably fail.
9. Filing creation never presents raw Requirement, Party or user IDs as meaningful labels. Missing prerequisites produce actionable empty states.
10. A validation error, network error or conflict retains the user's valid input and moves focus to an understandable recovery action.
11. An uncertain mutation outcome does not clear the form or generate a new idempotency identity; reconciliation occurs before another create attempt.
12. Losing Matter access while a protected form is open removes its protected draft and does not restore it after access is granted again.
13. Success navigation moves focus to the destination heading, and pending/error/success states are announced without relying on color alone.
14. No creation success message claims execution completion, verification, authoritative document status or a completed Filing stage.

## 7. Scope boundary and decisions

### UI-only changes already within the approved presentation scope

- progressive disclosure and choice-first forms;
- plain-language explanations and examples;
- primary/secondary CTA hierarchy and empty-state guidance;
- next-action cards after confirmed success;
- readable names in headings, breadcrumbs and selectors while retaining opaque route keys;
- prerequisite guidance, draft preservation and existing error-state presentation;
- consistent Requirement/Action entry behavior across existing Matter pages.

### New product, API or architecture decisions — not implied here

- a single atomic command that creates Workspace, Matter and child records;
- inline transactional creation of a missing Requirement or authority Party from Filing;
- automatically generated legal workflow templates or default records;
- automatic assignee, verifier, proof criteria or changed Filing proof defaults;
- changing current required fields, authorization rules or state transitions;
- expanding the separately approved local/dev same-issuer directory into a production/global directory policy.

The minimal implementation should use the current create commands and directory scope. It should not wait for the above decisions.

## 8. Handoff risks and verification

- Browser, keyboard, screen-reader, touch and human comprehension evidence remain `NOT_RUN` until actually executed.
- Current routes may preserve opaque identifiers internally; acceptance concerns the user-visible labels and context, not a route migration.
- Error mapping must distinguish a rejected command from an uncertain outcome. A generic toast is insufficient for `OUTCOME_UNKNOWN`.
- Filing prerequisite links must point to an existing authorized surface. If no suitable Party creation entry exists, that is an implementation dependency rather than permission to invent inline creation.
- The local/dev same-issuer user directory is already separately authorized; this analysis does not broaden its scope or make member invitation part of first-time completion.

Recommended engineering handoff: implement the Workspace/Matter empty-state hierarchy and the shared Requirement-or-Action chooser first, preserving existing command handlers and schemas; then add prerequisite-aware Document/proof/Filing guidance and execute browser accessibility/usability checks.
