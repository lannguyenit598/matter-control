# Five State Dimensions — Business Semantics

Owner: Codex. Vocabulary/separation: APPROVED_INPUT. Applicability, transitions, guards and side effects below: **APPROVED_BY_PO**, 2026-10-24, under OBD-02/04/05/06/11 at `572835a`; [approval record](../ai-sdlc/step-01-approval.md). Not a storage/API design. Authoritative evaluation belongs to the system business rules; the frontend displays returned state/reasons and cannot independently establish verification/readiness.

## Applicability and defaults

| Axis | Applies to | Initial value / meaning | Does not apply as an independent mutable field |
|---|---|---|---|
| Execution | Requirement, Action, Filing | NOT_STARTED; progress asserted by accountable humans | Workspace, Document bytes, Dependency edge, Event History |
| Verification | Requirement, Evidence Requirement, supplied Evidence; Action/Filing if proof explicitly required | UNVERIFIED; NOT_REQUIRED only via explicit applicability decision, e.g. no-proof Action | Document current-version and signature completeness are separate observations |
| Dependency | Requirement, Action | READY when no unsatisfied incoming gates; BLOCKED otherwise | Filing is gated via linked Requirement/Action; Matter/Milestone show readiness summary |
| Timing | Requirement, Action, Filing | RULE-009 based on due/as-of; no due is visibly unassessed for schedule despite ON_TRACK | Milestone has due context/roll-up, not independent task execution |
| Attention | Requirement, Action, Filing | RULE-010 inputs; no hidden ranking | Matter/Milestone aggregate visible exceptions, never overwrite child states |

Membership is an access relationship, not a sixth workflow state. Decision/Finding/Risk lifecycle remains basic contextual records under RULE-020; no generic task conversion. Terminal execution does not erase unresolved verification or dependency problems.

## Execution transitions

All allowed changes need current revision, Matter EDITOR/OWNER, reason where specified, RULE-018/019 history. Assignee restrictions are not invented; any authorized EDITOR may edit work in their matter, with attribution.

| From | To allowed | Guard / actor / effect |
|---|---|---|
| NOT_STARTED | IN_PROGRESS | Prerequisites READY; actor starts work; audit execution change |
| NOT_STARTED | WAITING | Explicit waiting party/condition and responsible internal owner; dependency remains independently computed |
| NOT_STARTED | COMPLETED | Record already-performed work, reason and completion time; dependency READY; no automatic verification |
| IN_PROGRESS | WAITING | Waiting reason/party/condition; retain prior progress and due date |
| IN_PROGRESS | COMPLETED | Work/outcome completion attested; dependency READY; missing proof allowed and visibly UNVERIFIED |
| WAITING | IN_PROGRESS | Response/condition recorded and dependencies READY; clear current waiting reason, retain history |
| WAITING | COMPLETED | Completion attested, dependencies READY; resolve waiting relation with reason |
| NOT_STARTED / IN_PROGRESS / WAITING | CANCELLED | OWNER only, explicit reason; does not satisfy dependency/waive legal requirement |
| COMPLETED / CANCELLED | IN_PROGRESS | OWNER reopen with reason; no need to pretend prerequisites satisfied. Execution may be IN_PROGRESS+BLOCKED while remediation is pending; cannot complete again until READY. Reset current verification to UNVERIFIED unless explicitly NOT_REQUIRED, recompute dependents |

All unlisted direct transitions are rejected with allowed alternatives and no mutation. Same-state retry is a no-op; changing metadata is a separately audited operation. No direct terminal→NOT_STARTED or COMPLETED→CANCELLED erasure. IN_PROGRESS+BLOCKED and COMPLETED+BLOCKED can occur after upstream reversal; preserve truth/history and prohibit new completion while blocked. Filing also requires stage guards below; changing execution alone cannot claim authority Approval.

## Verification transitions and evaluation precedence

Evidence review verdict and subject aggregate are distinguished. Verifier commands act on exact evidence/version/criterion; aggregate subject status is derived, not editable by arbitrary dropdown.

| Current | Event / allowed next | Guard / effect |
|---|---|---|
| UNVERIFIED | PARTIALLY_VERIFIED / VERIFIED | Independent designated verifier accepts valid proof; some/all applicable criteria satisfied; single proof may move directly to VERIFIED |
| PARTIALLY_VERIFIED | VERIFIED / UNVERIFIED | Remaining proof accepted or last valid proof revoked/expired; recompute criteria |
| VERIFIED | PARTIALLY_VERIFIED / UNVERIFIED | Validity lost or explicit authorized reversal with reason; no deletion of prior review; recompute dependents |
| UNVERIFIED / PARTIALLY_VERIFIED / VERIFIED | DISPUTED | EDITOR/OWNER records challenge and reason on existing proof; immediately non-satisfying until designated verifier resolves |
| DISPUTED | UNVERIFIED / PARTIALLY_VERIFIED / VERIFIED | Designated independent verifier resolves with rationale, evaluating currently valid proof; no restore based only on previous status |
| UNVERIFIED | NOT_REQUIRED | OWNER applicability decision with reason, zero applicable mandatory criteria and no unresolved dispute; use the explicit criteria revision process below |
| NOT_REQUIRED | UNVERIFIED | OWNER adds applicable criterion/revokes exemption with reason; must undergo review before VERIFIED |

Applicability ordering: a proposed OWNER criteria/applicability revision must explicitly list affected criteria, business rationale and impact; it cannot resolve a dispute. Resolve any outstanding dispute through the designated verifier first. Accepting a justified criteria revision preserves historical criteria/reviews, recomputes current aggregate (zero criteria without exemption → UNVERIFIED), and only then may OWNER explicitly declare NOT_REQUIRED with a separate reasoned event. No direct VERIFIED/PARTIALLY_VERIFIED/DISPUTED→NOT_REQUIRED transition. Adding mandatory criteria to NOT_REQUIRED first revokes applicability to UNVERIFIED; normal proof review then determines partial/verified. This is a scoped condition-definition change, not an automatic waiver of a legal obligation; OBD-02/04 approval is recorded; future scope changes need their own approval.

Precedence for aggregation: unresolved applicable dispute → DISPUTED; explicit no-proof applicability → NOT_REQUIRED; all applicable mandatory criteria valid and accepted → VERIFIED; some → PARTIALLY_VERIFIED; none → UNVERIFIED. Zero unspecified criteria yields UNVERIFIED, not vacuous VERIFIED. A single criterion with multiple mandatory components can be partial. Rejection alone is not a dispute; expired proof cannot support VERIFIED even if a prior decision remains historically accepted. Reject self-verification, stale version review, invented evidence reference and unauthorized status changes. Review may precede execution completion (IN_PROGRESS+VERIFIED is legal as a combination); RULE-003 proof gate still requires completed execution.

## Derived dimensions

| Dimension | Allowed transitions | Trigger / guard / actor | Invalid transitions | Side effects / audit |
|---|---|---|---|---|
| Dependency READY / BLOCKED | Both directions when inputs change | Accepted edge/upstream state change; system evaluates RULE-003 recursively on acyclic graph | Manual force-READY, satisfaction from cancelled or disputed upstream | Return failed gate IDs/reasons; recompute affected milestone/attention; record causal input and derived change |
| Timing ON_TRACK / DUE_SOON / OVERDUE | Any direction justified by time, due edit, terminal/reopen | System uses explicit as-of, deadline and execution under RULE-009 | Client-supplied label inconsistent with inputs; date-only value guessed in local machine timezone | Retain before/after deadline and actual completion/lateness. Time-derived query result records as-of; material effective deadline/expiry transitions have attributable history, not an event on every refresh |
| Attention NORMAL / ATTENTION / CRITICAL | Any direction justified by evidence, blocker, due/waiting or explicit escalation | System RULE-010; OWNER can set/clear escalation with reason but cannot hide derived critical cause | Contributor force-NORMAL despite critical blocker; interpreting risk text as legal conclusion | Return reason list; escalation/reversal audit; show resolved cause history |

## Filing stage compatibility — RULE-012

Golden sequence remains Requirement → Package Preparation → Signature → Submission → Receipt → Authority Review → Supplement → Response → Approval. It is a target path; not every filing must need supplement.

| Stage transition | Required observation / evidence | Execution proposal |
|---|---|---|
| Requirement → Package Preparation | Filing scope and responsible owner, applicable package criteria | NOT_STARTED → IN_PROGRESS |
| Package Preparation → Signature | Required document versions identified, non-signature preparation complete | IN_PROGRESS; WAITING when signatory outstanding |
| Signature → Submission | All applicable signature/package criteria satisfied; submission reference/time and exact submitted versions | IN_PROGRESS; submission is not completion |
| Submission → Receipt | Actual acknowledgement reference/evidence | IN_PROGRESS or WAITING while awaiting acknowledgement |
| Receipt → Authority Review | Receipt retained, recorded awaiting authority outcome, external party identified | WAITING |
| Authority Review → Supplement | Authority request recorded, follow-up owner/due and new package cycle | IN_PROGRESS (or WAITING for missing external input) |
| Supplement → Response | Requested items satisfied, response evidence/reference and exact versions recorded | IN_PROGRESS |
| Response → Authority Review | Response submitted, awaiting next outcome | WAITING; repeat cycle retained |
| Authority Review / Response → Approval | Actual authority outcome proof recorded; verification separately reviewed | COMPLETED may remain UNVERIFIED until verifier accepts |

If signatures not applicable, OWNER records applicability reason before Signature→Submission; do not invent signatures. Rejection/withdrawal is an explicit outcome/reason (not Approval): close execution CANCELLED by OWNER, preserve rejection proof/history and linked Requirement unmet. Correction of erroneous stage appends an attributed correction; it must not fabricate missing events. Changes after final approval require OWNER reopen and preserve earlier submission/outcome. Repeating supplement cycles have distinct references; no overwriting the first request.

## Edge cases and verification

No auto-propagated completion between Action and Requirement. No auto-verified uploads/imports. No deletion of upstream node with live dependent links; remove/revise references explicitly with permission/reason. Unavailable evaluator must return unavailable/stale status, never READY by default. All cached/UI views identify the source revision/as-of and refresh on conflict.

AC-121..129 cover separation, blocker/unblock/reblock/cycle and proof validity; AC-141..146 cover readiness/time/attention/rejection/cancellation; AC-139 and AC-160 cover concurrent and all axis/filing forbidden transitions. Rules/AC remain conditional on PO decisions. Atlas at 20f12fe retains its original synthetic assumptions; it is not silently relabeled as a conformant implementation fixture.
