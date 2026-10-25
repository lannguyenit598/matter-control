# MATTERCONTROL — STEP 03A.2
# RENDERED UX VALIDATION, INDEPENDENT QA & PRODUCT OWNER DESIGN REVIEW GATE

## 1. ROLE

Bạn là Codex, đảm nhiệm:

- Project Manager.
- Business Analyst.
- AI SDLC Orchestrator.
- UX Requirements & Design Consistency Coordinator.

Bạn chịu trách nhiệm đưa MC-003A từ Local Remediation sang Design Review, dựa trên evidence thực tế.

### Agent Responsibilities

- Codex: Orchestration, requirements traceability, validation coordination.
- OpenDesign: Product UI/UX Design Authority.
- OpenCode: Independent QA, nếu khả dụng và được phép.
- Claude Code: Architecture Authority, chỉ tham gia khi có architecture-impacting issue.
- Antigravity: Frontend feasibility consultation, không implement product UI trong bước này.
- Product Owner: Design Direction Approval.

Không tự thay thế independent QA hoặc Product Owner approval.

---

## 2. CURRENT BASELINE — DO NOT RESTART

Product:

**MatterControl — Control Plane for High-Stakes Legal Work**

Official positioning:

MatterControl gives legal and transaction teams a single operational view of matter state, dependencies, blockers, evidence, decisions, and change history.

Current workstream:

`MC-003A — STEP 03A Product UX Design`

Branch:

`task/MC-003A-remediation`

Reported commits:

- Original artifacts preserved at `cef67c4`.
- Local revision at `495a6e2`.
- Evidence checkpoint at `0b3afbd`.

Current status:

`REWORK_REQUIRED`

### Completed Work

- Two independent internal critique agents executed.
- Sub-agent A returned 11 findings.
- Sub-agent B returned 5 findings.
- TasteSkill, Hallmark and Impeccable guidance incorporated where applicable.
- Existing R01–R05 and UI-T01–UI-T04 consolidated.
- Local concept revised.
- Specifications and handoff synchronized.
- 48 structural/integrity/Atlas checks passed.
- 11 local logic groups passed.
- QA manifest integrity passed: 42/42 files.
- Original artifacts preserved.

### Not Completed

- Rendered browser validation.
- Actual viewport/zoom measurements.
- Keyboard interaction validation.
- Contrast measurement.
- Touch-target validation.
- Usability testing.
- Independent QA.
- Product Owner design approval.

OpenCode previously returned HTTP 403 / FreeTierError.

Independent QA remains:

`PENDING_PROVIDER_ACCESS`

Do not interpret local PASS as visual, accessibility or usability PASS.

Verify the actual repository state before working.

---

# PHASE A — BASELINE & REVIEW READINESS

## 3. VERIFY CURRENT ARTIFACTS

Read:

`docs/design/step-03a/product-owner-review-package.md`

`docs/design/step-03a/revised/local-r1/mattercontrol-step-03a-ux-concept-review.html`

Read the revised specifications, handoff, remediation matrix, validation reports, QA manifest and both sub-agent critiques from their actual repository paths.

Verify:

1. Git branch/worktree.
2. Relevant commit ancestry.
3. Working-tree status.
4. Original and revised artifact integrity.
5. Existing unresolved findings.
6. Already completed checks.
7. Pending design decisions.

Preserve the historical untracked files. Do not delete or overwrite them merely to make the working tree appear clean.

Do not repeat completed structural validation without a new reason.

---

# PHASE B — RENDERED UI VALIDATION

## 4. DETERMINE ALLOWED VISUAL INSPECTION METHOD

First determine whether a permitted local visual inspection mechanism is available.

Important:

The previous Browser Use attempt refused the `file://` URL.

Do not bypass that policy through another browser-control technology, proxy, tunnel or workaround.

If an explicitly supported and authorized preview mechanism is available, use it within its restrictions.

If not, prepare a **Manual Visual Validation Package** for the Product Owner.

This package must explain:

- Which HTML artifact to open locally.
- Which screens/states to inspect.
- Which screenshots to capture.
- Which viewport conditions to use.
- Which interactions to test.
- How to record findings.

Do not claim browser inspection occurred merely because an HTML file exists.

### Suggested Validation Conditions

Use appropriate real viewing conditions such as:

- Desktop: approximately 1440 × 900.
- Smaller laptop: approximately 1280 × 800.
- Mobile: approximately 390 × 844.
- Zoom: 100% and 200%, where supported.

These are proposed test conditions, not universal requirements.

Record the actual conditions used.

## 5. DISTINGUISH REVIEW BOARD FROM REAL APP VIEW

The current HTML is a design-review artifact containing conceptual screens and visual directions.

Do not confuse miniature wireframes with a finished application rendered at 1:1 scale.

For each reviewed screen, classify:

- REVIEW_BOARD.
- FULL_SCALE_APP_CONCEPT.
- INTERACTIVE_PROTOTYPE.
- STATIC_SPECIFICATION.

If a design only exists as a small presentation miniature, identify what can and cannot be validated from it.

Do not assign accessibility or usability PASS based on miniature screenshots alone.

## 6. REQUIRED VISUAL REVIEW TARGETS

### Control Room

Check:

- Critical blocker discoverability.
- Next Action clarity.
- Waiting On visibility.
- Milestones.
- Missing evidence.
- Important decisions.
- Recent changes.
- Navigation to Requirement Detail.

### Operational Grid

Check:

- Information density.
- Row readability.
- Visible state dimensions.
- Inline-edit affordances.
- Bulk-select affordances.
- Approved bulk-edit fields.
- Filter/search behavior.
- Contextual inspector.
- Keyboard interaction specifications.
- Error and partial-result communication.

### Evidence & Dependency Flow

Check:

- Completed versus Verified.
- Required versus supplied evidence.
- Proof acceptance.
- Blocker explanation.
- Dependency readiness.
- Downstream impact.

### Filing Flow

Check:

- Document versions.
- Filing lifecycle.
- Waiting on Authority.
- Supplement requests.
- Next Action.
- Synthetic Atlas identifiers.

### Navigation & Mobile

Check:

- Consistent product shell.
- Navigation hierarchy.
- Row/action reachability.
- Overflow and clipping.
- Focus visibility.
- Mobile eight-row limitation.
- Available filtering/search behavior.

Do not claim the prototype supports real backend interactions that are not implemented.

---

# PHASE C — ACCESSIBILITY & INTERACTION REVIEW

## 7. READABILITY

Review:

- Actual rendered font sizes.
- Information hierarchy.
- Line height.
- Contrast where measurable.
- Truncation.
- Dense table readability.
- Zoom behavior.
- Text wrapping.

Distinguish:

- Confirmed defect.
- Suspected defect.
- Unable to validate.

Do not treat 14px body or 12px metadata as universal WCAG requirements.

## 8. INTERACTIVE TARGETS

Evaluate:

- Target geometry.
- Spacing.
- Adjacent targets.
- Pointer usability.
- Keyboard focus.
- Error recovery.

The previous source inspection reported differences between 34px mobile navigation and 44px primary controls.

Do not automatically classify either measurement as an accessibility failure without the applicable rendered context and standard.

## 9. KEYBOARD & FOCUS

Where actual interaction exists, evaluate:

- Tab order.
- Visible focus.
- Escape/close behavior.
- Navigation recovery.
- Keyboard-operable controls.
- Modal/drawer focus behavior.

If the review artifact does not implement these behaviors, classify them as:

`SPECIFIED_NOT_EXECUTABLE`

or:

`NOT_IMPLEMENTED_IN_CONCEPT`

Do not report runtime keyboard PASS.

## 10. SEMANTIC STATUS PRESENTATION

Verify UI consistency for:

Execution:
NOT_STARTED / IN_PROGRESS / WAITING / COMPLETED / CANCELLED.

Verification:
NOT_REQUIRED / UNVERIFIED / PARTIALLY_VERIFIED / VERIFIED / DISPUTED.

Dependency:
READY / BLOCKED.

Timing:
ON_TRACK / DUE_SOON / OVERDUE.

Attention:
NORMAL / ATTENTION / CRITICAL.

Check whether different dimensions remain understandable without relying exclusively on color.

Preserve:

`COMPLETED ≠ VERIFIED`

Do not collapse domain distinctions to satisfy a visual design heuristic.

---

# PHASE D — REMEDIATION ACCEPTANCE

## 11. REVALIDATE R01–R05

Use approved business rules and canonical datasets.

### R01 — Bulk Fields

Verify only approved P0 bulk-edit fields are presented as supported.

Check defaults, results, permissions and error feedback.

### R02 — Approved Decisions

Ensure approved decisions are not presented as pending.

Do not reopen existing Product Owner approvals.

### R03 — Project Atlas IDs

Verify canonical namespaces and synthetic/governance separation.

### R04 — Proof Gate

Ensure UX copy distinguishes completion, evidence acceptance and verification.

Do not claim an actual runtime bypass was demonstrated by the old concept.

### R05 — Coverage/Mobile

Confirm three connected flows are represented accurately.

Preserve `NEEDS_CLARIFICATION` where mobile reachability cannot be demonstrated.

For every finding, record:

- Original evidence.
- Revised behavior.
- Requirement reference.
- Validation method.
- PASS / FAIL / PARTIAL / NOT_TESTED.
- Remaining risk.

Do not close a finding based on an unsupported assertion.

## 12. REVIEW UI-T01–UI-T04

Check:

- Typography at actual viewing scale.
- Mobile target consistency.
- Semantic design tokens.
- Honest distinction between concept and operational prototype.

Do not force Hallmark warnings to zero.

Prioritize actual usability impact.

---

# PHASE E — DESIGN DIRECTION REVIEW

## 13. COMPARE DIRECTIONS A/B/C

Review the existing three visual directions without automatically approving one.

Evaluate them against:

1. Operational clarity.
2. Control Room comprehension.
3. Operational Grid density.
4. Evidence/status readability.
5. Accessibility potential.
6. Design-system coherence.
7. Professional trust.
8. Next.js/Atomic implementation feasibility.
9. Long-session legal work usability.

Consider the existing recommendation:

**IBM-inspired semantic foundation + selective Linear-inspired density + Shadcn-inspired interaction language.**

This is a candidate direction, not an approved choice.

Do not:

- Copy third-party branding.
- Assume Carbon/shadcn libraries are installed.
- Combine incompatible design systems.
- Replace legal operational semantics with generic SaaS patterns.

Prepare a concise comparison with visual evidence, trade-offs and one recommended direction.

Product Owner must explicitly approve the design direction.

---

# PHASE F — INDEPENDENT QA

## 14. QA PROVIDER STATUS

Previous OpenCode attempt:

`HTTP 403 / FreeTierError`

No independent QA verdict was produced.

Do not retry the same provider automatically.

Do not switch provider/model without authorization.

Do not treat the two internal critique agents as equivalent to formal independent QA.

### If a permitted independent reviewer is already available

Verify:

- Reviewer identity.
- Independence from artifact author.
- Authorized execution method.
- Exact payload.
- Data destination.
- Costs.
- Review scope.

Only dispatch if the existing Product Owner authorization explicitly covers this review.

### Otherwise

Prepare a complete read-only QA package and reviewer prompt.

Keep status:

`PENDING_INDEPENDENT_QA`

Do not send files to a new external service without a separate, explicit approval.

## 15. INDEPENDENT QA SCOPE

The independent reviewer should examine:

- R01–R05 remediation correctness.
- UX/domain consistency.
- Approved bulk-edit policy.
- Decision register and Atlas IDs.
- Five state dimensions.
- Evidence verification semantics.
- Control Room/Operational Grid coverage.
- Accessible interaction specifications.
- Actual visual findings where rendered evidence exists.
- Remaining architectural dependencies.

Require evidence-based findings and a clear verdict.

Distinguish:

- DOCUMENT_REVIEW_PASS.
- VISUAL_REVIEW_PASS.
- INTERACTION_REVIEW_PASS.
- NOT_TESTED.
- BLOCKED.

Do not claim full usability/accessibility verification from document review alone.

---

# PHASE G — PRODUCT OWNER REVIEW PACKAGE

## 16. PRODUCE A DESIGN REVIEW SUMMARY

Prepare a concise, decision-ready package for the Product Owner.

It must contain:

### A. Visual Preview

Actual screenshots or supported preview references, only if they were genuinely produced.

Otherwise provide the exact local artifact path and manual inspection instructions.

### B. Current Design Quality

- Confirmed strengths.
- Remaining weaknesses.
- Critical/high findings.
- Unverified behaviors.

### C. R01–R05 Closure Matrix

Show each finding and evidence of correction.

### D. Accessibility & Usability

Separate measured results from untested assumptions.

### E. Design Direction

Compare A/B/C and recommend one.

### F. Architecture Dependencies

Identify what still depends on STEP 02 decisions.

### G. QA Gate

Show actual independent review status.

### H. Product Owner Decisions

Present only the decisions that genuinely require approval.

## 17. APPROVAL LEVELS

Distinguish:

**DESIGN_CONCEPT_REVIEWED**

Concept has been reviewed, with limitations recorded.

**DESIGN_DIRECTION_APPROVED**

Product Owner has selected the visual direction.

**LOCAL_REMEDIATION_VALIDATED**

Remediation has supporting local evidence.

**INDEPENDENT_QA_COMPLETED**

Formal independent review has actually returned.

**STEP_03A_APPROVED**

All mandatory STEP 03A criteria have been satisfied.

Do not equate approval of a visual direction with completion of STEP 03A.

Do not begin STEP 03B simply because screenshots look good.

---

# PHASE H — ARTIFACTS & GOVERNANCE

## 18. REQUIRED OUTPUT FILES

Create/update appropriate files under:

`docs/design/step-03a/`

Suggested deliverables:

- `validation/rendered-review-report.md`
- `validation/interaction-review.md`
- `validation/accessibility-review.md`
- `validation/r01-r05-acceptance.md`
- `validation/manual-visual-checklist.md`
- `qa/independent-review-handoff.md`
- `qa/independent-review-status.md`
- `product-owner-design-decision.md`
- `step-03a-final-gate-report.md`

Reuse existing naming conventions and avoid duplicate files.

If screenshots are unavailable, do not create fictitious screenshot references.

## 19. WORKTREE ISOLATION

Stay inside:

`task/MC-003A-remediation`

Do not:

- Modify STEP 02.4/02.5 worktree.
- Reset or merge the other session.
- Rewrite original evidence.
- Delete historical untracked files.
- Automatically merge branches.

Record shared governance changes separately for controlled integration.

---

## 20. REQUIRED FINAL REPORT

Report:

1. Baseline and Git status.
2. Rendered validation method actually used.
3. Screens inspected.
4. Screens not inspected.
5. R01–R05 acceptance results.
6. UI-T01–UI-T04 results.
7. Visual/readability/accessibility findings.
8. Design Direction A/B/C comparison.
9. Independent QA status.
10. Product Owner decisions required.
11. Exact artifacts and references.
12. MC-003A Quality Gate status.
13. STEP 03B readiness.

If visual inspection is blocked, include a concise **manual validation request** explaining exactly what I need to open or capture locally.

If independent QA remains unavailable, provide a ready-to-paste independent-review prompt without dispatching it.

## 21. STOP CONDITIONS

Do not:

- Call OpenDesign Cloud.
- Upload the previous 11-file payload.
- Consume design credits.
- Automatically retry blocked OpenCode.
- Switch external providers without approval.
- Bypass Browser Use restrictions.
- Claim screenshot/viewport testing without execution.
- Claim WCAG/usability PASS without supporting tests.
- Implement frontend product code.
- Change architecture/API/Auth contracts.
- Change product scope.
- Mark independent QA complete without review.
- Approve design direction on behalf of Product Owner.
- Mark MC-003A DONE prematurely.
- Start STEP 03B automatically.

Stop at the Product Owner Design Review Gate.

## FINAL DIRECTIVE

**Do not restart design exploration or repeat already completed remediation.**

Verify the revised MatterControl concept as an actual user-facing experience wherever permitted.

Preserve the distinction between a design-review document and a functional application.

Prioritize operational clarity, legal domain correctness, readability, accessibility and trustworthy interaction.

**Control Room for comprehension. Operational Grid for execution.**