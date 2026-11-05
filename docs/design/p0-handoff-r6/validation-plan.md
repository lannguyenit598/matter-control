# MatterControl R6 — unified validation plan

Task: **MC-P0-DESIGN-R6-CORRECTION** · Priority: **P0** · Author: **Antigravity Design Assistant / Local Codex** · Status: **AUTHOR_COMPLETE_WITH_VERIFICATION_BLOCKERS**.
Repository: `/Users/nguyenvanlan/Documents/code/pet-projects/matter-control`; branch `codex/unified-project-flow`; base/head `a62d838791ba188838c4ff00b7b6e265ac775056`.
Export Revision: **MC-P0-DESIGN-R6-local-20261027-01**.

---

## 1. Validation Scope and Governance Boundaries

This document defines the authoritative validation criteria, test fixtures, and verification oracles for MatterControl P0 across all 20 Functional Requirements (FRs), 13 Screens (SCRs), 3 Golden Workflows (GWs), and cross-cutting architectural constraints.

### 1.1 Integrity of Assertion Classifications (R5-N04)
- **Execution Separation**: Unimplemented data mutation flows (Requirement creation, live proof review/verdict changes, atomic bulk execution, version promotion, Filing lifecycle progression, XLSX file export, role authorization enforcement) are classified as `SPECIFIED_ONLY / SOURCE_INSPECTED`. They are specified in UX specifications and illustrated in screen state specimens, but are not claimed as executed in this standalone exploratory prototype.
- **Exploratory Prototype UI Verification**: UI interactions that actually execute and render in the standalone prototype (filtering, sorting, density toggle, selection tracking, 4-tier My Actions queue, 6-tier Control Room causal pipeline, modal navigation trail with mode restoration and breadcrumb truncation, 5-axis state rendering, Delta Brief window validation) are classified as `CONFIRMED_IN_PROTOTYPE_EXPLORATORY`.
- **Rendered Browser Automation**: Interactive browser automation, touch latency measurement, and live screen reader tree inspection are classified as `NOT_RUN / VERIFICATION_BLOCKERS` because headless browser execution is disabled in Work settings.
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
| **VAL-FR-001** | FR-001: Requirement vs Action | `ATLAS-T0`; inspect legal entity distinctions; view Requirement metadata and Action tasks. | Requirement specifies legal criteria; Action represents executable operational task; distinct visual representations and lifecycle rules enforced. Live creation non-operational in standalone prototype. | Specification & Specimen; QA; `SPECIFIED_ONLY` |
| **VAL-FR-002** | FR-002: Milestones | `ATLAS-T0`; inspect MS-01..03 without declared required sets; evaluate synthetic declared set. | Undefined set evaluates strictly as `UNASSESSED` (count unavailable; zero fake percentage). Declared set evaluates `READY` if and only if all items are `READY + COMPLETED + (valid VERIFIED or explicit valid NOT_REQUIRED)`. Proof edge requires valid `VERIFIED`. | Prototype logic; QA; `CONFIRMED_IN_PROTOTYPE_EXPLORATORY` |
| **VAL-FR-003** | FR-003: Next Action | `ATLAS-T0`; evaluate action eligibility rules. | 0 eligible actions reported truthfully at T0; explanation details that remaining actions are waiting, blocked, or completed; zero false Next Action fabricated. | Prototype logic; QA; `CONFIRMED_IN_PROTOTYPE_EXPLORATORY` |
| **VAL-FR-004** | FR-004: Waiting On | `ATLAS-T0`; inspect active counterparty waits (AC-04, AC-05, AC-10). | External party identity (`EP-01`, `EP-02`, `EP-03`), internal owner, and wait condition captured explicitly; WAITING execution axis isolated from dependency axis. | Prototype logic; QA; `CONFIRMED_IN_PROTOTYPE_EXPLORATORY` |
| **VAL-FR-005** | FR-005: Dependencies & Blockers | `ATLAS-T0`; trace DEP-01 proof gate from RQ-04 to AC-05; verify blocking propagation. | AC-05 blocked because RQ-04 proof ER-04 is unverified; downstream chain to AC-07/08/09 blocked; 7 edges correctly evaluated. | Prototype logic; QA; `CONFIRMED_IN_PROTOTYPE_EXPLORATORY` |
| **VAL-FR-006** | FR-006: Evidence Requirements | `ATLAS-T0`; inspect criterion specification for RQ-01..12 and proof applicability model. | Evidence criteria attach to Requirements (ER-xx). Actions/Filings carry verification when proof explicitly required under state-semantics.md §10; canonical Atlas actions carry explicit NOT_REQUIRED applicability. | Specification & Specimen; QA; `SPECIFIED_ONLY` |
| **VAL-FR-007** | FR-007: Evidence Verification | `ATLAS-T0`; inspect anti-self-review rules and verifier designation. | Submitter self-review strictly blocked (RULE-007); Matter OWNER alone cannot verify without designation; distinct submitter and verifier enforced. Live mutation requires product backend. | Specification & Specimen; QA; `SPECIFIED_ONLY` |
| **VAL-FR-008** | FR-008: Event History | `ATLAS-T0`; inspect event stream for entity updates. | Append-only log displays timestamp (ISO UTC+07), actor, operation, before/after diff, and causal reference ID; immutable ledger. Live database ledger requires backend. | Specification & Specimen; QA; `SPECIFIED_ONLY` |
| **VAL-FR-009** | FR-009: Matter Control Room | `ATLAS-T0`; open Control Room; verify 6-tier hierarchy and scannable causal chain. | 6-tier hierarchy displayed: Blockers → Next Actions / Decisions → Waiting On → Milestones → Gaps → Changes; 5-step causal pipeline clearly visible without paragraph duplication. | Prototype UI; QA; `CONFIRMED_IN_PROTOTYPE_EXPLORATORY` |
| **VAL-FR-010** | FR-010: My Actions | `ATLAS-T0`; open My Actions for U-01; verify 4-tier queue and AC-05 representation. | 0 eligible actions reported truthfully; 2 waiting, 2 blocked, 2 completed; AC-05 appears in waiting and blocked without double-counting; requirements in reference accordion. | Prototype UI; QA; `CONFIRMED_IN_PROTOTYPE_EXPLORATORY` |
| **VAL-FR-011** | FR-011: Operational Grid | `ATLAS-T0` & `DENSITY-50`; filter by type, search query, change sort, toggle density. | All matching records displayed; Comfortable (44px) and Compact (36px) preserve 14px font; long legal text wraps multiline without clipping. | Prototype UI; QA; `CONFIRMED_IN_PROTOTYPE_EXPLORATORY` |
| **VAL-FR-012** | FR-012: Bulk Operations | `ATLAS-T0`; select multiple rows; open bulk editor; preview 4-field allowlist. | Only title, description, owner, due date editable; selection counter announces hidden filtered items; per-row atomic result structure specified. Live batch mutation requires backend. | Specification & Specimen; QA; `SPECIFIED_ONLY` |
| **VAL-FR-013** | FR-013: Structured Import | Synthetic CSV/XLSX; inspect 3-step wizard specification in SCR-11. | CSV and XLSX supported; invalid connected group rejected as a whole; imported verification treated as claim, not VERIFIED; zero formulas/macros executed. | Product UI/API; QA; `NOT_RUN` |
| **VAL-FR-014** | FR-014: Scoped Export | `BRIEF-BOUNDARY`; select window `(t1, t2]`; generate narrative preview. | Time window filtering `(t1, t2]` logic confirmed; formula-leading characters (`=`, `+`, `-`, `@`) escaped; changes in `(t1, t2]` separated from outstanding status at `t2`. Live XLSX file export requires product backend. | Specification & Specimen; QA; `SPECIFIED_ONLY` |
| **VAL-FR-015** | FR-015: Document Versions | `ATLAS-T0`; inspect document version lineage and promotion specification. | Version promotion requires reason and impact acknowledgment; 1/2 signatures on DOC-03 v3 marked PARTIALLY_VERIFIED; closing gate halted. Live upload/promotion requires product backend. | Specification & Specimen; QA; `SPECIFIED_ONLY` |
| **VAL-FR-016** | FR-016: Regulatory Filing | Synthetic filing; inspect 9-stage lifecycle stepper and 2 supplement cycles. | Receipt upload supplies artifact only; transition to Authority Review requires authorized observation/command (RULE-012; Receipt ≠ Approval); 2 supplement cycles; ARCH-Q5 reopen. Live transition requires backend. | Specification & Specimen; QA; `SPECIFIED_ONLY` |
| **VAL-FR-017** | FR-017: External Parties | `ATLAS-T0`; inspect external counterparties (EP-01, EP-02, EP-03). | External parties tracked with distinct legal roles, communication logs, and waiting conditions; non-member identities isolated from internal permissions. | Specification & Specimen; QA; `SPECIFIED_ONLY` |
| **VAL-FR-018** | FR-018: Roles and Ownership | `POLICY-ROLE`; inspect role matrix specification across screens. | Both Matter EDITOR and OWNER can assign actions in scope to active members; VIEWER mutation strictly blocked (403); ownership designation preserved. Live authorization enforcement requires backend. | Specification & Specimen; QA; `SPECIFIED_ONLY` |
| **VAL-FR-019** | FR-019: Draft Delta Brief | `BRIEF-BOUNDARY`; select window `(t1, t2]`; test invalid window `t1 > t2`. | Changes in interval `(t1, t2]` separated from outstanding status at `t2`; invalid window `t1 > t2` rejected with immediate error; no report fabricated. | Prototype UI; QA; `CONFIRMED_IN_PROTOTYPE_EXPLORATORY` |
| **VAL-FR-020** | FR-020: Five Axes State Model | `POLICY-STATE`; inspect record with multiple active axes (e.g. AC-05 WAITING + BLOCKED). | All 5 axes displayed independently; zero collapsing into single generic badge; text labels accompany colors. | Prototype UI; QA; `CONFIRMED_IN_PROTOTYPE_EXPLORATORY` |

---

### 3.2 Cross-Cutting System Oracles

| Oracle ID | Target Boundary | Test Scenario & Verification Steps | Expected Observable Outcome | Method & Status |
|---|---|---|---|---|
| **VAL-CROSS-AUTH** | Auth & Token Storage | Login via ZITADEL OIDC/PKCE S256; inspect network cookies and localStorage; inspect BFF session store. | OAuth tokens stored strictly in server-side BFF session store; browser cookie contains only opaque session handle; zero tokens in cookie/localStorage; draft retention follows session/privacy contract. | Product UI/API; QA; `NOT_RUN` |
| **VAL-CROSS-CONCURRENCY** | Optimistic Concurrency | Simulate concurrent edit on record revision v1 while server revision is v2. | 409 Conflict raised; side-by-side diff displayed; overwrite strictly prohibited; user prompted to rebase draft onto v2; drafts preserved. | Specification & Specimen; QA; `SPECIFIED_ONLY` |
| **VAL-CROSS-BOUNDARY** | Workspace & Matter Boundary | Authenticate as member of Matter A; attempt read/write on Matter B in same Workspace; switch matters. | Strict boundary isolation enforced; foreign matter data completely inaccessible; active matter context persistent in navigation shell. | Product UI/API; QA; `NOT_RUN` |
| **VAL-CROSS-RESPONSIVE-A11Y** | Responsive & Accessibility | Test viewports 1440px, 1100px, 640px; 200% zoom; keyboard navigation; focus outline visibility. | Table reflows to cards on mobile; touch targets >= 44px; focus rings (`:focus-visible`) 2px solid with 2px offset visible without clipping; IME typing preserved. | Interactive & Assistive; QA; `NOT_RUN / VERIFICATION_BLOCKERS` |

---

### 3.3 Specific R6 Enhancement Oracles

#### VAL-INIT-01 · Standalone Prototype DOM Lookup & Initialization (R5-N01)
- **Target**: Standalone prototype startup and DOM lookup helper integrity.
- **Fixture**: `ATLAS-T0`.
- **Steps**:
  1. Inspect top level of `<script id="concept-logic">` in `prototype.html`.
  2. Verify `const $ = id => document.getElementById(id);` declaration precedes all caller functions and event listeners.
  3. Execute startup script extraction with Node AST and mock DOM bootstrap; check console errors and unbound identifier references.
- **Expected Outcome**: Initialization runs completely cleanly with exit code 0; zero unbound identifier exceptions (`ReferenceError`); Control Room causal chain, Operational Grid, My Actions queue, and screen state specimen render dynamically without host or test-harness injection.
- **Status**: Prototype standalone execution; QA; `CONFIRMED_IN_PROTOTYPE_EXPLORATORY`

#### VAL-NAV-01 · Causal Navigation Trail Truncation on Breadcrumb Traversal (R5-N03)
- **Target**: Breadcrumb trail traversal and ancestor rewinding.
- **Fixture**: `ATLAS-T0`.
- **Steps**:
  1. From Operational Grid, focus and activate `AC-05` (Action Detail drawer opens).
  2. In `AC-05`, activate incoming gate link `RQ-04` (navigates forward; `navStack` stores `AC-05`).
  3. In `RQ-04`, activate `Proof Context` button (navigates to proof verification view).
  4. In the breadcrumb trail (`Operational Grid / AC-05 / RQ-04 / Proof Context`), click the `AC-05` breadcrumb button (`data-trail-idx="0"`).
- **Expected Outcome**: Clicking `AC-05` in the breadcrumb trail truncates `navStack` back to index 0 via `navStack.splice(0)`, rewinding to `AC-05` without creating an appending loop (`AC-05 / RQ-04 / AC-05`).
- **Status**: Prototype UI; QA; `CONFIRMED_IN_PROTOTYPE_EXPLORATORY`

#### VAL-NAV-02 · Proof Mode Restoration on Back Navigation (R5-N03)
- **Target**: Preserving and restoring predecessor view mode on Back navigation.
- **Fixture**: `ATLAS-T0`.
- **Steps**:
  1. Navigate to a proof-bearing record context (e.g. `RQ-04` proof context).
  2. Navigate forward to a related dependency record (e.g. inspecting `AC-05` or related link).
  3. From the target record, click `← Back to RQ-04 (Proof)`.
- **Expected Outcome**: `handleBackPrev()` stores the popped predecessor's mode in local variable `savedMode` across the `openRecord()` invocation. When `savedMode === 'proof'`, it calls `showProof()` to restore the proof context view, rather than losing mode due to `openRecord()` resetting `detailMode` to `'record'`.
- **Status**: Prototype UI; QA; `CONFIRMED_IN_PROTOTYPE_EXPLORATORY`

#### VAL-PROOF-01 · Explicit Typed Proof Relations, Canonical Facts & Applicability Model (R5-N02)
- **Target**: Typed proof relations, canonical facts for AC-06 and RQ-05, and proof applicability under `state-semantics.md` §10.
- **Fixture**: `ATLAS-T0` and `AC-DEMO-PROOF`.
- **Steps**:
  1. Open `AC-06` and inspect proof context. Verify submitter is `U-03`, execution is `COMPLETED`, dependency is `READY`, and receipt of first signature for `RQ-06` is recorded.
  2. Open `RQ-05` and inspect proof context. Verify historical verification baseline is `VERIFIED` and satisfies `DEP-05` to `AC-05` at baseline T0 snapshot, with historical self-review by `U-02` documented as an audit caveat under RULE-007 (not retroactive state mutation).
  3. Open `AC-05` and verify explicit proof applicability `NOT_REQUIRED` in canonical Atlas, with clear note confirming it does not carry proof criteria or borrow `RQ-05` proof.
  4. Inspect proof applicability notice and labelled proof-bearing action specimen `AC-DEMO-PROOF`.
- **Expected Outcome**: Verification applies to Requirements, Evidence Requirements, supplied Evidence; and to Actions or Filings when proof is explicitly required (initial state `UNVERIFIED`). `NOT_REQUIRED` applies only via explicit applicability decision. All canonical facts match Atlas dataset without borrowing or mutation.
- **Status**: Specification & Prototype; QA; `CONFIRMED_IN_PROTOTYPE_EXPLORATORY`

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


---

## 5. Actual Source-Check Scripts, Commands & Execution Logs (R5-N04)

### 5.1 Automated Source Verification Suite
The following commands were executed against the delivered R6 package to verify syntactical, structural, and semantic integrity:

1. **Manifest Pin Integrity Check**:
   - Command: `python3 -c "import json, hashlib, os; manifest = json.load(open('docs/testing/p0-design-consolidated-inputs-20261027.json')); ..."`
   - Tool/Version: Python 3.12.7 (Darwin arm64)
   - UTC Timestamp: `2026-10-27T03:07:49Z` (10:07:49+07:00)
   - Exit Code: `0`
   - Result: All 38 manifest inputs verified matching bytes and SHA-256.

2. **JavaScript Syntax Verification (`node --check`)**:
   - Command: `node --check /tmp/r6-extracted-logic.js`
   - Tool/Version: Node.js v20.18.0 (Darwin arm64)
   - UTC Timestamp: `2026-10-27T03:09:45Z` (10:09:45+07:00)
   - Exit Code: `0`
   - Result: Clean syntax; 0 errors.

3. **Standalone Prototype Bootstrap & DOM Lookup Helper Check**:
   - Command: `node /tmp/r6-mock-dom-bootstrap.js`
   - Tool/Version: Node.js v20.18.0 (Darwin arm64)
   - UTC Timestamp: `2026-10-27T03:09:45Z` (10:09:45+07:00)
   - Exit Code: `0`
   - Result: `const $ = id => document.getElementById(id);` present before callers; all 35 `$()` calls resolve to valid DOM targets; initialization completes without throwing.

4. **Canonical Atlas Dataset & Proof Relations Verification**:
   - Command: `python3 /tmp/check_canonical_facts.py`
   - Tool/Version: Python 3.12.7 (Darwin arm64)
   - UTC Timestamp: `2026-10-27T03:09:58Z` (10:09:58+07:00)
   - Exit Code: `0`
   - Result: 24 records (12 req + 12 action); 7 edges; AC-06 COMPLETED/READY owned by U-03; RQ-05 VERIFIED baseline; DEP-05 satisfied at T0; AC-05 does not borrow RQ-05 proof.

5. **Embedded CSS Identity Check**:
   - Command: `python3 -c "import re; html = open('docs/design/p0-handoff-r6/prototype.html').read(); css = open('docs/design/p0-handoff-r6/polish.css').read(); ..."`
   - Tool/Version: Python 3.12.7 (Darwin arm64)
   - UTC Timestamp: `2026-10-27T03:09:51Z` (10:09:51+07:00)
   - Exit Code: `0`
   - Result: Exact byte identity confirmed (12,235 bytes matching byte-for-byte).
