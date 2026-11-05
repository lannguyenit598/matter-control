# Pre-Listen Launcher Implementation Proposal (R3)

**Document ID**: MC-002-INTA-FE-LAUNCHER-PROPOSAL-R3  
**Status**: PROPOSED_FOR_INDEPENDENT_REVIEW / SOURCE_VERIFIED_IN_MOCK / RUNTIME_NOT_RELEASED  
**Author**: Antigravity (Frontend Execution Owner)  
**Coordinating Role**: Codex (PM / Coordination)  
**Independent Review**: OpenCode  
**Normative Authority**: Direct Human Product Owner Approval (2026-10-26, `INTA-LAUNCH-D01`, Option A), `docs/implementation/inta-launch-contract-addendum.md` (INTA-1-LAUNCH-01)

---

## 1. Context and Approved Scope Boundary

Under the direct approval of the Human Product Owner (`approval.json`, 2026-10-26), **INTA-LAUNCH-D01 Option A** was explicitly selected:
> *"A — Phê duyệt launcher chính thức có guard trước Next; raw CLI không được hỗ trợ cho tiêu chí never-listen, giữ nguyên FAIL lịch sử (Khuyến nghị)"*

The normative addendum (`docs/implementation/inta-launch-contract-addendum.md`) establishes:
1. The supported harness launch path is a reviewed guard-first launcher that loads and executes the exact existing `validateHarnessStartup` from `src/guards.ts` before spawning any Next.js child process.
2. For forbidden startup input, the launcher must output the exact expected refusal message, exit with code 1, spawn zero child processes, bind zero TCP listeners on port 18085, and guarantee zero upstream HTTP requests to port 18086.
3. Raw direct `npx next dev` or `next dev` invocation is **unsupported for the never-listen acceptance claim**, and its historical FAIL remains permanently recorded.
4. The boundary approval defines the normative requirement, but exact implementation binding (Node runtime, module loader, argv, environment allowlist, process lifecycle) requires verifiable implementation and independent review prior to live runtime release.

---

## 2. Proposed Architecture: `launcher/harness-dev.mjs`

To resolve OpenCode findings **R2-I02** and **R2-I05** while adhering strictly to zero new package dependencies, the R3 launcher implementation is provided as a standalone ECMAScript module:

### 2.1 Native TypeScript Execution via Node 24 Type Stripping
- **Runtime**: Node.js v24.10.0 (workstation installed version).
- **Execution Flag**: `--experimental-strip-types` (native V8 type stripping, zero transpilation overhead, no external dependencies like `ts-node` or `tsx`).
- **Target Guard**: Direct ES import of `/tmp/mc002-inta-harness/src/guards.ts` (`validateHarnessStartup`, `AUDITED_AUTH_ENV_KEYS`, `AUDITED_SECRET_ENV_KEYS`, `AUDITED_DATABASE_ENV_KEYS`).
- **Integrity Check**: The launcher verifies the existence and readability of the harness guard file before import, failing closed if unavailable.

### 2.2 Pre-Listen Guard Execution
Before attempting any subprocess creation, port binding, or filesystem mutation:
1. `validateHarnessStartup(process.env)` is invoked in-process.
2. If any audited auth, secret, or database variable is present (whether non-empty or empty string `""`):
   - The launcher prints the exact canonical refusal message:
     `Harness startup refused: product auth/secret env vars present (<KEY>)`
   - The launcher immediately calls `process.exit(1)`.
   - **No Next.js process is spawned. Port 18085 is never touched.**
3. If `NODE_ENV === "production"`:
   - The launcher prints: `Harness startup refused: NODE_ENV cannot be production`.
   - Immediate `process.exit(1)`.
4. If `MC_INTA_ENABLE !== "true"`:
   - Refusal output and immediate `process.exit(1)`.

### 2.3 Strict Bounded Environment Construction
Resolving **R2-I02** and **R2-I05**, the launcher does NOT use `process.env` or `os.environ.copy()`. It constructs a minimal bounded environment:
```javascript
export const ALLOWED_ENV_KEYS = [
  "PATH",
  "NODE_ENV",
  "MC_INTA_ENABLE",
  "MC_INTA_GO_BASE_URL",
  "MC_INTA_UPSTREAM_PORT",
  "MC_INTA_STATE_DIR",
  "MC_INTA_PORT",
  "PORT",
  "HOSTNAME",
  "HOME",
  "LANG",
  "LC_ALL",
  "TMPDIR",
];
```
- **Explicit `MC_INTA_STATE_DIR`**: Explicitly propagated to allow components to locate private runtime state without scanning ancestor directories or polluting shared spaces.
- **Forbidden Key Sanitization**: Any variable outside the allowlist, or matching forbidden patterns, is stripped from child environment. Furthermore, as enforced by `validateHarnessStartup`, if any forbidden key was set in the calling environment, the process has already aborted at step 2.2 before reaching child spawn.

### 2.4 Relative and Absolute CLI Entry Detection (R2-I05)
Resolving OpenCode finding R2-I05, where relative CLI invocation caused `isCliEntry` to misidentify execution mode:
```javascript
export function isCliEntry(argv1, metaUrl) {
  if (!argv1 || !metaUrl) return false;
  try {
    const scriptPath = fileURLToPath(metaUrl);
    const resolvedArgv1 = path.resolve(argv1);
    return resolvedArgv1 === scriptPath;
  } catch {
    return false;
  }
}
```
This guarantees identical behavior whether invoked via `node launcher/harness-dev.mjs`, `node ./launcher/harness-dev.mjs`, or absolute `/path/to/launcher/harness-dev.mjs`.

### 2.5 Child Process Lifecycle & Signal Forwarding (R2-I03, R2-I05)
1. **Child Spawn**: Next.js is spawned with explicit binary path (defaulting to local `node_modules/.bin/next` or resolved `npx next dev -p 18085`), strictly passing `boundedEnv`, `cwd: harnessDir`, and `stdio: "inherit"`.
2. **Signal Forwarding**:
   - Registered for `SIGINT` and `SIGTERM`.
   - Forwards signal to `child.kill(signal)`.
   - Does NOT re-raise signals on `process` to prevent recursive re-raising loops.
3. **Exit Propagation**: On child `exit` or `close`, the launcher exits with the exact same exit code / signal status as the child.
4. **Spawn Error Handling**: On child `error` (e.g. `ENOENT`), the launcher catches the error, outputs diagnostics to stderr, and exits with code 1.

---

## 3. Verification & Evidence

The proposed launcher has been verified through two independent deterministic test suites in R3:
1. **`launcher/test-launcher-mock.mjs`**:
   - 10/10 unit tests PASS (exit 0).
   - Covers: forbidden keys refusal without spawn (both non-empty and empty values for `API_TOKEN`, `API_MODE`), `NODE_ENV=production` refusal, all 12 audited secret keys, valid environment spawn with bounded env + `MC_INTA_STATE_DIR`, relative/absolute `isCliEntry` detection, signal/lifecycle event attachment.
2. **`runner/selfcheck-r3.py` (Tests 29 & 30)**:
   - Test 29 executes Node 24 `--experimental-strip-types` to import `guards.ts` directly, verifying that native type stripping loads the actual frozen harness guard file without error.
   - Test 30 invokes `test-launcher-mock.mjs` and verifies zero failures.

---

## 4. Preserved Limitations & Prerequisites for Runtime Release

1. **Raw CLI Status**: Raw `npx next dev` remains officially unsupported for never-listen. Historical FAIL stands.
2. **Runtime Status**: This proposal represents source-level and deterministic mock verification only. **Live runtime remains NOT_RELEASED**.
3. **Prerequisites for Codex Live Cue**:
   - Independent OpenCode review PASS of R3 source and proposals.
   - Pinned resolution of Node binary, launcher path, and harness root.
   - Private attempt directory isolation and zero-port-conflict verification on port 18085/18086.
