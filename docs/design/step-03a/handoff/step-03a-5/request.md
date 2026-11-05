# MATTERCONTROL — STEP 03A.5
## AUTONOMOUS DESIGN VALIDATION RECOVERY & CONTROLLED HANDOFF

### 1. ROLE

Bạn là Codex — Project Manager, Business Analyst và AI SDLC Orchestrator của MatterControl.

Bạn có quyền tự quyết định những vấn đề UI/UX nằm trong approved product scope theo Product Owner delegation.

Nhiệm vụ hiện tại là xử lý những khoảng trống kiểm chứng còn lại của MC-003A, không tiếp tục vòng lặp tạo báo cáo rồi yêu cầu Product Owner thực hiện công việc vận hành.

**Do not restart Product Discovery, UX exploration, design-direction selection or completed source remediation.**

### 2. CURRENT BASELINE

Product: MatterControl — Control Plane for High-Stakes Legal Work.

Branch: `task/MC-003A-remediation`.

Latest reported checkpoint: `24103d1`.

Design revision: `local-r3`.

Approved-under-delegation UX decisions:

- D-UX01: Enterprise Precision, with selected impact-rail elements.
- D-UX02: Comfortable default, Compact optional.
- D-UX03: Blockers and Next Actions prioritized; prominent decision queue.
- D-UX04: Mobile triage/details and permitted simple actions.

Reported validation:

- 162 source/integrity checks PASS.
- JavaScript syntax PASS.
- 20 output artifacts verified.
- 85 QA inputs verified.
- Source remediation complete within approved scope.

Remaining:

- Rendered validation UNAVAILABLE.
- Keyboard/focus/touch/zoom NOT_TESTED.
- Independent QA PENDING.
- MC-003A overall REWORK_REQUIRED.
- STEP 03B NOT_AUTHORIZED.

Verify actual repository evidence before proceeding.

### 3. OBJECTIVE

You must:

1. Preserve accepted design decisions.
2. Stop unnecessary repetitive source-review cycles.
3. Determine whether compliant rendered validation is executable.
4. Determine whether an authorized independent QA path exists.
5. Separate design defects from missing verification evidence.
6. Resolve remaining unambiguous design issues.
7. Prepare a release-quality design handoff package.
8. Identify work that can proceed without violating gates.
9. Record the precise remaining blockers.
10. Make a concrete orchestration decision.

Do not ask Product Owner for routine screenshots, visual-direction selection or grid-density decisions.

### 4. TASK A — VERIFY AND FREEZE THE DESIGN BASELINE

Read:

- `docs/design/step-03a/design-gate-decision.md`
- `docs/design/step-03a/revised/local-r3/`
- Existing remediation matrix.
- D-UX01–04 records.
- Applicable PRD/SRS.
- Business rules.
- State semantics.
- Permission matrix.
- Project Atlas.
- Design QA packet.
- Design-system documentation.

Verify:

- Correct branch/worktree.
- Git integrity.
- Latest source revision.
- Closed versus unresolved findings.
- Existing review evidence.
- Architecture dependencies.

Freeze the accepted UX baseline for review.

Do not mutate historical review artifacts.

### 5. TASK B — CLASSIFY THE REMAINING GAPS

For every unresolved R01–R05, UI-T01–T04 and RV-S01/RV-S02 item, distinguish:

- SOURCE_CORRECTED.
- SOURCE_DEFECT_REMAINS.
- RENDERED_VALIDATION_REQUIRED.
- INTERACTION_TEST_REQUIRED.
- INDEPENDENT_QA_REQUIRED.
- ARCHITECTURE_DEPENDENT.
- ACCEPTED_DESIGN_LIMITATION.

Do not retain `REWORK_REQUIRED` solely because a test has not run without determining whether a genuine design defect remains.

However, do not silently change a governance status to DONE or introduce an incompatible status.

If all source corrections are finished, record that fact separately from the still-open QA gate.

### 6. TASK C — RENDERED VALIDATION FEASIBILITY

Determine whether there is an explicitly supported, authorized method to inspect the rendered local-r3 concept.

Review actual environment capabilities and restrictions.

The previous Browser Use tool refused `file://`.

Do not bypass that refusal through alternate browser-control tools, proxies, tunnels or a disguised equivalent.

Do not install unrelated software or grant new permissions to bypass the restriction.

If a compliant rendering mechanism is genuinely available, execute the smallest meaningful inspection covering:

- Control Room.
- Operational Grid.
- Evidence and dependency states.
- Document/filing states.
- Desktop readability.
- Mobile reachability.
- Focus and keyboard behavior where actually implemented.

Record exact methods, observations and evidence.

If no compliant method exists:

- Record `RENDERED_VALIDATION_BLOCKED_BY_TOOLING`.
- State the specific unavailable capability.
- Preserve actual untested status.
- Map the necessary checks to the first future environment where they can legitimately execute.
- Do not ask Product Owner to manually capture screenshots again.

Do not repeatedly investigate the same blocked method without new capability or authorization.

### 7. TASK D — INDEPENDENT QA RECOVERY

The previous OpenCode provider failed with HTTP 403 / FreeTierError.

Do not automatically retry it.

Do not switch model/provider or transmit payload to a new external service without permission.

Check whether a genuinely independent, already-authorized reviewer or local review execution path exists.

Independence means the reviewer must not simply restate Codex's own validation conclusions.

If available, perform read-only QA with real evidence.

If unavailable:

- Preserve the independent QA packet.
- Record the exact access blocker.
- Leave independent QA PENDING.
- Identify what event or prerequisite would unblock it.
- Do not create another identical QA handoff unnecessarily.

Internal sub-agent critique and deterministic source checks must not be relabeled as formal independent QA.

### 8. TASK E — DESIGN HANDOFF READINESS

Prepare an implementation-ready design specification using approved local-r3 artifacts.

Include:

- Information Architecture.
- Navigation model.
- Control Room.
- Operational Grid.
- Density variants.
- Five state dimensions.
- Semantic tokens.
- Approved bulk-edit policy.
- Evidence verification UX.
- Document versions.
- Filing lifecycle.
- Project Atlas references.
- Three Golden Workflows.
- Error/empty/loading states.
- Keyboard and accessibility acceptance requirements.
- Responsive behavior.
- Architecture-dependent interactions.

For each feature identify:

- Requirement ID.
- Design reference.
- Expected user-visible behavior.
- Data/API dependency.
- Unverified interaction.
- Acceptance criteria.
- Implementation readiness.

Keep specifications grounded in approved requirements.

Do not claim the existing HTML is a fully functioning application.

### 9. TASK F — ANTIGRAVITY FEASIBILITY HANDOFF

Antigravity is the frontend implementation owner.

Prepare a read-only design-to-code feasibility task:

- Verify Next.js Atomic Design starter capabilities.
- Identify available and missing UI components.
- Review whether the proposed design system can be implemented coherently.
- Identify accessibility and keyboard implementation requirements.
- Identify technical dependencies on STEP 02 API/Auth.
- Estimate implementation sequencing qualitatively based on the actual repository.
- Return feasibility findings without implementing product UI.

If direct invocation is unavailable, create and print a complete copy-paste-ready Antigravity prompt.

This is a feasibility handoff, not authorization to begin STEP 03B or production frontend implementation.

### 10. TASK G — QUALITY GATE & CONTROLLED PROGRESSION

Evaluate separately:

**G1 — Design Direction**

D-UX01–04 approved under Product Owner delegation.

**G2 — Source Remediation**

Confirmed findings corrected and locally validated.

**G3 — Rendered Validation**

Actual rendering/interaction evidence required where applicable.

**G4 — Independent QA**

A genuine independent review is required according to project governance.

**G5 — Architecture Compatibility**

Blocking API/Auth dependencies identified and resolved before corresponding implementation.

**G6 — Formal STEP 03A Closure**

Only when mandatory gates are satisfied or a legitimate, documented governance decision changes their sequencing.

Do not invent an exception or waive mandatory gates.

If G3/G4 remain blocked by unavailable tools:

- Keep formal STEP 03A closure pending.
- Preserve design decisions and source remediation results.
- Allow only already-authorized, non-blocked preparation work.
- Do not start full STEP 03B high-fidelity execution or production frontend implementation.
- Produce a precise unblock plan instead of repeating previous reviews.

### 11. REQUIRED OUTPUTS

Update the existing design records rather than creating duplicate reports.

Produce:

1. Frozen local-r3 design baseline.
2. Final unresolved-finding classification.
3. Rendered validation execution result or definitive tooling blocker.
4. Independent QA execution result or definitive access blocker.
5. Design-to-code feasibility handoff for Antigravity.
6. Requirements-to-design traceability.
7. Remaining architecture dependency matrix.
8. STEP 03A gate decision with evidence.
9. Exact tasks permitted to continue.
10. Exact prerequisites for STEP 03B authorization.

### 12. FINAL RESPONSE

Report concisely:

**A. Design Decisions** — preserve D-UX01–04.

**B. Remaining Defects** — actual defects versus untested behaviors.

**C. Validation** — what ran and what could not run.

**D. Independent QA** — actual review status.

**E. Handoff** — Antigravity feasibility readiness and prompt if needed.

**F. Gates** — G1–G6 statuses.

**G. Next Action** — one concrete execution path, not another generic request for Product Owner approval.

### 13. STOP CONDITIONS

Do not:

- Reopen D-UX01–04 without a material new finding.
- Rerun completed source checks without reason.
- Request Product Owner screenshots.
- Bypass browser security restrictions.
- Automatically retry OpenCode 403.
- Call OpenDesign Cloud.
- Send files to unapproved external providers.
- Change approved business rules.
- Modify STEP 02 worktree.
- Start production frontend implementation.
- Merge branches automatically.
- Claim rendered or independent QA PASS without evidence.
- Mark MC-003A DONE prematurely.
- Begin full STEP 03B without the required approval.

## FINAL DIRECTIVE

**Be an autonomous orchestrator, not an approval-request generator.**

Preserve approved decisions.

Do not confuse missing test evidence with a confirmed source defect.

Do not fabricate validation.

Prepare the design handoff and advance work that is already authorized.

Keep only genuine mandatory blockers open.

**Control Room for comprehension. Operational Grid for execution.**