# MatterControl AC-137 — Facilitator Guide & Scoring Rubric

> [!IMPORTANT]
> **CONFIDENTIAL FACILITATOR MATERIAL.**  
> This guide and answer key must NEVER be provided to participants or stored in public test participant bundles.

---

## 1. Study Overview & Cohort Requirements

- **Requirement ID:** AC-137 (Human-Only Comprehension Verification)
- **Cohort Size:** 5 Real Human Participants (Transaction / Corporate Legal Managers or Senior Counsel)
- **Passing Threshold:** Minimum **80% aggregate score** across all 5 participants (at least 4 out of 5 managers scoring >= 80% on comprehension questions)
- **Status of Record:** `TRIAL_NOT_RUN / AWAITING_HUMAN_TRIAL` (No synthetic data permitted)

---

## 2. Facilitator Instructions

1. **Pre-flight Environment:** Ensure the participant is seated at a desktop or laptop with a minimum 1440x900 viewport (or standard external monitor). Browser must run against the verified synthetic Matter #M-4081 dataset.
2. **Timing Protocol:**
   - Scenario A: Maximum 15 minutes.
   - Scenario B: Maximum 15 minutes.
   - Record exact UTC start and completion times.
3. **No Prompting Rule:** Do not explain legal rules, domain terminology, or UI layout to the participant during the test. If the participant asks "Is this completed?", reply: "Please answer based solely on what you see on the screen."
4. **Scoring Protocol:** Each sub-question carries a designated point value (total 50 points per participant). A score of >= 40/50 (80%) is required for an individual pass.

---

## 3. Answer Key & Scoring Rubric

### Scenario A: Executive Control Room Triage (25 points total)

| Item | Expected Correct Answer | Points | Scoring Criteria |
|---|---|---|---|
| **A.1.1** | Exact UTC timestamp matching `room.asOf` displayed in header text (e.g., `2026-10-28T07:15:00Z`). | 3 pts | Full credit for exact ISO string or localized equivalent. 0 pts if guessing or omitted. |
| **A.1.2** | Exact integer matching `room.sourceRevision` (e.g., `42`). | 2 pts | Full credit for exact revision number. 0 pts for wrong number. |
| **A.2.1** | Integer matching `room.state.blocked` count displayed on the 'Blocked' KPI card. | 3 pts | Full credit for exact count. |
| **A.2.2** | Record ID + exact causal reason displayed in Blockers section (e.g., `Prerequisite ACTION-042 incomplete: unfulfilled escrow deposit`). | 5 pts | 2 pts for correct ID, 3 pts for identifying the actual causal blocker rather than generic 'error'. |
| **A.3.1** | Title and assigned user of top item in Next Actions (e.g., `Execute Indemnity Joinder Agreement · Jane Doe`). | 4 pts | 2 pts for title, 2 pts for assigned owner. |
| **A.3.2** | Explanation that all prerequisites are satisfied and the item is on the critical path / earliest due date. | 4 pts | 4 pts for citing satisfied prerequisites or critical path. 0 pts for saying 'recommended by AI'. |
| **A.4.1** | Selection: `[X] Yes`. | 2 pts | 2 pts for Yes. 0 pts for No. |
| **A.4.2** | Stating that an Owner must explicitly close or reopen the filing (negative open outcome blocks approval). | 2 pts | 2 pts for mentioning owner decision to close/reopen. |

---

### Scenario B: Operational Grid & Verification Semantics (25 points total)

| Item | Expected Correct Answer | Points | Scoring Criteria |
|---|---|---|---|
| **B.1.1** | Execution State: `COMPLETED`. | 3 pts | Full credit for COMPLETED. |
| **B.1.2** | Verification State: `UNVERIFIED` (or `PARTIALLY_VERIFIED` / `DISPUTED` per dataset). | 3 pts | Full credit for exact verification badge text. |
| **B.1.3** | Explanation that Execution (doing work) and Verification (independent proof) are separate independent axes; doing the work does not prove compliance. | 5 pts | 5 pts for clearly articulating the two-axis independence rule. |
| **B.2.1** | Submitter name / role from evidence submission record. | 2 pts | Full credit for correct submitter name. |
| **B.2.2** | Selection: `[X] No`. | 3 pts | 3 pts for No. 0 pts for Yes. |
| **B.2.3** | Citing the independent verifier rule: "Only designated verifiers who did not submit the evidence may assess claims." | 3 pts | 3 pts for citing independent verifier separation. |
| **B.3.1** | Selection: `[X] No`. | 3 pts | 3 pts for No. (Version 3 is uploaded, but not promoted). |
| **B.3.2** | Citing the explicit rule displayed on screen: "Current is an explicit decision by an owner, never the most recent upload." | 3 pts | 3 pts for quoting or stating the explicit owner decision rule. |
| **B.4.1** | Selection: `[X] No` (form draft is preserved across language changes). | 2 pts | 2 pts for verifying draft preservation. |
| **B.4.2** | Selection: `[X] No` (user legal content remains in original language, never overwritten). | 2 pts | 2 pts for confirming legal content immutability. |

---

## 4. Cohort Scorecard Sheet

| Participant ID | Name / Organization | Scenario A (25) | Scenario B (25) | Total (50) | Percentage | Pass / Fail (>=80%) |
|---|---|---|---|---|---|---|
| **MGR-01** | `[Awaiting Trial]` | — | — | — | —% | `PENDING` |
| **MGR-02** | `[Awaiting Trial]` | — | — | — | —% | `PENDING` |
| **MGR-03** | `[Awaiting Trial]` | — | — | — | —% | `PENDING` |
| **MGR-04** | `[Awaiting Trial]` | — | — | — | —% | `PENDING` |
| **MGR-05** | `[Awaiting Trial]` | — | — | — | —% | `PENDING` |
| **COHORT AGGREGATE** | | | | | **—%** | **TRIAL_NOT_RUN** |

---

## 5. Formal Disposition Criteria

- If Cohort Aggregate >= 80% and at least 4/5 participants score >= 80%: **PASS_HUMAN_COMPREHENSION**.
- If Cohort Aggregate < 80% or >= 2 participants fail: **CHANGES_REQUIRED_UI_COMPREHENSION**.
- **Current Status:** `NOT_RUN / AWAITING_HUMAN_TRIAL`.
