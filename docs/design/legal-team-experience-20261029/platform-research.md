# Legal-team experience research: LegalWork, Clio, and Actionstep

Date: 2026-10-29  
Owner: Research Analyst  
Mode: primary-source web research only; no product login, installation, source reuse, or runtime testing  
Decision objective: give Product Management and Product Design an evidence-backed direction for making MatterControl immediately understandable to a legal team, with a clear next action and substantially less on-screen density.

## Executive conclusion

MatterControl should not imitate any one product. The strongest cross-product pattern is a two-level experience:

1. **Personal work first:** the landing page answers “What needs my attention now?” with a short, ordered set of actionable items.
2. **Matter context second:** the matter page answers “Where are we, what is blocking progress, and what happens next?” before exposing complete records, history, documents, and administration.

Creation should begin from an explicit `New matter` action, not from a permanently expanded form. The initial step should request only the minimum facts needed to create a safe draft; additional legal context belongs in subsequent, named sections. Human-readable names must be primary everywhere. Internal IDs are useful for audit and support, but should be secondary metadata with an intentional copy action.

LegalWork contributes a useful model for **matter-scoped context, explicit file authorization, source-linked outputs, and human review before a workflow starts**. It is not a practice-management or operational-truth product and should not be used as the primary information-architecture model. Clio contributes the clearest **personal agenda, intake pipeline, searchable lists, and configurable matter summary**. Actionstep contributes the clearest **current/next/future workflow representation and explicit global creation entry point**. Actionstep also demonstrates the failure mode to avoid: a matter can accumulate a large number of peer tabs and panels, recreating the density problem MatterControl is trying to solve.

## Research scope and evidence quality

| Source | Evidence inspected | Fit to MatterControl | Evidence quality |
|---|---|---:|---:|
| LegalWork | Official GitHub repository and MIT license at the observed `dev` head [`336270d65493b1591a6ef2e836da369dca36b637`](https://github.com/eigenweltlabs/legalwork/commit/336270d65493b1591a6ef2e836da369dca36b637); official product page | Medium: legal-work context and evidence, but AI/document workspace rather than operational control plane | High for documented capabilities and license; medium for UX behavior because no runtime was inspected |
| Clio Manage / Clio Grow | Official Clio help documentation for navigation, matter dashboards, tasks, intake, and matter creation | High: mature legal matter and intake product | High for documented behavior; no usability claim beyond documentation |
| Actionstep Practice Management | Official Actionstep help documentation for home, matter home, tasks, creation, and workflows | High: legal matter/workflow product | High for documented behavior; no runtime observation |

Evidence labels used below:

- **Observed in source/repository:** directly visible in the public repository or license.
- **Documented:** stated by the product owner in official product/help material.
- **Inference:** a proposed implication for MatterControl; it is not a claim that the reference product has been usability-tested here.

## Platform findings

### 1. LegalWork: keep work and evidence scoped to the matter

**Observed/documented**

- LegalWork describes itself as a local computer-use agent for law firms. Its README says users point it at a folder and ask for document review, drafting, and redlining; it runs locally by default and can use a model chosen by the user. This makes it adjacent to MatterControl, not a replacement for matter operations. [Repository README](https://github.com/eigenweltlabs/legalwork/tree/336270d65493b1591a6ef2e836da369dca36b637#readme)
- The official product page describes “one workspace per matter,” explicit authorization of folders, and keeping conversation, documents, outputs, and reusable instructions together. It also describes source-grounded review grids where cells carry reasoning, a source quote, and a page reference. [LegalWork product page](https://eigenweltlabs.com/legalwork)
- The public product-page composition shows a task list beside one selected task. The selected-task summary exposes human labels (title, client, matter), status, assignee, priority, and due date first; attachments, sessions, history, and details are secondary sections. This is an **observed public demo composition**, not a runtime-validated interaction claim. [LegalWork Tasks and Intake demo](https://eigenweltlabs.com/legalwork#tasks-and-intake)
- The same official page documents intake that turns forwarded emails and API requests into tasks. Triage instructions determine classification and assignment; the assigned person reviews the task and attachments, then starts the workflow. It explicitly says intake does not send automatic replies. [LegalWork intake FAQ](https://eigenweltlabs.com/legalwork#faq)
- The public repository is MIT licensed, including commercial reuse subject to preservation of the copyright and permission notice. [Pinned license](https://github.com/eigenweltlabs/legalwork/blob/336270d65493b1591a6ef2e836da369dca36b637/LICENSE)

**Transferable patterns**

- Keep an action, its working documents, supporting evidence, and resulting output in the same matter context.
- Use list-and-detail progressive disclosure for operational work: scan a compact list, select one item, then reveal attachments/history/details without putting every section in the list row.
- Make provenance inspectable at the point where a user evaluates an extracted fact or generated artifact; do not hide it only in an audit screen.
- Treat automated intake as a proposed assignment that requires a human review action, not as an invisible state transition.
- Use explicit scope language such as “Files available to this task” rather than implying the system can access everything.

**Do not copy**

- Do not make conversational AI the main navigation model for MatterControl. LegalWork is optimized for document work; MatterControl must remain a reliable system of operational truth.
- Do not infer that a folder-per-matter model provides the approved MatterControl permission, state, dependency, or filing semantics.
- Do not copy source, icons, screenshots, or interaction code merely because the repository is MIT licensed. Any reuse needs a separate dependency/source review, attribution, security review, and product-fit decision. Conceptual inspiration does not require importing code.

Confidence: **High** that these are documented LegalWork principles; **Medium** that their exact UI behavior would transfer without adaptation.

### 2. Clio: separate personal agenda, intake pipeline, matter list, and matter detail

**Documented**

- Clio Manage’s Personal Dashboard includes today’s agenda; its Tasks area supports outstanding/completed views and filtering, while Matters supports status views, keyword search, configurable columns, filters, and explicit matter creation. The header also provides global search, recent items, notifications, and creation. [Navigate Clio Manage](https://help.clio.com/hc/en-us/articles/9290390462875-Navigate-Clio-Manage)
- Clio Grow separates an intake pipeline from active work. Its Agenda groups work into today, upcoming, past due, and no due date; its Pipeline separates matters in intake, hired matters, and matters not hired. [Navigate Clio Grow](https://help.clio.com/hc/en-us/articles/9290426619675-Navigate-Clio-Grow)
- The matter dashboard is an overview of matter details, activity, contacts, custom fields, and related information. Users can add, remove, reorder, and resize widgets, and the chosen layout applies across their matters without changing colleagues’ layouts. [Matter dashboard](https://help.clio.com/hc/en-us/articles/16681289917595-Matter-s-Dashboard)
- Matter creation starts from `New Matter`, a global `Create new` action, or a contact card. The form is divided into sections and saved into the matter dashboard; permissions can restrict create/edit/view behavior. [Create Matters](https://help.clio.com/hc/en-us/articles/9285959663131-Create-Matters)
- Intake forms can preserve a prospective client’s progress, appear as pending or submitted, and later be reviewed from the matter. [Send, View, and Manage Intake Forms](https://help.clio.com/hc/en-us/articles/9284567246747-Send-View-and-Manage-Intake-Forms)

**Transferable patterns**

- Give `My Work` a time-and-attention model: overdue, due today, due soon, waiting/blocked, and no due date. Do not begin with a catalogue of object types or metrics.
- Keep intake/draft work visibly distinct from active legal matters. A prospect or incomplete submission should not silently look like an active matter.
- Put global search, recents, and one explicit create entry point in the application shell.
- Make matter lists searchable and filterable, but keep the default columns intentionally small. Allow users to reveal more columns instead of displaying all fields by default.
- Allow role- or user-relevant matter summaries, while retaining a reliable default layout.

**Do not copy**

- Do not import Clio’s billing-led information hierarchy into P0. MatterControl’s approved initial vertical is operational legal work, not practice billing.
- Do not adopt one long “everything about the matter” creation form. The Clio form documents many sections; MatterControl should use progressive disclosure and create a draft from the minimum safe input.
- Do not treat open/pending/closed as a substitute for MatterControl’s independent state axes.

Confidence: **High** for documented navigation and workflow; **High** that the separation of agenda, intake, list, and detail directly addresses MatterControl’s current density problem.

### 3. Actionstep: show current step and next move, but avoid tab proliferation

**Documented**

- Actionstep’s home page presents panels for recently accessed/assigned/favourite matters, today’s appointments, today’s assigned tasks, and recent activity. It provides global matter/contact search and a global Create button for actions such as creating a matter. [Actionstep Home Page Overview](https://support.actionstep.com/hc/en-us/articles/50482501722003-Actionstep-Home-Page-Overview)
- Its matter home shows the matter identity and primary participant, a workflow ribbon, and a high-level overview. The workflow ribbon identifies completed, current, next, and future steps. Advancing can require an intermediate task before the step changes, and a history records who completed steps and when. [Matter home](https://support.actionstep.com/hc/en-us/articles/50482533981331-Getting-to-Know-the-Matter-Home-Page) and [Completing workflow steps](https://support.actionstep.com/hc/en-us/articles/50482518446867-Completing-Workflow-Steps-in-a-Matter)
- Matter creation begins from the global Create button or matter list. Selecting a matter type changes the required fields, and templates can prefill data. The form uses human-facing matter name, assignment, status, date, and party roles; the system-generated ID is created afterward. [Creating a Matter](https://support.actionstep.com/hc/en-us/articles/50482474423443-Creating-a-Matter)
- Actionstep distinguishes tasks from workflow steps. Tasks have assignee, due date, priority, reminders, and optional matter/workflow association; workflow steps represent the matter-type process. [About Actionstep Tasks](https://support.actionstep.com/hc/en-us/articles/50482533849107-About-Actionstep-Tasks)

**Transferable patterns**

- Show one unambiguous current position and a small number of allowed next actions. Preserve prior events in history rather than displaying the full workflow as equally active controls.
- Keep `Action` and `Requirement/workflow state` visibly distinct. This aligns with MatterControl’s approved Requirement-versus-Action rule.
- Ask for matter type first only when it genuinely changes required information; then display the minimum relevant fields.
- Represent people by name, relationship, team role, and avatar/initials. Show internal IDs only in a secondary details/support affordance.

**Do not copy**

- Actionstep documents up to fifteen peer matter destinations (home, parties, steps, notes, appointments, tasks, communications, alerts, files, documents, reports, billing, trust, wiki, portal). Copying that breadth would recreate MatterControl’s current “everything at once” problem.
- Do not use a decorative workflow ribbon if transitions have legal semantics that cannot be expressed as a simple sequential step.
- Do not collapse the current state, future permitted transitions, outstanding requirements, and task assignments into one progress bar.

Confidence: **High** for documented workflows; **High** that its current/next/history pattern is relevant, but **Medium** for direct visual reuse because MatterControl’s state model is more independent and evidence-sensitive.

## Cross-platform synthesis

| User question | Recommended MatterControl surface | Evidence basis |
|---|---|---|
| What should I do now? | `My Work`: short prioritized sections for overdue, due today, due soon, waiting/blocked, recently changed | Clio Agenda; Actionstep home/tasks |
| Which matter am I working on? | Searchable `Matters` list with human name, client/counterparty label, matter type, responsible person, next due item, and compact status summary | Clio matter list; Actionstep global search and recent matters |
| Where is this matter now? | Matter overview with current situation, next permitted action, blockers, owners, critical dates, and recent activity | Actionstep workflow current/next/history; Clio matter dashboard |
| What evidence supports this? | Evidence/provenance adjacent to the fact, deliverable, or decision; link to source and version | LegalWork sourced review cells; matter-scoped workspace |
| How do I create something? | One explicit action opens a focused drawer/page/wizard; no permanent inline creation form | Clio global create/New Matter; Actionstep global Create |
| How do I add a person? | Search by name/email/role, show human labels and relationship; create/invite only as a secondary explicit path | Clio contacts/search; Actionstep role-based party selection |
| What has happened? | Chronological activity/history with actor, timestamp, object, old/new outcome where applicable | Actionstep workflow history; Clio timeline |

## Recommended MatterControl experience direction

### A. Application shell

Limit primary navigation to the legal team’s core destinations:

1. **My Work** — the default landing page.
2. **Matters** — searchable/filterable list.
3. **Reports** — only if a P0 approved report exists and is actionable.

Keep workspace switching, language/time zone, profile, and administration in secondary navigation. Provide global search and one `Create` action in the shell. Do not show raw workspace or subject IDs as the primary label.

### B. My Work

The first viewport should contain no more than:

- a page title and one-sentence orientation;
- one primary action if the user is authorized;
- `Needs attention` with overdue/due-today items;
- `Waiting or blocked` with the reason and owner;
- `Recently changed` as a compact feed.

Each work row should show: action title, human-readable matter name, why it needs attention, due time, responsible person, and exactly one primary action. Secondary actions belong in an overflow menu or detail panel.

This page must not conflate independent status axes into a single generic badge. A concise summary can display separate, named signals such as `Action: overdue`, `Requirement: waiting for verification`, or `Filing: receipt received`.

### C. Matters list

Default visible fields:

- matter name;
- matter type;
- primary client/counterparty label where allowed;
- responsible legal owner;
- next due item;
- concise attention state;
- last meaningful change.

Advanced metadata, internal IDs, counts, and secondary state axes should be available through column customization or the detail view. Search should accept matter name, client/counterparty, reference, and responsible person. Search and filters must update the result area without a full-page navigation/reload.

### D. Matter overview

Use progressive disclosure rather than a wall of cards. The default overview should answer:

1. What is this matter and who owns it?
2. What is the current operational situation?
3. What is the next permitted action?
4. What is blocking or waiting?
5. What critical date is approaching?
6. What changed recently?

Recommended secondary sections: `Work`, `Documents`, `People`, and `History`. Configuration, raw audit payloads, revision identifiers, and system IDs belong under explicit details/admin affordances. The exact sections must still follow approved capability scope and permissions.

### E. Creation and intake

- Replace always-visible creation forms with a `New matter` button.
- Open a focused page, drawer, or modal with a clear step title and progress label.
- First step: matter type/template if it changes required data.
- Minimum creation facts: human-readable name, responsible owner, key party/parties, and explicitly approved initial classification fields.
- Save as a draft only if the existing product decision and persistence contract support it; otherwise state clearly what will and will not persist.
- After creation, route to the matter overview with a short setup checklist rather than showing every possible field before the user can begin.
- Intake-originated work must show source, review status, assignee, and a deliberate `Start workflow`/`Create matter` decision. Automation may suggest but must not silently establish legal truth.

### F. People selection

- Use a searchable combobox, not a native select containing opaque identifiers.
- Primary option label: display name. Secondary line: email or team role where permitted. Optional status: already in matter, inactive, or invitation required.
- Support keyboard navigation, no-results guidance, loading/error states, and a clear `Invite/add new person` secondary action when authorized.
- After selection, show the person as a removable chip or compact identity card. Do not expose the directory subject ID in normal use.

### G. Evidence and collaboration

- Show the provenance link next to an extracted fact or decision, not only in a separate audit log.
- Keep comments/notes subordinate to the legal object they discuss.
- Use explicit terms for `draft`, `proposed`, `verified`, `receipt`, and `approved`; do not rely on colour alone.
- Preserve actor, time, source version, and supersession history in the detailed view.

## Prioritized design requirements

### P0 — immediately reduce confusion

1. Default to `My Work`, not an object inventory or dashboard of counts.
2. Move all creation forms behind explicit action buttons.
3. Replace raw IDs in paths, labels, selects, and tables with human-readable names; retain IDs only as secondary metadata.
4. Give every page one clearly dominant action and one plain-language orientation sentence.
5. Add a compact matter overview: current situation, next action, blockers, owner, critical date.
6. Make people and matter selectors searchable, permission-aware comboboxes.
7. Keep Requirements, Actions, Filing outcomes, dependencies, and verification semantics visibly distinct.

### P1 — improve speed and confidence

1. Global search and recents.
2. Saved/personal list views without changing another user’s view.
3. Matter setup checklist and matter-type templates.
4. Evidence/provenance previews adjacent to decisions.
5. Role-aware default views after enough observed usage evidence exists.

### P2 — later optimization

1. User-configurable matter overview layout.
2. Reusable intake workflows and templates.
3. Carefully governed recommended next actions, with explanation and human confirmation.

## Do-not-copy list

- Do not copy LegalWork’s chat-first interaction as the primary control-plane navigation.
- Do not copy Clio’s billing/timekeeping prominence into the operational P0.
- Do not copy Actionstep’s large set of peer tabs or dashboard panels.
- Do not display every possible matter field during creation.
- Do not use a generic progress percentage to summarize independent legal/operational states.
- Do not use raw IDs as names, dropdown labels, breadcrumbs, or default URL text shown to users.
- Do not use AI-generated priority or status without source, explanation, and human confirmation.
- Do not reuse commercial product code, visual assets, text, or screenshots. LegalWork code reuse is legally possible under MIT conditions but still requires a separate technical, security, attribution, and product-fit review.

## High-impact unknowns

These questions can alter layout priority and should be answered through short legal-team trials, not assumption:

1. Which roles are the first P0 users: legal manager, matter owner, contributor, operations/admin, or all four?
2. What are the three most frequent “start of day” decisions for each role?
3. Which blocker categories require immediate escalation rather than appearing in a passive list?
4. Which matter facts may appear in global search results without leaking restricted context?
5. What minimum input is legally and operationally sufficient to create a draft matter?
6. Does the approved backend contract support persistent creation drafts, or must the first version use a single validated submission?

## Recommended validation

Before visual polish, test three low-fidelity flows with at least one legal manager and one day-to-day contributor:

1. From sign-in, identify the most urgent item and explain why it is urgent within 10 seconds.
2. Open a matter and identify its current situation, next permitted action, blocker, and responsible person within 20 seconds.
3. Create a draft matter and add a person without seeing or typing a system ID.

Record task success, time, wrong turns, and the user’s explanation of what they believe will happen next. A visually attractive screen is not accepted if users cannot explain the next action or the legal meaning of the displayed state.

## Research limits

- No authenticated demo, browser session, accessibility audit, or legal-team usability study was performed.
- Product help pages describe supported behavior; they do not prove that users find the behavior easy.
- LegalWork was inspected through public repository/product sources, not installed or executed.
- Recommendations are design inputs, not approval to change MatterControl’s existing business rules, permissions, state model, or release gates.
