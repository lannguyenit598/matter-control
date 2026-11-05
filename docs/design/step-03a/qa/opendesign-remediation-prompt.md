# MC-003A — Complete design-owner remediation prompt

PREPARED / NOT_DISPATCHED. The OpenCode attempt returned HTTP403, not an independent QA verdict. This prompt carries Codex intake findings only. It does not authorize transmission to a design service, artifact mutation, visual-direction approval or Step03B. Use after PO authorizes the focused owner rework and its input handoff.

Copy the entire block below. Supply the exact recovered artifacts and authoritative policies through the approved handoff route. If a required input is unavailable, identify the missing input instead of inventing policy.

```text
TASK: MC-003A — Focused correction of recovered exploratory UX design.
OWNER: Actual OpenDesign design owner. Codex orchestrates; Claude Code owns Solution Architecture; Product Owner approves design direction.

CONTEXT AND EVIDENCE
MatterControl is the Control Plane for High-Stakes Legal Work and System of Operational Truth for Complex Legal Matters. Initial vertical: Transactions & Corporate Legal Work. Positioning and approved P0/P1/P2 stay fixed.
Governance baseline e377568ac47f8f1b88e3875a8f13d7e57fc30667; approved product requirements subject572835a. Step02.3 architecture work remains separate and open. Current task state REWORK_REQUIRED.
Confirmed design brief: cross-platform, connected flows, exploratory concept; desktop-first productivity with deliberate mobile adaptation. Stop at the PO design direction gate. No high-fidelity or production code.
Original OpenDesign Cloud run b54045a0-53a9-4968-a5b1-1d28e8454bf0 FAILED timeout, exit130. Three outputs were recovered; they are historical drafts, not an accepted successful handoff. OpenCode independent QA attempt ses_e8f618776ffeEBB1snGcdFwlnn returned HTTP403 with no review text. Do not claim OpenCode endorsed the findings or a QA PASS exists.

INPUTS — preserve original bytes; correct a separate new revision
1. mattercontrol-step-03a-ux-concept-review.html
   SHA2566000190940fe42128009ce06b220a1d858228f346c1022a190c8de4eafa4cd4a,315229bytes.
2. mattercontrol-step-03a-ux-specifications.md
   SHA2563b48b195d6623267165f4c94d3dc5522ced3cec14516bc7ab7e48d54d8f30bbd,51903bytes.
3. mattercontrol-step-03a-handoff-report.md
   SHA256faf3a981fee1795d7e99d9cd7391703cb1faced429fa8d772aea6a69c649e7f6,19686bytes.
4. docs/requirements/business-rules.md — authoritative RULE-001..021.
5. docs/requirements/state-semantics.md — authoritative transitions and independent axes.
6. docs/requirements/permission-matrix.md — approved roles and scopes.
Original source locations are docs/design/step-03a/export/ in the MatterControl governance repository. No whole-repository upload, real legal matter data, credentials or logs.

MANDATORY CORRECTIONS — CODEX INTAKE FINDINGS, NOT INDEPENDENT QA

UX-R01 HIGH: Bulk field policy.
Evidence: HTML2852,3258,3312 enables Workstream;2404 labels it approved baseline; specs§7 and decision log repeat it.
Approved RULE-013 P0 allowlist: title/description, assigned INTERNAL owner, due date. Workstream reassignment is not an approved P0 bulk field. The prior Codex commissioned wrapper incorrectly said owner/date/workstream; correct this design against actual policy and disclose the correction. Do not rewrite the historical wrapper.
Update all controls, preview/apply logic if mocked, screen specifications, interaction patterns, examples, test tasks and decision log consistently. Keep type, relationships, waiting/state/verification/criteria/roles out of unrestricted bulk fields. Workstream bulk exploration must be clearly separate and pending a material product-policy decision.
Preserve per-record atomic change+audit; valid rows may succeed, rejected rows retain old values with exact reasons and retry guidance. Recheck permission/revision at commit. Keep failed-row selection; do not report global success. No bulk verify, waiver, document promotion or destructive delete.

UX-R02 HIGH: Already-approved policy presented as undecided.
Evidence: HTML2329,2331,3037; specs§12 A-13 and Status Brief; handoff§7/8.
Do not ask PO to choose per-row vs whole-batch business atomicity: RULE-013 already decides per-record behavior. RULE-014 defines connected import groups: an invalid connected group is rejected whole; valid independent groups may succeed. Duplicate identity/content retries do not create duplicates; changed content is a conflict. Imported VERIFIED labels remain source claims, never authority.
Active Workspace membership AND explicit Matter membership AND operation permission are required. Scoped OWNER/EDITOR/VIEWER can read/export; VIEWER cannot edit/verify. Workspace OWNER is not automatic confidential Matter reader. Assignment grants no access. Designated EDITOR/OWNER verifier must differ from submitter; OWNER status alone is not verifier designation. No one-person self-review override.
RULE-016 P0 Status Brief is a draft view/export with scope,t1,t2 and t1<=t2. Separate changes in(t1,t2] from outstanding at t2; stable order and provenance; same authorized source/window yields same business facts. No-change explicit. Managed issued-report approval/immutable retained snapshots are P1. Rights are rechecked at retrieval. Keep these settled; leave implementation mechanisms PENDING_ARCHITECTURE.

UX-R03 MEDIUM: Decision ID collision and fictional approvals.
Evidence: HTML2399 uses D-01 for a design proposal;2428 uses D-01 for Atlas readiness timing; handoff§7 asks real PO to resolve fictional case questions.
Use UX-DEC-* for actual design choices; DEC-AT-01/02 for synthetic Atlas scenario decisions. Clearly label synthetic matter data. Do not turn readiness timing or signature follow-up priority in Atlas into unresolved MatterControl policy approvals. PO design questions should concern IA/hierarchy, visual direction, density and mobile presentation. Do not silently change approved business rules.

UX-R04 MEDIUM: Ambiguous gate explanations.
Evidence: HTML1405/2401 wording differs from correctly parenthesized source3446; specs§4 has a more explicit formula.
Preserve five separate axes: execution,verification,dependency,timing,attention. COMPLETED is not VERIFIED; WAITING is not BLOCKED. Requirement is an outcome; Action is activity; no auto-completion across them. Evidence Requirement is a criterion; Evidence is supplied proof; upload is never verification.
Use precise applicable semantics: milestone RULE-008 requires COMPLETED AND(VERIFIED OR explicit valid NOT_REQUIRED) AND dependencyREADY for each required prerequisite. RULE-003 dependency edges independently require upstream dependencyREADY and executionCOMPLETED; proof edges additionally require VERIFIED with valid proof. Do not treat NOT_REQUIRED as a blanket waiver of proof-edge verification. Raise any genuine normative conflict to the architect/PO rather than changing policy in UX.
Aggregate verification reflects all applicable mandatory criteria; one accepted file does not establish all criteria. Disputes invalidate satisfaction; no arbitrary aggregate dropdown. Review exact criterion/evidence version, valid proof and independent designated reviewer. Version promotion OWNER-only with reason/expected prior revision; new upload does not auto-promote. Cancellation is not satisfaction. Reopen/reversal may reblock downstream; preserve historical execution/reviews.

UX-R05 MEDIUM: Prototype coverage and mobile reachability.
Evidence: HTML3248 displays only first8 mobile rows;1814 discloses absent real inline edit/copy-paste;3823..3854 upload/review feedback leaves aggregates unchanged.
Make later records reachable for mobile read/triage through a specified search/filter/paging path. Desktop-only advanced bulk may be a design proposal; it must not require desktop to read later records.
Classify each screen and Golden Workflow stage as stateful simulated interaction, static illustration or specification-only. Existing feedback-only verification does not execute the full submit->verify->satisfy->all-gates-recalculate->downstreamReady->ControlRoom/brief-update chain. Either provide a consistent staged synthetic simulation respecting every gate, or explicitly label unimplemented later stages. No claim of completed connected flow based on static screens/toasts.
Keep24 base records distinct from labeled50/100/200 density extensions. Preserve synthetic scenario identity and distinguish any adaptation from canonical fixture parity; the canonical dataset source was not supplied in the QA packet, so do not claim full parity. Use explicit T0/T-1 and UTC+07. No readiness percentage or invented legal conclusions.

PRESERVE THE DESIGN EXPLORATION
All13 requested surfaces: Matter List,Control Room,Operational Grid,My Actions,Waiting On,Requirement Detail,Action Detail,Dependency View,Evidence & Verification,Document Versions,Filing Detail,Import Wizard,Status Brief. Include goals,hierarchy,actions,states,navigation,loading/empty/error,desktop/mobile. Combine drawers where helpful; retain dense desktop Grid.
All16 deliverable areas: UX brief,personas,IA,primary flows,screen inventory,Control Room wireframe,Grid wireframe,three Golden Workflow designs,three visual directions,initial design system,interaction specifications,responsive strategy,accessibility strategy,usability plan,architecture dependency list,design decision log.
Compare the same Atlas content in A Precision & Clarity,B Modern Operational Intelligence,C Minimal Professional Control Surface. Recommendation is a proposal only. Keep typography,color,density,layout,navigation,motion/accessibility strengths and trade-offs explicit.
Auth/API/loading/pagination/backend validation/concurrency/optimism/error mechanisms/persistence/realtime remain PENDING_ARCHITECTURE. Preserve known user-visible business outcomes without inventing technical implementations.
Usability tests and accessibility audit remain NOT_RUN unless actually performed. Show keyboard/focus restoration,non-color labels,clear dates,reduced motion,and error recovery expectations. Do not execute imported HTML resources/formulas/macros as a validation shortcut.

REQUIRED RETURN
1. Actual owner/tool/version,task/project,input revision and new output revision.
2. Separate corrected artifacts; historical exports unchanged.
3. Exact changed-file list and change log mapping UX-R01..05.
4. Per-finding PASS/FAIL/UNRESOLVED with line/section evidence; acceptance claims scoped to actual checks.
5. Interactive vs static/spec-only coverage matrix for13 screens and3 Golden Workflows.
6. Tests actually run with command/environment/time/exit, and NOT_RUN list.
7. Remaining product/architecture questions limited to real unresolved decisions.
8. Independent QA and PO design approval explicitly PENDING.
Keep MC-003A REWORK_REQUIRED until important corrections are independently accepted. Stop before Step03B/high-fidelity/frontend implementation. Do not initiate a nested design workflow, provider switch, authentication or deployment.
```
