TASK MC-003A. You are the external design owner producing actual exploratory UX artifacts. Codex orchestrates; do not impersonate architecture or engineering owners.
Confirmed brief: Cross-platform; Connected flows; Exploratory concept. Keep desktop-first Operational Grid and deliberately adapted mobile flows. User approval is only brief confirmation, NOT visual direction approval.
Produce a browsable HTML concept review artifact plus Markdown specifications where supported, within this isolated project. No production app implementation. Stop at the PO design review gate. Include actual Control Room and Grid wireframes, THREE contrasting visual direction boards A/B/C, recommendation and UX trade-offs. Explore comparable same-content screens for each direction rather than merely swapping a color. Connect blocker → requirement → evidence → review → downstream readiness → status brief. Provide DD import and filing journey at concept depth, plus all 13 screen specifications and all 16 deliverable areas in the request. Use Vietnamese explanatory design review copy and clear product labels; do not invent real legal conclusions.
Governance input revision e377568ac47f8f1b88e3875a8f13d7e57fc30667; requirements approved 572835a. Requirement reference families FR-001..020/NFR-001..014/RULE-001..021 are not supplied in full; do not invent per-ID text or claim full trace verification.
Architecture gate remains open and Step02.3 runs separately. Mark auth/API/pagination/validation/concurrency/optimism/errors/persistence/realtime PENDING_ARCHITECTURE. Show expected visible behavior only.
Approved semantic constraints: no auto completion from Action to Requirement; upload is never verification. Execution COMPLETED can remain UNVERIFIED. Evidence review targets exact criterion and document version by a designated independent verifier who is not submitter. Verification aggregate is derived, not a free dropdown. Subject satisfies a proof gate only when COMPLETED plus VERIFIED (or explicit valid NOT_REQUIRED); disputes invalidate satisfaction. Dependency readiness is derived, never manually force READY. Reopen/reversal can reblock downstream without erasing history. OWNER-only cancellation/reopen and authoritative-version promotion. OWNER/EDITOR/VIEWER matter roles differ from personas. Active workspace AND matter membership required; VIEWER reads/exports but cannot edit/verify. Bulk editing is allowed metadata (owner/date/workstream), not unrestricted bulk status transitions; preview per-row permission/revision failures and preserve successful/failed selections distinctly. Dates explicit timezone/as-of. Unavailable evaluation never defaults READY. No overall readiness percent.
Use the established Project Atlas fixture as a design adaptation with explicit changes rather than claiming historical fixture conforms automatically:
T0 15 Jun 2026 09:00 UTC+07; T-1 14 Jun 2026 09:00. 6 workstreams Approvals/DD/Documents & Signatures/Funding Transfer Closing/Regulatory Filings/Post-Closing. 3 milestones Readiness Review 14 Jun, Closing 18 Jun, Filing Review 22 Jun at17:00 UTC+07.
12 Requirements RQ-01 internal approval COMPLETED VERIFIED; RQ-02 change consent COMPLETED UNVERIFIED missing acknowledgement; RQ-03 DD review COMPLETED VERIFIED; RQ-04 DD evidence gap WAITING UNVERIFIED due14Jun waiting Cedar Seller Demo; RQ-05 agreement content COMPLETED VERIFIED; RQ-06 signatures IN_PROGRESS PARTIALLY_VERIFIED due16Jun; RQ-07 payment NOT_STARTED UNVERIFIED due17Jun; RQ-08 transfer/closing NOT_STARTED UNVERIFIED due18Jun; RQ-09 postclosing approval NOT_STARTED UNVERIFIED due22Jun; RQ-10 notice outcome WAITING PARTIALLY_VERIFIED due20Jun; RQ-11 supplement NOT_STARTED UNVERIFIED; RQ-12 handover NOT_STARTED UNVERIFIED. 12 distinct AC-01..12 Actions supporting these outcomes; AC-05 tracks second signature WAITING and BLOCKED; AC-04 seller followup WAITING but dependency READY; AC-07 payment, AC-08 closing, AC-09 filing BLOCKED. Chain RQ-04→AC-05→AC-07→AC-08→AC-09; separate satisfied RQ-05→AC-05 edge, AC-10→AC-11 and RQ-11→AC-12. Annotate proof/execution gates compatibly with approved semantics, not old execution-only legal sufficiency assumptions.
5 docs/10 versions: approval v1 superseded v2 current; DD pack v1 superseded v2 current; agreement v1/v2 superseded v3 current partially signed1/2; closing checklist v1 draft current, not completion proof; filing notice v1 superseded v2 submitted. 12 evidence criteria,5 supplied records. Missing ER-02 consent acknowledgement and ER-04 gap proof prominently. Correct historical self-verifier examples in adaptation: ensure reviewer differs from submitter; version promotion explicit OWNER event. Three fictional parties Cedar Seller Demo, Elm Signatory Demo, Harbor Registry Demo. FIL-01 unsubmitted; FIL-02 Authority Review WAITING receipt present/outcome missing. Two open decisions readiness timing/signature followup priority (neither overrides gates), one DD finding, one closing delay risk. All synthetic. 24 base records, optional 50/100/200-row synthetic density extensions distinctly labeled.
No invented usability PASS or external tests, fonts/licenses claims, production persistence, auth enforcement. Mark prototype transitions simulated. Design system exploratory, not approved. Include loading/empty/error/denied/stale/conflict/partial success cases; reduced motion and keyboard/focus restoration. Explicitly list screens actually interactive vs specification-only, evidence limitations, outstanding approval decisions, artifact filenames and provenance.
Return initial acknowledgement in output and final completion/handoff report. Do not route this request into another OpenDesign workflow.
FULL USER REQUEST:
# MATTERCONTROL — STEP 03A PRODUCT UX DESIGN

## YOUR ROLE

Bạn là **OpenDesign — Lead Product Designer, UX Architect và UI Design Authority** cho MatterControl.

Bạn chịu trách nhiệm thiết kế trải nghiệm của một sản phẩm phần mềm dành cho các legal và transaction teams thực hiện công việc phức tạp, có tính rủi ro cao.

Bạn không phải Solution Architect hoặc Frontend Engineer.

Ưu tiên usability, operational clarity, productivity, trust và accessibility.

## 1. PRODUCT IDENTITY

**Name:** MatterControl

**Positioning:** Control Plane for High-Stakes Legal Work.

**Official Core Positioning:**

MatterControl gives legal and transaction teams a single operational view of matter state, dependencies, blockers, evidence, decisions, and change history.

**Product Principle:**

The System of Operational Truth for Complex Legal Matters.

**Initial Vertical:**

Transactions & Corporate Legal Work.

MatterControl phải giúp người dùng hiểu và điều hành một legal matter phức tạp, thay vì quản lý generic tasks.

## 2. PRODUCT PHILOSOPHY

MatterControl must model the truth of legal work, not merely display tasks.

Một legal matter chứa nhiều mối quan hệ:

- Requirements.
- Actions.
- Milestones.
- Dependencies.
- Evidence.
- Documents.
- Approvals.
- External parties.
- Decisions.
- Findings.
- Risks.
- Filings.
- Deadlines.
- Event History.

Người dùng phải có thể hiểu:

1. What is true now?
2. What changed?
3. What is blocked?
4. Why is it blocked?
5. What can I act on now?
6. Who owns the next action?
7. What are we waiting for?
8. What evidence proves completion?
9. What decisions require attention?
10. What happens next?

Không thiết kế như:

- Generic task manager.
- Legal-themed Jira.
- Traditional ERP.
- Spreadsheet replacement đơn thuần.
- Generic SaaS dashboard.
- AI chatbot.
- Workflow builder.
- Virtual data room.

## 3. USER PERSONAS

### A. Transaction Owner / Manager

Cần:

- Understand overall matter state.
- Identify critical blockers.
- Monitor milestones.
- See next actions.
- Understand Waiting On.
- Find important decisions.
- Identify missing evidence.
- Review changes since last visit.

### B. Contributor

Cần:

- See actionable work.
- Know assignments.
- Understand blockers.
- Update requirements/actions quickly.
- Add evidence.
- Perform bulk edits.
- Work with many records.
- Track deadlines.

### C. Reviewer

Cần:

- Inspect evidence.
- Distinguish Completed from Verified.
- Identify stale/missing documents.
- Review document versions.
- Understand legal context.
- Verify or reject evidence according to permissions.
- Inspect change history.

Do not assume one dashboard serves all personas equally.

## 4. FIVE STATE DIMENSIONS

The UX must distinguish:

### Execution State

- NOT_STARTED.
- IN_PROGRESS.
- WAITING.
- COMPLETED.
- CANCELLED.

### Verification State

- NOT_REQUIRED.
- UNVERIFIED.
- PARTIALLY_VERIFIED.
- VERIFIED.
- DISPUTED.

### Dependency State

- READY.
- BLOCKED.

### Timing State

- ON_TRACK.
- DUE_SOON.
- OVERDUE.

### Attention State

- NORMAL.
- ATTENTION.
- CRITICAL.

Never communicate:

COMPLETED = VERIFIED.

A Requirement can be completed but still unverified.

A Requirement can be not started and blocked.

An Action can be waiting on an external party without being actionable by the current user.

Design states must communicate these distinctions clearly without overwhelming the user with badges.

## 5. IMPORTANT DOMAIN DISTINCTIONS

### Requirement vs Action

Requirement = an outcome or condition that must be satisfied.

Action = a human activity performed to progress or satisfy a Requirement.

Example:

Requirement:
Regulatory Approval Obtained.

Actions:
- Prepare application.
- Gather documents.
- Submit filing.
- Respond to authority.

A Requirement can remain WAITING even when no Action is currently available.

### Evidence Requirement vs Evidence

Evidence Requirement = what is needed to prove an outcome.

Evidence = what has actually been provided.

Example:

Evidence required:
- Executed SPA.
- Payment Confirmation.

Evidence supplied:
- Executed SPA accepted.
- Payment Confirmation missing.

Do not show "2 files uploaded" as equivalent to "evidence complete."

### Dependency

Dependencies determine what can proceed.

Example:

Payment Confirmation
→ Share Transfer
→ Share Register Update.

The interface must explain:

"Share Transfer is blocked because Payment Confirmation has not been satisfied."

Do not display a decorative dependency graph disconnected from operational state.

### Document Versions

Example:

SPA v5
→ SPA v6
→ SPA Agreed Form
→ SPA Execution Version
→ SPA Executed.

Users must quickly identify the current authoritative version.

### Filing Lifecycle

Preparation
→ Review
→ Signature Collection
→ Submission
→ Receipt
→ Authority Review
→ Supplement
→ Response
→ Approval.

Users need clear visibility of filing progress and waiting states.

## 6. THE TWO PRIMARY EXPERIENCES

### EXPERIENCE A — MATTER CONTROL ROOM

Purpose:

**Comprehension and exception management.**

A Manager should rapidly understand:

- Current matter condition.
- Critical blockers.
- Upcoming milestones.
- Next actions.
- Waiting On.
- Evidence gaps.
- Decisions required.
- Recent changes.

Do not create a dashboard dominated by pie charts, completion metrics or generic widgets.

Use hierarchy, grouping and relationships to direct attention.

If readiness percentage has not been formally approved, do not invent one.

### EXPERIENCE B — OPERATIONAL GRID

Purpose:

**Fast, accurate execution of operational work.**

The product must support legal power users working with 50–200 rows.

Explore:

- Dense but readable grid.
- Inline editing.
- Multi-select.
- Bulk status changes.
- Bulk owner assignment.
- Bulk date changes.
- Workstream reassignment.
- Sorting/filtering.
- Keyboard navigation.
- Copy/paste.
- Import.
- Export.
- Contextual detail panels.
- Evidence completeness indicators.

Do not replace the Operational Grid with cards only.

Do not copy Excel into the browser without improving the experience.

Control Room and Operational Grid must complement each other.

## 7. THREE GOLDEN WORKFLOWS

### GW-01 — Transaction / Restructuring

Approval
→ Document
→ Signature
→ Payment
→ Transfer
→ Closing
→ Filing
→ Post-Closing.

Design a journey:

Open Matter
→ See Critical Blocker
→ Understand Why
→ Open Requirement
→ Identify Missing Evidence
→ Submit Evidence
→ Verify Evidence
→ Satisfy Requirement
→ Recalculate Dependency State
→ Downstream Requirement Becomes READY
→ Control Room Updates
→ Status Brief Reflects Changes.

### GW-02 — Due Diligence

Request
→ Document
→ Review
→ Gap
→ Finding
→ Follow-Up
→ Resolution.

Design a journey:

Import Excel/CSV
→ Map Columns
→ Preview Records
→ Create Structured Requirements
→ Review Evidence
→ Identify Missing/Stale Evidence
→ Record Finding
→ Assign Follow-Up
→ Track Resolution.

Prioritize operational efficiency and realistic information density.

### GW-03 — Regulatory Filing

Requirement
→ Package Preparation
→ Signature
→ Submission
→ Receipt
→ Authority Review
→ Supplement
→ Response
→ Approval.

Design a journey:

Open Filing
→ Inspect Package Completeness
→ Identify Missing Documents
→ Track Signatures
→ Submit
→ Record Filing Reference
→ Enter WAITING ON AUTHORITY
→ Receive Supplement Request
→ Assign Response Actions
→ Record Approval.

Do not over-engineer these workflows into a generic workflow builder.

## 8. SYNTHETIC DESIGN DATASET

Use:

**Project Atlas — Acquisition & Corporate Restructuring**

Suggested dataset:

- 5–6 Workstreams.
- 3 Milestones.
- 20–30 Requirements/Actions.
- 5–8 Dependencies.
- 5 Documents.
- Multiple Document Versions.
- 3 External Parties.
- 2 Filing Processes.
- Several Evidence Requirements.
- 2 Open Decisions.
- 1–2 Findings.
- 1 Risk.
- 1 Critical Blocker Chain.

Include:

- Completed + Verified.
- Completed + Unverified.
- Blocked.
- Waiting.
- Overdue.
- Missing Evidence.
- Superseded Document.
- Partially Signed Document.
- Filing Waiting on Authority.

Use only synthetic data.

Do not fabricate real client information or legal conclusions.

## 9. UX PRINCIPLES

Apply:

1. State before navigation.
2. Exceptions before normality.
3. Explain system state.
4. Progressive disclosure.
5. Reduce cognitive load.
6. Visual relationships matter.
7. Motion communicates state transitions.
8. Desktop-first productivity.
9. Keyboard efficiency.
10. Accessibility by design.
11. Clear, unambiguous dates.
12. Trustworthy and consistent feedback.

An outstanding UX is one that helps legal users work faster and make fewer mistakes.

Visual polish is important but secondary to product correctness and comprehension.

## 10. DESIGN TASK A — INFORMATION ARCHITECTURE

Produce:

- Persona-focused journeys.
- Information architecture.
- Main navigation structure.
- Screen inventory.
- Core task hierarchy.
- Object relationships.
- Contextual navigation patterns.

Explain how the user moves between:

Matter
→ Workstream
→ Requirement
→ Action
→ Evidence
→ Document
→ Dependency
→ History.

Avoid excessive navigation depth.

## 11. DESIGN TASK B — UX WIREFRAMES

Design UX wireframes for:

1. Matter List.
2. Matter Control Room.
3. Operational Grid.
4. My Actions.
5. Waiting On.
6. Requirement Detail.
7. Action Detail.
8. Dependency View.
9. Evidence & Verification.
10. Document Versions.
11. Filing Detail.
12. Excel/CSV Import Wizard.
13. Status Brief.

Screens can be combined with drawers, panels and modals when this reduces context switching.

Do not create unnecessary separate pages.

For each, specify:

- Main user goal.
- Information hierarchy.
- Main actions.
- Primary states.
- Navigation.
- Loading/empty/error states.
- Desktop behavior.
- Mobile behavior where appropriate.

## 12. DESIGN TASK C — THREE VISUAL DIRECTIONS

Explore three contrasting visual directions:

### Direction A — Precision & Clarity

Highly readable, calm, professional, with strong information hierarchy.

### Direction B — Modern Operational Intelligence

A refined operational command center emphasizing state, context and relationships.

### Direction C — Minimal Professional Control Surface

Minimal visual noise, efficient workflows and excellent information density.

For each direction provide:

- Concept.
- Typography.
- Color system.
- Layout.
- Navigation.
- Component language.
- Density.
- Motion philosophy.
- Accessibility.
- Strengths.
- Trade-offs.

Recommend the best direction with rationale.

Do not finalize the selected visual direction without Product Owner approval.

## 13. DESIGN TASK D — DESIGN SYSTEM EXPLORATION

Prepare an initial design system:

- Typography.
- Semantic colors.
- Spacing.
- Grid.
- Breakpoints.
- Component structure.
- Density variants.
- Interactive states.
- Focus/hover/disabled behavior.
- Icons.
- Motion guidelines.
- Reduced motion.
- Accessibility requirements.

Frontend implementation uses:

**Next.js + Atomic Design**

Reference repository:

https://github.com/lannguyenit598/nextjs-atomic-starter

The actual repository implementation must be verified by Antigravity.

Do not assume library versions or components that have not been verified.

## 14. DESIGN TASK E — INTERACTION DESIGN

Focus on meaningful interactions:

- Explain why a Requirement is blocked.
- Highlight downstream dependency impact.
- Open contextual detail without losing grid position.
- Preview bulk operation results.
- Show partial success/failure clearly.
- Navigate Evidence Requirements.
- Verify or reject evidence.
- Identify current Document Version.
- Show Waiting On aging.
- Reveal changes since last visit.
- Filter actionable work.
- Import data with column mapping.

Specify:

- User action.
- System response.
- State changes.
- Feedback.
- Error recovery.
- Keyboard behavior.
- Motion behavior.
- Accessibility.

Do not add animation without functional purpose.

## 15. DESIGN TASK F — USABILITY VALIDATION PLAN

Prepare usability tests for:

- Ten-second Matter comprehension.
- Critical blocker identification.
- Next Action discovery.
- Waiting vs Blocked recognition.
- Completed vs Verified distinction.
- Missing evidence recognition.
- Current document version recognition.
- Grid operations with 50–200 rows.
- Bulk editing.
- Excel import.
- Three Golden Workflow completion.

Do not claim any usability test passed unless actual tests were performed.

## 16. PARALLEL ARCHITECTURE CONSTRAINT

This design project runs alongside STEP 02.3.

API/Auth and integration decisions may still be open.

Therefore:

### Stable Product Design

Proceed with:

- IA.
- User flows.
- UX wireframes.
- Control Room.
- Operational Grid.
- Visual direction.
- Design system exploration.
- Meaningful interactions.

### Architecture-Dependent Design

Mark:

`PENDING_ARCHITECTURE`

when details depend on:

- Authentication implementation.
- API contracts.
- Authorization rules.
- Data loading/pagination.
- Backend validation.
- Optimistic updates.
- Error classifications.
- Persistence.
- Realtime synchronization.

Define expected user-visible behavior without inventing technical mechanisms.

Do not treat unresolved infrastructure decisions as a reason to stop unrelated UX design work.

## 17. EXPECTED DELIVERABLES

Produce:

1. Product UX Brief.
2. Persona UX Analysis.
3. Information Architecture.
4. Primary User Flows.
5. Screen Inventory.
6. Control Room Wireframe.
7. Operational Grid Wireframe.
8. Three Golden Workflow Designs.
9. Three Visual Directions.
10. Initial Design System.
11. Interaction Specifications.
12. Responsive Strategy.
13. Accessibility Strategy.
14. Usability Test Plan.
15. Architecture Dependency List.
16. Design Decision Log.

Where supported, create actual visual assets, wireframes or prototypes.

Do not report a high-fidelity screen or clickable prototype as created unless an actual artifact exists.

If the tool cannot export an artifact, provide detailed screen/interaction specifications for transfer back to Codex.

## 18. PRODUCT OWNER REVIEW GATE

First deliver:

- UX/IA direction.
- Control Room concept.
- Operational Grid concept.
- Three Visual Directions.
- Recommended direction.
- Important UX trade-offs.

Present these for Product Owner approval.

After approval, continue detailed high-fidelity design and design system refinement according to the approved direction and stable requirements.

Do not silently make major product scope changes.

## 19. HANDOFF BACK TO CODEX

At the end, provide:

- Design summary.
- Actual artifact links/references if created.
- Screens completed.
- User flows completed.
- Design system status.
- Decisions awaiting Product Owner.
- Architecture-dependent questions.
- UX risks.
- Usability test plan.
- Handoff readiness.

If possible, export design specifications to files that can be imported into the MatterControl repository.

Do not require OpenDesign to have direct filesystem access if the environment does not support it.

The Product Owner may manually return your artifacts or outputs to Codex.

## 20. STOP CONDITION

Do not:

- Implement frontend production code.
- Modify backend domain logic.
- Redesign Solution Architecture.
- Change product positioning.
- Change approved P0/P1/P2.
- Claim architecture decisions are final.
- Claim usability tests passed without evidence.
- Start production deployment.

Stop at the Product Owner design review gate, or return completed STEP 03A artifacts if the design direction was already approved.

## FINAL DIRECTIVE

Design MatterControl as a genuinely useful operational system for high-stakes legal work.

**Control Room for comprehension. Operational Grid for execution.**

Prioritize correctness, clarity, efficiency, trust and outstanding usability over decorative effects.
