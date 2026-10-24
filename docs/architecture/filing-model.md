# Filing Design

- Author: Claude Code (actual), claude-opus-5-5, MC-002-ARCH, packet-only.
- Inputs: requirements `572835a` / approval `54e1db5`; backend `d024e3ec9dd96abf9ada1d7516f1b2f0e8cba67b`.
- Status: **PROPOSED / NOT_IMPLEMENTED / WAITING_ARCHITECTURE_APPROVAL**.

## 1. Model

MatterControl records accountable observations about a filing; it does not file anything (RULE-012).

| Record | Purpose |
|---|---|
| `Filing` | Matter, linked Requirement (the filing obligation), authority ExternalParty, owner, `stage`, `execution_state`, optional verification (proof required), due, `negative_outcome` {REJECTED, WITHDRAWN} nullable |
| Package criteria | Evidence Requirements with subject = Filing; components for each declared document and signature |
| `FilingCycle` | `cycle_no` 1 = initial; ≥2 = supplement cycles; request reference, owner, due, opened/closed |
| `FilingStageObservation` | Append-only: from/to stage, observation type, reference, `observed_at` (effective), evidence IDs, actor, reason; correction links |
| `FilingSubmission` (+items) | Immutable exact version set submitted in a cycle, submission reference and time |

## 2. Stage machine

```mermaid
stateDiagram-v2
  [*] --> REQUIREMENT
  REQUIREMENT --> PACKAGE_PREPARATION: scope + owner + package criteria declared
  PACKAGE_PREPARATION --> SIGNATURE: required versions identified; non-signature prep complete
  SIGNATURE --> SUBMISSION: package + signature criteria satisfied (or OWNER no-signature applicability) + submission ref/time + exact versions
  SUBMISSION --> RECEIPT: acknowledgement evidence
  RECEIPT --> AUTHORITY_REVIEW: awaiting authority; party identified
  AUTHORITY_REVIEW --> SUPPLEMENT: authority request; new cycle with owner/due
  SUPPLEMENT --> RESPONSE: requested items satisfied; response ref + exact versions
  RESPONSE --> AUTHORITY_REVIEW: response submitted; awaiting outcome
  AUTHORITY_REVIEW --> APPROVAL: authority outcome proof
  RESPONSE --> APPROVAL: authority outcome proof
```

Execution coupling (same transaction as the stage observation): PACKAGE_PREPARATION → IN_PROGRESS; SIGNATURE may be WAITING on signatory; SUBMISSION IN_PROGRESS (submission is not completion); RECEIPT IN_PROGRESS/WAITING; AUTHORITY_REVIEW WAITING with an open `waiting_on` the authority party; SUPPLEMENT IN_PROGRESS; RESPONSE → AUTHORITY_REVIEW WAITING; APPROVAL → COMPLETED with verification remaining UNVERIFIED until a designated verifier accepts the outcome proof under the filing's outcome criterion.

Guards evaluated under the matter lock:

- **Package complete** (Signature→Submission): every applicable mandatory package criterion of the filing is satisfied per evidence-model §4 (accepted by an independent verifier), or signature criteria were made non-applicable by an OWNER reasoned criteria revision. Missing signature → `guard-failed` listing criteria (AC-145).
- **Submission** needs reference, `submitted_at`, and exact version IDs, each AVAILABLE or external reference in the same matter. A `FilingSubmission` row is created; it is never updated.
- **Receipt** needs acknowledgement evidence; without it the filing stays at SUBMISSION, execution WAITING with reason "acknowledgement outstanding".
- **Approval** needs authority outcome evidence; receipt or submission never implies approval (AC-116).
- Every unlisted stage pair is rejected (`transition-not-allowed`, AC-160).

## 3. Cycles

AUTHORITY_REVIEW → SUPPLEMENT opens cycle n+1 with request reference, owner, due, and new package criteria revisions for requested items. RESPONSE records a new `FilingSubmission` in that cycle with exact versions (e.g., v3); cycle 1 submission with v2 remains intact (AC-129). Multiple supplement cycles are unbounded; the latest open cycle's wait is the current "Waiting On".

## 4. Negative outcomes, cancellation, correction

| Event | Actor | Effect |
|---|---|---|
| Record rejection/withdrawal observation | EDITOR/OWNER with evidence | Sets `negative_outcome`; stage unchanged; filing attention ATTENTION; never APPROVAL |
| Close negative filing | OWNER, reason | Execution CANCELLED; linked Requirement unchanged (remains unmet; no auto state) |
| Approval after negative outcome | — | Rejected unless OWNER reopen (→ IN_PROGRESS, prior observations retained) and new authority approval evidence (AC-145) |
| Correct erroneous observation | OWNER, reason, `correctsObservationId` | Appends correction; cannot fabricate missing intermediate observations |
| Change after approval | OWNER reopen | Prior submission/outcome preserved |

The linked Requirement is never auto-completed or auto-verified by filing approval; a human completes it and a verifier assesses its own criteria ("no magic verification").

## 5. Tests

| ID | Scenario | AC |
|---|---|---|
| FL-01 | Receipt then Authority Review → WAITING; not APPROVAL, not VERIFIED | AC-116 |
| FL-02 | Two supplement cycles; all submissions retrievable; current wait correct | AC-129, AC-163 |
| FL-03 | Missing signature at Signature → Submission rejected, no event | AC-145 |
| FL-04 | Rejection evidence → OWNER cancel; Requirement unmet; Approval attempt rejected | AC-145 |
| FL-05 | No-supplement path Authority Review → Approval with outcome proof | AC-163 |
| FL-06 | No-signature applicability by OWNER revision, then submission allowed | AC-160 |
| FL-07 | Every unlisted stage pair rejected; stale revision rejected | AC-160 |
