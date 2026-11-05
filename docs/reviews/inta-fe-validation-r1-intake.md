# INT-A frontend R1 — Codex intake and independent-review addendum

Task MC-002-INTA-FE-VALIDATION-R1; actual executor/intake Local Codex,2026-10-26. Branch codex/unified-project-flow; base/head a62d838791ba188838c4ff00b7b6e265ac775056. **PARTIAL_CORRECTION_RECEIVED / REWORK_REQUIRED / RUNTIME_NOT_RELEASED**. Owner remains Antigravity; independent OpenCode review still pending. Owner labels CLOSED_FOR_SOURCE_AND_EVIDENCE_REVISION are author-side claims, not independent closure.

## Evidence accepted for intake

[238 integrity/preservation/reproduction checks](../testing/inta-fe-validation-r1-intake/checks.json) succeed:75payloads98873bytes,76raw/exportfiles including manifest,66historical variant files identical,17errata mappings corroborated, original3sealedpackets and59ledger/source identities unchanged. These238checks include successful reproduction of defects; they do not mean238applicationtests passed.

Owner correctly replaces22PASS with1FAIL_OBSERVED_LISTENER and21INSUFFICIENT_EVIDENCE, keeps all22observerfiles missing and documents originalfailuretocontinue/stop deviation. Original product18testpaths/8NFTs/31assets remains corroborated; no buildrerun needed. F04narrative hash correction and31assets/18JS/15chunkJS counts now match. F05directdependencylink limitation disclosed and copyplan supplied, no actual isolation operation performed.

Codex reproduced the exact9pure evaluator selfchecks:9PASS,0FAIL. [Output](../testing/inta-fe-validation-r1-intake/selfcheck.stdout.txt) and [execution pins](../testing/inta-fe-validation-r1-intake/execution.json) retained; Python-B avoided imported-bytecode writes. Separate additional probes reveal3unsafePASSresults; no Next/observer/HTTP/Go/PG or producttests executed. No credential/privateenv read.

Identity remains human/ownerreported Antigravity: initialpreflightClaudeOpus4.6Thinking, user-switchedGemini3.8FlashHigh for execution andR1. Google is described as platform attribution, not independently verified underlying modelprovider routing. No new provider call or settings change by Codex; retain limitation rather than infer violation.

## Finding disposition

| Prior finding | Intake disposition |
|---|---|
| FEVAL-F01 | Historical verdict correction accepted as documentation; originalneverlistenfailure remains. Pre-listen proposal is unimplemented/unadopted and has concrete unresolved import/launch issues. RuntimeOPEN. |
| FEVAL-F02 | Missing-counter disposition corrected, no backfill. Observer signalhandler proposed, but persistence/cleanup implementation and strictschema still incomplete. Runtime/sourceOPEN. |
| FEVAL-F03 |9selfchecks reproduced, exactrefusal/missingfile fixes present. Integration wiring and three untested malformed/unknown inputs remain defective; notsourceclosed. |
| FEVAL-F04 |17hasherrata and assetcount corrections corroboratedDOCUMENT_ONLY. Originalpacket/report unchanged; actual-secret coverage stillNOT_ESTABLISHED. Independentreviewpending. |
| FEVAL-F05 |Limitation and dependencycopyplan acknowledgedDOCUMENT_ONLY. No privatecopyexecuted; rootdirectorycheck alone cannot establish all nested symlinks/realpaths stay private. RuntimeisolationOPEN. |

## Remaining R1 source issues

| ID | Priority / exact source | Evidence and required narrow correction |
|---|---|---|
| R1-C01 | P1, guard-validator-r1.sh167-173/214-218/244-248/281-285/309/313-315 | MetadataPython importsjson but usesos.getpid:NameError. Interpolated shellfalse/true becomes unquoted Pythonidentifier:NameError before evaluator. `$?` inside `if ! command` observes negatedstatus0 rather than real lsofstatus, so normalnomatch can becomePROBE_ERROR and failuredetail is wrong. Isolated language probes reproduce all3without starting runner. pre_probe_err also never feeds final evaluator, and negated function-call context must not rely on set-e to stop internalerrors. Correct real parser/wiring once and test actual generated values, not only pureevaluator. |
| R1-C02 | P1, guard_evaluator.py66-78/139-159 | Unknown listenerNone bypasses `is True` checks; boolFalse counts asint0; nonempty string"false" coerces toTrue forcleanShutdown. All3inputs pass with otherwise valid fixture. [Regression vectors](../testing/inta-fe-validation-r1-intake/additional-failclosed-probes.json) expect rejection and observePASS. Require positive knownFalse evidence and strictJSONint(nonbool)/booleanTrue plus complete observer lifecycle provenance, rather than truthiness/typecoercion. Add tests to the same evaluator used by runner. |
| R1-C03 | P2, guard-validator-r1.sh65-106/122-145/238-257/263-270/294 | Observer writes only at shutdown/error, using directopen rather than atomic replace/eventdurable counts; source does not support the return's atomicflushclaim. Writeerrors swallowed, unboundedwait/signalsignored, no capturedobserverexit/validatedstart-executable-parentidentity, startup/preprobe failures can leaveobserver running. Loop only recordslistener and waits; positivecountsnotdurablyobserved untilafterchildexit, so immediateabort requirement remains incomplete. Raw rm-rf variant/statepaths and result truncation conflict with retain-old-attempt evidence. Correct narrow ownership, perattemptpreservation, boundedcleanup and event/persistence semantics before runtime. Do not run this source toprove it fails. |
| R1-C04 | P2, pre-listen-launcher-proposal.md§2.1/§3.3 and actual harness source | Pseudocode imports../src/guards.js, but frozen source containsguards.ts and no correspondingguards.js. Pin supported loadpath/loader on installedNode without copying guardlist; prove import-timeguard executes beforeNextspawn, not an earlierMODULE_NOT_FOUND failure. env:process.env is not an explicitboundedallowlist; spawnerrors/signals/childcleanup not fully handled. ExactdirectNextargv cited as frozenINTA§2literal actually comes from a later executionhandoff; preserve frozencontract and propose an accurate additive launch amendment, not an unreviewed rewrite. Keep rawCLI bypass limitation; no all22PASS/0TCPpackets guarantee from pseudocode. |

No architecture/business criterion is waived. Supported launcher may be a bounded test-asset implementation choice, but the exact launch contract/import/env/ownership boundary needs nonauthor conformance disposition before new runtimecue. Frozen product/nativeGo/harness48cc03e and originalINTA-1 remain unchanged; do not implement into importedtools/inta-harness merely because pseudocode names it. No product/Nextframeworkpatch or repeated fullarchitecture audit requested here.

## Next action — consolidate independent review now

Do not request another broad Antigravity rewrite or rerun productbuild/7stages. The existing [OpenCode review prompt](../implementation/handoffs/MC-002-INTA-OPENCODE-CLOSEOUT-REVIEW-PROMPT.md) can review current36casecoverage plus actualR1now using [new frozenR1addendum](../testing/inta-closeout-continuation/r1-review-addendum.json). Original22inputreviewmanifest remains unchanged. OpenCode independently confirms/refutes R1-C01..04 and FEVALdispositions, then provides a consolidated narrow correction/conformance recommendation. No externalreviewinvokedbyCodex.

After actualreview, Codex assigns the smallest sourcecorrection and later targetedruntimecue if readinessisproven;9/9selfcheck alone is insufficient. HistoricalNextterminationNOT_OBSERVED, originalGoexitlimits, actualsecretprivacy, samePGteardown, dynamiccache and final36independentreview remainOPEN.51formalresults/MC002/STEP03B/auth/production/Cloudflare/cost/recoverygates unchanged.

Skipped: liveapplication/guard/build/observer/network/DB/lifecycle/privatefile/provider/commit. Risks: currentrunnercannotexecuteaswritten and evaluatorcanacceptincompleteevidence; launcher/dependencyplan remains unverified.
