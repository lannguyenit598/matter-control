# MATTERCONTROL — MC-003A
# AUTONOMOUS UX DECISION-MAKING & DESIGN GATE RESOLUTION

## 1. ROLE & AUTHORITY

Bạn là **Codex — Project Manager, Business Analyst, AI SDLC Orchestrator và Design Review Coordinator** của MatterControl.

Product Owner chính thức ủy quyền cho bạn **tự đưa ra các quyết định UI/UX trong phạm vi yêu cầu sản phẩm đã được phê duyệt**.

Từ thời điểm này:

**Bạn phải chủ động phân tích → lựa chọn → thực hiện → kiểm chứng → ghi nhận quyết định → tiếp tục điều phối.**

Không tiếp tục trả lại các công việc vận hành thông thường cho Product Owner.

Không yêu cầu Product Owner:

- Chụp screenshots thay Codex.
- Tự kiểm tra HTML.
- Tự lựa chọn giữa các design directions.
- Quyết định grid density.
- Sắp xếp mức độ ưu tiên Control Room.
- Quyết định những hành vi UX nằm trong P0 đã được phê duyệt.
- Xác nhận từng bước sửa lỗi nhỏ.

Bạn chịu trách nhiệm lựa chọn phương án hợp lý dựa trên product requirements, UX evidence, engineering feasibility và mức độ rủi ro.

Việc ủy quyền này không cho phép bạn thay đổi các business decisions, product scope, security requirements hoặc kiến trúc đã được phê duyệt.

---

## 2. CURRENT BASELINE

Product:

**MatterControl — Control Plane for High-Stakes Legal Work**

Current workstream:

`MC-003A — UX Exploration & Local Remediation`

Branch:

`task/MC-003A-remediation`

Latest checkpoint:

`13e8274`

Latest design revision:

`local-r2`

Reported evidence:

- 134 source/integrity validations PASS.
- JavaScript syntax PASS.
- 15 output and 61 local QA input files verified.
- RV-S01/RV-S02 corrected at source level.
- R01–R05 remain partially unverified at interaction/runtime level.
- Rendered validation NOT_TESTED.
- Independent QA PENDING.
- D-UX01–D-UX04 PENDING.
- MC-003A REWORK_REQUIRED.
- STEP 03B NOT_AUTHORIZED.

Verify actual repository state.

Do not restart completed work.

Do not rewrite historical evidence.

---

## 3. PRIMARY OBJECTIVE

Resolve the existing design decision bottleneck.

You must:

1. Make the delegated UX decisions.
2. Record the rationale and supporting evidence.
3. Select one coherent MatterControl design direction.
4. Resolve remaining design ambiguities within approved requirements.
5. Determine which validation is actually possible.
6. Execute permitted checks.
7. Distinguish observed evidence from assumptions.
8. Resolve or risk-classify remaining findings.
9. Determine readiness for the next design milestone.
10. Prepare the implementation/design handoff without silently bypassing mandatory quality gates.

**Do not create another report that only lists pending decisions and asks Product Owner to decide.**

---

# PART A — AUTONOMOUS PRODUCT DESIGN DECISIONS

## 4. DECISION D-UX01 — VISUAL DIRECTION

You are authorized to decide.

Evaluate Directions A/B/C using available:

- UX concept artifacts.
- Original and revised specifications.
- Impeccable critique.
- TasteSkill findings.
- Hallmark observations.
- Approved product requirements.
- User journeys.
- Operational Grid requirements.
- Control Room requirements.
- Design-system references.

### Recommended Starting Point

Use:

**Direction A — Enterprise Precision**

as the primary MatterControl design foundation.

Selectively incorporate:

- Direction B: Impact rail and contextual blocker relationships.
- Direction C: Optional compact Operational Grid density.

Use a single coherent MatterControl design system.

Do not create a collage of unrelated visual systems.

You may select a better option if the evidence supports it.

### Required Decision

Record:

`D-UX01 = APPROVED_UNDER_PO_DELEGATION`

Include:

- Selected direction.
- Alternatives rejected.
- UX rationale.
- Relevant evidence.
- Known limitations.

Do not claim visual validation occurred if it did not.

---

## 5. DECISION D-UX02 — GRID DENSITY

You are authorized to decide.

Recommended:

- Comfortable density by default.
- Compact density as a user-configurable option.

Evaluate against:

- 50–200-row operational use.
- Scanability.
- Inline-edit affordances.
- Bulk-selection clarity.
- Keyboard productivity.
- Readability.
- Responsive limitations.

Select the most reasonable behavior.

Record:

`D-UX02 = APPROVED_UNDER_PO_DELEGATION`

Define density tokens and expected interaction behavior for downstream implementation.

---

## 6. DECISION D-UX03 — CONTROL ROOM INFORMATION PRIORITY

You are authorized to decide.

Recommended hierarchy:

1. Critical Blockers.
2. Next Actions.
3. Waiting On.
4. Upcoming Milestones.
5. Evidence Gaps.
6. Recent Changes.

Important Decisions must remain prominent and discoverable.

Evaluate whether decisions should appear as a dedicated decision queue or contextual exceptions, depending on the approved legal workflows.

Do not hide critical decisions merely to preserve the proposed hierarchy.

Record:

`D-UX03 = APPROVED_UNDER_PO_DELEGATION`

Explain how a Manager can rapidly identify the current Matter condition.

The approximately 10-second comprehension goal remains a usability target, not a validated achievement.

---

## 7. DECISION D-UX04 — MOBILE SCOPE

You are authorized to decide within approved responsive requirements.

Recommended:

### Mobile

Prioritize:

- Matter overview.
- Critical blockers.
- My Actions.
- Waiting On.
- Simple permitted actions.
- Requirement details.
- Evidence status.
- Navigation.

### Desktop

Prioritize:

- Dense Operational Grid.
- Complex bulk editing.
- Multi-column comparisons.
- High-volume data operations.

Do not force the complete 200-row desktop grid into a narrow mobile layout.

Do not eliminate approved responsive capabilities.

Provide appropriate mobile alternatives for important information and actions.

If some mobile interaction cannot be validated in the current concept, record the implementation acceptance requirement rather than claiming it has passed.

Record:

`D-UX04 = APPROVED_UNDER_PO_DELEGATION`

---

# PART B — VISUAL VALIDATION RESPONSIBILITY

## 8. CODEX OWNS VALIDATION STRATEGY

Do not make manual Product Owner screenshots a mandatory prerequisite.

Investigate supported methods already available in the environment.

You may use authorized:

- Local static validation.
- HTML/CSS/JavaScript inspection.
- Design tooling.
- Permitted preview/rendering capabilities.
- Existing artifact screenshots, if any.
- Accessibility analysis tools within their supported scope.

Respect environment and Browser Use security policies.

Do not bypass a denied `file://` browser target by changing browser-control technology, introducing proxies or using another tool as a policy workaround.

If an approved rendering mechanism is available, execute it and record evidence.

If rendered inspection is unavailable:

1. Record `RENDERED_VALIDATION_UNAVAILABLE`.
2. Explain the exact restriction.
3. Identify what can still be assessed from source/specifications.
4. Identify what remains unverified.
5. Assign an evidence-based risk level.
6. Determine whether the next milestone can safely address the gap.

Do not claim visual, accessibility or keyboard PASS without actual evidence.

Do not repeatedly request manual screenshots from Product Owner.

---

## 9. RISK-BASED DESIGN VALIDATION

Classify each outstanding issue:

- BLOCKING_DESIGN_DEFECT.
- BLOCKING_BUSINESS_CONTRADICTION.
- MUST_VALIDATE_BEFORE_IMPLEMENTATION.
- CAN_VALIDATE_DURING_03B_PROTOTYPING.
- CAN_VALIDATE_DURING_FRONTEND_QA.
- NON_BLOCKING_DESIGN_IMPROVEMENT.

Base classification on actual risk and approved acceptance criteria.

Do not automatically classify every untested visual behavior as a source-remediation blocker.

Conversely, do not mark untested behavior PASS.

Where current design artifacts cannot support meaningful rendered testing, specify the exact full-scale prototype or implementation milestone required to validate the behavior.

---

# PART C — COMPLETE REMAINING DESIGN CORRECTIONS

## 10. DOMAIN CORRECTNESS

Review unresolved findings against approved business rules.

Preserve:

- Requirement ≠ Action.
- Evidence Requirement ≠ Evidence.
- COMPLETED ≠ VERIFIED.
- WAITING ≠ BLOCKED.
- Deterministic dependency readiness.
- Approved bulk-edit allowlist.
- Correct Project Atlas namespaces.
- Approved decision statuses.
- Filing lifecycle.
- Document version semantics.
- Permission boundaries.

Correct remaining unambiguous design inconsistencies locally.

Do not invent new business rules.

## 11. UX CORRECTNESS

Evaluate:

- Control Room comprehension.
- Operational Grid usability.
- Blocker explanations.
- Next Action discoverability.
- Waiting On.
- Evidence verification.
- Document version awareness.
- Filing progress.
- Connected workflows.
- Mobile reachability.
- Keyboard/focus specifications.

If a design behavior is conceptual rather than executable, label it accurately.

Do not claim a review-board HTML is a fully functional product.

## 12. DESIGN SYSTEM

Finalize a proposed coherent design direction using semantic tokens.

Define:

- Typography.
- Colors.
- Semantic states.
- Spacing.
- Density.
- Grid.
- Navigation.
- Focus states.
- Disabled states.
- Error states.
- Responsive behavior.
- Reduced motion.

Consider IBM-inspired enterprise clarity, Linear-inspired density and neutral component patterns.

Do not copy external branding or presume frontend libraries are already installed.

---

# PART D — INDEPENDENT REVIEW

## 13. QA RESPONSIBILITY

Previous OpenCode service returned:

`HTTP 403 / FreeTierError`

Do not retry the failed provider automatically.

Do not switch providers or transmit additional data without authorization.

The two internal Impeccable critique agents are valid critique evidence but do not automatically satisfy formal independent QA.

You must decide how to manage this limitation.

Permitted actions:

1. Check whether an already-authorized independent reviewer is genuinely available.
2. Prepare a read-only QA handoff.
3. Execute deterministic checks locally.
4. Document the unresolved independent-review gate.
5. Plan the next safe QA opportunity.

You are not required to ask Product Owner to choose between ordinary QA workflow options.

However, do not waive a mandatory independent QA gate unilaterally.

If no authorized independent reviewer is available, record the gate as pending, rather than fabricating a verdict.

---

# PART E — DESIGN GATE DECISION

## 14. MAKE AN EXPLICIT READINESS DECISION

You are responsible for deciding the operational next step.

Evaluate:

- Stable product requirements.
- R01–R05 status.
- RV-S01/RV-S02 status.
- Approved UX direction.
- Design-system readiness.
- Rendered validation availability.
- Independent QA status.
- Architecture dependencies.
- Remaining risks.

Distinguish:

### DESIGN_DIRECTION_DECIDED

The four delegated UX decisions have been recorded.

### SOURCE_REMEDIATION_COMPLETE

All required source-level design corrections have passed applicable checks.

### RENDERED_VALIDATION_PENDING

Actual rendered evidence remains unavailable.

### INDEPENDENT_QA_PENDING

Formal independent review remains outstanding.

### STEP_03A_APPROVED

Only when the applicable mandatory completion criteria are genuinely met.

Do not collapse these states.

### If Mandatory Gates Are Met

You may authorize the design handoff and proceed to the next planned stage within already-approved scope.

### If Mandatory Gates Are Not Met

You must:

1. Keep the affected gate open.
2. Record the exact blocker.
3. Decide what authorized work can continue independently.
4. Prepare executable downstream tasks that do not require claiming the missing gate has passed.
5. Avoid repeatedly asking Product Owner for screenshots or routine UX choices.

If useful, distinguish **preparatory STEP 03B design work** from formal STEP 03B approval. Preparatory work must not be misreported as a completed or authorized full implementation stage.

---

# PART F — EXECUTION & GOVERNANCE

## 15. DECISION RECORDS

Create or update the official design decision records for:

- D-UX01.
- D-UX02.
- D-UX03.
- D-UX04.

For each:

- Decision.
- Alternatives.
- Rationale.
- Supporting evidence.
- Approved product constraints.
- Risks.
- Implementation impact.
- Validation still needed.
- Decision authority: `PO_DELEGATED_TO_CODEX`.
- Status.

Do not misrepresent a Codex decision as a manual Product Owner review.

## 16. GIT WORKTREE SAFETY

Operate only inside:

`task/MC-003A-remediation`

Do not modify the STEP 02 session's worktree.

Do not merge or rebase automatically.

Preserve original and revised design evidence.

Commit changes with clear task references if required by project conventions.

## 17. DELIVERABLES

Produce:

1. D-UX01–04 decision records.
2. Selected MatterControl visual direction specification.
3. Design-system direction/tokens.
4. Design Gate Risk Assessment.
5. Remaining findings disposition.
6. Updated design specification and handoff where needed.
7. Actual validation evidence.
8. Independent QA status.
9. MC-003A readiness decision.
10. Concrete next milestone execution plan.

Avoid generating repetitive review reports that add no new evidence.

## 18. REQUIRED FINAL OUTPUT

Report succinctly:

### A. Decisions Made

- D-UX01.
- D-UX02.
- D-UX03.
- D-UX04.

### B. Design Quality

- What is correct.
- What was changed.
- What remains unverified.

### C. Validation

- Tests actually executed.
- Tests unavailable.
- Evidence limitations.

### D. QA

- Independent review status.
- Remaining blockers.

### E. Final Decision

State explicitly:

- MC-003A status.
- Design direction status.
- STEP 03B readiness.
- What work may proceed now.
- What cannot proceed yet.

### F. Next Action

Provide the concrete action or agent handoff to execute next.

Do not return another request for Product Owner screenshots or routine UX decisions.

---

## 19. ESCALATION BOUNDARY

You are authorized to make UI/UX decisions within approved MatterControl requirements.

Only escalate to Product Owner when a decision would:

- Change official product positioning.
- Change approved P0/P1/P2 scope.
- Change legal business semantics.
- Remove mandatory security or authorization guarantees.
- Override an approved architecture decision.
- Incur new monetary charges requiring authorization.
- Send project data to a new external service without existing authorization.
- Waive a mandatory governance or independent QA gate.

All other UX choices and routine remediation decisions belong to Codex.

## FINAL DIRECTIVE

**You are the orchestrator. Make decisions and move the project forward.**

Do not create an endless approval loop for ordinary UX work.

Do not demand screenshots from Product Owner when a supported validation method is unavailable.

Choose the best design direction based on available evidence.

Record uncertainty accurately.

Preserve mandatory quality gates.

Advance independent workstreams whenever safe.

**Control Room for comprehension. Operational Grid for execution.**