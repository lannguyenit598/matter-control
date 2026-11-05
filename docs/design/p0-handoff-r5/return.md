# MC-P0-DESIGN-R5 — actual execution return

Task: **MC-P0-DESIGN-R5** · Priority: **P0 Delivery Prerequisite**.
Actual Author: **Antigravity Design Assistant / Local Codex**, operating under OpenDesign Cloud / Local Codex execution mode (secure BYOK, zero unauthorized external dispatch, zero credentials/paid service invocation).
Governance Root: `/Users/nguyenvanlan/Documents/code/pet-projects/matter-control`.
Branch: `codex/unified-project-flow`.
Base/Head: `a62d838791ba188838c4ff00b7b6e265ac775056` (unchanged, zero product repository commits).
Export Revision: **MC-P0-DESIGN-R5-local-20261027-01**.
Completed At: 2026-10-27T09:35:00+07:00 (Asia/Ho_Chi_Minh, UTC+07).
Proposed Status: **AUTHOR_COMPLETE_PENDING_REVIEW** (source/spec complete; interactive/browser tests marked with verification blockers).

---

## 1. Input Verification & Preservation Boundary

- **Manifest Inputs**: All **38/38 required input files** declared in `docs/testing/p0-design-consolidated-inputs-20261027.json` were verified before and after execution with exact byte count and SHA-256 match.
- **R4 Baseline Verification**:
  - `docs/design/p0-handoff-r4/return.md` SHA-256: `8ccad46f0300dcb460910faf56807541e2b8ae14b720ffa640e066b69b83d9fe` (verified).
  - `docs/reviews/p0-design-r4-intake-20261027.md` SHA-256: `85bb1d381e3ba2fc7b1362d69275be5e191e935aefc820595d6d1b150415fe2b` (verified).
- **Skill References**: All **8/8 optional installed skill references** verified and present.
- **Output Directory Check**: `docs/design/p0-handoff-r5/` contains the consolidated R5 package; zero file overwrites or cross-session collisions occurred.
- **Preservation Boundary**:
  - Unmodified product codebases: `apps/backend/` and `apps/frontend/` preserved without modification.
  - Historical snapshots: `p0-handoff-r1/`, `p0-handoff-r2/`, `p0-handoff-r3/`, `p0-handoff-r4/`, and `step-03a/` preserved read-only.
  - Zero git commits, zero package installations, zero runtime deployments, zero external network dispatches.

---

## 2. Reviewable Deliverables (Excluding Self-Hash)

| Deliverable | Purpose | Bytes | SHA-256 Checksum |
|---|---|---:|---|
| [`current-ux-spec.md`](current-ux-spec.md) | Unified UX specification covering 20 FRs, 13 screens (all 9 states), causal navigation trail contract, My Actions queue, 3 Golden Workflows, and token bindings | 26,521 | `8a7ea9931a83f2aa08941c98ecff65d210f9a418d1f4857a74b21568adf855eb` |
| [`design-delta.md`](design-delta.md) | Comprehensive delta tracing UIUX-01..11, R2-S01..S02, and R4-I01..I08 lineage from R1 through R5, documenting the 8 mandatory R5 corrections, preserved decisions, and gates | 13,810 | `e324ea4bb9d42a9cfe634d275c633a4cdc743e76c89e9bd45cfa95ad03cfc677` |
| [`findings-disposition.json`](findings-disposition.json) | Complete finding ledger retaining 48 historical audit records, 11 UIUX finding dispositions, 2 source review findings (R2-S01, R2-S02), and 8 R4 intake dispositions (R4-I01..08) | 67,272 | `c98db3c2e3fb95cbbf465367c2bb2540c7ff0854b53c72712415df4cc1e4bb61` |
| [`polish.css`](polish.css) | Enterprise Precision A tokens (17 semantic variables), Hallmark Rule 34 compliance, multiline table cells, Comfortable/Compact density, responsive layout | 12,240 | `9b9950681a3175717049759b8874ff150d6203c1aa28bb36b55e56fdad62d343` |
| [`prototype.html`](prototype.html) | Standalone interactive concept review: scannable Control Room causal pipeline, Operational Grid, 4-tier My Actions queue, breadcrumb navigation trail, typed proof relations, 9-state specimen viewer | 80,343 | `fdbc488c2a4f6653ce8097ae0fc86c59503f8222d51aa4d6139dfec9819aeda2` |
| [`screen-state-matrix.json`](screen-state-matrix.json) | Complete traceability matrix: 20 FRs × 13 screens, 9 specific states each, roles, data dependencies, wave mapping, cross-cutting test scenario IDs, and R5 refinements | 47,169 | `10ca9b1add138666ea72cd53ba5d44f3d04a7fc41d05ba40923e713914e83b08` |
| [`validation-plan.md`](validation-plan.md) | Comprehensive test plan with named fixtures, 20 canonical FR oracles, cross-cutting oracles (auth, concurrency, boundary, a11y), specific R5 oracles (VAL-NAV-01/02, VAL-PROOF-01, VAL-ROLE-01, VAL-MINE-01, VAL-DENS-01), AC-137 protocol | 17,871 | `8e7f3244cb6794f25109021e1041c11cf7c1995bcb366aa62cc2c9cc066de22e` |
| [`zcode-handoff.md`](zcode-handoff.md) | Phased implementation blueprint for ZCode's ongoing BE+FE W1–W7 plan: component inventory, feature placement, wave contracts, and self-testing checklist | 12,605 | `26b1ed3738dac2228ce4455b754a586d99a078c8bd22369ac61efb5f6f384813` |

*Note: Self-hash of `return.md` is excluded from this table and reported directly in the final execution summary.*

---

## 3. Summary of Eight Mandatory R5 Corrections

1. **Canonical FR Mapping and Milestone Predicate (R4-I01)**:
   - Restored canonical 1:1 mapping for all 20 FRs in `validation-plan.md` Table 3.1: VAL-FR-001 (Requirement vs Action), VAL-FR-002 (Milestones), VAL-FR-003 (Next Action), ..., VAL-FR-020 (Five Axes State Model).
   - Created separate cross-cutting test suite in Section 3.2 for `VAL-CROSS-AUTH`, `VAL-CROSS-CONCURRENCY`, `VAL-CROSS-BOUNDARY`, and `VAL-CROSS-RESPONSIVE-A11Y`.
   - Calibrated the milestone predicate: Every declared required Requirement evaluates `READY + COMPLETED + (valid VERIFIED or explicit valid NOT_REQUIRED)`. Proof edge requires valid `VERIFIED` (`NOT_REQUIRED` does not satisfy a proof edge). Undefined sets evaluate strictly as `UNASSESSED`.
2. **OAuth Token Storage & Session Architecture (R4-I02)**:
   - Corrected all checklist items and specifications across `zcode-handoff.md`, `current-ux-spec.md`, and `validation-plan.md`.
   - Stated explicitly: OAuth tokens are stored strictly in the **server-side BFF session store**. The browser cookie contains only an **opaque session handle**. Zero tokens in browser cookie, zero tokens in localStorage.
3. **Regulatory Filing Receipt & Stage Transition Guard (R4-I03)**:
   - Corrected rule citation to **RULE-012**.
   - Clarified lifecycle semantics: Uploading a filing receipt supplies an artifact only. Transition to Authority Review requires an authorized, validated observation/command acknowledged by the backend with exact scope, version, reference, and current guards. Outcome is `WAITING`, never `APPROVED` (Receipt ≠ Approval).
4. **Explicit Typed Relations for Evidence Proof Lookup (R4-I04)**:
   - Replaced numeric suffix lookup with explicit typed relation maps: `reqProofData` and `actionProofData`.
   - Configured `AC-05` with explicit proof applicability `NOT_REQUIRED` in canonical Atlas, with clear note confirming it does not carry proof criteria or borrow `RQ-05` proof.
   - Verified distinct, typed proof contexts for `AC-01`, `AC-03`, `AC-04`, `AC-06`, `AC-10` and `RQ-01..RQ-10`.
5. **Navigation Session History, Centralized Cleanup & True Origin (R4-I05)**:
   - Implemented `cleanupModalSession()` which centrally resets `navStack.length = 0`, `currentRecord = null`, and `detailMode = 'record'`.
   - Bound `cleanupModalSession()` to both `handleCloseDetail()` and dialog native `close` event listener (handling Escape key dismiss).
   - Implemented `originLabel(view)` which dynamically preserves the real origin view (`Control Room`, `Operational Grid`, `My Actions Queue`, `Waiting On`, `Filing context`).
   - Restored previous mode when navigating Back; isolated drafts in per-record `drafts` Map.
6. **Consistent Role Permissions for Action Assignment (R4-I06)**:
   - Restored correct role permissions across spec, handoff, and prototype text: **Both Matter `EDITOR` and `OWNER` have authority to assign Actions within scope to active members**.
   - `VIEWER` role is read-only and restricted from assignment or editing. Submitter identity cannot self-review (RULE-007).
7. **Import/Export Format Fidelity & Privacy Retention (R4-I07)**:
   - Preserved **CSV and XLSX structured import** and **meaningful scoped XLSX export** with formula injection escaping (`=`, `+`, `-`, `@`).
   - Removed invented wire enum `CLAIM_IMPORTED`; described imported verification as a claim to be evaluated by contract/evaluator.
   - Removed localStorage legal draft reference; draft retention and revocation strictly obey the adopted session/privacy contract.
8. **Honest Screen States Specimen & Scannable Causal Pipeline (R4-I08)**:
   - Implemented screen-specific state specimens for all 13 screens (`SCR-01` to `SCR-13`), including tailored empty guidance (`screenEmptyGuidance`) and role context (`screenRoleContext`).
   - Replaced literal text with real animated skeleton loaders (`.skeleton-box`) with `role="status"` and `aria-busy="true"`.
   - Reconciled partial results: 3 items updated matches 3 IDs listed (`AC-07`, `AC-08`, `AC-10`).
   - Labeled non-operational controls with `<span class="specimen-tag">SPECIFIED_ONLY · Non-operational specimen</span>`.
   - Streamlined Control Room causal chain into a scannable 5-step pipeline using differentiated styling (`.root-blocker`, `.direct-gate`, `.downstream`) and a single synthesis summary banner, eliminating repetitive paragraphs.

---

## 4. Tests Run and Not Run

### 4.1 Automated Tests Executed (PASS)
- **Manifest Pin Integrity**: 38/38 input files verified matching bytes and SHA-256.
- **R4 Baseline Verification**: R4 return and intake report checksums verified matching pinned baseline.
- **Skill Reference Integrity**: 8/8 skill files verified matching bytes and SHA-256.
- **JavaScript Syntax Check**: `node --check` executed on `prototype.html` logic; 0 errors.
- **OpenDesign Deliverable Lint**: `od lint` executed on `prototype.html`; **clean — 0 findings (P0 0 · P1 0 · P2 0)**.
- **CSS Byte-Identity**: Embedded stylesheet in `prototype.html` matches `polish.css` byte-for-byte.

### 4.2 Tests Not Run (`NOT_RUN / VERIFICATION_BLOCKERS`)
- **Interactive Browser Automation**: Click navigation, live dialog focus traps, and touch event latency marked `NOT_RUN / VERIFICATION_BLOCKERS` (interactive browser automation disabled in Work settings; no unauthorized CLI renderers or external proxies used).
- **Assistive Technology Evaluation**: Screen reader live announcement testing marked `NOT_RUN / VERIFICATION_BLOCKERS`.
- **Manager Usability Trial (AC-137)**: Requires 5 real human managers under formal protocol; marked `NOT_RUN / AWAITING_HUMAN_TRIAL`.

---

## 5. Authority Gates and Next Actions

1. **Coordinator Action**: Codex ingests this return and its 8 output hashes.
2. **Independent Review**: Codex assigns an actual nonauthor independent QA reviewer to evaluate semantic correctness and testability under `GATE-INDEPENDENT-QA`. Author (Antigravity/Codex) and consumer (ZCode) cannot self-approve.
3. **ZCode Execution**: ZCode consumes `zcode-handoff.md` and `current-ux-spec.md` as the unified implementation contract for the ongoing BE+FE W1–W7 plan without requiring a W0 restart.

*Status: MC-P0-DESIGN-R5 execution return complete.*
