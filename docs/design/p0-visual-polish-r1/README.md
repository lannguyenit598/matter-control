# MatterControl — three-skill visual refinement proposal

Task **MC-P0-VISUAL-POLISH-R1**. Owner: actual Codex / Local Codex; 2026-10-27, Asia/Ho_Chi_Minh. Priority: P0 design support. Base/head: `a62d838791ba188838c4ff00b7b6e265ac775056`, branch `codex/unified-project-flow`. Requirement linkage: D-UX01..04, FR-009/011/015/020, AC-137/150/151; implementation and acceptance gates unchanged. Proposed status: **IN_REVIEW / SOURCE_PROPOSAL_ONLY**. Reviewer: assigned actual nonauthor, after a permitted rendered target is available.

The user explicitly requested tasteskill, nutlope/hallmark and pbakaus/impeccable to improve the design. This return applies their installed guidance to a **concrete source-level prototype refinement**, keeping the selected Enterprise Precision system. It is not a completed rendered run of any of the three skills.

## Open the proposal

- [Prototype — app anchor](prototype.html#mcApp): the original local-r3 concept plus the new embedded stylesheet. The surrounding review document, alternate boards and every historical caveat remain present.
- [Polish stylesheet](polish.css): the exact added layer, also embedded in the prototype so the HTML remains self-contained.
- [Source checks and actual static lint returns](source-checks.json): exact pins, commands, exit codes and limits. The first and corrected lint logs are retained alongside it.

No server, build, browser or prototype script was executed. Opening this source in an editor does not establish that it renders or behaves correctly.

## Design choices applied

| Skill | Applied to this proposal | Limit |
|---|---|---|
| **tasteskill v2 / app screens** | Product-specific causal chain as the signature; clearer distinction between header, evidence and metadata; sentence-case table headers without tracked capitals; consistent alignment and restrained surfaces. | No new style draw: D-UX01..04 already select the system. Generic truncation, one-status-per-row and palette restrictions yield to the approved multiline/five-axis contract. The app guidance's desktop study is not proof of legal-operations/mobile usability. |
| **Hallmark v2 / app scope** | Existing content and wiring retained; token-based new colors/fonts; readable density; no new hero, vanity metrics, stock imagery or landing-page choreography; focus/active/reduced-motion rules. | No theme replacement, fresh-context visual judging or rendered sweep. The new CSS's static sweep is separate from inherited HTML/source compliance. Existing tokens override conflicting house defaults; no waiver of product truth/accessibility. |
| **Impeccable / Operate + polish** | Refinement within the incumbent system; stronger hierarchy, aligned spacing, consistent controls and drawer typography; state-feedback motion with static fallback. | `impeccable context` returned exit 127 in no-download mode. No root PRODUCT.md/DESIGN.md existed; approved project context was read directly. No engine install, drift repair, hook/global-setting change or visual PASS. |

Installed skill paths and source hashes are recorded in source-checks.json. The public reference supplied by the user is [pbakaus/impeccable](https://github.com/pbakaus/impeccable); guidance was read from the already installed local skill rather than installed or updated from the network.

## What changed in the prototype

1. **Control Room:** a flat, consistent panel system; clearer panel headings and calmer metadata; tighter grouping of related facts. The critical causal chain retains its full width and receives readable identity/outcome hierarchy. Next Actions and Important Decisions retain their approved DOM order.
2. **Navigation and scope:** more usable navigation pitch, consistent selected/hover treatment and removal of decorative empty nav dots. The product's scope, role and as-of content remain unchanged. Approved Lucide-family implementation remains a separate handoff; no animation package was added here.
3. **Operational Grid:** sentence-case header styling, stable numeric figures, quieter row rules, consistent toolbar spacing and natural long-label growth. Comfortable/Compact minimums and selected-row treatment remain inherited. No data column, record or state axis was removed.
4. **Detail/evidence dialogs:** shared application typography and spacing; clearer headings, labelled fields and visible focus; mobile control sizing proposals without replacing native dialogs or existing focus logic.
5. **Feedback:** guarded press feedback and short hover transitions. No page-load entrance, simulated business success or new asynchronous operation. Reduced motion disables added transitions and press transforms. Drawers and table reachability still require actual interaction checks.

The base 17-color palette remains in the inherited selected tokens. New CSS uses aliases to selected colors plus one derived neutral rule color; the new spacing/radius values are local visual proposals, not a new system or architecture. Existing serif review-document styling is outside the application refinement. Critical enum labels and IDs remain as supplied; the stylesheet changes casing presentation on decorative UI labels only.

## Preservation and verification

- Removing the one new `<style id="mc-visual-polish-r1">` block recovers the original local-r3 HTML **byte for byte**.
- Body markup/content and every script block are byte-identical. All 24 Atlas rows, historical self-review caveats, no-eligible-Action explanation, UNASSESSED milestone behavior, fields, data attributes, handlers, dialogs and simulation boundaries are preserved from that base.
- Original files, R1/R2 handoffs, product source, pending review packets and formal ledgers were not modified. The standalone CSS is byte-identical to its embedded copy.
- Static **Hallmark, new CSS only:** first run found a missing active state and heading-wrap warning; both corrected. Final run: exit 0, 0 FAIL / 0 REFLEX / 0 WARN; render off.
- Static **tasteskill, new CSS only:** final exit 0, no FAIL; four warnings retained with reasons: monospace token is used for literal RQ/AC IDs, and three `box-shadow: none` declarations explicitly remove inherited resting shadows. Raw output is retained; no blanket suppression or full-prototype PASS is claimed.
- Browser capture, computed styles, responsive geometry, focus traversal, screen-reader behavior, animation appearance and AC-137 manager trials are **NOT_RUN**. Static lint does not establish aesthetic quality, accessibility or domain correctness.

## Handoff and exact next action

Use this proposal as an additional visual reference alongside the [R2 correction prompt](../../implementation/handoffs/MC-P0-DESIGN-R2-CORRECTION-PROMPT.md), [experience brief](../../implementation/handoffs/MC-P0-DESIGN-R2-EXPERIENCE-ADDENDUM.md) and [icon selection](../../implementation/handoffs/MC-P0-DESIGN-R2-ICON-DECISION.md). The prototype is based on frozen local-r3, **not an adoption of the contradicted P0 R1 specification**. UIUX-01..11 and full three-workflow coverage remain separate required R2 work.

When browser use is permitted, capture this exact revision's Control Room → blocker detail/evidence → Grid path at 1440×900, 1280×800, 768px, 390px and 200% zoom; inspect the captures and operate keyboard/touch/focus/error paths. Compare against the pinned original and correct any clipping, unhelpful spacing, ordering or focus regressions before acceptance. Skills requiring capture say to judge actual rendered results; do not route around the currently disabled browser with another runtime/server/OS capture. The skills' render/visual stages remain blocked by that setting, not waived.

ZCode should later implement accepted design decisions with existing frontend components under the appropriate activated wave, rather than copying the historical concept's simulation JavaScript into product code. No external design/reviewer/engineering agent was dispatched by this return. No STEP03A_APPROVED, STEP03B, INT-A/MC-002 closure or release is granted.

Skipped: full rendered skill workflows, screenshot/interaction/user testing, product builds, dependencies, external agent generation and Git mutations. Remaining risk: the CSS proposal has not been visually observed; inherited concept limitations and the 11 R2 contract findings remain open.
