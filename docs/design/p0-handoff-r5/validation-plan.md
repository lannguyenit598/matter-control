# MatterControl R5 — unified validation plan

Task: **MC-P0-DESIGN-R5** · Priority: **P0** · Author: **Antigravity Design Assistant / Local Codex** · Status: **AUTHOR_COMPLETE_PENDING_REVIEW**.
Repository: `/Users/nguyenvanlan/Documents/code/pet-projects/matter-control`; branch `codex/unified-project-flow`; base/head `a62d838791ba188838c4ff00b7b6e265ac775056`.
Export Revision: **MC-P0-DESIGN-R5-local-20261027-01**.

---

## 1. Validation Scope and Governance Boundaries

This document defines the authoritative validation criteria, test fixtures, and verification oracles for MatterControl P0 across all 20 Functional Requirements (FRs), 13 Screens (SCRs), 3 Golden Workflows (GWs), and cross-cutting architectural constraints.

### 1.1 Integrity of Assertion Classifications
- **Source Reasoning vs Rendered Observation**: Static CSS rules, source code checks, and prototype logic are classified as `CONFIRMED_IN_PROTOTYPE` or `CONFIRMED_IN_SOURCE`.
- **Rendered Browser Automation**: Full interactive browser automation, touch latency measurement, and accessibility tree inspection are classified as `NOT_RUN / VERIFICATION_BLOCKERS` because headless browser execution is disabled in Work settings.
- **Manager Usability Testing (AC-137)**: Requires 5 real human managers under formal protocol; strictly classified as `NOT_RUN / AWAITING_HUMAN_TRIAL`.

---

## 2. Test Datasets and Named Fixtures

1. **`ATLAS-T0` (Canonical Baseline)**
   - 24 records (12 Requirements, 12 Actions), 7 causal dependency edges, as-of 15 Jun 2026 09:00 UTC+07.
   - Census: 4 COMPLETED, 3 WAITING, 5 NOT_STARTED, 0 IN_PROGRESS. Exactly 0 eligible Next Actions.
   - Milestones MS-01..MS-03: `UNASSESSED` (required sets undefined; count unavailable; zero fake percentage).
2. **`DENSITY-50`, `DENSITY-100`, `DENSITY-200`**
   - Scaled synthetic datasets with realistic multiline Vietnamese and English legal titles, used to verify scroll reachability, table density, and text wrapping.
3. **`POLICY-ROLE` (Authorization Matrix)**
   - Scenarios evaluating OWNER, EDITOR, and VIEWER roles across all 13 screens.
4. **`POLICY-STATE` (5-Axis Combinations)**
   - Orthogonal state combinations (e.g. AC-05 WAITING on execution + BLOCKED on dependency).
5. **`GW-LIFECYCLE` (Workflow Progressions)**
   - Staged synthetic progressions demonstrating full lifecycle transitions, including 2 supplement-response cycles for GW-03.
6. **`BRIEF-BOUNDARY` (Delta Windowing)**
   - Temporal test vectors evaluating recorded changes in `(t1, t2]` against outstanding status at `t2`.

---

## 3. Scenario Oracles

### 3.1 Canonical Core FR Scenario Oracles (VAL-FR-001 .. VAL-FR-020)

| Oracle ID | Canonical FR Target | Test Fixture & Steps | Expected Observable Outcome | Method & Status |
|---|---|---|---|---|
| **VAL-FR-001** | FR-001: Requirement vs Action | `ATLAS-T0`; inspect legal entity distinctions; create Requirement with zero actions; verify action attachment. | Requirement specifies legal criteria; Action represents executable operational task; distinct visual representations and lifecycle rules enforced. | Prototype/Product; QA; `CONFIRMED_IN_PROTOTYPE` |
| **VAL-FR-002** | FR-002: Milestones | `ATLAS-T0`; inspect MS-01..03 without declared required sets; evaluate synthetic declared set. | Undefined set evaluates strictly as `UNASSESSED` (count unavailable; zero fake percentage). Declared set evaluates `READY` if and only if all items are `READY + COMPLETED + (valid VERIFIED or explicit valid NOT_REQUIRED)`. Proof edge requires valid `VERIFIED`. | Prototype/Product; QA; `CONFIRMED_IN_PROTOTYPE` |
| **VAL-FR-003** | FR-003: Next Action | `ATLAS-T0`; evaluate action eligibility rules. | 0 eligible actions reported truthfully at T0; explanation details that remaining actions are waiting, blocked, or completed; zero false Next Action fabricated. | Prototype/Product; QA; `CONFIRMED_IN_PROTOTYPE` |
| **VAL-FR-004** | FR-004: Waiting On | `ATLAS-T0`; inspect active counterparty waits (AC-04, AC-05, AC-10). | External party identity (`EP-01`, `EP-02`, `EP-03`), internal owner, and wait condition captured explicitly; WAITING execution axis isolated from dependency axis. | Prototype/Product; QA; `CONFIRMED_IN_PROTOTYPE` |
| **VAL-FR-005** | FR-005: Dependencies & Blockers | `ATLAS-T0`; trace DEP-01 proof gate from RQ-04 to AC-05; verify blocking propagation. | AC-05 blocked because RQ-04 proof ER-04 is unverified; downstream chain to AC-07/08/09 blocked; 7 edges correctly evaluated. | Prototype/Product; QA; `CONFIRMED_IN_PROTOTYPE` |
| **VAL-FR-006** | FR-006: Evidence Requirements | `ATLAS-T0`; inspect criterion specification for RQ-01..12. | Evidence criteria attach to Requirements (ER-xx), not individual actions; document versions and criteria requirements clearly specified. | Prototype/Product; QA; `CONFIRMED_IN_PROTOTYPE` |
| **VAL-FR-007** | FR-007: Evidence Verification | `ATLAS-T0`; submit proof; attempt self-review as submitter; designate independent verifier. | Submitter self-review strictly blocked (RULE-007); Matter OWNER alone cannot verify without designation; distinct submitter and verifier enforced. | Prototype/Product; QA; `CONFIRMED_IN_PROTOTYPE` |
| **VAL-FR-008** | FR-008: Event History | `ATLAS-T0`; inspect event stream for entity updates. | Append-only log displays timestamp (ISO UTC+07), actor, operation, before/after diff, and causal reference ID; immutable ledger. | Prototype/Product; QA; `CONFIRMED_IN_PROTOTYPE` |
| **VAL-FR-009** | FR-009: Matter Control Room | `ATLAS-T0`; open Control Room; verify 6-tier hierarchy and scannable causal chain. | 6-tier hierarchy displayed: Blockers → Next Actions / Decisions → Waiting On → Milestones → Gaps → Changes; 5-step causal pipeline clearly visible without paragraph duplication. | Prototype/Product; QA; `CONFIRMED_IN_PROTOTYPE` |
| **VAL-FR-010** | FR-010: My Actions | `ATLAS-T0`; open My Actions for U-01; verify 4-tier queue and AC-05 representation. | 0 eligible actions reported truthfully; 2 waiting, 2 blocked, 2 completed; AC-05 appears in waiting and blocked without double-counting; requirements in reference accordion. | Prototype/Product; QA; `CONFIRMED_IN_PROTOTYPE` |
| **VAL-FR-011** | FR-011: Operational Grid | `ATLAS-T0` & `DENSITY-50`; filter by type, search query, change sort, toggle density. | All matching records displayed; Comfortable (44px) and Compact (36px) preserve 14px font; long legal text wraps multiline without clipping. | Prototype/Product; QA; `CONFIRMED_IN_PROTOTYPE` |
| **VAL-FR-012** | FR-012: Bulk Operations | `ATLAS-T0`; select multiple rows; open bulk editor; preview 4-field allowlist; execute. | Only title, description, owner, due date editable; selection counter announces hidden filtered items; per-row atomic result and audit log. | Prototype/Product; QA; `CONFIRMED_IN_PROTOTYPE` |
| **VAL-FR-013** | FR-013: Structured Import | Synthetic CSV/XLSX; upload invalid group; upload valid group; deduplicate keys. | CSV and XLSX supported; invalid connected group rejected as a whole; imported verification treated as claim, not VERIFIED; zero formulas/macros executed. | Product UI/API; QA; `NOT_RUN` |
| **VAL-FR-014** | FR-014: Scoped Export | `BRIEF-BOUNDARY`; select window `(t1, t2]`; generate narrative; export scoped XLSX. | Meaningful scoped XLSX export; formula-leading characters (`=`, `+`, `-`, `@`) escaped; changes in `(t1, t2]` separated from outstanding status at `t2`. | Prototype/Product; QA; `CONFIRMED_IN_PROTOTYPE` |
| **VAL-FR-015** | FR-015: Document Versions | `ATLAS-T0`; add new document version; promote version with reason; track signature count. | Version promotion requires reason and impact acknowledgment; 1/2 signatures on DOC-03 v3 marked PARTIALLY_VERIFIED; closing gate halted. | Prototype/Product; QA; `CONFIRMED_IN_PROTOTYPE` |
| **VAL-FR-016** | FR-016: Regulatory Filing | Synthetic filing; upload receipt; transition through 2 supplement-response cycles; test reopen. | Receipt upload supplies artifact only; transition to Authority Review requires authorized observation/command (RULE-012; Receipt ≠ Approval); 2 supplement cycles; ARCH-Q5 reopen. | Prototype/Product; QA; `CONFIRMED_IN_PROTOTYPE` |
| **VAL-FR-017** | FR-017: External Parties | `ATLAS-T0`; inspect external counterparties (EP-01, EP-02, EP-03). | External parties tracked with distinct legal roles, communication logs, and waiting conditions; non-member identities isolated from internal permissions. | Prototype/Product; QA; `CONFIRMED_IN_PROTOTYPE` |
| **VAL-FR-018** | FR-018: Roles and Ownership | `POLICY-ROLE`; test action assignment by EDITOR and OWNER; test VIEWER mutation. | Both Matter EDITOR and OWNER can assign actions in scope to active members; VIEWER mutation strictly blocked (403); ownership designation preserved. | Prototype/Product; QA; `CONFIRMED_IN_PROTOTYPE` |
| **VAL-FR-019** | FR-019: Draft Delta Brief | `BRIEF-BOUNDARY`; select window `(t1, t2]`; test invalid window `t1 > t2`. | Changes in interval `(t1, t2]` separated from outstanding status at `t2`; invalid window `t1 > t2` rejected with immediate error; no report fabricated. | Prototype/Product; QA; `CONFIRMED_IN_PROTOTYPE` |
| **VAL-FR-020** | FR-020: Five Axes State Model | `POLICY-STATE`; inspect record with multiple active axes (e.g. AC-05 WAITING + BLOCKED). | All 5 axes displayed independently; zero collapsing into single generic badge; text labels accompany colors. | Prototype/Product; QA; `CONFIRMED_IN_PROTOTYPE` |

---

### 3.2 Cross-Cutting System Oracles

| Oracle ID | Target Boundary | Test Scenario & Verification Steps | Expected Observable Outcome | Method & Status |
|---|---|---|---|---|
| **VAL-CROSS-AUTH** | Auth & Token Storage | Login via ZITADEL OIDC/PKCE S256; inspect network cookies and localStorage; inspect BFF session store. | OAuth tokens stored strictly in server-side BFF session store; browser cookie contains only opaque session handle; zero tokens in cookie/localStorage; draft retention follows session/privacy contract. | Product UI/API; QA; `NOT_RUN` |
| **VAL-CROSS-CONCURRENCY** | Optimistic Concurrency | Simulate concurrent edit on record revision v1 while server revision is v2. | 409 Conflict raised; side-by-side diff displayed; overwrite strictly prohibited; user prompted to rebase draft onto v2; drafts preserved. | Prototype/Product; QA; `CONFIRMED_IN_PROTOTYPE` |
| **VAL-CROSS-BOUNDARY** | Workspace & Matter Boundary | Authenticate as member of Matter A; attempt read/write on Matter B in same Workspace; switch matters. | Strict boundary isolation enforced; foreign matter data completely inaccessible; active matter context persistent in navigation shell. | Product UI/API; QA; `NOT_RUN` |
| **VAL-CROSS-RESPONSIVE-A11Y** | Responsive & Accessibility | Test viewports 1440px, 1100px, 640px; 200% zoom; keyboard navigation; focus outline visibility. | Table reflows to cards on mobile; touch targets >= 44px; focus rings (`:focus-visible`) 2px solid with 2px offset visible without clipping; IME typing preserved. | Prototype static export `CONFIRMED`; interactive `NOT_RUN` |

---

### 3.3 Specific R5 Enhancement Oracles

#### VAL-NAV-01 · Causal Navigation Trail & History Stack
- **Target**: Causal drill-down navigation and focus restoration.
- **Fixture**: `ATLAS-T0`.
- **Steps**:
  1. From Operational Grid, focus and activate `AC-05` (Action Detail drawer opens).
  2. Verify breadcrumb displays: `Operational Grid / AC-05`.
  3. Inside `AC-05`, locate incoming gate `DEP-01` (`RQ-04 → AC-05`) and activate `RQ-04` button.
  4. Verify breadcrumb updates to: `Operational Grid / AC-05 / RQ-04`.
  5. Verify `← Back to AC-05` button is visible.
  6. In `RQ-04`, enter a title draft in the draft editor textarea.
  7. Activate `Inspect criterion and exact proof context`.
  8. Verify breadcrumb updates to: `Operational Grid / AC-05 / RQ-04 / Proof Context`.
  9. Activate `← Return to RQ-04 Detail`.
  10. Verify drawer returns to `RQ-04` and the title draft entered in step 6 is preserved intact.
  11. Activate `← Back to AC-05`.
  12. Verify drawer returns to `AC-05`.
  13. Activate `Close to Operational Grid`.
  14. Verify drawer closes and keyboard focus is restored directly to the `AC-05` row in Operational Grid.
- **Status**: **CONFIRMED_IN_PROTOTYPE** (logic verified in `prototype.html`). Interactive browser evaluation: `NOT_RUN`.

#### VAL-NAV-02 · Modal Session & Escape/Close Cleanup
- **Target**: Centralized modal session cleanup on Close button and Escape key; origin preservation.
- **Fixture**: `ATLAS-T0`.
- **Steps**:
  1. Navigate to `My Actions Queue`.
  2. Open `AC-05` (drawer opens with breadcrumb `My Actions Queue / AC-05`).
  3. Navigate to `RQ-04` (stack contains `AC-05`).
  4. Press Escape key to dismiss dialog.
  5. Reopen `RQ-10` from `My Actions Queue`.
  6. Verify breadcrumb displays `My Actions Queue / RQ-10` (zero stale context from previous `AC-05` session).
  7. Verify `navStack` was completely reset.
- **Status**: **CONFIRMED_IN_PROTOTYPE** (verified in `cleanupModalSession()` and dialog close handler).

#### VAL-PROOF-01 · Explicit Typed Relations for Evidence Proof Lookup
- **Target**: Typed record/criterion/proof association; absence of Action numeric suffix borrowing.
- **Fixture**: `ATLAS-T0`.
- **Steps**:
  1. Open `AC-05` detail and click `Inspect criterion and exact proof context`.
  2. Verify proof context explicitly displays: `Explicit Action proof applicability: NOT_REQUIRED`.
  3. Verify `AC-05` does NOT inherit `EV-05 / DOC-03` or the verification state of `RQ-05`.
  4. Verify note confirms: *"Canonical Atlas: AC-05 has proof applicability NOT_REQUIRED. It does NOT inherit RQ-05 proof or verification state."*
  5. Open `RQ-05` detail and click proof context.
  6. Verify `RQ-05` correctly displays `EV-05 / DOC-03 v3` and the historical self-review caveat.
  7. Open `AC-01`, `AC-03`, `AC-04`, `AC-10` and verify each displays explicit Action proof applicability without borrowing Requirement proofs.
- **Status**: **CONFIRMED_IN_PROTOTYPE** (typed lookup verified in `prototype.html`).

#### VAL-ROLE-01 · Role-Based Action Assignment
- **Target**: Permission consistency for Action assignment.
- **Fixture**: `POLICY-ROLE`.
- **Steps**:
  1. Authenticate as Matter `EDITOR`.
  2. Open Action Detail for `AC-05`.
  3. Verify assignment controls are enabled; assign Action to active member `U-03`.
  4. Authenticate as Matter `OWNER`.
  5. Verify assignment controls are enabled.
  6. Authenticate as Matter `VIEWER`.
  7. Verify assignment controls are disabled/omitted; mutation blocked with 403 Forbidden.
  8. Authenticate as submitter of `EV-03` (`U-02`); attempt verification; verify self-review is blocked (RULE-007).
- **Status**: **CONFIRMED_IN_PROTOTYPE** (permission rules verified in spec and prototype text).

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
- **Status**: **CONFIRMED_IN_PROTOTYPE_AND_CSS** (`polish.css` rules verified). Static export confirmed. Live measurement: `NOT_RUN`.

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

*Status: Unified R5 Validation Plan completed, calibrated, and ready for review.*
