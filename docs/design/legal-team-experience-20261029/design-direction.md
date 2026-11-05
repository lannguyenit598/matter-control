# MatterControl — focused legal-team experience

Date: 2026-10-29. Owner: actual Local Codex applying Product Design plugin skills. Inputs: final BA report, final research report, PM product-design-brief.md. PM subagent wrote a substantive brief before its completion turn hit quota; root read the full sections and owns this synthesis. No external designer product was invoked and no product implementation is changed.

Status: DESIGN_CANDIDATE / VISUAL_SELECTION_AND_VALIDATION_PENDING. The approved product positioning, state/permission semantics and P0 scope remain unchanged.

## Recommended product model

My Work -> choose one real assigned item -> understand why -> take the permitted next step -> confirmed result -> return to the same queue/context.

Matter Overview -> understand current truth, why progress is blocked or waiting, and who can do what next -> drill into the relevant work/evidence/document -> act -> inspect resulting state.

Creation is secondary to comprehension. A visible named Create/Add action opens a focused dialog or task route. No permanent creation cards, no form inventory, no module catalogue on the first screen.

## Default information budget (design constraint, not a business rule)

- Two main global destinations: My Work and Matters. Workspace switch/admin under context/account controls. Existing domain routes remain reachable.
- My Work first view: title/as-of, one active queue, one compact list of real assigned items. Waiting/Blocked/History reachable by named queue controls; unresolved command alerts cannot be collapsed away. No metric-card wall or four long expanded sections.
- Each row: title, Matter name, due context and one plain-language reason. Show at most the relevant attention cue; full independent state axes available in the selected detail. No row of five equally weighted badges.
- Selected work: one reason/explanation, one primary safe action and the criterion/version/gate information needed to choose. Details/history collapsed or on demand. No implicit automatic mutation.
- Matter Overview: scope/as-of, one factual operational sentence, a short list of highest-consequence blockers/waiting, and a real next-item link where authorized. Do not invent an aggregate legal status or percent complete.
- Empty personal queue: honest no assignment/none ready plus safe Matter navigation. Do not fabricate work, populate fake reviews or imply nothing is blocked.

## Feasibility and semantic disposition

Existing My Actions data has next/waiting/blocked/historical, reason, item, derived state, as-of at response, Matter ID. It lacks resolved Matter title and a cross-Matter proof-review/decision feed. Enrich only authorized bounded read models when implemented; do not perform client N+1 joins or invent records. Review/decision queues remain future scope until their contracts exist.

Current Matter list exposes id/title/callerRole and pagination, not a guaranteed client, matter type, owner display name, next due or material-change summary. Those fields in research/PM suggestions are desired-data candidates, not implemented facts or new required creation fields. Do not show fictional metadata.

Keep current title-only Matter creation contract. No draft-Matter lifecycle, templates, AI intake, billing, chatbot, e-signing, e-filing or new authorization role is approved by this redesign. Routing IDs remain durable; only visible labels improve. No slug migration.

## Three visual candidates

All three show the same authorized work and semantics within existing neutral R9 tokens (background #f7f8fa, text #18181b, muted #60646c, border #e4e7eb, primary #202124, restrained risk #a12622, Lucide-like outline icons, readable sans typography). They differ in information hierarchy, not features or policy.

- Daily queue: generous single-column agenda; active Next queue, waiting/blocked counts as secondary queue tabs; click opens record detail. Best for fast personal orientation.
- List and detail: compact selectable list beside one selected item. Evidence/reason next to the named safe action. Inspired by observed LegalWork public Tasks composition, not a copy of its AI/desktop navigation.
- Focused workbench: a short priority rail and one large current task workspace with steps/context and detail disclosures. Best for concentrated execution, requires context-preserving return.

All are synthetic visual concepts only. Display date anchor 2026-10-29; no real legal/customer data. No metric dashboard, chat prompt, many creation cards, rainbow badge soup or disabled pseudo-actions.

## Required state specification

| State | What user sees | Safe continuation |
|---|---|---|
| Loading | Stable shell/queue labels and scoped skeleton | No fabricated counts or outdated enabled write |
| Empty | None assigned/none ready distinguished from waiting/blocked | Open permitted Matter or alternate queue |
| Ready | Exact assigned action and reason | Open/perform existing permitted action |
| Waiting | Named waiting party/condition | Inspect waiting context; no invented follow-up |
| Blocked | Failed gate and permitted upstream link | Inspect prerequisite; no force-ready |
| Completed, proof unverified | Separate work claim and proof gap | Submit/review only if existing policy permits |
| Stale/conflict | Inputs retained; new server state visible | Reread and make an informed new attempt |
| Unknown | Outcome not confirmed; original identity retained | Reconcile/reread; no blind replay/new key |
| Permission lost | Protected content/drafts/selection purged | Sign in or leave scope; regrant does not revive |
| Confirmed success | Actual resulting record and attributable event | Return to preserved filter/selection |

## Validation and execution handoff

First select one visual composition. Then implement My Work, selected-work detail and Matter operational overview using existing domain routes and safe commands. The earlier action-entry addendum supplies create/dialog details but is subordinate to this job-first hierarchy; moving every form into a modal alone is not sufficient.

Review three connected scenarios before broad polish: ready assigned action -> confirmed result; blocked action -> upstream reason; completed work -> independent proof review on exact version. Filing receipt remains distinct from authority approval. Do not claim these routes/queues are implemented from a mock.

Source/contract checks, authenticated rendered desktop/narrow keyboard/focus tests and moderated legal-team comprehension trials are separate evidence. Keep approved trial target unchanged and NOT_RUN until measured. No P0/MC-002/release or production acceptance follows from this document.

## Evidence limits

LegalWork reference is the publicly published Tasks demo composition on eigenweltlabs.com/legalwork; this is not an installed app walkthrough. Current MatterControl rendered audit was not performed. The official screenshot was observed and retained. Earlier JPEG display looked blank due to application/octet-stream MIME labeling from the local viewing tool; re-emitting the same bytes as image/jpeg showed the original screenshot. No screenshot pixels were edited and no alternate capture bypass used.
