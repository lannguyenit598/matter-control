# MC-002-INTA-BE — Preparation Return Intake

Codex PM/Cloud/DevOps,2026-10-25 Asia/Ho_Chi_Minh. Governance base ca649fe7e176dd4ee58021f80952d3b69d750f03, task/MC-002-solution-architecture. Human returned actual ZCode desktop preparation for MC-002-INTA-BE; GLM-5.3-Flash/account model string is owner-reported, not independently model-attested. [Original return](inta-backend-return.md) is retained unchanged.

**State: IN_REVIEW for backend preparation / WAITING_ENV for runtime.** Manual acknowledgement/preparation has actually returned; prior “no owner acknowledgement/build” statements describe the earlier preparation checkpoint. No native/integration acceptance, matrix PASS or independent runtime QA verdict is inferred.

## Direct checks

- /tmp/mc002-inta-be is clean on codex/mc-002-inta-be at52b60a4617081c41b949f2242e1784238c170f75; tracked diff empty. Read-only seed /tmp/mattercontrol-step022-backend-c01 is still clean at the same head.
- Binary /tmp/mc002-inta-be/bin/userapi is42,202,722bytes, SHA256 f3bcdc2f7ce893cdfa248274777f1d3401f538d3ff290d93abf3bd7f370a54c1, matching the owner return; bin/userapi is ignored.
- Read-only go version -m reports Go1.27.3, exact vcs.revision52b60a4 and vcs.modified=false. This is binary metadata inspection, not a runtime launch or an independent rebuild. The main.version stamp is recorded by the owner's build recipe; its in-process log assertion remains NOT_RUN until INT-ENV-03.
- Build meta records owner rtk proxy make build, exit0,2026-10-25T02:51:43Z→02:51:45Z; stdout shows clean -X main.version=52b60a4, stderr empty. Codex did not rerun the build.
- 4/4 exported files byte-match retained /tmp originals:3build payloads plus1hash list. All3non-self payload hashes in that list verify; no self-hash entry.
- Independent literal source scan of internal/ and cmd/ finds0cors/access-control-allow matches. This is limited static evidence, not runtime CORS or security proof.
- Current lsof check finds no listener on18085/18086/15457; this is a snapshot of assigned ports, not a historical graceful-stop or all-process proof.

[Exact checks and hashes](../testing/inta-backend-intake/checks.json), [binary metadata](../testing/inta-backend-intake/binary-build-info.txt), [command metadata](../testing/inta-backend-intake/binary-build-info-command.json). Hash equality establishes consistency, not execution authenticity or reproduction.

## Dependencies and next action

No Codex ENV handoff exists and no frontend return/driver-generated runId has been received. During intake, /tmp/mc002-inta-fe, /tmp/mc002-inta-harness and frontend install evidence appeared; this indicates activity/presence only. Codex did not inspect/change/run their implementation or infer completion. Preserve ongoing owner work.

The frozen contract requires a driver-generated runId and coordinated request IDs. Antigravity's next coordination return should identify that value, its request-ID plan and isolated Next feasibility. Then Codex provisions only the approved new capped/labelled loopback PostgreSQL, verifies exact empty/healthy DB/user before privately handing the DSN to ZCode, and records INT-ENV-01. No credential is supplied in chat, source, review packet or evidence.

ZCode resumes in its existing clean task worktree, without recreating it or rebuilding for reassurance: migrate→Go start under INTA-1, then wait for coordinated T1/T2/checkpoint and the owned restart/outage/stop phases. Go restart must precede A mutation; PG recovery keeps Go running; T12 Go stop follows dependent observations. No autonomous mutation/retry or use of default/retained DB.

## Result boundary

All51results remain NOT_RUN:36required local cases,14product-deferred and1production-blocked. Preparation source/binary checks are sub-evidence only, not full INT-ENV-03/INT-ISO-01/INT-ISO-03 PASS. OpenCode runtime verification is PENDING; no packet was sent to it in this intake.

DEC-028/INT-A approval remains in force; no new scope approval is needed. C01-NATIVE/R01/R02 closed scopes and59protected artifacts remain unchanged. C01-PRODUCT, MC-002, overall architecture, product security, Cloudflare/cost/full recovery remain OPEN. No fallback, paid activation, deploy/merge, MC-003A or existing DB/volume action.

Skipped: rebuilding/running the binary, DB/container provisioning or migration, frontend execution and test replay. Risk: current checks do not prove runtime compatibility; ENV plus frontend coordination and independent QA are still required.
