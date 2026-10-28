# MatterControl R4 — validation plan and actual run boundary

Task: **MC-P0-DESIGN-R4** · Priority **P0** · Author: **Antigravity Design Assistant / Local Codex** · Status: **PROPOSED_IN_REVIEW**.
Repository: `/Users/nguyenvanlan/Documents/code/pet-projects/matter-control`; branch `codex/unified-project-flow`; base/head `a62d838791ba188838c4ff00b7b6e265ac775056`.
Export revision: **MC-P0-DESIGN-R4-local-20261027-01**.

---

## 1. Actual Run Boundary & Evidence Calibration

This document specifies the validation plan, test fixtures, scenario oracles, and execution boundaries for MatterControl P0.

### 1.1 Separation of Evidence Types
- **Static Source Assertions**: **CONFIRMED PASS** (20 automated assertions verifying 38 manifest pins, 20 FRs, 13 SCRs, 3 GWs, 24 canonical records, 4/3/5/0 census, JavaScript syntax `node --check`, and pure helper logic).
- **Static Headless Image Render**: **CONFIRMED EXPORTED** (`od export` generated `/tmp/prototype-r4-export.png`, 1,009,636 bytes, SHA-256: `8825b2f773fd4b821b6dcb9cf496850c94fbfe088654296f7a8b1224e8ec2fc6`).
- **Interactive Browser Automation, Live Focus Traps, and Touch Events**: **NOT_RUN / VERIFICATION_BLOCKED** (interactive in-app browser is disabled in Work settings; no unauthorized proxy, alternate browser, or OS capture tool is permitted).
- **Human Usability Trial (AC-137)**: **NOT_RUN / AWAITING_HUMAN_TRIAL** (requires 5 real legal operations managers under approved protocol; synthetic users or screenshot inferences are strictly invalid).

---

## 2. Test Fixtures

1. **`ATLAS-T0` (Canonical Baseline)**
   - Exact 24 records (12 Requirements, 12 Actions), 7 dependency edges, 5 evidence records.
   - Action execution census: **4 completed / 3 waiting / 5 not started / 0 in progress**.
   - Next Actions: **0 eligible actions**.
   - Waiting On: `AC-04` (EP-01), `AC-05` (EP-02), `AC-10` (EP-03).
   - Blocked: `AC-05`, `AC-07`, `AC-08`, `AC-09`, `AC-11`, `AC-12`.
   - Milestones: `MS-01`, `MS-02`, `MS-03` evaluated as `UNASSESSED` (required sets undefined; satisfied/total counts unavailable).
   - Historical self-review caveat: `EV-03` and `EV-05` disclosed as invalid under current independent verification rules.
2. **`DENSITY-50/100/200` (Synthetic Density Fixtures)**
   - Deterministic synthetic datasets containing 50, 100, and 200 records.
   - Alternating long English and Vietnamese titles and legal justifications.
   - Used exclusively to verify table scrollability, multiline text wrapping, last-row reachability, and memory stability. Never evaluated for legal relationships.
3. **`POLICY-STATE` (5-Axis State Matrix)**
   - Synthetic fixtures covering permutations of execution, verification, dependency, timing, and attention states.
4. **`POLICY-ROLE` (Granular Role Matrix)**
   - Test fixtures covering OWNER, EDITOR, VIEWER roles, distinct submitter vs designated verifier identities, and permission revocation mid-session.
5. **`GW-PROGRESSION-01/02/03` (Golden Workflow Journeys)**
   - Staged synthetic progressions demonstrating full lifecycle transitions, including 2 supplement-response cycles for GW-03.
6. **`BRIEF-BOUNDARY` (Delta Windowing)**
   - Temporal test vectors evaluating recorded changes in `(t1, t2]` against outstanding status at `t2`.

---

## 3. Scenario Oracles

### 3.1 Core FR Scenario Oracles (VAL-FR-001 .. VAL-FR-020)

| Oracle ID | Target Capability | Test Fixture & Steps | Expected Observable Outcome | Method & Status |
|---|---|---|---|---|
| **VAL-FR-001** | Workspace & Matter Boundary | `POLICY-ROLE`; attempt cross-matter read/write; switch matters. | Boundary isolation enforced; foreign matter data completely inaccessible; session retains active scope. | Product UI/API; QA; `NOT_RUN` |
| **VAL-FR-002** | Auth & Session Management | `POLICY-ROLE`; login via OIDC/PKCE; token introspection; session expiry. | Valid token grants access; expired token prompts re-authentication; uncommitted drafts preserved in local storage. | Product UI/API; QA; `NOT_RUN` |
| **VAL-FR-003** | Requirement Lifecycle | `ATLAS-T0`; create Requirement with zero actions; update title; view lifecycle history. | Requirement created with independent 5-axis state; edit requires EDITOR/OWNER; immutable audit event appended. | Product UI/API; QA; `NOT_RUN` |
| **VAL-FR-004** | Action Assignment & Tracking | `ATLAS-T0`; assign Action to internal owner; update execution state to WAITING; record condition. | Action assigned; WAITING state captures external party and condition; audit trail recorded. | Product UI/API; QA; `NOT_RUN` |
| **VAL-FR-005** | 5-Axis Operational State | `POLICY-STATE`; inspect record with multiple active axes (e.g. AC-05 WAITING + BLOCKED). | All 5 axes displayed independently; zero collapsing into single generic badge; text labels accompany colors. | Prototype/Product; QA; `CONFIRMED_SOURCE` |
| **VAL-FR-006** | Direct Causal Dependencies | `ATLAS-T0`; trace DEP-01 proof gate from RQ-04 to AC-05; verify blocking propagation. | AC-05 blocked because RQ-04 proof ER-04 is unverified; downstream chain to AC-07/08/09 blocked. | Prototype/Product; QA; `CONFIRMED_SOURCE` |
| **VAL-FR-007** | Milestone Aggregation | `ATLAS-T0`; inspect MS-01..03 without declared required sets; test synthetic declared set. | Undefined set evaluates strictly as UNASSESSED (no fake percentage); declared set evaluates READY only when all items are READY + COMPLETED + VERIFIED. | Prototype/Product; QA; `CONFIRMED_SOURCE` |
| **VAL-FR-008** | Evidence & Verification | `ATLAS-T0`; submit proof; attempt self-review as submitter; designate independent verifier. | Submitter self-review strictly blocked (RULE-007); Matter OWNER alone cannot verify without designation; verification updates state to VERIFIED. | Prototype/Product; QA; `CONFIRMED_SOURCE` |
| **VAL-FR-009** | Executive Control Room | `ATLAS-T0`; open Control Room; verify 6-tier hierarchy and scannable causal chain. | 6-tier hierarchy displayed: Blockers → Next Actions / Decisions → Waiting On → Milestones → Gaps → Changes; 5-step causal pipeline clearly visible. | Prototype/Product; QA; `CONFIRMED_SOURCE` |
| **VAL-FR-010** | My Actions Operational Queue | `ATLAS-T0`; open My Actions for U-01; verify 4-tier queue and AC-05 representation. | 0 eligible actions reported truthfully with explanation; 2 waiting, 2 blocked, 2 completed; AC-05 appears in waiting and blocked without double-counting. | Prototype/Product; QA; `CONFIRMED_SOURCE` |
| **VAL-FR-011** | Operational Grid & Filtering | `ATLAS-T0` & `DENSITY-50`; filter by type, search query, change sort, toggle density. | All matching records displayed; Comfortable (44px) and Compact (36px) preserve 14px font; long legal text wraps multiline without clipping. | Prototype/Product; QA; `CONFIRMED_SOURCE` |
| **VAL-FR-012** | Bulk Metadata Operations | `ATLAS-T0`; select multiple rows; open bulk editor; preview 4-field allowlist; execute. | Only title, description, owner, due date editable; selection counter announces hidden filtered items; per-row atomic result and audit log. | Prototype/Product; QA; `CONFIRMED_SOURCE` |
| **VAL-FR-013** | Structured Data Import | Synthetic CSV; upload invalid group; upload valid group; deduplicate keys. | Invalid connected group rejected as a whole; imported verification treated as claim, not VERIFIED; no macros/formula execution. | Product UI/API; QA; `NOT_RUN` |
| **VAL-FR-014** | Delta Status Brief & Export | `BRIEF-BOUNDARY`; select window `(t1, t2]`; generate narrative; export CSV/PDF. | Changes in `(t1, t2]` separated from outstanding status at `t2`; invalid window `t1 > t2` rejected; formula-leading characters (`=`, `+`, `-`, `@`) escaped. | Prototype/Product; QA; `CONFIRMED_SOURCE` |
| **VAL-FR-015** | Document Versions & Signatures | `ATLAS-T0`; add new document version; promote version with reason; track signature count. | Version promotion requires reason and impact acknowledgment; 1/2 signatures on DOC-03 v3 marked PARTIALLY_VERIFIED; closing gate halted. | Prototype/Product; QA; `CONFIRMED_SOURCE` |
| **VAL-FR-016** | Regulatory Filing Lifecycle | Synthetic filing; upload receipt; transition through 2 supplement-response cycles; test reopen. | Receipt upload advances to Authority Review, never APPROVED (Receipt ≠ Approval); 2 supplement cycles tracked; ARCH-Q5 reopen preserves history. | Prototype/Product; QA; `CONFIRMED_SOURCE` |
| **VAL-FR-017** | Immutable Audit Ledger | `ATLAS-T0`; inspect event stream for entity updates. | Append-only log displays timestamp (ISO UTC+07), actor, operation, before/after diff, and causal reference. | Prototype/Product; QA; `CONFIRMED_SOURCE` |
| **VAL-FR-018** | Optimistic Concurrency | `POLICY-STATE`; simulate concurrent edit on record revision v1 while server is on v2. | 409 Conflict raised; side-by-side diff shown; overwrite prohibited; user prompted to rebase draft onto v2. | Prototype/Product; QA; `CONFIRMED_SOURCE` |
| **VAL-FR-019** | Role-Based Permissions | `POLICY-ROLE`; authenticate as VIEWER; attempt bulk edit, proof verification, or filing upload. | Mutation controls hidden or disabled; direct mutation command rejected with 403 Forbidden; read and export permitted within scope. | Product UI/API; QA; `NOT_RUN` |
| **VAL-FR-020** | Responsive Reflow & A11y | `ATLAS-T0`; test 1440px, 1100px, 640px; 200% zoom; keyboard navigation; screen reader labels. | Table reflows to cards on mobile; touch targets >= 44px; focus rings visible without clipping; keyboard shortcuts preserve IME text editing. | Static export `CONFIRMED`; interactive `NOT_RUN` |

---

### 3.2 Specific R4 Enhancement Oracles

#### VAL-NAV-01 · Causal Navigation Trail & History Stack
- **Target**: Causal drill-down navigation and focus restoration.
- **Fixture**: `ATLAS-T0`.
- **Steps**:
  1. From Operational Grid, focus and activate `AC-05` (Action Detail drawer opens).
  2. Verify breadcrumb displays: `Grid / AC-05`.
  3. Inside `AC-05`, locate incoming gate `DEP-01` (`RQ-04 → AC-05`) and activate `RQ-04` button.
  4. Verify breadcrumb updates to: `Grid / AC-05 / RQ-04`.
  5. Verify `← Back to AC-05` button is visible.
  6. In `RQ-04`, enter a title draft in the draft editor textarea.
  7. Activate `Inspect criterion and exact proof context (ER-04)`.
  8. Verify breadcrumb updates to: `Grid / AC-05 / RQ-04 / Proof (ER-04)`.
  9. Activate `← Return to RQ-04 Detail`.
  10. Verify drawer returns to `RQ-04` and the title draft entered in step 6 is preserved intact.
  11. Activate `← Back to AC-05`.
  12. Verify drawer returns to `AC-05`.
  13. Activate `Close to Grid`.
  14. Verify drawer closes and keyboard focus is restored directly to the `AC-05` row in Operational Grid.
- **Status**: **CONFIRMED_IN_PROTOTYPE** (logic verified in `prototype.html`). Interactive browser evaluation: `NOT_RUN`.

#### VAL-MINE-01 · My Actions 4-Tier Operational Queue
- **Target**: Operational queue triage and state integrity.
- **Fixture**: `ATLAS-T0` (Actor: U-01).
- **Steps**:
  1. Navigate to `My Actions Queue`.
  2. Verify Tier 1 (Eligible Actions) displays count `0`, with explicit explanation that all actions are waiting, blocked, or completed.
  3. Verify Tier 2 (Waiting On) displays `AC-04` (waiting on EP-01) and `AC-05` (waiting on EP-02).
  4. Verify Tier 3 (Blocked Actions) displays `AC-05` (blocked by DEP-01) and `AC-12` (blocked by DEP-07).
  5. Verify `AC-05` displays explanatory callout confirming dual WAITING+BLOCKED status across independent axes without duplicate task counting.
  6. Verify Tier 4 (Historical / Completed) displays `AC-01` and `AC-02`.
  7. Verify assigned Requirements (`RQ-01`, `RQ-12`) are placed in the reference accordion.
- **Status**: **CONFIRMED_IN_PROTOTYPE** (logic verified in `prototype.html`).

#### VAL-DENS-01 · Table Density, Multiline Wrapping & Font Integrity
- **Target**: Comfortable vs Compact density, font size preservation, and multiline text wrapping.
- **Fixture**: `DENSITY-50` synthetic dataset with long Vietnamese and English titles.
- **Steps**:
  1. Render Operational Grid in Comfortable density (default).
  2. Measure cell heights: minimum 44px; cells with long titles expand vertically to accommodate wrapped text.
  3. Switch to Compact density via toolbar select.
  4. Measure cell heights: minimum 36px; padding reduced to 4px 12px.
  5. Inspect font-size in Compact mode: compute CSS font-size on table text; verify strictly equals `14px` (`Compact không giảm cỡ chữ`).
  6. Inspect text wrapping: verify zero horizontal text clipping, zero hidden ellipsis (`...`), and zero table blowout.
- **Status**: **CONFIRMED_IN_PROTOTYPE_AND_CSS** (`polish.css` rules verified). Static export confirmed via `od export`. Live measurement: `NOT_RUN`.

---

## 4. Manager Comprehension Protocol (AC-137)

- **Objective**: Validate that a legal operations manager can identify matter blockers and determine next permitted steps within 10 seconds without training.
- **Participants**: Exactly 5 real legal operations managers / corporate transactions leads. (Synthetic personas and author self-testing strictly prohibited).
- **Dataset**: Unseen 50-row synthetic matter dataset (`DENSITY-50`) with realistic corporate transaction structure.
- **Tasks**:
  1. *Task A*: Identify the root-cause blocker halting the transaction closing. (Correct Answer: `RQ-04` missing `ER-04` proof).
  2. *Task B*: Determine how many actions are currently eligible for immediate execution. (Correct Answer: `0` eligible actions).
- **Success Threshold**: At least 4 out of 5 managers (>= 80%) successfully identify both answers within 10 seconds each.
- **Current Status**: **NOT_RUN / AWAITING_HUMAN_TRIAL**. Must be executed under formal coordinator observation during staging/UAT before production release.

*Status: Unified R4 Validation Plan completed and calibrated.*
