# INT-A — consolidated intake of two adjudicated OpenCode review rounds

Actual intake: Local Codex,2026-10-26; task MC-002-INTA-QA-CLOSEOUT-R1; branch codex/unified-project-flow, base a62d838791ba188838c4ff00b7b6e265ac775056. **REVIEW_ROUNDS_RETURNED / CHANGES_REQUIRED / LAUNCH_SCOPE_DECISION_PENDING / RUNTIME_NOT_RELEASED**. This closes the receipt/consolidation of the reviewrounds, not INT-A,MC002oranyruntimeacceptancegate.

## Adopted round identity and exact records

Humanforwarded finalmanifest/adjudication verifies SHA2563a74ebf262663f1e7b94659182dbd5be32f36095b4a31b498f27ea6879f0d2d6,11916bytes. As recorded byPOadjudication, originalsession is round1 and lateralset is legitimate round2. No repeatidentityapprovalrequested. This is humanrelayedadjudication, not a Codex-observed externalinvocation or newproviderpermission.

- Round1: docs/reviews/inta-opencode-closeout-review-r1-original-session.md,22245bytes/SHA256dcc0c5bb736b35ca7f7ec6f950bdfeeec377dc39a6f363d27e8dc0763f7874da. required-rows.json contains the detailed per-row anchors; verification-log.json and originalreview-inputs-addendum.json retained. ReportedmodelGLM-5.3-FlashFree/provideropencode; exactCLIversionNOT_RECORDED.
- Round2: docs/reviews/inta-opencode-closeout-review-r1.md,18228bytes/SHA25611d7994b1625f2fca262bc9e725c4ec56f9847d14be37d890f5fb902e9cb6ee5 plusr1-addendumfiles. Model/provider/CLIversion remainNOT_RECORDED in thisround'sownmetadata; do not inheritround1settings.

[Registry](../testing/inta-opencode-rounds-consolidation/review-round-registry.json) pins both sets. [20integrity/consolidationchecks](../testing/inta-opencode-rounds-consolidation/checks.json) verify finalmanifest,8listedoutputfiles,36samecaseIDs/verdicts,original59ledger/51formalresults/sourcepackets. Allcurrentreport/manifests retained withoutoverwrite/rename. No independentrevieworagentcall executedbyCodex.

## One consolidated technical disposition

Both reviewers confirm FEVAL-F01..05 and R1-C01..04, acceptdocumentarycorrections withlimits and require the same narrowR2fixes. [Combined36map](../testing/inta-opencode-rounds-consolidation/combined36.json) retains BOTHoriginalrowrecords/pointers, deduplicated to36cases:33PARTIAL/3INSUFFICIENT,0SUPPORTED. No72casecount, no newruntimeobservation orstatisticalindependenceclaim from sharedinputs.14productdeferred/1externalblocked remainexcluded. Deepbindsareuseful, but neitherreviewrederivedevery23endpointacceptanceclause; finalcoveragework remains.

Existing [AntigravityR2prompt](../implementation/handoffs/MC-002-INTA-FE-VALIDATION-R2-ANTIGRAVITY-PROMPT.md) staysvalid/READY_NOT_DISPATCHED: source/mock/importonlyfixesC01..04 can proceed NOW. No duplicateR2assignment,thirdreviewofunchangedR1,wholearchitectureloop,productbuildor7stage rerun. Sourcefixes do not depend on choosing launchacceptancesemantics, but relyingonlauncher-mediatedruntimePASS does.

Parallel [INTA-LAUNCH-D01packet](../implementation/inta-launch-scope-decision.md) isWAITING_PO_SCOPE_DECISION. OptionAacceptsonlyreviewedsupportedguardfirstentrypointwithrawCLIlimitation; optionBkeepsbroaderrawCLIrequirement/currenthold. This is distinct from POadjudication ofreviewroundidentity. FrozenINTA-1remainsunchangeduntilanexplicitdecisionandnewaddendum. R2sourcecorrection doesnotselfamendthecontract; newruntimecue waitsforfixedsource,nonauthorconformanceandtheactualscopechoice.

## Corrections to inherited provenance wording

[Exactcorrectionrecord](../testing/inta-opencode-rounds-consolidation/provenance-corrections.json) distinguishes actualoriginalpin from round2quotation. Originalcredentialscanpin has64hexcharswithposition55c→d mismatch. Round2quotes a different62-charstring and classifiesitmalformed. PriorCodexintake62wordingmustnotbeappliedtotheoriginal64charpin; thisaddendumcorrectsitwithoutchangingoldreports. CORR-02missingpinlog remainsNOT_RETAINED, notbackfilled.

Originalrecord's shadow/liveR1docpins and correctedfuturetimestampare now disclosed/resolvedforward by finalmanifest; prior"incompleteattemptonly"description is supersededbyPO'scompletedround1classification. Clock/mtime/sessionorderingremainsqualified. Neitherfilesystemmtime/hashaloneestablishesinvocationchronology; record sequences and actualhumanadjudication carry their respective limits. Unmaterializedintermediate7e35c75c…manifesthashisdeclaredlineage, not independentlyretrievedoldbytes.

Finalmanifest'sgenericINT-CONF01(Claude)ownerline doesnotreimposeamandatoryClauderound: actualPOassignmentmakesarchitectureinvolvementconditionalonmaterialdeviation. Preservecurrentconformanceowners andpropermaterialdecisionauthority. HistoricalNext/Goexitlimitations and PGfinalstop/actualsecretscan remainopen; do not restartanabsentprocessmerelytogenerategracefulstopevidence. Aggregate0FAILcoverage doesnotwaiveknownINTENV05subclausefailure.

## Current next action

DeliverexistingAntigravityR2sourceprompt once; no newruntimeexec. Resolve concreteINTA-LAUNCH-D01 separately whileR2fixesproceed. AfteractualR2return, reviewonlychangedsource/launchboundary under NEWuniqueowner/roundoutputpaths; serializewritestoasinglecanonicalreportnamespace, no simultaneoussharedfilenameclaims. No automaticagentautomationorproviderfallback.

Skipped: new runtime/tests/build/DB/privateconfig/provider/lifecycle/commit. Risk: source defects and launchscopechoice stillblockguardvalidation; privacy/teardown/final36acceptance remainopen despite completedreviewrounds.
