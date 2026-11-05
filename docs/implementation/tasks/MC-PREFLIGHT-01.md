# MC-PREFLIGHT-01 — Filing Package Pre-flight v1

- **Status:** AUTHOR_COMPLETE_PENDING_INDEPENDENT_REVIEW — implementation EXISTS in tree (see Status history 2026-11-05); independent review NOT dispatched. Intake body below is retained verbatim; only this status line and the status history are corrected.
- **Requirement references:** REQ-MC-P0-06/07/16/20; approved D-9 purpose semantics; AC-145; design D-15/D-16 and §4. This is a display-only extension adjacent to P1 delivery, not a reclassification of the P0 baseline.
- **Coordination/intake owner:** actual Local Codex.
- **Assigned future implementation owner:** actual Local Codex, backend/API/frontend, after the readiness conditions below. This intake does not authorize code execution. No ZCode implementation reroute is issued by this task.
- **Priority / sequencing:** P1-adjacent; after the active RLF source assignment hands off a stable baseline. No competing writer on the current shared tree.
- **Independent reviewer:** actual OpenCode, nonauthor of the future Pre-flight implementation. Design/guard re-verification and final source/QA review are assigned roles, NOT dispatched/completed work. Availability, acknowledgement, exact input revision and nonauthor declaration must be recorded before implementation starts. If unavailable, Codex prepares an explicit alternative reviewer assignment; no automatic fallback or self-review.
- **Repository / branch:** `/Users/nguyenvanlan/Documents/code/pet-projects/matter-control`, `codex/unified-project-flow`.
- **Observed HEAD:** `7bf198c103476f490ebbdf58b1bd563d0bba8a61` plus the ongoing RLF dirty tree and uncommitted design. This HEAD alone does not identify future implementation inputs.
- **Created:** 2026-11-03, Asia/Ho_Chi_Minh. Exact UTC capture/byte identities: `docs/testing/preflight-intake-20261103-r1/inputs.json`.
- **Sender/receiver acknowledgement:** the PO delivered MC-CODEX-PREFLIGHT-INTAKE-20261103-PROMPT to Local Codex; intake accepted. Future implementation receiver acknowledgement NOT_RECORDED. ZCode design status DESIGN_VALIDATED_BY_PO is retained without reopening its four approved sections.

## Inputs and authority

1. Working-tree `docs/implementation/plans/MC-ZCODE-PREFLIGHT-DESIGN-20261103.md`, especially §4.1–4.6. Its dirty bytes are pinned in this intake; they are not represented as committed.
2. `docs/discovery/brainstorm-ideas-20261102-r1.md` and `-r2.md`, including D-15/D-16 provenance. Other discovery proposals remain unassigned.
3. `docs/ai-sdlc/orchestration-protocol.md`, task template and quality gates; latest root PO ownership amendment.
4. Current RLF task/checkpoint and future actual final return/source handoff. Author slice DONE labels do not equal whole-assignment independent acceptance.
5. Purpose/guard/ProofChecklist sources and the previous OpenCode Wave2 r2 report. Four current backend files are byte-equal to reviewed commit978d8fc at intake; current FE/RLF composition is not inherited into that review.
6. `docs/testing/opendesign-ux-plan-review-20261101-r1/terminology-final.md`; its final application remains subject to R10 as described in the design/workboard. Draft Vietnamese Pre-flight labels are not ratified by this intake.
7. `docs/implementation/plans/MC-MIMOSA-GATE-COMMIT-PLAYBOOK-20261031.md` as historical refusal/escalation context only. Its old commit approval is not authority for a new commit, hook bypass or evidence mutation.

## Scope and allowed paths — future assignment only

Implement precisely design §4: one server-side deterministic Filing-level read model; one authenticated read endpoint; one feature-local `PreflightPanel` section beneath stage status; tests and contract/copy documentation. Groups PACKAGE/SIGNATURE/OUTCOME, explanatory states, actionable internal links and one coherent AsOf are preserved.

Expected future paths, finalized against the handed-off baseline:

- `apps/backend/internal/core/domain/matter/workview.go`, `filing.go` and relevant domain tests: compose/share existing guard predicates; no new guard behavior.
- `apps/backend/internal/core/port/filing.go`, `internal/core/service/filing_service.go`, relevant memory/PostgreSQL contract tests.
- `apps/backend/internal/adapter/inbound/productapi/filing_dto.go`, `filing_handlers.go`, `server.go` and relevant HTTP tests; app wiring only if actually needed.
- `apps/frontend/src/features/filings/{schemas.ts,types.ts,repository.ts,components/}` and `src/app/(app)/matters/[matterId]/filings/[filingId]/page.tsx`, with relevant tests.
- Task-specific docs/contract/evidence. No database migration or new dependency is expected for this read model; a demonstrated need must be recorded before expanding that scope.

Out of scope: new write commands/receipts, lifecycle/state axes, submission gates, D-BF1 changes, matter/portfolio rollups, Certificate export, attach/create evidence from this panel, AI, other discovery ideas, provider/deployment work and unassigned shared-component rewrites.

## Sequencing dependencies and Definition of Ready

| ID | Current evidence / state | Required release condition | Owner |
|---|---|---|---|
| PF-DEP-01 — RLF writer/baseline | OPEN. RLF task remains IN_PROGRESS; checkpoint reports RLF-01..04 author completion and RLF-05 next/in-flight; new Playbook and Saved View files are dirty. No consolidated RLF return exists at intake. `filing-forms.tsx`, route/service composition and generated source are shared risks. | Actual RLF author handoff, precise changed paths and source manifest; stable reviewed/adopted commit when separately authorized, or a specifically accepted sealed base+patch checkpoint if commit is unavailable. No overlapping source writer. Re-inventory and record the exact implementation base before READY. Do not wait for unrelated cloud/human release gates or silently commit the RLF tree. | ZCode returns; Codex reconciles/adopts baseline |
| PF-DEP-02 — guard re-verify/re-pin | OPEN for the future baseline. OpenCode Wave2 r2 independently verified backend and G1 source on978d8fc; browser/G7 remain NOT_RUN. Current filing.go/evidence.go/workview.go/filing_service.go are byte-identical to that reviewed commit, so absence of all prior source review is NOT claimed. | OpenCode acknowledges/re-verifies the relevant current guard contract/fixtures and binds its scoped conclusion to the adopted post-RLF guard bytes. Reuse unchanged evidence where justified, investigate any delta, retain browser limits. Record a guard-alignment manifest/version; do not infer final Z-F-01/02 DONE from source continuity. | Actual OpenCode; Codex records provenance |
| PF-DOR-C1 — readiness comparator | NEEDS_CONTRACT_CLARIFICATION. §4.1 says Ready equals no blocking rows and guardAllows, while DecideAdvance also checks current/target stage, terminal state, submitted versions/reference, observed time and coupled execution. No-proof signature checks also depend on submitted VersionIDs. | Define the compared operation/predicate and complete fixture context. Document how non-row prerequisites are represented or excluded without an unqualified “can submit” claim. Keep OUTCOME nonblocking for submission under approved rules. Resolve with design author; a material semantics/copy change requires PO, not an intake assumption. | Codex coordinates ZCode design author; OpenCode verifies matrix |
| PF-DOR-C2 — denial precedence | NEEDS_CONTRACT_CLARIFICATION. Design assumptions/E-6 require uniform hiding; §4.2 says403 outside membership. Existing WorkService.readSnapshot returns ErrNotFound for denied membership and GetFiling reuses it. | Reconcile explicit401/403/404/error mappings with the approved permission matrix and uniform foreign/missing resource behavior. Do not introduce an existence leak or assume the draft403 overrides policy. Record the compatible API addendum before READY. | Codex contract coordination; independent reviewer |
| PF-DOR-C3 — explanatory wire fields | NEEDS_CONTRACT_CLARIFICATION. §4.3 requires cause text and WAIVED rationale, while the §4.1 row sketch has no explicit rationale/cause field. Missing PACKAGE may need an explanatory row without an actual CriterionID. | Document attributable cause/reason/waiver data and safe action-link identity, including missing-criterion rows, in the concrete DTO/contract. No invented criterion IDs or arbitrary untrusted navigation. Keep this within approved display-only scope. | Future owner + design author; independent reviewer |

BACKLOG → READY only when these conditions are evidenced, exact owner/reviewer assignments and acknowledgement are recorded, and the task's acceptance matrix is executable. No source code begins merely because the design is PO-validated. Source work may move to a dedicated `codex/` task branch/worktree only after explicit path/base coordination; none is created by this intake.

R10 copy ratification is a merge/design-parity dependency, not a reason to deny that the deterministic backend design is approved. Performance and rendered/human evidence below are future acceptance, not invented existing readiness results.

## Acceptance and tests

| Criterion | Required evidence | Intake result |
|---|---|---|
| PF-AC-01 — scope / no side effects | Filing-only GET and embedded read-only section; before/after legal state, events and receipts unchanged by Pre-flight reads. No new write gate. | NOT_RUN |
| PF-AC-02 — one authorized snapshot | Resolve filing and subject, evaluate shared guard/checklist facts and return rows/Ready/meta.AsOf from the same authorized snapshot. No inconsistent separate reads; missing/foreign/revoked/inactive scopes follow the resolved denial contract. | NOT_RUN |
| PF-AC-03 — E-1 missing PACKAGE | Failing-first missing-PACKAGE reproduction and purpose isolation, with proof-required/no-proof/legacy paths parameterized against the actual compared guard context. No OUTCOME-as-PACKAGE shortcut. | NOT_RUN |
| PF-AC-04 — E-2..E-5 | Retired criteria absent; recorded OWNER waiver maps to WAIVED with rationale/provenance; pending mandatory assessments and open disputes block exactly when shared guard rules block. Display state does not invent authority. | NOT_RUN |
| PF-AC-05 — E-6/E-7 | Wrong/invalid subject and foreign filing uniform hiding; >200 rows follow the specified non-pagination/logging behavior without false completeness/Ready, with measured size/cost. No silent truncation or invented performance pass. | NOT_RUN |
| PF-AC-06 — guard-alignment pin | Memory+PostgreSQL truth table on identical fixture, actor/scope/time/current+target stage and non-proof command context. Include PACKAGE/SIGNATURE/OUTCOME, waiver, expiry/dispute, version promotion, no-proof signatures, reopened proof epoch and terminal/illegal-stage cases as relevant to the resolved comparator. Ready == guardAllows for that exact documented predicate. | NOT_RUN |
| PF-AC-07 — API/error contract | Standard data/meta envelope and requestId/asOf, deterministic DTO/state fields, read classification and agreed status/hiding/error behavior; failure is not an empty/ready checklist. | NOT_RUN |
| PF-AC-08 — FE / revalidation | Three purpose groups, state plus cause text, real action links, recorded waiver rationale, as-of header; data revalidates after relevant mutation. Preserve Focus/drafts/UNKNOWN identity and independent axes; VIEWER can read, not gain write authority. | NOT_RUN |
| PF-AC-09 — language / accessibility | EN canonical and VI parity with draft/ratified distinction; R10 terminology before merge. Keyboard reachability, textual chips, focus and existing Solid Glass tokens; zero new dependency. | NOT_RUN |
| PF-AC-10 — required gates | Design §4.5 BE matrix/E-1/authz/guard pin, `make check` on new owned PG with race; FE focused tests and tsc. Scoped FE rules additionally require `pnpm check`, production build and Storybook if applicable. Exact commands/UTC/exits/failures/skips retained. | NOT_RUN |
| PF-AC-11 — measurable performance | Measure on a documented synthetic fixture of roughly≤100criteria/filing against the assumed p95<200ms; state warmup/sample/runtime/query scope and report failure honestly. This is not a production SLO or release approval. | NOT_RUN |
| PF-AC-12 — independent / rendered gates | Nonauthor source/contract review on final pins; real browser, screen-reader and M1–M5 usability script evidence when permitted. Design mentions M1–M5 but does not provide step definitions here; attach actual scenario/expected-result script, do not invent a completed trial. Missing tooling/participants remains NOT_RUN/BLOCKED, never self-waived. | NOT_RUN |

Tests/builds are NOT_RUN in this intake because implementation is not assigned for execution. No FE/BE/DB/IdP start, fixture provisioning, provider action, commit, merge or external reviewer dispatch is authorized by the intake.

## Outputs and next action

Intake outputs: this task, `docs/reviews/preflight-design-intake-20261103.md`, and `docs/testing/preflight-intake-20261103-r1/` with working-tree input pins and read-only checks. Future implementation produces one source diff, updated operation/test contract and final evidence under its separately named implementation namespace; never rewrites this intake or historical review.

Next: let the active ZCode RLF writer finish its current assignment and return a stable packet. Codex reconciles it, closes the narrow contract clarifications with the design author, then sends the exact guard/review packet to OpenCode for scoped re-verification/re-pin. Once DoR passes, record READY and explicitly release the Local Codex implementation assignment. No reroute or new approval loop is required for the already accepted product scope; material deviations remain PO decisions.

If a future normal commit is refused, retain/classify the actual refusal and use a supported audited resolution path. Historical playbook actions are not executed by this task; no hook/settings/ledger edit, alternate commit route or automatic retry is assigned.

## Status history

2026-11-03 local: PROPOSED_DISPATCH intake → ACCEPTED_BY_LOCAL_CODEX → task BACKLOG, with PF-DEP-01/02 and contract clarifications recorded. Future implementation NOT_STARTED; reviewer PLANNED_NOT_DISPATCHED. Exact UTC and hashes are in the intake receipts. No implementation or product DONE claimed.

2026-11-05 (status correction — found stale during MC-ZCODE-CERT-01 setup, PO instruction "sửa 2 phát hiện"): the record above said implementation NOT_STARTED, but a pre-flight implementation EXISTS in the tree — commit `ceb958c3` "feat(filings): add filing preflight checks across backend and frontend" (domain `filing_preflight.go` + route + `PreflightPanel`), reached main via merge `c7ee772c`. Author records attribute it to ZCode under a PO reroute; this entry records that discrepancy instead of rewriting the intake's assignment text. Author-reported gates (session/workboard records, NOT independently re-verified here): backend `make check` with PG + race green, FE vitest/build/storybook green, composition bench ≈682µs/100 criteria. The PF-AC matrix above remains NOT_RUN pending the non-author review. The review handoff `docs/implementation/handoffs/MC-OPENCODE-PREFLIGHT-IMPL-REVIEW-20261103-PROMPT.md` is still PROPOSED_DISPATCH — dispatch is a PO/Codex action item. MC-ZCODE-CERT-01 stays gated on that review returning PASS. No DONE, no product acceptance, no intake-text rewrite.
