# INT-A — INTA-LAUNCH-D01 acceptance scope decision packet

Status: OPTION_A_APPROVED / ACCEPTANCE_BOUNDARY_RECORDED / RUNTIME_NOT_RELEASED. Prepared Local Codex2026-10-26 after actual OpenCode two-round review. This is a concrete supported-launch choice, not provider/tool permission, repeated product-policy approval or automatic runtime cue. AntigravityR2source/selfcheck work proceeds independently; no need to wait for this choice to fix C01..04.

## What requires a decision

Frozen INTA-1§2 requires startup refusal with production/product-auth variables and defers exactNextCLIargv to installedsource/docs evidence. Observed directNext16.4.2dev bindsbeforeconfigguard, so old directCLItestfails theneverlistencriterion. New guard-first launcher could preventspawningNext for rejected inputs; it cannot make arbitraryrawCLI safe or retroactivelychangeoldFAIL. Revieweroriginalsession§6 explicitly says: "An explicit contract §2 amendment decision is required before relying on launcher-mediated acceptance; PO owns it". This quotedreviewinstruction reflects the material choice of which entrypoint satisfies acceptance, not a requirement thatPOapproveeveryrunnerbugfix.

POadjudicationinoutputs-manifest.json accepted reviewerroundclassification only. It did not answer this launch-scope question. Existing criticalbusinesspolicy remains approved; nothing here reopensit.

## Option A — supported guarded entrypoint (recommended)

Adopt additive INTA-1-LAUNCH-01 for this local testasset:
- The official supported harness entrypoint is a new reviewed guard-first launcher. Exactfile/Nodeimport/env/argv/version/sourcehash is recorded AFTER R2source and nonauthorreview. It invokes the sameexistingvalidateHarnessStartup BEFORE any Nextspawn; no duplicatekeylist, frozenproduct/Nextpatch, authbypass or paidproviderchange.
- Neverlisten acceptance applies to that declared supportedentrypoint. For forbiddenstartupinputs: actualguardrefusal, noNextspawn, no18085listener, verifiedpersisted0upstreamrequests, trueexit1. A missingimport/parser/probe/counter/cleanupfailure is notPASS. Test the11remainingkeys nonempty/empty; ensure API_MODE and NODE_ENVproduction are covered on the newlaunchpath before claimingfullINT-ENV-05, rather than reuseold directCLIprelisten evidence. Originaldefaultoff404requirement unchanged.
- Rawnextdev bypass remains explicitly unsupported/unverified for neverlisten; its observedstartupfailure remains part ofreport. No claimthatallpossiblelaunchpathsorproductionsecurityareprotected. Reviewclaimmuststateitsexactlaunchboundary.
- Original INTA-1, source48cc03e and allhistoricalreturns remain immutable; record a new normativeaddendum linking thisPOdecision and exactacceptedlaunchimplementation. No originalFAILconversion or newacceptanceIDs.

POapproval ofA authorizes this technicalacceptanceboundary only. It does NOT releaseunreviewedruntime or acceptguardtests: actualR2fixes,nonauthorreview, verifiednewprivateattempt/source/ledger/portsandexplicitCodexruntimecue still required. Full36caseQA/privacy/ownedteardown/conformance/productionauth/cost/recoverygates remainopen.

## Option B — keep broader launch requirement and hold runtime

Do not adopt launcher-only acceptance. Keep rawdirectCLIlaunch within the neverlisten requirement; currentconfigguard cannotmeetit. Preserve observedFAIL/NEEDS_SCOPE_DECISION and holdnewguardruntime. Request a bounded alternativetechnicalscope fromarchitecture/PO if needed; do not autopatchNext, waivecriterion or switchINT-A0/B/C. Antigravitysourcefixes/evidencecorrection and otherindependentwork cancontinue.

## Decision recording

The PO can selectAorB in this chat. Record actualhumanwording/date/subject againstINTA-LAUNCH-D01; do notinferchoicefromsilence,reviewagreementorpreviousreviewroundadjudication. No legaldata/secret/providerpayload isneeded. Codex then updates only the newaddendum/currenttaskwhenapprovalactuallyexists; no selfapproval or automatic51rowPASS/MC002DONE.

Skipped: source changes/liveguard/provider/private/lifecycle. Risk: choosingAspecificallylimitsneverlistenproof tosupportedsafeentrypoint; choosingBcurrentlykeepsguardruntimeblocked.

## Actual Product Owner decision — 2026-10-26

Direct reply selects **A**: “Phê duyệt launcher chính thức có guard trước Next; raw CLI không được hỗ trợ cho tiêu chí never-listen, giữ nguyên FAIL lịch sử”. [Approved additive contract](inta-launch-contract-addendum.md) now governs this boundary; [exact answer](../testing/inta-launch-approval-20261026/approval.json) retained. Earlier waiting/proposed paragraphs above are historical preparation. This question is closed; no repeated PO approval for optionA. R2 source review and a separate explicit runtime cue remain required.
