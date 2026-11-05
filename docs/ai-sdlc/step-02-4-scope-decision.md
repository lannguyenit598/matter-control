> **Current decision:** Human [DEC-028](inta-po-approval.md) selects INT-D01=INT-A at e7dbfbf. The unselected/awaiting-choice wording below is historical preparation. Execution now follows the [selected INTA-1 contract](../implementation/inta-approved-contract.md) and manual task gates; no runtime result is inferred.

# Step02.4 — Product Owner Integration Scope Decision

Owner Codex PM/BA/Cloud/DevOps,2026-10-25 Asia/Ho_Chi_Minh. Task MC-002-INT-PLAN-024. Repository matter-control, branch task/MC-002-solution-architecture, base a7e99929e842105c7941b469422f4bfb7778bf82. **PROPOSED / WAITING_PO_SCOPE_DECISION. Selected option: NONE.** The Step02.4 request authorizes decision preparation, not an integration option or implementation.

## A. Short Product Owner decision package

The complete [runtime request](step-02-runtime-decision-request.md), [architect option set](../architecture/integration-scope-proposal.md) and [INT-D01..09 analysis](../architecture/api-auth-decision-analysis.md) are the sources. Official IDs are retained; A/B/C are not renamed. The only decision needed to choose the next local milestone is **INT-D01**.

| Decision | Existing exact options | Recommendation / trade-off | Approval required |
|---|---|---|---|
| INT-D01 local integration | INT-A temporary Next.js runtime harness; INT-B authenticated temporary harness; INT-C defer until a product API/auth seam; INT-A0 Node-only runner is conditional on reported INT-A infeasibility | Keep INT-A recommendation. It finds actual Next-runtime/client/REST/Go/PostgreSQL compatibility defects with no backend or product-src change, but excludes authentication, authorization and Workspace/Matter isolation. INT-C is the viable deferral. INT-B is not implementation-ready; INT-A0 is not currently eligible and is never an automatic fallback | PO selects scope and explicitly approves the temporary harness endpoint/evidence limits |
| INT-D02 identity | ID-A external OIDC; ID-B Cloudflare Access JWT; ID-C self-hosted OIDC | Keep unselected for INT-A; provider terms, lifecycle and token behavior need evidence. No provider choice is needed for transport | PO later; not part of INT-A approval |
| INT-D03 authorization/isolation | Approved policy has no alternative: active Workspace membership AND explicit Matter membership AND scoped role; candidate enforcement is technical | Preserve approved policy and later negative tests. Workspace OWNER has no implicit Matter access. No reapproval requested | Claude owns enforcement design; PO for material policy change |
| INT-D04 production topology | H1 hybrid native origin; H2 Containers; H3 Go/Wasm bridge; H4 TS/D1 is recorded but not proposed; H5 local already approved | Keep production unselected. H1 needs hosting exception/evidence; H2 has a dated paid-plan conflict; H3 is unproven; H4 changes approved stack | PO later before material topology/cost change |
| INT-D05 frontend deployment | F1 vinext; F2 OpenNext; F3 static SPA; F4 Node cohosting | Keep unselected; exact feature/runtime compatibility unverified; local Next-dev harness selects none | PO later on material trade-offs; Claude recommendation |
| INT-D06 storage/recovery | Managed or cohosted PostgreSQL, R2 or S3-compatible store following topology | Preserve PostgreSQL direction and local restore targets; no production providers/objectives selected. Tiny tooling restore is accepted only in its original scope | PO later for provider/objective/cost; Claude mechanism |
| INT-D07 retention/limits | Numeric values, no competing structural design | Keep numeric deferral; do not invent legal/history/receipt retention, preview expiry or import/export loads | PO later with relevant business/legal input |
| INT-D08 production cost/workload | Keep goal and gather evidence, or later approve a cost exception | W1 is local test input, not capacity. Full bill/account/quota fit remains unknown; no paid activation | PO later for envelope/cost exception |
| INT-D09 product errors/retries | Values/header/catalogue convention to be proposed for product endpoints | Native retryAfter1 remains native only; no new unit/range/header or product receipt guarantee | Claude proposal and PO later |

Only choices already recorded are presented. The table is an approval agenda, not approval of any entry. Cloudflare price/limit references are inherited dated evidence; no new price/account verification occurred.

### INT-D01 options: required twelve-field analysis

**Decision ID:** INT-D01. **Exact question:** Which recorded local integration scope, if any, should execute before compatible product API/auth exists? **Approved baseline:** H5 local, W1/restore test targets, ARCH-Q3/Q5, requirements/roles, Go/PostgreSQL/Next direction, accepted C01-NATIVE52b60a4/R01/R02 and scoped native frontend/restore evidence. No integration/auth/provider/production scope is selected. The fifteen historical architecture/ADRs remain candidates awaiting overall approval; the wording “approved ADRs” in the request does not promote them.

| Required field | INT-A | INT-B | INT-C | INT-A0 |
|---|---|---|---|---|
| Exact recorded option | Temporary Next.js runtime harness | Authenticated temporary harness | Defer until product API/auth exists | Node-only runner |
| Benefit | Real Next-runtime→client→REST→unchanged Go→real PG compatibility evidence | Can explore local token-validation plumbing if separately designed/approved | Avoids temporary harness work; product-scope auth and transport can be evaluated together later | Small transport diagnostic if Next harness is shown infeasible |
| Trade-off | Temporary test root/endpoint; no product security/UI proof; Next import/bind/build-exclusion feasibility unverified | Extra middleware/key/token lifecycle and identity decision; User data has no product authz model; signature success cannot prove access control | Compatibility defects surface later; no local integration result now | Omits actual Next runtime; falls short of requested seam |
| API/Auth impact | Existing native User API only, temporary harness contract; no auth/session change | Needs revised API/auth boundary and INT-D02; not a drop-in variant of A | No API/auth change now | Same native transport only; no Next/session proof |
| Security impact | Unauthenticated synthetic local transport only, loopback/opt-in/production exclusion; no bypass of product session and no real legal data | Must use approved scoped test identity, fail closed and distinguish authentication from authorization; no shared/hardcoded demo identity | Existing gaps remain explicit; no new security mechanism | Same transport-only evidence limits as A |
| Backend/frontend impact | Go52b60a4/source unchanged; Antigravity adds isolated Next test root outside src/ and uses unmodified shared client | Backend middleware and auth interaction need a new bounded design; no implementation before that approval | No changes | Different test runner, no product-src/backend change; only after separate exception |
| Testing impact | If chosen and frozen:36 existing local rows required;14 product rows deferred; D-14 production feasibility separate | Rework/review applicability and auth fixtures first; none of A's row set is silently relabeled as product auth proof | No current runtime execution; rebind/review row applicability later | Reauthor/review A–E; cannot claim Next-runtime coverage |
| Cloudflare/cost impact | Local only; no adapter/provider/paid activation; local bill unmeasured, production/$0 unproven | Additional identity/hosting cost and coupling unverified | No activation; production choices still open | Same unverified production/cost boundary |
| Recommendation and reason | **Recommended**: directly follows the reviewed minimum transport proposal, reuses real accepted native behavior and avoids new product functionality | Not recommended now: complexity without Workspace/Matter authorization proof | Recommended alternative if PO requires real product auth/isolation in the same milestone | Do not choose now: no reported A infeasibility; never implicit fallback |

The baseline paragraph, decision ID/question and comparison together cover the12 requested decision fields, including the existing options, baseline, benefits, trade-offs, all impacts, recommendation and rationale.

## B. Proposed integration scope, conditional on INT-A

**Important difference from the Step02.4 desired principle:** the existing INT-A option validates real Next.js→native REST→Go→PostgreSQL, but does **not** test authentication behavior, authorization or Workspace/Matter isolation. These are mandatory future product gates, not waived requirements. If PO wants those in this milestone, INT-C defers to a compatible product API/auth slice; requesting INT-B preparation means a revised design/decision package first. There is no new official “full authenticated minimum slice” option in this package.

**In scope if INT-A is selected:** isolated Next development-runtime harness and one expressly approved temporary endpoint; existing shared client and separate wire controls; existing User create/read/PATCH, validation/duplicate/stale errors; real new synthetic PG connectivity and Go/PG restart persistence; unavailable/recovery and unknown-write handling without retries; source/artifact isolation; correlation/privacy evidence and owned-resource teardown. Exact methods, statuses, fields, fixed refId template and value/truncation semantics are in the unchanged reviewed [scope contract](../architecture/integration-scope-proposal.md).

**Out of scope:** product authentication/provider/session, roles and Workspace/Matter isolation, product User identity, product pages/Task→User aliases, Matter/state/evidence features, receipts/idempotency/UoW/full product error catalogue, enterpriseSSO, production build/start/runtime adapter, provider/account/paid activation, cloud deployment/cost proof, full product restore/cadence, Step03 design edits. Approved Requirement versus Action and all five independent state axes remain unchanged; synthetic User transport is not Matter readiness or proof.

**Dependencies:** explicit INT-D01 record including temporary endpoint and exclusions; ARCH-FINAL freeze of remaining literals/case allowlist, reserved test addresses, harness root and exact allowed paths; owner acknowledgements and verified new worktrees/actual heads; source/route feasibility checks; verified capped owned environment with fresh unlogged credentials; independent evidence review. No rerun of closed Step02.3 clarification is needed. A material architecture deviation follows Claude's existing decision/approval process.

**Acceptance:** the36 applicable local rows execute with exact assertions and independent verification; Next execution is real, not plain Node/mock; backend52b60a4 and frontend src/shared client/dependencies/lockfile stay unchanged; raw wire observations are not attributed to body-only client calls; truncated bodies never satisfy full-state assertions; no false success/empty/unapplied claim on outage; unknown POST stays unknown without mutation probe/retry; no real data/secrets in logs/artifacts; harness excluded from production app/build and owned resources safely stopped. A local PASS closes only selected local evidence, not any separate gate below.

### C01-PRODUCT and acceptance limits

C01-NATIVE is accepted with limitations, no reopening. INT-A can repeat only new integrated-path observations: native503 propagation through Next/client, problem parsing, fixed native detail, transport failure/recovery, native CAS and real persistence. Those checks are not the complete native baseline rerun.

C01-PRODUCT remains OPEN: inaccessible-resource/current-rights uniformity; product identity/auth store; receipts/idempotency/unknown-commit recovery; MatterUnitOfWork/locking/revocation; product log/error/retry conventions; candidate deployment-adapter behavior where applicable. None becomes satisfied by INT-A. Full P0 remains broader than this milestone; D-01..D-13/D-15 need later product slices and D-14 production feasibility evidence.

## C. Runtime coverage and exact execution boundary

See the [51-row classification and procedures](../testing/step-02-4-runtime-classification.md). No IDs or original expected contracts/results are changed.

| Measure | Current: no option selected | Conditional after INT-A selection and contract freeze |
|---|---:|---:|
| Total existing cases | 51 | 51 |
| REQUIRED_FOR_SELECTED_INTEGRATION_SLICE | 0 | 36 |
| NEEDS_SCOPE_DECISION | 36 | 0 |
| DEPENDS_ON_LATER_PRODUCT_IMPLEMENTATION | 14 | 14 |
| BLOCKED_BY_EXTERNAL_FEASIBILITY | 1 (D-14 production gate) | 1 |
| NOT_RUN | 51 | 51 until actual execution |

“Required now” is zero executable tests. The36 are a candidate workload, not an approved run. D-14's blocker concerns production provider/topology/cost evidence; it does not block choosing or later running local INT-A. Choosing INT-B/INT-A0/INT-C requires explicit reclassification/review; these counts are not transferred automatically.

## D. Proposed agent execution plan

Use the [existing conditional task plan](../implementation/step-02-integration-task-plan.md) plus [gated manual planning prompts](../implementation/handoffs/MC-002-INT-024-CONDITIONAL-PROMPTS.md). These prompts are not implementation task contracts or dispatch; exact contracts are issued only after PO scope selection.

| Owner | Future responsibility and prerequisite | Expected return / independent reviewer |
|---|---|---|
| ZCode | For INT-A, operate unchanged52b60a4; verify native contract/config/source and focused connectivity; no new API/auth code. Wait for PO record, frozen contract, acknowledged paths and ENV | No-diff source identity, native process/migration/HTTP evidence; OpenCode verifies. Material deviation → Claude |
| Antigravity | If INT-A, isolated Next harness using real shared client, native schema and error handling; production exclusion/opt-in/loopback; no auth interaction is added. Confirm cross-root/bind/glob/cache feasibility before proceeding | Bounded test-only diff and actual Next/client/wire evidence; OpenCode verifies; stop for scope/architecture variance |
| OpenCode | Review frozen applicability/owner diffs, independently verify local contracts/runtime evidence and privacy, plus future auth/authz negatives only under their approved product scope | Per-case observed versus expected and execution-versus-packet-review provenance; no PASS from narratives alone |
| Codex | PO decision record/owner contracts, isolated worktrees and new capped Docker/PG fixture, orchestration/evidence/safe stop; keep cloud/cost/recovery gates separate | Empty verified DB before DSN handoff, owned identity/lifecycle and redacted manifests; OpenCode verifies |
| Claude Code | Solution Architecture Authority for material API/auth/provider/stack/contract deviations and later conformance, not repeated Step02.3 clarification | Bounded disposition/approval process when triggered; existing current-round OpenCode closure preserved |

Order: PO scope decision → selected-contract freeze and exact owner contracts → backend/frontend feasibility/implementation within approved paths → verified local ENV before runtime → owner smoke → independent OpenCode verification → applicable architect conformance → Codex evidence intake. Contract-driven work may overlap only after interface freeze and separate ownership; no new agents/engineering jobs are spawned now.

Step03A remains a parallel design workstream. The [Design Impact Notice](../implementation/design-impact-notices/INT-D01-step-02-4.md) records possible effects; it is not sent and no design worktree/artifact is changed. Neither Step03A nor Step03B is marked DONE.

## E. Current gates

| Gate | Current status |
|---|---|
| Step02.3 clarification | PASS_DOCUMENT_ONLY; F1..F4/PREREQ-01/02 document-closed at a7e9992; no repeated Claude review |
| Step02.4 planning | Codex-authored planning/structural checks only; no new independent provider review claimed |
| PO integration scope | **WAITING_APPROVAL / NONE_SELECTED** |
| Runtime execution | NOT_STARTED;51NOT_RUN |
| C01-NATIVE / C01-PRODUCT | Native accepted with limits / product OPEN |
| MC-002 / overall architecture | OPEN / Architecture Approval Gate NOT_PASSED |
| Cloudflare production / full cost / recovery | Separate unresolved gates; no implication from local planning or a later local PASS |

## F. Exact Product Owner response

Choose one response. These are options to copy, not approvals already received.

**INT-A — recommended:**

> Tôi chọn INT-A cho INT-D01: phê duyệt technical integration local qua harness tạm chạy trong Next.js, endpoint harness được cô lập ngoài app/build sản phẩm, gọi Go52b60a4 không đổi và PostgreSQL mới chỉ dùng dữ liệu synthetic. Tôi chấp nhận milestone này chỉ kiểm chứng transport, chưa kiểm chứng authentication, authorization hoặc Workspace/Matter isolation; các gate sản phẩm đó vẫn bắt buộc về sau. Sau khi chốt hợp đồng và task cụ thể, cho phép triển khai/kiểm thử đúng phạm vi local đã nêu. Không phê duyệt production, provider/paid services, Cloudflare/$0 hay Step03.

**INT-C — defer:**

> Tôi chọn INT-C cho INT-D01: hoãn integration runtime đến khi có API/auth sản phẩm tương thích và phạm vi được duyệt. Chưa triển khai harness hay chạy runtime tests.

**INT-B — request a revised design, not execution:**

> Tôi muốn chuẩn bị lại phương án INT-B có authentication để quyết định tiếp. Chưa phê duyệt triển khai hoặc chạy tests; cần làm rõ identity, authorization/isolation được kiểm chứng đến đâu và các thay đổi kiến trúc trước khi giao việc.

INT-A0 is unavailable as a current shortcut: only a reported INT-A feasibility failure and a separate explicit PO reduced-scope decision can enable it.

**Stop: Product Owner Integration Scope Approval Gate.** No option is inferred from this request, recommendation, provider-review permission or preparation of prompts.
