# MC-BE-01 — owner return intake and focused counterexamples

Status REWORK_REQUIRED. Local Codex PM/BA intake, source52b60a4 ->136eae6 on clean codex/mc-be-01,31files/+5243/-8. ZCode owner/model GLM5.3/Z.AI are session-reported; no new external invocation by Codex. Governance basecb39665. PriorityP0; FR001/008/018/020, taskBE01-T01..10, exact finding traces in findings.json.

Three actionable findings, independently written service-double probes on actual unchanged source:
- **P1 BE01-F01**, matter_service.go:90. Receipt authorization checks only the command's target Matter. Receipt A, revoked A membership, authorizedB and changed hash returns key-reuse instead of uniform not-found. Authorize saved scope/every represented Matter before comparison/replay; preserve lock order. This demonstrates outcome classification, not a claim of production hash collisions.
- **P1 BE01-F02**, matter_service.go:78 + queries_mattercontrol/matter.sql:67. Past pending boundary is ignored; Create succeeds, CompleteMatter advances fence and clears pending boundary. Fail closed for unsupported required boundary; no later engine implementation requested.
- **P1 BE01-F03**, matter_service.go:206/208/228. Membership ErrUnavailable becomes missing facts and ErrNotFound. Propagate non-absence storage errors before policy normalization, including create/replay counterpart.

Probe command/UTC/exits/source and test source are preserved under ../testing/be01-intake/. Go overlay injected tests without editing backend. All3failed as expected on136eae6; DB env removed, dependencies networkdisabled, private tempcache. These are service-double reproductions, not PostgreSQL replay or formal independentOpenCode review.

Owner JSON1662events verifies391namedpasses/0fail/1intentionalnamedskip;15test-bearing packages and5no-test packages. Parent/subtests included. Four reported hashes match. Six retained raw files preserved losslessly with credential scans0matches. JSON is a real retained owner test run; it does not override the new failing cases.

Evidence qualifications: standalone makecheck log/argv/UTC/exit metadata absent; reported exit0 remains owner-reported. race-full.stdout has different elapsed durations for15packages, so it is not a faithful text copy of race-full.json. JSON time window is17:42:34..43Z; report17:42:52Z is approximate/mismatched. Domain/service failing-before evidence retained; policy-red only narrated. Do not invent missing logs or require a baseline replay solely for missing historical metadata; the next correctedsource gate must capture its actual commands/UTC/exits/stdout/stderr.

Both BE01 fixtures currently running, IDs/image/digest/labels/loopback ports55433/55434/caps verified read-only. Historical empty-before-use and creation sequence still owner-reported; no current empty assumption. No Config.Env/credential values exposed, DB query, start/stop/prune. Protected C01/INTA source still52b60a4 clean.

Makefile's minimal second-bundle sqlc change is justified and requires reviewer confirmation. Nullablepurge_after and zero key-age policy are documented deviations/seams, not approved product defaults; retain for independent/contract disposition. No policy numbers or purge semantics approved here.

Outputs: raw return+source diff archives,31file source manifest, ownerlogs/testinventory, threeprobe source/events/metadata, fixture inspection, findings and scoped rework prompt. Task/ workflow/status updated only. No source patch by Codex and no self-awardedDONE.

Next: actual ZCode executes MC-BE-01-ZCODE-REWORK-PROMPT.md on its existing branch, correct only listed seams and evidence, return newhead/checks. Then a reviewer distinct fromZCode validates corrected diff and requiredPG evidence; OpenCode remains designated when authorized/available. No automatic providercall or permission inheritance from C01/Step02packets.

Skipped: full native/product gate replay, realPG counterexamples, externalQA, all later slices/auth/HTTP/deploy. Risks: three reproduced defects, incomplete gate provenance and unapproved policy/schema deviations; INT-A/F08/F10 independent.
