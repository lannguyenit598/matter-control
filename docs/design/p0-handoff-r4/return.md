# MC-P0-DESIGN-R4 — actual execution return

Task: **MC-P0-DESIGN-R4** · Priority: **P0 Delivery Prerequisite**.
Actual Author: **Antigravity Design Assistant / Local Codex**, operating under OpenDesign Cloud / Local Codex execution mode (secure BYOK, zero unauthorized external dispatch, zero credentials/paid service invocation).
Governance Root: `/Users/nguyenvanlan/Documents/code/pet-projects/matter-control`.
Branch: `codex/unified-project-flow`.
Base/Head: `a62d838791ba188838c4ff00b7b6e265ac775056` (unchanged, zero product repository commits).
Export Revision: **MC-P0-DESIGN-R4-local-20261027-01**.
Completed At: 2026-10-27T08:02:00+07:00 (Asia/Ho_Chi_Minh, UTC+07).
Proposed Status: **IN_REVIEW / PROPOSED_SOURCE_AND_SPEC_UPDATE**.

---

## 1. Input Verification & Preservation Boundary

- **Manifest Inputs**: All **38/38 required input files** declared in `docs/testing/p0-design-consolidated-inputs-20261027.json` were verified before and after execution with exact byte count and SHA-256 match.
- **Skill References**: All **8/8 optional installed skill references** verified and present.
- **Output Directory Check**: `docs/design/p0-handoff-r4/` was verified completely absent prior to execution. It was created cleanly; zero file overwrites or cross-session collisions occurred.
- **Preservation Boundary**:
  - Unmodified product codebases: `apps/backend/` and `apps/frontend/` preserved without modification.
  - Historical snapshots: `p0-handoff-r1/`, `p0-handoff-r2/`, `p0-handoff-r3/`, and `step-03a/` preserved read-only.
  - Zero git commits, zero package installations, zero runtime deployments, zero external network dispatches.

---

## 2. Reviewable Deliverables (Excluding Self-Hash)

| Deliverable | Purpose | Bytes | SHA-256 Checksum |
|---|---|---:|---|
| [`current-ux-spec.md`](current-ux-spec.md) | Unified UX specification covering 20 FRs, 13 screens (all 9 states), causal navigation trail contract, My Actions queue, 3 Golden Workflows, and token bindings | 23,611 | `e0ea03009c1efb8351293fc2d2163585c0b3d1cfd3804b18c465243f8bfbe1ef` |
| [`design-delta.md`](design-delta.md) | Comprehensive delta tracing UIUX-01..11 and R2-S01..S02 lineage from R1 through R4, documenting the 6 mandatory R4 corrections, preserved decisions, and gates | 11,512 | `63b831f812dd38ad226496eb97ecf05e249d99411bcd0bc99b67ac8517a208e0` |
| [`findings-disposition.json`](findings-disposition.json) | Complete finding ledger retaining 48 historical audit records, 11 UIUX finding dispositions, and 2 source review findings (R2-S01, R2-S02) | 57,517 | `dbaa147719f63619145451d23fe74543dd0412b1df95b4ecbaa03e56eaac365a` |
| [`polish.css`](polish.css) | Enterprise Precision A tokens (17 semantic variables), Hallmark Rule 34 compliance, multiline table cells, Comfortable/Compact density, responsive layout | 11,389 | `fcf156e9b7035786dc976f7aa7fc5ac6e8ae7e1e17c45ffbaee2328716e529a5` |
| [`prototype.html`](prototype.html) | Standalone interactive concept review: Control Room causal pipeline, Operational Grid, 4-tier My Actions queue, breadcrumb navigation trail, 9-state specimen viewer | 70,854 | `865d2f0d0ba2c1308edfffd5ed25af882f870be43718e6b142a92518abadf05d` |
| [`screen-state-matrix.json`](screen-state-matrix.json) | Complete traceability matrix: 20 FRs × 13 screens, 9 specific states each, roles, data dependencies, wave mapping, and test scenario IDs | 44,718 | `68e017a3fabe7b481677863fdd75d82ff7e5ea5a9b037516cd8a4c1de0cd98db` |
| [`validation-plan.md`](validation-plan.md) | Comprehensive test plan with named fixtures, 20 FR oracles, 13 screen oracles, specific R4 oracles (VAL-NAV-01, VAL-MINE-01, VAL-DENS-01), AC-137 protocol | 13,852 | `ff2d5a5f4462b5846978b9901b33031c3d3716a9fc3847b6d1b8ea7b199cda95` |
| [`zcode-handoff.md`](zcode-handoff.md) | Phased implementation blueprint for ZCode's ongoing BE+FE W1–W7 plan: component inventory, feature placement, wave contracts, and self-testing checklist | 12,891 | `f6ad8752186bae05ef1b047787aeccc75f9dcad4ac833945872e6e0d70e3bac4` |

*Note: Self-hash of `return.md` is excluded from this table and reported directly in the final execution summary.*

---

## 3. Summary of Six Mandatory R4 Corrections

1. **Causal Navigation Trail & History Stack**:
   - Implemented an internal LIFO navigation history stack (`navStack`) and dynamic breadcrumbs (`Grid / AC-05 / RQ-04 / Proof (ER-04)`).
   - Added context-aware buttons: `← Back to [PrevRecord]`, `← Return to Record`, and `Close to Grid` (restoring exact opener focus).
   - Per-record drafts preserved in memory across all navigation hops.
   - Full-screen responsive drawer on mobile with persistent top controls.
2. **My Actions Operational Queue**:
   - Implemented a 4-tier operational structure: 1. Eligible Actions (truthful 0 at T0 with justification), 2. Waiting On External Parties (AC-04, AC-05), 3. Blocked Actions (AC-05, AC-12), and 4. Historical / Completed (AC-01, AC-02).
   - Resolved `AC-05` dual status: explicitly displayed in both Waiting and Blocked sections with shared identity, single draft, and explanatory callout without duplicating task counts.
   - U-01 documented as fixture alias; production actor derived from authenticated session. Assigned Requirements moved to reference section.
3. **Control Room Hierarchy & Scannability**:
   - Maintained strict 6-tier hierarchy: Blockers → Next Actions / Decisions → Waiting On → Milestones → Evidence Gaps → Changes.
   - Structured the causal chain into a scannable 5-step pipeline with distinct role badges (`Root Cause`, `Direct Impact`, `Downstream Pipe`), conditions, causes, impacts, owners, permitted next steps, and inspect triggers.
4. **Complete 13-Screen Inventory & State Specimen**:
   - Full 9-state specification (`loading`, `empty`, `no_match`, `unavailable`, `forbidden`, `stale`, `conflict`, `partial`, `recovery`) documented for all 13 screens.
   - Built an interactive **Screen States Specimen Viewer** in `prototype.html` allowing live inspection of all 9 states across any of the 13 screens.
5. **Grid Typography, Density & Multiline Text Wrapping**:
   - Comfortable (44px min-height) vs Compact (36px min-height). **Compact strictly preserves 14px body font size** (`Compact không giảm cỡ chữ`).
   - Multiline cell wrap enabled (`overflow-wrap: break-word`) for long Vietnamese and English text without clipping or ellipsis.
   - Selection counter announces hidden filtered records.
   - Table keyboard navigation protects nested input editing and IME composition.
6. **Evidence Calibration & OpenDesign Linter Compliance**:
   - Clarified static CSS reasoning vs confirmed rendered observation.
   - Static headless image render executed via `od export` and verified (`/tmp/prototype-r4-export.png`, 1,009,636 bytes, SHA-256: `8825b2f773fd4b821b6dcb9cf496850c94fbfe088654296f7a8b1224e8ec2fc6`).
   - Interactive browser automation and AC-137 manager trials strictly classified as `NOT_RUN / VERIFICATION_BLOCKED`.
   - OpenDesign linter: **clean — 0 findings (P0 0 · P1 0 · P2 0)**!

---

## 4. Tests Run and Not Run

### 4.1 Automated Tests Executed (PASS)
- **Manifest Pin Integrity**: 38/38 input files verified matching bytes and SHA-256.
- **Skill Reference Integrity**: 8/8 skill files verified matching bytes and SHA-256.
- **JavaScript Syntax Check**: `node --check` executed on `prototype.html` logic; 0 errors.
- **OpenDesign Deliverable Lint**: `od lint` executed on `prototype.html`; **0 findings (P0 0 · P1 0 · P2 0)**.
- **CSS Byte-Identity**: Embedded stylesheet in `prototype.html` matches `polish.css` byte-for-byte.
- **Static Headless Render**: `od export` executed successfully; rasterized output inspected.

### 4.2 Tests Not Run (`NOT_RUN / VERIFICATION_BLOCKED`)
- **Interactive Browser Automation**: Click navigation, live dialog focus traps, and touch event latency NOT_RUN (interactive browser disabled in Work settings).
- **Assistive Technology Evaluation**: Screen reader live announcement testing NOT_RUN.
- **Manager Usability Trial (AC-137)**: Requires 5 real human managers under formal protocol; NOT_RUN during design preparation.

---

## 5. Authority Gates and Next Actions

1. **Coordinator Action**: Codex ingests this return and its 8 output hashes.
2. **Independent Review**: Codex assigns an actual nonauthor independent QA reviewer to evaluate semantic correctness and testability under `GATE-INDEPENDENT-QA`. Author (Codex/Antigravity) and consumer (ZCode) cannot self-approve.
3. **ZCode Execution**: ZCode consumes `zcode-handoff.md` and `current-ux-spec.md` as the unified implementation contract for the ongoing BE+FE W1–W7 plan.

*Status: MC-P0-DESIGN-R4 execution return complete.*
