# Technical PoC Ledger — Step 02

Owner: Codex coordination. Current status: **NATIVE_BASELINES_VERIFIED_WITH_LIMITATIONS / C01_NATIVE_WAITING_MANUAL_DISPATCH / REMAINING_PRODUCT_AND_CLOUD_POC_NOT_RUN**. Claude candidate independently document-reviewed; H5 local and W1/restore targets approved under DEC-023..025. Historical overlays below retain their original checkpoint scope. Step02 §9 permits necessary technical PoCs after Claude direction; no business features, production deploy or paid service activation. No code/config scaffold has been created merely to make a planned check appear executed.

| PoC | Owner | Candidate / purpose | Required evidence and passing condition | Current gate |
|---|---|---|---|---|
| POC-02-01 native Go boundary | ZCode; Claude interprets | Verify supported native toolchain/server lifecycle and exact migration/persistence assumptions against the pinned Go template | Exact SHA/tool versions, command/output, successful native process health and DB mode under disposable environment; native success explicitly does not prove Workers | NATIVE_TEMPLATE_EXECUTED; actual QA characterization PASS_WITH_LIMITATIONS; R01/R02 independently CLOSED; Workers/product/production not demonstrated |
| POC-02-02 Go/Wasm alternative | ZCode + Codex runtime, OpenCode verifies | Only if Claude retains it: actual Worker fetch bridge, Echo/service integration, pgx/TCP/host API compatibility, expiry/background behavior | Repeatable exact compiler/adapter/workerd versions, real requests/persistence/concurrency/error behavior; bundle/startup/CPU measurements and supported APIs; compilation alone insufficient | NOT_RUN; no adapter/toolchain selected; no TinyGo/Wrangler onPATH |
| POC-02-03 frontend runtime | Antigravity; Codex infra; OpenCode verifies | Exact Next16.4.2/React19.3.1/cacheComponents/partialPrefetching/Server Actions against selected vinext/OpenNext/static alternative | Locked install/build, route/layout/action/session/cookie/headers/redirect/cache/REST/error readback; adapter feature matrix and failures; static export must retain approved behavior or be rejected | NOT_RUN; owner route, adapter and migration choice pending |
| POC-02-04 transaction/consistency | ZCode; Claude specifies; OpenCode verifies | Minimal disposable persistence harness for proposed revision, cycle, atomic audit/idempotency and many-to-many proof assessment boundaries | Two concurrent actors, rollback/failure/unknown commit/retry, no unauthorized or partial accepted effects; synthetic rows only, no full MatterControl feature implementation | NOT_RUN; reviewed candidate and H5 approved; owner runtime pending; no product persistence harness created |
| POC-02-05 object/access lifecycle | ZCode + Antigravity; Codex environment; OpenCode verifies | Staging/finalization/reconciliation and current-rights check at each content/export delivery | Orphan/missing object, unauthorized metadata, revocation after preview and cached URL denial, exact version and history; no public legal files | NOT_RUN; storage/identity/runtime choice and environment pending |
| POC-02-06 packaging/quotas | Codex; owner engineers; OpenCode verifies | Candidate Wrangler config/local preview and measured request/CPU/memory/bundle/load; compare full service budget | Exact version/config hashes, build and smoke outputs, measurements vs documented quotas and approved workload; local preview distinguished from remote enforcement | NOT_RUN; Wrangler absent, candidate/workload unresolved |
| POC-02-07 restore consistency | ZCode + Codex; OpenCode verifies | Rehearse DB/version/evidence/history/access/blob restore in isolated environment | Integrity and measured elapsed/data-loss against approved RPO/RTO; key/destination/backup storage costs and retention defined | NOT_RUN; local RPO24h/RTO8h targets approved, retention remains open; owner product restore pending; separate synthetic tooling drill recorded below |

## Evidence contract

Each result must identify owner/tool, environment, source and candidate SHA, exact command, timestamp, exit/error, raw result/artifact hash, expected vs actual outcome, security/fixture boundaries and reviewer. Report NOT_RUN/SKIPPED/BLOCKED precisely; never reuse source inspection, plain native build or a mock preview as remote deployment proof. Remote resources/credentials/paid plans require separately scoped approval; the current step prohibits production deployment.

Claude ADR-001 retains H1..H5 without a selected deployable topology; ADR-003 retains F1..F4. This ledger matches those alternatives; run only the selected candidate checks after owner/environment/PO gates are satisfied. A hard candidate failure is evidence for an alternative/PO trade-off, not permission to rewrite Go or replace PostgreSQL. No critical PoC can be silently waived to mark Step02 DONE.

## Approved local execution scope — DEC-023..025

H5 local, W1 measurement envelope and local restore targets RPO24h/RTO8h are approved; [exact scope](../ai-sdlc/step-02-local-approval.md). ARCH-Q3/Q5 accepted. This record supersedes candidate NOT_APPROVED labels only for those named decisions; ADR design text and independent review hashes remain unchanged. H1/H2/H3, frontend adapter/migration, cloud providers and production objectives are not selected.

Codex local preflight PASS: Docker29.8.2/Compose5.6.0 daemon reachable via pinned local Unix socket, linux/aarch64,10 allocated CPUs/8319504384 memory bytes; no free-capacity or performance claim. [Exact evidence](../testing/step-02-local-preflight.json). No container/image/volume/network or database was created. Next execution requires valid official owner tools and a new isolated target; existing containers/databases are not candidates by default. Missing psql onPATH is not itself a blocker if the selected disposable DB provides its own client; no tool installation has been performed.

## Step02.1 scoped execution overlay

The current recovery record is ../tooling/step-02-1-recovery.md; historical app integrity failures no longer gate execution. ZCode CLI config and frontend runtime dispatch still require manual owner work. Both full prompts are PREPARED / WAITING_MANUAL_DISPATCH. Actual Antigravity supplied-source audit returned; no install/build/runtime/integration PoC ran. POC-02-01..07 remain NOT_RUN at product scope.

Codex separately executed TOOLING-RESTORE-021: tiny new network-isolated PostgreSQL source/target,100 records/100 links, archive/list/restore/integrity and corrupt-input/PK/FK/CHECK negative checks passed. Restore-only0.04121s, provisioning-through-read1.16291s. This does not close POC-02-07 full DB/blob/history/access recovery, W1 capacity, scheduled RPO or production RTO. Exact evidence and review status: ../testing/step-02-poc-validation.md. No native build or local restore establishes Cloudflare compatibility or $0 cost.


## Frontend native-baseline return after manual dispatch

Antigravity returned native Node template install/build/unit99/E2E9 evidence; Codex verified all11 log hashes and clean pinned source. Actual OpenCode requested documentary corrections, with runtime rerun explicitly unnecessary; recheck PASS_WITH_LIMITATIONS (all7 actionable findings resolved). This supersedes frontend native-baseline NOT_RUN only. POC-02-03 exact Cloudflare adapter/feature/runtime matrix remains NOT_RUN/UNSELECTED. Source/REST unit evidence and fail-closed render do not establish a live integration or measured zero-outbound guarantee. Full ledger/quality gate is not waived. Current intake: ../reviews/step-02-frontend-intake.md.


## Backend native characterization return

Actual ZCode native build/migrations/package-race runs/UserAPI/CAS/restart/DB-down recovery evidence exists; actual OpenCode characterization PASS_WITH_LIMITATIONS does not close R01/R02. Actual Claude C01 confirms future503 unavailable problem mapping under unchanged contracts; no source fix made. POC-02-01 evidence scope is native template only, remaining acceptance evidence in rework. Product transaction graph/object/access/full recovery and Cloudflare adapter/quotas remain NOT_RUN. See ../reviews/step-02-backend-intake.md and focused owner recheck handoff.

Final R01/R02 artifact review closes both owner evidence gaps with PASS_WITH_LIMITATIONS; current record ../reviews/step-02-backend-r01-r02-closure.md. Native backend characterization and frontend local baseline acceptance do not close product graph/object/access/full-recovery, adapter/quotas, C01 or integration/Cloudflare/cost gates. No additional baseline rerun is needed.

## Step02.2 current gates

[Remaining-gate matrix](../ai-sdlc/step-02-remaining-gates.md) distinguishes independently reviewed native backend/frontend and tiny tooling restore from unfinished product/runtime checks. R01/R02 remain CLOSED, no reruns. Actual Claude has authorized a narrowly scoped native C01 implementation envelope with SQLSTATE-first precedence and native-only retryAfter1; [contract](../testing/step-02-c01-verification.md), PREPARED / WAITING_MANUAL_DISPATCH to actual ZCode. No C01 code/tests yet. [Integration plan](../testing/step-02-integration-poc.md) remains PENDING for compatible scope/API/auth. Full transaction/object/access/recovery and exact Workers adapter/quota PoCs remain NOT_RUN. Current public docs are refreshed, not runtime proof.

## C01 implementation return and corrective boundary

Actual fd747ae owner source/test/runtime return is available; no longer merely prepared. Actual Claude CHANGES_REQUIRED before native acceptance, despite conforming production logic. [Intake](../reviews/step-02-c01-intake.md), [bounded test/doc correction handoff](../implementation/handoffs/MC-002-BE-C01-ZCODE-REWORK-PROMPT.md). Codex66focusednamedpasses were noDB checks; no runtime pool57014assertion is inferred from3sdeadline logs. POC-02-01 remains native-characterization scope, C01-NATIVE pending correctedhead/QA, full product/adapter/integration/recovery/cloud/cost gates unchanged.

## C01 corrected native slice accepted — current

Actual ZCode R1 return52b60a4 contains exactly F1test/F5docs/F6rule changes; actual OpenCode sessionses_e90ff024dffeuJ1Kmcnp6qicY9, exit0, PASS_WITH_LIMITATIONS accepts C01-NATIVE and closes F1/F5/F6/E-03/F8. Current state NATIVE_PASS / PRODUCT_OPEN, no more ZCode rework or reassurance rerun. [Closure and exact limitations](../reviews/step-02-c01-native-closure.md). Owner279namedpass/0fail/0namedskip full suite and Codex2namedpass committed-head F1 check are distinct from reviewer packet-only verification; no DB replay by Codex/OpenCode. Original self-hash-list defects are preserved and resolved by a separately verified canonical inventory. Earlier rework/waiting labels above are historical. Integration/API/auth scope, full product/recovery/Cloudflare/cost and Architecture Approval Gate remain OPEN; MC-002 not DONE, Step03 not started.
