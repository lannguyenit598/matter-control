<!-- source docs/requirements/acceptance-criteria.md, lines 1-6 -->
# Acceptance Criteria

Owner: Codex. Status: APPROVED_BY_PO / NOT_RUN, 2026-10-24, subject `572835a`; [approval record](../ai-sdlc/step-01-approval.md). Linked policy and AC-137 protocol are approved; numeric workload/retention/RPO/RTO are deferred and other missing budgets retain validation/release gates. Historical “proposed” wording in scenarios denotes the reviewed candidate/protocol, now approved where covered by these decisions; it never denotes a measured result. Product tests will be authored by engineering/OpenCode later; these are executable-in-intent specifications, not test evidence.

ID convention: **AC-101..160** are requirement criteria. Existing Atlas **AC-01..12** are synthetic Action record IDs; historical task-local AC-1..7 remain scoped to their task files. No existing ID renamed. Normative default fixture unless a scenario overrides it: clock T0=2026-06-15T09:00:00+07:00, timezone Asia/Ho_Chi_Minh, workspace W1/matter M1, each existing record revision r1, accepted mutation produces next revision r2, OWNER U0, EDITOR/submitter U1, designated EDITOR verifier U2, VIEWER U3. All actors are active scoped members unless testing denial. Cross-workspace negative uses W2/M2 with no membership. Each test initializes/reset these synthetic records independently; due/expiry overrides and two-reader stale-revision cases are explicit. Every scenario uses this clock/timezone and revision seed unless stated otherwise. Fixtures must be adapted to approved rules; original Atlas self-review/gates are not silently approved.


<!-- source docs/requirements/acceptance-criteria.md, lines 7-15 -->
## AC-101 — Typed Requirement/Action

Trace: FR-001. Result: NOT_RUN.

- **Given** Matter M with Requirement R and two Actions A1/A2.
- **When** editor completes A1.
- **Then** R remains its prior execution/verification; A2 unchanged; separate type/identity and contribution links remain visible.
- **Evidence required:** before/after domain state and scoped response, actor/permission context, source revision/as-of, relevant history or explicit no-mutation check; screenshots alone do not prove guards.


<!-- source docs/requirements/acceptance-criteria.md, lines 25-33 -->
## AC-103 — Next Action selection and deterministic order

Trace: FR-003. Result: NOT_RUN.

- **Given** six authorized assigned eligible Actions: K2 and K1 critical-chain with equal due T0+24h; K3 critical-chain with no due; N2/N1 noncritical with equal due T0+1h; N3 noncritical with no due. IDs sort K1<K2<K3 and N1<N2<N3. Separate B is BLOCKED due earlier and W is WAITING. Default clock/revisions apply.
- **When** contributor requests next actions twice on the same snapshot.
- **Then** exact order is K1,K2,K3,N1,N2,N3; critical group first, due ascending within group, no-due last within group, stable ID tie-break. Each displays reason/owner; B/W excluded with reasons. If K1 becomes blocked at r2, stale candidate display identifies old revision and refresh excludes K1; completion using r1 is rejected.
- **Evidence required:** selected IDs/order/reasons, source revision/as-of, excluded causes and stale-command no-mutation assertion.


<!-- source docs/requirements/acceptance-criteria.md, lines 43-51 -->
## AC-105 — AND gate

Trace: FR-005. Result: NOT_RUN.

- **Given** target T has completion prerequisite A and proof prerequisite R.
- **When** A completes but R remains unverified.
- **Then** T stays BLOCKED with failed R gate; completion gate is explicitly distinguished from proof gate.
- **Evidence required:** before/after domain state and scoped response, actor/permission context, source revision/as-of, relevant history or explicit no-mutation check; screenshots alone do not prove guards.


<!-- source docs/requirements/acceptance-criteria.md, lines 61-69 -->
## AC-107 — Independent verification

Trace: FR-007. Result: NOT_RUN.

- **Given** valid proof E submitted by U1, U2 designated verifier, all required components present.
- **When** U2 accepts E against current criterion/version.
- **Then** record U2 verdict/reason/time; criterion VERIFIED; recompute subject and dependencies; no execution auto-completion.
- **Evidence required:** before/after domain state and scoped response, actor/permission context, source revision/as-of, relevant history or explicit no-mutation check; screenshots alone do not prove guards.


<!-- source docs/requirements/acceptance-criteria.md, lines 70-78 -->
## AC-108 — History provenance

Trace: FR-008. Result: NOT_RUN.

- **Given** authorized accepted due-date edit with prior/new value and reason.
- **When** manager opens history.
- **Then** one event exposes actor, target, before/after, effective/recorded time and correlation; correction appends instead of overwriting.
- **Evidence required:** before/after domain state and scoped response, actor/permission context, source revision/as-of, relevant history or explicit no-mutation check; screenshots alone do not prove guards.


<!-- source docs/requirements/acceptance-criteria.md, lines 79-87 -->
## AC-109 — Control Room consistency

Trace: FR-009. Result: NOT_RUN.

- **Given** authorized Atlas-derived snapshot and explicit as-of.
- **When** manager opens Control Room.
- **Then** state, blockers/why, next/owner, waiting, milestone, missing proof, decisions and changes match underlying authorized records at that boundary.
- **Evidence required:** before/after domain state and scoped response, actor/permission context, source revision/as-of, relevant history or explicit no-mutation check; screenshots alone do not prove guards.


<!-- source docs/requirements/acceptance-criteria.md, lines 133-141 -->
## AC-115 — Version authority

Trace: FR-015. Result: NOT_RUN.

- **Given** Document D has current v2 and uploaded v3.
- **When** editor uploads v3 then OWNER explicitly promotes with expected v2 and reason.
- **Then** upload alone leaves v2 current; promotion makes only v3 current and v2 superseded; references/history to v2 retained.
- **Evidence required:** before/after domain state and scoped response, actor/permission context, source revision/as-of, relevant history or explicit no-mutation check; screenshots alone do not prove guards.


<!-- source docs/requirements/acceptance-criteria.md, lines 142-150 -->
## AC-116 — Filing tracking

Trace: FR-016. Result: NOT_RUN.

- **Given** complete declared package and valid recorded submission.
- **When** editor records receipt then awaiting authority.
- **Then** submission and receipt references/version set retained; Filing WAITING at Authority Review; not Approval/VERIFIED merely from receipt.
- **Evidence required:** before/after domain state and scoped response, actor/permission context, source revision/as-of, relevant history or explicit no-mutation check; screenshots alone do not prove guards.


<!-- source docs/requirements/acceptance-criteria.md, lines 151-159 -->
## AC-117 — External context

Trace: FR-017. Result: NOT_RUN.

- **Given** external party E linked to matter M and waiting A.
- **When** editor updates E contact context.
- **Then** only M authorized users see update; history links E/A; no account or role automatically granted.
- **Evidence required:** before/after domain state and scoped response, actor/permission context, source revision/as-of, relevant history or explicit no-mutation check; screenshots alone do not prove guards.


<!-- source docs/requirements/acceptance-criteria.md, lines 160-168 -->
## AC-118 — Scoped membership

Trace: FR-018. Result: NOT_RUN.

- **Given** workspace member U without Matter M membership.
- **When** U requests M record/content/metadata/history/export.
- **Then** deny without revealing M existence/details; assignment or workspace OWNER alone does not bypass membership; no domain mutation.
- **Evidence required:** before/after domain state and scoped response, actor/permission context, source revision/as-of, relevant history or explicit no-mutation check; screenshots alone do not prove guards.


<!-- source docs/requirements/acceptance-criteria.md, lines 196-204 -->
## AC-122 — Blocked Requirement

Trace: FR-005, FR-020. Result: NOT_RUN.

- **Given** Requirement R2 requires R1 proof; R1 unverified.
- **When** editor tries to complete R2.
- **Then** reject completion with R1 gate reason; R2 remains previous execution and BLOCKED, with no success event.
- **Evidence required:** before/after domain state and scoped response, actor/permission context, source revision/as-of, relevant history or explicit no-mutation check; screenshots alone do not prove guards.


<!-- source docs/requirements/acceptance-criteria.md, lines 205-213 -->
## AC-123 — Upstream verification unlocks

Trace: FR-005, FR-007. Result: NOT_RUN.

- **Given** R1 completed/ready with unverified proof; R2 blocked by only proof gate.
- **When** independent verifier accepts all required valid proof for R1.
- **Then** R1 VERIFIED and R2 READY in consistent accepted snapshot; R2 execution unchanged; causal history traceable.
- **Evidence required:** before/after domain state and scoped response, actor/permission context, source revision/as-of, relevant history or explicit no-mutation check; screenshots alone do not prove guards.


<!-- source docs/requirements/acceptance-criteria.md, lines 214-222 -->
## AC-124 — Reopen re-blocks transitive work

Trace: FR-005, FR-007, FR-020. Result: NOT_RUN.

- **Given** R1 proof gate to completed A2; A2 completion gate to A3; all initially READY.
- **When** OWNER reopens R1 with reason.
- **Then** R1 IN_PROGRESS/UNVERIFIED; A2 and A3 BLOCKED by recursive readiness rule; A2 completion history retained; no false new completion.
- **Evidence required:** before/after domain state and scoped response, actor/permission context, source revision/as-of, relevant history or explicit no-mutation check; screenshots alone do not prove guards.


<!-- source docs/requirements/acceptance-criteria.md, lines 223-231 -->
## AC-125 — Cycle rejected

Trace: FR-005. Result: NOT_RUN.

- **Given** A→B and B→C already exist.
- **When** editor proposes C→A or self A→A.
- **Then** reject whole edge change and show authorized cycle reason; previous graph unchanged; concurrent cycle creation cannot both succeed.
- **Evidence required:** before/after domain state and scoped response, actor/permission context, source revision/as-of, relevant history or explicit no-mutation check; screenshots alone do not prove guards.


<!-- source docs/requirements/acceptance-criteria.md, lines 232-240 -->
## AC-126 — Rejected or expired evidence

Trace: FR-007. Result: NOT_RUN.

- **Given** criterion C supported by sole accepted E valid until instant t.
- **When** reviewer rejects/revokes E with reason OR clock reaches t.
- **Then** C loses satisfaction; subject UNVERIFIED unless other valid criteria support partial; dependencies re-block; old acceptance history remains; expiry cannot wait for screen visit.
- **Evidence required:** before/after domain state and scoped response, actor/permission context, source revision/as-of, relevant history or explicit no-mutation check; screenshots alone do not prove guards.


<!-- source docs/requirements/acceptance-criteria.md, lines 241-249 -->
## AC-127 — Missing mandatory evidence

Trace: FR-006, FR-007. Result: NOT_RUN.

- **Given** C1 accepted, C2 missing, both mandatory.
- **When** verifier attempts to mark subject VERIFIED.
- **Then** reject direct aggregate override; aggregate PARTIALLY_VERIFIED; C2 shown missing; attachment count never substitutes for C2.
- **Evidence required:** before/after domain state and scoped response, actor/permission context, source revision/as-of, relevant history or explicit no-mutation check; screenshots alone do not prove guards.


<!-- source docs/requirements/acceptance-criteria.md, lines 250-258 -->
## AC-128 — Superseded document

Trace: FR-007, FR-015. Result: NOT_RUN.

- **Given** E1 criterion requires current D version; E2 criterion explicitly fixed to v2; both accepted on v2.
- **When** OWNER promotes D v3.
- **Then** E1 current satisfaction invalidated pending review of v3; E2 remains valid unless separately revoked; previous decisions and exact v2 refs preserved.
- **Evidence required:** before/after domain state and scoped response, actor/permission context, source revision/as-of, relevant history or explicit no-mutation check; screenshots alone do not prove guards.


<!-- source docs/requirements/acceptance-criteria.md, lines 259-267 -->
## AC-129 — Supplement cycle

Trace: FR-016. Result: NOT_RUN.

- **Given** filing waiting at Authority Review with receipt for package v2.
- **When** editor records authority supplement request then response using v3.
- **Then** new request/cycle has owner/due/evidence; original v2 submission retained; response returns to Authority Review waiting; no automatic Approval.
- **Evidence required:** before/after domain state and scoped response, actor/permission context, source revision/as-of, relevant history or explicit no-mutation check; screenshots alone do not prove guards.


<!-- source docs/requirements/acceptance-criteria.md, lines 268-276 -->
## AC-130 — External Waiting On

Trace: FR-004, FR-017. Result: NOT_RUN.

- **Given** A waits for E with no blocking graph edges.
- **When** editor records E response.
- **Then** waiting relation resolves with reference; user explicitly resumes/completes per guard; no automatic proof acceptance; Dependency remains independently READY.
- **Evidence required:** before/after domain state and scoped response, actor/permission context, source revision/as-of, relevant history or explicit no-mutation check; screenshots alone do not prove guards.


<!-- source docs/requirements/acceptance-criteria.md, lines 304-312 -->
## AC-134 — Viewer write denied

Trace: FR-018. Result: NOT_RUN.

- **Given** VIEWER with read access to M.
- **When** attempt inline/state/evidence review/bulk/import/membership mutation including direct calls.
- **Then** all denied; data/revisions unchanged and no successful domain history; button hiding alone is insufficient evidence.
- **Evidence required:** before/after domain state and scoped response, actor/permission context, source revision/as-of, relevant history or explicit no-mutation check; screenshots alone do not prove guards.


<!-- source docs/requirements/acceptance-criteria.md, lines 313-321 -->
## AC-135 — Cross-workspace attempt

Trace: FR-018. Result: NOT_RUN.

- **Given** member of workspace A knows or guesses IDs from workspace B.
- **When** tries direct and nested relation read/write/search/export/file/history/count access.
- **Then** no B data, existence or metadata disclosed; mutation rejected; restricted denial audit recorded.
- **Evidence required:** before/after domain state and scoped response, actor/permission context, source revision/as-of, relevant history or explicit no-mutation check; screenshots alone do not prove guards.


<!-- source docs/requirements/acceptance-criteria.md, lines 322-330 -->
## AC-136 — Correct audit

Trace: FR-008. Result: NOT_RUN.

- **Given** accepted correction to prior execution assertion; original effective time differs from correction recorded time.
- **When** authorized reviewer opens history and brief.
- **Then** both original and correction retained and linked, actor/reason/times distinguishable; no overwrite or reordering that presents correction as original fact.
- **Evidence required:** before/after domain state and scoped response, actor/permission context, source revision/as-of, relevant history or explicit no-mutation check; screenshots alone do not prove guards.


<!-- source docs/requirements/acceptance-criteria.md, lines 340-354 -->
## AC-138 — Report window variants

Trace: FR-019. Result: NOT_RUN. Variants below are independently initialized cases under this stable AC ID.

- **Given** nonempty boundary case t1<T0=t2, events E1 exactly t1 and E2 exactly t2, one pre-existing outstanding blocker and one inaccessible event.
- **When** authorized manager generates the scoped draft.
- **Then** E1 excluded, E2 included, outstanding blocker separate; inaccessible event omitted without leaked count.
- **Given** empty-window case t1=t2=T0 with an event exactly T0 and outstanding blocker.
- **When** manager generates that window.
- **Then** changes empty and explicit “no changes”; event at T0 is excluded because (T0,T0] is empty; outstanding blocker still separate.
- **Given** t1<t2 with no in-window events, or invalid t1>t2 in a separate case.
- **When** manager generates each draft.
- **Then** first returns explicit no changes plus outstanding; second rejects invalid window without a misleading report.
- **Evidence required:** exact endpoints/event timestamps, scoped source references and no unauthorized metadata.


<!-- source docs/requirements/acceptance-criteria.md, lines 364-372 -->
## AC-140 — Verifier permissions

Trace: FR-007, FR-018. Result: NOT_RUN.

- **Given** submitter U1 is also OWNER/designated verifier; U2 EDITOR but not designated.
- **When** U1 self-verifies or U2 verifies without designation.
- **Then** deny both; designated non-submitter U3 can verify valid proof; one-member matter remains pending rather than bypassing separation.
- **Evidence required:** before/after domain state and scoped response, actor/permission context, source revision/as-of, relevant history or explicit no-mutation check; screenshots alone do not prove guards.


<!-- source docs/requirements/acceptance-criteria.md, lines 400-408 -->
## AC-144 — No actionable work

Trace: FR-003, FR-010. Result: NOT_RUN.

- **Given** own actions all waiting/blocked/unassigned to current user or inaccessible.
- **When** user opens Next Action and My Actions.
- **Then** no invented recommendation; explain visible waiting/blocker causes without leaking inaccessible records; follow-up must be explicit separate actionable work.
- **Evidence required:** before/after domain state and scoped response, actor/permission context, source revision/as-of, relevant history or explicit no-mutation check; screenshots alone do not prove guards.


<!-- source docs/requirements/acceptance-criteria.md, lines 409-423 -->
## AC-145 — Filing negative paths

Trace: FR-016. Result: NOT_RUN. Run each variant with its own initial state.

- **Given** package at Signature lacks one mandatory signature.
- **When** EDITOR tries to record Submission.
- **Then** reject missing criterion, stage/execution unchanged, no submission success event.
- **Given** a submitted/acknowledged filing in Authority Review receives actual rejection evidence.
- **When** EDITOR records the negative observation and OWNER closes it with cancellation/reason.
- **Then** rejection proof and prior receipt retained, execution CANCELLED, linked Requirement remains unmet, history attributes both observations/actions; never stage Approval.
- **Given** the rejected filing is CANCELLED with that negative outcome.
- **When** EDITOR attempts Approval without OWNER reopen and actual new authority approval proof.
- **Then** reject stage/authority guard, no mutation or false success history.
- **Evidence required:** each branch before/after, exact proof, actor, stage and linked requirement state.


<!-- source docs/requirements/acceptance-criteria.md, lines 424-432 -->
## AC-146 — Cancellation and waiver

Trace: FR-005, FR-020. Result: NOT_RUN.

- **Given** upstream R prerequisite to A.
- **When** OWNER cancels R or attempts waiver by relabeling cancelled as completed.
- **Then** R cancellation recorded with reason, A stays BLOCKED; no automatic legal waiver; prerequisite removal requires separate authorized scope-change reason.
- **Evidence required:** before/after domain state and scoped response, actor/permission context, source revision/as-of, relevant history or explicit no-mutation check; screenshots alone do not prove guards.


<!-- source docs/requirements/acceptance-criteria.md, lines 433-441 -->
## AC-147 — Revoked access

Trace: FR-010, FR-014, FR-018. Result: NOT_RUN.

- **Given** member previews records/export and then membership revoked before delivery/write.
- **When** member fetches export/file/search/history or confirms change.
- **Then** deny all current access including cached URLs; no leaked payload/count; pending write unchanged; active remaining owner can see unassigned-work exception.
- **Evidence required:** before/after domain state and scoped response, actor/permission context, source revision/as-of, relevant history or explicit no-mutation check; screenshots alone do not prove guards.


<!-- source docs/requirements/acceptance-criteria.md, lines 451-459 -->
## AC-149 — History integrity

Trace: FR-008, FR-018. Result: NOT_RUN.

- **Given** OWNER/EDITOR/VIEWER attempt direct modification/deletion of past audit event.
- **When** request is processed.
- **Then** deny mutation for every role; corrective domain operation appends linked history; retention workflow cannot be improvised as generic delete.
- **Evidence required:** before/after domain state and scoped response, actor/permission context, source revision/as-of, relevant history or explicit no-mutation check; screenshots alone do not prove guards.


<!-- source docs/requirements/acceptance-criteria.md, lines 487-495 -->
## AC-153 — Failure consistency

Trace: FR-008, FR-012. Result: NOT_RUN.

- **Given** mutation encounters history-write failure or client disconnects after unknown commit outcome.
- **When** client retries/reconciles same operation.
- **Then** no successful mutation without associated history; prior committed result returned once or explicit unresolved status; no duplicate effects or false success.
- **Evidence required:** before/after domain state and scoped response, actor/permission context, source revision/as-of, relevant history or explicit no-mutation check; screenshots alone do not prove guards.


<!-- source docs/requirements/acceptance-criteria.md, lines 514-522 -->
## AC-156 — Unavailable vs empty

Trace: FR-009, FR-011. Result: NOT_RUN.

- **Given** data source error, partial load, or stale summary vs genuinely zero visible records.
- **When** user opens view or retries.
- **Then** error/loading/stale/empty distinguishable; no false zero blockers or overwritten draft; safe retry and permission-appropriate detail shown.
- **Evidence required:** before/after domain state and scoped response, actor/permission context, source revision/as-of, relevant history or explicit no-mutation check; screenshots alone do not prove guards.


<!-- source docs/requirements/acceptance-criteria.md, lines 541-549 -->
## AC-159 — Basic domain context

Trace: FR-001. Result: NOT_RUN.

- **Given** GW-02 finding linked to R and follow-up, open decision, risk and Entity reference.
- **When** editor records resolution proof/decision outcome and views context.
- **Then** typed distinctions and history preserved; finding is not treated as probability risk, Entity not automatically user/party; no advanced P1 engine required.
- **Evidence required:** before/after domain state and scoped response, actor/permission context, source revision/as-of, relevant history or explicit no-mutation check; screenshots alone do not prove guards.
