# INT-A FE Validation R5 — ZCode independent source review (with actual blocked-stage evidence)

**Task**: `MC-002-INTA-FE-VALIDATION-R5-SOURCE-REVIEW-ZCODE` (parent `MC-002-INTA-FE-VALIDATION-R5-SOURCE-REVIEW`)
**Status**: `IN_REVIEW → CHANGES_REQUIRED_SOURCE_ONLY / PROOF_BASIS_BLOCKED / CODEX_STAGE_BLOCKED / RUNTIME_NOT_RELEASED`
**Priority**: P0 · Mode `READ_HASH_STATIC_ONLY`; reviewer runtime `NOT_RUN`
**Reviewer**: Actual ZCode, independent nonauthor of the reviewed R4/R5 corrections. ZCode Desktop app 3.16.3 (darwin 27.0.0 arm64), interactive session, model self-reported `account:zai-start-plan/GLM-5.3-Flash` via Z.AI. Review window UTC 2026-10-26T16:35Z–16:55Z.
**Base/HEAD**: `a62d838791ba188838c4ff00b7b6e265ac775056`, branch `codex/unified-project-flow` (unchanged before and after).
**Authority**: Direct PO quota-based reassignment on 2026-10-26 ("opencode đang hết quota. chuyển qua cho zcode review"); recorded in `assignment.json`. OpenCode quota was human-reported; I did not probe or retry OpenCode and changed no provider/model/account.

## 0. Independence declaration

I did not author, edit, or execute any reviewed R4/R5 runner, launcher, observer, evaluator, wrapper, selfcheck, test, or binding/proof proposal. Both manifests record the executor as **Actual Antigravity (Gemini 3.8 Flash High)** for all 22 R4 and 22 R5 payloads, and nothing in the payloads indicates other authorship. Disclosed overlap, none of which is authorship of the reviewed changes: (1) ZCode performed a prior-round independent source review of this harness lineage (historical `PASS_WITH_LIMITATIONS` with its own finding set); (2) ZCode executed the earlier FE driver-stage runtime rounds as runtime owner. Prior backend work by ZCode is out of scope here and is not certified by this report. No NEEDS_OTHER_REVIEWER scope arises: no reviewed R4/R5 change has ZCode contribution. Scope is bounded to this R5 source review plus the actual blocked staging preflight; Mimosa/BE01/BE02, architecture/product gates, and FE implementation are excluded.

## 1. Verdict

**CHANGES_REQUIRED_SOURCE_ONLY.** The R5 packet is internally consistent and many R4 corrections are real, but all four P1 intake observations (R5-I01..I04) are **CONFIRMED at exact lines**, so no source PASS can be awarded. Separately, the approved criterion's lifecycle-continuity claim is **PROOF_BASIS_BLOCKED**: the implemented semantics are point-in-time sampled absence, not a continuous live-interval proof, and I will not invent an interval, delay, or retry to close it. The staging contract is **not binding**: the shipped CLI cannot consume a verified private stage, so Codex's actual `BLOCKED_CONTRACT_NOT_BINDING` preflight stands and no READY_RUNTIME, VERIFIED receipt, or combined readiness PASS is issuable.

What is real and accepted as source-level improvement (none of it self-awarded closure): strict `int` exit codes and mandatory identity in the evaluator (`guard_evaluator.py:148-155,213-220,246-262`); removal of the fabricated pre-flight `during_sample_count=1` (`coordinator.py:362-376`); dead-child fail-closed with tests 34/36; `spawnCalled:false` persisted in a launcher record (`harness-dev.mjs:93-124,298-307`); guard byte-hash verification before dynamic import (`harness-dev.mjs:47-60,227-288`); observer directory fsync propagation (`observer.py:62-68`); private `HOME`/`TMPDIR` and bounded child/observer environments (`coordinator.py:281-293,405-413,445-457`); raising-Popen fakes on abort paths, wrapper env/args/nonzero tests, caller sites 3/4 tests; no SIGKILL anywhere (SIGTERM-only, `coordinator.py:199`).

## 2. Packet and provenance integrity (all independently verified)

| Check | Result |
|---|---|
| Workspace branch/HEAD | `codex/unified-project-flow` / `a62d838…` before and after; matches assignment. |
| Direct pins (inputs.json) | **18/18 MATCH**, 158,849 bytes total (AGENTS.md 9171 B `14b4831a…` current pin included). |
| R5 payloads | **22/22 MATCH** (bytes+SHA-256 vs `validation-r5-20261026/manifest.json`); total **332,773 bytes exactly as declared** (per-file sum recomputed). |
| R4 frozen payloads | **22/22 MATCH** vs R4 manifest (285,768 B declared set, hashes verified). |
| Raw/export equality | **23/23 PAIR_OK** — every `/tmp/mc002-inta-evidence/frontend/validation-r5-20261026/` file (22 payloads + manifest) hash-equal to its export. |
| Undeclared files | None: export-R5 tree = exactly 23 files; export-R4 tree = exactly 23; raw root = exactly the 23 `allowed_raw_files`. |
| Seven R4→R5 diffs | **7/7 EXACT** — each submitted diff's added/removed line set equals my own computed `diff -u` line set between the pinned R4 and R5 files (endpoints hash-pinned). |
| Guard pin | `EXPECTED_GUARD_SHA256` `0f5f2453…` in `harness-dev.mjs:23` and `guard_evaluator.py:17` matches the immutable guard pin receipt (`stage-preflight.json`: `/tmp/mc002-inta-harness/src/guards.ts`, 3128 B, `0f5f2453…`); corroborated by `launcher-mock.stdout.txt:37` ("got 0f5f2453…"). Per inputs.json I used the receipt; the live guard file was not read or executed. |
| Input refresh | Old R5 author packet expected AGENTS 8886 B vs current 9171 B — recorded and dispositioned in `input-pin-disposition.json` (11/12 others matched; known PO backend-routing + F1 wording provenance). Current review pins match current files; no `NEEDS_INPUT_REFRESH`. |
| Owner suites (not replayed) | `selfcheck-r5-results.json`: 46 records, 46 pass, 0 fail, `allPassed:true`; `selfcheck-r5.stdout.txt` `46 PASS / 0 FAIL`; `launcher-mock.stdout.txt` `17 PASS / 0 FAIL`; `r5-test-summary.json` records exact argv, cwd, numeric exit codes, and Node/Python version+hash transcripts. Corroborated from retained artifacts only; **not executed by me**. |

Provenance caveat (my finding R5-Z01 below): the Antigravity return's own §4 inline payload inventory carries stale SHA-256 values for 14 of 22 payloads. The authoritative chain (manifest + raw/export pairs + Codex intake) is intact; the return's inline hash column is not hash-reliable.

## 3. R5-I01..I06 — independent confirm/rebut at exact lines

### R5-I01 — Real CLI stage gate disabled; receipt does not bind dispatch — **CONFIRMED (P1)**

- `coordinator.py:240` and `:710`: `stage_receipt_required: bool = False` defaults; `:783` `main()` calls `run_plan(PLAN_VARIANTS_25, attempt_dir, harness_dir, port, observer_port)` with **no** `stage_dir` and **no** stage flag — the shipped CLI path never enables the gate. `main()` also defaults `harness_dir` to the original shared `/tmp/mc002-inta-harness` (`:779`).
- `coordinator.py:296-323` `validate_preflight_stage`: when opted in, it only checks the receipt file exists and `receipt.get("stageStatus") != "VERIFIED"` (`:309`) — a status string only; no receipt hash/signature, no binary/source hash, no realpath/nested-link inventory, no binding of receipt fields to actual dispatch paths. Launcher and Node checks are existence-only (`:315-320`), no expected binary hash.
- The binding failure routes as `probe_error` (`coordinator.py:330-344`), so the evaluator's first gate maps it to verdictCode **`PROBE_ERROR`** (`guard_evaluator.py:65-68`), not a typed `BINDING_ERROR` verdict at the coordinator layer; the typed `BINDING_ERROR` verdict exists only via the launcher record (`guard_evaluator.py:132-135`). The `[BINDING_ERROR/NOT_READY]` text is in the message string, not the verdict code.
- `harness-dev.mjs:24-26` defaults are the original shared harness paths and `:432-440` (the real CLI block) hard-codes `DEFAULT_GUARD_PATH` / `DEFAULT_NEXT_BIN` / `DEFAULT_HARNESS_CWD` — a stage receipt cannot redirect launcher dispatch.
- `guard-validator-r5.sh:17-21`: pinned framework Python first, but a conditional PATH fallback (`command -v python3`) remains when the pinned path is absent — a strictness gap, conditional in practice.
- Consequence confirmed: creating an honest private copy/receipt cannot fix or validate the actual execution path. Codex's `stage-preflight.json` blockers are corroborated from source; **CODEX_STAGE_BLOCKED stands**. The two proposal documents' divergent receipt schemas (R5-Z03) reinforce that the contract is unbound.

### R5-I02 — Poll-before-probe does not prove the full probe interval live — **CONFIRMED (P1); PROOF_BASIS_BLOCKED for the continuity claim**

- `coordinator.py:505-514`: the loop now polls first and breaks on exit before probing, so an already-dead child yields **0 samples** — the R4-C01 dead-child class is genuinely closed (tests 34 and 36 fail closed as `LISTENER_UNKNOWN`).
- But `:513-514` probe and unconditional `during_sample_count += 1` follow the poll: a child that exits **during** the probe is still counted. No per-sample timestamps, alive predicate, or `[start, exit]` interval is recorded anywhere, so the evaluator cannot reject out-of-interval samples — there is nothing to reject with.
- Test 35 (`selfcheck-r5.py:582-613`) is explicit: `poll_sequence=[None, 1]` — one sample taken at a single alive instant, then the child exits, and the run **PASSES** `VALID_COMPLETE_INPUT`. The accepted semantics are point-in-time sampling, not a verified live interval. The proposal's own diagram ("sample verified within live window", `fast-refusal-proof-basis-r5.md:40-41`) is not implemented by the code.
- Never-listen therefore remains **sampled absence** at N instants plus one post-probe; between samples nothing is observed. Per assignment I state **PROOF_BASIS_BLOCKED** for any continuous never-listen / lifecycle-complete claim rather than inventing an interval, delay, or retry. The fail-closed direction (zero samples → `LISTENER_UNKNOWN`, `guard_evaluator.py:94-100`) is real and retained.

### R5-I03 — Launcher record not correlated to the attempt or durable — **CONFIRMED (P1)**

- `harness-dev.mjs:93-111`: the record has launcher path+SHA, guard path+SHA, node path+version, pid/ppid/argv/cwd — but a **single** `timestampUTC` (no start/exit pair), **no Next binary hash** (nodePath recorded but unhashed), and **no variant/attempt/run field**, so the record cannot be correlated to the specific run or variant at all.
- `:113-123`: `writeFileSync` + `renameSync` is an atomic rename but there is **no file fsync and no directory fsync** — not durable; and the whole writer is wrapped in `try/catch` that logs to stderr and returns `null`, so record-write failure never fails the run.
- `guard_evaluator.py:126-144`: record checks run only `if launcher_execution_data is not None` — absence with no error skips all checks; there is no expected-outcome check, and no run/variant/PID/PPID/argv/cwd/time correlation. Test 35 supplies a four-field record (`selfcheck-r5.py:604-610`) and passes.
- The return's §1 claim "capturing exact binary hashes, start/exit UTC" **exceeds the implementation** — same class as the R4 binding-record overstatement. A stale or foreign minimal record in the same state dir would satisfy the checks.

### R5-I04 — Signal identity weakens if start-time lookup fails — **CONFIRMED (P1)**

- `coordinator.py:90-109` `get_process_start_time` returns `None` on any query error; `:155` then **skips** the `lstart` comparison (`expected_start_time is not None` guard). In the runner the start time is captured once (`:428`, `:483`); a failed capture silently degrades identity to name-substring + PPID.
- `:151` executable identity remains `expected_name not in comm` substring matching on the comm basename; `:65`, `:99`, `:135` invoke bare `lsof`/`ps` resolved through the coordinator's ambient PATH.
- Five cleanup callers confirmed at `:520` (site 1), `:546` (site 2), `:575` (site 3), `:598` (site 4), `:615` (site 5); **no SIGKILL anywhere** (SIGTERM-only `:199`; test 27 asserts the no-SIGKILL property). The docstring says "retained without retry", but a site-3 failure (still alive) leads to site 4 firing `bounded_terminate` **again** on the same child — a repeated SIGTERM across sites ("may enter later signal sites after a failed wait" — confirmed). Handle reap result is still unclassified (`:206` returns `(True, None)` regardless of exit status).
- Default process reach in tests: every coordinator scenario (34–40, 44) injects `popen_factory` and `subprocess_runner` mocks; no coordinator test reaches the real `subprocess.Popen` default; tests 41–43 exercise the copied real wrapper against an inert stub coordinator. No suite path can signal a real process (`os.kill` fail-fast guard installed before coordinator import, `selfcheck-r5.py:36-48`). On this retained evidence the suite's process safety holds; the cleanup semantics themselves remain runtime-untested by design.

### R5-I05 — Guard bytes checked before import; imported bytes still path-based — **CONFIRMED (P2), improvement + conditional risk**

- The static guard import is gone (`harness-dev.mjs:14-20` imports only Node builtins), and `verifyGuardIntegrity` (`:47-60`) hashes raw bytes before `launchHarness` proceeds (`:227-252`).
- The subsequent dynamic import (`:258-259`) re-reads the same mutable path; under concurrent mutation the checked bytes and imported bytes can diverge, and Node's ESM module cache can serve an earlier module for the same URL within a process. The shipped CLI has no private frozen-source or realpath identity binding (guard path is the original shared `/tmp/mc002-inta-harness/src/guards.ts`). Not a reproduced exploit — a conditional mutation/cache risk exactly as the intake classified it.

### R5-I06 — Owner test/provenance claims exceed retained coverage — **CONFIRMED (P2), with refinements**

- **CLI main stage requirement**: test 44 (`selfcheck-r5.py:819-831`) opts in directly via the constructor; the real `main()` default (stage gate off, I01) is untested — and is the defect itself.
- **Raising fakes (S1)**: tests 37/38/44 inject `raising_unexpected_popen` — real improvement.
- **Injected time/clock (S2)**: `FakeClock` is used only by test 39; tests 34-36/40 use the real clock (bounded impact; noted, not blocking).
- **Wrapper (S3)**: tests 41-43 pass `env=wrapper_env` explicitly (with `MC_INTA_PYTHON_BIN=sys.executable`), assert all 4 positional arguments and nonzero exit-2 propagation — real; the wrapper's own PATH-fallback branch (`guard-validator-r5.sh:18-21`) is untested.
- **Launcher CLI adapter vs isCliEntry helper (S5)**: only the `isCliEntry` helper is unit-tested (`test-launcher-mock.mjs:293-308`); no test executes the real CLI block (`harness-dev.mjs:432-449`). The return's "CLI adapter execution" claim is overstated.
- **Schema mutation**: evaluator negative cases 14-18 are genuine; launcher-record negative coverage is thin (the four-field record of test 35 passing is itself the I03 issue).
- **Expected vs actual rewriting**: tests 19-23 and 39-46 record a **test-computed** `verdictCode` (e.g., `:368`, `:704`, `:738`, `:831`) rather than the raw code output, so `actualCode` in `selfcheck-r5-results.json` is assertion-derived, not the system's verdict, for 13 of 46 cases. Assertion content is real; the retained code field is not.
- **fsync isolation (S6)**: tests 28/29/31/32 genuinely isolate file-fsync, dir-open, dir-close, replace. **Test 30 does not isolate dir-fsync**: its global `os.fsync` mock (`:470-474`) raises with the same message at the *file* fsync (`observer.py:59`) before the directory fsync (`:66`) is reached, so test 30 would pass even without the dir-fsync block (my finding R5-Z02). Tests 29/31 do reach the directory block, and the source fix itself is real.
- **Bare node / substring**: tests 45/46 invoke bare `node` from PATH (not the pinned absolute binary), and test 46 asserts the summary substring `"17 PASS / 0 FAIL"` rather than parsing structured records (`selfcheck-r5.py:834-861`). Test 45 additionally executes the real guard module import — owner-suite evidence only.
- **Per-command stderr/time**: no per-case stderr or per-suite start/end receipts in `selfcheck-r5-results.json`; captured stderr of tests 45/46 is discarded. Suite-level argv/cwd/exit/version transcripts do exist in `r5-test-summary.json` (improvement over R4).
- **46/46 and 17/17** remain retained owner results, corroborated from JSON/stdout; they are not executable readiness, not finding closures by themselves, and not staging proof.

## 4. R4 finding dispositions after R5 (targeted re-review)

| R4 ID | Disposition after R5 | Basis |
|---|---|---|
| **R4-C01 / NF-4 / R2-I04** | **CLOSED_SOURCE_ONLY for the confirmed defect classes; NF-4 continuity claim PROOF_BASIS_BLOCKED** | Dead-child sampling closed (poll-first, tests 34/36), `spawnCalled` persisted, pre-flight fabricated sample removed (`coordinator.py:362-376`). The full "lifecycle-bound proof" is not established: no interval binding, exit-during-probe still counted (R5-I02). |
| **R4-C02 / NF-1 / R3-N02** | **PARTIAL** | Real: absolute pinned Node/Python defaults, private `HOME`/`TMPDIR`, bounded 11-key envs, pre-spawn existence checks, stage scaffolding. Open: no binary hashes checked, stage gate default-off and never enabled by CLI, launcher defaults to original harness, wrapper conditional fallback, no symlink/nested-link validation (R5-I01). |
| **R4-C03** | **PARTIAL** | Guard load order fixed (hash before dynamic import, no static import). Identity improved (lstart) but silently degradable to name-substring+PPID on lookup failure (R5-I04). |
| **R4-C04** | **CLOSED_SOURCE_ONLY** (with R5-Z02 test-quality residual) | `observer.py:54-68` propagates file fsync, replace, dir open/fsync/close failures; no `except: pass` on the durability path. |
| **R4-C05** | **PARTIAL** | Schema/identity closed (strict int `:148/:213`, mandatory identity `:246-262`). Provenance improved at suite level (argv/cwd/exit/version transcripts in `r5-test-summary.json`) but per-case stderr/numeric per-case exits absent; tested root (`/tmp/mc002-inta-fe-validation-r5-20261026`, stdout `:75`) still differs from the raw evidence root — NF-5 residual. |
| **S1** | **CLOSED** | Raising fake on abort tests 37/38/44. |
| **S2** | **PARTIAL** | FakeClock only in test 39. |
| **S3** | **CLOSED** | Explicit env, all 4 args, nonzero propagation (tests 41-43); wrapper fallback branch untested (minor). |
| **S4** | **CLOSED** | Sites 3/4 covered by tests 39/40. |
| **S5** | **PARTIAL** | Sync spawn throw, signal exception, record persistence covered (tests 14/15/17); **real CLI adapter block still untested** — return claim overstated. |
| **S6** | **PARTIAL** | Genuine isolation for 4 of 5 failure modes; dir-fsync test not isolating (R5-Z02). |
| **NF-2** | stays CLOSED | 25 tuples incl. `NODE_ENV=production` (`coordinator.py:28-54`). |
| **NF-3** | **CLOSED_SOURCE_ONLY** with R5-I05 conditional residual | Hash-before-import verified; failure is `BINDING_ERROR`, not canonical refusal PASS (`guard_evaluator.py:132-135`; tests 11/16). |
| **NF-5** | **PARTIAL** | Stage reserved but unconsumable (R5-I01); tested-path/evidence-root divergence remains. |
| **NF-6** | stays CLOSED | Evaluator wording `:78-84`; test 19. |

## 5. Reviewer-added findings

- **R5-Z01 (P3, provenance document)**: The Antigravity return §4 inline payload inventory lists SHA-256 values that do not match the returned payloads for entries 9–22 (`launcher-mock.stdout.txt` … `selfcheck-r5.stdout.txt`, 14 files) while byte counts all match and entries 1–9 match; the manifest self-hash and total-byte claims match. The authoritative chain I verified (manifest pins + 23 raw/export pairs + Codex intake) is intact. Required: author errata/correction via Codex coordination; not a code defect and not grounds to reject the payload set.
- **R5-Z02 (P3, test quality)**: Test 30 (`selfcheck-r5.py:470-482`) cannot distinguish dir-fsync propagation: the global `os.fsync` mock fails the file-level fsync first (`observer.py:59`) with the same message. Fix the test to fail only the directory fd (or let the file fsync succeed) in the next bounded pass.
- **R5-Z03 (P3, contract)**: The two proposals specify **different stage-receipt schemas**: `implementation-binding-record-r5.md` §5.3 (`stageStatus`, `stageTimestampUTC`, `harnessCwd`, `nextBin`, `symlinkEscapeCount`) vs `dependency-isolation-plan-r5.md` §2.4 (`stageRoot`, `stageStatus`, `timestampUTC`, `nextBin`, `symlinksAudited`, `symlinkEscapes`); the coordinator validates only `stageStatus == "VERIFIED"` (`coordinator.py:309`), so any schema passes and the contract is unbound. Confirms Codex intake; must be reconciled in the one precise binding correction.
- **R5-Z04 (P4, minor)**: `guard-validator-r5.sh:23-25` defaults the attempt directory into the raw evidence root (`/tmp/mc002-inta-evidence/frontend/validation-r5-20261026/run_<ts>`) when invoked without arguments; governed usage must always pass an explicit attempt dir to avoid polluting the pinned evidence tree.

## 6. Actual stage disposition

**BLOCKED_CONTRACT_NOT_BINDING — independently confirmed from source, and consistent with Codex's actual preflight receipt.** The coordinator's CLI never enables the stage gate and cannot bind a receipt; the launcher CLI hard-codes the original shared harness/Next/cwd; the receipt schema is unbound (R5-Z03); the original `node_modules` is an external symlink (per `stage-preflight.json` receipt: realpath `/private/tmp/mc002-inta-fe/node_modules`); the reserved stage did not exist at check time. No stage was created, copied, or receipted, and I performed no staging, copy, or link operation.

Exact unresolved prerequisites before any runtime cue (all under existing ownership gates):
1. One precise source/binding correction under **Antigravity ownership**: enable and bind the stage path in the real CLI (coordinator `main` and launcher CLI block), typed `BINDING_ERROR` verdict routing, reconciled receipt schema with hash/realpath/nested-link binding and expected binary hashes, launcher consuming staged values, wrapper fallback removal or explicit authorization.
2. A decision on the R5-I02 proof basis: either implement retained interval/alive-predicate binding or obtain PO acceptance of point-in-time sampling as the criterion — no invented delay/retry.
3. I03 record durability (fsync, failure propagation) and attempt correlation; I04 strict non-null start identity, pinned helpers, once-only cleanup disposition.
4. Then actual Codex CoW staging, stage verification, and a later combined readiness review. None of these is authorized by this task.

## 7. Preserved statuses and gates

All **51 formal results unchanged**: **36 required** (including `T11c` = `OUTCOME_UNKNOWN`, distinct from the blocked row), **14 product-deferred**, **1 production-feasibility blocked** (`D-14`). Raw direct Next CLI `FAIL_OBSERVED_LISTENER` stands. PostgreSQL stopped/retained per separate Codex evidence; not touched. No INT-CONF-01, no 36-case acceptance, no MC-002 DONE, no Step03B, no auth/isolation/production/Cloudflare/$0/recovery clearance, no Mimosa clearance. `credential-pattern-scan-r5.json` is pattern-only (24 files, 0 matches, `actualSecretScanEstablished: false` — honest); actual-secret matching for R5/new evidence remains pending elsewhere. Nothing here re-adjudicates historical rounds or accepts author claims as closures.

## 8. Personally verified vs owner/Codex evidence

- **Personally verified (read/hash/static)**: HEAD/branch before+after; all 18 direct pins; 22 R5 + 22 R4 payload hashes and byte counts; 23 raw/export pairs; file-tree completeness; 7 diff line-set reconstructions; every source citation in §3-§5 read at the pinned files; guard pin via receipt + in-payload constants; owner-suite counts corroborated from retained JSON/stdout.
- **Owner evidence, not replayed**: the two suites' execution, the real guard import (test 45), wrapper subprocess tests, version reads (also independently consistent with `stage-preflight.json` binary hashes).
- **Codex evidence used as receipt**: guard file hash, binary hashes/realpaths, node_modules symlink observation, stage absence, 59-ledger and 3-source-checkout integrity — used per inputs.json ("reviewer uses receipt"); no raw-root traversal beyond the 23 allowed files and no new source/ledger audit.

## 9. Checks run, skipped, remaining risk

**Run (all read-only/static)**: `git rev-parse` before+after; full pin passes (18 direct, 44 payload hashes, byte totals); 23 raw/export pair comparisons; tree listings; own `diff -u` line-set comparisons for the 7 diffs; JSON count parses; line-level static reads of coordinator, evaluator, observer, launcher, wrapper, selfcheck, mock suite, proposals, return, intake, preflight, manifests, contracts, approval, disposition; output-absence checks before writing.

**Skipped deliberately**: no execution/import of any submitted shell/Python/JS (no runner, launcher, observer, evaluator, wrapper, selfcheck, reference, or scanner); no tests/build/install/copy/download; no sockets/HTTP/port/process probes or signals (including 0); no PG/Docker/lifecycle/credential access; no OpenCode retry or provider change; no Git stage/commit; no canonical/source fixes; no repeat of the 36-row audit, product build, 7 stages, backend tests, BE02, or old full reviews; no external messaging; no memory/global-settings/shared-status writes.

**Remaining risk**: the never-listen gate still means sampled absence until the criterion decision; launcher records remain uncorrelated and non-durable; identity degrades silently on lookup failure; the staging contract stays unbinding until the precise correction; the return's inline hash inventory (Z01) must not be used as a pin source; and this review certifies source and retained evidence only — no runtime behavior was observed. Codex intakes the human-forwarded return; repairs are not assigned by this report.
