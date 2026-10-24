# MC-002-FE — Returned Antigravity PoC Intake

Collector/reviewer: Codex PM/DevOps,2026-10-24. Actual engineering owner: Antigravity, as identified in the user-returned report and workspace artifacts. Model Gemini3.8FlashHigh/effort high is owner-reported for this manual execution; this intake does not independently attest its effective model. Governance base4a6b8f9c0b50a81930cb2edc0806c57dbda8cd99, branch task/MC-002-solution-architecture. Scope: frontend return only. Independent reviewer: actual OpenCode; final verdict recorded below when returned.

## Preservation and direct checks

The checkout was already dirty on intake: backend-audit.md and frontend-audit.md modified, backend report/frontend report/frontend logs and .mimosa untracked. These owner/user changes are preserved. No source engineering changes, dependency/build/test reruns, process termination or global settings changes are performed by Codex in this intake. The backend return is outside this review; no conclusion about its acceptance is drawn here.

[Returned transcript](../testing/step-02-frontend-intake/antigravity-return.txt), [Codex checks](../testing/step-02-frontend-intake/checks.json), [review packet manifest](../testing/step-02-frontend-intake/opencode-input-manifest.json), [exact compressed snapshots](../testing/step-02-frontend-intake/opencode-input.txt.gz). The latter preserves the reviewed text even if the owner's uncommitted files subsequently evolve. Local SHA256 checks inventory content and detect mismatch; they do not authenticate who executed a command.

All11 log files exist and every SHA256 matches the owner's manifest. The original public frontend snapshot and isolated worktree have the expected origin, exact source3e5a642479acb789eb210e73fba956f3e85082e3 and clean Git status; isolated branch task/MC-002-fe-poc. All25 protected product/requirements files and15 reviewed architecture hashes remain unchanged. The existing owner documents are not overwritten or silently normalized.

## Evidence supported by the return

| Area | Direct evidence | Limit |
|---|---|---|
| Frozen install | Log01:544 packages reused, lifecycle husky completed; source/lock tracked diff clean | Install created local dependencies; not a fresh-network reproducibility test |
| Type/lint/format/rule checks | Logs02/03/04/06 show expected commands and outputs; owner reports exit0 | UTC/exit wrappers are absent from these raw log files; metadata remains an owner assertion |
| Unit/component tests | Log05 explicitly reports18 files /99 tests passed | Template tests, not MatterControl acceptance or independent replay |
| Production build | Log07 shows successful Next16.4.2 build, cache components/partial prefetch and generated routes | Native local Node only; no Cloudflare adapter test |
| Storybook | Log08 completed successfully | Bundler/module-directive and telemetry notices are retained; not a warning-free build or interactive/a11y audit |
| Browser E2E | Log10 explicitly reports9 passed with production webServer | Demo mode; no Go/PG connectivity or real identity |
| Route smoke | Log09 records307/200/200/404/200 status lines | Shell wrappers do not assert all expected statuses and later force exit0 |
| REST negative render | Log11 contains Sign-in required and expected auth warning; source/unit test checks auth precedes mocked fetch | No counted backend spy or runtime network record proves the blanket zero-outbound/zero-leakage claim |

## Material discrepancies for independent review

1. Report claims ports3088/3089/3096 released cleanly. Raw09 lines77/104 and raw11 line25 instead warn they remain occupied after kill. Killing a package-manager wrapper is not evidence its child listener stopped. Starting a second port does not prove same-port restart. The wrapper ends exit0 despite the warnings. Host read-only `lsof` at15:05:01UTC now finds no listeners on3088/3089/3095/3096; this later observation does not retroactively prove historical graceful cleanup. No process was killed by Codex.
2. The local-only handoff required loopback binding. The returned launch commands omit a hostname; raw11 advertises a LAN address. No actual legal data is shown, but the claimed loopback confinement was not enforced or evidenced by a listener bind capture.
3. Smoke scripts use curl success without asserting HTTP status; grep failures become NOT FOUND and the final status is still forced0. The recorded bodies/statuses support observations, not blanket assertion-based acceptance. Runtime zero backend requests/zero data leakage lacks a measured destination/spy count; existing mocked unit coverage is a separate evidence class.
4. Raw logs01..08 and10 omit UTC/exit markers because wrapper metadata was printed outside tee. Raw09 begins14:55:08 versus manifest14:55:09; raw11 begins14:57:56 versus manifest14:57:53. Preserve originals, correct/qualify metadata and capture complete bounded rechecks rather than fabricate missing historical output.
5. The F4 local Node result does not prove a container/co-hosted topology, external host availability or production/Cloudflare/$0 feasibility. No deployment candidate or architectural exception is approved here.

## Required state and focused follow-up

Build/unit/browser results can be recorded as returned execution evidence. Overall frontend PoC remains IN_REVIEW until actual independent verdict; no automatic DONE or full LOCAL_POC_PASSED. Preserve the raw return and let Antigravity correct its own report and bounded lifecycle/security evidence. Do not repeat dependency installation, build,99unit tests or9E2E tests merely to repair reporting unless a new change invalidates them. No backend/frontend integration or Step03 is authorized by receiving this report.

Initial actual OpenCode2.1.4 / opencode/glm-5.3-flash-free, session ses_e918cfbb6ffeO30XbAVLxB0DJq, exit0/126.481s, returned CHANGES_REQUIRED for documentary corrections only, explicitly no PoC rerun required. [Verbatim review](step-02-frontend-opencode-result.md), [execution](../testing/step-02-frontend-intake/opencode-execution.json). FE-VERIFY-01..07 are addressed in the corrected report, manifest and audit; all11 raw log hashes remain unchanged. Exact9/11 logs lack UTC/exit wrappers (the reviewer says8/11, qualified in metadata). Final actual review returned PASS_WITH_LIMITATIONS for this corrected H5 native template baseline; all FE-VERIFY-01..07 resolved. No runtime replay, full-product/adapter/integration/Cloudflare/cost approval.


## Final independent disposition

Actual OpenCode2.1.4 / opencode/glm-5.3-flash-free, session ses_e9187093cffe0GgVrhsyCHzO3F, exit0/outcome succeeded: **PASS_WITH_LIMITATIONS**. [Verbatim recheck](step-02-frontend-opencode-recheck.md), [execution](../testing/step-02-frontend-intake/opencode-recheck-execution.json). All7 actionable findings resolved without runtime rerun or source change. Owner-asserted lint exit/metadata, one-machine short run, optional E2E retry qualification and unmeasured historical shutdown/network counts remain accepted evidence limits. Do not propagate the original unsupported clean-shutdown/zero-leakage claims.

MC-002-FE H5 local template baseline: REVIEW_PASS_WITH_LIMITATIONS. This does not mark all frontend adapter/product work DONE. MC-002 and Architecture Approval Gate remain NOT_PASSED; integration awaits separately reviewed backend output and an approved compatible contract/auth seam. Backend audit/report and .mimosa files remain outside this commit/intake scope.
