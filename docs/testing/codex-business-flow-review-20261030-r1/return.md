# Implemented business flows — BA / PM consolidated review

Actual Local Codex with user-requested Codex Business Analyst and Product Manager subagents. This is a review, not external ZCode/Claude/OpenCode execution. Branch `codex/unified-project-flow`; HEAD `0de3e5dbb8ef578c7288ba9c49ecaeddbbcbdcee`. No application source, runtime, database or cloud configuration changed by this review. Existing dirty work is preserved.

**Verdict: CHANGES_REQUIRED for business-flow alignment; browser acceptance NOT_VERIFIED.** Backend support is substantial, but passing service contracts does not establish usable connected legal-team journeys. No P0 emergency severity is assigned by this consolidated review: the PM's “P0” labels described product-delivery priority, not a demonstrated outage/security severity. Filing issues BF-01/BF-02 are P1; the remaining eight findings are P2 corrections or product-flow recommendations.

## Review provenance and limits

- Product Manager returned a completed read-only source audit. Business Analyst sent four concrete findings, then the agent hit a usage limit before producing its final consolidated return. The primary agent re-read and confirmed all four cited code paths; this document does not claim a completed BA final return.
- The 280-entry inputs.json is a bounded requirements/source census, not the whole repository. Final drift check is recorded separately. Findings link source lines as observed.
- Current approved PRD, permission matrix, independent state semantics, user journeys and GW-01/02/03 are the authority. Historical wording such as “unimplemented” in old requirement docs is not used as current implementation status.
- Prior memory was used only to locate the creation-flow invariant; current PRD/source were re-read. Requirement remains condition/outcome; Action remains work; completion is not verification.
- Browser use is disabled in Work settings. No browser/OS/headless bypass, real IdP/private data, provider call or retained resource lifecycle was performed.

## Journey inventory

| Journey | Implemented support | Remaining gap |
|---|---|---|
| Login → Workspace → Matter → work creation | Real OIDC/BFF routes, memberships, explicit owner/editor/viewer roles, separate Requirement/Action creation | Default arrival/discovery/comprehension (BF-06..09); no new human acceptance |
| Assigned daily execution | Ready/waiting/blocked/history, named Matter, causal links, retained origin and safe UNKNOWN recovery primitives | Review inbox absent; input timezone and long relationship-list gaps |
| Proof/evidence assessment | Criteria, exact versions, designated independent verifier, assessment/rejection/dispute/revocation | Discoverability and Filing-specific criterion boundary |
| GW-01 transaction to post-closing | Service command/readback/history/axes contract exists and memory suite passed in this turn | Connected frontend/second-user acceptance not run; no real payments/signatures implied |
| GW-02 DD request to resolution | Request/document/finding/follow-up/proof primitives and memory journey passed | New manual review surface does not itself verify a Requirement; connected browser acceptance missing |
| GW-03 filing | Stage/cycle/submission/version/outcome/reopen/negative paths and memory journey passed | BF-01 package-vs-outcome proof and BF-02 no-proof UI dead end |
| Review matrix | Version/question/cell/history, CAS and UNKNOWN retention, access-loss suppression | Tests pass at component/service level; no rendered revoked/second-user closure |
| Agenda | Authorized read-only per-Matter dates using device zone, source links | First-page limits honestly announced; cross-Matter calendar/reminders not implemented |
| Status Brief/import/export | Existing deterministic replay, preview/confirm and scope boundaries | BF-10 reporting usability; this review did not re-run all import/export/PG cases |

## Findings

### BF-01 — P1 — Filing package verification and authority-outcome verification share one aggregate

Type: Business semantics / model mismatch. Trace: state-semantics.md stage table; GW-03 / AC-163; BR-005.

**Trigger:** The coordinator satisfies the package/signature criteria, submits, and later records an authority decision as outcome evidence without an independent assessment of that outcome.

**Observed:** Submission checks every active mandatory filing criterion; the same criteria drive the work-item verification aggregate. The executed GW suite expects VERIFIED before submission and still VERIFIED at approval after recording outcome evidence. There is no criterion purpose separating pre-submission package readiness from final outcome. Making an outcome criterion mandatory up front instead prevents submission until a future fact exists. The linked Requirement remains separate and is NOT automatically completed or verified: this finding is about the filing proof model, not propagation to that Requirement.

**Expected:** Package readiness must allow submission while outcome verification can remain pending after approval observation. Recording outcome evidence alone does not establish its independent acceptance.

**Correction:** Design the smallest explicit package/signature versus outcome criterion boundary; keep both independently attributable, version/epoch-aware and preserve existing submissions. Update contract/schema only after compatibility review; no silent reinterpretation of existing criteria.

**Acceptance:** A filing passes package gates, reaches APPROVAL with actual outcome evidence but pending independent outcome assessment, and displays that pending outcome distinctly. Independent outcome acceptance updates the correct proof state; reopen requires new-epoch outcome evidence/assessment. Add the negative-path regression before changing SuiteGW expectations.

Evidence: [filing.go:236](/Users/nguyenvanlan/Documents/code/pet-projects/matter-control/apps/backend/internal/core/domain/matter/filing.go:236), [filing.go:373](/Users/nguyenvanlan/Documents/code/pet-projects/matter-control/apps/backend/internal/core/domain/matter/filing.go:373), [filing.go:431](/Users/nguyenvanlan/Documents/code/pet-projects/matter-control/apps/backend/internal/core/domain/matter/filing.go:431), [evidence.go:275](/Users/nguyenvanlan/Documents/code/pet-projects/matter-control/apps/backend/internal/core/domain/matter/evidence.go:275), [contract_gw.go:229](/Users/nguyenvanlan/Documents/code/pet-projects/matter-control/apps/backend/internal/adapter/outbound/repotest/mattercontrol/contract_gw.go:229), [contract_gw.go:341](/Users/nguyenvanlan/Documents/code/pet-projects/matter-control/apps/backend/internal/adapter/outbound/repotest/mattercontrol/contract_gw.go:341).

### BF-02 — P1 — The offered no-proof filing option cannot declare the package required to progress

Type: Disconnected frontend/backend journey. Trace: GW-03 / AC-163; BR-003/005.

**Trigger:** Create a filing with proofRequired=no, then use Record the next step to start Package Preparation.

**Observed:** Creation explicitly offers No: only the authority outcome evidence is needed. Backend still requires at least one package criterion and deliberately permits criteria for filings regardless of proofRequired. The filing detail links to the generic work detail for proof, but that page skips the checklist read and the panel hides add-criterion/evidence controls when proofRequired=false. The selectable branch has no UI path to its backend prerequisite.

**Expected:** Every offered creation choice has a reachable authorized path to satisfy its package criteria; signature applicability is a separate OWNER decision.

**Correction:** Drive filing checklist visibility/capabilities from filing semantics, not solely the aggregate proofRequired flag. Clarify the creation label; do not weaken the backend package/signature guards. Coordinate with BF-01.

**Acceptance:** OWNER/EDITOR can create the no-outcome-proof variant, declare and satisfy a package checklist, record signature or OWNER no-signature applicability, then submit; VIEWER still cannot mutate.

Evidence: [filing-forms.tsx:166](/Users/nguyenvanlan/Documents/code/pet-projects/matter-control/apps/frontend/src/features/filings/components/filing-forms.tsx:166), [page.tsx:72](/Users/nguyenvanlan/Documents/code/pet-projects/matter-control/apps/frontend/src/app/(app)/matters/[matterId]/work/[itemId]/page.tsx:72), [proof-panel.tsx:240](/Users/nguyenvanlan/Documents/code/pet-projects/matter-control/apps/frontend/src/features/proof/components/proof-panel.tsx:240), [filing.go:347](/Users/nguyenvanlan/Documents/code/pet-projects/matter-control/apps/backend/internal/core/domain/matter/filing.go:347), [evidence_service.go:432](/Users/nguyenvanlan/Documents/code/pet-projects/matter-control/apps/backend/internal/core/service/evidence_service.go:432).

### BF-03 — P2 — Date entry still defaults to manual UTC instead of the client zone

Type: Time-entry / user decision mismatch. Trace: Direct PO client-timezone instruction; visible time-zone requirement; BR-003/006.

**Trigger:** A Vietnam user enters 10:00 as the local due/completion time and leaves the default offset unchanged.

**Observed:** The form appends +00:00, producing 10:00Z instead of 03:00Z. The offset dropdown is explicit, so this is a misleading/default UX risk rather than hidden backend conversion. Read displays already use the detected zone, which exposes inconsistent input/output behavior. Editing slices current into the field instead of converting into the client zone.

**Expected:** Input uses the detected device zone by default, with a read-only visible zone and correct instant conversion at the selected date.

**Correction:** Reuse useTimeZone and existing date helpers. Remove the manual offset dropdown, convert local wall time with DST-aware validation, preserve the exact original instant on an unchanged edit and preserve pending intent.

**Acceptance:** Test Asia/Ho_Chi_Minh (+07), UTC and a DST-observing zone, including non-hour offsets/gap/overlap policy; untouched edits preserve the instant; completion and due dates use the same rule.

Evidence: [due-field.tsx:19](/Users/nguyenvanlan/Documents/code/pet-projects/matter-control/apps/frontend/src/features/work/components/due-field.tsx:19), [due-field.tsx:29](/Users/nguyenvanlan/Documents/code/pet-projects/matter-control/apps/frontend/src/features/work/components/due-field.tsx:29), [due-field.tsx:48](/Users/nguyenvanlan/Documents/code/pet-projects/matter-control/apps/frontend/src/features/work/components/due-field.tsx:48), [execution-panel.tsx:64](/Users/nguyenvanlan/Documents/code/pet-projects/matter-control/apps/frontend/src/features/work/components/execution-panel.tsx:64), [execution-panel.tsx:165](/Users/nguyenvanlan/Documents/code/pet-projects/matter-control/apps/frontend/src/features/work/components/execution-panel.tsx:165), [use-time-zone.ts:23](/Users/nguyenvanlan/Documents/code/pet-projects/matter-control/apps/frontend/src/hooks/use-time-zone.ts:23).

### BF-04 — P2 — Dependency and filing-Requirement pickers silently stop at the first 200 records

Type: Incomplete relationship selection. Trace: BR-002/003/004; bounded-pagination honesty; approved W1 workload up to300 records/Matter.

**Trigger:** The desired prerequisite or filing Requirement lies after page one.

**Observed:** The pages build options from one list(limit200) response and discard continuation; the selection control has no indication or way to reach later valid records.

**Expected:** An authorized user can find every eligible related record within the supported data size without an unbounded fetch.

**Correction:** Use a bounded paginated/search selector; retain current selections and truthful loading/error/end/truncation states. Do not change authorization or reveal inaccessible names/counts.

**Acceptance:** With >200 records, choose an eligible item beyond page one; revoked/foreign records stay unavailable; search does not submit the parent form or replace the whole page.

Evidence: [page.tsx:70](/Users/nguyenvanlan/Documents/code/pet-projects/matter-control/apps/frontend/src/app/(app)/matters/[matterId]/work/[itemId]/page.tsx:70), [dependency-panel.tsx:124](/Users/nguyenvanlan/Documents/code/pet-projects/matter-control/apps/frontend/src/features/work/components/dependency-panel.tsx:124), [page.tsx:42](/Users/nguyenvanlan/Documents/code/pet-projects/matter-control/apps/frontend/src/app/(app)/matters/[matterId]/filings/new/page.tsx:42).

### BF-05 — P2 — An independent verifier has no pending-assessment queue

Type: Product workflow gap. Trace: Review-and-prove journey; BR-005; GW-01/02/03.

**Trigger:** A contributor submits evidence and a different designated verifier is expected to assess it.

**Observed:** My Work includes only items owned by the actor; its four queues have no assessment queue. The assessment control is available only after the verifier locates the exact item/criterion. No pending-review dispatch surface was located.

**Expected:** The verifier can discover their pending review without knowing the item in advance.

**Correction:** Propose an authorized pending-assessment read model and Reviews due queue. This is a product flow/read-model extension, not an allegation that the existing owner-assignment endpoint violates its declared contract.

**Acceptance:** A designated independent verifier sees the pending claim/version and opens its exact context; submitter cannot self-assess; revoked access removes rows and derived counts.

Evidence: [work_service.go:1269](/Users/nguyenvanlan/Documents/code/pet-projects/matter-control/apps/backend/internal/core/service/work_service.go:1269), [my-work-selection.ts:3](/Users/nguyenvanlan/Documents/code/pet-projects/matter-control/apps/frontend/src/features/work/my-work-selection.ts:3), [proof-panel.tsx:137](/Users/nguyenvanlan/Documents/code/pet-projects/matter-control/apps/frontend/src/features/proof/components/proof-panel.tsx:137).

### BF-06 — P2 — Root and default login return open Workspaces instead of My Work

Type: Entry-point inconsistency. Trace: Selected focused-workbench / My Work-first experience.

**Trigger:** A returning contributor signs in without a deep-link return target.

**Observed:** Root and OIDC fallback target /workspaces, adding workspace/Matter browsing before assigned work.

**Expected:** Default arrival exposes the current next work; explicit valid deep links keep their target.

**Correction:** Align both defaults to /my-actions with existing safeReturnTo behavior. Keep new-user empty-state guidance to workspace creation.

**Acceptance:** Root and default login land on My Work; authorized deep links and safe fallback remain correct; no-work users have a clear path forward.

Evidence: [page.tsx:3](/Users/nguyenvanlan/Documents/code/pet-projects/matter-control/apps/frontend/src/app/page.tsx:3), [flow.ts:85](/Users/nguyenvanlan/Documents/code/pet-projects/matter-control/apps/frontend/src/lib/oidc/flow.ts:85), [product-design-brief.md:217](/Users/nguyenvanlan/Documents/code/pet-projects/matter-control/docs/design/legal-team-experience-20261029/product-design-brief.md:217).

### BF-07 — P2 — Matter root does not expose the operational brief already available in Control Room

Type: Information architecture / operational comprehension. Trace: Morning comprehension journey; BR-001/002; AC-137.

**Trigger:** A transaction lead opens a Matter to learn what changed, what blocks closing and who acts next.

**Observed:** The root shows a limited attention/own-work surface plus member administration/history; Control Room is another of ten peer tabs. Critical exposure requires the user to know which destination contains operational truth.

**Expected:** Matter arrival surfaces current truth, cause, next actor, proof/filing exposure, meaningful date and changes with secondary administration behind intentional navigation.

**Correction:** Design Matter root as the operational brief using existing reads, and reduce navigation choices through grouping. Preserve deep links, membership management and history. This is a design recommendation, not permission to remove functions.

**Acceptance:** Run the approved comprehension protocol; users answer the required questions from the landing screen, with unknown/stale states explicit.

Evidence: [page.tsx:108](/Users/nguyenvanlan/Documents/code/pet-projects/matter-control/apps/frontend/src/app/(app)/matters/[matterId]/page.tsx:108), [page.tsx:124](/Users/nguyenvanlan/Documents/code/pet-projects/matter-control/apps/frontend/src/app/(app)/matters/[matterId]/page.tsx:124), [control-room-view.tsx:82](/Users/nguyenvanlan/Documents/code/pet-projects/matter-control/apps/frontend/src/features/control/components/control-room-view.tsx:82), [matter-tabs.tsx:22](/Users/nguyenvanlan/Documents/code/pet-projects/matter-control/apps/frontend/src/features/matters/components/matter-tabs.tsx:22).

### BF-08 — P2 — The primary Matters destination first lists Workspaces

Type: Matter discovery gap. Trace: Legal-team navigation / readable context.

**Trigger:** A manager knows a Matter title or attention state but not which Workspace contains it.

**Observed:** Discovery is Workspace then title/role Matter list; no one-step cross-workspace search with owner/due/attention context.

**Expected:** A named Matter is discoverable from the primary Matters entry without guessing its container.

**Correction:** First align labels with current scope; separately design a bounded authorized cross-workspace Matter discovery read model if adopted. No frontend fan-out that bypasses authorization.

**Acceptance:** Find an accessible Matter by name from one entry; show Workspace context and honest pagination. Optional owner/attention search requires explicit read-model support.

Evidence: [page.tsx:17](/Users/nguyenvanlan/Documents/code/pet-projects/matter-control/apps/frontend/src/app/(app)/workspaces/page.tsx:17), [workspace-list.tsx:20](/Users/nguyenvanlan/Documents/code/pet-projects/matter-control/apps/frontend/src/features/workspaces/components/workspace-list.tsx:20), [matter-list.tsx:48](/Users/nguyenvanlan/Documents/code/pet-projects/matter-control/apps/frontend/src/features/matters/components/matter-list.tsx:48), [schemas.ts:7](/Users/nguyenvanlan/Documents/code/pet-projects/matter-control/apps/frontend/src/features/matters/schemas.ts:7).

### BF-09 — P2 — Work detail presents several valid control groups without one primary next operation

Type: Task decision load. Trace: Selected focused-workbench experience; execution journey; BR-003.

**Trigger:** An editor opens a Ready Action and must decide between execution, proof, dependencies and metadata controls.

**Observed:** State/outcome/execution/proof/dependency/detail/escalation regions are composed sequentially. The user must derive the meaningful next operation.

**Expected:** Why now, required outcome and one appropriate primary action lead; secondary/owner-only changes remain discoverable.

**Correction:** Use current state/role-derived capabilities for the primary operation and progressive disclosure for secondary controls, without inventing a generic merged task lifecycle.

**Acceptance:** Users correctly predict the operation and its consequence; blocked/waiting/view-only records show an honest reason/path, not a misleading enabled completion action.

Evidence: [page.tsx:128](/Users/nguyenvanlan/Documents/code/pet-projects/matter-control/apps/frontend/src/app/(app)/matters/[matterId]/work/[itemId]/page.tsx:128), [page.tsx:218](/Users/nguyenvanlan/Documents/code/pet-projects/matter-control/apps/frontend/src/app/(app)/matters/[matterId]/work/[itemId]/page.tsx:218), [page.tsx:244](/Users/nguyenvanlan/Documents/code/pet-projects/matter-control/apps/frontend/src/app/(app)/matters/[matterId]/work/[itemId]/page.tsx:244), [page.tsx:302](/Users/nguyenvanlan/Documents/code/pet-projects/matter-control/apps/frontend/src/app/(app)/matters/[matterId]/work/[itemId]/page.tsx:302).

### BF-10 — P2 — Status Brief requires technical timestamps and renders raw event/target identifiers

Type: Manager reporting usability. Trace: Communicate progress journey; BR-007.

**Trigger:** A manager wants changes this week and outstanding work at the end of that period.

**Observed:** Brief lives in Data with import/export, uses t1/t2 RFC3339 inputs, and renders event type/target kind/raw targetId as primary change descriptions.

**Expected:** Ordinary date-range selection and readable object names/links; exact provenance remains available in details.

**Correction:** Expose Create status brief from Matter context, use the same client-zone input model, map historical targets to safe attributable labels without inventing unavailable historic titles.

**Acceptance:** A manager produces a readable draft without typing timestamps or interpreting IDs; changes versus outstanding-at-t2 and late-recorded/effective dates remain distinct; export remains permission scoped.

Evidence: [page.tsx:48](/Users/nguyenvanlan/Documents/code/pet-projects/matter-control/apps/frontend/src/app/(app)/matters/[matterId]/data/page.tsx:48), [brief-section.tsx:38](/Users/nguyenvanlan/Documents/code/pet-projects/matter-control/apps/frontend/src/features/data-transfer/components/brief-section.tsx:38), [brief-section.tsx:133](/Users/nguyenvanlan/Documents/code/pet-projects/matter-control/apps/frontend/src/features/data-transfer/components/brief-section.tsx:133).

## Fresh checks actually executed

- Backend `go test -race -count=1 -json ./internal/adapter/outbound/repotest/mattercontrol -run ^TestSuite(GW|Review)_MemoryStore$`: exit0;19 test pass events including two parent suites,0fail/0skip. These cover all three GW service paths plus review contracts on the memory adapter only. No new PostgreSQL fixture was started or used.
- Frontend installed Vitest across evidence-basis, agenda logic/view, My Actions view, answer-form and cell-detail:6files/54tests PASS, exit0. These are component/model seams, not a connected browser flow.
- Passing tests do not refute BF-01: the GW fixture explicitly expects the disputed pre-submission/final aggregate behavior. That is a specification-vs-test-design gap. BF-02 is a route-to-capability mismatch; no test in this selected set exercises the whole no-proof filing UI path.
- No source fix, full make/check/build, PostgreSQL, browser/IdP, restore, load or human AC-137 trial run in this review.

## Proposed correction order

1. Backend architecture + BA: agree the smallest explicit package/outcome criterion contract for BF-01; preserve old proof/epochs/history. Frontend: restore the reachable filing checklist flow BF-02 against those capabilities. Add red-first regression and then source/PG/HTTP checks.
2. Frontend owner: unify client-zone date entry BF-03 and bounded searchable relationship selection BF-04. No new generic wizard.
3. Product/FE: align default landing BF-06 and operational Matter arrival BF-07; preserve all deep links, current state and administration functions.
4. Product/API/FE: design and deliver the verifier queue BF-05 and optional cross-workspace Matter discovery BF-08 with explicit authorized read models.
5. FE: focused next operation BF-09 and human-readable Brief BF-10.
6. Run end-to-end synthetic OWNER/EDITOR/independent-verifier/VIEWER journeys across GW-01/02/03, including denial, reopen, stale version, UNKNOWN retry and >200-record selection; then the existing human comprehension protocol.

Playbooks, intake, knowledge, connectors and AI remain separately scoped Eigenwelt recommendations; their absence is not counted as a failure of the approved P0 business flows in this review.

Skipped: product source fixes, browser/human verification, fresh PostgreSQL/IdP/restore/cloud execution and commit/push/deploy. Remaining risk: the identified source/model mismatches are not repaired; successful service/component tests do not establish correct or usable complete legal-team journeys.
