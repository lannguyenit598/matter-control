# MATTERCONTROL — STEP 03A.4
## RENDERED EVIDENCE INTAKE & PRODUCT OWNER DESIGN DECISION GATE

Bạn là Codex — Project Manager, Business Analyst và AI SDLC Orchestrator.

Nhiệm vụ: tiếp nhận bằng chứng rendered UI của MatterControl local-r2, đánh giá những quality gates còn thiếu và chuẩn bị quyết định thiết kế cho Product Owner.

## 1. CURRENT BASELINE

- Workstream: MC-003A.
- Branch: `task/MC-003A-remediation`.
- Latest reported checkpoint: `84e620e`.
- Revised artifact: `docs/design/step-03a/revised/local-r2/mattercontrol-step-03a-ux-concept-review.html`.
- RV-S01/RV-S02: corrected at source level.
- 134 source/integrity checks: PASS.
- JavaScript syntax: PASS.
- Local QA input/output manifests verified.
- R01–R05: source regression checks completed; runtime acceptance incomplete.
- Rendered validation: PENDING_MANUAL_CAPTURE.
- Independent QA: PENDING_INDEPENDENT_QA.
- Product Owner decisions D-UX01–04: PENDING.
- MC-003A: REWORK_REQUIRED.
- STEP 03B: NOT_AUTHORIZED.

Verify actual repository state before proceeding.

Do not repeat completed source reviews without a new defect.

## 2. INTAKE SCREENSHOTS

Check whether Product Owner has supplied actual screenshots and manual review notes.

If not supplied:

- Do not invent screenshots.
- Do not declare rendered validation completed.
- Refer to the existing local-r2 manual visual checklist.
- State exactly what evidence remains missing.
- Stop the rendered acceptance evaluation.

If screenshots are supplied, record for each:

- Evidence ID.
- Source file.
- Screen or workflow.
- Browser/version, if provided.
- Viewport, if provided.
- Zoom level, if provided.
- Interaction performed.
- Observed result.
- Limitations.

Do not infer viewport, keyboard behavior or zoom from a screenshot if the information is not available.

## 3. EVALUATE RENDERED UX

Assess only what the evidence supports.

### Control Room

- Can critical blockers be identified?
- Are Next Actions clear?
- Is Waiting On distinguishable?
- Are milestones and evidence gaps visible?
- Can the user understand the current operational state?

### Operational Grid

- Readability at application scale.
- Row density and hierarchy.
- Approved bulk-edit affordances.
- Clear execution/verification distinction.
- Navigation and contextual inspector.
- Overflow and layout behavior.

### Domain Semantics

Preserve:

- Requirement ≠ Action.
- Evidence Requirement ≠ Evidence.
- COMPLETED ≠ VERIFIED.
- WAITING ≠ BLOCKED.
- Canonical Atlas IDs.
- Approved filing/document states.

### Mobile

Evaluate only the provided viewports.

Identify clipping, unreachable actions, overflow and information loss.

Keep untested touch/keyboard behavior marked NOT_TESTED.

### Design Directions

Compare Directions A/B/C using actual visual evidence.

Do not select a direction on behalf of Product Owner.

## 4. PRODUCT OWNER DECISIONS

Prepare a decision package for:

### D-UX01 — Visual Direction

Candidate recommendation:

Direction A as foundation, selective B impact rail and optional C compact grid.

Ensure one coherent MatterControl token system.

### D-UX02 — Grid Density

Candidate recommendation:

Comfortable default, Compact optional.

### D-UX03 — Control Room Priority

Candidate recommendation:

Critical Blockers → Next Actions → Waiting On → Milestones → Evidence Gaps → Recent Changes.

### D-UX04 — Mobile Scope

Candidate recommendation:

Mobile triage, navigation and permitted simple actions.

Desktop-first dense Operational Grid and bulk operations.

Preserve all approved responsive and accessibility requirements.

These are recommendations, not prior approvals.

For each decision include:

- Existing approved constraints.
- Options.
- Recommendation.
- Trade-offs.
- Evidence.
- Product Owner approval status.

Do not reopen approved business rules.

## 5. RESIDUAL FINDINGS

Review:

- R01–R05.
- UI-T01–UI-T04.
- RV-S01.
- RV-S02.

For each:

- Corrected at source?
- Visually verified?
- Behavior actually tested?
- Independent QA completed?
- Remaining risk?

Distinguish SOURCE_PASS from RENDERED_PASS and INTERACTION_PASS.

Do not close findings based on a screenshot that cannot demonstrate the required behavior.

## 6. INDEPENDENT QA

OpenCode previously returned HTTP 403 / FreeTierError.

Do not retry automatically.

Do not change provider or transmit QA files externally without authorization.

Prepare the current local-r2 evidence package for independent review.

Keep independent QA PENDING until an authorized reviewer returns a real verdict.

## 7. REQUIRED ARTIFACTS

Update appropriate existing MC-003A documents:

- Rendered evidence inventory.
- Visual acceptance matrix.
- R01–R05 and RV-S01/RV-S02 status.
- Design Directions A/B/C comparison.
- D-UX01–04 Product Owner decision package.
- Independent QA readiness.
- STEP 03A Quality Gate report.

Preserve original and local-r1/local-r2 historical artifacts.

Do not modify STEP 02 worktree.

## 8. FINAL REPORT

Report:

1. Received screenshots and evidence.
2. Visual validation PASS / FAIL / PARTIAL / NOT_TESTED.
3. Control Room findings.
4. Operational Grid findings.
5. Mobile findings.
6. A/B/C visual comparison.
7. Residual source/behavior issues.
8. D-UX01–04 recommended decisions.
9. Independent QA status.
10. MC-003A status.
11. STEP 03B readiness.
12. Exact next actions.

## STOP CONDITIONS

- No OpenDesign Cloud.
- No unapproved external QA dispatch.
- No browser-policy workaround.
- No production frontend implementation.
- No architecture changes.
- No automatic branch merge.
- No fabricated visual or runtime evidence.
- No automatic STEP 03B authorization.

Stop at Product Owner Design Review Gate.

**FINAL DIRECTIVE:** Evaluate the actual MatterControl user experience using real evidence, preserve legal operational semantics and keep source validation, rendered acceptance, independent QA and Product Owner approval as separate gates.