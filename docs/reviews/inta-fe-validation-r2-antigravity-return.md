# INT-A — Frontend Validation R2 Return (C01..C04 Corrections)

**Task ID**: MC-002-INTA-FE-VALIDATION-R2  
**Executor / Identity**: Actual Antigravity (Gemini 3.8 Flash High), Google provider, macOS workstation (darwin arm64)  
**Coordination Branch**: `codex/unified-project-flow`  
**Base Revision**: `a62d838791ba188838c4ff00b7b6e265ac775056`  
**Status**: `SOURCE_CORRECTIONS_RETURNED / IN_REVIEW / RUNTIME_NOT_RELEASED`  
**Independent Reviewer**: Actual OpenCode (non-author review after return; no author self-approval)  
**Requirements Traced**: NFR-002, INT-ENV-05, INT-ENV-07, INT-ISO-01, INT-ISO-02, INT-ISO-03, INT-PRIV-01  

---

## 1. Identity, Authority and Scope Boundaries

Following the Product Owner's delivery of `MC-002-INTA-FE-VALIDATION-R2-ANTIGRAVITY-PROMPT.md` and the independent review findings from OpenCode (`docs/reviews/inta-opencode-closeout-review-r1.md`), Antigravity performed **bounded source, self-check, and evidence corrections only**:
- **NO live Next dev server was executed.**
- **NO live observer was bound on loopback port 18086.**
- **NO product build or test collection was rerun.**
- **NO dependency install, clone, copy, or download was executed.**
- **NO 59-file ledger, historical 7 stages, or PostgreSQL state was modified.**
- **NO Git commit, stash, reset, merge, or push was performed.**
- **ALL 4 new R2 output paths were verified absent before creation.**

### Exact Tool Versions
- **Platform**: macOS (darwin arm64, Apple Silicon)
- **Node.js**: `v24.22.1`
- **Python**: `3.9.6`
- **Shell**: `zsh / bash 3.2.57(1)-release`

---

## 2. Mapping of OpenCode Independent Findings (R1-C01..C04) to Exact Fixes

| Finding ID | Severity | Core Root Cause in R1 | Action Taken in R2 | Changed / New Files |
|---|---|---|---|---|
| **R1-C01** | P1 (Runner coordinator & marshaling) | (1) `import os` missing in metadata writer; childParentPid was metadata writer's own PID.<br>(2) Bash booleans `false`/`true` interpolated bare into python code strings causing `NameError`.<br>(3) Shell status negated via `if ! lsof_out=$(lsof ...)` inverting probe exit status.<br>(4) Pre-probe error not fed into result path; failure inside `if !` suspended `set -e`. | (1) Replaced fragile inline bash python snippets with dedicated coordinator module [`coordinator.py`](file:///tmp/mc002-inta-fe-validation-r2-20261026/runner/coordinator.py).<br>(2) All data passed as typed parameters (no string interpolation of booleans).<br>(3) Captured real `lsof` exit status without negation, distinguishing rc=1 clean no-match from rc=1 error stderr.<br>(4) Pre-probe errors abort execution immediately with `PROBE_ERROR`.<br>(5) Verified parent PID recorded from actual spawning process. | [`runner/coordinator.py`](file:///tmp/mc002-inta-fe-validation-r2-20261026/runner/coordinator.py)<br>[`runner/guard-validator-r2.sh`](file:///tmp/mc002-inta-fe-validation-r2-20261026/runner/guard-validator-r2.sh)<br>[`diffs/guard-validator.diff`](file:///tmp/mc002-inta-fe-validation-r2-20261026/diffs/guard-validator.diff) |
| **R1-C02** | P1 (Strict evidence schema) | (1) `listener_during`/`listener_after` evaluated only for `is True`, allowing `None` (unknown) to reach `PASS`.<br>(2) `isinstance(requestCount, int)` accepted `bool` (since `bool` is an int subclass in Python), so `requestCount=False` passed.<br>(3) `bool(cleanShutdown)` accepted non-empty string `"false"` as truthy.<br>(4) Empty string error accepted as no-error.<br>(5) 3 recorded regression vectors in `additional-failclosed-probes.json` reproduced as unsafe PASS. | (1) Strict enforcement: `listener_during is False` AND `listener_after is False` strictly required; `None` or non-boolean yields `LISTENER_UNKNOWN`.<br>(2) Strict integer check: `isinstance(req_count, int) and not isinstance(req_count, bool)` and non-negative.<br>(3) Clean shutdown strictly requires `cleanShutdown is True` (no truthy coercion).<br>(4) All 3 regression probes added to the selfcheck suite and now correctly REJECT. | [`runner/guard_evaluator.py`](file:///tmp/mc002-inta-fe-validation-r2-20261026/runner/guard_evaluator.py)<br>[`diffs/guard_evaluator.diff`](file:///tmp/mc002-inta-fe-validation-r2-20261026/diffs/guard_evaluator.diff) |
| **R1-C03** | P2 (Observer persistence & lifecycle) | (1) Observer used direct write without tempfile, `fsync`, or `os.replace`; write errors were swallowed.<br>(2) Positive requests not durably sampled live.<br>(3) Unbounded wait for observer exit; no PID verification before signaling.<br>(4) Destructive `rm -rf` / truncation on rerun. | (1) Implemented `AtomicStateWriter` in [`observer.py`](file:///tmp/mc002-inta-fe-validation-r2-20261026/runner/observer.py) using tempfile + `fsync` + `os.replace` on every HTTP event.<br>(2) Live polling in coordinator detects positive request count and aborts child immediately.<br>(3) `verify_pid_identity` and `bounded_terminate` with bounded timeout.<br>(4) Per-attempt non-destructive directories (`run_YYYYMMDD_HHMMSS`). | [`runner/observer.py`](file:///tmp/mc002-inta-fe-validation-r2-20261026/runner/observer.py)<br>[`runner/coordinator.py`](file:///tmp/mc002-inta-fe-validation-r2-20261026/runner/coordinator.py) |
| **R1-C04** | P2 (Launcher proposal & dependency plan) | (1) Proposal cited non-existent `src/guards.js` instead of frozen `src/guards.ts`.<br>(2) Used broad `env: process.env` leaking host secrets.<br>(3) Missing spawn error/signal handling.<br>(4) Inaccurate provenance citation for direct CLI argv.<br>(5) Dependency plan verified only top-level realpath, missing nested symlinks under `.bin` and `.pnpm`. | (1) Pinned direct import from `src/guards.ts` (SHA-256 `0f5f2453...`) using Node 24 native `--experimental-strip-types`.<br>(2) Implemented strict allowlist bounded env (`buildBoundedEnvironment`).<br>(3) Prototype launcher [`harness-dev.mjs`](file:///tmp/mc002-inta-fe-validation-r2-20261026/launcher/harness-dev.mjs) verified with mock spawner suite (8/8 PASS including API_MODE & NODE_ENV).<br>(4) Corrected provenance: CLI argv from handoff line 38.<br>(5) Adopted Human PO's explicit approval of **INTA-LAUNCH-D01 Option A** ([`docs/implementation/inta-launch-contract-addendum.md`](file:///Users/nguyenvanlan/Documents/code/pet-projects/matter-control/docs/implementation/inta-launch-contract-addendum.md)).<br>(6) Updated dependency plan with recursive nested symlink traversal and escape checks. | [`launcher/harness-dev.mjs`](file:///tmp/mc002-inta-fe-validation-r2-20261026/launcher/harness-dev.mjs)<br>[`launcher/test-launcher-mock.mjs`](file:///tmp/mc002-inta-fe-validation-r2-20261026/launcher/test-launcher-mock.mjs)<br>[`proposals/pre-listen-launcher-proposal-r2.md`](file:///tmp/mc002-inta-fe-validation-r2-20261026/proposals/pre-listen-launcher-proposal-r2.md)<br>[`proposals/dependency-isolation-plan-r2.md`](file:///tmp/mc002-inta-fe-validation-r2-20261026/proposals/dependency-isolation-plan-r2.md) |

---

## 3. Comprehensive Deterministic In-Process Self-Check Results

**Suite Command**: `python3 /tmp/mc002-inta-fe-validation-r2-20261026/runner/selfcheck-r2.py`  
**Execution Timestamp**: `2026-10-26T07:27:32.953330+00:00` to `2026-10-26T07:27:33.162136+00:00`  
**Exit Status**: `0`  
**Summary**: **29 PASS / 0 FAIL out of 29 cases** (100% Deterministic Pass, zero network, zero live servers).

```text
================================================================
MC-002-INTA-FE-VALIDATION-R2: Comprehensive Deterministic Self-Check
================================================================
--- Group 1: Original 9 Baseline Cases ---
[PASS] 1. missingcounter: Observer file does not exist (FAIL, MISSING_COUNTER)
[PASS] 2. malformedcounter: Observer JSON malformed (FAIL, MALFORMED_COUNTER)
[PASS] 3. positivecounter: Observer recorded >0 HTTP requests (FAIL, POSITIVE_COUNTER)
[PASS] 4. observererror: Observer startup or runtime error (FAIL, OBSERVER_ERROR)
[PASS] 5. transientlistener: Port 18085 listener observed during run (FAIL, FAIL_AGAINST_NEVER_LISTEN)
[PASS] 6. probeerror: Port probe execution error (FAIL, PROBE_ERROR)
[PASS] 7. timeout: Child hung or timed out (FAIL, TIMEOUT)
[PASS] 8. wrongrefusal: Child exited without exact refusal phrase (FAIL, WRONG_REFUSAL)
[PASS] 9. validcompleteinput: Fully compliant refusal and zero upstream calls (PASS, VALID_COMPLETE_INPUT)

--- Group 2: OpenCode / Codex Regression Probes (R1-C02) ---
[PASS] 10. unknown_listener_observation: listener_during=None, after=None (FAIL, LISTENER_UNKNOWN)
[PASS] 11. boolean_counter_false: requestCount=False (bool subclass of int) (FAIL, MALFORMED_COUNTER)
[PASS] 12. truthy_unclean_string: cleanShutdown='false' (non-empty string) (FAIL, UNCLEAN_SHUTDOWN)

--- Group 3: Strict Evidence Schema Edge Cases ---
[PASS] 13. negative_counter: requestCount=-1 (negative count) (FAIL, MALFORMED_COUNTER)
[PASS] 14. string_counter: requestCount='0' (string) (FAIL, MALFORMED_COUNTER)
[PASS] 15. missing_cleanshutdown: cleanShutdown field omitted (FAIL, UNCLEAN_SHUTDOWN)
[PASS] 16. observer_identity_variant_mismatch: Observer recorded different variant (FAIL, OBSERVER_IDENTITY_MISMATCH)
[PASS] 17. observer_identity_pid_mismatch: Observer recorded different PID (FAIL, OBSERVER_IDENTITY_MISMATCH)

--- Group 4: Coordinator Marshaling & Probes (R1-C01) ---
[PASS] 18. probe_clean_no_match: rc=1 with empty stderr is False (no listener) (PASS, VALID_COMPLETE_INPUT)
[PASS] 19. probe_active_listener: rc=0 is True (active listener present) (PASS, VALID_COMPLETE_INPUT)
[PASS] 20. probe_error_stderr: rc=1 with error stderr is PROBE_ERROR (PASS, VALID_COMPLETE_INPUT)
[PASS] 21. pre_probe_abort_on_error: Pre-flight probe failure prevents execution (FAIL, PROBE_ERROR)
[PASS] 22. quote_and_newline_marshaling: Stderr with newlines, single and double quotes (PASS, VALID_COMPLETE_INPUT)

--- Group 5: Atomic Persistence & Lifecycle (R1-C03) ---
[PASS] 23. atomic_state_writer_durability: AtomicStateWriter temp+fsync+replace (PASS, VALID_COMPLETE_INPUT)
[PASS] 24. pid_ownership_verification: Verifies PID existence before signaling (PASS, VALID_COMPLETE_INPUT)

--- Group 6: Node 24 Type Stripping & Launcher (R1-C04) ---
[PASS] 25. ts_guard_import_via_strip_types: Node 24 native type stripping loads guards.ts (PASS, VALID_COMPLETE_INPUT)
[PASS] 26. launcher_mock_test_suite: harness-dev.mjs mock test suite (8/8 internal mock tests PASS)

--- Group 7: Approved Launch Scope Conditions (API_MODE & NODE_ENV) ---
[PASS] 27. api_mode_refusal_evaluator: API_MODE nonempty evaluated on supported path (PASS, VALID_COMPLETE_INPUT)
[PASS] 28. node_env_production_refusal_evaluator: NODE_ENV=production evaluated on supported path (PASS, VALID_COMPLETE_INPUT)
[PASS] 29. supported_launcher_api_mode_node_env_prelisten_proof: API_MODE and NODE_ENV refuse before spawn on supported path (PASS, VALID_COMPLETE_INPUT)

================================================================
SUMMARY: 29 PASS / 0 FAIL out of 29 cases
================================================================
```

Full structured results are preserved in [`runner-scripts/selfcheck-r2-results.json`](file:///Users/nguyenvanlan/Documents/code/pet-projects/matter-control/docs/testing/inta-returns/frontend/validation-r2-20261026/runner-scripts/selfcheck-r2-results.json).

---

## 4. Preservation of Historical Evidence

In accordance with prompt instructions to reference rather than unnecessarily duplicate the 98 KB historical variant packet:
1. **Historical Dispositions**:
   - Variant 1 (`API_TOKEN/nonempty`): `FAIL_OBSERVED_LISTENER` (or `FAIL_AGAINST_NEVER_LISTEN`) stands.
   - Variants 2–22: `INSUFFICIENT_EVIDENCE_ZERO_UPSTREAM_AND_NEVER_LISTEN` stands.
2. **Historical Logs & Errata**:
   - The 66 individual stdout/stderr/meta files and the reconciled 17 narrative errata remain authoritative as pinned in R1 under [`docs/testing/inta-returns/frontend/validation-r1-20261026/`](file:///Users/nguyenvanlan/Documents/code/pet-projects/matter-control/docs/testing/inta-returns/frontend/validation-r1-20261026/).
3. **No Retrospective PASS Claim**:
   - Antigravity makes **no claim** of live runtime pass for the 22 variants from these mock and self-check tests.

---

## 5. R2 Evidence Manifest & Verification

### 5.1 Byte-for-Byte Equality
- Raw directory: [`/tmp/mc002-inta-evidence/frontend/validation-r2-20261026/`](file:///tmp/mc002-inta-evidence/frontend/validation-r2-20261026/)
- Export directory: [`docs/testing/inta-returns/frontend/validation-r2-20261026/`](file:///Users/nguyenvanlan/Documents/code/pet-projects/matter-control/docs/testing/inta-returns/frontend/validation-r2-20261026/)
- Verification: `rtk diff -r "$RAW_DIR" "$EXPORT_DIR"` exited with code `0` (byte-for-byte identical).

### 5.2 R2 Payload Manifest ([`manifest.json`](file:///Users/nguyenvanlan/Documents/code/pet-projects/matter-control/docs/testing/inta-returns/frontend/validation-r2-20261026/manifest.json))
Total Payloads: **15 files** | Total Payload Bytes: **131,584 bytes** (excluding `manifest.json` itself).

| Path | Bytes | SHA-256 | Description |
|---|---|---|---|
| `credential-pattern-scan-r2.json` | 260 | `125b4ecbdec0c856...` | Credential pattern scan (0 matches) |
| `diffs/guard-validator.diff` | 13,290 | `37db7a9f9313a958...` | Unified diff of runner against R1 |
| `diffs/guard_evaluator.diff` | 13,464 | `60b65f6d3c16f131...` | Unified diff of evaluator against R1 |
| `launcher/harness-dev.mjs` | 3,874 | `55c7e0ee6745a694...` | Pre-listen launcher prototype |
| `launcher/test-launcher-mock.mjs` | 8,085 | `44a4a3c2c2b253bf...` | Deterministic mock test suite for launcher (8/8 PASS) |
| `proposals/dependency-isolation-plan-r2.md` | 4,477 | `1f3e5f7e3e291cac...` | Updated dependency plan with nested symlink traversal |
| `proposals/pre-listen-launcher-proposal-r2.md` | 6,934 | `f7292697369df725...` | Pre-listen proposal aligned with INTA-1-LAUNCH-01 |
| `r2-test-summary.json` | 2,104 | `f7dbb3d81f3eea0d...` | Structured test execution metadata |
| `runner-scripts/coordinator.py` | 12,296 | `c997e411460ecef6...` | Typed coordinator replacing bash string interpolation |
| `runner-scripts/guard-validator-r2.sh` | 1,907 | `a8cc64649cb05a43...` | Shell runner wrapper with trap cleanup |
| `runner-scripts/guard_evaluator.py` | 6,626 | `46a9da54909da612...` | Strict fail-closed evaluator module |
| `runner-scripts/observer.py` | 5,749 | `018ea7789991726c...` | HTTP observer with atomic tempfile+fsync+replace |
| `runner-scripts/selfcheck-r2-results.json` | 21,628 | `67214fb94ebc5b03...` | Structured JSON results for 29 test cases |
| `runner-scripts/selfcheck-r2.py` | 27,709 | `3c70aec2b42cdfb6...` | Comprehensive deterministic self-check suite |
| `selfcheck-r2.stdout.txt` | 3,181 | `c432f47da16951e1...` | Captured execution stdout log |

---

## 6. Credential and Repository Cleanliness

1. **Credential Pattern Scan**:
   Automated pattern scan across all 14 payload files found **0 matches** ([`credential-pattern-scan-r2.json`](file:///Users/nguyenvanlan/Documents/code/pet-projects/matter-control/docs/testing/inta-returns/frontend/validation-r2-20261026/credential-pattern-scan-r2.json)). Actual runtime secret scan coverage remains owned by Codex.
2. **Repository Integrity**:
   Original source repositories `/tmp/mc002-inta-fe` (`3e5a642`) and `/tmp/mc002-inta-harness` (`48cc03e`) remain untouched and clean.
3. **Ledger Integrity**:
   Original 59 ledger files in `/tmp/mc002-inta-state-intamvnmoems3pd` match `05-ledger-after.sha256` exactly.

---

## 7. Skipped Work and Remaining Risks

### Skipped Work (Per Scope Boundaries)
- **No live Next.js server was run**: Zero live socket listeners on 18085.
- **No live HTTP observer was run**: Zero live socket listeners on 18086.
- **No product build or test collection was rerun**.
- **No dependency clone or copy was executed**: The APFS clone plan remains documented for future runs.
- **No Git commits, merges, or pushes were performed**.

### Remaining Risks & Open Decisions for Codex and Independent QA
1. **Launch Scope Approved, Implementation Unverified**: The Human Product Owner has explicitly approved INTA-LAUNCH-D01 Option A ([`docs/implementation/inta-launch-contract-addendum.md`](file:///Users/nguyenvanlan/Documents/code/pet-projects/matter-control/docs/implementation/inta-launch-contract-addendum.md)). The supported launch boundary is `bin/harness-dev.mjs`, while raw direct Next CLI is unsupported for never-listen. This approval closes the scope gate, but live implementation remains unverified until formal review and execution.
2. **Independent Non-Author Review**: Actual OpenCode must review these corrected R2 sources, launcher prototype, and mock selfcheck results before any live runtime validation is cued.
3. **Runtime Validation Authorization**: A live run of the startup guard variants on the supported launcher path awaits an explicit Codex bounded runtime cue following OpenCode's review.
