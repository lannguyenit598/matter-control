# F10 — confirmed candidate-source gap, not a request to rerun review

Local Codex inspected these current full sections at base 8f52779. They do not state a deterministic observation/evidence-link -> (filingId,cycleNo) association or a closed observation-type -> RECEIPT/OUTCOME projection. This conclusion is limited to the pinned sources, not every possible external source or any deployed schema.

- data-model §5 names observations with an ellipsis; it is not a hidden detailed definition or proof of a PK. Its filing_submissions cycle FK cannot be transferred to observations by assumption.
- filing-model keeps cycles and proof epochs independent; reopen increments epoch and retains cycles/observations, without opening a cycle.
- API expectedCycleNo is an admission precondition when a cycle is named; no recorded-field/derivation clause follows from that alone.
- Distinct(evidence,role) keyset can be specified independently, but its cycle predicate/role membership and correction-history reachability still need design.
- No extra source is invented. Do not solve this by timestamps, maximum cycle, current epoch, a new business UNIQUE or hidden cap.
- Raw scalar observationId/natural-key fields are a possible contract alternative without automatically creating a typed Ref kind; no alternative is adopted.

The earlier21contentinputs remain unchanged. The excerpts below are a prepared supplemental payload only: no external transmission or expanded session read is claimed. Human delivery of the scoped prompt is required; official permissions still apply.


## docs/architecture/data-model.md:216-224

Full-file bytes 34371; SHA256 873a23b4791a1656a0e54edda5fccf28628c65d432151b5e5ba7faa058badf6f. Exact excerpt:

~~~text
## 5. Documents, filing, context

- `documents (id, matter_id, title, current_version_id, revision, UNIQUE (matter_id, id), FOREIGN KEY (matter_id, id, current_version_id) REFERENCES document_versions (matter_id, document_id, id) DEFERRABLE INITIALLY DEFERRED)`.
- `document_versions (id, matter_id, document_id, seq, source, content_object_id, external_reference, sha256, size_bytes, media_type, predecessor_version_id, uploaded_by, availability, FKs (matter_id, document_id) → documents, (matter_id, document_id, predecessor_version_id) → document_versions, (matter_id, content_object_id) → content_objects, CHECK (CASE source WHEN 'CONTENT' THEN content_object_id IS NOT NULL AND external_reference IS NULL WHEN 'EXTERNAL_REFERENCE' THEN content_object_id IS NULL AND external_reference IS NOT NULL ELSE false END), UNIQUE (document_id, seq), UNIQUE (matter_id, id), UNIQUE (matter_id, document_id, id))`.
- `content_objects (id, matter_id, object_key UNIQUE, status, expected_sha256, expected_size, expires_at, committed_at, UNIQUE (matter_id, id))`.
- `signature_observations (id, matter_id, document_version_id, signatory_party_id | signatory_entity_ref_id | signatory_label, CHECK (num_nonnulls(signatory_party_id, signatory_entity_ref_id, signatory_label) = 1), observed, evidence_id, observed_at, recorded_by, composite FKs per §1a)`.
- `filings (id, matter_id, requirement_id, authority_party_id, owner_user_id, stage CHECK (9 values), execution_state, proof_required BOOLEAN NOT NULL, verification_state, CHECK ((verification_state IS NULL) = (NOT proof_required)), proof_epoch INT NOT NULL DEFAULT 0 CHECK (proof_epoch >= 0), proof_epoch_opened_at, due_at, negative_outcome CHECK IN ('REJECTED','WITHDRAWN'), negative_outcome_epoch INT, CHECK (num_nonnulls(negative_outcome, negative_outcome_epoch) IN (0, 2)), revision, UNIQUE (matter_id, id), FKs per §1a)`; `filing_cycles (matter_id, filing_id, cycle_no, opened_in_epoch, kind, request_reference, owner_user_id, due_at, opened_at, closed_at, UNIQUE (filing_id, cycle_no), UNIQUE (matter_id, filing_id, cycle_no))`; `filing_stage_observations (matter_id, filing_id, proof_epoch, …)` (append-only) + `filing_observation_evidence (matter_id, observation_id, evidence_id)`; `filing_submissions (id, matter_id, filing_id, cycle_no, FK (matter_id, filing_id, cycle_no) → filing_cycles, UNIQUE (matter_id, id), submission_reference NOT NULL, submitted_at NOT NULL)`; `filing_submission_items (matter_id, submission_id, document_version_id, composite FKs, PRIMARY KEY (submission_id, document_version_id))`.
- `external_parties`, `entity_references`, `decisions`, `findings`, `risks` with typed columns; link tables `decision_subjects`, `finding_subjects`, `risk_subjects`, `entity_reference_links`, each with composite same-matter FKs.

~~~

## docs/architecture/filing-model.md:7-67

Full-file bytes 7652; SHA256 632f9c8670c98de2065f40a28ed34f31257c1615a1e73cfd25fcafc7a90c60dd. Exact excerpt:

~~~text
## 1. Model

MatterControl records accountable observations about a filing; it does not file anything (RULE-012).

| Record | Purpose |
|---|---|
| `Filing` | Matter, linked Requirement (the filing obligation), authority ExternalParty, owner, `stage`, `execution_state`, `proof_required` + verification (axis present only when proof required), `proof_epoch` + `proof_epoch_opened_at`, due, `negative_outcome` {REJECTED, WITHDRAWN} nullable with `negative_outcome_epoch` |
| Package criteria | Evidence Requirements with subject = Filing; components for each declared document and signature |
| `FilingCycle` | `cycle_no` 1 = initial; ≥2 = supplement cycles; `opened_in_epoch`; request reference, owner, due, opened/closed. Cycles count authority request rounds, epochs count reopenings; independent |
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

Execution coupling (same transaction as the stage observation): PACKAGE_PREPARATION → IN_PROGRESS; SIGNATURE may be WAITING on signatory; SUBMISSION IN_PROGRESS (submission is not completion); RECEIPT IN_PROGRESS/WAITING; AUTHORITY_REVIEW WAITING with an open `waiting_on` the authority party; SUPPLEMENT IN_PROGRESS; RESPONSE → AUTHORITY_REVIEW WAITING; APPROVAL → COMPLETED. If `proof_required`, verification stays UNVERIFIED until a designated verifier accepts the outcome proof under the filing's outcome criterion. If not, the verification axis does not apply to the Filing (state-semantics), the Approval guard below is the only proof condition, and sufficiency is reviewed under the linked Requirement's own criteria.

Guards evaluated under the matter lock:

- **Package complete** (Signature→Submission): every applicable mandatory package criterion of the filing is satisfied per evidence-model §4 (accepted by an independent verifier), or signature criteria were made non-applicable by an OWNER reasoned criteria revision. Missing signature → `guard-failed` listing criteria (AC-145).
- **Submission** needs reference, `submitted_at`, and exact version IDs, each AVAILABLE or external reference in the same matter. A `FilingSubmission` row is created; it is never updated.
- **Receipt** needs acknowledgement evidence; without it the filing stays at SUBMISSION, execution WAITING with reason "acknowledgement outstanding".
- **Approval** needs authority outcome evidence; receipt or submission never implies approval (AC-116). Referenced outcome evidence must be non-withdrawn, same matter and, when `proof_epoch > 0`, recorded at or after `proof_epoch_opened_at`. Approval is rejected while `negative_outcome_epoch = proof_epoch` (OWNER reopen first, AC-145).
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
| Change after approval | OWNER reopen | Prior submission/outcome preserved; effects below |

**Filing reopen effects** (OWNER, reason, `If-Match` filing revision, one transaction; RULE-004 on the Filing's execution axis):
- Execution COMPLETED/CANCELLED → IN_PROGRESS; `proof_epoch + 1`, `proof_epoch_opened_at = t_cmd`; emits `filing.reopened` and `subject.proof_epoch_advanced`.
- Every assessment of every criterion with this Filing as subject (package, signature, outcome) falls into an earlier epoch and stops counting. Verification becomes UNVERIFIED when proof is required; an explicit NOT_REQUIRED stays, per RULE-004. Later stage guards see only current-epoch assessments.
- Stage, cycles, submissions, observations and `negative_outcome` stay unchanged as history. Reopen opens no cycle and numbering continues.
- Approval then needs post-reopen outcome evidence (guard above). This reads AC-145's "new authority approval evidence" strictly as evidence recorded after the reopen; it is flagged as ARCH-Q5 and adds no business rule.
- Filing timing/attention are recomputed; the linked Requirement is untouched.

The linked Requirement is never auto-completed or auto-verified by filing approval; a human completes it and a verifier assesses its own criteria ("no magic verification").
~~~

## docs/architecture/api-contracts.md:60-66

Full-file bytes 25038; SHA256 49ec8aa506386df03c4995a53553d51dd615e1fd0e1fd02f4fd45d146d576e75. Exact excerpt:

~~~text
| Milestone prerequisite `PUT`/`:remove`, milestone `PATCH` | milestone revision | reason |
| `POST /matters/{m}/evidence-requirements` | none | `expectedRevisions{subjectId}` |
| `POST /evidence-requirements/{id}/revisions` | evidence-requirement revision | `expectedCurrentRevisionId`, `expectedRevisions{subjectId}` |
| `POST /evidence/{id}:withdraw` | evidence revision | reason |
| Assessment, assessment `:revoke`, dispute raise/resolve | revision of the claim concerned | `criterionRevisionId` current, `expectedSubjectEpoch`; assessment: `assessedDocumentVersionId` equals the evidence's version, absent for non-document evidence, else `422 validation` (evidence-model §2 rule 4). A claim has one criterion revision and hence one subject, so shared evidence never needs multi-subject CAS |
| `POST /documents/{id}:promote` | document revision | `expectedCurrentVersionId` |
| Filing observations, `:cancel`, `:reopen`, `/corrections` | filing revision | `expectedCycleNo` when a cycle is named |
~~~
