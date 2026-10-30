# MC-002-INTA-FE-IMPLEMENTATION-BINDING-RECORD-R4

**Document ID**: MC-002-INTA-FE-BINDING-RECORD-R4  
**Status**: CANDIDATE_BINDING_RECORD / SOURCE_VERIFIED_IN_MOCKS / LIVE_RUNTIME_NOT_RELEASED  
**Author**: Antigravity (Frontend Execution Owner)  
**Coordinating Role**: Codex (PM / Coordination Owner)  
**Independent Review**: OpenCode  
**Normative Reference**: INTA-1-LAUNCH-01 (`docs/implementation/inta-launch-contract-addendum.md`, line 18)  
**Decision Authority**: Direct Human Product Owner Approval (2026-10-26, `INTA-LAUNCH-D01`, Option A), `docs/testing/inta-launch-approval-20261026/approval.json`

---

## 1. Purpose and Authority

Under INTA-1-LAUNCH-01 Line 18, prior to live runtime release, an explicit implementation-binding record must formally specify:
1. Exact installed executable paths and settled runtime versions (resolving previous textual discrepancies).
2. Exact supported launcher path, frozen guard import path, and runtime-verifiable cryptographic integrity verification.
3. Exact command-line arguments (argv), working directory (cwd), and child binary paths without PATH-resolution fallbacks.
4. Reconciled environment variable allowlists across coordinator, launcher, and proposal.
5. Strict bounded environments for both child runner and background HTTP observer.
6. The canonical 25-variant plan structure including the `NODE_ENV=production` supported-path subcheck.
7. Candidate private staging paths and symlink escape verification rules.

This document serves as the authoritative implementation binding record, superseding all previous proposal drafts (`pre-listen-launcher-proposal-r2.md`, `r3.md`).

---

## 2. Settled Runtime Versions and Absolute Executable Paths

Real workstation version reads have settled all historical version strings:
- **Node.js**:
  - Settled Version: `v24.22.1` (settled via `node -v`, correcting prior textual typo `v24.10.0`).
  - Absolute Executable Path: `/Users/nguyenvanlan/.nvm/versions/node/v24.22.1/bin/node`
  - V8 Engine Flags: `--experimental-strip-types` (native TypeScript execution without transpilers).
- **Python**:
  - Settled Version: `Python 3.14.4` (settled via `python3 --version`).
  - Absolute Executable Path: `/Library/Frameworks/Python.framework/Versions/3.14/bin/python3`
- **Shell**:
  - Settled Path: `/bin/bash` (for `runner/guard-validator-r4.sh`).

---

## 3. Supported Launcher & Guard Cryptographic Integrity

- **Launcher Source Path**: `/tmp/mc002-inta-fe-validation-r4-20261026/launcher/harness-dev.mjs`
- **Guard Import Target**: `/tmp/mc002-inta-harness/src/guards.ts`
- **Frozen Guard Hash**: SHA-256 `0f5f245316450d76d47f79a1b668a777ef9e1134008cbbc1c566808c654ef928` (3,128 bytes).
- **Runtime Cryptographic Verification (NF-3)**:
  `harness-dev.mjs` implements `verifyGuardIntegrity()`. Prior to evaluating any guard logic or child spawn, it computes the SHA-256 digest of `/tmp/mc002-inta-harness/src/guards.ts`. If the file is missing, unreadable, or modified, execution halts immediately with exit code 1.
- **Exported Function Bound**: `validateHarnessStartup(env)`.
  - Validates audited secret, auth, and database keys.
  - Validates `NODE_ENV !== 'production'`.
  - Validates `MC_INTA_GO_BASE_URL`.
  - Note: The frozen startup guard does not check `MC_INTA_ENABLE` (which is evaluated by handler-level `validateHarnessEnvironment`).

---

## 4. Reconciled Bounded Environment Allowlists (NF-1)

To prevent unmanaged environment inheritance, strict bounded allowlists are reconciled between `coordinator.py` and `harness-dev.mjs`:

### 4.1 Child Process Allowlist (`ALLOWED_ENV_KEYS`)
```
PATH, NODE_ENV, MC_INTA_ENABLE, MC_INTA_GO_BASE_URL, MC_INTA_STATE_DIR,
PORT, HOSTNAME, HOME, TMPDIR, TERM, SHELL
```
- **Explicit `MC_INTA_STATE_DIR`**: Propagated per variant to ensure runtime state writes remain inside private scratch.
- **Explicit `SHELL` & `TMPDIR`**: Reconciled and passed directly from coordinator to child.
- **Forbidden Variables**: Audited forbidden keys (including `API_TOKEN`, `API_MODE`, `API_BASE_URL`, `AUTH_ALLOW_ANONYMOUS`, `API_TIMEOUT_MS`, `AUTH_SECRET`, `NEXTAUTH_SECRET`, `CLERK_SECRET_KEY`, `SESSION_SECRET`, `COOKIE_SECRET`, `DATABASE_URL`, `JWT_SECRET`) trigger immediate refusal and process exit 1 before Next.js spawn.

### 4.2 Observer Process Bounded Allowlist (`obs_env`)
```
PATH, PYTHONPATH, HOME, TMPDIR, LANG, LC_ALL, TERM
```
- Replaces ambient `os.environ` inheritance with an explicit clean-room dictionary.

---

## 5. Child Execution Arguments and Cwd Binding

- **Next.js Binary Target**: `/tmp/mc002-inta-harness/node_modules/.bin/next` (bound explicitly; no PATH fallback).
- **Harness Working Directory (cwd)**: `/tmp/mc002-inta-harness` (bound explicitly; no `process.cwd()` fallback).
- **Arguments**: `['dev', '-H', '127.0.0.1', '-p', '18085', '--webpack']`.
- **Signal Handling**: Signals (`SIGTERM`, `SIGINT`) are forwarded to the child process handle. Signal delivery errors are visibly written to stderr. Clean child termination maps to Unix `128 + sigNum` without self-signal re-raising loops.

---

## 6. Canonical 25-Variant Validation Plan (NF-2)

The plan consists of **25 distinct variants**:
1. **22 Canonical Variants**: 11 remaining forbidden variables × {nonempty, empty}.
2. **2 API_MODE Variants**: `API_MODE=mock` and `API_MODE=""`.
3. **1 NODE_ENV Variant**: `NODE_ENV=production` supported-path subcheck (addendum L20), expecting refusal phrase `NODE_ENV cannot be production`.

---

## 7. Staging and Runtime Prerequisites

1. **Candidate Status**: Staging is candidate-only in R4. No dependencies were copied or modified.
2. **Prerequisites for Codex Live Cue**:
   - Independent non-author source review PASS by OpenCode.
   - Pinned directory provisioning and symlink boundary checks.
   - Port 18085/18086 pre-flight availability check.
   - Explicit bounded runtime cue from Codex.
