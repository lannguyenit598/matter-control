# INT-A — OpenCode independent implementation-R4 source review

**Task**: `MC-002-INTA-FE-VALIDATION-R4-SOURCE-REVIEW`
**Status**: `IN_REVIEW / CHANGES_REQUIRED_SOURCE_ONLY / RUNTIME_NOT_RELEASED`
**Priority**: P0
**Mode**: `READ_HASH_STATIC_ONLY`; reviewer runtime `NOT_RUN`
**Reviewer**: Actual OpenCode, independent nonauthor; opencode CLI `v2.1.4`; model `opencode/deepseek-v4.1-flash-free`; provider `opencode`.
**Independence**: I did not author, edit, or execute the reviewed implementation, and I did not inherit the owner's blanket "resolved" claim or Codex's observations as a verdict.
**Base/HEAD**: `a62d838791ba188838c4ff00b7b6e265ac775056`; branch `codex/unified-project-flow`; worktree pins below are the prepared worktree state.
**Review window (UTC)**: 2026-10-26T10:08Z–14:20Z (exact per-check times in `checks-log.json`).
**Outputs**: this report plus `docs/testing/inta-returns/qa/fe-validation-r4-source-review-20261026/review-inputs.json` and `checks-log.json`; all three hashes/bytes are in the human completion message.

## 0. Verdict

**CHANGES_REQUIRED (source-only).** The R4 packet is internally consistent and several R3 corrections are real, but two P1 requirements remain unimplemented, so this review cannot award a source PASS or a runtime cue.

1. **Fast-refusal PASS is not lifecycle-proven (R4-C01 / NF-4 / R2-I04, P1 at the runtime-cue gate).** Probe-before-poll counts a sample even when the child has already exited; the owner's own test 34 passes with a mock child that was never alive. The claimed zero-spawn evidence (`spawnCalled:false`) is returned only inside an in-memory object and is never persisted by the CLI. A real run could therefore emit a refusal phrase, exit 1, and still pass the listener gate without any evidence that the Next child was not spawned and sampled while dead.
2. **Private executable/environment binding is absent (R4-C02 / R3-N02 / NF-1, P1).** Node is still selected through `shutil.which`, the wrapper invokes PATH `python3` and preserves ambient `PYTHONPATH`, and child/observer `PATH`/`HOME`/`TMPDIR` remain ambient. Next and cwd point at the original nonprivate harness; the dependency staging plan is candidate-only and unperformed; there is no pre-spawn validation of executable, cwd, dependency links, or symlink boundaries.

The remaining P2 residuals (weak process identity, ignored wait status, swallowed directory-fsync failure, bool/float exit-code acceptance, optional identity, guard hash after static import, and evidence-provenance gaps) should be corrected in the same bounded source pass because they directly weaken the proof quality. No pin mismatch was found; `NEEDS_INPUT_REFRESH` is not triggered.

## 1. Scope, method, and evidence boundary

I read the exact owner return, the 22 R4 payloads, the 20 R3 baseline payloads, all seven R3→R4 diffs, the prior R3 independent report, the R4 assignment, Codex intake/observations/static-safety, the frozen guard, and the launch approval/addendum. I re-derived the owner's concrete claims from source rather than accepting them.

Boundary actually observed:

- **No reviewed shell, Python, or JavaScript was executed or imported** — not the coordinator, evaluator, observer, launcher, wrapper, selfcheck, or test suite. No Node/Next, observer, build, probe, `ps`, `lsof`, signal (including 0), HTTP, SQL, Docker, credential/private-env read, external agent, or provider call.
- **Reviewer-owned operations only**: `git rev-parse`/`status`, `shasum -a 256`, `stat`/`find`, Python standard-library JSON/hash/text processing, `patch -o` text reconstruction on temporary copies, and line-level reads. Nothing was staged, committed, merged, pushed, or sent to another agent.
- **Owner suites are evidence, not reviewer execution.** The 46/46 and 13/13 results below are read from retained JSON/stdout; I did not replay them. Runtime behavior is `NOT_RUN`.
- **No source/index/history/status/contract mutation.** The worktree already contained pre-existing modifications and untracked files at review start; I did not alter them.

## 2. Packet and provenance integrity

| Check | Result |
|---|---|
| Workspace branch/HEAD | `codex/unified-project-flow` / `a62d838791ba188838c4ff00b7b6e265ac775056` — matches assignment. |
| Direct pins | **18/18 MATCH**, 162,934 bytes, 0 mismatches. |
| R4 payloads | **22/22 MATCH**, 285,768 bytes; manifest declares 285,768. |
| R3 baseline payloads | **20/20 MATCH**, 225,606 bytes; manifest declares 225,606. |
| Raw vs export | 23 files each (22 payloads + manifest); `diff -r` exit 0; 0 hash mismatches on path-normalized comparison. |
| Seven R3→R4 diffs | **7/7 exact** byte reconstruction by `patch -o` on temporary copies; resulting SHA-256 equals the exported R4 source for every diff. |
| Owner selfcheck | 46 records, 46 PASS, 0 FAIL, `allPassed:true`; stdout says `46 PASS / 0 FAIL out of 46`. |
| Owner launcher mock | 13 PASS / 0 FAIL; stdout summary matches. |
| Canonical plan | 25 tuples; includes `NODE_ENV=production`; label and count now agree. |

Pins and owner evidence do not establish runtime behavior. Three provenance gaps matter:

- No retained exact command line, numeric process exit code, or stderr transcript for either suite; only stdout and summary JSON are present.
- Version reads (Node `v24.22.1`, Python `3.14.4`) are owner-declared in `r4-test-summary.json`, not retained as command transcripts.
- Selfcheck stdout says results were saved under `/tmp/mc002-inta-fe-validation-r4-20261026/runner/…`, while the raw evidence directory is `/tmp/mc002-inta-evidence/frontend/validation-r4-20261026`. The exported pins are byte-identical, but the exact tested path/argv is not retained. This is a binding/provenance gap, not a falsification claim.

## 3. Finding dispositions

### 3.1 Original C01..C04

| ID | R4 disposition | Exact evidence and basis |
|---|---|---|
| **C01** (P1) Contract/marshaling/transport | **CLOSED_SOURCE_ONLY** | Wrapper now dispatches: `guard-validator-r4.sh` L10 `set -euo pipefail`, L26–30 collision refusal, L40 `exec python3 …/coordinator.py …`; no `trap`, `lsof`, or `kill` command in its 40 lines. Probe classification is faithful: `coordinator.py` L79–93 returns `False` only for rc=1 with empty stderr, treats any non-empty stderr as unknown, and fails pre-flight before launch at L247–261. Tests 43/44 execute a copied wrapper against a stub. Closure is source-only: no test executes the real wrapper → real coordinator transport. The wrapper's ambient `PYTHONPATH`/`python3` is a binding defect (C02), not a reopening of C01. |
| **C02** (P2) Unsafe-PASS evidence classes | **PARTIAL** | Fixed: any present `error` key fails closed (`guard_evaluator.py` L151–155); the old permissive defaults are now `None` and fail closed (L26/L31, L82, L176); `during_sample_count` is strict non-bool int (L82); `isFinal`/`cleanShutdown` are strict `True` (L159, L167). Residual: `exit_code != 1` accepts `True` and `1.0` (L116); `observer_exit_code != 0` accepts `False` and `0.0` (L176); identity gates stay optional (L210–213); and a post-exit probe still counts as a during sample (C01/NF-4). These are unsafe-PASS classes, so C02 cannot close. |
| **C03** (P2) Observer persistence/ownership | **PARTIAL** | Fixed: one `try/finally` spans the lifecycle (`coordinator.py` L470–502); all five terminate call sites pass parent/name/handle and capture results (L405–413, L428–436, L453–461, L473–481, L487–495); observer wait is captured (L498–502). Residual: identity is still parent/name-substring with no immutable start identity (`verify_pid_identity` L114–135); `wait()` success is accepted without return-code classification (L170–175); the observer SIGTERM handler no-ops if `server` is unset before bind (`observer.py` L132–145, handlers installed L147–148 before construction L150–151); directory fsync failure is swallowed (L59–68); no SIGKILL escalation after timeout. |
| **C04** (P2) Launcher proposal/binding | **PARTIAL** | Fixed: `verifyGuardIntegrity()` exists and hashes the guard (`harness-dev.mjs` L46–58), absolute defaults exist (L23–25), and the CLI entry is explicit (L231–248). Residual: the frozen guard is statically imported at L20, before the hash check at L157–159; `guardPath` is caller-supplied (L151) while the executed guard is the fixed import at L20; defaults still point at the original nonprivate harness; there is no pre-spawn existence/realpath/symlink validation; and the binding record's “hash before guard logic” claim (L49) is inaccurate. |

### 3.2 R2-I01..I06

| ID | Disposition | Exact evidence and basis |
|---|---|---|
| **R2-I01** wrapper trap/no dispatch | **CLOSED_SOURCE_ONLY** | `guard-validator-r4.sh` L1–40 contains no `trap`, `lsof`, or `kill`; L40 execs the coordinator and preserves exit status; L26–30 refuses an existing attempt. Tests 43/44 run a copied wrapper beside an inert stub, so only source-level dispatch is established, not real transport. |
| **R2-I02** launcher bypass / inherited env | **PARTIAL** | Bypass fixed: child command is the approved launcher (`coordinator.py` L357–361), with an explicit key set at L340–352. Unresolved: Node is PATH-first (L212–214); `PATH`/`HOME`/`TMPDIR` are ambient (L341, L348–349); observer env is ambient (L302–310); cwd/Next remain the original nonprivate harness (`harness-dev.mjs` L23–25); no pre-spawn private-stage validation. |
| **R2-I03** identity/discarded results/no finally | **PARTIAL** | Call-site defects fixed exactly as in C03: all five sites pass parent/name/handle and capture results; `finally` covers early failures. Not closed because identity is mutable parent/name-substring (`coordinator.py` L114–135), wait success ignores return code (L170–175), already-exited handles return `True` without status (L159–160), and caller sites 3/4 are untested. No unowned signal is alleged to have occurred. |
| **R2-I04** fast-exit default-False PASS | **PARTIAL** | Zero samples now fail closed (`guard_evaluator.py` L89–95), but sample ordering still counts a post-exit probe (`coordinator.py` L396–399 before L443–446); test 34 passes with an already-exited mock child (L493, L520–521); the pre-bound path fabricates `during_sample_count=1` (L273); `spawnCalled:false` is not persisted. The fail direction is not safe against a spawn-then-exit launcher defect. |
| **R2-I05** launcher allowlist/defaults/CLI | **PARTIAL** | `isCliEntry` resolves relative and absolute paths (`harness-dev.mjs` L79–88); state-dir propagation L193–195; signal errors are visible L121–134; allowlist L28–40. Residual: the real CLI block L231–248 is untested; `guardPath` L151/159 can differ from the static import L20; Next/cwd are absolute but nonprivate; no pre-spawn validation; T9's OR-fallback is fixed (test 9). |
| **R2-I06** selfcheck never exercised real coordinator | **PARTIAL** | Reach improved: actual `VariantRunner` tests 34–40, `run_plan` 41–42, wrapper stub 43–44, Node/launcher 45–46. Still missing: caller cleanup sites 3/4; file/dir fsync failure isolation; wrapper port args and nonzero-stub propagation; real CLI adapter and synchronous spawn/signal exceptions; and abort tests retain real Popen defaults (S1). |

### 3.3 R3-N01..N06

| ID | Disposition | Exact evidence and basis |
|---|---|---|
| **R3-N01** cleanup identity | **PARTIAL** | The five callers now pass `expected_name`/`expected_parent`/`process_handle` and capture `(term_ok, term_err)` (`coordinator.py` L405–413, L428–436, L453–461, L473–481, L487–495). Still not an immutable start identity: `verify_pid_identity` checks `expected_name in comm` and PPID only (L132–135); `wait()` success is unclassified (L170–175); no SIGKILL escalation (L185); observer pre-bind SIGTERM no-ops (`observer.py` L132–145); sites 3/4 have no caller test. Helper tests 26–31/37–40 do not prove those caller branches. |
| **R3-N02** PATH/private binding | **PARTIAL** | Node remains `shutil.which("node")` first (`coordinator.py` L212–214); wrapper uses PATH `python3` and ambient `PYTHONPATH` (`guard-validator-r4.sh` L13, L40); child/observer `PATH`/`HOME`/`TMPDIR` are ambient (L302–310, L340–352); launcher defaults to `/tmp/mc002-inta-harness` (L23–25); no pre-spawn validation. Absolute strings are not a validated private stage. |
| **R3-N03** real `os.kill` hazard | **CLOSED_SOURCE_ONLY** | `selfcheck-r4.py` installs the fail-fast guard at L33–41 before importing the coordinator at L43–45; direct tests inject `MockSignalTracker`; test 38 asserts wait + fake SIGTERM. Test 46 runs the Node mock suite in a separate process outside this guard, but it is mock-only. No historical signal is asserted. |
| **R3-N04** evaluator strictness | **PARTIAL** | Fixed: falsey `error` rejection (L151–155), fail-closed `None` defaults (L26/L31, L82, L176), strict non-bool count (L82), strict `isFinal`/`cleanShutdown` (L159/L167). Residual: bool/float exit codes (L116/L176) and optional identity (L210–213). |
| **R3-N05** plan/collision | **CLOSED_SOURCE_ONLY** | `PLAN_VARIANTS_25` has 25 entries including `NODE_ENV=production` (`coordinator.py` L33–58); `run_plan` refuses any existing attempt directory (L572–576); wrapper refuses at L26–30; tests 41/44 assert exit 2. |
| **R3-N06** durability/wrapper/T9 | **PARTIAL** | T9 OR-fallback removed (`test-launcher-mock.mjs` L290–303); parent-dir fsync added (`observer.py` L59–68) but every failure is swallowed (L67–68); wrapper test 43 uses ambient env and checks only two argv slots, not ports or nonzero propagation; tests 32/33 do not isolate file-vs-dir fsync failure; sites 3/4 still uncovered. |

### 3.4 NF-1..NF-6

| ID | Disposition | Exact evidence and basis |
|---|---|---|
| **NF-1** three-way env binding | **PARTIAL** | The 11-key allowlist now agrees across coordinator/launcher (`coordinator.py` L340–352; `harness-dev.mjs` L28–40), and observer has an explicit dictionary (L302–310). But the values are ambient (`PATH`, `HOME`, `TMPDIR`), not private; `SHELL` is passed only when present; no dependency/link isolation; the binding record's “clean-room” claim (L71–75) is not implemented by the code. |
| **NF-2** “22” label / missing NODE_ENV | **CLOSED_SOURCE_ONLY** | Label/comment corrected to 25 (`coordinator.py` L30–33); list has 25 tuples (L33–58); `NODE_ENV=production` at L58 and handled at L339–354. No ID changes. |
| **NF-3** guard pin comment-only | **PARTIAL** | `verifyGuardIntegrity()` now hashes and fails closed (`harness-dev.mjs` L46–58, L157–172; test 11). But the guard is imported at L20 before verification; `guardPath` can be a different file (L151/L159) than the fixed import (L20); the CLI passes the default path, but the helper-level bypass remains. A missing guard is a Node module failure, not a canonical refusal; the evaluator fails closed as `WRONG_REFUSAL`, so this is not a false PASS. |
| **NF-4** fast-refusal proof basis | **OPEN** | Ordering change is present (`coordinator.py` L394–448), but probe-before-poll is not liveness proof: an already-exited child is sampled and counted (test 34 L493/L520–521); the pre-bound path fabricates `during_sample_count=1` (L273); `spawnCalled:false` is not persisted (`harness-dev.mjs` L182–188; CLI L231–243 discards it); the proof document's five points (L55–70) therefore do not correlate to retained evidence. See §4.1. |
| **NF-5** staging paths | **PARTIAL** | Paths are named as candidate in the plan and binding record, but the governed coordinator resolves the launcher beside its own script (`coordinator.py` L220–226) while the binding record names `/tmp/mc002-inta-fe-validation-r4-20261026/launcher/harness-dev.mjs` (L45); selfcheck stdout names a third `/tmp` results root. Pins are byte-equal; exact tested path/argv is unretained. Staging remains unperformed. |
| **NF-6** pre-bound wording | **CLOSED_SOURCE_ONLY** | `guard_evaluator.py` L74–79 now says “listener observed at pre-flight (port already occupied)” when `exit_code is None`; test 19 covers it. The separate fabricated `during_sample_count=1` at pre-flight (L273) remains an NF-4/C01 evidence-integrity defect, not a wording defect. |

### 3.5 R4-C01..C05 — confirm/refute

| ID | Decision | Basis |
|---|---|---|
| **R4-C01** sample timing / spawn proof | **CONFIRMED** | `coordinator.py` L394–448 probes before poll; a sample is counted at L399 even if `poll()` is non-None at L443–446. Test 34 constructs `MockChildProcess(pid=70002, returncode=1)` at L493 and still records PASS at L521. Pre-flight fabricates `during_sample_count=1` at L273. `spawnCalled` exists only in the returned object (`harness-dev.mjs` L182–188); CLI L231–243 never writes it. |
| **R4-C02** private executable/env binding | **CONFIRMED** | Coordinator PATH-first Node (L212–214); wrapper PATH `python3`/ambient `PYTHONPATH` (L13/L40); ambient `HOME`/`TMPDIR`/`PATH` in both environments (L302–310, L340–352); original nonprivate Next/cwd (L23–25); no pre-spawn executable/cwd/symlink validation; staging is candidate only. |
| **R4-C03** identity + guard load order | **CONFIRMED** | Call-site identity is present, but helper checks only parent/name substring (`coordinator.py` L132–135) and ignores wait return code (L170–175). Guard is statically imported at `harness-dev.mjs` L20, before hash verification at L157–159; `guardPath` can differ from the imported target. |
| **R4-C04** observer durability failure | **CONFIRMED** | `observer.py` L59–68 wraps directory open/fsync/close in `try/except Exception: pass`; no failure reaches the evaluator. Tests 32/33 cover open/replace failure only, not file/dir fsync denial. |
| **R4-C05** schema/evidence provenance | **CONFIRMED** | `exit_code != 1` accepts `True`/`1.0` (`guard_evaluator.py` L116); `observer_exit_code != 0` accepts `False`/`0.0` (L176); identity is optional (L210–213). No exact command/exit/stderr/version transcript is retained; the selfcheck stdout root differs from the raw evidence root. |

### 3.6 Static-safety S1..S6 — confirm/refute

| ID | Decision | Basis |
|---|---|---|
| **S1** real Popen defaults in abort tests | **CONFIRMED** | Tests 35/36 and 41/42 instantiate runners without `popen_factory`, relying on early return (selfcheck L529–551, L699–709). A raising “unexpected Popen” fake is absent; branch drift could reach a real spawn. |
| **S2** real clock/sleep | **CONFIRMED** | `coordinator.py` uses `time.time()`/`time.sleep` at L327–333, L395–396, L448; mocks replace processes/probes, not the clock. Not fully deterministic. |
| **S3** wrapper stub env/args | **CONFIRMED** | Test 43 defines `wrapper_env` (L730) but never passes it to `subprocess.run` (L737–743); the copied wrapper runs with ambient env. It checks only `argv[1]`/`argv[2]` (L749), not ports; stub exits 0, so nonzero propagation is untested. |
| **S4** sites 3/4 not covered | **CONFIRMED** | Tests 39/40 cover sites 1/2; 37/38 cover observer/child failure; no coordinator scenario drives site 3 timeout or site 4 running-child `finally` (`coordinator.py` L453, L473). Helper tests 26–31 are not caller coverage. |
| **S5** launcher CLI/exception branches | **CONFIRMED** | `test-launcher-mock.mjs` covers `isCliEntry` (L290–303) and `kill` returning false (L372–388), but not the real CLI adapter (`harness-dev.mjs` L231–248), synchronous spawn throw, or signal throw. |
| **S6** real subprocesses / fsync isolation | **CONFIRMED** | Tests 43/45/46 spawn real wrapper/Node processes; tests 32/33 perform real temp-fs chmod/replace operations. No test isolates file-fsync vs directory-fsync failure. “No process lifecycle” claims must be read as bounded to the mocked paths. |

## 4. Blocking findings

### 4.1 NF-4 / R4-C01 / R2-I04 — no lifecycle-coverage proof for fast refusal (P1)

The loop order is:

```text
while now < deadline:            # coordinator.py L396
    probe listener               # L398
    during_sample_count += 1     # L399
    ... counter check ...        # L422-441
    poll child                   # L443
    if exited: break             # L444-446
    sleep 0.05                   # L448
```

Taking the probe before `poll()` does **not** establish that the child was alive at probe time. An already-exited child is still probed once and counted. The owner's test 34 makes this concrete: the child mock is constructed with `returncode=1` (`selfcheck-r4.py` L493), i.e. it was never alive, yet the run is recorded as PASS with `duringSampleCount=1` (L520–521). That is not a proof of an active window; it is a proof that the evaluator accepts a dead child sample.

Two further gaps prevent the five-point proof in `proposals/fast-refusal-proof-basis-r4.md` L55–70 from being a runtime proof:

1. **Zero-spawn evidence is not persisted.** `launchHarness` returns `spawnCalled:false` in an object (`harness-dev.mjs` L182–188), but the CLI only looks at `result.success`/`result.child` and calls `process.exit` (`L231–243`). No file, stdout line, or attempt record retains `spawnCalled`. Point 3 of the proof basis therefore has no retained artifact.
2. **The pre-bound path fabricates a sample.** When the pre-probe sees a listener, `coordinator.py` L262–275 returns `during_sample_count=1` even though no child ran. The evaluator fails on `listener_during=True` before the count matters, so this is not a false PASS, but it is synthetic evidence and contradicts the claim that sampled counts are measured execution windows.

Consequence: a launcher defect that spawns Next and then exits with the canonical refusal could pass the never-listen gate. The post-exit probe sees no listener, the observer sees zero HTTP, the phrase and exit 1 match, and the dead sample is counted as “during.” That is the exact false-PASS class the gate exists to prevent. The fixed 50 ms cadence does not remove the race; it only changes which side of the exit the first probe lands on.

The minimum correction is not a delay or a retry. It is evidence binding: persist an immutable launch record (exact argv/cwd/executable hash, child PID plus OS start identity, `spawnCalled`, start/exit UTC), and make each during-sample carry the child-alive predicate or the `[start, exit]` interval. The evaluator should reject any sample not proven inside that interval. Test 34 must use an actually-live-then-exiting child, or assert `LISTENER_UNKNOWN`/zero samples for the already-exited mock; it must not PASS. If spawn tracing is used, it must be real OS-level evidence, not an ordering assumption.

### 4.2 NF-1 / R3-N02 / R4-C02 — private executable and environment binding (P1)

The approved addendum requires, before live validation, an implementation-binding record naming accepted source hashes, the supported launcher path, actual Node/tool versions and proven guard import, explicit env/argv, **private dependency paths/nested-link checks**, ownership, and new attempt/state/evidence directories (`docs/implementation/inta-launch-contract-addendum.md` L18). R4 supplies a record but not the binding:

- **Node:** `node_bin or shutil.which("node") or "/Users/…/v24.22.1/bin/node"` (`coordinator.py` L212–214). The PATH result wins; the hardcoded absolute is only a last fallback.
- **Python:** wrapper exports ambient `PYTHONPATH` and execs `python3` from PATH (`guard-validator-r4.sh` L13/L40). No absolute interpreter pin, no hash.
- **Child/observer environment:** `PATH`, `HOME`, `TMPDIR` are copied from `os.environ` (`coordinator.py` L302–310, L340–352). `SHELL` is copied when present. These are bounded key sets, not private values; the child can still inherit the user's home/temp/search path.
- **Next/cwd:** defaults are `/tmp/mc002-inta-harness/node_modules/.bin/next` and `/tmp/mc002-inta-harness` (`harness-dev.mjs` L23–25). The dependency plan identifies the original harness as read-only/nonprivate (L16–19) and its private clone/symlink checks as future work (L36–55, L74–79). No private stage exists.
- **No pre-spawn validation:** `launchHarness` verifies the guard hash and runs `validateHarnessStartup` (L157–189), then spawns `nextBin` at L201. It does not check that `nextBin` exists, is executable, resolves inside the private root, or that dependency links stay inside the boundary. A missing Next emits an async spawn error after `success:true` was returned (L220–227); the CLI then attaches lifecycle handlers (L245–246), but the result is not downgraded.
- **Binding-record mismatch:** the record names `/tmp/mc002-inta-fe-validation-r4-20261026/launcher/harness-dev.mjs` (L45) and claims hash verification before “evaluating any guard logic” (L49). The code imports the guard at L20 before the hash at L157–159, and the governed coordinator resolves the launcher beside its own script (`coordinator.py` L220–226), not the record's path. Pins are byte-equal, but the exact bound path/argv is not retained.

The minimum correction is a real private stage: CoW-copy the harness under the approved attempt root, resolve every `.bin`/`.pnpm` link with `realpath`, reject any target outside the private root or in sensitive paths, pin absolute Node/Python/Next/guard hashes, set private `HOME`/`TMPDIR`/state dirs, and fail **before** creating either process on any missing/mismatched binding. Update the record to the actual accepted paths and add negative tests for symlink escape, missing executable, cwd escape, and hash mismatch.

## 5. P2 residuals (source quality, not a substitute for the P1s)

- **Owned identity is still mutable.** `verify_pid_identity` checks PID existence, optional name substring, and optional PPID (`coordinator.py` L107–139). There is no process start time, executable device/inode, or PID-file tuple. A reused PID with the same parent and a `node`/`python` substring could still pass. All five callers now pass the same expected values, so the original omitted-identity defect is fixed; the strength of the identity is not.
- **Wait status is not classified.** `process_handle.wait()` success returns `(True, None)` (`L170–175`) regardless of whether the child exited 0, 1, or by signal. An already-exited handle returns `True` at L159–160 without a status check. For cleanup that may be acceptable, but the record cannot claim “clean exit” from this return.
- **No SIGKILL escalation.** On wait timeout the helper returns `False` (`L174–175`, `L185`); the caller appends an error but does not retry with SIGKILL. A stuck child/observer can survive cleanup. Owner test 30 is titled “escalation” but only asserts the timeout error.
- **Observer pre-bind signal gap.** `server = None` at `observer.py` L132; the SIGTERM/SIGINT handlers are installed at L147–148 before `ObservableServer` construction at L150–151. A signal in that window enters `handle_signal`, sees `if server:` false, and returns without writing or exiting. The coordinator's site-5 cleanup can then time out; there is no escalation.
- **Durability is not surfaced.** `observer.py` L59–68 swallows every parent-directory open/fsync/close exception. A successful atomic rename is not durable evidence if the directory fsync failed. Tests 32/33 exercise open/replace failure, not file-fsync or dir-fsync denial, and no test asserts a failure is propagated.
- **Exit-code types are loose.** `exit_code != 1` accepts `True` (bool is an int) and `1.0` (`guard_evaluator.py` L116); `observer_exit_code != 0` accepts `False` and `0.0` (L176). At the caller boundary these values come from `Popen.poll()`/`wait()` and are normally ints, but the evaluator contract should be strict because the selfcheck constructs values directly.
- **Identity gates are optional.** `expected_variant`/`expected_pid` checks are guarded by truthiness (`L205`, `L210`); an evaluator call without them can PASS. The coordinator supplies both (`L550–551`), so the runtime path is covered, but the helper contract is not fail-closed by default.
- **Guard hash order and path.** The static import at `harness-dev.mjs` L20 executes before `verifyGuardIntegrity` at L157–159. An optional `guardPath` can hash a different file than the one imported. The fixed CLI path narrows the risk, but the helper-level guarantee claimed in the binding record is not the code's guarantee.
- **Provenance.** No exact suite command line, numeric exit code, or stderr transcript is retained; version reads are owner-declared; selfcheck stdout names `/tmp/mc002-inta-fe-validation-r4-20261026/runner/...` while raw evidence is under `/tmp/mc002-inta-evidence/frontend/validation-r4-20261026`. This does not show falsification; it means the packet cannot independently bind the claimed run to the exact argv/environment.

## 6. Minimum coherent correction set

No architecture redraft and no canonical ID changes are needed. The bounded source pass is:

1. **Bind refusal evidence to a real process interval.** Persist a launch record before spawn with exact argv/cwd/executable hash and `spawnCalled`; record child PID + start identity and start/exit UTC; make each during-sample carry an alive predicate or interval; reject out-of-interval samples; remove the pre-flight `during_sample_count=1`; rewrite test 34 so a dead mock cannot PASS and add a real live-then-exit coordinator test.
2. **Implement the private stage.** CoW-copy the harness under the attempt root, realpath-check `.bin`/`.pnpm` links, reject escapes/sensitive targets, pin absolute Node/Python/Next/guard hashes, use private `HOME`/`TMPDIR`/state dirs, and fail before observer/child creation on any mismatch. Update the binding record to the actual paths/argv and add negative tests.
3. **Strengthen identity and cleanup.** Add an immutable start identity (start time or device/inode) to the verification tuple; classify `wait()` return codes; add SIGKILL escalation or an explicit fail-closed “still alive” result propagated to the evaluator; fix the observer pre-bind signal window; add caller tests for sites 3 and 4.
4. **Surface durability.** Let directory-fsync failure propagate or mark the record non-durable; add isolated tests for file-fsync, dir-open, dir-fsync, and close failures.
5. **Strict evaluator types/identity.** Require `type(exit_code) is int` and `type(observer_exit_code) is int`; require variant/PID identity (or an explicit `identity_required` contract); keep the falsey-error and count strictness already added.
6. **Fix guard load order.** Verify bytes before evaluating/importing the guard, or import a verified byte buffer; remove the `guardPath`/import divergence; make hash failure a deterministic canonical refusal with the expected exit path and add a CLI-level test.
7. **Retain provenance.** Record exact command line, exit code, stderr, and version-read transcript per suite; align the results/raw/export roots; update the binding record's path and hash-order claims.
8. **Close test-reach gaps.** Add a raising unexpected-Popen fake; pass the wrapper env explicitly and assert ports plus nonzero propagation; cover the real CLI adapter, synchronous spawn throw, signal throw, and fsync failures.

## 7. Direct answers to the assigned review questions

1. **Fast refusal / never-listen.** Ordering alone is insufficient. A sample proves only that `lsof` ran; it does not prove the child was alive. The already-exited test 34 PASS and the unpersisted `spawnCalled:false` mean the five-point proof is not available as retained runtime evidence. No synthetic sample, delay, retry, or sampled-absence relabeling is acceptable; the proof must bind samples to the child's live interval.
2. **Private binding.** Absolute path strings are not a validated private stage. Coordinator Node selection and wrapper Python remain PATH-resolved; HOME/TMPDIR/PATH remain ambient; Next/cwd are the original nonprivate harness; staging and symlink checks are unperformed. Missing/invalid binding must fail before any live child creation.
3. **Owned cleanup.** All five callers now pass parent/name/handle and check results, so the call-site omission is fixed. Parent/name substring is not an immutable start identity; wait status is ignored; sites 3/4 have no caller test; the observer pre-bind handler can no-op; there is no SIGKILL escalation. No historical wrong signal is claimed.
4. **Schema/durability.** Falsey-error/default/sample-count strictness is materially improved. Exit-code bool/float acceptance and optional identity remain. Directory fsync failure is swallowed and untested; a successful rename therefore cannot be presented as durable.
5. **Guard integrity/load order.** Static import at L20 precedes hash verification, and `guardPath` can differ from the imported target. The supported fixed CLI narrows, but does not eliminate, the gap; a module/hash failure is not a canonical refusal PASS.
6. **Selfcheck safety/reach.** The `os.kill` guard is installed before coordinator import in the normal route, and direct tests inject fake signals — that improvement is real. Abort tests retain real Popen defaults; clock/sleep is real; the wrapper test uses a copied wrapper beside an inert stub with ambient env; sites 3/4, the real CLI adapter, and exception branches remain uncovered. 46/13 pass counts do not prove runtime acceptance.
7. **Evidence/counts.** All 18 direct pins, 22 R4 payloads, 20 R3 payloads, raw/export file sets, and seven diff reconstructions match. The 46/46 and 13/13 results are corroborated from retained JSON/stdout but not replayed; the 25-variant plan includes `NODE_ENV=production`; exact commands/exits/stderr and version-read provenance are missing; staging is candidate-only. The owner's blocked-row/T11c wording is corrected in §8 without changing IDs.

## 8. Preserved statuses, gates, and count correction

Nothing here reopens or re-adjudicates the 36/14/1 coverage rows, the raw-CLI result, or the historical evidence. The preserved state is:

- **Raw direct Next CLI:** `FAIL_OBSERVED_LISTENER` stands; raw CLI remains unsupported for never-listen.
- **FEVAL_F02:** 21 historical insufficient-evidence rows remain as recorded; no retroactive alteration.
- **Next termination/wait:** historical `NOT_OBSERVED`/unknown remains; this review did not exercise it.
- **T11c:** `OUTCOME_UNKNOWN` remains; it is a required case (POST X fixture while PG stopped), not the production-feasibility blocked row.
- **Partition:** **36 required / 14 product-deferred / one production-feasibility blocked** (D-14), total 51. The owner return's phrase “1 external-blocked case (T11c)” (L112) conflates the blocked row with T11c. Correct wording: the one blocked row remains separate, and T11c remains `OUTCOME_UNKNOWN` inside the required set. No IDs are changed.
- **PostgreSQL:** stopped/retained per separate Codex evidence; not inspected or operated here. Exact-PG teardown is not a prerequisite for this source review.
- **Open gates:** actual-secret scan, same-PG final teardown, dynamic/cache conformance, independent privacy/teardown acceptance, INT-CONF-01, full 36-case conformance, production/auth/security/Cloudflare/cost/recovery acceptance. These remain open and are not cleared by this report.
- **Program state:** MC-002 remains open; Architecture Approval Gate `NOT_PASSED`; Step03B `NOT_AUTHORIZED`; Mimosa not cleared; no production release.
- **Option A:** stands; not re-requested and not re-adjudicated.

## 9. Personally verified vs owner/Codex evidence

| Class | What it covers |
|---|---|
| **Personally verified by OpenCode** | Branch/HEAD; all 18 direct pins; all 22 R4 and 20 R3 payload bytes/hashes; raw/export 23-file set equality and 0 hash mismatches; seven diff reconstructions to byte-equal R4 source; source line citations in this report; 46/46 and 13/13 counts as recorded in retained JSON/stdout; 25-variant list including `NODE_ENV=production`; output-target absence. |
| **Owner evidence, not replayed** | The two suites' execution and PASS claims; Node native type-stripping test; wrapper execution; real Node/wrapper subprocess tests; version reads; raw-evidence creation and `diff -r` claim (I re-ran the file/hash comparison independently, but did not observe the original run). |
| **Internal Codex observations, independently re-derived** | R4-C01..C05 and S1..S6 were used as hypotheses, not verdicts. Each is confirmed above from source lines; none is accepted merely because Codex asserted it. |
| **Not verified / not verifiable here** | Any runtime process behavior; actual child liveness during a probe; real signal delivery; private staging; directory durability under injected failure; exact original command/exit/stderr; production behavior or cost. Reviewer runtime remains `NOT_RUN`. |

## 10. Checks run, checks skipped, and remaining risk

**Run (all read-only or temporary-copy text processing):**

- Two workspace identity checks (`git rev-parse`/`status`), before and after writing.
- Full pin pass: 18 direct + 22 R4 + 20 R3, bytes and SHA-256, before and after writing; 0 mismatches each pass.
- Raw/export file-count, `diff -r`, and path-normalized SHA-256 comparison: 23/23 files, clean.
- Seven `patch -o` reconstructions from R3 baseline to R4 target: 7/7 byte-equal.
- JSON structure/count reads: 46 records, 46 PASS; 25 plan tuples; observer/evaluator schema fields.
- Static line reads of coordinator, evaluator, observer, launcher, wrapper, selfcheck, proposals, owner return, intake, addendum, and manifest.
- Output-target absence check before writing; output-existence/bytes check after writing.
- Final output SHA-256/bytes computed for the human completion message.

**Skipped (deliberately):**

- No execution or import of any reviewed shell/Python/JS; no selfcheck, evaluator, launcher, wrapper, Node, Next, observer, probe, `ps`, `lsof`, signal (including 0), HTTP, SQL, Docker, build, dependency install/copy, credential/private-env read, provider call, or external agent.
- No live runtime, staging, symlink check, PG operation, or teardown.
- No source/index/history/status/contract edit, staging, commit, merge, push, or cross-agent message.
- No re-adjudication of unchanged 36/14/1 rows.

**Remaining risk:** if the packet were released as-is, the fast-refusal gate could accept a post-exit sample and a spawn-then-exit launcher defect; executable/environment binding could run a different Node/Python or an unisolated dependency tree; cleanup could leave a process alive without SIGKILL; a directory fsync failure could be reported as durable; and the retained packet cannot prove the exact argv/exit/stderr behind the owner's PASS counts. These are source/test risks, not claims that a runtime failure already occurred.

## Appendix A — key source pins

| Path | Bytes | SHA-256 |
|---|---:|---|
| `runner/coordinator.py` | 25,452 | `e77ff416beb12638119a23517f6d1bede567059a8ba0d967346161625b8f8caa` |
| `runner/guard_evaluator.py` | 9,767 | `e6a54a786834ed69de78a7c30f2e5caed01721338600b224d9168c90c1de72f1` |
| `runner/observer.py` | 6,283 | `b5cef31ee33722ab585a393120a0a0cbe0517b2285e6b230205cf967da996c2c` |
| `runner/guard-validator-r4.sh` | 1,610 | `e1c579ce75a5f4d06cf8418f6176141967f242d68eb51205d3ef40429bb2f404` |
| `runner/selfcheck-r4.py` | 50,787 | `5d1811f3f077f7a9f43ea5f4a47b72453e39f94e991feed996fe7452f4a266c5` |
| `launcher/harness-dev.mjs` | 7,610 | `6d89694a2115aa28ce63f5e797de3e152f5033aaa50c30697fe9edaad5164e02` |
| `proposals/fast-refusal-proof-basis-r4.md` | 4,195 | `cb05e856f7f8872919c520ed1d9214d91fbb9257a747a89f22e9b15a97661f7d` |
| `proposals/implementation-binding-record-r4.md` | 5,883 | `62033f98acdf11fe33e360722e7d46f5b9567ae4c9989b72fc49712cc64dfee0` |
| `proposals/dependency-isolation-plan-r4.md` | 4,947 | `ded266aef3243f3b4b1e76803a43b4a1c51ac5f7ca6978388f6179c66ac19a95` |
| `/tmp/mc002-inta-harness/src/guards.ts` | 3,128 | `0f5f245316450d76d47f79a1b668a777ef9e1134008cbbc1c566808c654ef928` |

The full 22-payload manifest pin is `b594d5e348d90ef9b163769cceadec5fe451f5d3c82201b9028cff0821fa8f64` (3,997 bytes); the R3 manifest is `2709add9c0c1fd138968cb3c6ee7873a7eae9e0736bb8bb7f8c18d6703105d28` (3,662 bytes). The 18 direct pins and per-payload arrays are in `review-inputs.json`.

## Appendix B — deliverables

- This report: `docs/reviews/inta-opencode-fe-r4-source-review.md`.
- Input pins/verification: `docs/testing/inta-returns/qa/fe-validation-r4-source-review-20261026/review-inputs.json`.
- Checks/timestamps: `docs/testing/inta-returns/qa/fe-validation-r4-source-review-20261026/checks-log.json`.

All three output hashes/bytes are reported in the human completion message. This review stops after delivery; it does not schedule a repair round, runtime cue, or provider call.
