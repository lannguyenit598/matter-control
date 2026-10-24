# REV-01 — OpenCode review round 1

Date: 2026-10-24. Session `ses_e92d7534effetgWXziJXn90ULM`; actual provider/model `opencode/big-pickle`; CLI exit 0. User explicitly authorized named 11-file packet. Result CHANGES_REQUIRED; no Critical/High, four Medium and six Low. Original returned text follows; Markdown hard-break trailing spaces normalized only.

## Reviewed snapshot manifest

| File | SHA256 |
|---|---|
| docs/requirements/prd.md | 191ae9bf89d2d860559f3d574e6303da94cc0b0a33c97fd8518ac44974e1b7ec |
| docs/requirements/srs.md | 187872b4f7a215c1830a56bb54b42d2867fd952a5b676b7248e9cf0b27fff37a |
| docs/requirements/business-rules.md | 6b12457507a4deb349fb41b34d5f4a365e73b32ac6f688c4f46bef70892f2999 |
| docs/requirements/state-semantics.md | 1432c816659a0984fcd20115e2c0aea45aa5ecb7a3d5a45357b099c50eedf741 |
| docs/requirements/permission-matrix.md | fc7195b8618a32df783011c1b9525661c7563ba3792b66d6f387b46ce6921c0e |
| docs/requirements/user-stories.md | 83d0ce9d7461b8ef864446cd64fff24e11be3a5fce29b8c04c6f85844c56206f |
| docs/requirements/acceptance-criteria.md | 907f666e7da4b495271d424c8dccf496509aa4cffb200b9a92ce605cdced1fdb |
| docs/requirements/golden-workflow-acceptance.md | 922313e9359a818652c3dd142e4d29eb9ef7639fde8d61d5d5f32c77d2d41ae9 |
| docs/requirements/open-business-decisions.md | 5ae1295f24f6ba69ecc9c2163f9cdb8596cdefd738f28a11e0d94143e44ac1ab |
| docs/product/jtbd.md | 2124c1931b6e9f5a916fb6d72225e85268f26df713c7bf03506b54a8579b52dd |
| docs/ai-sdlc/requirements-traceability.md | 2858e2a8c98d8caa209c5fb2fde651c66cce7fd13f79c7c26e7528ebec82d378 |

## Returned report

# REV-01 — Independent Testability Review

**Reviewer:** OpenCode QA reviewer (independent; not author)
**Model:** Big Pickle (`opencode/big-pickle`)
**Mode:** Plan; all tools denied; packet-only review
**Input:** Supplied 11-file snapshot plus SHA256 manifest; base `20f12fe` as stated
**Limits:** I did not recompute SHA256 hashes, inspect the repository/branch/base commit, run product tests, or perform external actions. Findings are documentary testability findings, not runtime proof. Proposed RULE/OBD status was not treated as a defect, and no proposal was approved by this review.

## Verdict

**CHANGES_REQUIRED**

The packet is structurally strong: all 20 P0 capabilities and all 7 JTBD are present, IDs are stable, state separation is generally rigorous, and most ACs are executable in intent. However, several real contradictions would produce ambiguous or non-deterministic test expectations, especially in role authority, verification transitions, report boundaries, and dependency sequencing.

## 1. Check Results

| Check | Result | Notes |
|---|---|---|
| P0 20/20 | **PASS** | `FR-001..020` each maps to `REQ-MC-P0-01..20`, with US and AC coverage. |
| JTBD 7/7 | **PASS structurally** | `JTBD-01..07` exist and map to BR/FR/AC, but mapping omissions exist (F-05). |
| Domain/state/rule consistency | **CHANGES_REQUIRED** | F-01, F-02, F-04. |
| Forbidden/allowed transitions | **CHANGES_REQUIRED** | F-02 and F-08; execution coverage is strong, verification/filing exhaustive coverage is not. |
| Evidence/version/reopen/expiry | **PASS** | AC-115/121/124/126/128/140/157 are coherent and testable in intent. |
| Dependencies | **CHANGES_REQUIRED** | Declared FR dependencies contain cycles (F-04). |
| Role matrix | **CHANGES_REQUIRED** | Ordinary dependency-edge authority is contradictory/ambiguous (F-01). |
| Confidentiality | **PASS** | AC-118/134/135/147/149/158 and uniform-denial language are coherent. |
| Bulk/import retry/concurrency | **PASS** | AC-112/113/131/132/133/139/153 cover the core cases; minor residual noted below. |
| Draft report boundaries | **CHANGES_REQUIRED** | AC-138 has a boundary contradiction (F-03). |
| Workflow acceptance | **PASS with trace gaps** | AC-161..163 are concrete but under-traced and broad (F-09). |
| NFR testability | **PASS with reservations** | Measurement protocols exist; numeric budgets, RPO/RTO and availability targets are legitimately pending. F-07 minor. |
| Proposal-status handling | **PASS** | Proposed rules were treated as conditional, not as defects. |

## 2. Findings

### F-01 — Medium — Dependency-edge authority contradicts FR-005 and AC-125

**Location:** `docs/requirements/permission-matrix.md`, row `Matter settings / critical milestones / prerequisites`; `docs/requirements/srs.md`, FR-005 Permissions; `docs/requirements/acceptance-criteria.md`, AC-125.

**Observation:** The permission matrix gives `Matter OWNER = Yes`, `Matter EDITOR = No` for “critical milestones / prerequisites.” FR-005 explicitly says “EDITOR/OWNER link ordinary dependencies; milestone prerequisites OWNER.” AC-125 then says “When editor proposes C→A or self A→A,” expecting a cycle rejection rather than a permission denial.

**Impact:** A tester cannot determine whether an editor may create an ordinary dependency edge. AC-125 may fail at authorization before cycle validation, and AC-105/122/123 dependency setup may have no clearly authorized actor. The matrix is either contradictory or incomplete for ordinary edges.

**Correction:** Split the matrix row into:
- “Matter settings / critical milestone designation / milestone required prerequisites” — OWNER only.
- “Ordinary dependency edges (Requirement/Action prerequisites)” — OWNER and EDITOR, with reason/audit.

Also state verifier eligibility (`EDITOR/OWNER`, non-submitter) in the membership/designation row to match RULE-006.

---

### F-02 — Medium — `DISPUTED → NOT_REQUIRED` is unreachable as guarded

**Location:** `docs/requirements/state-semantics.md`, “Verification transitions and evaluation precedence,” row `UNVERIFIED / PARTIALLY_VERIFIED / VERIFIED / DISPUTED → NOT_REQUIRED`; `docs/requirements/business-rules.md`, RULE-005; AC-160.

**Observation:** The transition guard requires “no applicable mandatory criteria or unresolved dispute.” But by definition and by the stated precedence rule, `DISPUTED` means there is an unresolved applicable dispute. Therefore the guard cannot be true when the current state is `DISPUTED`; the listed transition is impossible.

A related ambiguity exists for `VERIFIED` and `PARTIALLY_VERIFIED`: those states imply applicable mandatory criteria exist, while the guard says “no applicable mandatory criteria.” The packet does not define whether criteria must first be withdrawn/revised, or whether the OWNER decision itself removes them.

**Impact:** AC-160 requires testing each allowed transition with the guard true/false. For this transition, a “guard true” case cannot be constructed, so the test is contradictory or must silently omit an allowed transition.

**Correction:** Remove `DISPUTED` from the source states for `NOT_REQUIRED`, or explicitly allow the OWNER to dismiss a challenge as inapplicable with reason, audit and verifier resolution. Separately define the ordering for criteria withdrawal/revocation before a `NOT_REQUIRED` decision, so the guard can be evaluated consistently.

---

### F-03 — Medium — AC-138 mixes an empty window with a non-empty boundary test

**Location:** `docs/requirements/acceptance-criteria.md`, AC-138; `docs/requirements/business-rules.md`, RULE-016.

**Observation:** AC-138’s Given includes `t1=t2 or no in-window changes`, while its Then says “event exactly t1 excluded and exactly t2 included.” Under RULE-016’s half-open interval `(t1,t2]`, if `t1=t2`, an event exactly at `t2` is not in the window. The AC therefore asserts both “no changes” and “t2 event included” for the same case.

**Impact:** The test has no single deterministic expected result. A test author must choose which clause to honor.

**Correction:** Split into two scenarios:
- `AC-138a`: `t1<t2`; assert `t1` excluded, `t2` included.
- `AC-138b`: `t1=t2`; assert empty window and explicit “no changes,” with no boundary-inclusion claim.

---

### F-04 — Medium — Functional dependencies contain multiple cycles

**Location:** `docs/requirements/srs.md`, FR dependency rows; `docs/requirements/user-stories.md`, statement “Dependencies are functional prerequisites.”

**Observed cycles:**
- FR-004 depends on FR-017; FR-017 depends on FR-004.
- FR-006 depends on FR-015; FR-015 depends on FR-006.
- FR-007 depends on FR-015; FR-015 depends on FR-007.
- FR-005 depends on FR-020; FR-020 depends on FR-005.
- FR-011 depends on FR-012; FR-012 depends on FR-011.
- FR-018 is “All FR read/write surfaces,” while every FR depends on FR-018.

**Impact:** The declared dependency graph is not a DAG. That weakens implementation sequencing, test-slice ordering and the claim that these are “functional prerequisites.” It also makes it unclear which contract must be stabilized first for dependent tests.

**Correction:** Reserve “Dependencies” for directional prerequisites and reclassify mutual/cross-cutting links as “Related / co-required.” Where shared contracts are genuinely bidirectional, decompose the shared contract (for example, a party-reference contract or history contract) so the graph is acyclic, or explicitly document intentional cycles and the test strategy for them.

---

### F-05 — Low — JTBD/BR acceptance mappings omit several ACs

**Location:** `docs/product/jtbd.md`; `docs/requirements/prd.md` §12; `docs/ai-sdlc/requirements-traceability.md`, scenario coverage table.

**Observation:** AC-130 (External Waiting On), AC-145 (Filing negative path) and AC-159 (Basic domain context) are traced to FRs in the traceability table, but they are absent from the JTBD rows and from the PRD BR mapping table. AC-161..163 are workflow-level and also absent from the JTBD rows.

**Impact:** The seven-JTBD mapping is structurally complete but not acceptance-complete. These ACs have no explicit JTBD/business owner in the primary mapping tables, so “7/7 JTBD covered” overstates trace completeness.

**Correction:** Add AC-130 under JTBD-03/BR-003, AC-145 under JTBD-05/BR-005, and AC-159 under JTBD-05 or the closest business outcome. Record AC-161..163 as cross-JTBD workflow acceptance or explicitly note that they are outside the per-JTBD row mapping.

---

### F-06 — Low — RULE-021 deterministic ordering has no direct AC

**Location:** `docs/requirements/business-rules.md`, RULE-021; `docs/requirements/srs.md`, FR-003 Validation; `docs/requirements/acceptance-criteria.md`, AC-103 and AC-144.

**Observation:** RULE-021 defines ordering: critical-chain first, due ascending, no-due last, then stable ID. AC-103 supplies only one eligible candidate; AC-144 supplies no candidates. No AC tests the ordering rule with multiple candidates, no-due records, equal due dates or tie-breaking.

**Impact:** An implementation could ignore the deterministic ordering and still pass both FR-003 acceptance tests.

**Correction:** Extend AC-103 or add AC-103a with at least four candidates covering critical/non-critical, due/no-due and equal due dates; assert the exact order and reasons. Also test stale-snapshot refresh.

---

### F-07 — Low — NFR-012 clock/revision convention is stated globally but not instantiated per AC

**Location:** `docs/requirements/acceptance-criteria.md`, preamble; `docs/requirements/srs.md`, NFR-012; individual ACs such as AC-101, AC-104, AC-105, AC-106, AC-107.

**Observation:** The preamble says every scenario uses synthetic data, an explicit clock/timezone and known prior revisions. Most individual ACs do not state a clock, timezone or prior revision. NFR-012 requires an identifiable clock and input revision for each FR/US scenario.

**Impact:** Test authors must infer fixture parameters, which risks non-reproducible timing and revision assertions, especially for due dates, expiry, history and stale-command tests.

**Correction:** Either declare the preamble convention as a normative fixture parameter with a default reference clock/timezone and revision seed, or add explicit clock/revision fields to each AC that depends on time or revision.

---

### F-08 — Low — AC-160 is exhaustive only for execution transitions

**Location:** `docs/requirements/acceptance-criteria.md`, AC-160; `docs/requirements/state-semantics.md`, execution, verification, derived and filing transition tables.

**Observation:** AC-160’s Given/When scope is “all execution transitions” and “each unlisted ordered pair.” Verification transitions, filing stage transitions and derived READY/BLOCKED/Timing/Attention transitions are only partially covered by separate ACs (AC-126/127/157, AC-116/129/145, AC-142/143).

**Impact:** There is no single exhaustive test of forbidden verification or filing transition pairs; for example, manual aggregate override and invalid filing-stage jumps are mentioned in prose but not exhaustively paired.

**Correction:** Extend AC-160 or add AC-160a/b/c for verification, filing-stage and derived-axis transitions. Alternatively, map each transition table row to a named test case.

---

### F-09 — Low — Workflow AC-161..163 are broad and under-traced

**Location:** `docs/requirements/golden-workflow-acceptance.md`, AC-161..163; `docs/ai-sdlc/requirements-traceability.md`, scenario coverage table.

**Observation:** AC-161 asserts that “every accepted change appears consistently in Grid/Control Room/history/delta,” but its traceability row lists only FR-001, FR-002, FR-005, FR-007, FR-015, FR-016 and FR-019. It omits FR-008 (history), FR-009 (Control Room), FR-014 (export), FR-018 (permissions) and FR-011 (Grid), even though the scenario text depends on them. AC-162/163 have similar omissions.

**Impact:** The workflow tests are too broad to fail cleanly and have incomplete contract ownership. A failure in view consistency or permissions may not be attributable to a traced FR.

**Correction:** Expand the trace rows, or split each workflow AC into step-level sub-ACs with explicit view/history/permission assertions.

---

### F-10 — Low — AC-145 combines two different Givens into one outcome

**Location:** `docs/requirements/acceptance-criteria.md`, AC-145.

**Observation:** The Given offers “package lacks mandatory signature OR authority rejects after receipt,” and the When says “editor attempts submission/approval.” The Then combines “missing-package submission rejected” and “rejection recorded with evidence and OWNER cancellation.” The alternatives do not map one-to-one to deterministic outcomes.

**Impact:** A test author cannot tell which expected branch applies to which Given, especially for the post-receipt rejection case.

**Correction:** Split AC-145 into separate scenarios: missing-signature submission denial, post-receipt authority rejection, and approval-attempt denial after rejection.

## 3. Passing Areas

- **P0 coverage:** FR-001..020 are all present, each with a stable parent REQ-MC-P0 ID, business requirement, story and acceptance references.
- **JTBD presence:** JTBD-01..07 are all defined; the omissions above are mapping gaps, not missing jobs.
- **State separation:** The five axes are clearly separated. AC-120/121/122/124/126/127/128/139/142/143/157/160 provide strong coverage of “completed ≠ verified,” WAITING ≠ BLOCKED, dependency derivation, proof expiry, supersession and dispute.
- **Forbidden execution transitions:** The execution table is explicit; AC-160’s execution scope, combined with AC-121/122/124/139, is testable in intent.
- **Evidence/version/reopen/expiry:** AC-115, AC-121, AC-124, AC-126, AC-128 and AC-140 are coherent and use injected time/version conditions appropriately.
- **Confidentiality and permissions:** AC-118/134/135/147/149/158 plus the uniform inaccessible/nonexistent response language are consistent. The proposed status of the matrix was not treated as a defect.
- **Bulk/import retry/concurrency:** AC-112, AC-113, AC-131, AC-132, AC-133, AC-139 and AC-153 cover preview, partial failure, duplicate-key retry, changed-content conflict, stale revisions and unknown outcomes. The one residual is that bulk-specific unknown-commit reconciliation is covered mainly through general AC-153 rather than a dedicated bulk AC.
- **Draft report exclusion of issued-report behavior:** RULE-016, FR-019 and AC-119/138 correctly avoid claiming P1 issued snapshots. The defect is the AC-138 boundary wording, not the P0/P1 boundary itself.
- **Workflow realism:** GW-01/02/03 define actors, preconditions, alternatives, exceptions, state behavior, evidence, history and concrete test targets. They do not rely on a mock screen alone.
- **NFR honesty:** NFR-001..014 provide measurable methods or explicitly mark budgets as pending. No invented SLA, RPO/RTO or legal-compliance guarantee was found.
- **Proposal discipline:** Proposed RULE/OBD content is consistently marked conditional; this review did not treat proposal status as a defect.

## 4. Residual Risks and Deferred Items

- Proposed RULE/OBD policies remain conditional. Findings above concern internal consistency, not approval status.
- Numeric performance, availability, backup, retention and RPO/RTO targets remain pending; AC-154/155 cannot pass until those values are approved.
- AC-137’s 10-second comprehension protocol is proposed and formative; it cannot establish general usability.
- No runtime, architecture, security-control or production evidence exists in this packet, and none was claimed.
- The SHA256 manifest was accepted as supplied; I did not independently recompute it.

## 5. Final Verdict

**CHANGES_REQUIRED** — Resolve F-01 through F-04 before treating the specification as test-ready. F-05 through F-10 should be corrected in the same revision to close traceability and ambiguity gaps. No P0 capability or JTBD is missing; the required changes are consistency and testability corrections, not scope rejection.


# REV-01 — OpenCode review round 2

Date: 2026-10-24. Session `ses_e92d149b4ffeK2J2m80AqX5v3d`; exported metadata confirms provider/model `opencode/big-pickle`, agent `plan`, finish `stop`, outcome `succeeded`, unchanged start/end snapshot and no edited files. CLI exit 0. Same user-authorized 11-file packet scope, corrected revision. Result PASS; all ten findings resolved, no new contradictions reported. The returned phrase “Codex-style” describes reviewer prose; actual execution identity is OpenCode, not a Codex subagent. Hashes recomputed locally by Codex, not by the reviewer.

## Round 2 reviewed snapshot manifest

| File | SHA256 |
|---|---|
| docs/requirements/prd.md | 043e196d03deda80fc6d4dd2bd39364eaaddf2e94ef09bcf25bbedefdc9c16ee |
| docs/requirements/srs.md | 3dfe3a380b622289809d08d73223ca0f8a3f8f87b2f5e827edb6bbb786cfb0b9 |
| docs/requirements/business-rules.md | c71ece0b6d1e0509324dfa09942162e3ad9f53b9463e506ff2e0fef8bd94aec0 |
| docs/requirements/state-semantics.md | 7df8b5b77bfde7e2a740e72c06e0d806df6dc8aa528dbbe1889abc3fbbba12ee |
| docs/requirements/permission-matrix.md | ca48c30ad1cd06a56d744543fdb391b7d499dd8eccf16c3bf0a6b538228519a2 |
| docs/requirements/user-stories.md | 82db6b534e54e306f9a866626d9f1a98d8177c72b15160f8e376b27867d422e3 |
| docs/requirements/acceptance-criteria.md | 6008f1c15f609f2ea3ba045b051174a5a10f995115b925af1292f64cae25e4c7 |
| docs/requirements/golden-workflow-acceptance.md | 6185fff947130f019393c11628a98384220e16e2209aa33978d1b5d660d07748 |
| docs/requirements/open-business-decisions.md | 5ae1295f24f6ba69ecc9c2163f9cdb8596cdefd738f28a11e0d94143e44ac1ab |
| docs/product/jtbd.md | f92e6d66d601022f82e5afe29d77c51d71fba2964529faeedc615209362dd5d4 |
| docs/ai-sdlc/requirements-traceability.md | 9127652788c804e97778729a4ffabdfd44f8a24a88d2ab223f43d8406c32e907 |

## Round 2 returned report

# Verdict: **PASS**

**Identity:** Codex-style independent requirements re-review (REV-01 round 2)
**Baseline:** `20f12fe`
**Scope:** Review corrected requirements against F-01 through F-10. Tools denied, no edits.

## All F dispositions

| ID | Prior finding | Status | Notes (exact locations) |
|---|---|---|---|
| **F-01** | Ordinary dependency authority ambiguous | **RESOLVED** | `docs/requirements/permission-matrix.md` splits authority: **Ordinary dependency edges between Requirements/Actions** = OWNER/EDITOR (same matter, gated); **Milestone required prerequisites / critical designation / Matter settings** = OWNER only. Explicitly called out as "distinct from milestone required prerequisites". |
| **F-02** | Unreachable DISPUTED/VERIFIED to NOT_REQUIRED | **RESOLVED** | `docs/requirements/state-semantics.md` forbids direct `DISPUTED/PARTIALLY_VERIFIED/VERIFIED → NOT_REQUIRED`. Process required: resolve dispute via designated verifier first; if criteria become inapplicable, perform reasoned criteria revision (preserving history) → recompute to `UNVERIFIED` (or zero-applicable state) → separate OWNER applicability decision to `NOT_REQUIRED` with rationale. Enforced in `docs/requirements/acceptance-criteria.md` **AC-160** ("direct aggregate overwrite and DISPUTED/VERIFIED/PARTIALLY_VERIFIED→NOT_REQUIRED denied... Resolve dispute, explicitly revise criteria to zero with audit → UNVERIFIED, then separate OWNER applicability → NOT_REQUIRED succeeds"). |
| **F-03** | Empty delta window boundary contradiction | **RESOLVED** | `docs/requirements/business-rules.md` **RULE-016** uses half-open `(t1,t2]`. `docs/requirements/acceptance-criteria.md` **AC-138** adds explicit variants: `t1==t2` with event at boundary excluded ("(T0,T0] is empty"), outstanding items still reported separately; `t1>t2` rejected without misleading report; `t1<T0==t2` boundary tested with correct inclusion/exclusion. |
| **F-04** | Cyclic FR prerequisites | **RESOLVED** | `docs/requirements/srs.md` states dependencies listed are **directional contract/test-setup prerequisites (acyclic)**, not the product dependency graph; **Related / co-required** separated for mutual integration. `FR-018` established as access contract prerequisite; no cyclic FR prerequisite chain present. Test setup ordering is explicit without making FR graph cyclic. |
| **F-05** | Missing BR/JTBD AC trace | **RESOLVED** | `docs/requirements/prd.md` BR table maps BR→JTBD→FR→AC. `docs/product/jtbd.md` full JTBD→BR→FR/UX→AC mapping. `docs/ai-sdlc/requirements-traceability.md` expanded with Step 01 chain (BR/FR/US/AC), full AC→FR mapping table, NFR evidence, and cross-JTBD workflow links. **AC-161/162/163** explicitly cross-cut BR-001..007/JTBD-01..07. |
| **F-06** | No candidate ordering test | **RESOLVED** | `docs/requirements/acceptance-criteria.md` **AC-103** defines normative fixture (critical-chain K1/K2/K3 with mixed due/no-due, noncritical N1/N2/N3, plus BLOCKED B and WAITING W) with exact expected order **K1,K2,K3,N1,N2,N3** (critical first, due ascending within group, no-due last, stable ID tie-break), reasons/owners shown, exclusions explained, and stale-revision behavior (r2 blocks K1 → refresh excludes; use of r1 rejected). |
| **F-07** | No normative clock/revision defaults | **RESOLVED** | `docs/requirements/acceptance-criteria.md` states normative fixture: `clock T0=2026-06-15T09:00:00+07:00`, `timezone Asia/Ho_Chi_Minh`, `W1/M1`, each existing record `r1`, accepted mutation → `r2`, actor set (U0 OWNER, U1 submitter, U2 designated verifier, U3 VIEWER), cross-workspace `W2/M2` with no membership. Used across scenarios; due/expiry/stale cases explicit. |
| **F-08** | Exhaustive transition test only execution | **RESOLVED** | `docs/requirements/acceptance-criteria.md` **AC-160** requires generating cases from **every row in `docs/requirements/state-semantics.md`** covering Execution, Verification (all events/transitions incl. criteria revision before applicability, dispute resolution), Filing (all stage rows incl. alternatives/negative/correction), and derived **Dependency/Timing/Attention** with unlisted ordered pairs tested. Also enforces no direct terminal→NOT_STARTED, blocked completion denied, same-state no-op without duplicate event, client override of derived values rejected. |
| **F-09** | Workflow view/history/permission undertrace | **RESOLVED** | `docs/requirements/golden-workflow-acceptance.md` **AC-161/162/163** require a **stage checkpoint ledger** (actor/permission, before/after, proof, exact version, history event, Grid/Control Room readback, scoped delta/export) per stage with failure attribution to FR. `docs/ai-sdlc/requirements-traceability.md` documents cross-JTBD workflow coverage and checkpoint requirement. Permissions exercised throughout (AC-118/134/135/140/147/158) with uniform denial and restricted security audit. |
| **F-10** | Mixed filing negative branches | **RESOLVED** | `docs/requirements/acceptance-criteria.md` **AC-145** has three variants: (1) incomplete package at Signature → reject submission, no stage change; (2) rejection/withdrawal evidence recorded → OWNER cancels with reason, rejection proof preserved, linked Requirement remains unmet, history attributes actions (never becomes Approval); (3) attempt to approve cancelled filing without OWNER reopen and new authority approval proof → rejected. `docs/requirements/golden-workflow-acceptance.md` GW-03 details no-supplement, repeated supplements, and negative outcomes. |

## New real contradictions (severity / exact location)

**None found.** The corrected set is internally consistent with the stated PO constraints (proposed rules gated by OBDs, P0 scope preserved, Step 01 stops at requirements/architecture handoff).

Notes observed (not contradictions, properly gated):
- **OBD-gated policies**: Many RULEs remain PROPOSED (OBD-02/04/05/06/07/08/10/11). This is correct per instructions ("detailed policies remain proposals needing PO approval, not defects by themselves").
- **Fixture coupling**: ACs are tightly coupled to the normative fixture (T0, revisions r1→r2). This is intentional and specified.
- **Derived state authority**: State-semantics correctly prevents client-side forcing of derived dimensions (Dependency/Timing/Attention) with causal history.
- **Permission boundary**: Workspace OWNER ≠ automatic matter read; matter-level membership required; documents inherit matter scope per matrix (with note that finer ACL may need PO decision if required - OBD-08 open point, not a contradiction).

## Limits
- **No runtime/test execution**: All ACs marked NOT_RUN; verdict is based on document review only.
- **Policy approval pending**: Critical semantics depend on PO decisions in `docs/requirements/open-business-decisions.md` (OBD-02..08/10/11). **MC-001 remains WAITING_APPROVAL / Step 01 not DONE** until those are resolved.
- **Architecture/implementation deferred**: `docs/architecture/solution-architecture-handoff.md` is PENDING_STEP_02; design PENDING_STEP_03; no code/infra approved.
- **Feasibility unverified**: Backend/frontend templates and Cloudflare Free Tier/$0 feasibility remain DEFERRED_STEP_02_TECHNICAL_VALIDATION (OBD-09).
- **Provenance**: Originals A/B not directly verified (OBD-01 resolved as approved prompts acceptable; archival optional).
- **No guarantees claimed**: No SLA/ROI/legal compliance/latency pass claimed; measurements proposed but numeric budgets pending.

**Final Verdict: PASS** (all F-01..F-10 addressed; no new real contradictions identified within the stated gates).
