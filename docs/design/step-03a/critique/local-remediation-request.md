# MATTERCONTROL — MC-003A
# COMPREHENSIVE UX CRITIQUE & LOCAL DESIGN REMEDIATION

## 1. ROLE & MISSION

Bạn là Codex, đảm nhiệm:

- Project Manager.
- Business Analyst.
- AI SDLC Orchestrator.
- Local Design Remediation Coordinator.
- Requirements & Design Consistency Reviewer.

Nhiệm vụ của bạn là hoàn thiện một vòng **UX Critique → Findings Consolidation → Local Remediation → Validation → QA Handoff** cho MatterControl.

Product Owner cho phép:

1. Sử dụng đúng **2 isolated sub-agents** để thực hiện Impeccable critique.
2. Sử dụng ba Codex skills đã cài: TasteSkill, Hallmark và Impeccable.
3. Chỉnh sửa trực tiếp những design artifacts hiện có tại local trong phạm vi remediation được phê duyệt.
4. Thực hiện deterministic checks và local validation.
5. Chuẩn bị kết quả cho Product Owner Design Review.

Đây là ủy quyền giới hạn cho review và corrective remediation, không phải chuyển toàn bộ Design Authority từ OpenDesign sang Codex.

### Explicit Restrictions

- Không gọi OpenDesign Cloud.
- Không upload bộ 11-file remediation payload.
- Không tiêu thụ OpenDesign credits.
- Không tự retry OpenCode provider đã trả HTTP 403.
- Không tự thay đổi provider/model hoặc gửi dữ liệu sang dịch vụ bên ngoài mới.
- Không thay đổi approved product requirements.
- Không thay đổi Solution Architecture.
- Không implement frontend/backend production features.
- Không deploy.
- Không tự merge worktrees.

Nếu sub-agent execution cần một dịch vụ, quyền truy cập hoặc chi phí mới ngoài phiên Codex hiện được cho phép, hãy dừng phần dispatch đó và báo cáo; không tự vượt qua giới hạn.

---

## 2. PRODUCT IDENTITY

**Product:** MatterControl

**Positioning:** Control Plane for High-Stakes Legal Work.

**Official Core Positioning:**

MatterControl gives legal and transaction teams a single operational view of matter state, dependencies, blockers, evidence, decisions, and change history.

**Product Principle:**

The System of Operational Truth for Complex Legal Matters.

**Initial Vertical:**

Transactions & Corporate Legal Work.

MatterControl không phải:

- Generic task manager.
- Legal-themed Jira.
- Spreadsheet replacement đơn thuần.
- Generic SaaS dashboard.
- Legal AI chatbot.
- Virtual data room.
- Generic workflow builder.

### Primary UX Objective

MatterControl phải giúp legal operators:

- Understand current matter state.
- Identify critical blockers.
- Understand why work is blocked.
- Know what action is possible next.
- Identify who owns the action.
- Understand Waiting On.
- Verify evidence.
- Understand document and filing status.
- Review what changed.
- Execute operational work efficiently.

**Control Room for comprehension. Operational Grid for execution.**

---

## 3. CURRENT PROJECT STATUS

Workstream:

`MC-003A — Product UX Design`

Branch:

`task/MC-003A-remediation`

Previously reported baseline:

`3ebc0f0`

Current status:

`REWORK_REQUIRED`

Original OpenDesign Cloud execution timed out, but three artifacts were recovered:

1. UX concept HTML.
2. Design specification.
3. Design handoff.

A previous review confirmed five business-policy findings:

- R01 — Incorrect bulk-edit field allowlist.
- R02 — Approved decisions incorrectly presented as unresolved.
- R03 — Incorrect Project Atlas decision IDs/namespaces.
- R04 — Ambiguous evidence/proof gate copy.
- R05 — Connected-flow coverage and unresolved mobile accessibility.

Independent OpenCode QA remains:

`PENDING_PROVIDER_ACCESS`

Its earlier attempt returned HTTP 403 / FreeTierError.

No independent QA verdict exists for these design artifacts.

### Latest Design Tooling Review

Three Codex skills were installed:

- TasteSkill — `design-taste-frontend`
- Hallmark — `hallmark`
- Impeccable — `impeccable`

Installation manifests contain pinned source commits.

Hallmark static scan of the recovered HTML reported:

- 243 FAIL.
- 302 REFLEX.
- 7 WARN.

These are tool-specific detector results, NOT 243 independently confirmed UX defects.

Additional observations:

- UI-T01 — Extremely small font sizes in presentation miniatures.
- UI-T02 — Potentially inconsistent mobile navigation/control target sizes.
- UI-T03 — Fragmented hardcoded styling and semantic tokens.
- UI-T04 — Review-document wireframes are not equivalent to a functional interactive prototype.

No complete Impeccable two-agent critique has been executed yet.

No actual full rendered accessibility/usability assessment has been demonstrated.

Read repository evidence to confirm current facts before proceeding.

---

## 4. WORKTREE SAFETY

Another Codex session owns STEP 02.3 / MC-002.

Before modifying files:

1. Inspect current directory.
2. Inspect Git branch.
3. Inspect worktree list.
4. Inspect Git status.
5. Verify you are operating inside the MC-003A remediation worktree.
6. Record baseline commit.
7. Record original artifact hashes.

If not isolated, stop before making modifications.

Do not:

- Checkout or reset the other session's branch.
- Modify STEP 02.3 artifacts.
- Modify shared architecture files.
- Force-push.
- Automatically merge/rebase.
- Overwrite uncommitted user changes.

Limit changes to the design workstream, its validation evidence and task-specific handoff records.

Record proposed shared governance changes in a separate coordination document.

---

## 5. SOURCES OF TRUTH

Read the actual repository artifacts, especially:

### Product & Requirements

- Canonical Product Context.
- Product Reality Context.
- Domain Glossary.
- PRD.
- SRS.
- P0/P1/P2 Priority Baseline.
- Business Rules.
- State Semantics.
- Permission Matrix.
- Golden Workflows.
- Project Atlas Dataset.
- Approved Decision Register.

### Existing Design

- `docs/design/step-03a/intake-report.md`
- `docs/design/step-03a/remediation/delivery.md`
- `docs/design/step-03a/remediation/findings.json`
- `docs/design/step-03a/tooling-review/review-report.md`
- Recovered UX concept HTML.
- Recovered design specification.
- Recovered design handoff.
- Available design-system references.

Use actual file paths found in the repository.

Do not infer business rules solely from this prompt.

### Priority of Authority

1. Approved Product Owner decisions.
2. Approved PRD/SRS and business rules.
3. State semantics and permission matrix.
4. Canonical domain and Project Atlas specifications.
5. Approved architecture constraints.
6. Existing UX design decisions.
7. Impeccable/TasteSkill/Hallmark guidance.
8. General stylistic preferences.

A style detector must never override a legally meaningful state, canonical enumeration or approved business rule.

---

# PHASE A — INDEPENDENT UX CRITIQUE

## 6. AUTHORIZE TWO ISOLATED SUB-AGENTS

Product Owner explicitly authorizes **two isolated read-only sub-agents** for this Impeccable critique.

Follow the installed Impeccable skill's critique procedure where applicable.

Each sub-agent must produce its own report.

### IMPORTANT — UNANCHORED ASSESSMENT

The first assessment must be independent of existing findings.

Do NOT initially provide either sub-agent with:

- R01–R05 findings.
- UI-T01–UI-T04 conclusions.
- Hallmark FAIL/REFLEX/WARN counts.
- Previous Codex recommendations.
- Preferred design direction.
- The other sub-agent's findings.

Provide both with the same frozen design artifacts and enough neutral product context to evaluate the application accurately.

They may read approved requirements, domain glossary, business rules and the permission matrix as normative references, without being given the existing conclusions.

Sub-agents must not edit files, commit, run destructive commands or dispatch external cloud services.

If genuine isolated execution is unavailable, report that limitation. Do not simulate two independent reviews by writing two sections yourself.

## 7. SUB-AGENT A — OPERATIONAL UX CRITIC

Role:

Senior Product UX Reviewer specializing in complex B2B operational software.

Review independently:

### Product Comprehension

- Can the user understand current Matter state?
- Are critical blockers visually discoverable?
- Are blocker reasons understandable?
- Is Next Action clear?
- Is Waiting On distinguishable from Blocked?
- Are evidence gaps discoverable?
- Is meaningful change history accessible?

### Control Room

- Information hierarchy.
- Critical exception visibility.
- Matter state comprehension.
- Milestone visibility.
- Evidence verification context.
- Decision visibility.
- Navigation to next actions.
- Avoidance of misleading readiness percentages.

### Operational Grid

- Information density.
- 50–200-row usability.
- Inline editing affordances.
- Bulk selection.
- Bulk operations.
- Row readability.
- Sorting/filtering.
- Keyboard workflows.
- Error feedback.
- Contextual inspector behavior.

### Golden Workflows

Assess the available design representation of:

GW-01 — Transaction/Restructuring.

GW-02 — Due Diligence.

GW-03 — Regulatory Filing.

Identify coverage gaps and misleading interactions.

Do not require the design-review HTML to behave as a finished application unless the artifact claims to be an operational prototype.

### Output

For every finding:

- Independent finding ID.
- Affected screen/flow.
- Observed evidence.
- UX impact.
- Severity.
- Recommended correction.
- Validation needed.
- Confidence level.

Deliver an independent UX critique report.

---

## 8. SUB-AGENT B — VISUAL & DESIGN SYSTEM CRITIC

Role:

Senior Product Visual Designer specializing in enterprise applications, accessibility and dense operational interfaces.

Review independently:

### Visual Hierarchy

- Typography.
- Contrast.
- Information hierarchy.
- Spacing.
- Layout.
- Density.
- Alignment.
- Focus management.
- Visual consistency.

### Semantic States

Evaluate whether visual presentation distinguishes:

- Execution.
- Verification.
- Dependency.
- Timing.
- Attention.

Do not collapse the five dimensions into one generic status indicator.

### Design System

- Semantic tokens.
- Color roles.
- Typography scales.
- Spacing system.
- Component consistency.
- Interactive states.
- Error states.
- Disabled states.
- Selected states.
- Focus states.

### Accessibility

- Readability.
- Touch targets.
- Keyboard affordances.
- Focus visibility.
- Responsive behavior.
- Color dependence.
- Zoom implications.

Do not assert a WCAG failure based on an isolated CSS property when actual applicability, rendered geometry or required measurement is unknown.

### Context

MatterControl is an **Operate/application interface**.

Do not judge it as:

- Marketing landing page.
- Editorial article.
- Promotional dashboard.
- Consumer social application.

### Output

Produce an independent visual/design-system critique with:

- Finding ID.
- Evidence.
- Severity.
- Impact.
- Recommended correction.
- Confidence.
- Required rendered validation.

Do not select an official visual direction.

---

## 9. PRESERVE CRITIQUE INDEPENDENCE

After both sub-agents return:

1. Save both reports separately.
2. Preserve actual execution evidence.
3. Record which artifacts each reviewed.
4. Record limitations.
5. Compare overlapping findings.
6. Identify contradictory assessments.
7. Distinguish evidence from preferences.

Do not retroactively rewrite their reports to match previous Codex findings.

These are internal commissioned critiques.

They do not replace an independently completed OpenCode QA gate.

---

# PHASE B — SKILL-BASED REVIEW

## 10. USE THE INSTALLED DESIGN SKILLS

### TasteSkill

Use its application/interface guidance to evaluate:

- Product taste.
- Clarity.
- Information hierarchy.
- Density.
- Interaction quality.
- Visual restraint.
- Overall professional polish.

Avoid applying marketing-page requirements to an operational legal product.

### Hallmark

Review the preserved static results.

If rerunning is needed, use the documented audit-only application scope.

Treat classifications as heuristics.

Do not automatically:

- Delete canonical state labels.
- Remove semantically meaningful uppercase codes.
- Replace all inline styles without assessing purpose.
- Apply punctuation or marketing-copy preferences to legal data.
- Make styling changes solely to reduce detector counts.

Prioritize actual user impact over linter score.

### Impeccable

Use the two isolated critique outputs and relevant design guidance to identify:

- Structural UX weaknesses.
- Visual inconsistencies.
- Accessibility concerns.
- Interaction clarity problems.
- Design-system coherence issues.

Record any tool steps that cannot be performed.

Do not claim the complete skill workflow was executed if only selected steps were completed.

---

## 11. DESIGN SYSTEM REFERENCE REVIEW

Existing design-system candidates include:

- IBM-inspired.
- Linear-inspired.
- Shadcn-inspired.
- Minimal.
- Professional.
- Mission Control.

The previous Codex recommendation was:

**IBM-inspired semantic foundation + selective Linear-inspired information density + Shadcn-inspired interaction language.**

This is a recommendation, not an approved design direction.

Evaluate the fit of these references against MatterControl requirements.

### Important Restrictions

- Do not copy IBM branding.
- Do not assume Carbon React is installed.
- Do not assume shadcn/ui is installed.
- Do not assume specific Next.js library versions.
- Do not replicate Linear's generic task-manager semantics.
- Do not turn MatterControl into a telemetry dashboard.
- Do not combine unrelated visual themes into a fragmented UI.

If proposing a direction, specify one coherent MatterControl token system.

Do not finalize official visual direction without Product Owner approval.

---

# PHASE C — FINDINGS CONSOLIDATION

## 12. CONSOLIDATE ALL REVIEW FINDINGS

Merge these sources:

A. Existing R01–R05.

B. Existing UI-T01–UI-T04.

C. Sub-agent A independent findings.

D. Sub-agent B independent findings.

E. Relevant TasteSkill observations.

F. Relevant Hallmark findings.

G. Impeccable synthesis.

Create a consolidated findings matrix.

Required fields:

- Finding ID.
- Source.
- Affected artifact.
- Evidence location.
- Requirement reference.
- Finding description.
- User impact.
- Severity.
- Confidence.
- Classification.
- Proposed remediation.
- Owner.
- Acceptance criteria.
- Validation method.

### Classifications

- CONFIRMED.
- NEEDS_VISUAL_VALIDATION.
- NEEDS_CLARIFICATION.
- FALSE_POSITIVE.
- DESIGN_PREFERENCE.
- OUT_OF_SCOPE.

### Severity

- CRITICAL.
- HIGH.
- MEDIUM.
- LOW.

Deduplicate overlapping findings.

Preserve historical finding IDs.

Do not inflate issue counts by treating a single root cause as dozens of independent defects.

---

## 13. REMEDIATION PRIORITIZATION

Use this priority order:

### Priority 1 — Domain Correctness

- Approved business rules.
- Permission correctness.
- Decision statuses.
- Atlas references.
- Evidence verification semantics.
- Five state dimensions.

### Priority 2 — Operational Usability

- Control Room comprehension.
- Operational Grid execution.
- Blocker discovery.
- Next Action.
- Waiting On.
- Contextual navigation.
- Bulk operation clarity.

### Priority 3 — Accessibility & Readability

- Typography at actual application viewing size.
- Keyboard behavior.
- Focus visibility.
- Interaction target adequacy.
- Error communication.
- Responsive reachability.

### Priority 4 — Design System Consistency

- Semantic tokens.
- Components.
- State styling.
- Typography rhythm.
- Density.
- Reduced visual noise.

### Priority 5 — Decorative Polish

- Nonessential animations.
- Ornamental styling.
- Cosmetic preferences.

Do not sacrifice legal domain correctness to improve visual appearance.

---

# PHASE D — LOCAL REMEDIATION

## 14. AUTHORIZED IMPLEMENTATION SCOPE

You are explicitly authorized to correct existing design artifacts locally, provided changes follow approved requirements.

Allowed:

- Revise UX concept HTML.
- Revise UX specifications.
- Revise design handoff.
- Correct labels and UI copy.
- Correct prototype controls.
- Correct references and identifiers.
- Clarify interaction states.
- Improve semantic tokens.
- Improve readability where safely applicable.
- Correct clearly evidenced accessibility issues.
- Document architecture-dependent behaviors.
- Produce validation evidence.

Not allowed:

- Change product scope.
- Change approved business decisions.
- Choose new architecture.
- Build production frontend/backend.
- Invent new API contracts.
- Implement a complete design system in Next.js.
- Introduce new dependencies without approval.
- Publish externally.
- Use cloud generation.
- Automatically approve a design direction.

Preserve original artifacts as a recoverable reference using Git history and recorded hashes.

Do not modify original evidence records to conceal prior defects.

---

## 15. FIX R01 — BULK-EDIT FIELD ALLOWLIST

Locate the exact approved P0 bulk-edit policy.

Correct:

- Available bulk-edit controls.
- Bulk-edit menu items.
- Field selection.
- Descriptions.
- Interaction specifications.
- Permission messaging.

Ensure unsupported fields are not offered as supported P0 bulk operations.

Preserve approved:

- Validation rules.
- Authorization.
- Atomic/partial-success behavior.
- Error messaging.
- Audit semantics.

Do not infer bulk-update transaction policy from generic UI conventions.

Acceptance:

All bulk-edit fields and behaviors in the revised design are traceable to approved rules.

---

## 16. FIX R02 — APPROVED DECISIONS

Read the actual approved decision register.

Correct any UX presentation that treats an approved decision as unresolved.

Distinguish:

- APPROVED.
- PENDING.
- REJECTED, if applicable in the approved model.
- Historical decisions.
- Synthetic Atlas decisions.

Do not reopen Product Owner decisions through UX copy.

Acceptance:

Decision states in all screens and handoff specifications match canonical records.

---

## 17. FIX R03 — PROJECT ATLAS IDS

Validate every Project Atlas decision reference.

Check:

- Namespaces.
- IDs.
- Related Matter.
- Synthetic vs governance decisions.
- References between screens.
- Document/specification consistency.

Correct incorrect references.

Do not fabricate a new canonical ID.

Acceptance:

Every displayed decision ID maps to an actual canonical Atlas or governance entry.

---

## 18. FIX R04 — EVIDENCE & PROOF GATE

Clarify the UI presentation of:

- Execution completion.
- Verification state.
- Evidence required.
- Evidence submitted.
- Evidence accepted.
- Unsatisfied proof requirements.
- Dependency readiness.

Preserve:

`COMPLETED ≠ VERIFIED`

Ensure visual feedback does not imply that uploading a document automatically satisfies a legal requirement.

Do not claim the original design contained a demonstrated runtime verification bypass.

This finding concerns the evidence and interaction semantics that the artifacts actually show.

Acceptance:

The design explains whether work is completed, whether proof is sufficient and whether a downstream requirement can proceed.

---

## 19. FIX R05 — CONNECTED FLOWS & MOBILE

Preserve the agreed STEP 03A scope:

**Three connected flows, not the complete product.**

Maintain:

- Unified product shell/navigation.
- Control Room.
- Operational Grid.
- Requirement/Evidence flow.
- Bulk-operation flow.
- Regulatory filing flow.

Do not invent complete product implementation coverage.

For mobile row reachability:

- Preserve `NEEDS_CLARIFICATION` where evidence is insufficient.
- Improve unambiguous issues when supported.
- Identify exact additional validation needed.
- Do not declare mobile accessibility PASS merely because search/filter controls exist.

Acceptance:

Scope is accurately represented and unresolved mobile questions remain visible.

---

# PHASE E — VISUAL & USABILITY REMEDIATION

## 20. UI-T01 — READABILITY

The recovered HTML contains very small source font sizes, including approximately:

- 6.5px state labels.
- 7px mobile metadata.
- 8–9.5px embedded controls.

These may represent miniaturized presentation screens rather than a 1:1 application viewport.

Tasks:

1. Identify review-board scale versus actual app-view scale.
2. Avoid judging thumbnails as full-size app UI.
3. Where possible, provide a readable application-scale representation or explicit scale specification.
4. Improve problematic typography where this does not destroy the review artifact's intended layout.
5. Define practical typography guidance for the eventual application.

Suggested starting points, not universal WCAG rules:

- Body text around 14px or more where appropriate.
- Secondary metadata around 12px or more where practical.

Validate actual rendered context when supported.

Do not claim readability/usability testing if no real viewing evaluation occurred.

---

## 21. UI-T02 — INTERACTIVE TARGETS

Review the reported difference between:

- Mobile navigation target min-height: 34px.
- Primary page control min-height: 44px.

Tasks:

1. Assess intended component role.
2. Assess target geometry when measurable.
3. Assess spacing and neighboring targets.
4. Assess keyboard/focus behavior.
5. Propose coherent interaction-size tokens.

Do not claim automatic WCAG failure from the height value alone.

Do not impose an invented universal 44px requirement on every component.

---

## 22. UI-T03 — DESIGN TOKENS

Review fragmented hardcoded styling.

Where justified and in scope:

- Consolidate semantic colors.
- Define typography tokens.
- Define spacing tokens.
- Define border/focus states.
- Define selected/disabled/error variants.
- Clarify semantic state colors.

Ensure tokens support the five distinct state dimensions.

Avoid representing every positive state with the same green indicator.

Do not remove legally meaningful state information to satisfy visual minimalism.

Do not impose a large new CSS framework.

---

## 23. UI-T04 — ARTIFACT HONESTY

The recovered design HTML is a review document containing conceptual screens and direction boards.

It is not yet a complete operational frontend.

Clarify:

- Which screens are wireframes.
- Which interactions are conceptual.
- Which interactions are demonstrable.
- Which flows have coverage.
- Which functions are not implemented.
- Which aspects remain pending architecture.

Do not claim functional inline editing, backend verification or complete import handling if the HTML only demonstrates feedback states.

Do not expand this remediation into full frontend implementation.

---

## 24. UX DESIGN PRINCIPLES

Improve the artifacts according to these principles:

1. State before decoration.
2. Exceptions before normality.
3. Explain blockers.
4. Show actionable next steps.
5. Preserve context.
6. Support information density.
7. Progressive disclosure.
8. Minimize unnecessary navigation.
9. Clear feedback after user actions.
10. Accessibility by design.
11. Meaningful motion only.
12. Explicit uncertainty.

For the Operational Grid:

Prioritize scanability, clear row states, predictable editing and keyboard-oriented workflows.

For the Control Room:

Prioritize critical information, blocker reasons, milestones, evidence gaps and changes.

Do not add generic dashboard metrics merely to fill space.

---

# PHASE F — LOCAL VALIDATION

## 25. VALIDATE THE REVISED ARTIFACTS

After remediation, execute the applicable safe local checks.

### Structural Validation

- HTML syntax.
- References and links.
- Asset paths.
- Missing files.
- Invalid markup.
- Duplicate identifiers.
- Basic script syntax where applicable.

### Domain Validation

- R01 bulk fields.
- R02 approved decisions.
- R03 Atlas IDs.
- R04 proof semantics.
- R05 scope/mobile documentation.
- Five state dimensions.
- Requirement vs Action.
- Evidence Requirement vs Evidence.
- Dependency semantics.
- Filing lifecycle.
- Document version semantics.

### UX Validation

- Navigation consistency.
- Control Room coverage.
- Operational Grid coverage.
- Connected flows.
- Readability assumptions.
- Focus/disabled/selected/error states.
- Responsive specifications.
- Interaction feedback.

### Visual Validation

If an approved, available visualization mechanism can safely inspect the artifacts, perform the relevant checks.

If browser controls reject `file://` access, respect that policy.

Do not bypass the restriction using another browser-control mechanism.

If actual visual inspection cannot be performed, record:

`VISUAL_VALIDATION_NOT_EXECUTED`

and identify the remaining checks.

Do not claim screenshots, viewport testing or accessibility measurements that were not performed.

### Tool Validation

TasteSkill, Hallmark and Impeccable outputs should be recorded accurately.

Do not require Hallmark FAIL count to reach zero.

Evaluate which remaining findings have genuine user impact.

---

## 26. REGRESSION VERIFICATION

Verify remediation did not:

- Remove a Golden Workflow.
- Lose an approved Requirement/Action distinction.
- Break Project Atlas references.
- Change permission rules.
- Reopen approved decisions.
- Collapse Completion into Verification.
- Remove meaningful error states.
- Hide unresolved architecture dependencies.
- Turn the Operational Grid into a card-only layout.
- Change architecture/API/Auth assumptions.

Review the actual Git diff.

Flag unapproved scope changes.

---

# PHASE G — QA HANDOFF & APPROVAL

## 27. INDEPENDENT QA STATUS

The previous OpenCode attempt returned:

`HTTP 403 / FreeTierError`

Do not automatically retry.

Do not switch external reviewers without Product Owner approval.

Two isolated Impeccable sub-agents are useful critique inputs, but they do not automatically constitute the formal independent QA required by existing project governance.

After remediation:

- Prepare a read-only QA packet.
- Include original and revised artifacts.
- Include changes mapped to findings.
- Include relevant approved rules.
- Include local validation evidence.
- Include outstanding questions.

Keep independent QA status:

`PENDING`

unless an authorized reviewer actually completes the required review.

Do not claim independent QA PASS from Codex's own checks.

---

## 28. DESIGN APPROVAL GATE

Distinguish:

### CRITIQUE_COMPLETE

Two isolated critiques actually executed and returned.

### LOCAL_REMEDIATION_COMPLETE

Approved corrective changes made and locally validated.

### REMEDIATION_COMPLETE_PENDING_QA

No blocking corrective work remains, but independent QA has not completed.

### DESIGN_REVIEW_READY

All required review prerequisites met.

### APPROVED

Product Owner explicitly approved the relevant design direction and artifacts.

Use existing governance status names where possible.

Do not invent incompatible statuses.

Do not automatically mark MC-003A DONE.

Do not start STEP 03B.

---

## 29. REQUIRED DELIVERABLES

Create or update appropriate artifacts under:

`docs/design/step-03a/`

Suggested structure:

### Critique

- `critique/subagent-a-operational-ux.md`
- `critique/subagent-b-visual-system.md`
- `critique/critique-synthesis.md`
- `critique/skill-review-summary.md`

### Remediation

- `remediation/consolidated-findings.md`
- `remediation/remediation-matrix.md`
- `remediation/change-log.md`
- `remediation/local-validation.md`
- `remediation/remaining-questions.md`

### Revised Design

- Revised concept HTML.
- Revised design specification.
- Revised design handoff.
- Updated interaction guidance.
- Draft semantic token specification where appropriate.

### QA

- `qa/local-remediation-review-packet.md`
- `qa/independent-review-status.md`

### Governance

- MC-003A execution report.
- Proposed shared governance updates.
- Product Owner Design Review package.

Adapt filenames to existing repository conventions.

Avoid duplicate documentation.

Do not overwrite the original review evidence or historical findings.

---

## 30. TRACEABILITY REQUIREMENTS

Maintain traceability:

Approved Requirement
→ UI/UX Feature
→ Critique Finding
→ Remediation
→ Changed Artifact
→ Validation Evidence
→ Review Status.

For each confirmed finding, record:

- What was wrong.
- Why it was wrong.
- Which requirement governs it.
- What changed.
- Where it changed.
- How it was validated.
- What remains uncertain.

Do not mark a finding CLOSED merely because its wording changed.

---

## 31. EXECUTION ORDER

Perform the tasks in this order:

### Stage 1 — Baseline & Safety

Inspect repository, preserve hashes and establish worktree isolation.

### Stage 2 — Unanchored Critique

Run Sub-agent A and Sub-agent B independently, read-only.

### Stage 3 — Skills Review

Apply TasteSkill, Hallmark and Impeccable appropriately.

### Stage 4 — Consolidation

Reconcile independent critiques with existing R01–R05 and UI-T01–UI-T04.

### Stage 5 — Local Remediation

Fix confirmed and authorized defects in the existing design artifacts.

### Stage 6 — Validation

Run structural, business-rule and supported UI checks.

### Stage 7 — QA Preparation

Prepare independent review handoff without automatically calling an unauthorized provider.

### Stage 8 — Final Report

Summarize changes, evidence, unresolved findings and approval requirements.

Do not pause for routine implementation confirmation when the changes are clearly within this approved scope.

Escalate only actions that exceed the authorization, introduce new external data processing or require a new Product Owner decision.

---

## 32. FINAL REPORT FORMAT

Report in this order:

### A. Baseline

- Branch/worktree.
- Baseline commit.
- Original artifact hashes.
- Worktree isolation.

### B. Two-Agent Critique

- Actual sub-agent execution status.
- Sub-agent A results.
- Sub-agent B results.
- Overlapping findings.
- Contradictory findings.
- Limitations.

### C. Design Skills

- TasteSkill result.
- Hallmark result.
- Impeccable result.
- Applicable findings.
- False positives.

### D. Consolidated Findings

For R01–R05, UI-T01–UI-T04 and new confirmed findings:

- Severity.
- Classification.
- Evidence.
- Remediation status.

### E. Local Changes

- Files changed.
- Important corrections.
- Design tokens.
- UX improvements.
- Scope limitations.

### F. Validation

- Commands/checks actually executed.
- PASS/FAIL.
- Unexecuted checks.
- Remaining accessibility/visual limitations.

### G. QA & Approval

- Independent QA status.
- Findings needing clarification.
- Product Owner design decisions.
- Proposed design direction, not final approval.

### H. Git & Next Action

- Commit reference, if created.
- Working tree status.
- MC-003A status.
- Exact next action.
- STEP 03B readiness.

Do not claim an execution happened unless evidence exists.

---

## 33. STOP CONDITIONS

Do not:

- Call OpenDesign Cloud.
- Upload the 11-file manifest.
- Consume cloud design credits.
- Retry OpenCode HTTP 403 automatically.
- Change provider/model.
- Deploy production.
- Implement Next.js/Go product code.
- Change product positioning.
- Change P0/P1/P2 scope.
- Change approved business rules.
- Modify STEP 02.3 worktree.
- Select official design direction on behalf of Product Owner.
- Claim full usability/accessibility PASS without evidence.
- Claim independent QA passed based on internal critique.
- Automatically enter STEP 03B.

Stop after local remediation, validation, QA handoff and the Product Owner Review Package.

## FINAL DIRECTIVE

**MatterControl must model the truth of legal work, not merely display tasks.**

The objective is not to make the design pass a styling linter.

The objective is to produce a clearer, more consistent, more usable and more trustworthy MatterControl UX concept while preserving approved legal domain semantics.

Use two independent critiques to discover issues without anchoring.

Use approved business rules to decide what is correct.

Use TasteSkill, Hallmark and Impeccable as design guidance, not as substitutes for domain requirements.

Fix confirmed defects locally.

Preserve the original design evidence.

Keep independent QA and Product Owner approval as separate gates.

**Control Room for comprehension. Operational Grid for execution.**