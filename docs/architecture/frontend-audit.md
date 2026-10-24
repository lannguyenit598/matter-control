# MC-002-FE — Frontend Owner Audit and PoC Status

Owner: actual Antigravity. Priority P0; approved FR/NFR/RULE/AC baseline unchanged. **LOCAL_TEMPLATE_POC_REVIEW_PASS_WITH_LIMITATIONS / CLOUDFLARE_ADAPTER_NOT_RUN**. Reviewer: OpenCode; architecture changes: Claude Code.

Actual CLI1.4.7, requested gemini-3.8-flash-high and effort high, returned SUCCESS/exit0 in63.661s, conversation36d93b38-79c3-4628-af8c-8b0e7375eec1. Model availability was checked before invocation; CLI JSON does not independently echo the effective model/effort, so evidence distinguishes requested flags from provider-internal attestation. Fourteen supplied snapshots /58203bytes at governance2000d94 and frontend3e5a642479acb789eb210e73fba956f3e85082e3 were sent after explicit PO approval. No workspace tools/builds were requested; result reports zero tools and all runtime checks NOT_RUN. This is supplied-source inspection, not a full live checkout audit. [Exact manifest](../testing/step-02-1/antigravity-input-manifest.json), [execution](../testing/step-02-1/antigravity-execution.json), [verbatim report](../reviews/step-02-1-antigravity-result.md).

App2.26.0 and existing CLI signatures validate on the host; the app is Gatekeeper accepted. CLI spctl exit3 says valid code but not an app; it is not an invalid codesign result. No reinstall, security exception, login or global setting change occurred. The source-only CLI route works. A final synthetic Git-read tool probe in accept-edits/sandbox returned denied_actions command/RunCommand: headless cannot prompt. CLI exit0/SUCCESS with empty response did not run the command. Interactive owner handoff is prepared instead of adding global allow-rules or skipping permissions; raw probe in ../testing/step-02-1/antigravity-tool-probe.json.

## Codex disposition of returned advice

| Returned item | Disposition / authoritative limit |
|---|---|
| Next16.4.2/React19.3.1/TS~5.9.3, server actions/cache, Atomic boundaries, fail-closed session stub | Source-backed starting points; owner must inspect full checkout/lock and execute tests |
| Frontend /tasks and /tasks/stats versus Go /api/v1/users; missing session bridge | Concrete existing integration gap. No resource alias, wildcard anonymous auth or invented API to force PASS |
| rm -rf on proposed workdir and shallow-clone-latest then old checkout | REJECTED. Never delete/reuse an existing path; use a new pinned worktree, fail if occupied |
| Zero dependency writes after install; tee pipelines without pipefail | REJECTED. Installation writes node_modules; inspect lifecycle changes. Capture actual command exit, not tee's exit |
| Typical SSR CPU10–20ms, implied measured quota failure | UNSUPPORTED; no CPU measurement supplied. Cloudflare candidate remains untested |
| ID regex proves incompatibility; guessed backend response/ID shape | NOT_ESTABLISHED by this packet. Inspect schemas and actual User contract before claiming additional incompatibility |
| Static export necessarily forces secret leakage / migration is categorically impossible | OVERSTATED. Current server behavior cannot be exported unchanged; deliberate redesign/security review is possible but unselected |
| /healthz or /readyz alone proves migration version/PG | REJECTED. Liveness, configured DB readiness and schema version require separate evidence |
| Old signature failure / reinstall instructions | SUPERSEDED by fresh host verification; current remaining limits concern invocation/configuration, not damaged app proof |

The raw report is preserved; unsafe/unverified suggestions are not adopted. No architecture/ADR changes or new technical policy are approved by this report. Required runtime checks remain install, types, lint, unit, build/Storybook, production start/routes, E2E, REST negative auth and adapter limits. See the full [manual execution prompt](../implementation/handoffs/MC-002-ANTIGRAVITY-PROMPT.md). No Step02 PASS, production proof or cost certification.

## Antigravity Runtime PoC Execution (P-FE-1 Baseline)

On 2026-10-24 Asia/Ho_Chi_Minh, Antigravity executed the full template runtime PoC in isolated worktree `/tmp/mattercontrol-step021-frontend` (pinned commit `3e5a642479acb789eb210e73fba956f3e85082e3`, branch `task/MC-002-fe-poc`) under Node v24.22.1 and pnpm 12.11.2 with complete `rtk proxy` pipefail records:

1. **`pnpm install --frozen-lockfile`**: PASS (exit 0, lockfile unchanged, 544 packages in `node_modules`).
2. **`pnpm typecheck`**: PASS (exit 0).
3. **`pnpm lint`**: PASS (exit 0, 0 errors, 0 warnings).
4. **`pnpm format:check`**: PASS (exit 0).
5. **`pnpm test`**: PASS (exit 0, 18 test files, 99 passed).
6. **`pnpm agents:check`**: PASS (exit 0, 17 skills, 3 scoped rules).
7. **`pnpm build`**: PASS (exit 0, Next.js 16.4.2 Turbopack, Cache Components, PPR).
8. **`pnpm build-storybook`**: PASS (exit 0, Storybook 10.6.2 static build).
9. **Production startup & routes**: HTTP307/200/200/404 and second-port200 observed. Wrapper exit0 does not establish graceful stop; raw logs warn ports3088/3089 remained occupied. Later listener check was clear.
10. **Playwright E2E**: PASS (exit 0, port 3095, CI=true, 9 passed in 13.7s).
11. **REST fail-closed render**: Sign-in required and auth warning observed on3096. No runtime outbound counter/leakage assertion; source and mocked-unit auth checks are distinct. Raw log warns listener remained after kill and advertises LAN binding.

Full evidence, SHA-256 hashes, and execution logs are recorded in [PoC Validation Report](../testing/step-02-frontend-poc.md) and [Manifest](../testing/step-02-frontend-poc/manifest.json). Proposed status: **`IN_REVIEW`** (assigned to OpenCode). Step 02 remains open; Step 03 is not authorized.



## Codex intake and independent-review correction

Actual OpenCode review returned CHANGES_REQUIRED for documentary evidence corrections, not a build/test failure or requirement to rerun the PoC. Original return is preserved; report/manifest now qualify lifecycle, LAN binding, wrapper exit/UTC provenance, network assertions and local-only topology scope. All11 raw logs remain unchanged and match their manifest hashes; source worktree remains clean/pinned. [Intake and review](../reviews/step-02-frontend-intake.md). Final actual independent recheck PASS_WITH_LIMITATIONS, all FE-VERIFY-01..07 resolved. MC-002-FE H5 native template baseline accepted with evidence limits; no full frontend/Step02/Cloudflare/cost approval.
