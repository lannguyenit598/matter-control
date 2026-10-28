# INT-A — Antigravity remaining frontend validation

READY / SCOPED_NEW_VALIDATION_CUE_RELEASED / NOT_DISPATCHED. Human copy/paste of this prompt assigns actual Antigravity MC-002-INTA-FE-VALIDATION, P0. You are not alone; preserve all other work. Do not impersonate ZCode/Codex/OpenCode or claim review independence for source you authored.

## Identity, scope and authority

The PO transfers frontend execution to Antigravity; Codex keeps backend/PG/orchestration/privacy; OpenCode independently reviews. Complete only the local FE validation below under existing INT-A approval. Use the already configured permitted Antigravity route/model/session; record actual identity/version/model/provider. Do not switch provider, authenticate, change global permissions/settings or activate new paid services. Follow ordinary tool approvals. A denial is preserved and reported; no split-command or alternate-tool/context workaround.

Work from /Users/nguyenvanlan/Documents/code/pet-projects/matter-control, coordination branch codex/unified-project-flow, prepared HEAD a62d838791ba188838c4ff00b7b6e265ac775056. Recheck current branch/HEAD and changes, do not reset/stash/stage/commit/merge. Read root AGENTS, /Users/nguyenvanlan/.codex/RTK.md, current workflow/project status, docs/implementation/tasks/MC-002-INTA-FE-VALIDATION.md, frozen docs/implementation/inta-approved-contract.md, final docs/reviews/inta-closeout-readiness-return.md, docs/testing/inta-fe-validation-handoff/inputs.json, and the sealed completion-codex minimal-validation-plan.json/evidence-index.json. Use Semble before code exploration; record unavailability before targeted fallback. Exact known-path/hash reads are allowed. Keep all original packets byte-identical.

Product source /tmp/mc002-inta-fe must be clean3e5a642479acb789eb210e73fba956f3e85082e3. Harness /tmp/mc002-inta-harness must be clean48cc03e949d66fc47a7d304413621eb79804e6c1. Read their instructions; preserve actual unchanged shared HTTP client. The imported apps/frontend/tools/inta-harness are snapshots, not substitutes for this assignment's pinned paths. Read installed pinned Next documentation before selecting CLI behavior; use Context7 for current library docs and installed docs/help for exact version compatibility. No dependency download/upgrade.

## Codex drift disposition and immediate preflight

Historical Next88444/88453 disappearance remains TERMINATION_NOT_OBSERVED. Codex now cues only a NEW isolated validation attempt, not restarting/repairing the historical run or proving its teardown. No further owner clarification of the same missing exit is required before this new attempt. Retain the limitation for QA.

Before execution verify original /tmp/mc002-inta-state-intamvnmoems3pd has exactly59files/hashes matching docs/testing/inta-returns/frontend/runtime-intamvnmoems3pd/stage7/05-ledger-after.sha256: counter27,23trueassertions,STAGE_7_COMPLETED,sevenmarkers,A baselinev1/currentv2,B retained,XOUTCOME_UNKNOWN. Read files only: never instantiate driver/help/status. Pin before/after; no old state writes.

Use selected read-only ps/listener checks: expected old Go98134 andNext88444/88453 absent,18085/18086unbound. Do not signal any old PID or kill port owners. If occupied/unexpected process/source/ledger drift, STOP and return exact evidence to Codex; no speculative repair. The previously observed PG remains Codex-owned; do not inspect private configuration or run any Docker lifecycle/SQL/Go command. Historical03:49:42Z metadata is context, not current proof.

All paths below must be absent before creation:
- /tmp/mc002-inta-fe-validation-20261026 (owned sandbox: product, harness, runner, private empty HOME, state, generated output, local dependencies)
- /tmp/mc002-inta-evidence/frontend/validation-20261026 (raw)
- docs/testing/inta-returns/frontend/validation-20261026 (exports)
- docs/reviews/inta-fe-validation-antigravity-return.md (return)

If any is occupied, report rather than overwrite. Build exact source snapshots from pinned tracked files, preserving internal symlinks/modes and package/config/lockfile bytes. No .git, .env/private config, old .run-state or .next copied into snapshots. Use only verified already-installed pinned dependencies in a private copy/clone that cannot write through to originals. Do not modify shared node_modules/store or install packages. If this isolation is unavailable, report BLOCKED; do not weaken it. Check before/after original trees remain clean.

## A. INT-ENV-05 — missing guard startup negatives

Existing R4 already covers API_MODE, NODE_ENVproduction, missing opt-in and selected400/405controls. Do not rerun that full suite or scripts/live-guards.ts: the latter writes fixed .run-state/PID provenance and repeats historical operations.

Write the smallest validation-only runner in the new sandbox, with one per-variant result. Test each key separately:
API_TOKEN, API_BASE_URL, AUTH_ALLOW_ANONYMOUS, API_TIMEOUT_MS, AUTH_SECRET, NEXTAUTH_SECRET, CLERK_SECRET_KEY, SESSION_SECRET, COOKIE_SECRET, DATABASE_URL, JWT_SECRET.

For each run a nonempty synthetic sentinel INTA_GUARD_SENTINEL. Also run an empty-value variant for each key because the source/startup contract explicitly refuses presence including empty.22subchecks under the existing INT-ENV-05 ID, not22new acceptance IDs. These are invented test inputs, never actual credentials or DSNs.

Each child uses an explicit clean env allowlist: bounded PATH for installed local tools; new empty HOME; NODE_ENV=development; MC_INTA_ENABLE=1; MC_INTA_GO_BASE_URL=http://127.0.0.1:18086; MC_INTA_STATE_DIR under the NEW sandbox; exactly the one tested key. No inherited product env, dotenv loading or broad process.env spread. Keep original guard/config bytes. Base command from existing verified webpack launch, with cwd NEW harness snapshot: rtk proxy <private installed next executable> dev -H 127.0.0.1 -p 18085 --webpack. Record actual resolved executable/argv; do not infer a different bundler or use product server startup.

Start only a synthetic HTTP observer on127.0.0.1:18086 after checking the port unused; it is not Go/PG. Measure per-child counter before/after and total. No harness endpoint/record/health request is needed for these startup negatives. Require numeric nonzero child exit within15s, expected key-name-only refusal from startup guard,18085never acquired and observerzeroHTTPcalls. Watch listener ownership during the child, rather than only checking after exit. Timeout, unexpected send/listener, unsupported CLI/dependency or generic startup error is not PASS; stop and retain exact evidence. A process spawn failing before the guard is not the intended refusal.

Capture PID/start/executable/parent ownership for every new child and observer before any signal. Only exact newly spawned processes may be stopped for this validation; record signal, bounded wait and true child exit/status. Never use killall/pkill or signal historical PIDs/unknown children. After variants stop the owned observer, confirm owned listeners absent; keep files/evidence. Do not stop PG or start Go.

A small self-check for new runner logic should prove its per-variant accounting/timeout/error paths without real dependencies; distinguish it from actual Next guard results. No harness production code patch. If a guard defect appears, report it and return before patching pinned source.

## B. INT-ISO-02 / INT-ENV-07 — product module exclusion

In NEW exact3e5a642 product snapshot with private local dependencies, inspect package/tsconfig/vitest.config.mts/CI and the import graph. Existing sibling layout alone is source proof, not artifact proof.

After checking installed CLI compatibility, the minimal proposed commands are:
- rtk proxy pnpm exec vitest list --filesOnly --json
- rtk proxy pnpm build

Use explicit clean synthetic/demo environment per the actual template's documented requirements; do not use real APIs/credentials or change env example/config to pass. Do not override topology or API behavior. If supported inputs/dependencies are insufficient, preserve error and report blocker. Collection is not test execution/QA. Do not run unrelated full suites, browser/E2E/Storybook, install/audit/download commands or hosted CI. The project build script uses its existing bundler; no silent webpack/turbopack switch.

Capture cwd, exact argv/tool versions/start/endUTC/exit, separate stdout/stderr, resolved collected paths, and new .next build/route/module manifests/NFT traces plus relevant emitted JS/assets inventory/hashes. Verify no harness route (/harness/case), executor/driver/guard module or @harness/mc002-inta-harness dependency is in product artifacts/test collection; combine resolved graph/traces with module/content inventory, not just string absence. Product may keep its ordinary dashboard/tasks routes; those template routes are not new MatterControl product implementation.

No generated file escapes the new product snapshot. Original sources/package/lockfile/shared client and historical state remain unchanged. Record hostedCI NOT_RUN and any missing artifact graph as a limitation. The optional new dynamic/cache request probe from the old plan is NOT assigned here; retain its separate pending status if original evidence does not cover it.

## Evidence, return and stop

Write only NEW sandbox/raw/export/return paths named above; do not edit shared governance status, old returns or sealed44-payload packet. Include actual identity, baseline/new source hash comparison,22startup subcheck results, collection/build observed-vs-expected, caps/limitations, exact commands/UTC/exits, new-process cleanup, unchanged59ledger proof and resource disposition. Keep synthetic observer proof distinct from actual historical Go/PG proof. Application logs omit fixture body markers/credential values; scan bounded artifacts for credential patterns before export. No backend.env/Config.Env/current secret read is granted; actual-secret scan remains Codex work.

Raw/export must match byte-for-byte. Supply a payload manifest with paths/bytes/SHA256 excluding itself; record accurate payload counts and complete source for new validation-only runner. Do not export node_modules/.next wholesale, privateHOME/env or secret values. Keep raw generated outputs locally and export only the necessary reviewed manifests/traces/inventory/logs.

Return IN_REVIEW / FE_VALIDATION_RETURNED, or BLOCKED with exact cause. Do not mark any canonical51row PASS, independent OpenCode QA complete, MC002DONE, auth/C01-PRODUCT/security/Cloudflare/cost/recovery/Design Gate waived or STEP03Bauthorized. Codex intakes first; OpenCode must independently review the new results. No Claude loop unless a material architecture deviation arises. No commit/merge/push or provider/global setting change.

End with completed/skipped checks and remaining risk. A prepared prompt is not actual dispatch; acknowledge this human assignment before work and report the actual execution identity rather than claiming a previous owner ran it.
