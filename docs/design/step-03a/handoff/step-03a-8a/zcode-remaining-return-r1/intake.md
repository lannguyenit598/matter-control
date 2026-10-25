# MC-003A.8A — ZCode remaining-items return intake

Actual human-returned F-08/F-10 document proposals received; this is not BE-01 source implementation. Current base 1c29ecb, original contract baseline 97356ce unchanged. Raw return retained losslessly; JSON delta parses with unique keys. No proposed row unit or route is adopted.

## Disposition

F-08 REWORK_REQUIRED. Its component-by-gap-code proposal is a semantic/metric choice, not the component-only alternative. It has concrete uncovered proof cases, contradicts implicit-null cardinality and its own example order, and reintroduces the withdrawn DISPUTED null-source map. No false-zero or new metric accepted.

F-10 DECISION_REQUIRED. The one-new-route/33-operation option is a disclosed residual-size-risk choice, not a bounded-payload resolution. One submission still has unbounded exact-version refs; a cycle still has unbounded evidence refs. Its constant-size-item rationale must be corrected before presenting a PO choice. The fast-track 35-operation fully paged-relations alternative is also only a proposal; current catalogue stays 32.

## Concrete corrections

**F08-COVERAGE** — REWORK_REQUIRED
The proposed six-code per-claim derivation is not total. Revoked accepted assessment, not-yet-valid proof and accepted-but-version-mismatched proof are not covered. Do not allow an unsatisfied applicable mandatory component to disappear or show a false zero.

**F08-NULL-SOURCE** — REWORK_REQUIRED
Section1.4 missing-section row and E5 incorrectly null DISPUTED when evidenceGaps fails. Accepted R2 derives DISPUTED from condition own-axis evaluation. If own evaluation succeeds with 2 disputed subjects, evidenceGaps failure gives EVIDENCE_GAP=null, DISPUTED=2, completeness=INCOMPLETE. Preserve the accepted R2 source map.

**F08-IMPLICIT** — REWORK_REQUIRED
A (revision,component,code) key permits multiple null-component rows for different codes, contradicting section1.4 implicit example/E3 no-two-null-rows wording. UNIQUE NULLS NOT DISTINCT is on (evidence_id,criterion_revision_id,component_key), not a one-claim/one-row limit per revision.

**F08-ORDER** — EXAMPLE_CORRECTION_REQUIRED
For the same component the declared vocabulary order puts PENDING_REVIEW before REJECTED, but section1.3 shows REJECTED first and E1 asserts exact order.

**F08-METRIC** — CANDIDATE_SEMANTIC_TRADEOFF_NOT_ADOPTED
The recommendation is component-by-gap-code, not one row per distinct component. A component can increase total more than once; component+code identity changes when the failure code changes. Disclose count/identity/consumer implications, compare the component-only blueprint alternative, and do not call this field-shape-only compatibility.

**F08-AXIS** — QUALIFIER_CORRECTION_REQUIRED
The derivation text says Requirements/Actions always have verification, but approved applicability makes Action verification conditional on proof_required. The later proof_required=false exclusion must govern; do not fabricate a verification axis.

**F10-BOUND** — DECISION_REQUIRED / NOT_A_BOUNDED_SOLUTION
The 33-operation option is a disclosed partial-pagination/risk-acceptance alternative. A page with just one submission can still carry arbitrary N submittedVersionRefs; a cycle item can still carry arbitrary receipt/outcome refs. limit<=200 limits row count, not nested array length or response bytes. The constant-size-item claim in section2.3 is false; no PO risk acceptance is recorded.

**F10-SHAPE** — EXAMPLE_AND_NULL_SEMANTICS_CORRECTION_REQUIRED
Cycle example dueAt is date-only while candidate responses require explicit instants/offsets. outcomeEvidenceRefs:null needs an explicit empty-versus-unavailable meaning; do not silently treat known empty as unknown.

**F10-AUTHORITY** — RATIONALE_CORRECTION_REQUIRED
Absence of a per-cycle UNIQUE means the current candidate schema permits multiple submissions. It does not by itself prove an approved RULE-012 requirement that every such resubmission/correction is legal or that a new domain bound is forbidden; any restriction remains a real model/policy decision.

**META-HASH** — REPORTED_DIGEST_MISMATCH
The printed follow-up SHA differs by one nibble. Codex reverified the intended current inputs; the reviewer must correct the printed value or provide bounded command evidence. This is not proof that wrong bytes were read, and not an independently attested reviewer execution.

**META-COUNT** — COUNT_CLARIFICATION
There are 21 content inputs (2+19) plus 3 manifests (1+2), hence 24 physical files. The report labels their sum as 21.

**META-ROLES** — PROVENANCE_AND_GATE_CORRECTION
a288b2d4 is the previous ZCode recheck; the underlying R2 unit definitions were Claude-authored, with the current proposal authored by ZCode. Historical Claude labels do not mandate a new Claude review after the direct human reroute. ZCode cannot independently approve its own new proposal. G4 is independent Design QA, distinct from the overall PO Architecture Approval Gate. F-05 is already accepted/materialized as a document candidate, while its implementation remains unverified.

These are targeted intake observations under the same two original finding IDs; no new product scope or full architecture review is requested. The self-contained ZCODE-CORRECTION-PROMPT.md can be sent to the same ZCode session for corrections; it contains the new feedback and reuses the existing 21 allowed content inputs, without adding an external-source packet or changing provider.

## Faster backend path

BE-01 Create/Get Requirement service + access/UoW/history/receipt foundation is independent of these two decisions. The received output does not include a BE-01 source diff, test results or implementation return; do not mark it executed. Use docs/implementation/handoffs/MC-BE-01-ZCODE-PROMPT.md for the separately defined local assignment. Do not wait for filing/Control Room decisions to do that approved slice once the human actually activates it.

Original 22 CT IDs/16+4+1+1 review inventory, eight QA dispositions and Q2/Q4/Q6/Q8 conditions remain; runtime NOT_RUN. Earlier nine reviewed-candidate corrections and document F-11 fixture remain intact. G5-A stands; G5-B FINDINGS_OPEN; G3 NOT_VERIFIED; G4 PENDING; G6 REWORK_REQUIRED; STEP03B NOT_AUTHORIZED. BE-01 is a separate bounded local activation, not full STEP03B approval.

Skipped: product/runtime/Go/PostgreSQL/build/DB/source edits and new provider/agent invocation. Risks: gap derivation/metric choice, nested-size acceptance/design and independent QA/PO gates remain.
