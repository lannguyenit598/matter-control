# P0 delivery V2 — R5 review intake and bounded INT-A closure track

Task MC-P0-ZCODE-DELIVERY, supplemental record after actual MC-002-INTA-FE-VALIDATION-R5-SOURCE-REVIEW-ZCODE return. Actor Local Codex; prepared2026-10-26; base/head a62d838791ba188838c4ff00b7b6e265ac775056. **PLAN_DELTA_PREPARED / W0_READY_NOT_DISPATCHED / NO_REPAIR_OR_RUNTIME_RELEASE**. This supplement plus the unchanged [base roadmap](p0-zcode-delivery-plan.md) forms version2. Existing packets, requirements, design decisions and W0..W7scope remain intact.

## Changes to the plan

1. Replace “ZCode R5review prepared/pending” prospectively with **actual review received: CHANGES_REQUIRED_SOURCE_ONLY + PROOF_BASIS_BLOCKED; stage BLOCKED_CONTRACT_NOT_BINDING**. Do not run the same review again. The [intake](../reviews/inta-r5-zcode-review-intake.md) retains source closures and all R5-I01..06/Z01..04findings.
2. Add an INT-Aclosure subtrack alongside W0, distinct from the fullproduct delivery graph. It blocks the claimed INT-A/MC002acceptance, not all independent source inventory, contract/design preparation or other specifically activated local slices. W1still has its own unpassed source/auth/API/design gates; this supplement grants no implementation exception.
3. Put proof feasibility before another author/test/staging round. The accepted criterion remains launcher-bound never-listen/no-upstream under OptionA. Sampling/liveness predicates and process absence must not silently replace it. Architecture/QAfirst propose an exact source-backed evidence basis for the supported path, expected retained records and false-positive/negative challenge scenarios. If it cannot meet the approved criterion, return a concrete alternative/impact to PO; do not select a relaxation or forcePASSwithdelay/retry. No automatic migration toINT-A0/B/C.
4. Combine all source/binding defects into ONE later correction: mandatory realCLIstagebinding, one receipt schema/hash/realpath/expectedbinarysource map, staged launcher values/noPATHfallback, fail-closed typederrors; durable required run/variant/process/argv/cwd/start/exitidentity record; strict non-null OSidentity/pinnedhelpers/once-onlycleanup; same verified guard source; realCLI/fakeclock/schema/dir-fsyncregressions and standalone provenance. Include additive Z01hasherrata and explicitattemptdir. Never edit oldR5manifest/report or require every test count remain46/17.
5. If ZCode implements that later correction, route its newdiff to Codex or another qualified nonauthor. Its present independent review remains valid only for the frozen AntigravityR5source. Separate sessions alone do not make ZCodeindependent of its own source. If no reviewer available, markREVIEW_BLOCKED; do not self-approve or retry a paidprovider.
6. After stable binding source and independent source/proof acceptance: Codex actually provisions and verifies a NEWprivate stage, retains exact receipts; review source+actualstage as one readiness packet. Then only a separate bounded runtimecue may run the new tests. Freeze evidence, extend actual-secret privacy coverage to new outputs, safeownedteardown and final36caseQA before examining INT-Aclosure. Existing all51formal results unchanged until execution/review evidence exists.

## Dependency track and handoffs

| ID | Owner / immediate output | Prerequisite / state |
|---|---|---|
| INTA-PROOF-DEC | Codex coordinates architecture/QA; ZCodeW0may propose one proof-basis/acceptance decision section with exact source scope and tests | PREPARATION_ONLY; no criterion selection/waiver. Needed before claiming repair closescontinuity |
| INTA-CORR-NEXT | Intended ZCodeexecution owner, one bounded candidate correction contract naming files/outputbase/tests/reviewer; historical Antigravityauthorship retained | PLANNED_NOT_ASSIGNED; exact scoped cue plus accepted proof contract required before sourcewrite. No new competing Antigravitytask |
| INTA-REVIEW-NEXT | Codex or another qualified nonauthor; exact changed source/mockevidence review | Waitactualcorrectionreturn; source-onlyacceptance notruntime |
| INTA-STAGE-NEXT | CodexDevOps; actualcopy+realpath/hash inventory and boundreceipt | Waitbinding/proofsourceaccepted; stageabsentnow. No install/copy inW0 |
| INTA-RUNTIME-NEXT | Named actualexecutor, followed by qualified nonauthorQA and laterprivacycoverage | Explicitcue after combinedready; no replayold7stages/51rowpromotionbyreport |

## Instructions for the current P0 W0

Continue the one existing W0preparation, not a second projectinventory. Incorporate the accepted R5verdict and exact open findings in source-gap-map/decision-package/progress and W1dependencyanalysis. Replace R5review pending with received. Distinguish transportharness gates from productfeature gates and keep OpenDesignsource/spec work parallel. W0does not become a repair/probe/test task.

If originalW0has not started, use the [fullV2prompt](handoffs/MC-P0-ZCODE-DELIVERY-V2-PROMPT.md). If the owner already started/completedW0usingV1, deliver this supplement only: preserve oldoutputs, do not restart or overwrite. Write one new docs/implementation/p0-zcode-returns/w0-r5-delta/return.md plus progress.json (absencecheck); record incorporatedfindings, proofdecision/correctioncontractdependencies and unchanged20P0/3GW. No copyingfullbaseline or repeatingruntime. Codex intakes actualreturn before lateractivation.

P0W1..W7remain conditional as before; no new authprovider, fieldshape, numericbudget, designdirection or productionchoice is made. Source/Mimosaacceptedbase, API/auth, scopeddesign and independent producttests remain required. R5Z01is a reporterratum, not evidence that payloads changed or a reason to rerunallownerchecks.

Skipped sourcewrite/tests/staging/runtime/privatevalues/provider/commits. Risk: proving continuous never-listen needs a sound acceptance/evidence basis; adjusting sampling code alone may not suffice.
