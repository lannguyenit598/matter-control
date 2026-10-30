# INT-A — intake of Antigravity R2 launch-approval update

Actual intake Local Codex2026-10-26; task MC-002-INTA-FE-VALIDATION-R2, branch codex/unified-project-flow, HEADa62d838791ba188838c4ff00b7b6e265ac775056. **APPROVAL_ACKNOWLEDGED / REVISED_TEST_DOC_PACKET_INTAKEN / REWORK_REQUIRED / RUNTIME_NOT_RELEASED**. Humanforwardedthisnewownerupdate; no agentinvocation/runtime/sourcefix byCodex.

## What changed and what did not

Owner read directPOoptionAapproval and expanded launcher/API_MODE/production mock/evaluator tests. Currentpacket is15payloads131584bytes, owner29/29selfchecks and8/8launchermocks; raw/export internallyconsistent. [59integrity/preservationchecks](../testing/inta-fe-validation-r2-approval-update-intake/checks.json) PASS. No fullowner-suite rerun byCodex; these reportedtestcounts remain owner-side until proper scopedreview.

[Revision comparison](../testing/inta-fe-validation-r2-approval-update-intake/revision-lineage.json) shows7payloads changed and8unchanged against earlierintake's observedentryhashes. Allfivecoreexecutables areBYTE_IDENTICAL: coordinator.py,guard-validator-r2.sh,guard_evaluator.py,observer.py,harness-dev.mjs. Thus [existing R2-I01..06](inta-fe-validation-r2-intake.md) remain unresolved: wrapperdoesnotdispatchandcanTERMany18086owner; coordinatorusesnpx/inheritedenv/bypasseslauncher; identity/cleanup/fast-exitPASS/final-state/probewiringgaps and untestedCLIbranches remain. MoreAPI_MODEtestcases do not fix those implementationpaths.

NewAPI_MODE/nonempty+empty andNODE_ENVproduction mockedcoverage are useful targetedsourceevidence for the approved boundary; they are not livezero-upstream/neverlisten results. No new29casecanonicalmatrix;51IDs/results unchanged. Originalsource/59ledger/R1andinitialpacketspreserved. Historic1FAIL/21INSUFFICIENT/Xunknown/Nextunknownexit stay.

## Exact approval interpretation

INTA-LAUNCH-D01optionA isalreadyAPPROVED; do not re-ask. [INTA-1-LAUNCH-01](../implementation/inta-launch-contract-addendum.md) selects the supportedguard-firstentrypoint boundary. It explicitly leaves actualfile/Nodeimport/argv/env/cwd/sourcehash unverified until correctedimplementation/nonauthorreview and explicitcue. Owner's updated §4.2 declaring `node --experimental-strip-types bin/harness-dev.mjs` as the officiallyselected literal overstates thisapproval; currentprototypefile is underlauncher/, not an acceptedbin/entrypointbinding. Treat that literal as a candidate, not a freshPOdecision. RawCLIunsupported/historicalFAIL retained; this is not a renewedscopequestion.

## In-place update provenance and frozen review snapshot

Owner regenerated the already-intaken R2manifest and editedtheR2report in place. Prior15payloadpacket123515bytes and report were pinned in Codexreview-inputs; those2liveinputs no longer match theiroldpins. This is a newauthorrevision, not byte-identical continuation of the same frozenpacket. Do not rewrite oldintakemanifest/hash history, suppressallhashchecks or present currentraw/exportequality as preservationoftheearlierrevision.

The oldcompletechangedpacketbytes were not retained as aseparatecopy; earlierobservedhashes/size and unchangedcorefiles remain available. No reconstruction or historicalcopyclaim. [Explicit input supersession](../testing/inta-fe-validation-r2-approval-update-intake/review-input-supersession.json) records exactly2changedoldreviewrefs. Codex has now copied the wholecurrent16filepacket into NEWimmutable [review snapshot](../testing/inta-fe-validation-r2-approval-update-intake/review-snapshot/manifest.json) and saved currentownerreport separately. Subsequent ownerwork mustuseaNEWrevisiondirectory/manifest/return ratherthan overwriting thissnapshot or anotherpinnedpacket.

## Next action

Use the existing [OpenCodeR2source-reviewprompt](../implementation/handoffs/MC-002-INTA-OPENCODE-FE-R2-SOURCE-REVIEW-PROMPT.md) WITH the [revisionupdate note](../implementation/handoffs/MC-002-INTA-OPENCODE-FE-R2-REVISION-UPDATE-NOTE.md). The note directsreviewto frozenupdatedsnapshot and preciselysupersedes2oldownerrefs; originalreview-inputs.json remains unchanged. Reviewcoreintegration/ownership andnewtestclaims once, not a repeated36caseaudit/build/stagereplay. Ifreviewalreadybegan, pinthenewaddendumwithoutoverwritingitsownpreviousrecords; reportchangedrevisionbasis. No new review invokedbyCodex.

Status remainsREWORK_REQUIRED/RUNTIME_NOT_RELEASED despite approvalacknowledgment. Nonauthorreadiness andactualcorrectedsource/entrypointbinding, freshprivateattempt/preflight andexplicitcue remain. Actualsecretprivacy/ownedPGteardown/final36conformance remainopen; no needreopenapprovedproductpolicy or optionA.

Skipped: reexecuting29tests/Node/Next/observer/build/HTTP/DB/privateconfig/lifecycle/provider/commit. Risk: currentR2wrapperremainsunsafe, coredefectsunchanged; in-placeauthorrevision requires explicitreviewrepin and future immutableattemptpaths.
