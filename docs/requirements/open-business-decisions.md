# Open Business Decisions — Step 01 Approval Packet

Owner: Codex — BA/PM. Baseline: `20f12fe`; source: [Step 01 request](../ai-sdlc/step-01-request.md). Product direction/20 P0 scope already approved. Recommendations B (OBD-08 B/B) for OBD-02..08/10/11 at `572835a` are **APPROVED_BY_PO**, 2026-10-24; [direct approval and closure](../ai-sdlc/step-01-approval.md). Original OBD IDs, alternatives and recommendation text are retained as decision history. Business rules are in [RULE register](business-rules.md); behavioral details in [states](state-semantics.md), [permissions](permission-matrix.md), [SRS](srs.md) and [AC](acceptance-criteria.md).

Product Owner approval required by Step 01 §8/21/23 is now explicitly recorded for the nine policy decisions below. Numeric workload, retention and RPO/RTO are deferred by explicit PO decision to Step 02; feasibility and release measurements remain open. Approval source is the two direct answers in the linked record, not an inferred “continue”.

## OBD-01 — Source provenance

- Problem: former original A/B file gate blocked an initially empty repository.
- Impact: all workflows and context provenance.
- Alternatives: mandatory original import vs accepted approved prompts with optional archival.
- Recommendation/decision: approved prompts are valid; originals optional, no direct A/B comparison claim.
- Risk: false provenance if generated content attributed to original briefs; preserve labels.
- Acceptance: context-provenance.md accurately identifies sources; no new original-file gate.
- Status: RESOLVED by SRC-00A1 (already approved). New PO approval: No.

## OBD-02 — Execution and evidence authority

- Problem: completion can precede proof; who can assert acceptance, reverse it, handle expiry/disputes and apply NOT_REQUIRED?
- Impact: GW-01/02/03, FR-001/006/007/020.
- Alternatives: (A) assignee/self-verification with role alone; (B) designated independent verifier and explicit criteria; (C) universal multi-person approval workflow.
- Recommend B: RULE-005/006/007 and state table. Submission by EDITOR/OWNER; verifier separately designated, not submitter; missing verifier leaves pending. Current aggregate based on applicable accepted valid proof, dispute precedence. Reopen resets current proof assessment; reversal/expiry removes satisfaction while retaining history. Explicit OWNER applicability decision for NOT_REQUIRED, not implicit zero-criteria success.
- Risks/trade-offs: B adds staffing friction; A risks self-certification; C adds beyond-minimum workflow complexity. These are operational controls, not legal sufficiency claims.
- Acceptance: AC-107/121/123/126/127/140/157/160; exact version and actor recorded.
- Status: APPROVED_BY_PO, option B, 2026-10-24; subject `572835a`; direct evidence in step-01-approval.md.

## OBD-03 — Minimal P0 legal context vs advanced P1

- Problem: workflows need decisions/findings/risks/signature/entity context while advanced models remain P1.
- Impact: all workflows, FR-001/015/016/017.
- Alternatives: (A) omit these records; (B) basic typed context/links/history and signature observations; (C) implement full P1 domain engines.
- Recommend B: RULE-020 and mvp-scope.md; minimum fields/outcomes support actual user journeys. Keep exact version/entity references; no advanced taxonomy, scoring, automation or temporal ownership engine.
- Risks: A removes approved workflow coverage; C expands scope; B needs clear acceptance boundaries to avoid generic notes hiding semantics.
- Acceptance: AC-115/116/159/161/162/163; original 14 P1/7 P2 priorities preserved.
- Status: APPROVED_BY_PO, option B, 2026-10-24; subject `572835a`; direct evidence in step-01-approval.md.

## OBD-04 — Dependency, waiver and readiness

- Problem: completion vs proof gates, multi-edge AND/OR, cycles, upstream reopen, no-action requirements, milestone readiness and waiver meaning.
- Impact: all workflows; FR-002/003/005/020.
- Alternatives: (A) uniform completion-only; (B) explicit completion or completed-and-verified edge, AND combining with recursive upstream READY; (C) arbitrary AND/OR/waiver rule builder.
- Recommend B: RULE-003/004/008/021. Reject cycles/self/duplicate/cross-matter links. Reopen re-blocks transitively including downstream already completed (preserve historical execution). Milestones require explicitly designated satisfied requirements, empty set unassessed; counts informational, no percentage-based closing. Next Action is deterministic suggestion from ready work, not auto-work creation. No automatic legal waiver; cancellation does not satisfy prerequisite; explicit OWNER scope revision with reason is separately audited.
- Risks: B intentionally restricts OR/waivers; PO must confirm real workflows can express required conditions without hidden bypass. C increases error/interpretability risk. Strict recursive blocking may highlight already-performed downstream work, which is desired exposure rather than undo.
- Acceptance: AC-102/103/105/122/123/124/125/141/144/146/161.
- Status: APPROVED_BY_PO, option B, 2026-10-24; subject `572835a`; direct evidence in step-01-approval.md.

## OBD-05 — Filing lifecycle

- Problem: package completeness, submission vs receipt, authority waiting, repeated supplements and rejection/withdrawal.
- Impact: GW-03 and filing/post-closing of GW-01; FR-016.
- Alternatives: (A) single status “filed”; (B) explicit observations/stages and evidence-defined package; (C) jurisdiction-specific automated regulator integration.
- Recommend B: RULE-012 and filing transition table; manual accountable tracking, receipt not Approval; conditional/repeating supplement cycles preserve submitted versions. Outcome recorded with proof, independently verified; rejection/withdrawal distinct from successful approval and cancellation does not meet linked requirement.
- Risks: manual observations need accountable users and precise proof; no guarantee of legal effectiveness. C requires separate approved scope/jurisdiction discovery.
- Acceptance: AC-116/129/145/163 including no-supplement and rejection paths.
- Status: APPROVED_BY_PO, option B, 2026-10-24; subject `572835a`; direct evidence in step-01-approval.md.

## OBD-06 — Timing and attention

- Problem: timezone, absent due date, threshold, terminal lateness, what makes blockers critical, escalation override.
- Impact: all workflows, FR-002/009/011/020.
- Alternatives: (A) arbitrary colored/manual statuses; (B) explicit instantaneous rules + owner critical designation; (C) jurisdiction calendars and predictive scoring.
- Recommend B: RULE-009/010. Propose 48-hour due-soon interval; explicit timezone/instant. Missing due visibly “no due date”; terminal ON_TRACK only for active monitoring, preserve actual lateness. Critical based on unsatisfied designated critical chain or reasoned OWNER escalation; attention otherwise based on listed causes; no override can hide derived critical cause.
- Risks: 48h may not fit practice; missing due may look healthy without qualifier; critical designation requires governance. No business-day/legal deadline calculation assumed.
- Acceptance: AC-142/143/152 and visible reasons in AC-109.
- Status: APPROVED_BY_PO, option B, 2026-10-24; subject `572835a`; direct evidence in step-01-approval.md.

## OBD-07 — Historical reporting and P0 guarantee

- Problem: draft vs issued, baseline/window ordering, no-change and access, reproducibility vs P1 snapshots.
- Impact: manager reporting across all workflows, FR-014/019.
- Alternatives: (A) mutable current summary with no provenance; (B) deterministic scoped draft/export based on explicit source revisions and window; (C) managed issued/immutable snapshot lifecycle in P0.
- Recommend B: RULE-015/016. Draft explicitly labeled; changes in (t1,t2] and outstanding at t2 distinct, stable ordering and links. Export provenance includes inputs, as-of and rights scope; no promise to reconstruct issued artifacts from future mutable data. Issued-report approval/distribution/retained snapshot management remains P1. P0 user may export/share a draft within their authorized responsibility; export is not official issuance by system.
- Risks: users may treat drafts as issued; labels and retained source references necessary. Historical-data retention constrains reproducibility; unavailable inputs must fail honestly. C promotes P1 and changes cost/retention.
- Acceptance: AC-114/119/138/147/148; disclosure of unavailable historical input.
- Status: APPROVED_BY_PO, option B, 2026-10-24; subject `572835a`; direct evidence in step-01-approval.md.

## OBD-08 — Roles, ownership, bulk and import

- Problem: proposed OWNER/EDITOR/VIEWER, workspace/matter boundary, verifier grant, confidential document scope, partial failures and retry policy.
- Impact: all workflows; FR-011/012/013/014/018 plus every access path.
- Alternatives: access (A) workspace role grants all matters vs (B) active workspace + explicit matter membership; batches (A) whole-file atomic vs (B) per-row bulk and per-connected-group import with explicit partial results.
- Recommend B/B: permission matrix and RULE-013/014/017/018. Workspace OWNER not automatic matter reader. P0 documents inherit matter scope; no unclaimed per-document ACL. Separate verifier designation/no-self. Safe preview/confirm, revision/permission recheck, duplicate-key retry handling; no bulk verify/waive/promotion; import never imports authority, grants or VERIFIED proof.
- Risks: confidentiality may require finer document restrictions; PO must confirm or request concrete scope change. Partial batches demand clear reconciliation; whole-file atomic simpler but prevents useful valid-group migration. Export enabled for VIEWER is a consequential choice to confirm.
- Acceptance: AC-112/113/118/131/132/133/134/135/139/140/147/148/158.
- Status: APPROVED_BY_PO, option B/B, 2026-10-24; subject `572835a`; direct evidence in step-01-approval.md.

## OBD-09 — Workload and infrastructure feasibility

- Problem: supplied Go/Echo/PostgreSQL template compatibility with Cloudflare Free Tier/$0 unverified; workload and storage/backup envelope unspecified.
- Impact: all workflows and NFR-006/008/014; not grounds to remove P0.
- Alternatives: (A) silently replace backend/database or buy services; (B) validate exact template revisions/workloads and show options at Step 02; (C) assert feasibility from a small demo.
- Recommend B. PO supplies/approves workload envelope: active matters/workspaces/users/concurrency, typical/peak records, file types/sizes/versions, import/export frequency, retention, backup and availability needs. Claude/Codex verify runtime/services/limits/costs and present any conflict without architecture decisions here.
- Risks: unknown feasibility may require a real constraint trade-off; no $0 guarantee. 50–200-row UX target is not total capacity evidence.
- Acceptance: AC-154/155 validation plans; dated template/hosting/cost evidence at Step 02, no unsupported success now.
- Status: DEFERRED_STEP_02_TECHNICAL_VALIDATION; numeric workload deferral APPROVED_BY_PO on 2026-10-24. Workload values and feasibility remain OPEN; cost/stack changes require separate approval. No infeasibility claim without evidence.

## OBD-10 — Acceptance and UX/NFR thresholds

- Problem: slice/alpha/full release acceptance, 10-second comprehension, keyboard/responsive/localization and absent latency/SLA values.
- Impact: all workflows, all FR/NFR.
- Alternatives: (A) visual demo judged enough; (B) workflow/state/security tests plus measured task-based usability and explicit budgets; (C) invent SLA/performance numbers.
- Recommend B: full P0 plus all three workflows; critical/high correctness failures block release. AC-137 proposes 5 representative managers, ≥4/5 correct within 10 seconds; PO validates protocol/sample. AC-154 establishes performance measurement, numerical budgets pending workload/Step 02. Responsive secondary scope and bilingual readiness explicit; no claim of full mobile parity or full legal translation.
- Risks: small sample only formative evidence; no target should become proven by documentation. Budget absence must block relevant performance/release claim later.
- Acceptance: AC-137/150/151/152/154/156/161/162/163 and NFR table.
- Status: APPROVED_BY_PO, option B, 2026-10-24; subject `572835a`; direct evidence in step-01-approval.md. Numeric budgets/values remain deferred or pending downstream validation; no measurement PASS inferred.

## OBD-11 — Document authority, history and recovery

- Problem: current version authority, proof invalidation, correction vs deletion, confidentiality/retention, backup recovery needs.
- Impact: all workflows; FR-007/008/015/018/019; NFR-002/004/014.
- Alternatives: (A) newest upload auto-current and overwrite old proof/history; (B) explicit OWNER promotion, version-pinned proof and append corrections with defined retention; (C) blanket irreversible indefinite retention.
- Recommend B: RULE-007/011/018/019; exact current/fixed criterion distinction. No normal user hard deletion/old-history editing. Retention period, legal hold/erasure authority, RPO/RTO and recovery custodians remain explicit PO policy questions; no duration invented. Recovery must restore scope/links/history consistently and be rehearsed before release.
- Risks: overly broad retention leaks confidential data/costs; deletion breaks audit/reports; self-asserted immutable/legal-compliant claims unjustified. Policy must reconcile retention and historical report guarantees.
- Acceptance: AC-108/128/136/149/153/155; restore measurement cannot pass an unapproved RTO/RPO.
- Status: APPROVED_BY_PO, option B, 2026-10-24; subject `572835a`; direct evidence in step-01-approval.md. Numeric budgets/values remain deferred or pending downstream validation; no measurement PASS inferred.

## Decision gate / outcome

**Product Requirements Approval Gate PASSED; MC-001 DONE; Step 01 COMPLETED.** The PO approved all nine recommendations and explicitly deferred numeric workload, retention and RPO/RTO to Step 02. Original recommendation/alternative/risk text above remains historical rationale; forward-looking approval wording there is superseded by each current status and the linked approval record. No business behavior changed. Architecture handoff is ready for assignment; Step 02 is NOT_AUTHORIZED_TO_START / NOT_DISPATCHED. Independent review and runtime evidence remain separate.
