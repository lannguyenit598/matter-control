# MC-003A — Conditional independent QA attempt

Owner/orchestrator: actual Codex. Date:2026-10-25. Base/head: e377568ac47f8f1b88e3875a8f13d7e57fc30667; branch task/MC-002-solution-architecture. Existing concurrent Step02.3 work is outside this report. No commit/push or design approval.

## Outcome

**Preflight PASS. One external review attempt returned provider HTTP403; independent verdict NOT_PRODUCED. MC-003A remains REWORK_REQUIRED.** No artifact or approved policy was edited. No provider switch, retry, authentication, paid activation, JavaScript/resource execution or frontend implementation followed the failure.

The response class is provider.auth / FreeTierError: the service rejected this invocation as ineligible for its free tier. The installed OpenCode CLI was used; Codex did not infer a root cause beyond the returned eligibility error and did not change identity headers or credentials. No findings can be attributed to OpenCode because it returned no review text.

## Preflight and exact payload

Direct PO conditional one-time authorization is recorded in [authorization.md](authorization.md). [preflight.json](preflight.json) records checks before submission. All six exact paths, byte sizes and SHA256 values matched. The existing445728-byte packet matched SHA256 `45be38b88e0f1e053d448ac4b9f9bb36f62609a8ae38b5b70480602d16c2d043` and was reconstructed against six line-numbered source sections plus review instructions. No seventh source file was attached. The original manifest is preserved byte-identically as [authorized-manifest.json](authorized-manifest.json).

| Source path | Bytes | SHA256 |
|---|---:|---|
| docs/design/step-03a/export/mattercontrol-step-03a-ux-concept-review.html | 315229 | `6000190940fe42128009ce06b220a1d858228f346c1022a190c8de4eafa4cd4a` |
| docs/design/step-03a/export/mattercontrol-step-03a-ux-specifications.md | 51903 | `3b48b195d6623267165f4c94d3dc5522ced3cec14516bc7ab7e48d54d8f30bbd` |
| docs/design/step-03a/export/mattercontrol-step-03a-handoff-report.md | 19686 | `faf3a981fee1795d7e99d9cd7391703cb1faced429fa8d772aea6a69c649e7f6` |
| docs/requirements/state-semantics.md | 11469 | `156ca1dd2f75a7374a59d2aa4af4a9815ce62a2f11c03f84977bad2860a2ad51` |
| docs/requirements/permission-matrix.md | 5238 | `f352fcf0f1f2617b5d5c072c34472f84619f4bda555c855dbdf1871b469b0276` |
| docs/requirements/business-rules.md | 11783 | `96be507d3b0d70f0b9ad1c2b27b3152fd5e2700f13e8a647920c60c220f2aa81` |

Source bytes total415308; framing/line numbers/review instructions account for the packet size difference. Secret-pattern checks found no private keys, vendor key formats, JWTs, bearer credentials, credential URLs or credential assignments. No email address or external URL occurred in these source contents. Content inspection identified synthetic Atlas data and product policy, with no identified real-client matters or confidential case evidence. Detection remains bounded to inspected content/patterns, not a universal privacy guarantee.

## Actual destination and execution controls

- Tool: installed OpenCode2.1.4, resolved binary `/opt/homebrew/Cellar/opencode-v2/2.1.4/bin/opencode`.
- Provider: `opencode`; model selection: `opencode/glm-5.3-flash-free`; modelID and providerID verified before and after the attempt.
- Service: OpenCode inference gateway, effective baseURL `https://opencode.ai/inference/openai/v1`, package `@opencode/ai/providers/openai-compatible`. Verified from local OpenCode GET `/api/model` metadata before the call, not inferred from a label or current web documentation. The gateway's private vendor routing is not exposed; no direct-to-model-developer claim is made.
- Fresh session: `ses_e8f618776ffeEBB1snGcdFwlnn`; new empty non-Git location `/tmp/mc003a-independent-qa-20261025`.
- Session permissions verified as `[{'action':'*','resource':'*','effect':'deny'}]`; project and Claude discovery disabled per process. Global configuration unchanged; global/ancestor instruction files checked absent. Temporary agent-override probe was not used for the review because effective agent discovery did not expose that custom agent.
- One invocation used the existing authorized packet via `--file`, pinned model/session, no previous chat. CLI built-in instructions and the explicit review command are execution framing, not additional source documents. Repository files, .env, Git metadata and logs were not attached.

The current CLI differs from the generic documentation: actual read-only metadata routes are `/api/model` and `/api/provider`. Initial obsolete-route GETs returned the local UI HTML and did not invoke inference. Initial session creation used the wrong model field and was rejected locally before any session/model call; the corrected creation uses `id`. Neither is an additional payload review transmission.

## Execution evidence

Started UTC: 2026-10-25T01:13:38.778428+00:00. Ended UTC: 2026-10-25T01:13:40.979630+00:00. Process exit: 1.

[execution.json](execution.json) preserves exact argv and process settings. [session-created.json](session-created.json) and [session-after-attempt.json](session-after-attempt.json) pin the model and deny-all permissions. [opencode-events.jsonl](opencode-events.jsonl) contains one HTTP403 provider.auth error; stderr is empty. There are zero review text events and zero tool execution events. Local session metadata reports0 input/output/reasoning tokens and0 cost; this is not an independent billing/no-retention assurance. The gateway received an attempted request; a403 does not prove what it retained or whether it parsed the full body. No claim that the payload stayed local is made.

[result.json](result.json) verifies all six sources unchanged after the attempt. No content was resent after the403. A further transmission requires renewed one-time authorization after service eligibility is resolved; there is no automatic retry or alternate provider.

## Findings and required owner rework

**Independent OpenCode findings: NONE RETURNED.** The following are Codex source-confirmed intake findings, retained separately from independent QA. They are not endorsed or closed by this failed invocation.

| ID / severity | Source reference | Policy / remediation |
|---|---|---|
| UX-R01 / High | HTML2852/3258/3312 bulk Workstream; HTML2404 and specs§7/decision log | RULE-013 allows title/description, internal owner, due date. Align controls, specifications, examples and tests; classify Workstream bulk reassignment as policy-change exploration. Codex's historical commissioned wrapper contributed this mismatch; preserve it as evidence. |
| UX-R02 / High | HTML2329/2331/3037; specification§12 A-13 and§5 Status Brief; handoff§7/8 | RULE-013 fixes per-record atomic change+audit and partial success; role matrix grants scoped VIEWER export; RULE-014/016 fix import group and draft brief semantics. Preserve these; only mechanisms remain pending. |
| UX-R03 / Medium | HTML2399 vs2428; handoff§7 | D-01/D-02 collide across design and fictional Atlas decisions. Use UX-DEC-* vs DEC-AT-* and remove fictional case decisions from actual PO governance approvals. |
| UX-R04 / Medium | HTML1405/2401 vs source3446; specs§4 formula | Explain boolean grouping consistently. Preserve completed execution and dependency prerequisites. Apply RULE-003 per-edge gate and RULE-008 milestone rules separately; no NOT_REQUIRED waiver of a proof edge. |
| UX-R05 / Medium | HTML3248 and1814; source3823..3854 | Mobile first8 restriction and toast-only evidence transitions limit connected-flow claims. Declare coverage honestly; specify access to later mobile records and distinguish illustrated stages from actual stateful mock behavior. |

The complete [OpenDesign remediation prompt](opendesign-remediation-prompt.md) is PREPARED / NOT_DISPATCHED. It is based on the Codex findings above, not nonexistent OpenCode QA. No design-owner call was made because this turn authorizes QA and explicitly prohibits artifact changes; MCP availability is not an authorization to dispatch rework automatically.

## Remaining limitations and next status

- No independent verdict, severity assessment or full QA result exists. The only external result is403; this task's requested independent review is blocked by service eligibility.
- Full PRD/SRS/P0 acceptance files and the canonical Atlas dataset source are outside the exact six-file grant. A successful review of this packet could assess policy compliance, artifact-declared coverage and internal Atlas consistency; it could not independently certify full P0 traceability or canonical fixture parity.
- No HTML/JavaScript/resource execution, visual/mobile/desktop matrix, usability test, accessibility audit, API/auth/integration or production test was run in this review attempt. Earlier narrow-viewport checks remain separately scoped in local-checks.json.
- MC-003A stays REWORK_REQUIRED. Required next work: resolve same-service eligibility, obtain renewed one-time transmission approval, complete independent review, authorize focused external-owner rework, then verify corrections before Design Approval Gate. No Step03B/high-fidelity/frontend implementation.
