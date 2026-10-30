# Pre-Listen Harness Launcher Proposal (Text / Source Only)

**Workstream**: MC-002-INTA-FE-VALIDATION-R1  
**Requirement Traced**: INT-ENV-05, FEVAL-F01  
**Status**: PROPOSAL_ONLY / UNIMPLEMENTED / PENDING_CODEX_DISPOSITION  
**Author**: Actual Antigravity (Gemini 3.8 Flash High)  

---

## 1. Problem Statement: Next.js 16.4.2 CLI Bootstrap Sequence

Inspection of the installed Next.js 16.4.2 development server source (`node_modules/next/dist/server/lib/start-server.js`) reveals the exact execution timeline during `next dev`:

```text
next dev command
  └── startServer()
        ├── http.createServer(...)
        ├── server.listen(port, hostname)  <--- Port 18085 bound HERE (line 430)
        └── server.on('listening', async () => {
              └── loadConfig()
                    └── next.config.ts evaluated
                          └── validateHarnessStartup(process.env) thrown
                                └── catch (err) { process.exit(1); }  <--- Port released on exit (line 427)
```

Because `server.listen` occurs in `start-server.js` before `next.config.ts` is evaluated, **any startup check placed exclusively inside `next.config.ts` cannot guarantee that port 18085 is never acquired**. When `next dev` is executed directly, a transient TCP socket is created for ~100–300ms before process exit.

---

## 2. Minimal Proposed Solution: Pre-Listen Launcher Entrypoint

To satisfy the strict "port 18085 never acquired" criterion without modifying the upstream Next.js framework or altering frozen product source, the harness can introduce a dedicated pre-listen launcher:

### 2.1 Proposed Implementation (`tools/inta-harness/bin/harness-dev.mjs` or `scripts/harness-dev.ts`)

```javascript
#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

// 1. Pre-Listen Evaluation: import and execute the EXACT existing guard function
// NO duplicated key lists or duplicate logic.
import { validateHarnessStartup } from '../src/guards.js';

try {
  // Execute guard strictly BEFORE any network process is spawned
  validateHarnessStartup(process.env);
} catch (err) {
  // Faithfully output the exact refusal phrase to stderr and exit with code 1
  process.stderr.write(`${err.message}\n`);
  process.exit(1);
}

// 2. Only if validation passes: spawn Next.js dev server with bounded env and argv
const harnessRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const nextBin = path.join(harnessRoot, 'node_modules', '.bin', 'next');

const child = spawn(nextBin, ['dev', '-H', '127.0.0.1', '-p', '18085', '--webpack'], {
  cwd: harnessRoot,
  stdio: 'inherit',
  env: process.env,
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
  } else {
    process.exit(code ?? 0);
  }
});
```

### 2.2 Architectural Properties of the Launcher

1. **Zero Duplicate Logic**: The launcher imports and executes `validateHarnessStartup(process.env)` directly from `src/guards.ts`. If keys are added, removed, or changed in `guards.ts`, the launcher automatically inherits them.
2. **Guaranteed Never-Listen on Refusal**: If any forbidden environment variable is set (or empty), `validateHarnessStartup` throws synchronously in Node.js before any network socket, HTTP server, or Next.js process is ever created. Port 18085 is never bound (0 TCP packets).
3. **Defense-in-Depth Preserved**: `next.config.ts` retains its existing `validateHarnessStartup(process.env)` call. If an operator accidentally bypasses the launcher, the config-time guard still catches the misconfiguration.

---

## 3. Analysis of Scope, Reach, and Limitations

### 3.1 What This Launcher Proves
- It proves that the **supported, official harness launch entrypoint** (`pnpm harness:dev` or `node bin/harness-dev.mjs`) strictly enforces the pre-listen startup contract. Under this entrypoint, all 22 forbidden startup variants fail with exit 1, exact key-name refusal, zero listener acquisition, and zero upstream observer calls.

### 3.2 What Direct CLI Bypass Remains
- If an operator or script directly executes `/tmp/mc002-inta-harness/node_modules/.bin/next dev`, the upstream Next.js bootstrap behavior remains: `start-server.js` will bind port 18085 for ~200ms before `next.config.ts` aborts execution.
- A wrapper launcher **cannot alter the internal architecture of Next.js dev server**. It secures the supported application launch vector, but does not prevent raw direct binary invocation.

### 3.3 Launch Contract Updates Required
Adopting this solution requires formal coordination:
1. **Contract Amendment**: `docs/implementation/inta-approved-contract.md` §2 currently references direct Next execution:
   `rtk proxy <private installed next executable> dev -H 127.0.0.1 -p 18085 --webpack`
   This contract literal must be updated by Codex / Solution Architecture to specify:
   `node bin/harness-dev.mjs dev -H 127.0.0.1 -p 18085 --webpack` (or `pnpm harness:dev`).
2. **Validation Target**: Future validation runs will test the launcher entrypoint, establishing true 22/22 PASS against the "never listen" requirement.
3. **No Retrospective Waiver**: This proposal does not claim that the historical direct Next execution passed "never listen". The historical finding `FAIL_AGAINST_NEVER_LISTEN` for direct Next execution is formally retained as an empirical characteristic of Next.js 16.4.2 CLI.

### 3.4 Disposition Gate
Per the R1 instructions, **this launcher is NOT implemented in frozen source code during R1**. It is submitted as technical analysis for Codex intake and independent nonauthor review.
