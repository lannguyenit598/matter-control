Method: isolated Assessment A — Codex internal Operational UX Critic `/root/operational_ux_critique`, commissioned for MC-003A. Source inspection only; independent of detector output. This is advisory design critique, not formal OpenCode QA or a direction approval.

**VISUAL_VALIDATION_NOT_EXECUTED.** Browser policy rejected the user-visible `file://` route; no alternative mechanism, server, script execution or URL workaround was attempted. Layout, geometry, contrast, responsive rendering, accessibility conformance and actual task performance remain unassessed.

## Inputs and provenance

Frozen base identified by the manifest: `3ebc0f0e8daa6dc7682e02dfa61b8fa6b9ca20fb`. No working checkout was inspected or modified.

All three design files were examined under `/tmp/mc003a-unanchored-20261025/design/`; SHA-256 was independently recomputed and matched the manifest:

| File | SHA-256 |
|---|---|
| `mattercontrol-step-03a-ux-concept-review.html` | `6000190940fe42128009ce06b220a1d858228f346c1022a190c8de4eafa4cd4a` |
| `mattercontrol-step-03a-ux-specifications.md` | `3b48b195d6623267165f4c94d3dc5522ced3cec14516bc7ab7e48d54d8f30bbd` |
| `mattercontrol-step-03a-handoff-report.md` | `faf3a981fee1795d7e99d9cd7391703cb1faced429fa8d772aea6a69c649e7f6` |

Normative references consulted, exclusively within the permitted frozen directory: canonical product context, product reality addendum, three golden workflows, state semantics, business rules, permission matrix; relevant SRS, PRD, Step 01 approval and Project Atlas passages. Impeccable’s Assessment A, cognitive-load, heuristic and persona guidance informed the method. No prior reviews, detector results or other MatterControl files were read.

For evidence below, **HTML**, **Specs** and **Handoff** mean those three frozen filenames. Section references identify Markdown evidence; line references identify HTML source.

## Design specificity and strengths

**The concept is substantially specific to MatterControl.** Its strongest organizing idea is the relationship between a required outcome, supplied proof, version identity and downstream consequences. It avoids substituting a generic completion chart for operational truth.

Three strengths deserve preservation:

- The RQ-02 example makes `COMPLETED + UNVERIFIED` concrete. RQ-04, AC-04 and AC-05 distinguish missing proof, external waiting and dependency blockage.
- The document ledger separates authoritative current version from signature completeness; Agreement v3 can be current and only partially signed.
- The artifact repeatedly labels synthetic data, mock interactions, architecture dependencies and unexecuted validation. Handoff §5.4 explicitly says import produces a toast and bulk is client-side simulation. Missing production services are therefore not themselves findings against this exploratory artifact.

The largest opportunity is to complete the bridge from **“I understand the exception”** to **“I know the permitted next step, who owns it, and what evidence will resolve it.”**

## Nielsen scores

Scores describe the **inspectable representation and interaction specification**, not observed usability. Higher is better. No score establishes a pass.

| Heuristic | Score /4 | Basis |
|---|---:|---|
| Visibility of system status | 2 | Strong independent execution/proof labels; weak milestone readiness and timing/attention coverage. |
| Match with real world | 3 | Requirement, evidence, version and authority-waiting language supports actual legal coordination. |
| User control and freedom | 2 | Close controls and selection preservation exist; contextual drill-down loses the preceding object. |
| Consistency and standards | 2 | Common states are consistent; labels, filter semantics and generic dependency destinations diverge. |
| Error prevention | 1 | Bulk proposes an unapproved field and begins with an active due-date change. |
| Recognition rather than recall | 2 | Visible IDs and reasons help; next action, owner and review criteria require inference. |
| Flexibility and efficiency | 1 | Sorting/search/bulk are represented; inline editing is unspecified and row-arrow behavior is absent. |
| Aesthetic and minimalist design | n/a | Visual hierarchy, readability and clutter cannot be responsibly scored without rendering. |
| Error recognition and recovery | 2 | Named conflicts and retained selection help; row reconciliation and durable result details are incomplete. |
| Help and documentation | 2 | Good concept documentation; insufficient contextual help at consequential review/edit decisions. |
| **Total** | **17/36** | **47% of assessed maximum; substantial representation gaps.** |

This is a deliberately limited source assessment, not a numerical ranking of the proposed visual directions.

## Findings

### A-01 — Bulk design changes the approved editing contract

**Screen/flow:** Operational Grid → bulk metadata edit.  
**Severity:** P1. **Confidence:** High.

**Evidence:** HTML lines 2843–2852 and Specs §§4.6, 5 screen 03 specify `owner/date/workstream`. Approved business rule RULE-013 permits **title/description, assigned internal owner and due date**; type and links are excluded. HTML `applyBulk()` changes `record.ws`.

**Impact:** A contributor is invited to relocate work across workstreams under a “metadata only” explanation, while the approved title/description edit path is omitted. Repeating “according to brief” in the handoff does not make that policy approved.

**Correction:** Align the proposed fields and examples with RULE-013. If bulk workstream reassignment is still desired, identify it explicitly as a new policy proposal requiring its own decision.

**Validation needed:** Trace every proposed bulk field across dialog, preview, specifications and handoff to the approved allowlist. Verify existing values remain intact for rejected rows.

### A-02 — The exception summary lacks an explicit next action and accountable internal owner

**Screen/flow:** Control Room, Waiting On, Requirement Detail; especially GW-01/GW-02.  
**Severity:** P1. **Confidence:** High.

**Evidence:** HTML lines 1630–1657 show a blocker chain; lines 1701–1707 show external parties without internal owners or follow-up controls. Requirement detail generated in `openRecord()` provides generic owner facts, proof gate and links, but no explicit next-step block. Specs screen 04 prioritizes overdue/due-soon without defining the approved critical-chain-first candidate order. RULE-021 limits Next Action to assigned `NOT_STARTED/IN_PROGRESS + READY`; waiting work belongs separately.

**Impact:** Managers can identify Cedar or Elm as the external dependency but cannot directly tell who must follow up internally or whether any permitted action is available. GW-02’s statement that AC-04 can be pursued risks treating `WAITING + READY` as itself an actionable candidate.

**Correction:** Add a small next-step/owner/reason representation. Where the fixture has no eligible candidate, say so and distinguish an explicit follow-up action from the waiting record.

**Validation needed:** A manager identifies the responsible internal person and an eligible next action—or correctly explains why none exists—without inferring execution state.

### A-03 — Milestones communicate countdowns without readiness or causal prerequisites

**Screen/flow:** Control Room → milestones.  
**Severity:** P1. **Confidence:** High.

**Evidence:** HTML lines 1710–1717 show “Đã qua,” “3 ngày,” and “7 ngày.” They do not show satisfied/total required prerequisites, unsatisfied reasons or an unassessed state. RULE-008 and SRS FR-002 require that distinction.

**Impact:** “Closing in three days” answers when, but not whether Closing can proceed or which proof gate must change. The generic AC-08 node does not establish the milestone’s approved required-Requirement set.

**Correction:** Show readiness with explicit prerequisite counts and reasons; if that mapping is absent in the frozen fixture, show **unassessed—required prerequisites not supplied**. Link a milestone to those requirements.

**Validation needed:** Separate “deadline near,” “prerequisites unmet,” and “not assessed” in comprehension tasks. Do not infer readiness from date or color.

### A-04 — Drilling into evidence/dependencies discards the object context

**Screen/flow:** Requirement/Action → Evidence or Dependency → return.  
**Severity:** P1. **Confidence:** High for source behavior; runtime focus remains untested.

**Evidence:** HTML lines 3689–3694 close the current dialog before opening the next. The close handler at lines 3859–3865 returns focus only when no dialog remains. Every Requirement receives the same RQ-04/AC-05 dependency explanation in `openRecord()`, including unrelated requirements. Evidence opens the matter-wide table without selecting the originating criterion. Specs §3.2 promises contextual drill-down.

**Impact:** Reviewers must remember which object and criterion they came from. An unrelated requirement can appear to inherit the main Atlas chain explanation. Closing a downstream panel provides no explicit return to the originating object/tab.

**Correction:** Preserve origin ID and tab in a visible breadcrumb/back control; open the appropriate criterion or dependency context. For unavailable relations, state that rather than substituting another object’s graph.

**Validation needed:** Open RQ-02, inspect its evidence and return to its evidence tab; then inspect RQ-11’s dependencies without seeing RQ-04 presented as its own causal chain.

### A-05 — Review decisions omit the information needed to justify acceptance or rejection

**Screen/flow:** Evidence & Verification.  
**Severity:** P1. **Confidence:** High.

**Evidence:** HTML `showEvidenceReview()` supplies criterion ID, document/version and submitter/reviewer IDs, followed by Verify/Reject. Lines 3837–3851 immediately produce a simulated decision; no rationale input or acceptable-proof/validity content is collected. Specs §2.2 and Handoff §8 frame parts of verifier authority as awaiting architecture. RULE-006 and the approved permission matrix already require an independent **designated** EDITOR/OWNER verifier and recorded rationale.

**Impact:** “Reviewer differs from submitter” can be mistaken for sufficient authorization. A reviewer sees a partially signed agreement but lacks the criterion’s required components to decide whether that proof satisfies it.

**Correction:** Show the criterion’s acceptable proof, version rule, validity and required components; explicitly show verifier designation. Specify rationale and guard behavior as part of the interaction, even if production enforcement remains architectural.

**Validation needed:** A non-designated OWNER cannot infer permission; incomplete proof is distinguishable from an acceptable partial component; rejection retains a reason and prior review history.

### A-06 — Bulk defaults and result presentation encourage accidental date changes and weak reconciliation

**Screen/flow:** Bulk preview → apply → result.  
**Severity:** P1. **Confidence:** High.

**Evidence:** HTML line 2851 initializes due date to `2026-06-18` rather than “unchanged.” `applyBulk()` applies every nonempty due value. It then removes successful rows from `selected` **before** `renderBulkPreview(true)` rebuilds its results from the remaining selection.

**Impact:** An owner-only edit also changes dates unless the contributor notices the default. After partial success, the persistent result panel contains failures but no completed-row details; the successful count appears only in a transient toast.

**Correction:** Default every field to unchanged; require an explicit due-date edit. Retain an immutable operation-result list separate from current selection, with before/after values and recovery guidance for failed rows.

**Validation needed:** Owner-only editing leaves dates unchanged. RQ-02 success remains visible beside RQ-10 conflict and RQ-12 denial after application and toast disappearance.

### A-07 — Dense execution is illustrated, but its essential editing and keyboard contract is incomplete

**Screen/flow:** Operational Grid at 50–200 rows.  
**Severity:** P1. **Confidence:** High.

**Evidence:** HTML row generation at lines 3207 onward renders static metadata cells and an ID opener; the Action Detail has no metadata editor. Specs screen 03 lists bulk/detail/import/export, without a concrete inline editing interaction. Keyboard handling at lines 3913–3925 implements Enter and Space but not ArrowUp/Down, despite Specs §§7 and 9 claiming row-arrow support. PRD §UX and SRS FR-011 require dense inline editing and keyboard navigation.

**Impact:** Contributors can inspect records and bulk-edit them but cannot assess the routine one-record edit path, validation error placement or keyboard progression through many records. Blank synthetic extension rows do not test long text, mixed exceptions or realistic editing density.

**Correction:** Specify one representative allowed inline metadata edit with commit/cancel/error preservation and row-arrow behavior. Use a small clearly labeled mixed-state density sample rather than mostly empty filler.

**Validation needed:** Keyboard-only edit, cancel and invalid-input recovery at row 150; preserve filter, selection and scroll. This need not become a complete app to be a reviewable interaction.

### A-08 — “Đang chặn” combines different operational meanings

**Screen/flow:** Grid filter and empty-result recovery.  
**Severity:** P2. **Confidence:** High.

**Evidence:** HTML lines 3127–3137 implement the “Đang chặn” filter as `record.risk || record.dep === "BLOCKED"`. RQ-02 has `risk:true` because proof is missing, with no dependency state supplied. The actual empty table says to clear filters but has no inline reset control; the reset control belongs to a separate demo state.

**Impact:** A user filtering blocked work receives proof exceptions and other flagged records without a precise explanation of whether they are blocked, causing blockage or simply needing attention.

**Correction:** Either narrow the filter or rename it to the actual mixed scope and give each row an explicit inclusion reason. Put a reset action in actual search/filter empty results.

**Validation needed:** RQ-02, RQ-04 and AC-07 each explain why they appear. Clearing a real empty query restores results without switching demonstration states.

### A-09 — Decisions, findings and waiting rows stop before the accountable resolution path

**Screen/flow:** Control Room; GW-02 finding → follow-up → resolution.  
**Severity:** P1. **Confidence:** High.

**Evidence:** HTML lines 1691–1697 show two open decision names and constraints, but no owner, decision question detail or navigation. Lines 1721–1727 show finding/risk placeholders. GW-02 step 05 says to open DD finding #1 and assign AC-04, but these displayed elements are static. RULE-020 requires contextual owner/follow-up/outcome information.

**Impact:** The Manager knows decisions exist but cannot determine who must decide or how that resolves the operational exception. GW-02’s central Gap → Finding → Follow-Up → Resolution handoff lacks a reviewable object representation.

**Correction:** Keep missing fixture details visibly unavailable, but provide a specification-level contextual panel for the question, owner, related objects and resolution proof. Explicitly identify the unavailable mock interaction.

**Validation needed:** Trace a DD finding to an accountable follow-up and required resolution proof; trace each open decision to its owner and affected records.

### A-10 — Status Brief mixes ongoing exceptions into its change section

**Screen/flow:** Control Room changes → Status Brief.  
**Severity:** P2. **Confidence:** High.

**Evidence:** HTML lines 1679–1686 include “RQ-04 vẫn WAITING” in changes; lines 2823–2826 similarly include RQ-04 continuing overdue under “Đã đổi kể từ T-1.” Event references, before/after values and baseline-selection behavior are absent. RULE-016 separates changes in `(t1,t2]` from outstanding conditions at `t2`.

**Impact:** Readers cannot distinguish a new change from an unresolved existing condition. A deliberately labeled mock diff still establishes a potentially misleading reporting pattern.

**Correction:** Separate **changed in window** from **still outstanding**; show explicit baseline/as-of instants and source-event links or unavailable-source labels. Do not imply a new event from continued waiting.

**Validation needed:** An unchanged waiting record appears only as outstanding. A due-threshold crossing is identified as its own dated event when supplied, rather than invented retrospectively.

### A-11 — Golden workflow designs do not yet preserve the complete acceptance paths

**Screen/flow:** GW-01/GW-02/GW-03 specifications.  
**Severity:** P2. **Confidence:** High.

**Evidence:** HTML lines 1459–1478 label an exception-remediation journey GW-01, without mapping Approval → Document → Signature → Payment → Transfer → Closing → Filing → Post-Closing. GW-02 substitutes import for the canonical Request opening and leaves finding resolution abstract. GW-03 lines 1506–1515 begin Preparation → Review rather than Requirement → Package Preparation; screen 11 specifies the happy path but not the repeated supplement cycle and explicit rejection/withdrawal representation in approved state semantics.

**Impact:** Reviewers may approve strong illustrative slices while assuming all three canonical workflows have been covered.

**Correction:** Retain the useful slices, label them as slices and add a compact canonical-step-to-screen/state/evidence map. Specify repeat and negative filing outcomes without requiring a fully functional filing route.

**Validation needed:** Every canonical step maps to a concrete representation or explicit gap; supplement cycles preserve their own references, receipt never implies approval, and transfer/post-closing remain distinct.

## Cognitive and persona assessment

The following are source-based concerns, not measured human behavior.

**Cognitive-load checklist:** grouping and progressive disclosure are represented; single-task focus and one-decision-at-a-time are partial. Recognition/context preservation and minimal-choice guidance fail in important places. Visual hierarchy is unassessable.

Specific decision points exceed four options: nine matter-navigation destinations, seven sortable grid columns, four filter buttons plus search/density/extension, and four Requirement tabs with additional destinations. These counts are **not defects by themselves** in a professional operations product. The problem is the missing prioritization and origin context, not that expert users must never see more than four items.

- **Alex, power user / Contributor:** Can search, sort and select, but cannot evaluate the promised inline-edit or row-arrow path. Bulk starts with a date change already active. At 200 rows, tabbing through each focusable row, checkbox and ID button is a source-indicated efficiency risk, requiring runtime testing.
- **Sam, keyboard/screen-reader user / Reviewer:** Text state labels, native dialogs and named controls are encouraging. Arrow behavior and fallback focus promised in the specification are not fully present in the inspected handlers. No screen-reader, focus visibility, zoom or contrast pass is claimed.
- **Manager under time pressure:** The Control Room supplies the principal causal chain, but the accountable next step, milestone prerequisites and decision owner remain scattered or absent. The emotional valley occurs after understanding the blocker: the screen offers more explanation without a clear resolution handoff.

## Proposed disposition

Treat this as an exploratory concept with valuable domain-specific foundations and **targeted UX/semantic remediation required before calling the implementation brief complete**. No visual direction is selected. No formal QA PASS or DONE status is recommended.

Questions skipped: this isolated assessment returns findings to the orchestrator; it does not reopen product discovery or request existing approvals.

Skipped: visual/browser validation, detector output, production execution, user tests and all file changes.  
Remaining risk: source inspection cannot establish rendered usability; several proposed interactions also conflict with or incompletely represent approved operational rules.