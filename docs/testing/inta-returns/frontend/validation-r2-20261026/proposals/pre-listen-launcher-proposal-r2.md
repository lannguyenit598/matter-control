# Technical Proposal: Pre-Listen Harness Launcher (R2 Revision)

**Task Reference**: MC-002-INTA-FE-VALIDATION-R2  
**Addresses**: Finding FEVAL-F01, OpenCode Review R1-C04  
**Status**: ACCEPTANCE_BOUNDARY_APPROVED (INTA-1-LAUNCH-01 / INTA-LAUNCH-D01 Option A; Implementation Unverified; Runtime Not Released)  
**Target File**: `bin/harness-dev.mjs`  
**Normative Addendum**: `docs/implementation/inta-launch-contract-addendum.md`  
**Approval Record**: `docs/testing/inta-launch-approval-20261026/approval.json`  
**Guard Source**: `/tmp/mc002-inta-harness/src/guards.ts` (SHA-256: `0f5f245316450d76d47f79a1b668a777ef9e1134008cbbc1c566808c654ef928`)  

---

## 1. Architectural Problem & Root Cause

In Next.js 16.4.2 CLI (`node_modules/next/dist/server/lib/start-server.js` line 430), the HTTP server binds to the TCP socket before user configuration is initialized:

```javascript
// next/dist/server/lib/start-server.js
server.listen(port, hostname); // Line 430: TCP listener acquired immediately
server.on('listening', async () => {
    // Config evaluation occurs here AFTER socket acquisition:
    const config = await loadConfig(...); // next.config.ts runs here
});
```

Because `next.config.ts` runs inside the `listening` event callback, any startup guard placed solely in `next.config.ts` cannot prevent a transient TCP listener on port 18085. When `validateHarnessStartup(process.env)` throws, Next.js catches the exception and exits with code 1, but the socket was already bound momentarily (`Ready in 178ms`).

Under the strict contract requirement that **no TCP listener may EVER be established when forbidden authentication keys are present** (`NEVER_LISTEN`), invoking `next dev` directly via CLI inevitably fails the contract.

---

## 2. Proposed Solution: Pre-Listen Wrapper (`bin/harness-dev.mjs`)

The minimal, non-invasive architectural solution is a lightweight wrapper launcher that executes the existing frozen startup guard **before** any network socket is opened and **before** spawning Next.js.

### 2.1 Source Pin & Loader Resolution
- **Actual Source**: The guard is defined in `src/guards.ts` (not `guards.js`).
- **Loader Pinning**: Verified on the installed Node runtime (`v24.22.1`). Node 24 natively supports `--experimental-strip-types` without requiring TypeScript compilation, babel, `ts-node`, or any external npm package.
- **Guard Import**:
  ```javascript
  import { validateHarnessStartup } from '../src/guards.ts';
  ```
  This imports the exact existing implementation without key duplication.

### 2.2 Execution Flow
1. **Startup Validation**:
   - `validateHarnessStartup(process.env)` is evaluated synchronously on process entry.
   - If a forbidden key (`API_TOKEN`, `AUTH_SECRET`, etc.) or `NODE_ENV=production` is present:
     - The function throws `Error('Harness startup refused: ...')`.
     - The launcher catches this error, prints the exact refusal message to `stderr`, and exits immediately with code 1 (`process.exit(1)`).
     - **Result: 0 sockets created, 0 child processes spawned, 0 upstream HTTP requests.**
2. **Strict Environment Containment (Allowlist Bounded Env)**:
   - Addressing R1-C04's finding on `env: process.env`: The launcher constructs a strict allowlist dictionary rather than spreading the entire host environment.
   - Allowed Keys:
     `PATH`, `NODE_ENV`, `MC_INTA_ENABLE`, `MC_INTA_GO_BASE_URL`, `PORT`, `HOSTNAME`, `HOME`, `TERM`, `SHELL`, `TMPDIR`.
   - Any sensitive or unlisted variables are stripped before spawning.
3. **Child Process Spawn & Lifecycle**:
   - Spawns Next.js dev server with bounded environment:
     ```javascript
     const child = spawn(nextBin, nextArgs, {
       env: boundedEnv,
       cwd: process.cwd(),
       stdio: 'inherit',
     });
     ```
   - Registers error handling (`child.on('error', ...)`).
   - Forwards `SIGTERM` and `SIGINT` signals to child.
   - Propagates child exit code upon termination.

---

## 3. Verified Prototype Implementation

The launcher prototype is implemented and verified under `/tmp/mc002-inta-fe-validation-r2-20261026/launcher/`:
- [`harness-dev.mjs`](file:///tmp/mc002-inta-fe-validation-r2-20261026/launcher/harness-dev.mjs): Core launcher module with injectable spawner interface.
- [`test-launcher-mock.mjs`](file:///tmp/mc002-inta-fe-validation-r2-20261026/launcher/test-launcher-mock.mjs): Deterministic mock test suite (6/6 PASS).

### Verification Results
```text
[PASS] forbidden_api_token_refuses_without_spawn (calls.length == 0, exitCode == 1)
[PASS] forbidden_api_token_empty_refuses_without_spawn (calls.length == 0, exitCode == 1)
[PASS] forbidden_node_env_production_refuses_without_spawn (calls.length == 0, exitCode == 1)
[PASS] all_audited_secret_keys_refuse_without_spawn (12/12 keys tested, 0 spawns)
[PASS] valid_environment_spawns_child_with_bounded_env (calls.length == 1, bounded env)
[PASS] bounded_environment_strict_allowlist (unlisted secrets stripped)
```

---

## 4. Contract Provenance & Proposed Additive Amendment

### 4.1 Provenance Clarification
- In R1, §3.3 attributed the literal `rtk proxy <private installed next executable> dev -H 127.0.0.1 -p 18085 --webpack` to `inta-approved-contract.md` §2.
- OpenCode Review R1-C04 correctly noted that this exact command literal originates from the human execution handoff prompt `MC-002-INTA-FE-VALIDATION-ANTIGRAVITY-PROMPT.md` line 38, whereas frozen `inta-approved-contract.md` §2 defers exact CLI selection to installed CLI evidence.
- This correction is formally adopted.

### 4.2 Approved Additive Contract Addendum (INTA-1-LAUNCH-01)
The Human Product Owner explicitly approved INTA-LAUNCH-D01 Option A on 2026-10-26 (recorded in `docs/implementation/inta-launch-contract-addendum.md` and `docs/testing/inta-launch-approval-20261026/approval.json`):
- Supported harness launch path: `node --experimental-strip-types bin/harness-dev.mjs`
- Raw direct Next CLI is officially unsupported for the never-listen acceptance claim, and its historical FAIL is retained.
- The base contract `inta-approved-contract.md` remains byte-frozen at SHA-256 `6606a5da131567274f858b84a0c51ac66607a6c5a8eb12213ac7dcca585eb155`.
- Acceptance boundary is APPROVED; implementation remains UNVERIFIED; live runtime remains NOT_RELEASED.

---

## 5. Scope Boundaries, Limitations, and Residual Risk

1. **Direct CLI Bypass Remains**:
   Executing `npx next dev` or `node_modules/.bin/next dev` directly will still trigger the upstream Next.js bug and open a transient port listener. The wrapper guarantees the `NEVER_LISTEN` criterion for the **supported launch command**, not for raw CLI bypass.
2. **Frozen Source Untouched**:
   No changes have been committed to `tools/inta-harness` or `apps/frontend`.
3. **No Live Runtime Release**:
   This proposal and its prototype are verified via pure mock tests. Live runtime execution requires formal architecture approval and an explicit Codex runtime cue.
