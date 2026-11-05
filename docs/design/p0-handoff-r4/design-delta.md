# MatterControl R4 — design delta

Task: **MC-P0-DESIGN-R4** · Priority **P0** · Author: **Antigravity Design Assistant / Local Codex** · Status: **PROPOSED_IN_REVIEW**.
Repository: `/Users/nguyenvanlan/Documents/code/pet-projects/matter-control`; branch `codex/unified-project-flow`; base/head `a62d838791ba188838c4ff00b7b6e265ac775056`.
Export revision: **MC-P0-DESIGN-R4-local-20261027-01**.

---

## 1. Lineage Across Design Iterations (R1 → R2 → R3 → R4)

The table below summarizes the comprehensive evolution of findings UIUX-01..11 and source review findings R2-S01..S02 across all design revisions.

| Finding | Severity | R1 Baseline Defect | R2 Initial Correction | R3 Diagnostic Refinement | R4 Unified Finalization & Evidence |
|---|---|---|---|---|---|
| **UIUX-01** | P1 | Reassigned FR identities / substituted dashboard and signature workflows | Restored 20 FR identities and SRS ACs/rules; 13 SCR identities; 3 complete GWs | Preserved in matrix and spec; validated in pure helper tests | Full 20 FRs and 13 SCRs linked; GW-01..03 journeys intact in spec and matrix |
| **UIUX-02** | P1 | Title omitted / description replaced by operational_note / wrong AC | Restored 4 metadata fields (title, description, owner, due); atomic per-row audit | Preserved in spec W6 and prototype Data operations | Explicit 4-field allowlist enforced in bulk preview; partial results table specified |
| **UIUX-03** | P1 | Overwrite on conflict; unsafe retry on missing response | Prohibited overwrite; rebase against accepted revision; OUTCOME_UNKNOWN reconciliation | Preserved in spec and prototype draft editor details | Comprehensive conflict/recovery state specimen and draft preservation per record |
| **UIUX-04** | P1 | Short stage ladder / receipt upload auto-advances stage | Restored 9 filing stages, exact versions, package/signature guards, 2 supplement cycles | Preserved in spec W4 and prototype Filing context | 9-stage lifecycle stepper, 2-cycle supplement-response tracker, ARCH-Q5 reopen |
| **UIUX-05** | P1 | Axes on wrong subject / proof on all edges / milestone missing READY | Distinct completion vs proof vs milestone predicates; unavailable never READY | Preserved in spec and helper tests | 5 independent axes strictly uncollapsed; milestone UNASSESSED when set undefined |
| **UIUX-06** | P1 | Two IN_PROGRESS Actions / invented milestone counts | Correct census 4/3/5/0, zero eligible Next Actions; undefined milestones UNASSESSED | Preserved in spec W5 and prototype Control Room | Truthful 0 eligible actions with full causal explanation; self-review caveats |
| **UIUX-07** | P1 | Invented routes/DTOs/ETags/storage/error authority | Semantic data/command needs only; no Git SHA as ETag; dependencies pending | Preserved in zcode-handoff.md | Concrete ZCode integration contract aligned with ongoing W1–W7 execution plan |
| **UIUX-08** | P2 | Hover-only reasons / no concrete screen state contract | Per-screen 9 states, roles, accessible persistent reasons, draft/focus rules | Preserved in screen-state-matrix.json and spec | Interactive Screen States Specimen viewer implemented; full 9 states per screen |
| **UIUX-09** | P2 | Wrong comprehension study / nonexistent proof / incomplete tests | Exact AC-137 protocol (5 managers, unseen 50-row, 10s cutoff); NOT_RUN status | Preserved in validation-plan.md | Validation plan updated with exact oracles; visual NOT_RUN boundaries calibrated |
| **UIUX-10** | P2 | Ambiguous executor / inherited corrections misattributed | Actual executor identity and export hashes; corrections proposed pending review | Preserved in return.md and delta | Calibrated evidence: static reasoning distinguished from rendered observation |
| **UIUX-11** | P2 | Business compositions in domain-free components / missing src root | Primitives in components/; domain composites under apps/frontend/src/features/ | Preserved in zcode-handoff.md | Strict frontend boundary preserved: generic atoms/molecules vs domain features |
| **R2-S01** | P3 | Causal drill-down has no context-aware Back action in prototype | Navigation replaced currentRecord; no Back action to return to parent | Maintained openRecord single record state | **CORRECTED IN R4**: Full `navStack` history, breadcrumbs, Back-to-previous, Return-to-record, Close-to-origin with focus restoration |
| **R2-S02** | P3 | My Actions is a flat assignment table without operational groups | Filtered flat list of U-01 actions; no eligible/waiting/blocked separation | Maintained flat table view | **CORRECTED IN R4**: 4-tier operational queue (Eligible 0, Waiting On, Blocked, Completed), dual status AC-05 explained, U-01 marked alias |

---

## 2. Six Mandatory R4 Corrections and Enhancements

### 2.1 Causal Navigation Trail (Priority 1)
- **Previous State (R3)**: `openRecord()` simply overwrote `currentRecord`. When a user drilled down from `AC-05` into `RQ-04`, the navigation history was lost. Returning required either manually clicking reverse graph links or closing the dialog.
- **R4 Correction**:
  - Implemented an internal LIFO navigation history stack (`navStack`).
  - Added live breadcrumb path rendering: `Grid / AC-05 / RQ-04 / Proof (ER-04)`.
  - Added context-aware navigation buttons:
    - `← Back to [PrevRecord]`: Pops previous record from stack.
    - `← Return to [ParentRecord]`: Returns from proof context to parent record.
    - `Close to Grid`: Closes modal and restores exact focus to opener element.
  - Per-record drafts are isolated in `drafts` Map and preserved across all stack transitions.
  - Full-screen responsive drawer on mobile (`<= 640px`) with persistent top Back and Close controls.

### 2.2 My Actions Operational Queue (Priority 2)
- **Previous State (R3)**: `showView('mine')` filtered `records` by `owner === 'U-01'` and rendered the results in the same flat grid table as Operational Grid.
- **R4 Correction**:
  - Replaced flat table with a dedicated 4-tier operational queue:
    1. **Eligible Actions (0)**: Truthfully reports 0 eligible actions at T0 with complete causal justification.
    2. **Waiting On External Parties (2)**: `AC-04` (waiting on EP-01), `AC-05` (waiting on EP-02).
    3. **Blocked Actions (2)**: `AC-05` (blocked by DEP-01), `AC-12` (blocked by DEP-07).
    4. **Historical / Completed Actions (2)**: `AC-01`, `AC-02`.
  - Resolved `AC-05` dual status: `AC-05` holds execution=`WAITING` and dependency=`BLOCKED`. It is displayed in both Waiting and Blocked sections with shared identity, single draft, and explicit explanatory note, ensuring zero duplicated task counts.
  - Clarified that `U-01` is a testing fixture alias; production queue derives actor from authenticated session context. Assigned Requirements (`RQ-01`, `RQ-12`) moved to a separate reference accordion.

### 2.3 Control Room Hierarchy and Scannability (Priority 3)
- **Previous State (R3)**: Diagnostic cards contained detailed paragraph text, which could feel text-heavy on smaller screens.
- **R4 Correction**:
  - Maintained the strict 6-tier hierarchy: Blockers → Next Actions / Decisions → Waiting On → Milestones → Evidence Gaps → Changes.
  - Restructured causal chain into a scannable 5-step pipeline with distinct role badges (`Root Cause`, `Direct Impact`, `Downstream Pipe`), concise condition/cause/impact summaries, accountable owners, permitted next steps, and inspect triggers.

### 2.4 Complete 13-Screen P0 Inventory & State Specimen (Priority 4)
- **Previous State (R3)**: Matrix specified 9 states per screen, but the prototype had no interactive mechanism to preview non-standard states.
- **R4 Correction**:
  - Full 9-state specification documented for all 13 screens in `current-ux-spec.md` and `screen-state-matrix.json`.
  - Built an interactive **Screen States Specimen Viewer** in `prototype.html` allowing operators and reviewers to directly inspect simulated layouts and error recovery pathways for any screen across all 9 states (`loading`, `empty`, `no_match`, `unavailable`, `forbidden`, `stale`, `conflict`, `partial`, `recovery`).

### 2.5 Grid Typography, Density & Multiline Text Wrapping (Priority 5)
- **Previous State (R3)**: Cells used `min-height: 44px; height: auto;`, but lacked explicit wrapping and Compact font size constraints.
- **R4 Correction**:
  - Comfortable density: `min-height: 44px; padding: 8px 12px; font-size: 14px`.
  - Compact density: `min-height: 36px; padding: 4px 12px; font-size: 14px`.
    > **Strict Rule**: Compact density alters padding only; it strictly preserves 14px body font size (`Compact không giảm cỡ chữ`).
  - Multiline text wrap: `td { overflow-wrap: break-word; word-break: normal; white-space: normal; }`. Long Vietnamese and English titles and reasons wrap naturally without truncation, ellipsis (`...`), or horizontal clipping.
  - Selection counter announces hidden items: `"Selected exact IDs: AC-04, AC-05 · Hidden by current view/filter: AC-12"`.
  - Table row keyboard navigation protects nested input editing and IME composition.

### 2.6 Evidence Calibration & OpenDesign Linter Compliance (Priority 6)
- **Previous State (R3)**: Delta asserted that `overflow-x: clip` was confirmed not to clip focus or break sticky headers, even though rendered tests were marked `NOT_RUN`. OpenDesign linter had 1 P2 warning for missing section anchors.
- **R4 Correction**:
  - Explicitly separated static CSS reasoning from confirmed rendered observation.
  - Executed static headless image render via `od export` and confirmed exact output image (`/tmp/prototype-r4-export.png`, 1,009,636 bytes, SHA-256: `8825b2f773fd4b821b6dcb9cf496850c94fbfe088654296f7a8b1224e8ec2fc6`).
  - Interactive browser tests, focus trap evaluations, and AC-137 manager trials strictly marked `NOT_RUN / VERIFICATION_BLOCKED`.
  - Added `data-od-id` to all sections, dialogs, articles, and navigation bars.
  - Added `letter-spacing: 0.08em` to all uppercase typography (`.step-tag`, `.proof-card h4`, `.state-pill`).
  - OpenDesign lint result: **clean — 0 findings (P0 0 · P1 0 · P2 0)**!

---

## 3. Preserved Baseline Decisions

The following foundational decisions remain authoritative and are preserved unchanged:
1. **Design System**: Enterprise Precision A foundation with selective causal rail B and compact density C.
2. **Color Palette**: 17 selected semantic color tokens (`--r2-surface: #ffffff; --r2-background: #f6f8fa; --r2-ink: #17212b; ...`). Zero new color tokens invented.
3. **Typography**: System Humanist Sans for UI (`"Segoe UI", "Helvetica Neue", Arial, sans-serif`), monospace for IDs/time/code/data (`SFMono-Regular, Menlo, monospace`). Body 14px / 1.5 leading.
4. **Canonical Atlas T0**: Exact 24 records (12 Requirements, 12 Actions), 7 edges, Action census 4 completed / 3 waiting / 5 not started / 0 in progress, 0 eligible Next Actions, MS-01..03 UNASSESSED.

---

## 4. Open Authority Gates

1. **Mandatory Nonauthor Independent Review (`GATE-INDEPENDENT-QA`)**: Remains **PENDING**. Author (Codex/Antigravity) and implementer (ZCode) cannot self-approve this packet.
2. **Formal Design Gate (`STEP_03A_APPROVED` / `STEP03B`)**: Not yet granted. This packet provides the consolidated design and interaction contract for ZCode's ongoing BE+FE implementation.
3. **Interactive & User Usability Acceptance**: Marked `NOT_RUN / VERIFICATION_BLOCKED`. Requires interactive browser execution and 5-manager trial under approved AC-137 protocol.

*Proposed status: `IN_REVIEW / PROPOSED_SOURCE_AND_SPEC_UPDATE`.*
