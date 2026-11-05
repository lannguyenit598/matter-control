## MC-003A — Assessment B: Visual & Design System Critique

**Identity:** Internal commissioned Codex agent B, `/root/visual_system_critique`. This is source assessment, not formal external QA or design approval.

**Input baseline:** Frozen snapshot manifest base `3ebc0f0e8daa6dc7682e02dfa61b8fa6b9ca20fb`. No edits, commits, runtime execution, external calls or agent delegation.

**Assessment:** The artifact offers a coherent exploratory foundation for reviewing information hierarchy and operational concepts. It is insufficient to validate production typography, contrast, density or accessibility. Its most consequential source gap is incomplete visual treatment of the five independent state axes.

### Inputs and provenance

All design files were read under `/tmp/mc003a-unanchored-20261025/design/`.

| Input | SHA-256 recorded in frozen manifest |
|---|---|
| `mattercontrol-step-03a-ux-concept-review.html` | `6000190940fe42128009ce06b220a1d858228f346c1022a190c8de4eafa4cd4a` |
| `mattercontrol-step-03a-ux-specifications.md` | `3b48b195d6623267165f4c94d3dc5522ced3cec14516bc7ab7e48d54d8f30bbd` |
| `mattercontrol-step-03a-handoff-report.md` | `faf3a981fee1795d7e99d9cd7391703cb1faced429fa8d772aea6a69c649e7f6` |

Neutral policy reference read: `normative/docs/requirements/state-semantics.md`, manifest SHA-256 `156ca1dd2f75a7374a59d2aa4af4a9815ce62a2f11c03f84977bad2860a2ad51`.

Hashes above are manifest values, not independently recomputed hashes.

### Evidence limits

- **VISUAL_VALIDATION_NOT_EXECUTED.** The browser restriction was respected; no alternative browser mechanism or HTTP workaround was attempted.
- Impeccable detector unavailable, as reported in commissioning context: no-download probes exited `127`. No detector findings were inspected. This is unavailable evidence, not a clean result or PASS.
- No screenshots, computed styles, contrast measurements, zoom trials, pointer measurements, assistive-technology tests or participant observations.
- The HTML is a presentation containing miniature wireframes and mock behavior. Small text in its `.wire`, `.dp` and `.phone` previews is not evidence of equivalent production text size.
- Embedded direction recommendations remain unapproved author proposals. No direction was selected.

### Strengths supported by source

1. **Operational hierarchy has a clear purpose.** Specifications §5.02 places blocker chains and missing proof before decisions, waiting parties, milestones and changes. This supports comprehension rather than generic dashboard browsing.
2. **Important distinctions survive visual composition.** HTML lines 1773–1790 supplies separate execution, verification and dependency columns. `stateMarkup`, lines 3083–3104, retains state text alongside decorative dots.
3. **Presentation and component roles are reasonably consistent.** Serif headings, sans-serif prose and monospace identifiers/timestamps are explicitly assigned in Specifications §10.3. Controls, separators and panel spacing repeat across the artifact.
4. **Responsive intent is substantive.** CSS lines 933–1023 stacks content, changes the Grid to cards and adapts drawers, rather than merely shrinking the desktop layout.
5. **Recovery and validation limits are candid.** Default/loading/error/denied/stale/conflict/partial specimens exist; the specifications explicitly deny completed usability or accessibility validation.

### Findings

**B-01 — Complete the visual contract for timing and attention**

- **Severity:** P1, before implementation handoff.
- **Classification / confidence:** `CONFIRMED` specification coverage gap; high confidence.
- **Evidence:** Approved `state-semantics.md` lines 7–13 and 55–59 define five axes, including timing and attention. HTML lines 1773–1790 exposes execution, verification, dependency and a due date, without timing or attention columns. `stateMarkup`, lines 3083–3104, handles only execution, verification and dependency. Specifications §4 models execution/verification/dependency but does not provide equivalent timing/attention state contracts.
- **Impact:** A date alone does not communicate assessed timing; an overdue date does not replace attention with its reason. Implementers could accidentally collapse urgency into red blockers or require users to infer it.
- **Correction:** Add a compact five-axis specimen/mapping, including applicability, unavailable/unassessed cases and reason disclosure. Preserve separate axes without requiring five badges everywhere; specify what appears in Grid, Control Room and detail.
- **Required rendered validation:** Test combinations such as `COMPLETED + UNVERIFIED`, `WAITING + READY`, and overdue versus independently critical records. Verify users can identify each signal and its cause without relying on color.

**B-02 — The seed lacks a calibrated production typography and density specimen**

- **Severity:** P2, before approving production tokens.
- **Classification / confidence:** `NEEDS_CLARIFICATION` and `NEEDS_VISUAL_VALIDATION`; high confidence in the missing calibration, no asserted readability failure.
- **Evidence:** Specifications §10.3 assigns font families but no production role sizes/line heights. §10.4 promises Grid rows of 40px/32px. HTML lines 681–707 uses miniature table typography and padding; density changes padding rather than establishing those row heights. The separate type specimen, lines 2000–2009, does not establish a full production role scale.
- **Impact:** Reviewers cannot confidently transfer the demonstration’s perceived density into a real application. Vietnamese diacritics, long labels and multiline evidence descriptions may change the usable row geometry.
- **Correction:** Supply one explicitly labeled 1:1 reference specimen with heading/body/label/state/ID sizes, line heights and comfortable/compact row rules. Keep presentation thumbnail scaling separate.
- **Required rendered validation:** Compare 1:1 Grid and evidence detail at ordinary viewing size, with actual fallback fonts, long Vietnamese labels, 200% text/zoom and narrow layouts. Assess alignment and scanning before choosing density.

**B-03 — Touch-target guidance is not consistently represented by interactive controls**

- **Severity:** P2.
- **Classification / confidence:** `CONFIRMED` source/spec inconsistency; high confidence. WCAG failure is not established.
- **Evidence:** Specifications §9 and HTML line 2268 promise 44×44px touch targets. CSS line 937 sets mobile navigation to 34px minimum height; lines 969–977 set several mobile controls to 34–40px. Dialog close controls are 32×32px at line 825; dialog tabs are 34px tall at line 830, without corresponding mobile enlargement.
- **Impact:** A reviewer attempting the interactive presentation on touch may encounter smaller targets than the documented design rule. Those values could also be copied into implementation.
- **Correction:** Distinguish presentation-only controls from intended application controls. Give the latter a consistent touch hit-area rule, including dialog close, tabs and filters.
- **Required rendered validation:** Measure actual clickable rectangles and spacing on touch layouts, including landscape and zoom. Test adjacent targets and controls near scrollable edges.

**B-04 — Keyboard and focus-restoration claims exceed the source behavior**

- **Severity:** P2.
- **Classification / confidence:** `CONFIRMED` source gap; high confidence. Actual browser focus outcome remains untested.
- **Evidence:** HTML lines 2124 and 2267 promise ArrowUp/Down row navigation. The row keyboard handler, lines 3913–3925, handles Enter and Space only. Lines 2203–2204 promise restoration to a labeled container when the trigger disappears; the close handler, lines 3860–3865, restores only when the original opener remains in the document.
- **Impact:** Keyboard review of a dense Grid may require excessive tabbing, while close-after-rerender can lose the documented return location. This prevents reliable evaluation of focus hierarchy.
- **Correction:** Implement the promised minimum behavior in the prototype or explicitly mark it as specification-only. Define a stable, focusable fallback destination and avoid hijacking keys intended for nested controls.
- **Required rendered validation:** Navigate rows and their nested controls with keyboard; open/close drawers after filtering, sorting and bulk rerendering; verify the visible focus indicator and restored context.

**B-05 — Semantic token mapping needs consolidation before becoming a component contract**

- **Severity:** P2.
- **Classification / confidence:** `CONFIRMED` token inconsistency; high confidence. Resulting contrast is unmeasured.
- **Evidence:** HTML root tokens, lines 9–35, use `--paper`, `--ink`, `--line`; the documented palette at lines 1977–1983 names `--bg`, `--fg`, `--border`; the demo introduces a third `--mc-*` set at line 564. `.state` references undefined `--mc-ink-2` at line 707. Semantic specimens at lines 1989–1994 map broad terms such as “success · VERIFIED · closed,” rather than enumerating the approved axes.
- **Impact:** The seed has no single unambiguous mapping from documented roles to actual components. An undefined color reference can fall back through inheritance; broad “closed/success” styling risks suggesting proof satisfaction where execution alone is terminal.
- **Correction:** Document which namespace belongs to the presentation versus application seed, remove the dangling reference, and map semantic roles to exact state cases. Sharing colors is acceptable; sharing meaning is not.
- **Required rendered validation:** Inspect computed foreground/background pairs for ordinary, selected, hovered, disabled and disputed states. Confirm terminal execution remains visually distinguishable from verified proof.

### Visual validation still required

These are assessment limits, not additional confirmed defects:

- **Contrast:** Measure applicable text, borders, focus rings and selected states against their rendered backgrounds. OKLch lightness alone does not establish a contrast ratio.
- **Hierarchy and spacing:** At 1:1 size, test whether users find the principal blocker and next responsible party before reading secondary counts.
- **Responsive and zoom:** Run the documented viewport matrix plus zoom/reflow checks; inspect sticky regions, dialog footers, clipped focus and internal table scrolling.
- **Error/disabled states:** Check local explanations, contrast and focus placement with realistic long copy. The broad state specimens establish intent, not every component combination.
- **Direction comparison:** Evaluate equivalent content and states at equivalent scale before any PO choice. No evidence here establishes that one direction is more usable or less fatiguing.

**Proposed status:** Assessment B complete as an internal source critique; rendered validation remains outstanding. Do not record external QA, WCAG PASS, usability PASS or visual-direction approval.

Skipped rendering, detector execution, runtime interaction, contrast measurement and design edits. Remaining risk: the seed may be mistaken for a validated implementation contract despite unresolved five-axis coverage and visual calibration.