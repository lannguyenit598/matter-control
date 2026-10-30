# MatterControl — Implementation-Binding Record R5

**Task**: `MC-002-INTA-FE-VALIDATION-R5`  
**Status**: `PROPOSAL_FOR_REVIEW / RUNTIME_NOT_RELEASED`  
**Coordinating Branch**: `codex/unified-project-flow`  
**Base Commit**: `a62d838791ba188838c4ff00b7b6e265ac775056`  
**Author**: Actual Antigravity (Frontend Execution Owner)  
**Intake Owner**: Local Codex  
**Reviewer**: Actual OpenCode  

---

## 1. Executive Summary & Purpose

This implementation-binding record defines the exact execution environment, cryptographic pins, path bindings, and lifecycle requirements for the supported guard-first launcher path (`harness-dev.mjs`) under **INTA-1-LAUNCH-01 (Option A Approved)**.

It resolves findings **R4-C02, R4-C03, NF-1, NF-3, and NF-5** from the OpenCode R4 source review:
1. **Absolute Binary Pins**: Eliminates `shutil.which` and bare PATH fallbacks for Node and Python.
2. **Byte Verification Before Code Evaluation**: Eliminates static ES imports; reads and verifies the raw SHA-256 of `guards.ts` before dynamically importing the module via native Node 24 type stripping.
3. **Private Environment Binding**: Eliminates ambient `HOME` and `TMPDIR` leakage by binding isolated directories inside the variant output root.
4. **Codex Staging Prerequisites**: Formally defines the contract for `/tmp/mc002-inta-runtime-stage-r5-20261026` and mandates fail-closed behavior if `stage-receipt.json` is missing or unverified.
5. **No Forcekill/SIGKILL**: Terminates gracefully via SIGTERM; if process remains alive, records explicit cleanup failure without issuing SIGKILL, propagating to evaluator.

---

## 2. Pinned Executable & Source Boundaries

| Component | Bound Path | Cryptographic SHA-256 | Version / Platform |
|---|---|---|---|
| **Node.js Binary** | `/Users/nguyenvanlan/.nvm/versions/node/v24.22.1/bin/node` | `6f32069480ec14d52b6d7b1f3c7124cfbbc46203abf5ddf5c65b127435f3f329` | Node `v24.22.1` (darwin-arm64) |
| **Python Binary** | `/Library/Frameworks/Python.framework/Versions/3.14/bin/python3` | `a6a412ff830271043f7730e2527455bdbf52c9e1712f753dc2d90089949e9943` | Python `3.14.4` (macOS 15.5) |
| **Startup Guard Source** | `/tmp/mc002-inta-harness/src/guards.ts` | `0f5f245316450d76d47f79a1b668a777ef9e1134008cbbc1c566808c654ef928` | Frozen canonical TypeScript guard |
| **Supported Launcher** | `/tmp/mc002-inta-fe-validation-r5-20261026/launcher/harness-dev.mjs` | Verified dynamically per attempt | Node ES module (`.mjs`) |
| **Variant Coordinator** | `/tmp/mc002-inta-fe-validation-r5-20261026/runner/coordinator.py` | Verified dynamically per attempt | Python 3.14 script |
| **Upstream Observer** | `/tmp/mc002-inta-fe-validation-r5-20261026/runner/observer.py` | Verified dynamically per attempt | Python 3.14 script |
| **Shell Entrypoint** | `/tmp/mc002-inta-fe-validation-r5-20261026/runner/guard-validator-r5.sh` | Verified dynamically per attempt | Bash script (`set -euo pipefail`) |

---

## 3. Strict Pre-Evaluation Guard Load Order

To guarantee that no untrusted guard code can execute:
1. `launchHarness` reads `/tmp/mc002-inta-harness/src/guards.ts` as raw binary bytes using `fs.readFileSync`.
2. Computes SHA-256 and compares strictly against `EXPECTED_GUARD_SHA256` (`0f5f...`).
3. If the hash mismatches or the file cannot be read:
   - Writes `launcher-execution.json` with `outcome: "BINDING_ERROR"`, `errorType: "BINDING_ERROR/NOT_READY"`.
   - Exits with status `1`.
   - Does **NOT** evaluate or import any code.
   - Evaluator treats this as `BINDING_ERROR`, never as a canonical refusal `PASS`.
4. Only upon successful cryptographic match does it dynamically import via:
   `await import(pathToFileURL(resolve(guardPath)).href)`
   utilizing Node 24 `--experimental-strip-types`.

---

## 4. Environment Allowlists & Isolation

### 4.1 Child Process Environment
Child processes spawned by `VariantRunner` inherit **zero** ambient environment variables from the user session. The environment dictionary is constructed strictly with:
- `PATH`: `/usr/bin:/bin`
- `NODE_ENV`: `"development"` (or `"production"` for the subcheck variant)
- `MC_INTA_ENABLE`: `"1"`
- `MC_INTA_GO_BASE_URL`: `http://127.0.0.1:18086`
- `MC_INTA_STATE_DIR`: `<variant_output_dir>/run-state`
- `PORT`: `"18085"`
- `HOSTNAME`: `"127.0.0.1"`
- `HOME`: `<variant_output_dir>/home` (isolated private directory)
- `TMPDIR`: `<variant_output_dir>/tmp` (isolated private directory)
- `TERM`: `"xterm"`
- `SHELL`: `"/bin/sh"`
- `<KEY>`: `<VALUE>` (the single tested variable and variant value)

### 4.2 Observer Process Environment
The upstream HTTP observer (`observer.py`) is bounded to:
- `PATH`: `/usr/bin:/bin`
- `PYTHONPATH`: `<runner_directory>`
- `HOME`: `<variant_output_dir>/home`
- `TMPDIR`: `<variant_output_dir>/tmp`
- `LANG`: `"en_US.UTF-8"`
- `LC_ALL`: `"en_US.UTF-8"`
- `TERM`: `"xterm"`

---

## 5. Codex Private Staging Prerequisites

The reserved staging path `/tmp/mc002-inta-runtime-stage-r5-20261026` is owned by Codex. Antigravity does **not** create, copy, or populate dependencies in this path.

Before live runtime execution can be cued:
1. Codex must provision a clean Copy-on-Write (CoW) clone of the harness under `/tmp/mc002-inta-runtime-stage-r5-20261026`.
2. All nested symlinks in `node_modules/.bin` and `.pnpm` must be resolved via `realpath` to guarantee they do not escape outside the stage root or into sensitive host locations.
3. Codex must generate `/tmp/mc002-inta-runtime-stage-r5-20261026/stage-receipt.json` declaring:
   - `stageStatus`: `"VERIFIED"`
   - `stageTimestampUTC`: ISO timestamp
   - `harnessCwd`: resolved absolute path
   - `nextBin`: resolved absolute path
   - `symlinkEscapeCount`: `0`
4. The coordinator pre-flight check validates the existence and contents of this receipt; if absent, execution immediately halts with `[BINDING_ERROR/NOT_READY] Required Codex stage receipt missing`.

---

## 6. Preserved 51 Formal Results Partition

No IDs or historical statuses are modified.
- **36 Required Cases**: Includes `T11c` with status `OUTCOME_UNKNOWN`.
- **14 Product-Deferred Cases**: Preserved as deferred.
- **1 Production-Feasibility Blocked Case**: `D-14` (distinct from T11c).
- **Raw Next CLI Bypass**: Preserved as `FAIL_OBSERVED_LISTENER` (unsupported).
