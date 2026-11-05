# INT-A FE validation R3 — targeted correction after independent R2 review

**READY_NOT_DISPATCHED / SOURCE_AND_DETERMINISTIC_SELFCHECK_ONLY / LIVE_RUNTIME_NOT_RELEASED**

Human delivery of this prompt assigns actual Antigravity, the frontend owner. Priority P0. Codex coordinates; OpenCode independently reviews the returned R3 source. Preparing this prompt is not dispatch. Do not report DONE, runtime PASS or closure of the 36 cases.

## 1. Context, inputs and ownership

Repository: `/Users/nguyenvanlan/Documents/code/pet-projects/matter-control`.
Branch: `codex/unified-project-flow`. Prepared base/head: `a62d838791ba188838c4ff00b7b6e265ac775056`.

Recheck root, HEAD/status and applicable instructions before work. Follow RTK and Semble rules. Preserve other owners' changes; do not reset, stash, stage, commit, merge or push. Record actual agent/tool/model identity. Use the current permitted session; no login, provider/model/settings change or paid route.

Read these pinned inputs (repository-relative paths below):

- `docs/testing/inta-opencode-fe-r2-intake/r3-inputs.json` and verify every direct pin plus transitive snapshot payload pins.
- `docs/reviews/inta-opencode-fe-r2-intake.md`.
- `docs/reviews/inta-opencode-fe-r2-source-review.md`, especially findings and required corrections. SHA256 `1a1abebe0c6872c54a309d3b655a4e43848d974006ccd6529b517c030faec6b3`, 26,979 bytes.
- `docs/implementation/inta-launch-contract-addendum.md` and the pinned PO approval.
- Source baseline: `docs/testing/inta-fe-validation-r2-approval-update-intake/review-snapshot/` — 15 payloads, 131,584 bytes. Copy only needed source/test files into the new R3 root; never edit this snapshot or mutable R2 artifacts.

PO option A is already APPROVED: the supported guard-first launcher defines the never-listen boundary; raw Next CLI is unsupported for that claim and its historical FAIL remains. Do not request that approval again. Exact launcher/import/environment/argv/state binding remains unverified. Do not invent a PO-selected Node executable or loader. Check installed documentation/Context7 for version-specific Node import behavior; no dependency install or fetch.

Only new owned paths:

- `/tmp/mc002-inta-fe-validation-r3-20261026` — corrected source and pure/mock test scratch.
- `/tmp/mc002-inta-evidence/frontend/validation-r3-20261026` — raw evidence.
- `docs/testing/inta-returns/frontend/validation-r3-20261026` — export.
- `docs/reviews/inta-fe-validation-r3-antigravity-return.md` — return.

Check each path is absent before creating it. If occupied, STOP and report the collision; do not overwrite. Attempt paths must also refuse collisions. Original FE at `/tmp/mc002-inta-fe` (3e5a642), harness at `/tmp/mc002-inta-harness` (48cc03e), product sources/config/lockfiles/dependencies, R2 artifacts, old ledger and A/B/X state remain read-only. The original `src/guards.ts` is read-only; expected SHA256 `0f5f245316450d76d47f79a1b668a777ef9e1134008cbbc1c566808c654ef928`.

## 2. Allowed execution

Only deterministic pure/mock/tempfile selfchecks and load-only Node checks. Mock process, probe, clock and signal APIs. No real Next/observer/server/socket/HTTP/lsof/Go/PostgreSQL/Docker, private credential reads, real signals (even signal 0), dependency copying/install/download, product build or seven-stage replay. Pure Python/Node test commands are allowed; they must not start servers or signal existing processes. Do not execute the unsafe R2 shell wrapper in any form. Use no-bytecode imports when reading frozen Python sources.

## 3. Minimum coherent correction

Implement the existing R2-I01..06 corrections together. Reuse current helpers and the platform; no new framework, dependency or unrelated feature.

**R2-I01 — actual dispatch, thin wrapper.** The wrapper must invoke a real coordinator entrypoint and the existing 22-variant plan, stopping subsequent variants on failure. Remove port-based listener enumeration, kill traps and cleanup from the wrapper. Cleanup belongs to the coordinator and its owned children. Do not report success after import alone. Refuse occupied attempt directories; retain prior evidence without truncation/removal. Test the actual wrapper/entrypoint contract through a safe stub or injection that cannot launch servers.

**R2-I02 — approved launch and environment.** Replace direct `npx next dev` and `os.environ.copy()` with the approved guard-first launcher. Require explicit pinned installed Node/launcher/Next paths, argv, cwd and private HOME/state. Pass `MC_INTA_STATE_DIR` through every layer. No package resolution/download fallback. Missing or invalid binding blocks before process creation. Use one bounded environment construction shared by dispatch and tests. Forbidden-key presence, including empty values, must refuse before Next spawn. Use the actual existing startup guard; do not duplicate its policy list. This round does not authorize copying dependencies; propose the private path/link checks and test them with filesystem doubles.

**R2-I03 — owned lifecycle.** Record each created child/observer handle and immutable identity (PID, start identity, exact executable and ownership/parent binding). Validate ownership before cleanup; existence or a name substring is insufficient. Identity/probe denial or mismatch must fail closed with no signal. Distinguish an already exited owned child from unknown/reused PID. Use one try/finally path covering observer start, child start, observation, post-probe and cleanup. Capture checked bounded wait results and actual exit statuses; retain stdout/stderr. Surface cleanup failures even when the primary operation failed. No global port kill, silent SIGKILL, unbounded wait or ignored terminate result. Tests use fake OS/process handles only.

**R2-I04 — complete evidence.** Child exit before any during-run observation is UNKNOWN, not default False/PASS. Record sample count and windows explicitly. Probe rc=1 with any stderr, including ENOENT, is UNKNOWN/PROBE_ERROR. Test the actual subprocess adapter. A final observer record must require `isFinal is True`, a nonnegative integer counter excluding bool, `cleanShutdown is True`, expected run/variant/identity and captured observer exit 0. Define an explicit error-field policy; an empty error field cannot conceal unknown failure. Malformed/missing/unclean/probe/write/identity/exit errors cannot PASS. Sampling proves only its observed windows; do not claim absolute never-listen from zero or partial samples. If fast guard refusal requires a different complete proof basis, return that binding proposal for independent review before live execution; do not relax checks merely to pass old tests.

**R2-I05 — actual launcher path.** Bind cwd/executables/state explicitly; unbound defaults must not launch another root. Cover relative/absolute CLI entry detection and the same spawn-error, signal-forwarding and close/exit path used in dispatch. Extract only what is necessary for injection. Avoid self-signal re-raise loops and success before child exit. Use fake process/spawn/clock. Prove guard import with a load-only check, without starting Next.

**R2-I06 — tests call corrected code.** Retain useful tests, including the three R1 type regressions, API_MODE nonempty/empty and NODE_ENV production. Add focused assertions for:

- Actual coordinator dispatch/run with fake Popen/probes: valid path, early exit, preflight/listening/counter aborts, child-start exception and observer cleanup, observer parse/write/start/cleanup failures.
- Actual listener probe with fake subprocess results: 0, clean 1, 1 with stderr/ENOENT, greater than 1, timeout and exception.
- Actual ownership/cleanup helper: identity mismatch/denial means zero signals and failure; successful bounded wait records the true exit.
- Actual atomic writer: creation/replace/fsync failures propagate and are classified by the coordinator.
- Actual thin wrapper/entrypoint dispatch through safe controlled stubs.
- Actual launcher CLI/error/signal/close/environment/state path through injected fakes.

Do not duplicate a toy probe evaluator or only manufacture final evaluator kwargs. Assert real calls, resulting evidence and cleanup outcomes. Report accurate test counts and untested paths; no target PASS count.

## 4. Return and stop

Map R2-I01..06 to changed files, source hashes, baseline diff, exact tests/evidence and remaining limitations. Include corrected runnable tools/tests, explicit launch binding proposal, commands/UTC/exit codes/stdout/stderr, a manifest excluding itself and byte-equal raw/export files. Scan exported content for credential patterns without reading real credentials; actual-secret scan remains NOT_ESTABLISHED. Reference historical artifacts instead of duplicating them or exporting dependencies/build caches.

Return **SOURCE_CORRECTIONS_RETURNED / IN_REVIEW / RUNTIME_NOT_RELEASED**, or a concrete BLOCKED result. Do not invoke OpenCode yourself. After Codex intake, independent R3 source/binding review precedes fresh private-attempt/ledger/port prerequisites and an explicit bounded runtime cue.

Keep all 51 formal results unchanged: 36 required, 14 product-deferred, one external-blocked. Preserve T11c OUTCOME_UNKNOWN, historical FAILs, unknown terminations and open privacy/teardown/conformance gates. No MC-002 DONE, Step 03B, product/auth/security/Cloudflare/cost/recovery acceptance. No extra Claude loop or repeated PO option-A approval.

End with work skipped and remaining risk.
