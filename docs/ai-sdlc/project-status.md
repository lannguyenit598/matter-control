# Project Status Dashboard

Current ownership amendment — 2026-10-26: the Product Owner assigns both backend and frontend development to ZCode. Future frontend/Next/driver assignments, including pending INT-A stage1, use ZCode; historical Antigravity results below retain their actual authorship. See [current workflow](current-workflow.md) and [RACI](raci-matrix.md). No runtime execution, product-scope expansion or gate approval follows from this reassignment.

## Unified coordination checkpoint — 2026-10-26

Continue on `codex/unified-project-flow` at `/Users/nguyenvanlan/Documents/code/pet-projects/matter-control`. [Current workflow, owners and next actions](current-workflow.md) consolidates integration, design and backend intake. The Product Owner authorized merging the two coordination branches; this is not product, architecture, design or release approval.

- Integration: imported MC-002 history through `7cdde53`; latest committed checkpoint records accepted R4 source review and provisioned local PostgreSQL, with runtime acceptance still pending. A local untracked backend runtime return is retained and must be reconciled before repeating start/migration steps.
- Design: imported MC-003A history through `2c14cbb`; concept/local-r3 and reviewed contract candidates exist. Latest committed F-08/F-10 intake records targeted rework/decision items; G3 NOT_VERIFIED, G4 PENDING, G6 REWORK_REQUIRED, STEP03B NOT_AUTHORIZED.
- BE-01 and F-08/F-10: the Product Owner reports both activities performed. Reconcile the newest returns with the committed intakes; do not reassign the original tasks or infer accepted implementation from a report alone.
- Previous sections below retain historical workstream evidence. Read their dates and subsequent intakes before treating a historical status as current. Branch consolidation does not advance any acceptance case or approval gate.


As of 2026-10-25 Asia/Ho_Chi_Minh. Owner: Codex. Current task: [MC-002-INT-A](../implementation/tasks/MC-002-INT-A.md) within [MC-002](../implementation/tasks/MC-002.md), authorized by [Step 02](step-02-request.md) and [Step02.1](step-02-1-request.md). Step01 closure remains recorded.

**Step 00A: COMPLETED. MC-00A: DONE for reviewed baseline 20f12fe. Step 01: COMPLETED / PRODUCT_REQUIREMENTS_APPROVED. MC-001: DONE. Step 02: IN_REVIEW / WAITING_APPROVAL / REMAINING_FEASIBILITY_OPEN / ARCHITECTURE_APPROVAL_NOT_GRANTED.**

| Area | Current state | Evidence / next gate |
|---|---|---|
| Identity / direction / scope | APPROVED_INPUT, unchanged | Seven JTBD; 20 P0 / 14 P1 / 7 P2; three workflows |
| Source provenance | Approved prompts valid; originals optional | context-provenance.md; no direct A/B verification claimed |
| Step 00A independent review | PASS_WITH_LIMITATIONS, no Critical/High | Actual OpenCode opencode/big-pickle review of 11 exact snapshots at 20f12fe; review/result under docs/reviews |
| PRD / SRS | APPROVED_BY_PO, subject 572835a | 7 BR, 20 FR, 14 NFR; all P0 specified |
| Domain / state / business policy | APPROVED_BY_PO | 21 RULE entries, five axes and permissions; DEC-016 / approval record |
| Stories / acceptance | Authored, runtime NOT_RUN | 20 US; 63 AC including 18 priority scenario categories and three end-to-end workflow contracts |
| UX | local-r3 concept and handoff exist; MC-003A REWORK_REQUIRED | Rendered validation and independent Design QA pending; latest F-08/F-10 returns need reconciliation |
| Open decisions | OBD-02..08/10/11 approved B (OBD-08 B/B); OBD-01 previously resolved | DEC-016/017; numeric workload/retention/RPO/RTO explicitly deferred to Step 02; feasibility remains UNVERIFIED |
| Step 01 independent testability review | PASS, round 2 | Actual OpenCode opencode/big-pickle review; all 10 findings resolved; exact hashes and returned reports in REV-01 |
| Architecture execution | AUTHORED / CORRECTED / DOCUMENT_REVIEW_PASS | Actual Claude15-file candidate,134+30 corrections; actual OpenCode round2/final PASS_DOCUMENT_ONLY; exact final manifests; overall PO architecture approval remains pending |
| Infrastructure | H5_LOCAL_APPROVED / DEPLOYMENT_UNVERIFIED | DEC-023..025: H5 and W1/restore local targets approved, ARCH-Q3/Q5 accepted; Docker local reachable; owner-tool gates remain |
| Full product implementation / high-fidelity UI / production deployment | Overall approval remains gated; bounded BE-01 activity reported by PO | Verify BE-01 actual return/acceptance separately; STEP03B and production are not authorized by this merge |
| Git | Local documentation and evidence manifests | No push/PR; exact revision in commit history |

## Step 01 quality gate

| Criterion | Documentation assessment | Approval/evidence gate |
|---|---|---|
| Clear PRD / complete SRS | PASSED, documentation | Explicit PO policy approval at 572835a; author validation report |
| 20 P0 coverage / 7 JTBD trace | Prepared | Full traceability checks; no scope cut |
| Domain consistency / critical rules | PASSED, documentation | OBD-02..08/10/11 explicitly approved by PO; no self-approval |
| Three testable workflows | Main/alternate/exception paths, proof/history and AC | Product runtime tests NOT_RUN |
| Permission matrix | APPROVED_BY_PO | OBD-08 B/B and OBD-02 B; runtime enforcement NOT_RUN |
| Measurable AC / NFR | Concrete expected outcomes; missing benchmark values explicit | OBD-09/10/11 and later measurements |
| Critical business decisions | APPROVED_BY_PO | MC-001 DONE; numeric deferral accepted without waiving downstream gates |
| Architecture handoff / traceability | Ready with approved policy vs deferred numeric inputs | Step02 was not started at Step01 closure; current architecture state is recorded below; downstream implementation/tests remain pending |
| Independent testability review | PASS for pinned round 2 snapshot | All 10 findings resolved; document review only, no policy approval or runtime proof |

## Continuity and stop

Step 00A twelve exit criteria passed at 20f12fe; its structural/semantic report remains historical evidence. Actual independent baseline review now supports MC-00A closure only, not new Step 01 rule approval. MC-000 bootstrap governance still IN_REVIEW.

Product Requirements Approval Gate passed by explicit human answers on 2026-10-24; [approval and closure](step-01-approval.md), DEC-016/017. MC-001 DONE covers documentation only. Step02 is explicitly assigned by the current directive; stop at Architecture Approval Gate. No automatic full implementation, Step03/UI or production deploy. Numeric workload/retention/RPO/RTO deferral is approved; values/feasibility and downstream release evidence remain open. Original A/B archival is not a gate.

## Step 02 live execution


Step01 gate VERIFIED PASS at54e1db5, approved behavior572835a, DEC-016/017. Actual Claude Code2.1.309 / claude-opus-5-5 authored15 architecture files and returned134+30 exact replacements. Actual OpenCode2.1.4 round1 (opencode/big-pickle) returned CHANGES_REQUIRED, followed by round2 and final (opencode/glm-5.3-flash-free) PASS_DOCUMENT_ONLY. Final session ses_e92505488ffe3ySTAWXz7qxG2c exit0; no High/Medium reported;2Low notes dispositioned in [review](../reviews/step-02-review.md). Models come from exported metadata; Codex made no model/provider/global setting change. [Delivery report](../reviews/step-02-delivery.md), [execution](../reviews/step-02-execution.md), [concrete approval packet](step-02-approval-packet.md).

Fresh host verification corrects the earlier sandbox-only integrity blocker: both installed apps pass codesign and Gatekeeper; no reinstall is required by current evidence. ZCode CLI remains blocked by missing packaged provider config. Antigravity CLI1.4.7 returned a supplied-source frontend audit using requested gemini-3.8-flash-high / effort high, exit0; no engineering PoC ran. [Recovery evidence](../tooling/step-02-1-recovery.md). Runtime owner tasks are PREPARED / WAITING_MANUAL_DISPATCH. Codex completed a tiny synthetic PostgreSQL tooling restore; product restore and integration remain NOT_RUN. Overall MC-002 is NOT_DONE; Architecture Approval Gate remains NOT_PASSED. No production, paid/cloud activation, Step03 or product source changes.

## Step 02 PO continuation — local validation approved

Direct PO answers on2026-10-24 approve H5 local technical validation, W1 measurement envelope, local RPO24h/RTO8h exercise targets and ARCH-Q3/Q5 interpretations (DEC-023..025). [Exact approval](step-02-local-approval.md). Do not re-request these approvals. Hosting, provider, adapter, identity, storage, retention, import/export demand and production commitments remain open; this is not blanket architecture approval or Step02 closure.

Codex read-only local preflight: Docker Engine29.8.2 reachable through the selected local Unix socket, Compose5.6.0, Linux/aarch64,10 allocated CPUs and8319504384 allocated memory bytes; Go1.27.3, Node24.22.1, pnpm12.11.2. [Commands and outputs](../testing/step-02-local-preflight.json). That earlier preflight created no resources. Step02.1 created two new pairs (four total) of network-isolated synthetic PostgreSQL containers across the initial drill and corrected recheck, stopping each after evidence capture, without volumes or port exposure. No backend/frontend dependency install/build/runtime PoC or cloud mutation occurred.

## Step02.1 current result

Completed: repository/approval preservation, host provenance correction, actual Antigravity supplied-source audit, synthetic PostgreSQL tooling restore and complete manual owner prompts. [Execution report](step-02-execution-report.md); [validation](../testing/step-02-poc-validation.md). Backend/frontend runtime and Next→Go→PG integration NOT_RUN; full product recovery and Cloudflare production/cost remain UNVERIFIED. Existing architecture document review is not a runtime gate waiver. Actual new-evidence OpenCode review and final recheck both PASS_WITH_LIMITATIONS; all3Low closed, no new High/Medium/Low. This is document/evidence review without independent runtime replay.


Final Antigravity capability probe confirms RunCommand is auto-denied in headless mode; exit0/empty SUCCESS did not execute even the requested synthetic Git read. No global permission workaround was applied. Manual runtime dispatch remains required.


## Frontend manual handoff received — current intake

The user returned actual Antigravity MC-002-FE local template execution evidence after4a6b8f9; earlier frontend runtime-NOT_RUN/manual-waiting statements above describe the prior checkpoint and are superseded for this native Node baseline only. Original source and isolated worktree remain clean at3e5a642. All11 log hashes match. Logs show99unit/9E2E passes and successful Next/Storybook builds; no Cloudflare adapter/Go integration/production proof. Actual OpenCode review returned CHANGES_REQUIRED for documentary evidence overclaims; Codex corrected report/manifest provenance and scope without re-running tests or changing source. Final independent recheck PASS_WITH_LIMITATIONS, all7 actionable findings resolved. [Intake](../reviews/step-02-frontend-intake.md). Backend artifacts are present but outside this frontend-only intake; no backend acceptance is inferred. MC-002 and Architecture Approval Gate remain open; Step03 not started.


## Backend manual handoff received — current intake

ZCode returned the native backend template PoC on clean/pinned d024e3e with build/migrations/race-package runs/container image/API/CAS/persistence/DB-down/recovery/guard evidence. Codex verified binary hash and read-only retained resource identity; no replay. Actual OpenCode PASS_WITH_LIMITATIONS covers template characterization, with R01 per-test skip enumeration and R02 invalid-config argv/error evidence still requiring owner rechecks. Metadata/privacy corrections were applied; actual correction recheck verified M01..M05; R01/R02 remain open. Actual Claude confirms C01 data-path500 vs product503 unavailable+retryAfter is a future implementation obligation under unchanged contracts, not an ADR waiver. [Backend intake](../reviews/step-02-backend-intake.md).

Frontend native baseline remains independently accepted with limits. Receiving both returns does not authorize integration: backend verification gaps and the compatible API/auth seam remain unresolved. MC-002 remains NOT_DONE / EVIDENCE_REWORK_REQUIRED / WAITING_REMAINING_APPROVALS; production/Cloudflare/cost/full recovery and Step03 remain gated. Prior backend NOT_RUN/manual-waiting checkpoint statements above are superseded only for this returned native characterization.

## R01/R02 final evidence closure — current state

Actual ZCode focused recheck returned at governance74fbdec; Codex verified18/18 byte-identical exports versus /tmp originals,17 payload hashes,880 valid JSON events,205 named pass/0fail/0namedskip (parents/subtests included),11 test-bearing packages plus5 no-test packages, and4 paired config/migrate errors with exit1. Source/binary unchanged. Actual OpenCode session ses_e91610e71ffeC42yXslkK7ke8v / opencode/glm-5.3-flash-free returned PASS_WITH_LIMITATIONS, R01 PASS/CLOSED and R02 PASS/CLOSED. [Closure](../reviews/step-02-backend-r01-r02-closure.md).

This supersedes R01/R02-open/manual-waiting statements in prior checkpoints above. Backend native template evidence and frontend native baseline have independent scoped review; no owner recheck remains for these two findings. Do not rerun accepted baselines without a new defect. MC-002 remains open for C01 future implementation obligation, compatible API/auth integration seam, remaining product-critical PoCs and architecture/Cloudflare/cost/PO gates. No product, production or Step03 approval.

## Step02.2 — current authorized continuation

[Exact request](step-02-2-request.md), governance basef0f82a6. R01/R02 remain CLOSED, no baseline/restore reruns. Actual Claude returned DISPATCH_READY for C01-NATIVE plus SQLSTATE-first edge-case amendment; [task](../implementation/tasks/MC-002-BE-C01.md) is PREPARED / WAITING_MANUAL_DISPATCH to actual ZCode, no implementation yet. C01-PRODUCT remains OPEN. Frontend native baseline is VERIFIED with limitations; no Antigravity redispatch. Integration is PENDING for C01-native and compatible approved scope/API/auth. Existing tiny restore drill has actual evidence/review; full-product recovery and RPO cadence remain unproven. Ten public Cloudflare sources refreshed; production feasibility and complete cost remain UNVERIFIED/UNKNOWN. [Independent workstream matrix and exact next action](step-02-remaining-gates.md). Overall MC-002 OPEN, Architecture Approval Gate NOT_PASSED, Step03 NOT_STARTED.

Step02.2 independent handoff-document review/recheck has now returned actual OpenCode PASS_WITH_LIMITATIONS, all3 actionable prompt findings CLOSED. [Review evidence](../reviews/step-02-2-opencode-handoff-recheck.md). Only the C01-NATIVE owner dispatch is next; no source implementation or dependent runtime/QA result is inferred.

## C01 implementation return — 2026-10-25 current checkpoint

Actual ZCode returned clean source fd747ae from d024e3e,16files, owner JSON1189lines/278namedpass/0fail/0namedskip (parents/subtests),11pkgpass+5no-test. Codex verified19exports and unchanged59protected inputs, then independently ran7focusedfunctions/66namedpasses withoutDB. Actual Claude reviewed source, accepted Echo/Huma context split and cancellation-first deviation, and returned CHANGES_REQUIRED for one cause-preservation test plus two doc/rule edits. [Current intake](../reviews/step-02-c01-intake.md), [bounded correction handoff](../implementation/handoffs/MC-002-BE-C01-ZCODE-REWORK-PROMPT.md). C01-NATIVE REWORK_REQUIRED/IN_REVIEW, not accepted; C01-PRODUCT OPEN. Native test success does not override required corrections. R01/R02 remain CLOSED; frontend/restore accepted scopes unchanged; integration/cloud/cost/full recovery and overall architecture approval still open. No Step03/deploy/paid activity.

Current actual implementation reviews: OpenCode source CHANGES_REQUIRED (F1test/F5docs/F6rule), evidence PASS_WITH_LIMITATIONS; actual Claude accepts current production behavior and dispositions M1 NOT_REACHABLE on existing probes. No native acceptance before correctedhead/checks/QA. [Intake](../reviews/step-02-c01-intake.md) records evidence qualifications and exact review identity. MC-002-BE-C01-R1 manual rework is the next action; older original-prompt waiting labels above are historical.

## C01 corrected native slice accepted — current

Actual ZCode R1 return52b60a4 contains exactly F1test/F5docs/F6rule changes; actual OpenCode sessionses_e90ff024dffeuJ1Kmcnp6qicY9, exit0, PASS_WITH_LIMITATIONS accepts C01-NATIVE and closes F1/F5/F6/E-03/F8. Current state NATIVE_PASS / PRODUCT_OPEN, no more ZCode rework or reassurance rerun. [Closure and exact limitations](../reviews/step-02-c01-native-closure.md). Owner279namedpass/0fail/0namedskip full suite and Codex2namedpass committed-head F1 check are distinct from reviewer packet-only verification; no DB replay by Codex/OpenCode. Original self-hash-list defects are preserved and resolved by a separately verified canonical inventory. Earlier rework/waiting labels above are historical. Integration/API/auth scope, full product/recovery/Cloudflare/cost and Architecture Approval Gate remain OPEN; MC-002 not DONE, Step03 not started.


## Step02.3 — current Integration/API/Auth decision gate

Actual Claude Code2.1.309 / claude-opus-5-5 returned the proposal and bounded correction (final session a6577bf0-ce08-4d72-9e69-3fa29bb7b00f, exit0); actual OpenCode returned independent proposal/testability review and authored the acceptance matrix (session ses_e8f69b65effeTBK0EZOkBIkSuD, exit0, PASS_DOCUMENT_ONLY). These are packet-only document results; every runtime acceptance row is NOT_RUN. [Execution and scope](../reviews/step-02-3-execution.md). A supplemental Claude clarification call failed Not logged in (exit1/is_error=true); prior successful proposals remain valid as proposals. The subsequent human [routing override](step-02-3-review-routing.md) supersedes the unsent Claude prompt for this round. Actual OpenCode reviewed/supplied the bounded value/refId/golden clarification, which is applied; PREREQ-01/02 are documentation-CLOSED. No supplemental Claude review/login is awaited for these current items. No auth flow/settings change.

Recommendation **INT-A**: isolated temporary harness executing inside the actual pinned Next.js runtime → existing frontend client → native REST UserAPI → unchanged Go52b60a4 → real new synthetic PostgreSQL. Raw wire controls are distinguished from client observations; no Task/User alias, new product feature, auth/session weakening or shared-principal bypass. Authentication, authorization and Workspace/Matter isolation are excluded from this local transport proposal and remain mandatory product gates. The shared /api/v1 prefix does not confer product conformance.

**WAITING_PO_APPROVAL at Integration/API/Auth Decision Approval Gate.** Only INT-D01 local scope/evidence boundary is needed now; INT-D02..09 preserve policy or remain separate future decisions. No production provider/adapter/paid service is selected, no $0 claim, no full-product/Cloudflare/recovery acceptance, no architecture approval, no MC-002 DONE and no Step03 action by this workstream. [PO decision package](step-02-decision-package.md), [conditional owner tasks](../implementation/step-02-integration-task-plan.md).

C01-NATIVE at52b60a4, R01/R02, native frontend and tiny tooling restore retain their accepted scopes/limitations; no replay. C01-PRODUCT stays OPEN. The fifteen historical normative architecture/ADRs and protected requirements/evidence remain byte-identical. No engineering dispatch, source change, database/container action or acceptance execution in Step02.3.


## Step02.4 — current Product Owner scope gate

[Exact request](step-02-4-request.md) authorizes planning only. [Decision package](step-02-4-scope-decision.md) presents existing INT-D01 options; INT-A remains recommended transport-only, INT-C defers, INT-B needs revised design and INT-A0 requires reported INT-A infeasibility plus a separate exception. **NO_SCOPE_SELECTED / WAITING_PO_SCOPE_DECISION.** The auth/authz/Workspace-Matter difference is explicit and needs PO choice; approved policy is unchanged.

[Classification](../testing/step-02-4-runtime-classification.md) preserves all51IDs:0required-now,36NEEDS_SCOPE_DECISION,14later-product,1production-feasibility (D-14); conditional INT-A after selection/freeze makes36required. All51NOT_RUN. No agent/runtime/implementation/environment dispatch or provisioning. Conditional manual prompts are planning templates only, not issued task contracts.

Step02.3 clarification PASS_DOCUMENT_ONLY at a7e9992 remains preserved; no repeated Claude review. Claude remains Solution Architecture Authority for material deviations/later conformance. C01-NATIVE accepted with limits, C01-PRODUCT and MC-002 OPEN; Cloudflare/cost/recovery gates remain separate. A governance Design Impact Notice is prepared, not sent; Step03A worktree/artifacts untouched, no Step03A/03B DONE. Stop at Product Owner Integration Scope Approval Gate.

## INT-D01=INT-A — latest approved local scope / manual handoff boundary

Direct human PO [DEC-028](inta-po-approval.md) explicitly selects INT-A at e7dbfbf and permits isolated local implementation/runtime verification after contract/tasks. Prior NO_SCOPE_SELECTED/WAITING_PO_SCOPE_DECISION descriptions are historical checkpoints, superseded for INT-D01 only. [INTA-1 selected contract](../implementation/inta-approved-contract.md) and [owner task contracts](../implementation/tasks/MC-002-INT-A.md) are prepared; actual source52b60a4/3e5a642 heads are clean and59protected files unchanged. Remaining scope/provider/product/architecture/cost/recovery gates are not waived.

ZCode required packaged provider files still absent; Antigravity headless engineering has a recorded explicit RunCommand denial. The approved manual-stop condition applies: [full owner prompts](../implementation/handoffs/MC-002-INTA-MANUAL-PROMPTS.md) PREPARED / NOT_DISPATCHED; no worktree/container/volume created, code built or harness implemented in this turn. Codex ENV awaits owner acknowledgements, OpenCode runtime QA awaits actual returns/verified ENV. Existing OpenCode PASS_DOCUMENT_ONLY remains documentation evidence; no new runtime verdict.

[Selected ledger](../testing/inta-runtime-status.json):36REQUIRED_FOR_SELECTED_INTEGRATION_SLICE,14DEPENDS_ON_LATER_PRODUCT_IMPLEMENTATION,1BLOCKED_BY_EXTERNAL_FEASIBILITY; all51NOT_RUN,0PASS/0FAIL. Frozen companion-harness root is outside the unchanged product checkout to avoid broad product globs; actual cross-root import/isolated runtime feasibility still needs owner evidence. Stop on infeasibility; no INT-A0/B/C fallback.

C01-NATIVE accepted with limitations/R01-R02 closed; C01-PRODUCT OPEN, MC-002 OPEN / WAITING_MANUAL_DISPATCH, Architecture Approval Gate NOT_PASSED. No product auth/authz/Workspace-Matter security, Cloudflare/$0 or full recovery proof. Claude handles material architectural deviations; no repeated closed Step02.3 clarification. Parallel MC-003A untouched; no production/paid/merge/Step03 completion action. Exact next step: human manually supplies BE/FE prompts and returns acknowledgements/feasibility; Codex then coordinates approved new ENV and later independent runtime QA.

## INT-A backend preparation received — latest checkpoint

Actual ZCode manual return: new /tmp/mc002-inta-be on codex/mc-002-inta-be clean52b60a4, source-stamped binary matching SHA256/size; Codex read-only build metadata vcs.modified=false,4/4exports byte-equal,3payload hashes valid. [Intake](../reviews/inta-backend-intake.md). Backend preparation IN_REVIEW, runtime WAITING_ENV. No case marked PASS.

Frontend/harness paths and install log appeared during intake; no frontend return/driver runId yet, no completion inferred or work disturbed. [Coordination](../implementation/inta-coordination.md): receive frontend feasibility/runId/request-ID plan, then Codex verifies/provisions only the approved new PG and privately hands DSN to ZCode. No new approval needed; no reassignment/rebuild/reassurance baseline replay. All51NOT_RUN, independent runtime OpenCode PENDING. No DB/container or binary launch in this intake; MC-002/C01-PRODUCT/cloud/cost/recovery gates remain OPEN, MC-003A untouched. Earlier blanket manual-waiting/no-owner-build statements are historical for the backend-preparation portion only. Please do not infer runtime/cleanup proof from build success or current no-listener snapshot.

## INT-A frontend return — current checkpoint (2026-10-25)

Actual Antigravity preparation return received at clean companion e25bbc6, unchanged frontend template3e5a642. [Codex intake](../reviews/inta-frontend-intake.md):5 export hashes/17 source entries/21 archive payloads verify; owner23unit passes and7 captured guard responses are qualified preparation evidence only. Actual [OpenCode source review](../reviews/inta-frontend-opencode-source-review.md), session ses_e8ee93b62ffeIfh87PcEY6Jutw, model opencode/glm-5.3-flash-free, returns CHANGES_REQUIRED. R01/R02/R03/R06 pre-upstream blockers; R04/R05/R07 required before evidence-producing execution; R08/R09 evidence corrections; R10 minor. Native schema mismatch, absent driver, restart-ID collisions, envelope/cap/control/startup defects require Antigravity rework, not a Go patch or new scope decision.

Frontend REWORK_REQUIRED; Codex ENV held; backend preparation remains IN_REVIEW / WAITING_ENV without rebuild. R1 manual prompt at docs/implementation/handoffs/MC-002-INTA-FE-REWORK-PROMPT.md is READY / NOT_DISPATCHED. Original returns/evidence preserved; no unknown-process cleanup permitted. Earlier frontend-pending/no-owner-implementation statements are historical. This source review does not satisfy independent runtime QA:51NOT_RUN,0PASS/0FAIL;36required/14deferred/1blocked. R-028/R-031 and product identity/isolation/C01-PRODUCT/Cloudflare/cost/full recovery/architecture gates remain OPEN; MC-002 not DONE, MC-003A untouched. Next: human sends R1 prompt, owner corrects bounded harness/evidence, OpenCode re-reviews; then verified new ENV and coordinated runtime.

## INT-A frontend R1 — latest checkpoint (2026-10-25)

Actual manual Antigravity R1 return received at clean6e2f65b (Gemini3.8Flash High owner-reported); R1 READY/NOT_DISPATCHED statements are now historical. [Intake](../reviews/inta-frontend-r1-intake.md):5raw/5export/25source/25archive hash checks verify,4raw-export copies byte-equal; all36IDs now present. Owner66unit passes/7files and7guardpasses with synthetic zero-upstream observation remain preparation sub-evidence, not matrix acceptance. Template3e5a642/backend52b60a4 clean.

Actual [OpenCode R1 source review](../reviews/inta-frontend-r1-opencode-review.md), session ses_e8e41d836ffeP3ZVDaQovlBEBD, tool-reported opencode/glm-5.3-flash-free, CHANGES_REQUIRED. Preserve source-only closures R01/R04/R05/R06/R09/R10, with residual identity caveat; R02/R03/R07/R08 partial. F01driver/F02IDstate/F03identity/F04startup are pre-upstream blockers; F06/F07guard-cleanup require correction before next evidence capture; F05/F08/F09 scope/provenance corrections. No material architecture deviation; proposed new server ENV gate is not adopted—driver-only readiness preserves frozen INTA-1. [R2 full manual prompt](../implementation/handoffs/MC-002-INTA-FE-R2-PROMPT.md) READY / NOT_DISPATCHED.

Frontend REWORK_REQUIRED; Codex ENV_HELD; backend preparation IN_REVIEW/WAITING_ENV, no rebuild. All51NOT_RUN/0PASS/0FAIL;36required/14deferred/1blocked, runtime independent QA PENDING. No Go/PG launch, source edits by Codex, paid/deploy/merge or MC-003A change. R-028/R-031 and C01-PRODUCT/product identity-isolation/Cloudflare/cost/full recovery/architecture/MC-002 gates remain OPEN. Next: human delivers R2, owner returns scoped corrections, OpenCode re-reviews before verified new ENV/runtime.

## INT-A frontend R2 — latest checkpoint (2026-10-25)

Actual manual Antigravity R2 received at clean79322fcb (Gemini3.8Flash High owner-reported); earlier R2 not-dispatched statements are historical. [Intake](../reviews/inta-frontend-r2-intake.md):5raw/5export/25source/25archive hash checks verify,4raw-export pairs match; owner80unit/7files and8guardpasses are preparation only. Template3e5a642/backend52b60a4 clean. Actual [OpenCode R2 source review](../reviews/inta-frontend-r2-opencode-review.md), session ses_e8e12de66ffeJEHGyEeCsomF6p, tool-reported opencode/glm-5.3-flash-free, CHANGES_REQUIRED. Identity/startup closures preserved. R2-F01 missing lifecycle barriers/F02 duplicate prevention after I/O/F03 preflight rejecting legitimate owned ENV block upstream; F04/F05 provenance/cleanup and F06 wire echo need correction; F07/F08 durability/claims, F09 minor. No material architecture deviation or new PO scope choice.

Frontend REWORK_REQUIRED; Codex ENV_HELD; ZCode preparation IN_REVIEW/WAITING_ENV without rebuild. [R3 complete manual prompt](../implementation/handoffs/MC-002-INTA-FE-R3-PROMPT.md) READY / NOT_DISPATCHED. Minimal driver/cleanup rework with fake-transport stage regression before OpenCode re-review; no backend/product patch. All51NOT_RUN/0PASS/0FAIL,36required/14deferred/1blocked; actual runtime QA PENDING. MC-002/C01-PRODUCT/product identity-isolation/Cloudflare/cost/full recovery/architecture gates OPEN. No PG/container/Go/paid/deploy/merge or MC-003A action.

## INT-A frontend R3 — latest checkpoint (2026-10-25)

Actual manual Antigravity R3 received at clean cfec8694 (Gemini3.8Flash High owner-reported), superseding R3 not-dispatched. [Intake](../reviews/inta-frontend-r3-intake.md):5raw/5export/25source/25archive hashes valid,4raw-export pairs byte-equal; owner87unit/7files and8guardpasses preparation only. Template3e5a642/backend52b60a4 clean. Actual [OpenCode R3 source review](../reviews/inta-frontend-r3-opencode-review.md), session ses_e8deafe72ffemU9msDRvjVE1YL, tool-reported opencode/glm-5.3-flash-free, CHANGES_REQUIRED. Preserve7stage lifecycle/intent-before-fetch/echo/preflight/assertion improvements. R3-F01 valid-JSON corrupt intent and F03 marker/reader integrity plus F04 mandatory successful fake-runner proof remain pre-upstream; F02 blank provenance before cleanup, F05/F06 errata, F07 non-blocking. Codex isolated helper verification reproduced F01 with0network, not an owner baseline replay/runtime acceptance.

Frontend REWORK_REQUIRED; Codex ENV_HELD; ZCode preparation IN_REVIEW/WAITING_ENV, no rebuild. [R4 complete prompt](../implementation/handoffs/MC-002-INTA-FE-R4-PROMPT.md) READY / NOT_DISPATCHED, small local corrections plus one fake-transport fixture, no new framework. Canonical runtime commands stage1..7 only; phase* aliases prohibited. Ledger51NOT_RUN/0PASS/0FAIL,36required/14deferred/1blocked; actual runtime QA PENDING. MC-002/C01-PRODUCT/product identity-isolation/Cloudflare/cost/full recovery/architecture gates OPEN. No PG/container/Go/HTTP/paid/deploy/merge or MC-003A action by Codex.

## INT-A frontend R4 — latest checkpoint (2026-10-25)

Actual manual Antigravity R4 received at clean48cc03e (Gemini3.8Flash High owner-reported); earlier R4 not-dispatched historical. [Intake](../reviews/inta-frontend-r4-intake.md):5raw/5export/25source/25archive hashes valid,4raw-export copies equal; owner91unit/7files and8guards preparation only. Successful7stage fake fixture now present. Codex isolated old-counterexample recheck refused JSON{} without overwrite,0network. Template3e5a642/backend52b60a4 clean.

Actual [OpenCode attempt](../reviews/inta-frontend-r4-review-blocker.md), session ses_e8db2b912ffeb1p9kYKffD3XRy, exit1/provider.free-limit/HTTP429; **no R4 verdict**. Frontend IN_REVIEW, independent review BLOCKED_PROVIDER_QUOTA; no new source-rework task inferred. [Manual QA prompt](../implementation/handoffs/MC-002-INTA-FE-R4-QA-PROMPT.md) READY/NOT_DISPATCHED; user model/provider-or-wait choice pending. No provider/model/auth/settings/payment change, alternate reviewer substitution or auto-retry schedule.

Codex read-only Docker/image/loopback-port preflight succeeded; ENV/private DSN still HELD, no resources created/modified. ZCode preparation IN_REVIEW/WAITING_ENV without rebuild. All51NOT_RUN/0PASS/0FAIL,36required/14deferred/1blocked; real runtime QA PENDING. MC-002/C01-PRODUCT/product identity-isolation/Cloudflare/cost/full recovery/architecture gates OPEN. MC-003A/unrelated files untouched.

R4 independent-review alternate attempt: human authorized another configured model/provider. Actual inventory found no authenticated integrations;9listedmodels all opencode. Per-invocation opencode/big-pickle session ses_e8dab66d3ffeZNJjY1xaZY1cnt also failed provider.free-limit/HTTP429, exit1,2.398s, same33snapshot packet, no verdict. Both failed attempts retained; no model cycling/global-setting/login/payment change or automatic retry schedule. Await usable human-restored/authenticated OpenCode route or quota recovery. R4 IN_REVIEW, independent review BLOCKED_PROVIDER_QUOTA, ENV_HELD;51NOT_RUN and all product/MC-002 gates unchanged.

## Human routing override — R4 source review to ZCode

Human explicitly requests rewriting the R4 review prompt for actual ZCode. [Complete manual prompt](../implementation/handoffs/MC-002-INTA-FE-R4-ZCODE-REVIEW-PROMPT.md) READY / NOT_DISPATCHED; no invocation or verdict. Same33immutable source snapshots, reviewed head48cc03e; ZCode checks Antigravity frontend source only and discloses authorship conflicts. Both failed OpenCode attempts preserved; no impersonated OpenCode result. This source-review override does not replace independent OpenCode QA for36runtime cases. ENV_HELD,51NOT_RUN and MC-002/product/cloud/cost/recovery gates unchanged. Next: human delivers prompt, returns ZCode report for Codex intake.

## INT-A source closure and actual ENV — latest checkpoint (2026-10-25)

Actual human-routed [ZCode R4 source review](../reviews/inta-frontend-r4-zcode-review.md) PASS_WITH_LIMITATIONS received; [Codex disposition](../reviews/inta-frontend-r4-source-closure.md) accepts source-only closure at48cc03e. Seven findings closed/dispositioned, no further source rework. Model account:zai-start-plan/GLM-5.3/Z.AI reviewer-reported, frontend authored by Antigravity; backend authorship separate. Packet/four source hashes/clean heads/binary independently checked, no91unit/8guards replay. Old ENV-held/source-pending/manual-review-not-dispatched statements are historical. ZCode review does not replace OpenCode36runtimeQA.

Codex **actually provisioned/verified** the approved new fixture: runIdintamvnmoems3pd generated by actual driver helper; container mc002-inta-pg-intamvnmoems3pd ID04552c273cb6be564d8c1deab7498c9f3f0b522e6dc84c1ac5163134ab85bd01; newvolume mc002-inta-data-intamvnmoems3pd; pinnedlocalPG18/no pull,512MiB/1CPU/128PIDs,127.0.0.1:15457 only, healthy exactDB/user mc002_inta with0publictables andTCPauth/hostport observed. [ENV return](../reviews/inta-environment-return.md) records command UTC/exits/logs/hashes and private0600handoff path without values. Existing resources untouched; new container RUNNING_READY andvolume retained for manual continuation.

[ZCode migrate/start prompt](../implementation/handoffs/MC-002-INTA-BE-RUNTIME-START-PROMPT.md) READY/NOT_DISPATCHED; existing52b60a4binary no rebuild. [Antigravity staged prompt](../implementation/handoffs/MC-002-INTA-FE-RUNTIME-PROMPT.md) READY/NOT_DISPATCHED, WAITING_BE_READY;stage1onlyafteractualZCodereturn, laterstages wait external-owner cues. No Go migration/start/Next/recordmutationcasesexecutedbyCodex.51canonicalacceptanceresultsNOT_RUN,36required/14deferred/1blocked,0PASS/0FAIL;ENV01sub-evidenceexecutedpendingindependentacceptance. OpenCode runtimeQA stillquota-limited/PENDING; no automaticretry/model/auth/payment. MC-002/C01-PRODUCT/productsecurity/Cloudflare/cost/fullrecovery/architecturegatesOPEN;noStep03/paid/deploy/merge/MC-003Aaction.


## F-08/F-10 corrected ZCode addendum — 2026-10-26

Human-returned corrected addendum received and preserved in [scoped intake](../design/step-03a/handoff/step-03a-8a/zcode-remaining-return-r2/intake.md). DISPUTED null-source, implicit-component cardinality/order/applicability, metadata and residual-size disclosure corrected at proposal level. ZCode recommends B35; A33 retains explicit unbounded residual-risk acceptance. Current catalogue remains32; neither option, new gap mapping nor counting unit approved.

Two narrow clarifications remain: V1 disjoint/ordered gap classifier and B3 unique relation key/order/cursor plus cycle/observation/epoch association. Text-only focused handoff prepared, not invoked by Codex. Existing accepted candidate/F11/22CT/QA conditions/runtime and gates unchanged. No full architecture review, product code, DB/runtime/provider invocation or Step03B approval. BE01 is independent: unified workflow records PO-reported work performed; reconcile its implementation return separately rather than reassigning it.


## Independent continuation while BE01/F08/F10 returns wait — 2026-10-26

PO explicitly says wait for both outstanding returns and do independent work; no original task redispatch or source acceptance. [MC-CONT-01](../implementation/tasks/MC-CONT-01.md) records scope/evidence. Current F08/F10 proposal dispositions and catalogue32 remain; no new policy/route/size-risk choice.

Actual ZCode INT-A backend runtime-start return received: attempt1 missing exported DSN exit1, corrected attempt2 native six migrations exit0, exact52b60a4 Go started. [Codex intake](../reviews/inta-backend-runtime-start-intake.md) verifies17payload hashes/18raw-export pairs,19file secret scan0matches and currentPID77632/start-time/binary/loopback plus samePG container-volume-image-labels-caps-ports healthy; healthz/readyz200. No migration/SQL/lifecycle/data mutation by Codex, no newfixture. Go+PG retained running. State still absent; [complete Antigravity stage1 prompt](../implementation/handoffs/MC-002-INTA-FE-RUNTIME-PROMPT.md) READY_NOT_DISPATCHED with immediate fresh readiness check and stop-before-Go-restart barrier.

Canonical51 IDs retained:0PASS/0FAIL/51NOT_RUN,36required/14product-deferred/1external-feasibility-blocked; ENV01/02/03 carry partial executed evidence only. Actual OpenCode runtime QA remains PENDING, no retry/provider/model/auth/payment change or substitute reviewer invoked.

UX local-r3 source assertions enumerated:161PASS/1FAIL of162. The failed historical live-path hash is solely decision-log.md: exact old bytes remain in Git, current version appends approvedDEC028 without changing the prefix. Original failed result/manifests retained; no162PASS claim. [Traceability](../testing/continuation-20261026/contract-design-consumer-trace.json) maps accepted clauses to design/consumer/CT obligations without applying pending F08/F10 decisions. Prior file-target policy retained; browser inventory only, no alternate renderer/server/proxy or new screenshot/keyboard/viewport/zoom acceptance.

C01-PRODUCT/auth/authorization/Workspace-Matter isolation/Cloudflare/cost/full recovery/architecture/MC002 remainOPEN; MC003A REWORK_REQUIRED, G3 NOT_VERIFIED/G4 PENDING/G6 REWORK_REQUIRED/STEP03B NOT_AUTHORIZED. Exact next action: human delivers updated Antigravity runtime prompt, stage1 only, then returns checkpoint. No direct external invocation in this continuation.


## F-08/F-10 final clarification intake — 2026-10-26

Human-returned final ZCode clarification received in [scoped intake](../design/step-03a/handoff/step-03a-8a/zcode-remaining-return-r3/intake.md). F08 classifier is now ordered/current-epoch/satisfied-first;14finite text vectors pass in Codex document simulation. V1/V2 and row-count unit remain candidate choices pending actual contract/required approval; no repeated correction task.

F10 composite(evidence,role) keyset fixes duplicate-Evidence ordering under a disclosed same-role-dedup grain; fixed-sourceRevision limit1 traversal checked only as document simulation. Cycle/epoch association, role projection and correction/history reachability remain unresolved. Codex inspected full current source sections: data-model uses an abbreviated observation declaration and filing-model/API give no explicit binding, so this is a technical design gap rather than a request to reread the same excerpt. Prepared narrow technical-proposal prompt plus exact supplemental excerpts/bytes/SHA, NOT_DISPATCHED; no new provider call or source permission inferred.

No A33/B35 adoption; current catalogue32/accepted clauses/F11/22CTpartition/QA conditions/gates unchanged, all runtimeNOT_RUN. This intake changes no Go/Next/PG source/lifecycle, BE01 task or INT-A stage1 coordination. Current ZCode backend/frontend ownership preserved. MC003A REWORK_REQUIRED/G3 NOT_VERIFIED/G4 PENDING/G6 REWORK_REQUIRED/STEP03B NOT_AUTHORIZED; overall PO architecture gate remainsNOT_PASSED.


## F10 observation-cycle binding proposal intake — 2026-10-26

Actual human-returned ZCode text proposes cycle_no composite binding, type-role mapping, reopen-stable associations, effective correction view and L1/L2 provenance alternatives. [Intake](../design/step-03a/handoff/step-03a-8a/zcode-f10-binding-return-r1/intake.md) preserves raw return and valid JSON; author explicitly did NOT read the supplemental source note/manifest. No command/runtime or independent acceptance claimed.

Proposal needs three bounded clause reconciliations before contract/PO decision: supplement creates a cycle rejected by the generic exists check; correction type/role and effective-chain behavior do not derive G3 precisely; generic DR15 before/after plus unbound counter do not pin bounded provenance/detail reachability. DR15 targetId is confirmed; no invented absent filter. Prepared correction prompt, NOT_DISPATCHED by Codex, with no new source read/egress permission inferred.

F08 classifier unchanged/choice pending, catalogue32 unchanged, G1..G8 runtimeNOT_RUN; accepted clauses/F11/22CT/QA and all gates retained. BE01/INT-A remain independent; no source, DB/lifecycle, provider/model/settings, merge/push/deploy or STEP03B action.

## Frontend stage1 return received — 2026-10-26

Actual human-returned ZCode frontend runtime stage1 is now received; [Codex intake](../reviews/inta-frontend-runtime-stage1-intake.md) verifies42raw/export byte pairs,41payload hashes,11passed assertion records,14complete envelopes and14one-to-one Go access-log correlations. Source/binary unchanged; process-only observation confirms Go77632 and Next88444/listener88453 on loopback. Report count errata and INT-ENV-07 webpack variance are preserved explicitly. STAGE_1_EXECUTED / WAITING_GO_RESTART, not DONE or independent QA PASS. This supersedes prior stage1 READY_NOT_DISPATCHED/state-absent labels only. All51formal results remain NOT_RUN with eleven owner-executed sub-evidence rows recorded separately;36required/14deferred/1blocked retained. Next is the separate MC-002-INTA-GO-RESTART-PROMPT.md manual cue, prepared/not dispatched; actual restart return must be intaken before stage2. No driver/HTTP/SQL/lifecycle/provider invocation by Codex, no BE01/F08/F10 or approval gate change.

## F10 binding R2 — current document checkpoint, 2026-10-26

[Latest intake](../design/step-03a/handoff/step-03a-8a/zcode-f10-binding-return-r2/intake.md) receives the actual ZCode author reconciliation: cycle lifecycle/atomicity and terminal RETRACT/REPLACE are explicit candidate clauses; provenance now has main/link fields and unbound grain. Two scoped P1 contract gaps remain: discovery of unknown evidence/key and bounded inherited before/after projection. Provenance-only text follow-up prepared/not dispatched; no repeated full audit. Contract/PO acceptance still required; catalogue32/B35 unadopted, F08/22CT/QA/gates unchanged. This design intake neither blocks nor executes INT-A's independent pending Go restart; no runtime/implementation/provider action occurred.

## Go restart return received — 2026-10-26

Actual ZCode Go restart return is received; Local Codex verified22export pairs/21payload hashes/29unchanged ledger files and observed newGo98134 with unchangedNext88444/88453. Old77632 absent; graceful stop/start evidence retained. Current status RESTART_EVIDENCE_VERIFIED_WITH_LIMITATIONS / WAITING_STAGE2; INTA-GOV-RESTART-01 requires text-only reconciliation of the reported Mimosa refusal followed by Write/split-command actions. No retrospective permission or conclusive hook violation determination is inferred. See docs/reviews/inta-backend-go-restart-intake.md (repository-relative). MC-002-INTA-RESTART-GOVERNANCE-CLARIFICATION.md is the immediate handoff; FE-STAGE2 prompt is PREPARED_NOT_RELEASED until Codex disposition. Do not replay restart/stage1, invoke stage2 or touchPG from historical next-action labels above. All51canonical results/QA/product/design gates unchanged. No lifecycle or record request by Codex.

## F10 provenance R3 received — 2026-10-26

ZCode author text-only R3 retained under docs/design/step-03a/handoff/step-03a-8a/zcode-f10-provenance-return-r3/ (repository-relative). Discovery via unfiltered seq pages and closed scalar/inherited projection now address the two prior gaps at proposal level; numeric field/envelope limits explicitly NEEDS_AUTHORIZED_SOURCE. Current PROPOSAL_COMPLETED_FOR_TARGETED_CONTRACT_REVIEW / NOT_ADOPTED. No full ZCode rewrite assigned; actual Claude narrow contract handoff READY_NOT_DISPATCHED pending exact scoped payload/route permission. Pin matching/count/command-local completion/per-page revision semantics and missing bounds through contract authority. C1/C2 remain R2 proposals; F10 not closed, catalogue32/B35 unadopted, F08/22CT/QA/gates unchanged. No BE01/INT-A/lifecycle/provider/implementation action.


## BE01 actual implementation return received — 2026-10-26

[MC-BE-01 intake](../reviews/be01-intake.md): actual ZCode clean136eae6 from52b60a4,31files/+5243/-8. Owner retained raceJSON1662events yields391namedpasses/0fail/1intentionalnamedskip;15test-bearing and5no-testpackages. Four reported hashes and sixraw evidence exports verified, credentials scan0matches. Makecheck/emptyfixture historical provenance owner-reported; text/JSONduration mismatch recorded. Both BE01fixtures running with exactIDs/digest/loopback/caps/labels rechecked read-only, noDBquery/lifecycle.

LocalCodex independently executed3service-double Go-overlay probes on unchanged136eae6 (DBenvremoved/networkfetchdisabled/sourceuntouched). All3fail: receipt representedMatter authority bypass before hash classification(F01), unsupported elapsed temporalboundary accepted(F02), membershipunavailable convertedNotFound(F03). Status REWORK_REQUIRED, notDONE; focused ZCode rework prompt ready/notdispatched; no fresh externalreview/providercall. Correctedhead needs new requiredgate/evidence and nonauthorreview. Nullablepurge_after/keyagezeroseam and minimalMakefile addition remain reviewdispositions, not productpolicy approvals.

NoBE02/auth/HTTP/fullbackend/Step03B/deploy activation. INT-A baseline/currentrestartgovernancehold and F08/F10candidate choices/gates untouched; latest current workflow governs those independent streams. ParentMC002/MC003A/architecture/cost/recovery/release gates remainopen.

## F10 confirmation rerouted to ZCode — 2026-10-26

Direct PO instruction “cho zcode xác nhận phần này luôn” supersedes the planned Claude recipient for this exact C1/C2/C3 owner technical confirmation. Current handoff: docs/design/step-03a/handoff/step-03a-8a/zcode-f10-provenance-return-r3/ZCODE-F10-CONFIRMATION-PROMPT.md (repository-relative). Same configured ZCode session, prior authorized context plus inline feedback, text-only; no new source/tools/provider/cost scope. READY_NOT_DISPATCHED until actual human delivery/return. Do not require a redundant Claude round or re-request this same role assignment. ZCode authored the proposal: independent review/PO decisions remain separate, no F10 closure, implementation or global architecture-role change. All catalogue/CT/QA/gates and BE01/INT-A states unchanged.

## Restart route clarified; stage2 cue released — 2026-10-26

Actual ZCode text-only clarification quotes Mimosa explicitly prescribing Write/Edit/MultiEdit for script-content scan; INTA-GOV-RESTART-01 is EXPLAINED_TOOL_WRITE_ROUTING / NO_REMAINING_STAGE2_HOLD with owner-reported telemetry limits. See docs/reviews/inta-go-restart-route-clarification-intake.md (repository-relative). This supersedes the provisional stage2 hold above, not any independent-QA gate. Stage2 CUE_RELEASED / READY_NOT_DISPATCHED: deliver MC-002-INTA-FE-STAGE2-PROMPT.md to actual ZCode; immediate source/process/state recheck, one INT-PERS-01 readback only, then WAITING_PG_RESTART. Go/Next observed unchanged at18:06:18Z;29ledger hashes unchanged. No restart replay, PG action, driver invocation or provider call by Codex. All51formal results/runtimeQA/product/design/release gates remain unchanged.


## F10 final owner confirmation received — 2026-10-26

[Actual consolidated ZCode return](../design/step-03a/handoff/step-03a-8a/zcode-f10-owner-confirmation-r1/intake.md) is received, OWNER_TECHNICALLY_CONFIRMED_CANDIDATE / INDEPENDENT_REVIEW_PENDING / NOT_ADOPTED. Direct PO reroute is honored; no mandatory Claude confirmation loop reintroduced. This is author self-confirmation, no formal PO/architecture acceptance, independent QA or runtimePASS; supplement staysNOT_READ, no new source/tool/hash execution claimed.

C1/C2/C3 clause patch and proposednumericlimits preserved. Local documenttrace verifies validinterleaving/N0/exhaustion behavior and records precise independentreview questions: stop-at-N cannot observe latersurplus; AND-filtered mismatches need separate anomaly handling if detection is promised; C2 effectiveview must retain R2 supersededreplacement exclusion; P1.3 must not silently change unrelatedcommands. No fresh fullownerrewrite assignment.

Six exact review snapshots49688bytes plus manifest/manualprompt are prepared, NOT_DISPATCHED/no new externalpayloadpermission inferred. Nonauthor review precedes actual field/bounds/B35 POchoices. Catalogue32/B35/L2/causeSeqfilter unadopted; F08/F11/22CT/QA/gates retained, allF10runtimeNOT_RUN. BE01 rework and INT-A latestcoordination unaffected; no DB/lifecycle/implementation/provider/model/settings/deploy action.

## Stage2 received and same-PG restart executed — 2026-10-26

[Repository-relative: docs/reviews/inta-frontend-runtime-stage2-intake.md] Local Codex verifies9owner export pairs/8hashes, full A baseline equality/version1, one INT-PERS-01 request correlated in newGo log;32state files counter15/12assertions/STAGE_2_COMPLETED. Report UTC/latency errata retained, no raw rewrite. Codex then ACTUALLY stop/start exactPG04552c…bd01 once at18:13:34–18:13:37Z, exit0, same volume/image/container/labels/caps/ports and healthy; Go98134/Next88444+88453/start times and32ledger hashes unchanged. No SQL/recordHTTP or Go/Next lifecycle. Status SAME_PG_RESTART_EXECUTED / WAITING_STAGE3_READBACK. Stage3 MC-002-INTA-FE-STAGE3-PROMPT.md is CUE_RELEASED / READY_NOT_DISPATCHED; human delivers to ZCode, one readback then WAITING_CODEX_STAGE4_CUE. Supersedes older stage2-pending/PG-next-action labels only; no restart replay/stage4 or further lifecycle.51formal results/independent QA/product/design gates unchanged, explicit executed subevidence in new checkpoint.
