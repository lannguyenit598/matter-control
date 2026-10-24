# Acceptance Criteria

Owner: Codex. Status: DRAFT_FOR_PO_APPROVAL / NOT_RUN. All Given/When/Then expected outcomes are conditional on proposed RULE/OBD approval where applicable. Product tests will be authored by engineering/OpenCode later; these are executable-in-intent specifications, not test evidence.

ID convention: **AC-101..160** are requirement criteria. Existing Atlas **AC-01..12** are synthetic Action record IDs; historical task-local AC-1..7 remain scoped to their task files. No existing ID renamed. Normative default fixture unless a scenario overrides it: clock T0=2026-06-15T09:00:00+07:00, timezone Asia/Ho_Chi_Minh, workspace W1/matter M1, each existing record revision r1, accepted mutation produces next revision r2, OWNER U0, EDITOR/submitter U1, designated EDITOR verifier U2, VIEWER U3. All actors are active scoped members unless testing denial. Cross-workspace negative uses W2/M2 with no membership. Each test initializes/reset these synthetic records independently; due/expiry overrides and two-reader stale-revision cases are explicit. Every scenario uses this clock/timezone and revision seed unless stated otherwise. Fixtures must be adapted to approved rules; original Atlas self-review/gates are not silently approved.

## AC-101 — Typed Requirement/Action

Trace: FR-001. Result: NOT_RUN.

- **Given** Matter M with Requirement R and two Actions A1/A2.
- **When** editor completes A1.
- **Then** R remains its prior execution/verification; A2 unchanged; separate type/identity and contribution links remain visible.
- **Evidence required:** before/after domain state and scoped response, actor/permission context, source revision/as-of, relevant history or explicit no-mutation check; screenshots alone do not prove guards.

## AC-102 — Milestone readiness

Trace: FR-002. Result: NOT_RUN.

- **Given** milestone has R1 completed/verified/ready and R2 completed/unverified.
- **When** manager views readiness.
- **Then** not ready; display 1/2 satisfied and R2 proof reason; no completion percentage implies readiness.
- **Evidence required:** before/after domain state and scoped response, actor/permission context, source revision/as-of, relevant history or explicit no-mutation check; screenshots alone do not prove guards.

## AC-103 — Next Action selection and deterministic order

Trace: FR-003. Result: NOT_RUN.

- **Given** six authorized assigned eligible Actions: K2 and K1 critical-chain with equal due T0+24h; K3 critical-chain with no due; N2/N1 noncritical with equal due T0+1h; N3 noncritical with no due. IDs sort K1<K2<K3 and N1<N2<N3. Separate B is BLOCKED due earlier and W is WAITING. Default clock/revisions apply.
- **When** contributor requests next actions twice on the same snapshot.
- **Then** exact order is K1,K2,K3,N1,N2,N3; critical group first, due ascending within group, no-due last within group, stable ID tie-break. Each displays reason/owner; B/W excluded with reasons. If K1 becomes blocked at r2, stale candidate display identifies old revision and refresh excludes K1; completion using r1 is rejected.
- **Evidence required:** selected IDs/order/reasons, source revision/as-of, excluded causes and stale-command no-mutation assertion.

## AC-104 — Waiting On

Trace: FR-004. Result: NOT_RUN.

- **Given** action A has no prerequisites and waits for external party E.
- **When** editor records waiting reason and follow-up owner.
- **Then** Execution WAITING, Dependency READY; E and accountable owner shown independently.
- **Evidence required:** before/after domain state and scoped response, actor/permission context, source revision/as-of, relevant history or explicit no-mutation check; screenshots alone do not prove guards.

## AC-105 — AND gate

Trace: FR-005. Result: NOT_RUN.

- **Given** target T has completion prerequisite A and proof prerequisite R.
- **When** A completes but R remains unverified.
- **Then** T stays BLOCKED with failed R gate; completion gate is explicitly distinguished from proof gate.
- **Evidence required:** before/after domain state and scoped response, actor/permission context, source revision/as-of, relevant history or explicit no-mutation check; screenshots alone do not prove guards.

## AC-106 — Criterion distinct from proof

Trace: FR-006. Result: NOT_RUN.

- **Given** R completed with mandatory criterion C and no evidence.
- **When** reviewer opens proof checklist.
- **Then** C exists as missing; R UNVERIFIED; no evidence record fabricated to satisfy criterion.
- **Evidence required:** before/after domain state and scoped response, actor/permission context, source revision/as-of, relevant history or explicit no-mutation check; screenshots alone do not prove guards.

## AC-107 — Independent verification

Trace: FR-007. Result: NOT_RUN.

- **Given** valid proof E submitted by U1, U2 designated verifier, all required components present.
- **When** U2 accepts E against current criterion/version.
- **Then** record U2 verdict/reason/time; criterion VERIFIED; recompute subject and dependencies; no execution auto-completion.
- **Evidence required:** before/after domain state and scoped response, actor/permission context, source revision/as-of, relevant history or explicit no-mutation check; screenshots alone do not prove guards.

## AC-108 — History provenance

Trace: FR-008. Result: NOT_RUN.

- **Given** authorized accepted due-date edit with prior/new value and reason.
- **When** manager opens history.
- **Then** one event exposes actor, target, before/after, effective/recorded time and correlation; correction appends instead of overwriting.
- **Evidence required:** before/after domain state and scoped response, actor/permission context, source revision/as-of, relevant history or explicit no-mutation check; screenshots alone do not prove guards.

## AC-109 — Control Room consistency

Trace: FR-009. Result: NOT_RUN.

- **Given** authorized Atlas-derived snapshot and explicit as-of.
- **When** manager opens Control Room.
- **Then** state, blockers/why, next/owner, waiting, milestone, missing proof, decisions and changes match underlying authorized records at that boundary.
- **Evidence required:** before/after domain state and scoped response, actor/permission context, source revision/as-of, relevant history or explicit no-mutation check; screenshots alone do not prove guards.

## AC-110 — My Actions

Trace: FR-010. Result: NOT_RUN.

- **Given** U1/U2 assigned distinct scoped actions; U1 has no access to matter X.
- **When** U1 opens My Actions.
- **Then** only U1 assigned actions in granted matters shown; X not leaked via counts; waiting/blocked distinguished.
- **Evidence required:** before/after domain state and scoped response, actor/permission context, source revision/as-of, relevant history or explicit no-mutation check; screenshots alone do not prove guards.

## AC-111 — Inline grid

Trace: FR-011. Result: NOT_RUN.

- **Given** 50 and 200-row fixtures with stable IDs, current revisions and typed fields.
- **When** editor filters, keyboard-navigates, edits one permitted field and saves.
- **Then** focus/selection remains attributable to row ID; save result shown; forbidden computed-state field not editable; failed save keeps draft.
- **Evidence required:** before/after domain state and scoped response, actor/permission context, source revision/as-of, relevant history or explicit no-mutation check; screenshots alone do not prove guards.

## AC-112 — Bulk preview

Trace: FR-012. Result: NOT_RUN.

- **Given** three selected permitted records and due-date patch.
- **When** editor previews then confirms.
- **Then** preview lists exactly three IDs and changes; successful rows have single correlated mutation/event; unselected records unchanged.
- **Evidence required:** before/after domain state and scoped response, actor/permission context, source revision/as-of, relevant history or explicit no-mutation check; screenshots alone do not prove guards.

## AC-113 — Typed import

Trace: FR-013. Result: NOT_RUN.

- **Given** CSV/Excel preview with distinct Requirement and Action rows and same-matter references.
- **When** editor confirms valid connected group.
- **Then** typed records and links created with source row mapping; imported VERIFIED claim becomes reviewable claim, not actual VERIFIED.
- **Evidence required:** before/after domain state and scoped response, actor/permission context, source revision/as-of, relevant history or explicit no-mutation check; screenshots alone do not prove guards.

## AC-114 — Useful export

Trace: FR-014. Result: NOT_RUN.

- **Given** authorized filtered records with five axes and document references.
- **When** viewer exports Excel.
- **Then** export includes only scoped selected columns/rows, explicit as-of/timezone and distinct state labels; cannot imply missing verification passed.
- **Evidence required:** before/after domain state and scoped response, actor/permission context, source revision/as-of, relevant history or explicit no-mutation check; screenshots alone do not prove guards.

## AC-115 — Version authority

Trace: FR-015. Result: NOT_RUN.

- **Given** Document D has current v2 and uploaded v3.
- **When** editor uploads v3 then OWNER explicitly promotes with expected v2 and reason.
- **Then** upload alone leaves v2 current; promotion makes only v3 current and v2 superseded; references/history to v2 retained.
- **Evidence required:** before/after domain state and scoped response, actor/permission context, source revision/as-of, relevant history or explicit no-mutation check; screenshots alone do not prove guards.

## AC-116 — Filing tracking

Trace: FR-016. Result: NOT_RUN.

- **Given** complete declared package and valid recorded submission.
- **When** editor records receipt then awaiting authority.
- **Then** submission and receipt references/version set retained; Filing WAITING at Authority Review; not Approval/VERIFIED merely from receipt.
- **Evidence required:** before/after domain state and scoped response, actor/permission context, source revision/as-of, relevant history or explicit no-mutation check; screenshots alone do not prove guards.

## AC-117 — External context

Trace: FR-017. Result: NOT_RUN.

- **Given** external party E linked to matter M and waiting A.
- **When** editor updates E contact context.
- **Then** only M authorized users see update; history links E/A; no account or role automatically granted.
- **Evidence required:** before/after domain state and scoped response, actor/permission context, source revision/as-of, relevant history or explicit no-mutation check; screenshots alone do not prove guards.

## AC-118 — Scoped membership

Trace: FR-018. Result: NOT_RUN.

- **Given** workspace member U without Matter M membership.
- **When** U requests M record/content/metadata/history/export.
- **Then** deny without revealing M existence/details; assignment or workspace OWNER alone does not bypass membership; no domain mutation.
- **Evidence required:** before/after domain state and scoped response, actor/permission context, source revision/as-of, relevant history or explicit no-mutation check; screenshots alone do not prove guards.

## AC-119 — Delta brief

Trace: FR-019. Result: NOT_RUN.

- **Given** t1/t2 scoped revisions with new review and pre-existing unresolved blocker.
- **When** manager generates draft twice against same authorized inputs.
- **Then** same business facts/order/provenance; review appears in changes, old blocker in outstanding; title explicitly draft.
- **Evidence required:** before/after domain state and scoped response, actor/permission context, source revision/as-of, relevant history or explicit no-mutation check; screenshots alone do not prove guards.

## AC-120 — Independent axes

Trace: FR-020. Result: NOT_RUN.

- **Given** R completed/unverified/ready and A waiting/blocked at same instant.
- **When** user views Grid and Control Room.
- **Then** each dimension and reason preserved; no single success status hides proof/dependency/time/attention.
- **Evidence required:** before/after domain state and scoped response, actor/permission context, source revision/as-of, relevant history or explicit no-mutation check; screenshots alone do not prove guards.

## AC-121 — Completed but Unverified

Trace: FR-001, FR-007, FR-020. Result: NOT_RUN.

- **Given** R has all work attested but mandatory proof missing; dependency READY.
- **When** authorized editor marks execution COMPLETED.
- **Then** execution changes only; verification UNVERIFIED and evidence gap visible; no proof prerequisite satisfied.
- **Evidence required:** before/after domain state and scoped response, actor/permission context, source revision/as-of, relevant history or explicit no-mutation check; screenshots alone do not prove guards.

## AC-122 — Blocked Requirement

Trace: FR-005, FR-020. Result: NOT_RUN.

- **Given** Requirement R2 requires R1 proof; R1 unverified.
- **When** editor tries to complete R2.
- **Then** reject completion with R1 gate reason; R2 remains previous execution and BLOCKED, with no success event.
- **Evidence required:** before/after domain state and scoped response, actor/permission context, source revision/as-of, relevant history or explicit no-mutation check; screenshots alone do not prove guards.

## AC-123 — Upstream verification unlocks

Trace: FR-005, FR-007. Result: NOT_RUN.

- **Given** R1 completed/ready with unverified proof; R2 blocked by only proof gate.
- **When** independent verifier accepts all required valid proof for R1.
- **Then** R1 VERIFIED and R2 READY in consistent accepted snapshot; R2 execution unchanged; causal history traceable.
- **Evidence required:** before/after domain state and scoped response, actor/permission context, source revision/as-of, relevant history or explicit no-mutation check; screenshots alone do not prove guards.

## AC-124 — Reopen re-blocks transitive work

Trace: FR-005, FR-007, FR-020. Result: NOT_RUN.

- **Given** R1 proof gate to completed A2; A2 completion gate to A3; all initially READY.
- **When** OWNER reopens R1 with reason.
- **Then** R1 IN_PROGRESS/UNVERIFIED; A2 and A3 BLOCKED by recursive readiness rule; A2 completion history retained; no false new completion.
- **Evidence required:** before/after domain state and scoped response, actor/permission context, source revision/as-of, relevant history or explicit no-mutation check; screenshots alone do not prove guards.

## AC-125 — Cycle rejected

Trace: FR-005. Result: NOT_RUN.

- **Given** A→B and B→C already exist.
- **When** editor proposes C→A or self A→A.
- **Then** reject whole edge change and show authorized cycle reason; previous graph unchanged; concurrent cycle creation cannot both succeed.
- **Evidence required:** before/after domain state and scoped response, actor/permission context, source revision/as-of, relevant history or explicit no-mutation check; screenshots alone do not prove guards.

## AC-126 — Rejected or expired evidence

Trace: FR-007. Result: NOT_RUN.

- **Given** criterion C supported by sole accepted E valid until instant t.
- **When** reviewer rejects/revokes E with reason OR clock reaches t.
- **Then** C loses satisfaction; subject UNVERIFIED unless other valid criteria support partial; dependencies re-block; old acceptance history remains; expiry cannot wait for screen visit.
- **Evidence required:** before/after domain state and scoped response, actor/permission context, source revision/as-of, relevant history or explicit no-mutation check; screenshots alone do not prove guards.

## AC-127 — Missing mandatory evidence

Trace: FR-006, FR-007. Result: NOT_RUN.

- **Given** C1 accepted, C2 missing, both mandatory.
- **When** verifier attempts to mark subject VERIFIED.
- **Then** reject direct aggregate override; aggregate PARTIALLY_VERIFIED; C2 shown missing; attachment count never substitutes for C2.
- **Evidence required:** before/after domain state and scoped response, actor/permission context, source revision/as-of, relevant history or explicit no-mutation check; screenshots alone do not prove guards.

## AC-128 — Superseded document

Trace: FR-007, FR-015. Result: NOT_RUN.

- **Given** E1 criterion requires current D version; E2 criterion explicitly fixed to v2; both accepted on v2.
- **When** OWNER promotes D v3.
- **Then** E1 current satisfaction invalidated pending review of v3; E2 remains valid unless separately revoked; previous decisions and exact v2 refs preserved.
- **Evidence required:** before/after domain state and scoped response, actor/permission context, source revision/as-of, relevant history or explicit no-mutation check; screenshots alone do not prove guards.

## AC-129 — Supplement cycle

Trace: FR-016. Result: NOT_RUN.

- **Given** filing waiting at Authority Review with receipt for package v2.
- **When** editor records authority supplement request then response using v3.
- **Then** new request/cycle has owner/due/evidence; original v2 submission retained; response returns to Authority Review waiting; no automatic Approval.
- **Evidence required:** before/after domain state and scoped response, actor/permission context, source revision/as-of, relevant history or explicit no-mutation check; screenshots alone do not prove guards.

## AC-130 — External Waiting On

Trace: FR-004, FR-017. Result: NOT_RUN.

- **Given** A waits for E with no blocking graph edges.
- **When** editor records E response.
- **Then** waiting relation resolves with reference; user explicitly resumes/completes per guard; no automatic proof acceptance; Dependency remains independently READY.
- **Evidence required:** before/after domain state and scoped response, actor/permission context, source revision/as-of, relevant history or explicit no-mutation check; screenshots alone do not prove guards.

## AC-131 — Invalid import rows

Trace: FR-013. Result: NOT_RUN.

- **Given** preview has valid disconnected R1, bad date R2 and Action A2 linked to R2.
- **When** editor confirms valid groups.
- **Then** R1 may succeed; R2/A2 connected group rejected with row/field causes; no orphan link or partial invalid group; preview itself made zero mutations.
- **Evidence required:** before/after domain state and scoped response, actor/permission context, source revision/as-of, relevant history or explicit no-mutation check; screenshots alone do not prove guards.

## AC-132 — Safe import retry

Trace: FR-013. Result: NOT_RUN.

- **Given** source S row key K/content C already successfully imported.
- **When** same import is retried; then K with changed content C2 is submitted.
- **Then** same payload returns existing outcome without extra record/event; changed payload returns conflict and requires explicit reconciliation; duplicate keys within preview flagged.
- **Evidence required:** before/after domain state and scoped response, actor/permission context, source revision/as-of, relevant history or explicit no-mutation check; screenshots alone do not prove guards.

## AC-133 — Bulk partial failure

Trace: FR-012. Result: NOT_RUN.

- **Given** three previewed rows; one becomes stale and one loses permission before commit.
- **When** editor confirms patch.
- **Then** only current authorized row changes; other two unchanged with separate scoped reasons; summary reports 1 success/2 failures and retry excludes success.
- **Evidence required:** before/after domain state and scoped response, actor/permission context, source revision/as-of, relevant history or explicit no-mutation check; screenshots alone do not prove guards.

## AC-134 — Viewer write denied

Trace: FR-018. Result: NOT_RUN.

- **Given** VIEWER with read access to M.
- **When** attempt inline/state/evidence review/bulk/import/membership mutation including direct calls.
- **Then** all denied; data/revisions unchanged and no successful domain history; button hiding alone is insufficient evidence.
- **Evidence required:** before/after domain state and scoped response, actor/permission context, source revision/as-of, relevant history or explicit no-mutation check; screenshots alone do not prove guards.

## AC-135 — Cross-workspace attempt

Trace: FR-018. Result: NOT_RUN.

- **Given** member of workspace A knows or guesses IDs from workspace B.
- **When** tries direct and nested relation read/write/search/export/file/history/count access.
- **Then** no B data, existence or metadata disclosed; mutation rejected; restricted denial audit recorded.
- **Evidence required:** before/after domain state and scoped response, actor/permission context, source revision/as-of, relevant history or explicit no-mutation check; screenshots alone do not prove guards.

## AC-136 — Correct audit

Trace: FR-008. Result: NOT_RUN.

- **Given** accepted correction to prior execution assertion; original effective time differs from correction recorded time.
- **When** authorized reviewer opens history and brief.
- **Then** both original and correction retained and linked, actor/reason/times distinguishable; no overwrite or reordering that presents correction as original fact.
- **Evidence required:** before/after domain state and scoped response, actor/permission context, source revision/as-of, relevant history or explicit no-mutation check; screenshots alone do not prove guards.

## AC-137 — Manager comprehension target

Trace: FR-009. Result: NOT_RUN.

- **Given** 5 proposed representative managers, unseen 50-row synthetic matter, two counterbalanced scenarios, pre-recorded answer key; no hints.
- **When** each sees Control Room and identifies major state, top blocker and next owner/action.
- **Then** record each elapsed time and accuracy; proposed pass ≥4/5 each within 10 seconds with all three answers correct; PO validates sample/pass threshold before claiming usability success.
- **Evidence required:** before/after domain state and scoped response, actor/permission context, source revision/as-of, relevant history or explicit no-mutation check; screenshots alone do not prove guards.

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

## AC-139 — Concurrent state change

Trace: FR-011, FR-012, FR-020. Result: NOT_RUN.

- **Given** two users read revision r, one changes dependency/permission or same field and commits r+1.
- **When** second submits stale command based on r.
- **Then** reject/reconcile conflict; no lost update or stale READY completion; accepted change/history exactly once; consistent result across Grid and Control Room.
- **Evidence required:** before/after domain state and scoped response, actor/permission context, source revision/as-of, relevant history or explicit no-mutation check; screenshots alone do not prove guards.

## AC-140 — Verifier permissions

Trace: FR-007, FR-018. Result: NOT_RUN.

- **Given** submitter U1 is also OWNER/designated verifier; U2 EDITOR but not designated.
- **When** U1 self-verifies or U2 verifies without designation.
- **Then** deny both; designated non-submitter U3 can verify valid proof; one-member matter remains pending rather than bypassing separation.
- **Evidence required:** before/after domain state and scoped response, actor/permission context, source revision/as-of, relevant history or explicit no-mutation check; screenshots alone do not prove guards.

## AC-141 — Readiness edge cases

Trace: FR-002. Result: NOT_RUN.

- **Given** milestone no prerequisites; then two required R with one cancelled or disputed.
- **When** manager evaluates readiness.
- **Then** first unassessed; second not ready with explicit failed reason; cancellation/waiver label cannot masquerade as satisfied criterion.
- **Evidence required:** before/after domain state and scoped response, actor/permission context, source revision/as-of, relevant history or explicit no-mutation check; screenshots alone do not prove guards.

## AC-142 — Timing boundaries

Trace: FR-020. Result: NOT_RUN.

- **Given** as-of T with explicit timezone; active due T-1s, T, T+48h, T+48h+1s, missing due; terminal late-completed record.
- **When** system evaluates proposed timing.
- **Then** OVERDUE, DUE_SOON, DUE_SOON, ON_TRACK, ON_TRACK/no due label respectively; terminal ON_TRACK for active monitoring with actual lateness still visible; timezone-equivalent instants agree.
- **Evidence required:** before/after domain state and scoped response, actor/permission context, source revision/as-of, relevant history or explicit no-mutation check; screenshots alone do not prove guards.

## AC-143 — Attention precedence

Trace: FR-020. Result: NOT_RUN.

- **Given** unsatisfied critical milestone chain plus overdue/missing-proof causes.
- **When** system derives attention; then critical cause removed while overdue remains.
- **Then** CRITICAL first with reasons; ATTENTION after removal; no manual NORMAL hides remaining cause; causal/escalation history retained.
- **Evidence required:** before/after domain state and scoped response, actor/permission context, source revision/as-of, relevant history or explicit no-mutation check; screenshots alone do not prove guards.

## AC-144 — No actionable work

Trace: FR-003, FR-010. Result: NOT_RUN.

- **Given** own actions all waiting/blocked/unassigned to current user or inaccessible.
- **When** user opens Next Action and My Actions.
- **Then** no invented recommendation; explain visible waiting/blocker causes without leaking inaccessible records; follow-up must be explicit separate actionable work.
- **Evidence required:** before/after domain state and scoped response, actor/permission context, source revision/as-of, relevant history or explicit no-mutation check; screenshots alone do not prove guards.

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

## AC-146 — Cancellation and waiver

Trace: FR-005, FR-020. Result: NOT_RUN.

- **Given** upstream R prerequisite to A.
- **When** OWNER cancels R or attempts waiver by relabeling cancelled as completed.
- **Then** R cancellation recorded with reason, A stays BLOCKED; no automatic legal waiver; prerequisite removal requires separate authorized scope-change reason.
- **Evidence required:** before/after domain state and scoped response, actor/permission context, source revision/as-of, relevant history or explicit no-mutation check; screenshots alone do not prove guards.

## AC-147 — Revoked access

Trace: FR-010, FR-014, FR-018. Result: NOT_RUN.

- **Given** member previews records/export and then membership revoked before delivery/write.
- **When** member fetches export/file/search/history or confirms change.
- **Then** deny all current access including cached URLs; no leaked payload/count; pending write unchanged; active remaining owner can see unassigned-work exception.
- **Evidence required:** before/after domain state and scoped response, actor/permission context, source revision/as-of, relevant history or explicit no-mutation check; screenshots alone do not prove guards.

## AC-148 — Spreadsheet safety

Trace: FR-013, FR-014. Result: NOT_RUN.

- **Given** input text starts =,+,-,@ and file includes formula/macro or embedded URL.
- **When** import previews and authorized export follows.
- **Then** formula/macros not executed, embedded URLs not fetched; literal text preserved safely in Excel; malformed rows produce clear errors, not silent coercion.
- **Evidence required:** before/after domain state and scoped response, actor/permission context, source revision/as-of, relevant history or explicit no-mutation check; screenshots alone do not prove guards.

## AC-149 — History integrity

Trace: FR-008, FR-018. Result: NOT_RUN.

- **Given** OWNER/EDITOR/VIEWER attempt direct modification/deletion of past audit event.
- **When** request is processed.
- **Then** deny mutation for every role; corrective domain operation appends linked history; retention workflow cannot be improvised as generic delete.
- **Evidence required:** before/after domain state and scoped response, actor/permission context, source revision/as-of, relevant history or explicit no-mutation check; screenshots alone do not prove guards.

## AC-150 — Keyboard and error recovery

Trace: FR-011. Result: NOT_RUN.

- **Given** 50/200-row grid with keyboard-only user and one invalid inline date.
- **When** user navigates, selects, edits, receives validation error, corrects and saves.
- **Then** focus remains on identified row/field, error text announced, draft not lost, no keyboard trap; selection after filtering is explicit and no hidden rows silently edited.
- **Evidence required:** before/after domain state and scoped response, actor/permission context, source revision/as-of, relevant history or explicit no-mutation check; screenshots alone do not prove guards.

## AC-151 — Accessible comprehension

Trace: FR-009, FR-011. Result: NOT_RUN.

- **Given** critical/attention/ready/blocked, loading/empty/error/permission states and 200% zoom.
- **When** keyboard/screen-reader test runs core workflows.
- **Then** status meaning available in text, controls named, focus visible/logical, errors associated, no color-only distinctions or loss of action at zoom; defects recorded.
- **Evidence required:** before/after domain state and scoped response, actor/permission context, source revision/as-of, relevant history or explicit no-mutation check; screenshots alone do not prove guards.

## AC-152 — Localization and time

Trace: FR-014, FR-020. Result: NOT_RUN.

- **Given** same instant rendered in two chosen zones and English/Vietnamese labels; DST-ambiguous local input.
- **When** viewer switches language/timezone and editor submits ambiguous date.
- **Then** IDs/state semantics/order unchanged, instant equivalent and timezone visible; ambiguous/nonexistent local time requires offset/clarification; round-trip export/import retains intended instant.
- **Evidence required:** before/after domain state and scoped response, actor/permission context, source revision/as-of, relevant history or explicit no-mutation check; screenshots alone do not prove guards.

## AC-153 — Failure consistency

Trace: FR-008, FR-012. Result: NOT_RUN.

- **Given** mutation encounters history-write failure or client disconnects after unknown commit outcome.
- **When** client retries/reconciles same operation.
- **Then** no successful mutation without associated history; prior committed result returned once or explicit unresolved status; no duplicate effects or false success.
- **Evidence required:** before/after domain state and scoped response, actor/permission context, source revision/as-of, relevant history or explicit no-mutation check; screenshots alone do not prove guards.

## AC-154 — Performance baseline

Trace: FR-009, FR-011. Result: NOT_RUN.

- **Given** 50 and 200-row synthetic matters; defined device/network/build and authorized workload.
- **When** run 30 measured repetitions of view/filter/edit and export; capture p50/p95 and failures.
- **Then** report raw measurements, environment and budgets proposed by Step 02; no PASS latency/SLA claimed until numeric budgets/workload approved; functional correctness still required.
- **Evidence required:** before/after domain state and scoped response, actor/permission context, source revision/as-of, relevant history or explicit no-mutation check; screenshots alone do not prove guards.

## AC-155 — Backup recovery

Trace: FR-008, FR-015, FR-018. Result: NOT_RUN.

- **Given** approved recovery policy and synthetic dataset with relationships/evidence/version/history.
- **When** restore into isolated authorized test environment.
- **Then** verify integrity/permissions and exact recovery point; measure elapsed time/data loss against approved RTO/RPO; no PASS recovery objective while values unapproved.
- **Evidence required:** before/after domain state and scoped response, actor/permission context, source revision/as-of, relevant history or explicit no-mutation check; screenshots alone do not prove guards.

## AC-156 — Unavailable vs empty

Trace: FR-009, FR-011. Result: NOT_RUN.

- **Given** data source error, partial load, or stale summary vs genuinely zero visible records.
- **When** user opens view or retries.
- **Then** error/loading/stale/empty distinguishable; no false zero blockers or overwritten draft; safe retry and permission-appropriate detail shown.
- **Evidence required:** before/after domain state and scoped response, actor/permission context, source revision/as-of, relevant history or explicit no-mutation check; screenshots alone do not prove guards.

## AC-157 — Dispute resolution

Trace: FR-007, FR-020. Result: NOT_RUN.

- **Given** accepted proof is challenged with reason; other proof remains valid.
- **When** authorized independent verifier resolves after assessing current evidence.
- **Then** DISPUTED while unresolved; resolution recomputes verified/partial/unverified from current proof, not prior label; stale/unauthorized resolution rejected with no mutation.
- **Evidence required:** before/after domain state and scoped response, actor/permission context, source revision/as-of, relevant history or explicit no-mutation check; screenshots alone do not prove guards.

## AC-158 — Membership safeguards

Trace: FR-018. Result: NOT_RUN.

- **Given** one active Matter OWNER and proposed cross-workspace member or self-grant import.
- **When** caller tries last-owner removal, out-of-workspace grant or imported owner role.
- **Then** reject without orphaning ownership or granting access; transfer to another active scoped OWNER succeeds with explicit history.
- **Evidence required:** before/after domain state and scoped response, actor/permission context, source revision/as-of, relevant history or explicit no-mutation check; screenshots alone do not prove guards.

## AC-159 — Basic domain context

Trace: FR-001. Result: NOT_RUN.

- **Given** GW-02 finding linked to R and follow-up, open decision, risk and Entity reference.
- **When** editor records resolution proof/decision outcome and views context.
- **Then** typed distinctions and history preserved; finding is not treated as probability risk, Entity not automatically user/party; no advanced P1 engine required.
- **Evidence required:** before/after domain state and scoped response, actor/permission context, source revision/as-of, relevant history or explicit no-mutation check; screenshots alone do not prove guards.

## AC-160 — Transition-table conformance

Trace: FR-020, FR-007, FR-016, FR-018. Result: NOT_RUN. Generate cases from every row in state-semantics.md; default clock/revision fixtures apply, with explicit condition overrides.

- **Given** each allowed Execution transition, with applicable object, actor and guard conditions.
- **When** run once with all guards true, then false/unauthorized/stale variants; also try every unlisted ordered pair.
- **Then** only allowed guarded operations succeed; terminal→NOT_STARTED and blocked completion denied. Same-state retry is no-op without duplicate event.
- **Given** each Verification event/transition, including criteria revision before applicability, and every unlisted direct ordered pair.
- **When** independent verifier or permitted OWNER performs its defined event, then repeat with wrong actor, invalid proof, outstanding dispute or stale revision.
- **Then** recompute to stated valid aggregate only; direct aggregate overwrite and DISPUTED/VERIFIED/PARTIALLY_VERIFIED→NOT_REQUIRED denied. Resolve dispute, explicitly revise criteria to zero with audit → UNVERIFIED, then separate OWNER applicability → NOT_REQUIRED succeeds; adding criterion first revokes NOT_REQUIRED to UNVERIFIED. No implied waiver.
- **Given** each allowed Filing stage row, no-signature/no-supplement/repeat/negative variants, and every unlisted direct stage pair.
- **When** record actual proof/observations satisfying guards, then missing-proof/wrong-role/stale variants.
- **Then** allowed observation persists only with its guards; unlisted jumps denied. Explicit OWNER correction/reopen is tested as a distinct reasoned correction event retaining prior evidence, not an unguarded stage jump.
- **Given** each derived Dependency, Timing and Attention transition and cause boundaries in AC-123/124/142/143.
- **When** authoritative inputs/time change, then client attempts to set a conflicting derived value manually.
- **Then** derived values match inputs/reasons; client override rejected; unavailable evaluator cannot return false READY; history reflects causal changes, not duplicate refresh events.
- **Evidence required:** table-row/pair coverage inventory, object applicability, actor, guard input and before/after/no-mutation assertion for every case. Test authors must report any unrealizable guard instead of silently skipping it.
