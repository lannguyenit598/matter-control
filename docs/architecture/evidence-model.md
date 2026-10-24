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
4. An assessment pins the **assessed document version** (for DOCUMENT_VERSION evidence it must equal the evidence's version) and the **subject proof epoch**; reopen of the subject — Requirement, Action or Filing (filing-model §4) — moves the epoch so old acceptances become historical.
5. **Canonical current verdict.** Per (claim, subject epoch) exactly one assessment is *current* (non-superseded). A new assessment supersedes it in the same transaction (`superseded_by_id`, `assessment.superseded`); only the current assessment can satisfy. A later REJECTED ends an earlier ACCEPTED's satisfaction (RULE-007; state-semantics "explicit authorized reversal with reason"), and a later ACCEPTED replaces an earlier REJECTED. Re-assessment is refused while the current assessment has an open dispute (resolve first). Revocation marks the current assessment revoked without a new verdict.

## 3. Independence (no self-verification) — RULE-006, AC-140

An assessment, revocation of acceptance or dispute resolution by reviewer R on claim K of evidence E is allowed only if, at commit time under the matter lock:

- R has an active VerifierDesignation in the Matter and active role EDITOR or OWNER;
- R ≠ E.submitted_by and R ≠ K.claimed_by (whoever offered the evidence for this criterion is also a submitter for that scope);
- R is not the raiser of the dispute being resolved.

The database repeats the first identity check: `evidence_assessments` stores denormalized `evidence_submitter_id` and `claimant_id`, populated through a composite FK to `evidence_claims(matter_id, id, evidence_submitter_id, claimed_by)` (same-Matter scope included, data-model §1a), with `CHECK (reviewer_id <> evidence_submitter_id AND reviewer_id <> claimant_id)`. A code path that forgets the policy still cannot persist a self-verification.

Sharing evidence therefore cannot launder independence: if verifier U2 links U1's evidence to a new criterion, U2 becomes claimant and cannot assess that claim; a third designated member must. If no independent verifier exists, the claim stays pending (one-member matter remains pending; AC-140). **ARCH-Q2 (stricter option, not adopted):** also exclude the uploader of the referenced document version. Requires PO decision because it adds friction beyond RULE-006.

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
| Add claim | EDITOR/OWNER | Current criterion revision; not duplicate | `evidence.claimed` |
| Withdraw evidence | Submitter or OWNER | Reason | All its satisfactions cease; recompute |
| Assess (ACCEPT/REJECT) | Designated independent verifier | §3; claim targets current revision; `If-Match` = claim revision; `expectedSubjectEpoch` = current epoch; assessed version matches; no open dispute on current assessment | Prior current assessment superseded (`assessment.superseded`), `assessment.recorded`; recompute aggregate and downstream readiness |
| Revoke acceptance | Designated independent verifier | Reason | `assessment.revoked`; recompute |
| Raise dispute | EDITOR/OWNER | Target accepted current assessment; reason | `dispute.raised`; subject DISPUTED; dependents re-block |
| Resolve dispute | Designated independent verifier ≠ raiser | Current evidence re-evaluated; outcome UPHOLD or REVOKE | `dispute.resolved` (+`assessment.revoked`); aggregate recomputed from current proof, never restored from prior label (AC-157) |
| Applicability NOT_REQUIRED | OWNER | From UNVERIFIED; zero applicable mandatory criteria; no open dispute; reason | `subject.verification_applicability_decided` |
| Revoke exemption | OWNER | Reason | → UNVERIFIED |
| Expiry | SYSTEM_CLOCK via boundary materialization (state-machine §6) | — | State already reflects expiry at the instant by pure evaluation; `assessment.expired` effective at instant, recorded at materialization |

Required ordering for exemption (state-semantics): resolve dispute → revise criteria to zero applicable (reasoned) → aggregate becomes UNVERIFIED → separate OWNER NOT_REQUIRED event. The API refuses to combine these into one command so each step is attributable.

## 6. Version supersession (RULE-007, AC-128)

Promotion of a new current version changes `documents.current_version_id` in the same transaction, then recomputes every subject whose criteria use `CURRENT_AUTHORITATIVE(document)`. Accepted assessments of the old version stop satisfying those criteria (pending review of the new version). `FIXED(v2)` criteria are unaffected. The promotion response returns this impact list. Nothing is deleted; old assessments remain readable with their exact version.

## 7. Imported verification claims (RULE-014)

Import stores any "verified" column text in `imported_verification_claim` on the Requirement and emits it in `import.group_applied`. It never creates evidence, claims or assessments. The aggregate stays UNVERIFIED and the UI shows "imported claim — review required" (AC-113).

## 8. Tests

| ID | Scenario | AC |
|---|---|---|
| EV-01 | E accepted for C1; C2 claimed by same E unassessed → C2 missing; subject PARTIALLY_VERIFIED | AC-127 |
| EV-02 | Verifier links someone else's evidence to C2 then tries to assess → 403 self-verification; DB CHECK rejects direct insert | AC-140 |
| EV-03 | Submitter who is OWNER and designated verifier self-verifies → denied; non-designated EDITOR → denied; designated third member → allowed | AC-140 |
| EV-04 | Sole accepted proof revoked; separately clock reaches `valid_until` with no reads → dependents re-block; history keeps acceptance | AC-126 |
| EV-05 | Dispute on one of two accepted criteria → DISPUTED; resolve UPHOLD → VERIFIED; resolve REVOKE → PARTIALLY_VERIFIED; stale/unauthorized resolve → no mutation | AC-157 |
| EV-06 | Criterion revision mid-review: assessment with old revision ID rejected `stale-criterion-revision` | AC-160 |
| EV-07 | Promotion v3: CURRENT criterion invalidated, FIXED(v2) retained | AC-128 |
| EV-08 | Reopen subject → epoch+1 → UNVERIFIED (unless NOT_REQUIRED) | AC-124 |
| EV-09 | Applicability sequence and forbidden direct transitions | AC-160 |
| EV-10 | Complete Action/Requirement → zero assessment rows created | AC-101, AC-121 |
| EV-11 | ACCEPTED then REJECTED on same claim/epoch → REJECTED current, criterion unsatisfied, both in history | AC-126, AC-157 |
| EV-12 | Direct SQL: cross-matter claim/assessment/dispute/component, unknown component key → rejected | AC-135 |
| EV-13 | Future `valid_from`: UNVERIFIED before, VERIFIED at `valid_from` with no write; event later with `effective_at = valid_from` | AC-126 |
