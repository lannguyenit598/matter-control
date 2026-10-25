# MC-002-INTA-FE-R4-QA — complete manual OpenCode review prompt

You are actual OpenCode, independent QA. This is a source/evidence closure review of Antigravity R4, not engineering implementation or runtime testing. Use only the provider/model explicitly selected by the human through its normal configured route. Both the default opencode/glm-5.3-flash-free and the human-authorized opencode/big-pickle alternate returned provider.free-limit/HTTP429; do not repeatedly retry it, switch model/provider, buy service, authenticate or change global settings on your own. If no usable authorized route exists, return BLOCKED_PROVIDER_QUOTA and stop. READY/NOT_DISPATCHED until actual human delivery/acknowledgement. Never claim Claude/Codex subagent execution as OpenCode.

Governance /Users/nguyenvanlan/Documents/code/pet-projects/matter-control, task MC-002-INTA-FE-R4-SOURCE-REVIEW within DEC-028/frozen INTA-1. Requirement trace NFR-001/002/003/008/009 and51canonical integration IDs. Actual source companion /tmp/mc002-inta-harness clean48cc03e949d66fc47a7d304413621eb79804e6c1 fromcfec8694799634b05438764aec56858dc26c8764, codex/mc-002-inta-harness-r4. Template3e5a642/backend52b60a4 immutable. Read supplied snapshot packet, not mutable alternate revisions:
- /tmp/mc002-inta-fe-r4-source-review-input.txt (already prepared complete textual packet)
- Durable copy docs/testing/inta-frontend-r4-intake/opencode-input.txt.gz plus opencode-input-manifest.json (33snapshots/344716bytes, SHA in manifest)
- docs/reviews/inta-frontend-r4-intake.md and inta-frontend-r4-review-blocker.md describe actual intake/failed attempt
- docs/implementation/inta-approved-contract.md; docs/implementation/handoffs/MC-002-INTA-FE-R4-PROMPT.md; docs/reviews/inta-frontend-r3-opencode-review.md; docs/reviews/inta-frontend-r4-return.md are snapshotted inputs

Honor normal tool/agent permissions. CLI packet-review route has all tools denied and gets the file as input. No commands, tests/builds, network calls, file edits, Go/PG or real legal data. If your normal permissions cannot load the packet, stop for the human to supply it as input; never bypass them. Read only supplied source/evidence; do not claim recomputed hashes or replayed owner tests. No implementation by reviewer.

Review closure of R3-F01..F07 only, preserve all already-fixed scope:
- Existing intent must always refuse before fetch, including JSON{} / garbage / wrong case / null / malformed data.
- Stop provenance must have nonempty matching PID/start/command identity; empty/mismatch refuses with0signals/retainedfiles; normalization consistent.
- Stage markers must parse/contain expected stage and write atomically; required corrupted checkpoint/state/assertion readers fail closed; fresh missing files allowed.
- Successful actual runStage→dispatch fake-fetch fixture covers7stages/23case submissions, ENV/order/confirm gates, durable reload, replay/crash/unknown-X0resends; simulation must not become real integration PASS.
- Legacy phase commands removed/prohibited; actual CLI is stage1..7/status/help. Owner all/resume wording is errata, not a request to add commands.
- Generic internal500/control400 semantics unchanged. Correct13externalprocedure IDs; owner test counts remain owner supplied. Optional low-risk riders cannot become invented new gates.

Codex retention checks:5raw/5export/25source hashes match;4raw-export pairs byte-equal;25archive payloads match actual source; archive45347bytes SHA78823fab1f96a00113585b7a080b88bd6a143af88de39628cb4606ea35404f44. Owner91unitpasses/7files,8guardpasses/0syntheticHTTP. Codex separately rechecked the old JSON{} counterexample in a new isolated temp state directory: R4 refused without overwrite,0network; this is focused Codex evidence, not independent OpenCode execution or fullstage replay. No ENV/Go/PG/canonical runtime execution yet;51NOT_RUN/36required14deferred1blocked. All product auth-isolation/C01-PRODUCT/Cloudflare/cost/full recovery/architecture gates OPEN.

Return plain Markdown: task/actual tool/model/provider/scope, exact source identity, R3-F01..F07 disposition table; verdict PASS_WITH_LIMITATIONS or CHANGES_REQUIRED with only concrete frozen-scope residuals, severity/path/codepath/minimalfix/meaningfulcheck. Separate doc errata, source blockers, optional riders and runtime proof still owed. State explicitly whether source closure permits the approved Codex ENV preflight/new-fixture/private-DSN handoff; never approve fullproduct/production or waive51case evidence. No material architecture claim for ordinary bugs, no PO approval role. Do not expand requirements/newframework/distributedlocking or demand old fullbaseline replay.

Outputs only docs/reviews/inta-frontend-r4-opencode-review.md and your own NEW docs/testing/inta-returns/qa/r4-source/ artifacts if normal permissions allow; preserve existing reports, failed attempt logs and old owner evidence. Record actual input hashes/session/model/UTC/exit/result/limitations; proposed IN_REVIEW source assessment, no self-awarded MC-002 DONE. Otherwise return text to the human for Codex intake. Source/test/build/DB modifications prohibited.

Skipped: runtime/tests/build/hash recomputation, real Next-Go-PG acceptance, product/cost/Cloudflare/recovery, MC-003A. Remaining risk:51runtime rows unproven and independent source verdict absent until this review actually completes.

Current inventory: no authenticated OpenCode integration,9listedmodels all opencode provider. Human has authorized an alternate configured route, but tested big-pickle also failed; wait for a usable human-restored/authenticated route or recovered quota before dispatching. No model cycling, login or payment by this prompt.
