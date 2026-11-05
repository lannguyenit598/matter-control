# Risk Register

Scale: impact/probability = High/Medium/Low; priority is qualitative until workloads and architecture are known. Reassess at every milestone.

| ID | Risk / direct evidence | Impact / probability | Owner | Mitigation and closure evidence | Status |
|---|---|---|---|---|---|
| R-001 | Existing Go backend + Cloudflare Free Tier compatibility unverified | High / Unknown | Claude + Codex | Audit pinned code/runtime/dependencies; architecture options and Human-approved feasibility decision | OPEN, architecture gate |
| R-002 | $0/month claim lacks MVP workload, account/plan and end-to-end service inventory | High / Unknown | Codex | Quantified workload, quotas/pricing sources dated at validation, all required service costs and overflow behavior | OPEN, release gate |
| R-003 | Baseline and corrected Step 01 document reviews returned via OpenCode | Medium / Observed | Codex | REV-00A PASS and REV-01 round 2 PASS on pinned snapshots; re-review changed requirements; no general tool/isolation capability inferred | CLOSED for reviewed snapshots only |
| R-004 | Historical signature/MCP blockers resolved according to user logs; live connection unverified | Medium / User-reported | Codex | [Follow-up evidence](../tooling/follow-up-evidence.md); verify live MCP separately before relying on it | PARTIALLY_RESOLVED, not task-ready |
| R-005 | Original unpinned-source/DNS issue resolved by exact GitHub snapshots | Medium / Historical | Codex | repository-audit.md pins both origins/SHAs; current read-only snapshots verified clean; owner runtime gates tracked separately | SOURCE_BASELINE_PINNED; runtime unverified |
| R-006 | Confidentiality/access/history policy approved; enforcement and retention/lifecycle parameters unverified | High / Unknown | Claude + Codex | DEC-016/017 approve OBD-08/11 controls and numeric deferral; validate security architecture and authorization/recovery tests, resolve remaining lifecycle policy; synthetic data meanwhile | OPEN |
| R-007 | Self-review or version mismatch could produce false DONE | High / Medium | Codex | Independent reviewer, exact tested revision, task→test→review→release links | CONTROL_DEFINED, not runtime-verified |
| R-008 | Governance repo local only; no shared remote/PR/recovery destination | Medium / Observed | Codex + Human | Confirm destination and collaboration policy; publish only after authorized target is known | OPEN |
| R-009 | Current vendor docs may differ from installed app versions | Medium / Medium | Codex | Verify local help and instruction loading; do not rely on docs alone for runtime claims | OPEN |
| R-010 | Design-to-code handoff may omit states or stable artifacts | Medium / Medium | OpenDesign + Antigravity | Export manifest, version, all states, interaction/accessibility criteria and receiving-engineer acknowledgement | OPEN |
| R-011 | Prior source-file assumption incorrectly blocked Step 01 | High / Confirmed historical | Codex | SRC-00A1 corrects provenance: approved prompts valid, originals optional; context-provenance.md and revised gate | CLOSED — incorrect blocker removed; no direct A/B verification claimed |
| R-012 | Basic signature/decision/finding/risk scenarios could be cut from P0 or expand into full P1 | High / Medium | Codex + PO domain owner | OBD-03; preserve minimum workflow representation, specify boundary at Step 01 | POLICY_BOUNDARY_APPROVED; implementation pending |
| R-013 | Single status could falsely equate completed, verified, unblocked and on-time | High / Medium | Codex + OpenCode | Five axes retained; Atlas counterexamples; transition/permission rules at Step 01 | CONTROL_DOCUMENTED, not implemented |
| R-014 | Synthetic Atlas assumptions could be mistaken for approved legal/product rules | Medium / Medium | Codex | Explicit proposal labels, fixed demo clock, review against approved prompts and Step 01 criteria | DOCUMENT_REVIEWED / POLICY_APPROVED; Atlas fixture adaptation still required |
| R-015 | Expanded P0 could be silently reduced to fit free hosting or schedule | High / Unknown | Codex + PO | Keep full capability/workflow release baseline; evidence-based trade-off if constraints conflict | OPEN, no scope reduction authorized |
| R-016 | Operational policy approval could be mistaken for legal sufficiency or verified production enforcement | High / Medium | Codex + PO | DEC-016/017 and approval record close requirements approval; no legal guarantee or runtime enforcement evidence | APPROVAL_GATE_CLOSED; downstream validation open |
| R-017 | Matter-level document access or VIEWER export may not fit confidentiality needs | High / Unknown | PO + Claude | OBD-08 B/B explicitly approved, including Matter-level documents and VIEWER export; validate all indirect reads/files/metadata; finer ACL is a change request | OPEN |
| R-018 | Retention, recovery, workload and latency/SLA budgets unspecified | High / Confirmed | PO + Codex + Claude | DEC-017 explicitly defers numeric workload/retention/RPO/RTO; OBD-09/10/11 measurements and lifecycle details remain gated before commitments/release | OPEN downstream validation |

No residual risk has been silently accepted. Unknown probability is not low probability. Tool readiness, architecture/cost feasibility and independent review risks remain open for their respective gates; none blocks starting Step 01 business analysis. Original A/B comparison remains unperformed and optional; approved prompt context is the valid baseline.

## Step 02 directly observed risks

| ID | Evidence / unresolved risk | Impact | Owner | Required closure | State |
|---|---|---|---|---|---|
| R-019 | Pinned Go template is native net/http/Echo/pgx; no Worker entrypoint or verified native origin/provider | High | Claude architecture / Codex cloud / ZCode runtime | Proposed runtime ADR, PO major trade-off if constraints conflict, actual candidate PoC and full service budget | OPEN architecture gate |
| R-020 | Template backend has no auth; frontend resolver is integration stub and shared-token fallback cannot establish per-user Matter identity | High | Claude security / owner engineers / OpenCode | Identity/authorization architecture, no shared-principal bypass, revocation and indirect-access negative tests | OPEN; template capability gap, not production incident |
| R-021 | Next16.4.2 cache/partial-prefetch/server behavior has no verified Cloudflare adapter; live guide recommends vinext beta | High | Claude / Antigravity / Codex | Version-pinned candidate decision and real build/runtime/feature tests without dropping approved behavior | OPEN compatibility gate |
| R-022 | Direct ZCode CLI packaging and Antigravity headless permission limits persist; both actual manual native baseline returns independently reviewed | Medium | Codex + respective owners | Preserve manual route; C01-NATIVE next task WAITING_MANUAL_DISPATCH, no baseline reruns/config/auth bypass | DIRECT_ROUTE_LIMITATION; baseline returns received |

Step02 source/feasibility evidence does not close R-001/002/005/006/017/018 runtime, cost or lifecycle gates. Step01 approval remains valid; numeric deferral did not invent workload/recovery targets. Original independent review is revision-scoped. No paid/production action or template mutation has occurred.

| ID | Evidence / unresolved risk | Impact | Owner | Required closure | State |
|---|---|---|---|---|---|
| R-023 | Actual OpenCode round1 found5High/9Medium defects in candidate FK scope, receipt authorization/unknown outcomes, Filing reopen proof, typed graph totality and read consistency | High | Claude Code / OpenCode | Targeted architecture correction, finding-by-finding disposition and independent re-review; preserve approved RULE-003 | DOCUMENT_CORRECTED_AND_REVIEWED; runtime tests NOT_RUN |
| R-024 | Codex additionally found temporal boundary/milestone/verdict/discriminator/effective-owner and provenance inconsistencies | High | Claude Code / Codex / OpenCode | Correct normative contracts and reporting; exact manifests, not invented hash examples; no unsupported runtime claim | DOCUMENT_CORRECTED_AND_REVIEWED; runtime tests NOT_RUN |

| R-025 | Historical sandbox codesign failures were not reproduced on the host; both apps now validate and are Gatekeeper accepted | Medium | Codex evidence | step-02-1-recovery.md; mandatory-reinstall conclusion withdrawn; actual root cause unproven, no bypass/repair | HOST_INTEGRITY_VERIFIED; owner runtime still pending |

| ID | Evidence / unresolved risk | Impact | Owner | Required closure | State |
|---|---|---|---|---|---|
| R-026 | Frontend supplied-source audit proposes destructive cleanup and unsupported CPU/ID/export claims | High | Codex / OpenCode / Antigravity | Preserve raw report; frontend-audit.md rejects unsafe recipes and marks unproven claims; safe pinned manual worktree prompt replaces advice | DISPOSITIONED; runtime independent verification pending |
| R-027 | Tiny single-DB restore could be mistaken for product recovery or RPO cadence | High | Codex / OpenCode | One manual archive, known omitted marker, measured scope/elapsed only; product DB/blob/history/access and cadence remain untested | OPEN product recovery gate |
| R-028 | Frontend Task contract and fail-closed auth do not match Go User API | High | Owner engineers / Claude | Passing individual PoCs first; approved minimal integration seam and session strategy; no resource alias/wildcard auth | OPEN integration gate |


## Frontend returned-evidence qualification

Manual Antigravity baseline ran despite the separate headless command-permission limit. OpenCode found documentary evidence overclaims (historical cleanup versus warnings, network-count assertions, manifest provenance/timestamps and binding scope). Codex corrected the documentation; original logs retained. Later host inspection finds no listeners on the four test ports. Final independent recheck pending; no source bug or full-product security proof is inferred. R-021 Cloudflare adapter and R-028 integration/auth gaps remain open. See ../reviews/step-02-frontend-intake.md.


## Backend native PoC findings

| ID | Evidence / unresolved risk | Impact | Owner | Required closure | State |
|---|---|---|---|---|---|
| R-029 | Actual template DB-down UserAPI500/about:blank vs MatterControl503 unavailable+retryAfter | High against future product conformance | ZCode / Claude / OpenCode | Step02.2 C01-NATIVE contract DISPATCH_READY from actual Claude: SQLSTATE-first typed classification, context cancellation precedence, both renderers; no blanket500 conversion | NATIVE_PASS_WITH_LIMITATIONS at52b60a4 / PRODUCT_OPEN; no full product-conformance acceptance |
| R-030 | Initial logs lacked per-test skips and paired invalid-config evidence; actual focused owner recheck now supplies both | Medium / Observed | ZCode / OpenCode | Codex18/18 export/hash/event checks; actual OpenCode R01/R02 PASS, closure report and exact packet retained | CLOSED_R01_R02_ONLY; no product-conformance waiver |

One actual disposable test credential occurred in original migrate shell trace. Original exact task log and exported copy were sanitized after original-hash guard, no value exported to reviewers/Git; historical versus stored hashes retained. No global auth/credential change or resource deletion. Future fixtures must use new credentials and no tracing. Metadata package/run-count/SQL-label/health notes corrected; actual correction review verified M01..M05; R01/R02 remain open. Current read-only host inspection shows retained DB stopped and no API/DB listeners.

R01/R02 final closure supersedes earlier pending/rework descriptions in this record: actual OpenCode PASS_WITH_LIMITATIONS, both findings CLOSED. R-029 C01 and R-028 integration/auth remain open; future production/Cloudflare/cost/lifecycle concerns unchanged. No fresh credential exposure observed in this return; credential-scan limits are explicit in the closure, not a whole-workstation guarantee.

## Step02.2 current qualification

R-030 remains CLOSED. Native frontend actual final recheck PASS_WITH_LIMITATIONS already resolved documentary findings; no new baseline rerun. R-028 remains OPEN: no Task/User alias or anonymous auth bypass; integration plan PENDING. R-027 tiny restore is verified tooling only, no cadence/full-product proof. Hyperdrive advisory-lock/session-state limitations and unverified driver/migration path add candidate-specific evidence to R-019, not a conclusion every topology is impossible. R-001/002/018/020/021 retain cloud/identity/retention/quota/cost gates. [Current matrix](step-02-remaining-gates.md).

## C01 actual implementation intake — current

R-029 remains OPEN: fd747ae production code returned; actual Claude says production conforms but requires F1cause-preservation regression, F5docs499wording and F6stale57014rule correction before native acceptance. Codex66focusednamedpasses/noDB is independent limited verification, not full QA or production proof. Owner HTTP pool labels claim4s57014 while actual logs show both3sdeadlines; [intake](../reviews/step-02-c01-intake.md) preserves raw bytes and qualifies claims. Native correction manual handoff prepared; PRODUCT_OPEN. R-030/R01/R02 stay CLOSED, R-028integration and R-027fullrecovery unchanged.

R-029 native mapping remediation is now independently accepted at52b60a4; R-029 stays OPEN for the remaining product-conformance scope. Self-hash entries in two R1 owner manifests were stale; all16exports match originals and canonical recomputed inventory preserves raw lists, independently accepted as a documentation qualification. No payload mismatch or source change inferred. R-028integration, R-027full recovery and cloud/cost risks remain open. [Closure](../reviews/step-02-c01-native-closure.md).


## Step02.3 — current integration decision risk controls

R-028 remains OPEN: actual Claude has proposed a genuine Next-runtime temporary transport seam and actual OpenCode reviewed testability; PO selection and every runtime assertion remain pending. The initial Node-only proposal was corrected before independent review because it did not exercise Next.js. The existing client returns body only and auto-serializes JSON: raw wire controls and application-client observations are separately identified. No false header/status proof, Task/User alias or auth bypass.

R-020 remains OPEN for product identity/authz/isolation: transport-only exclusion is explicit, never a waiver. R-029 C01-NATIVE stays accepted with limits; C01-PRODUCT remains OPEN. R-019/021 hosting/adapter, R-027 full recovery and cost/retention risks retain their prior gates. No new app/signature/auth failure inferred from the sandbox-only OpenCode version log EPERM; actual provider execution uses the authorized host route.

| ID | Evidence / unresolved risk | Impact | Owner | Required closure | State |
|---|---|---|---|---|---|
| R-031 | Proposed unauthenticated temporary Next harness could enter a product build or become a proxy if isolation is not enforced | High | Claude / Antigravity / Codex / OpenCode | Explicit PO scope; separate test root outside product app/build; fixed loopback targets/allowlisted operations; opt-in and production refusal; no shared token; removal conditions and future independent artifact/negative checks | OPEN_PROPOSAL_ONLY / NOT_IMPLEMENTED |

[Decision package](step-02-decision-package.md), [architecture analysis](../architecture/api-auth-decision-analysis.md), [acceptance plan](../testing/integration-acceptance-matrix.md). Document review does not mitigate these risks by runtime proof.

Step02.3 bounded review update: under the direct human [routing override](step-02-3-review-routing.md), actual OpenCode supplied the applied refId/value/body-cap/native503 clarification and defined optional DB-stop causal evidence. F1..F4 documentation/source-evidence findings are closed; source options are not runtime cache proof. R-020/028/031 and product/cloud/cost gates remain OPEN pending actual selected-scope implementation/verification and approvals; no Claude authentication is needed for this current review round.


Step02.4 planning preserves R-020/028/031: recommended INT-A excludes auth/authz/Workspace-Matter verification, so PO must explicitly choose that local evidence boundary or another recorded option. No policy requirement is waived.0tests required-now;36candidate local cases remain NEEDS_SCOPE_DECISION,14product cases deferred, D-14 production feasibility separate. All51NOT_RUN; missing feasibility is not mislabeled as runtime failure or proof every topology is impossible. Step03A impacts are documented via an unsent governance notice; no design artifact change.

## INT-A approval — current risk disposition

DEC-028 approves the local transport scope and its explicit evidence exclusions, not closure of R-020/028/031 or product/cloud/recovery/cost risks. INTA-1 freezes the companion test root outside the product checkout because the pinned TS/ESLint globs are broad; source/template configs stay unchanged. Cross-root import/binding/guard/artifact exclusion remain actual feasibility checks, not established facts. If owners cannot satisfy them within the approved boundaries, stop to PO without fallback.

Direct engineering unavailable (ZCode packaged files absent, Antigravity recorded tool denial); complete manual handoffs prepared. No owner/runtime/DB/container execution yet. All36required local cases stayNOT_RUN and require independent OpenCode verification. Product14 and production1 remain separate. No prior C01/R01/R02 recheck or global tool/auth repair is authorized merely to remove this route limitation.

INT-A backend intake: owner clean-source binary is now physically present and matches its reported hash/buildVCS metadata, improving preparation provenance without runtime proof. Current Go in-process version check remainsNOT_RUN; log no-process/env absence descriptions in the owner return are owner assertions except current assigned-port/source/hash observations. ENV/driver runId/frontend coordination still required; no default/retained DB or unsafe retry permitted. R-020/028/031 and product/cloud/cost/recovery risks remain open.

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

## INT-A source closure and actual ENV — latest checkpoint (2026-10-25)

Actual human-routed [ZCode R4 source review](../reviews/inta-frontend-r4-zcode-review.md) PASS_WITH_LIMITATIONS received; [Codex disposition](../reviews/inta-frontend-r4-source-closure.md) accepts source-only closure at48cc03e. Seven findings closed/dispositioned, no further source rework. Model account:zai-start-plan/GLM-5.3/Z.AI reviewer-reported, frontend authored by Antigravity; backend authorship separate. Packet/four source hashes/clean heads/binary independently checked, no91unit/8guards replay. Old ENV-held/source-pending/manual-review-not-dispatched statements are historical. ZCode review does not replace OpenCode36runtimeQA.

Codex **actually provisioned/verified** the approved new fixture: runIdintamvnmoems3pd generated by actual driver helper; container mc002-inta-pg-intamvnmoems3pd ID04552c273cb6be564d8c1deab7498c9f3f0b522e6dc84c1ac5163134ab85bd01; newvolume mc002-inta-data-intamvnmoems3pd; pinnedlocalPG18/no pull,512MiB/1CPU/128PIDs,127.0.0.1:15457 only, healthy exactDB/user mc002_inta with0publictables andTCPauth/hostport observed. [ENV return](../reviews/inta-environment-return.md) records command UTC/exits/logs/hashes and private0600handoff path without values. Existing resources untouched; new container RUNNING_READY andvolume retained for manual continuation.

[ZCode migrate/start prompt](../implementation/handoffs/MC-002-INTA-BE-RUNTIME-START-PROMPT.md) READY/NOT_DISPATCHED; existing52b60a4binary no rebuild. [Antigravity staged prompt](../implementation/handoffs/MC-002-INTA-FE-RUNTIME-PROMPT.md) READY/NOT_DISPATCHED, WAITING_BE_READY;stage1onlyafteractualZCodereturn, laterstages wait external-owner cues. No Go migration/start/Next/recordmutationcasesexecutedbyCodex.51canonicalacceptanceresultsNOT_RUN,36required/14deferred/1blocked,0PASS/0FAIL;ENV01sub-evidenceexecutedpendingindependentacceptance. OpenCode runtimeQA stillquota-limited/PENDING; no automaticretry/model/auth/payment. MC-002/C01-PRODUCT/productsecurity/Cloudflare/cost/fullrecovery/architecturegatesOPEN;noStep03/paid/deploy/merge/MC-003Aaction.
