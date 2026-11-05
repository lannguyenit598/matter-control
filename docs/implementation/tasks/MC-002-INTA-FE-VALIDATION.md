# MC-002-INTA-FE-VALIDATION — Antigravity frontend handback

Status: IN_REVIEW / R5_OWNER_RETURN_RECEIVED / CODEX_STAGE_BLOCKED / RUNTIME_NOT_RELEASED. Owner: actual Antigravity. Coordinator: Local Codex. Priority: P0 INT-A closure. Requirement IDs: NFR-002, INT-ENV-05, INT-ENV-07, INT-ISO-01/02; original51acceptance IDs retained. Independent reviewer for R5 source-only: actual ZCode under direct PO quota reassignment, subject to an exact nonauthor declaration; historical OpenCode reviews retain their actual identity. No author self-approval.

Authority: direct PO2026-10-26 instruction to transfer FE to Antigravity, continuing approved INT-A local integration scope. ZCode owns backend execution; Codex retains PG/DevOps/privacy and coordination. This assigns remaining FE validation; productUI/auth/fullSTEP03B still require their existing approval gates.

## Inputs, baseline and dependencies

Coordination branch codex/unified-project-flow, prepared at a62d838791ba188838c4ff00b7b6e265ac775056. Read latest root instructions/status and [manual handoff](../handoffs/MC-002-INTA-FE-VALIDATION-ANTIGRAVITY-PROMPT.md). Pinned product3e5a642479acb789eb210e73fba956f3e85082e3 and harness48cc03e949d66fc47a7d304413621eb79804e6c1 remain in original/tmpworktrees for this frozen assignment, despite imported apps/frontend/tools/inta-harness. Frozen [INTA-1](../inta-approved-contract.md) and final [readiness return](../../reviews/inta-closeout-readiness-return.md)/45fileexport remain unchanged. Exact selected input hashes are in [handoff manifest](../../testing/inta-fe-validation-handoff/inputs.json).

Codex disposition of Next drift: historical Next termination stays NOT_OBSERVED; no graceful-stop or ISO03PASS claim. Only a separate new isolated FE attempt is cued, conditional on fresh source/ledger/port checks. This releases the new-attempt precondition; it neither restarts nor repairs the historical run. The old run's termination-evidence limitation remains open for QA. No extra business/architecture approval is needed for this bookkeeping disposition; material deviation still stops for the proper authority.

## Owned scope and outputs

New local snapshot/runner/dependency/generated outputs only under /tmp/mc002-inta-fe-validation-20261026, new raw /tmp/mc002-inta-evidence/frontend/validation-20261026, reviewed export docs/testing/inta-returns/frontend/validation-20261026, new return docs/reviews/inta-fe-validation-antigravity-return.md. Every new path must be absent before creation. Occupied path or source/ledger drift stops for Codex; no overwrite/reset. No source worktree/branch or Git mutation needed.

1. Eleven missing startup refusals, each with nonempty synthetic sentinel; also an empty-value variant per key to verify the documented including-empty behavior. These22subchecks stay under INT-ENV-05. Existing API_MODE/production/default-off evidence retained, no full guard/stage rerun.
2. Product default test collection and production build in the new exact3e5a642 snapshot; inspect module/routes/traces to assess harness exclusion. Preserve failure/deviation rather than modify product config/lockfile or switch bundler. HostedCI remains NOT_RUN.
3. Retain source/dependency/shared-client integrity and clear separation of historical runtime versus new synthetic validation. Optional cache probe in the old plan is not assigned in this handoff.

No Go/PG start/stop/restart, database/SQL/real backend request, private env/credential read, old run/ledger mutation, stage1..7 replay, Xlookup/rePOST, source/config/lockfile changes, install/download, provider/model/account changes, paid services, merge/commit/push or production operation. Actual-secret-value scan and same-PG final teardown remain Codex tasks. New owned observer/children may be started and safely stopped only within this explicit local validation scope, with captured process identity and exit evidence; no unknown/historical process signals.

## Acceptance and evidence

Each variant records exact argv, bounded env key names/synthetic values only, start/endUTC, numeric exit and separate stdout/stderr, observed listener condition, zero upstream counter and ownership/cleanup. Timeout/unexpected listener/send is failure/blocked, never PASS. Product exclusion requires actual collected paths/build outputs/traces, not a bare token search. Document current installed tool/versions and docs compatibility before commands. No install or unsupported option workaround.

A complete return has author/tool/model/provider identity, base/head, input/source hashes, cases observed/expected/verdict, limits, command exits/logs, safe redaction, no-self-hash inventory and raw/export byte equality. All51formal results remain untouched; Codex intakes returned subevidence before independent OpenCode QA. Return IN_REVIEW or an exact blocker; never self-award DONE or fullINTA/MC002 acceptance.

Preparation validation: doc links/input hashes, original59ledger and45sealedexport preservation, root/workflow/RACI owner consistency; no Antigravity invocation/test/build/lifecycle by Codex. Completion evidence: docs/testing/inta-fe-validation-handoff/checks.json. Historical reviews retain original authorship and scope.

Next: human delivers the full prompt in actual Antigravity. File preparation alone is not dispatch; actual acknowledgement is required before recording IN_PROGRESS. Skipped: execution/provider dispatch and independent review. Risk: fresh preconditions/dependency isolation may block execution; historical Next exit and separate privacy/teardown remain unresolved.

## Actual Antigravity validation return intaken — 2026-10-26

[Codex intake](../../reviews/inta-fe-validation-intake.md) verifies149integrity/source/artifact checks; original18payloads64321bytes and19raw/export pairs match. Actual22refusal outputs verified, but oneAPI_TOKEN/nonempty listener contradicts never-listen and all22observer outputs are missing/defaulted0. FEVAL-F01..05 require targeted correction. Product18test paths/8NFTs/31assets corroborated with limits, not discarded or independentQAaccepted. Original323/25source snapshot files and59ledger unchanged.17narrative hashes stale; harness dependencies directly symlink originalFEdependencies. No source/dependency mutation is inferred from the link alone.

[Source/evidence-only R1 prompt](../handoffs/MC-002-INTA-FE-VALIDATION-R1-ANTIGRAVITY-PROMPT.md) READY_NOT_DISPATCHED. No new live validation/build/observer is cued: observed pre-listen contract failure first needs honest disposition/launch-path proposal, corrected fail-closed measurement/selfchecks and nonauthor scope review. No fullstage/productbuildrerun, criteria waiver or mandatoryfullClaude loop. Codex did read/hash/copy only, no runtime/provider/lifecycle/commit. Current role Antigravity retained; OpenCode independent verdictPENDING; all51formal results unchanged.

## Actual source-only R1 return received — 2026-10-26

[R1Codexintake](../../reviews/inta-fe-validation-r1-intake.md) verifies75payloads98873bytes and66retainedvariantfiles;238integrity/preservation/bugreproductionchecks,9pureowner-selfchecksPASS.3additionalfailclosedvectors incorrectlyPASS; shellmetadataosimport/booleaninterpolation/negatedstatus defects andobserver/launcherissues remainR1-C01..04. Historical1FAIL/21INSUFFICIENTdispositions and17errata/assetcount correction acceptedDOCUMENT_ONLY. FEVALruntime/sourceclosuresnotselfawarded; REWORK_REQUIRED/RUNTIME_NOT_RELEASED retained.

No redundant broadR2rewrite or live/buildrerunassigned. ExistingOpenCode36case/source review now takes the separately frozenR1addendum for consolidated nonauthorrecommendation; actualreviewnotinvokedbyCodex. Originalpacket/source/59ledger/formalresults/gatesunchanged.

## Actual OpenCode independent review received — 2026-10-26

[Codexintake](../../reviews/inta-opencode-closeout-r1-intake.md) verifies actual18228byte report/SHA11d7994b…ee5 and128integritychecks. VerdictCHANGES_REQUIRED: C01..04confirmed, documentaryR1correctionsaccepted; coverage33PARTIAL/3INSUFFICIENT, notfinal36acceptance. [AntigravityR2source-onlyprompt](../handoffs/MC-002-INTA-FE-VALIDATION-R2-ANTIGRAVITY-PROMPT.md) READY_NOT_DISPATCHED for exactfourgroups andactualintegration/mock/importselfchecks; runtimeNOT_RELEASED. NoClaudeloop/fullbuild/7stagererun. Current/priorreviewrecords retained; metadata/timinglimits recorded, no retrospectiveidentityorchronologyproof. Privacy/teardown/finalconformance/51formal/gatesunchanged.

## Review rounds adjudicated and consolidated — 2026-10-26

[Consolidatedintake](../../reviews/inta-opencode-rounds-consolidated-intake.md) adopts originalsessionround1/lateralround2 perhumanforwardedPOadjudication. BothverdictsCHANGES_REQUIRED;33PARTIAL/3INSUFFICIENTcasesretainedonce, noformalPASS. ExistingAntigravityR2source/selfcheckpromptremainsvalid/readywithoutduplicateassignment. [INTA-LAUNCH-D01](../inta-launch-scope-decision.md) separatelyrequiresPOchoiceofsupportedlauncheracceptancevsbroaderrawCLIhold; sourcefixescancontinuewhilewaiting, no runtimecueorcriteriawaiver. Oldprovenance62hexwordingcorrectedadditively:actualoriginalpin64charsonewrongchar. No oldreport/source/evidence/ledgeredit.

## Launch option A directly approved — 2026-10-26

[INTA-1-LAUNCH-01](../inta-launch-contract-addendum.md) adopts officialguard-first launch boundary under directPOreply. Scopegateapproved, notpending; no repeatchoice. ExistingAntigravityR2source/mock/importselfchecks remainvalid. SupportedrawCLIneverlistenclaim excluded/historicalFAILretained. Exactimplementationbinding+nonauthorreview+freshprivateattemptpreflight+explicitCodexcue still precede runtime;51formal/othergatesunchanged.

## Actual Antigravity source R2 received — 2026-10-26

[R2intake](../../reviews/inta-fe-validation-r2-intake.md) verifies15payloads123515bytes, fixed3R1typevectors,53integrity/probereproductionchecks; actualcoordinatormocks expose directnpx/envbypass/fast-exitPASS/cleanupgap. Shellwrapperonlyimports yet porttrapcansignalunownedlistener. REWORK_REQUIRED/RUNTIME_NOT_RELEASED; doNOTexecuteit. OpenCode NEWimplementationR2source-onlyreviewpromptprepared, no repeat36audit/productbuild/7stages. POoptionAstaysAPPROVED; no repeatdecision. Originalsource/59ledger/oldpackets/formalresults unchanged.

## Antigravity approval update to R2 received — 2026-10-26

[Revisedpacketintake](../../reviews/inta-fe-validation-r2-approval-update-intake.md) verifies15payloads131584bytes, owner29selfchecks/8launchermocks.7test/docpayloadschangedinplace,5coreexecutablesunchanged, soR2-I01..06remainopen. Prioroldreviewmanifest/reportpinsretained; currentpacket frozen undernewuniquereview-snapshot andexplicit2inputsupersession. OpenCodecurrentreviewusesrevisionnote/readset; nofull36audit/build/stagererun/newlivecue. OptionAalreadyapproved, exactentrypointbindingstillunverified; no reapprovalrequest. REWORK_REQUIRED/RUNTIME_NOT_RELEASED.

## Independent implementation-R2 review received — 2026-10-26

[Actual OpenCode intake](../../reviews/inta-opencode-fe-r2-intake.md): **CHANGES_REQUIRED, source-only**; all six R2-I01..06 findings confirmed. The 55 integrity checks passed. Scoped review completion does not close INT-A validation. PO option A remains approved; runtime is not released. Do not execute the unsafe R2 wrapper.

[Antigravity R3 prompt](../handoffs/MC-002-INTA-FE-VALIDATION-R3-ANTIGRAVITY-PROMPT.md) is **READY_NOT_DISPATCHED**: one coordinator dispatch through the approved launcher, one owned cleanup path, strict final evidence checks and tests of the actual code. Use new R3 paths; preserve R2 artifacts. Independent R3 review, fresh prerequisites and an explicit cue precede runtime. Privacy, teardown, final 36-case QA, all 51 formal results and MC-002 gates remain unchanged.

## Antigravity R3 received — 2026-10-26

[R3 intake](../../reviews/inta-fe-validation-r3-intake.md) verifies 20 payloads / 225,606 bytes, raw/export equality and seven exact baseline-to-target diffs. Owner reports 30 selfchecks and 10 launcher mocks PASS; Codex did not execute them. Six static observations retain identity/binding/evidence/test-safety gaps, so source remains **REWORK_REQUIRED / INDEPENDENT_REVIEW_PENDING / RUNTIME_NOT_RELEASED**. Do not rerun the suite: real `os.kill` defaults remain reachable.

[OpenCode R3 source review](../handoffs/MC-002-INTA-OPENCODE-FE-R3-SOURCE-REVIEW-PROMPT.md) is **READY_NOT_DISPATCHED**, read/hash/static only. Antigravity R3 is received; its earlier preparation entry is historical. Option A remains approved. No formal test, historical failure, ledger or MC-002 gate is promoted.

## OpenCode R3 review received — 2026-10-26

[Independent R3 intake](../../reviews/inta-opencode-fe-r3-intake.md): **CHANGES_REQUIRED_SOURCE_ONLY**, 108 integrity checks. C01/R2-I01 CLOSED_SOURCE_ONLY; C02..04 and R2-I02..06 PARTIAL; R3-N01..06 confirmed and NF-1..6 carried. [Antigravity R4](../handoffs/MC-002-INTA-FE-VALIDATION-R4-ANTIGRAVITY-PROMPT.md) is **READY_NOT_DISPATCHED**, bounded source/mock corrections only. No unchanged-suite rerun or runtime cue. Option A remains approved; 51 formal cases and MC-002 gates unchanged.

[Separate privacy/teardown return](../../reviews/inta-codex-privacy-teardown-return.md) records privacy PARTIAL (zero actual matches in selected scope, raw QA missing) and exact PG stopped/retained exit 0 with 59-file ledger/source preservation; independent acceptance pending. This supersedes earlier running-PG assumptions. R4 must not start/use it; new outputs need supplemental privacy coverage.

## Antigravity R4 return received — 2026-10-26

[R4 intake](../../reviews/inta-fe-validation-r4-intake.md): 132 integrity checks PASS, 22 payloads / 285,768 bytes, 23 raw/export pairs and seven semantic diffs. Actual Antigravity owner results 46/46 selfchecks +13/13 launcher mocks are retained, not Codex-rerun. Cleanup caller/schema/signal-test/plan improvements are visible; five focused source/binding/proof observations and test-reach gaps need independent adjudication. R4 author return is received; earlier READY author labels are historical.

[OpenCode R4 source review](../handoffs/MC-002-INTA-OPENCODE-FE-R4-SOURCE-REVIEW-PROMPT.md) is **READY_NOT_DISPATCHED / READ_HASH_STATIC_ONLY**. No runtime cue, dependency stage or new author rework is dispatched. Other privacy/teardown and BE02/N1 review sessions can continue with separate pinned inputs/outputs. PG remains stopped by retained evidence; R4/new QA need supplemental privacy coverage. Option A and all formal/gate dispositions unchanged.

## Antigravity R5 received — staging preflight blocked

[R5 intake](../../reviews/inta-fe-validation-r5-intake.md) verifies22payloads/332773bytes,23raw/export pairs and7exactdiffs.46/46selfcheck assertions and17/17launcher results remain owner evidence, not rerun. Actual Codex preflight hashes binaries/guard and checks explicit dependency realpaths; reserved stage absent. Default-off CLI stage gate, status-only receipt, original-path launcher and incomplete lifecycle/attempt proof prevent honest verified staging. No copy/install/VERIFIED receipt/runtime performed. Independent R5source+blocked-preflight prompt READY_NOT_DISPATCHED; precise findings await independent adjudication before owner correction. Frozen3sourceheads/59ledger/51formal and all product/release gates preserved; later actual-secret matching needed.

## R5 independent source review reassigned to ZCode — 2026-10-26

Direct PO reports OpenCode quota exhausted and assigns actual ZCode to review this R5 frontend source/evidence scope. [Full ZCode prompt](../handoffs/MC-002-INTA-ZCODE-FE-R5-SOURCE-REVIEW-PROMPT.md) READY_NOT_DISPATCHED;17directpins/44R4-R5payloads retained, unique ZCode outputs, independence declaration mandatory. Antigravity remains FE implementer; ZCode remains backend owner in separate tasks. No automatic switch/provider/login or external dispatch; old OpenCode prompt/manifest preserved and superseded for future R5dispatch only. Same R5-I01..06/staging block/51formal and architecture/product/runtime/Mimosa gates remain unchanged.
