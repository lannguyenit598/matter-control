# MC-002 — Step 02.1 Execution and Handoff Report

Codex PM/Cloud/DevOps/orchestrator,2026-10-24. Repository /Users/nguyenvanlan/Documents/code/pet-projects/matter-control, branch task/MC-002-solution-architecture. Continuation base2000d9435a7a3d405cb89e92ea72610f09b1f1cf; original Step02 base54e1db541157706dee9037b23f630faf59249c27; approved requirements subject572835a21bda764901a11aaea3c06b88750b2883. Final local head is the commit containing this report; use Git rather than a self-referential embedded hash. No push/PR/merge.

## Actual result

**MC-002 NOT_DONE / OWNER_RUNTIME_BLOCKED / WAITING_MANUAL_DISPATCH / WAITING_REMAINING_APPROVALS. Architecture Approval Gate NOT_PASSED.** Architecture document review remains valid for its exact fifteen-file subject. It is not production/runtime/cost approval. Step03 NOT_STARTED.

| Step02.1 work | Executing identity / result | Acceptance and remaining work |
|---|---|---|
| A baseline | Codex verified real repo/branch/clean start, approvals/pins and allowed paths | Protected requirements and reviewed architecture must remain unchanged; final structural checks recorded separately |
| B recovery | Codex actual host codesign/Gatekeeper and installed help/probes | Both apps valid; prior mandatory-reinstall conclusion withdrawn. No repair/bypass/login/global setting changes. ZCode CLI missing packaged provider config; Antigravity source-only route works |
| C backend | ZCode direct synthetic attempt exits1 before model work | Full audit/build/runtime PREPARED / WAITING_MANUAL_DISPATCH; not substituted by Codex |
| D frontend | Actual Antigravity CLI1.4.7, requested gemini-3.8-flash-high / effort high, SUCCESS exit0 | Fourteen supplied snapshots reviewed, not full live checkout; unsafe/unsupported advice dispositioned. Build/runtime still NOT_RUN; final synthetic command probe auto-denied by headless permissions, manual packet prepared |
| E integration | NOT_RUN | Both owner PoCs must pass first; Task/User contract and session gaps need approved minimal seam; no auth bypass |
| F restore | Codex executed synthetic PostgreSQL tooling drill and review-driven recheck, both exit0 | Correct rows/links/hash/markers/constraints; tiny local elapsed measured. Product DB/blob/history/access/W1 restore and scheduled RPO NOT_RUN |
| G independent QA | Actual OpenCode2.1.4 / opencode/glm-5.3-flash-free, exit0 | Initial PASS_WITH_LIMITATIONS,3Low/2Info; final recheck PASS_WITH_LIMITATIONS closes all3Low, no new High/Medium/Low. No independent runtime replay |
| H cloud/cost | Codex same-day official-source assessment retained and scoped to new evidence | No selected deployable end-to-end topology/account/full bill; PRODUCTION_FEASIBILITY and COST UNVERIFIED |

## Evidence and actual commands

[Recovery](../tooling/step-02-1-recovery.md) records all host verification commands/publishers/sources and exact error. Both app codesign verification/Gatekeeper exit0. Bundled ZCode CLI0.17.0 help exits0 but actual synthetic prompt exits1 on missing zcode-builtin.json. No external backend task or GUI build ran. Source snapshots remain /tmp/mattercontrol-step02-backend@d024e3ec9dd96abf9ada1d7516f1b2f0e8cba67b and /tmp/mattercontrol-step02-frontend@3e5a642479acb789eb210e73fba956f3e85082e3, with original GitHub origins.

Direct human DEC-027 authorizes exact frontend packet after automatic egress rejection, selecting Gemini3.8Flash/HIGH. `rtk proxy /Users/nguyenvanlan/.local/bin/agy models` exits0; audit argv uses `--mode plan --sandbox --model gemini-3.8-flash-high --effort high --output-format json --print-timeout 180s -p <approved packet>`. Exit0/63.661s; conversation36d93b38-79c3-4628-af8c-8b0e7375eec1. Requested model/effort are pinned; response JSON does not separately attest effective model. [Raw response](../testing/step-02-1/antigravity-output.json), [manifest](../testing/step-02-1/antigravity-input-manifest.json), [source audit and rejected advice](../architecture/frontend-audit.md). No further unapproved Antigravity payload sent.

`rtk proxy python3 docs/testing/step-02-restore-drill.py /tmp/mattercontrol-step021-restore-drill` exit0; rerun with `/tmp/mattercontrol-step021-restore-drill-recheck` exit0 after actual QA Low F3. [Validation](../testing/step-02-poc-validation.md) contains image digest, complete retained outputs, archive hashes, exact scope, expected/actual assertions and limitations. Latest restore-only0.046824s, target-provision-through-validated-read1.247520s, whole invocation7.295601s;100 records/100 links. One manual dump with one known omitted post-backup marker does not establish RPO24h cadence. Local tiny elapsed is not a product/production RTO8h guarantee. Four new network-none/tmpfs-only task containers across two runs were stopped; local official image, archives and stopped-container metadata remain. No important DB, existing volume or source checkout modified.

OpenCode first command is retained in [execution](../testing/step-02-1/opencode-execution.json), attached14 snapshots169113bytes. Session ses_e91b1f9a5ffe1zY7Ix4zxMwma3,159.396s, actual exported model opencode/glm-5.3-flash-free, outcome succeeded. All tools process-denied; exported messages show no tool calls. First launch inherited a non-secret launcher snippet through stdin in addition to the packet; final recheck explicitly closes stdin. Automatic session snapshots observed concurrent Codex document changes; they are not evidence OpenCode edited files. [Verbatim initial review](../reviews/step-02-1-opencode-result.md). The recheck supplies eight snapshots148710bytes. Exact packet archives preserve reviewed text even where later documents evolve.

## Architecture and decisions

No fifteen reviewed normative architecture documents or approved product/requirements files are changed. The known template resource/auth gaps are not new architecture policy: preserve them as integration blockers for owner reports/Claude review; no API mapping/session scaffold or new ADR was invented. No actual Claude invocation was needed for an architecture change because none was made; impactful returned owner findings still require Claude.

H5/W1/local recovery targets/Q3/Q5 remain approved. Production topology/provider, exact frontend adapter/version, identity, object storage, legal/history/receipt retention, import/export bounds, backup destination/keys/cadence, account eligibility and full service cost remain open. The local tooling restore is not evidence that Workers hosts native Go/pgx/PostgreSQL, that exact Next cache/server features work on an adapter, or that total spend is $0. See [feasibility](../architecture/cloudflare-feasibility.md), [budget](../deployment/free-tier-budget.md).

## Delivery and next state

Changes reach current task/status/decisions/risks, agent handoff instructions, owner audit status, technical PoC/cloud/budget overlays, provenance, restore procedure/script, raw evidence, independent QA reports and complete owner prompts. Historical raw reviews remain verbatim; obsolete integrity conclusions are explicitly superseded, not silently promoted.

1. Human opens verified ZCode and pastes [full backend prompt](../implementation/handoffs/MC-002-ZCODE-PROMPT.md). No provider/global repair is presumed.
2. Human opens Antigravity, selects Gemini3.8Flash/HIGH and pastes [full frontend runtime prompt](../implementation/handoffs/MC-002-ANTIGRAVITY-PROMPT.md). Existing supplied-source audit is input, not runtime proof.
3. Return task reports, source/base/head/diff, exact UTC/command/exit logs, fixture/container manifests, results and skips via normal handoff. If /tmp snapshots disappeared, recover exact public origin+pin into new paths; never use latest silently.
4. Codex checks owner scope/evidence; OpenCode independently verifies actual results, Claude reviews impactful changes. Only after both PoCs pass may Codex coordinate a compatible approved integration seam and full recovery exercise.
5. Preserve MC-002 open and Step03 stopped until all required technical, architecture, cost and PO gates are supported. No partial tooling review closes the overall gate.

Skipped: backend/frontend install/build/runtime/E2E, product integration/full recovery, W1 capacity, remote deployment/account/billing and full cost measurement. Residual risk: manual owner work, identity/API/adapter/provider gaps, backup cadence/retention and production feasibility remain unresolved.


Final scoped QA: session ses_e91acdd14ffedn9CdMVHx7nsPU, actual OpenCode2.1.4 / opencode/glm-5.3-flash-free, exit0/outcome succeeded, PASS_WITH_LIMITATIONS. [Returned recheck](../reviews/step-02-1-opencode-recheck-result.md), [metadata](../testing/step-02-1/opencode-recheck-execution.json). No tools/replay;3Info limits retained in validation. Structural checks confirm25 protected files and15 reviewed architecture hashes unchanged, source snapshots clean/pinned, exact request archive, local links/JSON and archived packets/dump integrity. [Static checks](../testing/step-02-1/static-checks.json). Current task remains NOT_DONE; manual runtime prompts ready.


Final dispatch boundary check: Antigravity conversation b9174f44-a511-4ab6-8f3b-da986e09b79a attempted only a synthetic read-only public-checkout Git SHA command. CLI exit0/SUCCESS nevertheless contained denied_actions command/RunCommand, empty response and stderr headless-auto-denial. No command ran, no global allow-rule/skip-permission workaround followed. [Raw probe](../testing/step-02-1/antigravity-tool-probe.json). This supplemental capability evidence was collected after independent review; no claim it was independently reviewed. Full engineering manual fallback is therefore based on an actual failed tool-permission probe.


Git staged whitespace check: five expected warnings confined to the preserved Antigravity Markdown response (four Markdown hard breaks and its blank EOF). Authored paths pass the separate check; raw output was not silently normalized.
