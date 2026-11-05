# INT-A — Frontend Validation R1 Return

**Task ID**: MC-002-INTA-FE-VALIDATION-R1  
**Executor / Identity**: Actual Antigravity (Gemini 3.8 Flash High / preflight Claude Opus 4.6 Thinking), Google provider, macOS workstation  
**Coordination Branch**: `codex/unified-project-flow`  
**Base Revision**: `a62d838791ba188838c4ff00b7b6e265ac775056`  
**Status**: `IN_REVIEW / CORRECTION_SOURCE_READY / RUNTIME_NOT_RELEASED`  
**Independent Reviewer**: Actual OpenCode (independent verification pending; no author self-approval)  
**Requirements Traced**: NFR-002, INT-ENV-05, INT-ENV-07, INT-ISO-01, INT-ISO-02, INT-ISO-03, INT-PRIV-01  

---

## 1. Identity, Authority and Scope Boundary

Following the Product Owner's delivery of `MC-002-INTA-FE-VALIDATION-R1-ANTIGRAVITY-PROMPT.md`, Antigravity performed **source and evidence corrections only**. In accordance with the prompt's strict boundaries:
- **NO live Next dev server was executed.**
- **NO synthetic HTTP observer was run on loopback.**
- **NO product build or test collection was rerun.**
- **NO dependencies were installed, cloned, or downloaded.**
- **NO Git commit, stash, reset, merge, or push was performed.**

### Exact Provenance Clarification
- **Phase 1 (Initial Setup & Preflight)**: The user session was configured with `Claude Opus 4.6 (Thinking)`. Antigravity performed initial reading of the task prompt, baseline checks, and initial sandbox creation under this setting.
- **Phase 2 (Initial Execution & Intake Return)**: The user switched setting to `Gemini 3.8 Flash (High)`. Antigravity executed the initial guard variants and product build under this setting. Provider is recorded as Google because Antigravity is Google's agentic platform.
- **Phase 3 (Current R1 Correction)**: Executed by Antigravity under `Gemini 3.8 Flash (High)` in the active session without switching providers or initiating external sessions.

---

## 2. Disposition of Codex Intake Findings (FEVAL-F01..05)

| Finding | Severity | Action Taken in R1 | Retained Evidence / Status |
|---|---|---|---|
| **FEVAL-F01** | P1 (Observed contract failure) | Corrected `API_TOKEN/nonempty` verdict from PASS to `FAIL_AGAINST_NEVER_LISTEN` (or `FAIL_OBSERVED_LISTENER`). Runner rewritten to abort immediately upon any listener acquisition. Authored technical proposal for a pre-listen launcher (`pre-listen-launcher-proposal.md`). | `guard-startup-subchecks-r1.json` row 1 updated. No retrospective waiver claimed. **CLOSED_FOR_SOURCE_AND_EVIDENCE_REVISION**. |
| **FEVAL-F02** | P1 (Zero-upstream proof invalid) | Corrected remaining 21 variant verdicts from PASS to `INSUFFICIENT_EVIDENCE_ZERO_UPSTREAM_AND_NEVER_LISTEN`. Preserved `observer.json` absence (no synthetic 0s backfilled). Rewrote observer script with explicit `SIGTERM`/`SIGINT` handler, durable atomic file flush, and clean shutdown verification. | `guard-startup-subchecks-r1.json` rows 2–22 updated. Missing observer files documented. **CLOSED_FOR_SOURCE_AND_EVIDENCE_REVISION**. |
| **FEVAL-F03** | P2 (Evidence/runner fail-closed gaps) | Extracted core evaluation logic into strict `guard_evaluator.py`. Port probe errors now produce `PROBE_ERROR` (never defaulting to "no listener"). Exact refusal phrase `product auth/secret env vars present (${key})` enforced. Retained all 22 individual variant stdout/stderr/meta files with SHA-256 pins. Executed deterministic in-process selfcheck suite (`selfcheck-r1.py`, 9/9 PASS). | All 22 variant subdirectories exported. In-process test results captured in `selfcheck-r1-results.json`. **CLOSED_FOR_SOURCE_AND_EVIDENCE_REVISION**. |
| **FEVAL-F04** | P2 (Report/manifest errata) | Authored `report-errata-reconciliation.json` reconciling the 17 narrative report hashes with the authoritative original `manifest.json`. Corrected asset counts: 31 total assets, comprising 18 JS files and 15 static/chunks JS files. Clarified pattern-only scan vs actual-secret coverage (`ACTUAL_SECRET_SCAN_NOT_ESTABLISHED`). | Exported `report-errata-reconciliation.json`. Original manifest (64,321 bytes) corroborated. **CLOSED_FOR_SOURCE_AND_EVIDENCE_REVISION**. |
| **FEVAL-F05** | P2 (Dependency isolation) | Acknowledged that original `harness-snapshot/node_modules` was a direct symlink to product dependencies. Authored `dependency-isolation-plan.md` defining an isolated APFS copy-on-write clone (`cp -cR`) with preflight realpath validation for future runs. Zero dependency operations executed in R1. | Exported `dependency-isolation-plan.md`. **CLOSED_FOR_SOURCE_AND_EVIDENCE_REVISION**. |

---

## 3. Retained Variant Evidence and Corrected Dispositions

The 22 variant runs from the initial execution were preserved in their exact historical state (under `retained-variant-evidence/`). Their verdicts are now formally corrected in [guard-startup-subchecks-r1.json](file:///Users/nguyenvanlan/Documents/code/pet-projects/matter-control/docs/testing/inta-returns/frontend/validation-r1-20261026/guard-startup-subchecks-r1.json):

1. **`API_TOKEN` (nonempty)**: `FAIL_OBSERVED_LISTENER` (exit 1, expected refusal present, but listener on 18085 observed during startup before config throw).
2. **`API_TOKEN` (empty)**: `INSUFFICIENT_EVIDENCE_ZERO_UPSTREAM_AND_NEVER_LISTEN` (exit 1, expected refusal present, port closed after exit; but `observer.json` missing and never-listen unverified).
3. **`API_BASE_URL` (nonempty / empty)**: `INSUFFICIENT_EVIDENCE_ZERO_UPSTREAM_AND_NEVER_LISTEN` (same as above).
4. **`AUTH_ALLOW_ANONYMOUS` (nonempty / empty)**: `INSUFFICIENT_EVIDENCE_ZERO_UPSTREAM_AND_NEVER_LISTEN` (same as above).
5. **`API_TIMEOUT_MS` (nonempty / empty)**: `INSUFFICIENT_EVIDENCE_ZERO_UPSTREAM_AND_NEVER_LISTEN` (same as above).
6. **`AUTH_SECRET` (nonempty / empty)**: `INSUFFICIENT_EVIDENCE_ZERO_UPSTREAM_AND_NEVER_LISTEN` (same as above).
7. **`NEXTAUTH_SECRET` (nonempty / empty)**: `INSUFFICIENT_EVIDENCE_ZERO_UPSTREAM_AND_NEVER_LISTEN` (same as above).
8. **`CLERK_SECRET_KEY` (nonempty / empty)**: `INSUFFICIENT_EVIDENCE_ZERO_UPSTREAM_AND_NEVER_LISTEN` (same as above).
9. **`SESSION_SECRET` (nonempty / empty)**: `INSUFFICIENT_EVIDENCE_ZERO_UPSTREAM_AND_NEVER_LISTEN` (same as above).
10. **`COOKIE_SECRET` (nonempty / empty)**: `INSUFFICIENT_EVIDENCE_ZERO_UPSTREAM_AND_NEVER_LISTEN` (same as above).
11. **`DATABASE_URL` (nonempty / empty)**: `INSUFFICIENT_EVIDENCE_ZERO_UPSTREAM_AND_NEVER_LISTEN` (same as above).
12. **`JWT_SECRET` (nonempty / empty)**: `INSUFFICIENT_EVIDENCE_ZERO_UPSTREAM_AND_NEVER_LISTEN` (same as above).

**Deviation Note**: The original runner continued executing variants 2–22 after `API_TOKEN/nonempty` acquired a listener, rather than failing closed immediately. This failure to stop is recorded as a runner deviation.

---

## 4. Corrected Runner Logic and In-Process Deterministic Self-Check

### 4.1 Corrected Runner Architecture
- **Evaluator**: `guard_evaluator.py` implements pure, fail-closed evaluation functions.
- **Observer**: `guard-validator-r1.sh` embeds a Python HTTP server with `signal.signal(signal.SIGTERM, sig_term_handler)` ensuring `observer.json` is flushed atomically with `{"requestCount": n, "cleanShutdown": true}`.
- **Immediate Abort**: `run_variant` checks the evaluator verdict; if not `PASS`, it immediately returns exit code 2 and aborts the loop.
- **Port Probes**: `lsof` non-zero exit codes (other than 1 = no process) are treated as `PROBE_ERROR`.

### 4.2 Deterministic Self-Check Execution (`selfcheck-r1.py`)
Tested via `python3 selfcheck-r1.py` with zero network and zero child processes, exercising the exact same `guard_evaluator.py` functions:

```text
================================================================
MC-002-INTA-FE-VALIDATION-R1: Deterministic Runner Self-Check
Start UTC: 2026-10-26T06:24:07.116842+00:00
================================================================
[PASS] 1. missingcounter        -> FAIL, MISSING_COUNTER
[PASS] 2. malformedcounter      -> FAIL, MALFORMED_COUNTER
[PASS] 3. positivecounter       -> FAIL, POSITIVE_COUNTER
[PASS] 4. observererror         -> FAIL, OBSERVER_ERROR
[PASS] 5. transientlistener     -> FAIL, FAIL_AGAINST_NEVER_LISTEN
[PASS] 6. probeerror            -> FAIL, PROBE_ERROR
[PASS] 7. timeout               -> FAIL, TIMEOUT
[PASS] 8. wrongrefusal          -> FAIL, WRONG_REFUSAL
[PASS] 9. validcompleteinput    -> PASS, VALID_COMPLETE_INPUT
================================================================
SUMMARY: 9 PASS / 0 FAIL out of 9 cases
================================================================
```
Full structured test output is retained in [selfcheck-r1-results.json](file:///Users/nguyenvanlan/Documents/code/pet-projects/matter-control/docs/testing/inta-returns/frontend/validation-r1-20261026/runner-scripts/selfcheck-r1-results.json).

---

## 5. Technical Proposal: Pre-Listen Harness Launcher

Documented in detail in [pre-listen-launcher-proposal.md](file:///Users/nguyenvanlan/Documents/code/pet-projects/matter-control/docs/testing/inta-returns/frontend/validation-r1-20261026/runner-scripts/pre-listen-launcher-proposal.md):

1. **Root Cause**: Next.js 16.4.2 CLI (`node_modules/next/dist/server/lib/start-server.js` line 430) executes `server.listen(port, hostname)` concurrently with `next.config.ts` evaluation. A config-time guard cannot prevent transient TCP listener acquisition.
2. **Minimal Launcher (`harness-dev.mjs`)**:
   - Imports `validateHarnessStartup(process.env)` directly from `./src/guards.js` (zero duplicate keys).
   - Evaluates the guard **before spawning any child process or network server**.
   - If invalid, prints exact refusal to stderr and exits with code 1 without spawning Next (0 sockets created).
   - If valid, spawns Next.js dev server with bounded environment.
3. **Contract Impact**: Requires updating `inta-approved-contract.md` §2 to define `node bin/harness-dev.mjs` as the supported harness launch command instead of raw `next dev`.
4. **Current Status**: Text/source proposal only. **NOT implemented in frozen code during R1.**

---

## 6. Private Dependency Isolation Plan

Documented in detail in [dependency-isolation-plan.md](file:///Users/nguyenvanlan/Documents/code/pet-projects/matter-control/docs/testing/inta-returns/frontend/validation-r1-20261026/runner-scripts/dependency-isolation-plan.md):

1. **Limitation Disclosed**: Initial harness snapshot symlinked to `/private/tmp/mc002-inta-fe/node_modules`. While sources remained clean, symlinking did not provide write-through isolation.
2. **Future Procedure**: For future execution, use an APFS copy-on-write clone (`cp -cR /tmp/mc002-inta-fe/node_modules ...`) with preflight checks:
   - `[ ! -L "$HARNESS_SNAPSHOT/node_modules" ]`
   - `[ -d "$HARNESS_SNAPSHOT/node_modules" ]`
   - Realpath check confirming no resolution into product source directory.
3. **Current R1 Status**: Zero dependency operations performed in R1.

---

## 7. Retained Evidence & Manifest Verification

### 7.1 Byte-for-Byte Raw vs Export Matching
Raw evidence assembled under `/tmp/mc002-inta-evidence/frontend/validation-r1-20261026/` was copied to governance export path `docs/testing/inta-returns/frontend/validation-r1-20261026/`.
Verification command `diff -r "$RAW_DIR" "$EXPORT_DIR"` exited with code 0 (byte-for-byte identical).

### 7.2 R1 Payload Manifest (`manifest.json`)
The R1 export manifest contains 75 payload files totaling 98,873 bytes (excluding `manifest.json` itself):
- `guard-startup-subchecks-r1.json` (29,826 bytes)
- `report-errata-reconciliation.json` (5,794 bytes)
- `credential-pattern-scan-r1.json` (529 bytes)
- `runner-scripts/guard_evaluator.py` (6,711 bytes)
- `runner-scripts/guard-validator-r1.sh` (10,823 bytes)
- `runner-scripts/selfcheck-r1.py` (10,565 bytes)
- `runner-scripts/selfcheck-r1-results.json` (7,348 bytes)
- `runner-scripts/pre-listen-launcher-proposal.md` (5,703 bytes)
- `runner-scripts/dependency-isolation-plan.md` (3,896 bytes)
- 22 variant subdirectories containing all retained `stdout.log`, `stderr.log`, and `meta.json` files (66 files total).

### 7.3 Credential and Repository Cleanliness
- Automated credential scan of all 74 payload files found **0** matches ([credential-pattern-scan-r1.json](file:///Users/nguyenvanlan/Documents/code/pet-projects/matter-control/docs/testing/inta-returns/frontend/validation-r1-20261026/credential-pattern-scan-r1.json)).
- Original repositories `/tmp/mc002-inta-fe` and `/tmp/mc002-inta-harness` remain clean at `3e5a642` and `48cc03e`.
- Original ledger `/tmp/mc002-inta-state-intamvnmoems3pd` remains clean (all 59 SHA-256 hashes match `05-ledger-after.sha256`).

---

## 8. Summary of Completed, Skipped, and Remaining Risks

### Completed in R1
- [x] Corrected historical dispositions: `API_TOKEN/nonempty` marked `FAIL_OBSERVED_LISTENER`; remaining 21 marked `INSUFFICIENT_EVIDENCE_ZERO_UPSTREAM_AND_NEVER_LISTEN`.
- [x] Corrected runner source authored with fail-closed rules and durable observer shutdown.
- [x] Executed deterministic in-process selfcheck suite (9/9 PASS, exit code 0).
- [x] Authored pre-listen launcher technical proposal (text/source only).
- [x] Authored private dependency isolation plan (text/source only).
- [x] Reconciled 17 narrative report hashes and asset count errata with authoritative manifest.
- [x] Exported complete retained variant evidence with byte-for-byte verification.

### Skipped (Per R1 Scope)
- No live Next dev server executed.
- No live synthetic observer started on loopback.
- No live product build or test collection rerun.
- No dependency install, clone, or launch.
- No commit, merge, or push.

### Remaining Risks & Decisions for Codex / Architecture
1. **Contract Amendment Needed**: Launching via `bin/harness-dev.mjs` instead of raw `next dev` requires formal contract update in `inta-approved-contract.md`.
2. **Runtime Re-execution Pending**: Live 22-variant validation with the corrected runner and pre-listen launcher awaits explicit Codex cue.
3. **Independent QA**: All findings and evidence remain subject to independent OpenCode review. Canonical 51 rows remain untouched.
