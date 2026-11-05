# MC-003A.8A — actual Claude Code targeted contract clarification

STATUS: READY_NOT_DISPATCHED. Preparation is not dispatch or provider authorization.

EXECUTION GATE: Do not read repository content, invoke tools, send a new payload or write until the official approval mechanism permits this exact action AND the payload snapshots/SHA256, actual destination/model, execution permissions and cost envelope have scoped authorization. This prompt grants no bypass, authentication, provider/model change or paid retry. Return text only through the approved channel. If these prerequisites are absent, report WAITING_SCOPED_AUTHORIZATION and stop.

You are actual Claude Code, architecture/contract owner. Identify actual tool/version/model/provider, base/head, method, any prior authorship and self-review limitation. Do not impersonate another product.

Target worktree: /Users/nguyenvanlan/.codex/worktrees/mattercontrol-step-03a-remediation/matter-control
Branch task/MC-003A-remediation; contract baseline 97356ce45c2b10070e9303f7c2ab39a425fad7a5.
Only F-01..F-10 below. No full 32-operation review, full architecture audit or F-11 ownership. Codex owns F-11. No product code/runtime/Go/PostgreSQL/frontend/build/browser/MCP, changes to INT-A or MC-003A baseline, merge/push/deploy.

Read-set authority: step-03a-7/current-reviewed-read-set.json identifies immutable base reviewed-read-contract.json PLUS reference-resolution-delta.json with supporting reference-resolution-addendum.md; original DR-02/13 rejections are superseded only where the delta names them. These are reviewed candidates, not approved product APIs. Use authorized excerpts covering the exact finding references and approved requirements below. No new API route, domain state or product rule is silently authorized.

PROPOSED MINIMUM INPUT SOURCES (not a transmission authorization): current-reviewed-read-set.json; exact affected fragments of reviewed-read-contract.json, reference-resolution-delta.json and reference-resolution-addendum.md; approved business-rules.md RULE-003/005/006/008/010/011/012/017/019/021, state-semantics.md where relevant, srs.md FR-001/003/005/007/008/009/010/015/016/017/018/019, acceptance-criteria.md cited sections, permission-matrix.md; candidate api-contracts.md conventions and §3.3; this focused prompt. Snapshot exact selected sections/bytes/hashes before seeking scoped authorization. This list stays within the prior 18 source paths, but prior ZCode permission does not automatically authorize Claude transmission.

EXCLUDE dependency-engine.md, raw ZCode report containing extra-scope observations, grep output outside the 18-file list, full repository/.git/.env, credentials/legal data, F-11 packet and unrelated logs. If indispensable content is absent, return NEEDS_AUTHORIZED_SOURCE with exact path/sections/reason/destination/model/permissions/known cost; stop that subpart before accessing/transmitting. Do not inherit the reported scope deviation as approval.

For EACH finding return exact before reference/text, minimal proposed after text/JSON pointer patch, approved requirement vs candidate design authority, alternatives/consequences, compatibility/client impacts, ADR/PO decision need, deterministic acceptance assertions, owner, verdict and remaining limitation. Return only a narrow addendum/delta proposal; do not overwrite immutable snapshots or declare product approval. Technical recommendation is not PO approval. Changes that expand the 32 routes require separate decision, not this addendum.

## F-01 — Medium
Original finding reference: reviewed-read-contract.json → detail_read_catalogue DR-06
Original issue: `GET /nodes/{id}/dependencies` returns two independently paged collections (incoming[], downstream[]) but the response envelope, per-side `nextCursor` and cursor-binding labels are unspecified; CT-16 cannot assert deterministic paging on this route
Exact candidate reference: /detail_read_catalogue[id=DR-06]/required_data; /read_common_rules/RC-6; CT-16
Approved requirement: FR-005, FR-009; AC-105/109/122..125/146; approved RULE-003/017
Minimal proposal (Codex recommendation, NOT approved): Retain one GET with incoming and downstream pages; propose separately named incomingAfter/downstreamAfter and incomingLimit/downstreamLimit, per-side {items,total,nextCursor}, collection-specific cursor binding, deterministic incoming upstream ID order and downstream distance/ID order. Claude must pin how advancing one side treats the other, and metadata for a fresh boundary.
Alternatives/consequences: Two endpoints would expand the frozen catalogue; one shared cursor cannot independently continue both collections. Prefer two side-specific cursors within the existing route.
Compatibility: Additive candidate envelope/parameters; old flat-array consumers would need alignment. Do not edit existing snapshot.
Architecture decision: Contract addendum expected, no new ADR unless snapshot/auth model changes.
Acceptance: Two >200 fixtures; independent traversal without omissions/duplicates on a fixed snapshot, side-swapped cursor 422 after authorization, revoked 404, new snapshot labeled.
Status: OPEN / PROPOSED_NOT_APPLIED_NOT_APPROVED; actual Claude resolves the technical recommendation.

## F-02 — Medium
Original finding reference: reviewed-read-contract.json → control_room.section_envelope `unavailableReason`
Original issue: "Closed code" asserted but the closed set is defined nowhere (grep of candidate architecture: only document-content availability exists, a different axis); frontend cannot render distinct failure reasons; CT-14 response not fully assertable
Exact candidate reference: /control_room/section_envelope/unavailableReason; READ-02; CT-14
Approved requirement: FR-009; AC-109/156; no false zero from errors
Minimal proposal (Codex recommendation, NOT approved): Propose a minimal closed safe vocabulary EVALUATION_FAILED and SNAPSHOT_UNAVAILABLE, with exact applicability. Snapshot-open failure remains root 503, never a fabricated partial section. Claude decides whether the second code has a legitimate section case; if not, omit it. No raw exception/provider details.
Alternatives/consequences: A single generic code has less explanatory detail; extensible codes require explicit unknown-code rendering. Neither approach may silently imply successful zero.
Compatibility: Candidate enum addition; consumer error mapping required.
Architecture decision: No new ADR for enum clarification; raise a decision if adding fault/retry/storage architecture.
Acceptance: Every emitted code has a defined trigger; AVAILABLE reason null, UNAVAILABLE items/total null; partial 200 vs all-fail 503; document-only fault seam requirement, no runtime proof.
Status: OPEN / PROPOSED_NOT_APPLIED_NOT_APPROVED; actual Claude resolves the technical recommendation.

## F-03 — Medium
Original finding reference: reviewed-read-contract.json → nextActions `excluded[].reason`; dependency-engine.md §7
Original issue: A node that is both execution-WAITING and dependency-BLOCKED has two applicable excluded reasons but the shape allows one; dependency-engine §7 defines no precedence; AtlasT0 AC-05 is exactly this case, so the expected payload is underivable
Exact candidate reference: /control_room/sections/nextActions/card and rule; CT-21
Approved requirement: RULE-021; FR-003/010; AC-103/144; WAITING != BLOCKED
Minimal proposal (Codex recommendation, NOT approved): Propose one display reason with WAITING > BLOCKED > UNASSIGNED precedence for overlapping exclusions. Preserve all actual state axes, and specify visible/unassigned scope without exposing inaccessible records. AC-05 remains WAITING+BLOCKED and displays WAITING in excluded[].
Alternatives/consequences: Ordered multi-reason array preserves all causes but changes field type; BLOCKED-first may obscure the approved Waiting On routing. Claude confirms precedence as display-only, not state override.
Compatibility: Keep scalar shape; explicit winner changes previously ambiguous overlap behavior.
Architecture decision: No new ADR if display-only; PO decision only for actual policy change.
Acceptance: Truth table for all overlapping combinations including AC-05; no eligible WAITING/BLOCKED action; no manufactured next action or changed readiness.
Status: OPEN / PROPOSED_NOT_APPLIED_NOT_APPROVED; actual Claude resolves the technical recommendation.

## F-04 — Low
Original finding reference: reviewed-read-contract.json → sections.decisions.order + DR-14 collection order
Original issue: Decisions order "dueAt, createdAt, id" leaves null-due position unstated, unlike nextActions/waits/blockers which say "no due last"
Exact candidate reference: /control_room/sections/decisions/order; /detail_read_catalogue[id=DR-14]/reviewed_operations
Approved requirement: FR-009; AC-109; deterministic display/provenance; no approved due-null ranking stated for Decisions
Minimal proposal (Codex recommendation, NOT approved): Propose dueAt ascending with null last, then createdAt ascending, then canonical ID ascending in both overview and continuation.
Alternatives/consequences: Null first is possible but differs from surrounding due-date conventions; it is not forbidden by approved business rules. Ask Claude to choose and label candidate.
Compatibility: Candidate ordering clarification; continuation cursors must use the same tuple.
Architecture decision: No new ADR expected.
Acceptance: Mixed dated/null/equal-date/equal-createdAt cases have one explicit order; same snapshot overview equals continuation prefix.
Status: OPEN / PROPOSED_NOT_APPLIED_NOT_APPROVED; actual Claude resolves the technical recommendation.

## F-05 — Low
Original finding reference: reviewed-read-contract.json → CT-05 testability text; RC-1/RC-3
Original issue: "Malformed id 404/422 per route convention" — the convention is unpinned; a Huma-based backend would 422-validate malformed UUID path params pre-resolution, which must not vary per route
Exact candidate reference: /testability_review[id=CT-05]/testability; RC-1/RC-3; all resource-in-path reads
Approved requirement: FR-018; RULE-017; AC-118/134/135/147; approved uniform inaccessible/not-found
Minimal proposal (Codex recommendation, NOT approved): Recommend uniform not-found 404 for malformed resource path identifiers after authentication; query/cursor validation stays 422 after Matter authorization. Claude must pin resolution/check order for malformed matter path and resource path without relying on a presumed framework default.
Alternatives/consequences: Uniform 422 path syntax is an alternative technical convention needing explicit treatment; do not make unverified claims about current backend behavior or change Go code here.
Compatibility: Candidate error convention; future route binding/schema alignment required from ZCode.
Architecture decision: No new ADR unless authorization check order changes.
Acceptance: Unauthenticated malformed path 401; authenticated malformed/other-kind/nonexistent paths use chosen uniform body and no metadata leak; invalid authorized query 422; consistent across routes.
Status: OPEN / PROPOSED_NOT_APPLIED_NOT_APPROVED; actual Claude resolves the technical recommendation.

## F-06 — Low
Original finding reference: delta → RC-REF-01 fields (DR-12 `authorityPartyRef/Label`), RC-REF-03 fields (DR-04/05 `workstreamLabel`)
Original issue: Nullability unstated when the paired ref is absent (filing before authority identified; requirement/action with no workstream)
Exact candidate reference: /delta[id=RC-REF-01]/fields[path=DR-12 filing.authorityPartyLabel]; /delta[id=RC-REF-03]/fields (DR-04/05 workstreamLabel)
Approved requirement: FR-001/016/017; AC-101/116/117/130; no invented references
Minimal proposal (Codex recommendation, NOT approved): Propose nullable sibling label when the paired ref is absent; present ref requires its same-snapshot label. Pin null versus omitted consistently for both ref and label. Missing/corrupt referenced resource is not silently presented as an intentionally absent ref.
Alternatives/consequences: Omitting both fields is possible but forces a separate optional-field convention; empty string conflates absent/known.
Compatibility: Candidate nullability clarification only; generic typed ref unchanged.
Architecture decision: No new ADR expected.
Acceptance: Absent authority/workstream yields documented null pair; present and inactive party resolves; labels never originate from another snapshot or foreign Matter.
Status: OPEN / PROPOSED_NOT_APPLIED_NOT_APPROVED; actual Claude resolves the technical recommendation.

## F-07 — Low
Original finding reference: delta → RC-REF-02 claim envelope `status`
Original issue: Claim-status vocabulary not enumerated in the reviewed set (only an example value in api-contracts §3.3); consumers cannot assert the zero-assessment render
Exact candidate reference: /delta[id=RC-REF-02]/fields claim.status; DR-07/08/09
Approved requirement: FR-007; RULE-005/006; AC-107/126/127/140; Verification axis is not automatically a Claim lifecycle
Minimal proposal (Codex recommendation, NOT approved): Ask Claude to bind status to an existing normative claim definition or specify its exact candidate vocabulary/derivation using only authorized excerpts. Zero assessments means existing claim with no review, not 404. Do not invent a Claim enum by copying subject Verification values.
Alternatives/consequences: New lifecycle enum or additional architecture sources require justified decision/payload expansion; one example in api-contracts is not a closed vocabulary.
Compatibility: Potential enum/client mapping; preserve claim parent envelope, exact version/criterion identity.
Architecture decision: Decision required if new lifecycle semantics are introduced; otherwise citable clarification.
Acceptance: Zero-assessment, withdrawn Evidence and disputed/revoked assessment behavior citable from the authorized set; no automatic VERIFIED result.
Status: OPEN / PROPOSED_NOT_APPLIED_NOT_APPROVED; actual Claude resolves the technical recommendation.

## F-08 — Low
Original finding reference: reviewed-read-contract.json → sections.condition
Original issue: (a) condition-section `total`/`nextCursor` degenerate semantics unstated; (b) exception code `CRITICAL_ATTENTION` is a compound not literally in RULE-010's distinct CRITICAL/ATTENTION states (axes elsewhere preserve the distinction)
Exact candidate reference: /control_room/sections/condition; /control_room/section_envelope
Approved requirement: FR-009; RULE-010; AC-109/156; separate CRITICAL/ATTENTION meaning
Minimal proposal (Codex recommendation, NOT approved): Propose AVAILABLE condition contains exactly one card, total=1 and nextCursor=null even when exceptions=[]; UNAVAILABLE carries items/total null and no continuation. Replace compound CRITICAL_ATTENTION with distinct CRITICAL and ATTENTION exception codes, or require an explicit display aggregation definition that preserves the independent values.
Alternatives/consequences: Omit degenerate paging fields via a union envelope (larger shape change), or explicitly documented compound summary; neither may create an overall legal state.
Compatibility: Candidate envelope/exception-code refinement; update affected consumer fixtures.
Architecture decision: No new ADR expected unless introducing a new domain aggregate/state.
Acceptance: Empty-exception AVAILABLE condition still has one card; distinct critical/attention examples and partial-source null counts; unavailable never total 0.
Status: OPEN / PROPOSED_NOT_APPLIED_NOT_APPROVED; actual Claude resolves the technical recommendation.

## F-09 — Low
Original finding reference: DR-15 events `after`/`before` seq params vs RC-6
Original issue: Raw seq params are not opaque cursor tokens; RC-6's opaque-cursor binding language does not map to them (seq is already public to members)
Exact candidate reference: /detail_read_catalogue[id=DR-15]/collection_version and reviewed_operations; RC-6
Approved requirement: FR-008/019; RULE-016/017/019; AC-108/136/138/149/153
Minimal proposal (Codex recommendation, NOT approved): Propose explicit exemption of public event seq keysets from opaque-token syntax/binding only; authorization, filters, ordering, safe query validation and per-response snapshot metadata remain. after asc / before desc unchanged; time-window mapping TQ-05 stays open.
Alternatives/consequences: Wrap seq in a new opaque cursor is wider change; no need to hide seq already returned to authorized members.
Compatibility: Candidate scope clarification, no endpoint addition.
Architecture decision: No new ADR expected; no TQ-05 closure.
Acceptance: after/before boundaries, mutually exclusive parameter behavior and invalid seq 422 specified; revoked 404 before validation; no cross-Matter event retrieval.
Status: OPEN / PROPOSED_NOT_APPLIED_NOT_APPROVED; actual Claude resolves the technical recommendation.

## F-10 — Low
Original finding reference: DR-10 `documents/{id}` versions[]; DR-12 `filings/{id}` cycles[]/submissions[]
Original issue: Embedded arrays have no stated bound while all collection routes are bounded-with-continuation; relation of embedded arrays to the `/versions` and `/cycles` continuation routes unstated
Exact candidate reference: /detail_read_catalogue[id=DR-10]/required_data versions[]; DR-12 cycles[]/submissions[]
Approved requirement: FR-015/016; RULE-011/012; AC-115/116/128/129/145
Minimal proposal (Codex recommendation, NOT approved): Prefer bounded embedded prefixes with explicit existing /versions and /cycles continuation pointers, matching order/snapshot semantics and no total business cap. Claude must resolve nested submissions[] as well; /cycles alone does not prove bounded submissions per cycle. If no existing continuation supports that cardinality, mark that subpart DECISION_REQUIRED rather than inventing a route.
Alternatives/consequences: Complete arrays need a supported cardinality/budget; new per-cycle submissions route expands frozen 32 and requires separate decision. Do not claim complete-small without evidence.
Compatibility: Candidate response envelope/consumer update; no silent truncation or new route.
Architecture decision: Clarification unless a new route/storage policy is needed; then separate decision before changing catalogue.
Acceptance: More-than-one-page versions/cycles and multiple submissions: each item reachable with exact submitted versions; incomplete payload explicit; no false completeness, arbitrary per-Matter cap, or guessed page pointer.
Status: OPEN / PROPOSED_NOT_APPLIED_NOT_APPROVED; actual Claude resolves the technical recommendation.

Preserve 22 CT IDs and the 16/4/1/1 classification; every runtime result NOT_RUN. CT-05 depends F-05; CT-14 F-02 (fault seam still needed); CT-19 remains TQ-05 OPEN (do not quietly resolve it in F-09); CT-21 F-03 plus Codex F-11; CT-07 F-11; CT-20 TB-05 architecture/storage OPEN. Other testable scenarios retain their explicitly noted subcase caveats (CT-06 F-08, CT-13 F-06/F-10, CT-16 F-01/F-09, CT-17 F-07, CT-18 F-04). Do not mark these resolved by mere existence of an addendum.

Preserve Q1..Q8 original dispositions; Q2/F-02, Q4/F-01, Q6/F-03/F-11 and Q8/F-05-adjacent are ANSWER_CONDITIONAL_ON_FINDING_RESOLUTION. Q5 remains ANSWERED_FROM_APPROVED_SOURCE. All QA runtime NOT_RUN.

Freeze product stale-revision 412 and bulk 200/per-row as candidates; native INT-A 412 transport-only; Import Draft preview-before-confirm; guarded Requirement completion; CAS-scoped If-Match; External Party point lookup; Evidence Claim parent envelope; Workstream point lookup without arbitrary total limit. G5-A document compatibility stands, G5-B FINDINGS_OPEN, G3 NOT_VERIFIED, G4 PENDING, G6 REWORK_REQUIRED, STEP03B NOT_AUTHORIZED.

Return summary per F ID: RECOMMENDED_CLARIFICATION_DOCUMENT_ONLY / NEEDS_AUTHORIZED_SOURCE / DECISION_REQUIRED / CHANGES_REQUIRED, with precise proposed edits and acceptance. Codex intake follows; ZCode then rechecks only changed findings with before/after, correction, evidence, reviewer disposition and limitations. Independent Design QA is still separate. End with skipped checks/risks. No claim of executed tests, saved files or commit without evidence.
