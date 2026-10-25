<!-- docs/architecture/evidence-model.md, source lines 1-26 -->
# Evidence and Verification Design

- Author: Claude Code (actual), claude-opus-5-5, MC-002-ARCH, packet-only.
- Inputs: requirements `572835a` / approval `54e1db5`; backend `d024e3ec9dd96abf9ada1d7516f1b2f0e8cba67b`.
- Status: **PROPOSED / NOT_IMPLEMENTED / WAITING_ARCHITECTURE_APPROVAL**.

## 1. Separation of concepts

| Concept | Record | What it is not |
|---|---|---|
| Criterion (Evidence Requirement) | `evidence_requirements` + immutable `criterion_revisions` + `criterion_components` | Not proof; zero criteria never means verified |
| Proof (Evidence) | `evidence`, immutable after submission | Not verified by existing; not tied to a single criterion |
| Claim | `evidence_claims (evidence, criterion_revision, component)` | The many-to-many link: "this evidence is offered for this criterion component" |
| Assessment | `evidence_assessments` per claim and subject proof epoch | The only thing that can satisfy a component; scoped to exactly one claim |
| Dispute | `evidence_disputes` on an accepted assessment | Not a rejection; makes subject DISPUTED until resolved |
| Subject aggregate | `verification_state` on Requirement/Action/Filing | Derived; never written from input |

## 2. Many-to-many without acceptance leak

One Evidence may be claimed against several criteria (e.g., one signed agreement version proves both "board approval attached" and "signature of party A"). Rules:

1. Acceptance is recorded **per claim**. Accepting E for C1 creates no state for C2. There is no column, endpoint or derived field meaning "Evidence E is verified". The UI shows per-criterion verdicts for an evidence item.
2. A claim pins the **criterion revision**. A new criterion revision does not inherit assessments; the evidence must be re-claimed and re-assessed (FR-006 "criteria revision invalidates stale assessment").
3. A claim pins the **component**; a multi-component criterion is partial until every mandatory component has its own accepted claim.
4. An assessment pins the **assessed document version** and the **subject proof epoch**. The assessed version must equal the evidence's `document_version_id`: required for DOCUMENT_VERSION evidence, NULL for EXTERNAL_REFERENCE/OBSERVATION evidence. Non-document evidence can never satisfy a CURRENT_AUTHORITATIVE or FIXED criterion, so claiming it against one is rejected (`422 validation`); it may be claimed against `NONE` criteria. The command guard is backed by triggers `assessment_version_consistent` and `claim_version_rule_kind` (data-model §4); reopen of the subject — Requirement, Action or Filing (filing-model §4) — moves the epoch so old acceptances become historical.
5. **Canonical current verdict.** Per (claim, subject epoch) exactly one assessment is *current* (non-superseded). A new assessment supersedes it in the same transaction (`superseded_by_id`, `assessment.superseded`); only the current assessment can satisfy. A later REJECTED ends an earlier ACCEPTED's satisfaction (RULE-007; state-semantics "explicit authorized reversal with reason"), and a later ACCEPTED replaces an earlier REJECTED. Re-assessment is refused while the current assessment has an open dispute (resolve first). Revocation marks the current assessment revoked without a new verdict.

<!-- docs/architecture/evidence-model.md, source lines 40-77 -->
## 4. Satisfaction function

```
componentSatisfied(c, subject, asOf) =
  ∃ assessment a, claim k, evidence e:
    k.criterion_revision == current revision of c.criterion  and  k.component == c
    a == current(k, subject.proof_epoch)   // the unique non-superseded assessment of k in the current epoch
    a.verdict == ACCEPTED and a.revoked_at == nil
    e.withdrawn_at == nil
    e.valid_from ≤ asOf < min(e.valid_until, a.effective_until)       // half-open; nil = unbounded
    versionRule(c.criterion):
       CURRENT_AUTHORITATIVE(doc) → a.assessed_version == doc.current_version_id
       FIXED(v)                   → a.assessed_version == v
       NONE                        → true
    no open dispute on a  (an open dispute makes the subject DISPUTED; see precedence)
criterionSatisfied = all mandatory components satisfied (single implicit component when none declared)
```

Rejected assessments never satisfy; only the current assessment of the claim in the subject's current epoch counts (§2 rule 5); superseded assessments remain in history. Validity uses half-open intervals so the expiry instant itself is unsatisfied (RULE-007 "affects state at the effective instant").

## 5. Lifecycle commands

| Command | Actor | Guards | Effects (same txn) |
|---|---|---|---|
| Create/revise criterion | EDITOR/OWNER (applicability change: OWNER) | Subject in matter; positive validity rule; reason for revision; if revision changes applicability, OWNER | New immutable revision; old assessments stop counting; aggregate + readiness recompute; impact list returned |
| Submit evidence (+claims) | EDITOR/OWNER | Exact document version available in same matter; `valid_from < valid_until` | `evidence.submitted`, `evidence.claimed`; aggregate unchanged (UNVERIFIED stays) |
| Add claim (also each claim in Submit evidence) | EDITOR/OWNER | Current criterion revision; not duplicate; evidence kind compatible with the version rule (§2 rule 4) | `evidence.claimed` |
| Withdraw evidence | Submitter or OWNER | Reason | All its satisfactions cease; recompute |
| Assess (ACCEPT/REJECT) | Designated independent verifier | §3; claim targets current revision; `If-Match` = claim revision; `expectedSubjectEpoch` = current epoch; `assessedDocumentVersionId` = the evidence's version (absent for non-document evidence; §2 rule 4); no open dispute on current assessment | Prior current assessment superseded (`assessment.superseded`), `assessment.recorded`; recompute aggregate and downstream readiness |
| Revoke acceptance | Designated independent verifier | Reason | `assessment.revoked`; recompute |
| Raise dispute | EDITOR/OWNER | Target accepted current assessment; reason | `dispute.raised`; subject DISPUTED; dependents re-block |
| Resolve dispute | Designated independent verifier ≠ raiser | Current evidence re-evaluated; outcome UPHOLD or REVOKE | `dispute.resolved` (+`assessment.revoked`); aggregate recomputed from current proof, never restored from prior label (AC-157) |
| Applicability NOT_REQUIRED | OWNER | From UNVERIFIED; zero applicable mandatory criteria; no open dispute; reason | `subject.verification_applicability_decided` |
| Revoke exemption | OWNER | Reason | → UNVERIFIED |
| Expiry | SYSTEM_CLOCK via boundary materialization (state-machine §6) | — | State already reflects expiry at the instant by pure evaluation; `assessment.expired` effective at instant, recorded at materialization |

Required ordering for exemption (state-semantics): resolve dispute → revise criteria to zero applicable (reasoned) → aggregate becomes UNVERIFIED → separate OWNER NOT_REQUIRED event. The API refuses to combine these into one command so each step is attributable.
