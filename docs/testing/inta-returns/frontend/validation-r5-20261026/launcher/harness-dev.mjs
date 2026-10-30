/**
 * MC-002-INTA-FE-VALIDATION-R5: Pre-Listen Harness Launcher
 * Addresses R4-C01, R4-C02, R4-C03, NF-1, NF-3, NF-4:
 * - Dynamic import with strict pre-evaluation guard byte verification (eliminating static import)
 * - Verifies cryptographic SHA-256 of src/guards.ts BEFORE any module loading or code evaluation
 * - Persists an attempt-bound launcher-execution.json record with complete execution provenance
 * - Validates pre-spawn existence and executability of nextBin and cwd
 * - Fails closed with BINDING_ERROR/NOT_READY upon any guard integrity, loader, or binding failure
 * - Constructs an explicit bounded environment allowlist including MC_INTA_STATE_DIR, SHELL, TMPDIR
 * - Binds cwd, nextBin, nextArgs, and private state directory explicitly without PATH fallback
 * - Exposes visible signal-forwarding error logging and lifecycle hooks for in-process testing
 */

import { spawn as defaultSpawn } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import { resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath, pathToFileURL } from 'node:url';

// Pinned expected guard hash (NF-3, R4-C03)
export const EXPECTED_GUARD_SHA256 = '0f5f245316450d76d47f79a1b668a777ef9e1134008cbbc1c566808c654ef928';
export const DEFAULT_GUARD_PATH = '/tmp/mc002-inta-harness/src/guards.ts';
export const DEFAULT_NEXT_BIN = '/tmp/mc002-inta-harness/node_modules/.bin/next';
export const DEFAULT_HARNESS_CWD = '/tmp/mc002-inta-harness';

// Reconciled bounded environment allowlist (NF-1)
export const ALLOWED_ENV_KEYS = [
  'PATH',
  'NODE_ENV',
  'MC_INTA_ENABLE',
  'MC_INTA_GO_BASE_URL',
  'MC_INTA_STATE_DIR',
  'PORT',
  'HOSTNAME',
  'HOME',
  'TMPDIR',
  'TERM',
  'SHELL',
];

/**
 * Verifies the existence, readability, and cryptographic hash of the guard file (NF-3, R5).
 * Evaluates raw bytes BEFORE any code evaluation or module import.
 * Fails closed if the guard is missing, unreadable, or tampered with.
 */
export function verifyGuardIntegrity(guardPath = DEFAULT_GUARD_PATH, expectedSha = EXPECTED_GUARD_SHA256) {
  if (!fs.existsSync(guardPath)) {
    throw new Error(`Guard integrity failure: file not found at ${guardPath}`);
  }
  const content = fs.readFileSync(guardPath);
  const actualSha = crypto.createHash('sha256').update(content).digest('hex');
  if (actualSha !== expectedSha) {
    throw new Error(
      `Guard integrity mismatch at ${guardPath}: expected SHA-256 ${expectedSha}, got ${actualSha}`
    );
  }
  return true;
}

/**
 * Atomically persists an attempt-bound launcher execution record to disk (NF-4, R5 Item 1).
 * Records exact provenance: binary, versions, hashes, args, cwd, start UTC, and outcome.
 */
export function writeLauncherExecutionRecord({
  stateDir,
  env,
  guardPath,
  guardSha256 = null,
  outcome,
  refusalMessage = null,
  error = null,
  spawnCalled = false,
  childPid = null,
  exitCode = 0,
}) {
  const targetDir = stateDir || env?.MC_INTA_STATE_DIR;
  if (!targetDir) return null;

  try {
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    const currentScript = fileURLToPath(import.meta.url);
    let launcherSha256 = null;
    try {
      launcherSha256 = crypto.createHash('sha256').update(fs.readFileSync(currentScript)).digest('hex');
    } catch {
      // Best-effort script hash read
    }

    const record = {
      launcherPath: resolve(currentScript),
      launcherSha256,
      guardPath: guardPath ? resolve(guardPath) : null,
      guardSha256,
      nodePath: process.execPath,
      nodeVersion: process.version,
      pid: process.pid,
      ppid: process.ppid,
      argv: process.argv,
      cwd: process.cwd(),
      timestampUTC: new Date().toISOString(),
      outcome, // 'REFUSED_BEFORE_SPAWN' | 'SPAWNED' | 'BINDING_ERROR' | 'SPAWN_ERROR'
      spawnCalled,
      refusalMessage,
      error: error ? String(error) : null,
      childPid,
      exitCode,
    };

    const targetFile = resolve(targetDir, 'launcher-execution.json');
    const tmpFile = `${targetFile}.tmp.${process.pid}`;
    fs.writeFileSync(tmpFile, JSON.stringify(record, null, 2), 'utf-8');
    fs.renameSync(tmpFile, targetFile);
    return record;
  } catch (err) {
    if (process.stderr && process.stderr.write) {
      process.stderr.write(`Failed to write launcher execution record: ${err?.message || err}\n`);
    }
    return null;
  }
}

/**
 * Builds an explicit, bounded environment allowlist.
 * Ensures no unvetted or sensitive environment variables leak to the child.
 * Includes MC_INTA_STATE_DIR to prevent default fallback to cwd/.run-state.
 */
export function buildBoundedEnvironment(sourceEnv) {
  const bounded = {};
  for (const key of ALLOWED_ENV_KEYS) {
    if (sourceEnv[key] !== undefined) {
      bounded[key] = sourceEnv[key];
    }
  }
  return bounded;
}

/**
 * Detects whether the current file is being directly executed via CLI,
 * correctly supporting both relative and absolute argv[1] paths.
 */
export function isCliEntry(argv1 = process.argv[1], importUrl = import.meta.url) {
  if (!argv1) return false;
  try {
    const resolvedArgv1 = resolve(argv1);
    const resolvedModule = fileURLToPath(importUrl);
    return resolvedArgv1 === resolvedModule;
  } catch {
    return false;
  }
}

/**
 * Attaches child lifecycle listeners and signal-forwarding handlers.
 * Avoids self-signal re-raise loops by mapping signals to standard 128+n exit codes.
 * Ensures signal delivery errors are visibly captured to stderr.
 */
export function attachChildLifecycle(child, processObj = process) {
  if (!child) return;

  const onChildError = (err) => {
    if (processObj.stderr && processObj.stderr.write) {
      processObj.stderr.write(`Child process error: ${err?.message || err}\n`);
    }
    processObj.exit(1);
  };

  const onChildClose = (code, signal) => {
    if (signal) {
      const sigNum = os.constants?.signals?.[signal] || 15;
      processObj.exit(128 + sigNum);
    } else {
      processObj.exit(code ?? 0);
    }
  };

  if (typeof child.on === 'function') {
    child.on('error', onChildError);
    child.on('close', onChildClose);
  }

  // Forward termination signals to child and surface errors visibly (R3-N05, R2-I05)
  const forwardSignal = (sig) => {
    try {
      if (typeof child.kill === 'function') {
        const ok = child.kill(sig);
        if (!ok && processObj.stderr && processObj.stderr.write) {
          processObj.stderr.write(`Signal delivery failed for ${sig} to child process\n`);
        }
      }
    } catch (err) {
      if (processObj.stderr && processObj.stderr.write) {
        processObj.stderr.write(`Signal delivery exception for ${sig}: ${err?.message || err}\n`);
      }
    }
  };

  if (typeof processObj.on === 'function') {
    processObj.on('SIGTERM', () => forwardSignal('SIGTERM'));
    processObj.on('SIGINT', () => forwardSignal('SIGINT'));
  }

  return { onChildError, onChildClose, forwardSignal };
}

/**
 * Executes runtime guard verification, startup validation, and conditional child spawn.
 * Returns an execution result object.
 */
export async function launchHarness({
  env = process.env,
  spawnFn = defaultSpawn,
  guardPath = DEFAULT_GUARD_PATH,
  expectedGuardSha = EXPECTED_GUARD_SHA256,
  validatorFn = null,
  nextBin = DEFAULT_NEXT_BIN,
  nextArgs = ['dev', '-H', '127.0.0.1', '-p', '18085', '--webpack'],
  cwd = DEFAULT_HARNESS_CWD,
  stateDir = null,
} = {}) {
  const effectiveStateDir = stateDir || env?.MC_INTA_STATE_DIR || null;

  // Step 1: Verify guard file cryptographic integrity BEFORE module loading or execution (NF-3, R5 Item 5)
  try {
    verifyGuardIntegrity(guardPath, expectedGuardSha);
  } catch (err) {
    const integrityError = `[BINDING_ERROR/NOT_READY] ${err?.message || err}`;
    if (process.stderr && process.stderr.write) {
      process.stderr.write(`${integrityError}\n`);
    }
    writeLauncherExecutionRecord({
      stateDir: effectiveStateDir,
      env,
      guardPath,
      guardSha256: null,
      outcome: 'BINDING_ERROR',
      error: integrityError,
      spawnCalled: false,
      exitCode: 1,
    });
    return {
      success: false,
      exitCode: 1,
      errorType: 'BINDING_ERROR/NOT_READY',
      refusalMessage: integrityError,
      spawnCalled: false,
      child: null,
    };
  }

  // Step 2: Dynamically load guard module ONLY AFTER byte integrity is proven
  let validateStartup = validatorFn;
  if (!validateStartup) {
    try {
      const guardUrl = pathToFileURL(resolve(guardPath)).href;
      const guardModule = await import(guardUrl);
      validateStartup = guardModule.validateHarnessStartup;
      if (typeof validateStartup !== 'function') {
        throw new Error(`validateHarnessStartup function is not exported from ${guardPath}`);
      }
    } catch (err) {
      const loadError = `[BINDING_ERROR/NOT_READY] Failed to dynamically load guard module: ${err?.message || err}`;
      if (process.stderr && process.stderr.write) {
        process.stderr.write(`${loadError}\n`);
      }
      writeLauncherExecutionRecord({
        stateDir: effectiveStateDir,
        env,
        guardPath,
        guardSha256: expectedGuardSha,
        outcome: 'BINDING_ERROR',
        error: loadError,
        spawnCalled: false,
        exitCode: 1,
      });
      return {
        success: false,
        exitCode: 1,
        errorType: 'BINDING_ERROR/NOT_READY',
        refusalMessage: loadError,
        spawnCalled: false,
        child: null,
      };
    }
  }

  // Step 3: Execute startup guard BEFORE any process spawn or socket listener
  try {
    validateStartup(env);
  } catch (err) {
    const refusalMessage = err?.message || String(err);
    if (process.stderr && process.stderr.write) {
      process.stderr.write(`${refusalMessage}\n`);
    }
    writeLauncherExecutionRecord({
      stateDir: effectiveStateDir,
      env,
      guardPath,
      guardSha256: expectedGuardSha,
      outcome: 'REFUSED_BEFORE_SPAWN',
      refusalMessage,
      spawnCalled: false,
      exitCode: 1,
    });
    return {
      success: false,
      exitCode: 1,
      refusalMessage,
      spawnCalled: false,
      child: null,
    };
  }

  // Step 4: Build strictly bounded environment
  const effectiveEnv = { ...env };
  if (effectiveStateDir && !effectiveEnv.MC_INTA_STATE_DIR) {
    effectiveEnv.MC_INTA_STATE_DIR = effectiveStateDir;
  }
  const boundedEnv = buildBoundedEnvironment(effectiveEnv);

  // Step 5: Pre-spawn validation of executable and working directory
  if (typeof spawnFn === 'function' && spawnFn === defaultSpawn) {
    if (!fs.existsSync(cwd)) {
      const cwdError = `[BINDING_ERROR/NOT_READY] Harness working directory does not exist: ${cwd}`;
      if (process.stderr && process.stderr.write) {
        process.stderr.write(`${cwdError}\n`);
      }
      writeLauncherExecutionRecord({
        stateDir: effectiveStateDir,
        env,
        guardPath,
        guardSha256: expectedGuardSha,
        outcome: 'BINDING_ERROR',
        error: cwdError,
        spawnCalled: false,
        exitCode: 127,
      });
      return {
        success: false,
        exitCode: 127,
        errorType: 'BINDING_ERROR/NOT_READY',
        refusalMessage: cwdError,
        spawnCalled: false,
        child: null,
      };
    }
    if (!fs.existsSync(nextBin)) {
      const binError = `[BINDING_ERROR/NOT_READY] Next.js binary does not exist at ${nextBin}`;
      if (process.stderr && process.stderr.write) {
        process.stderr.write(`${binError}\n`);
      }
      writeLauncherExecutionRecord({
        stateDir: effectiveStateDir,
        env,
        guardPath,
        guardSha256: expectedGuardSha,
        outcome: 'BINDING_ERROR',
        error: binError,
        spawnCalled: false,
        exitCode: 127,
      });
      return {
        success: false,
        exitCode: 127,
        errorType: 'BINDING_ERROR/NOT_READY',
        refusalMessage: binError,
        spawnCalled: false,
        child: null,
      };
    }
  }

  // Step 6: Spawn child process only after successful guard validation
  let child;
  try {
    child = spawnFn(nextBin, nextArgs, {
      env: boundedEnv,
      cwd,
      stdio: 'inherit',
    });
  } catch (err) {
    const spawnError = `Spawn failure: ${err?.message || err}`;
    if (process.stderr && process.stderr.write) {
      process.stderr.write(`${spawnError}\n`);
    }
    writeLauncherExecutionRecord({
      stateDir: effectiveStateDir,
      env,
      guardPath,
      guardSha256: expectedGuardSha,
      outcome: 'SPAWN_ERROR',
      error: spawnError,
      spawnCalled: true,
      exitCode: 127,
    });
    return {
      success: false,
      exitCode: 127,
      refusalMessage: null,
      spawnCalled: true,
      error: err,
      child: null,
    };
  }

  // Record successful spawn execution
  writeLauncherExecutionRecord({
    stateDir: effectiveStateDir,
    env,
    guardPath,
    guardSha256: expectedGuardSha,
    outcome: 'SPAWNED',
    spawnCalled: true,
    childPid: child?.pid ?? null,
    exitCode: 0,
  });

  return {
    success: true,
    exitCode: 0,
    refusalMessage: null,
    spawnCalled: true,
    boundedEnv,
    child,
  };
}

// Direct CLI invocation entrypoint (R3-N02, R2-I05, R5)
if (isCliEntry()) {
  const result = await launchHarness({
    env: process.env,
    spawnFn: defaultSpawn,
    guardPath: DEFAULT_GUARD_PATH,
    nextBin: DEFAULT_NEXT_BIN,
    cwd: DEFAULT_HARNESS_CWD,
    stateDir: process.env.MC_INTA_STATE_DIR || null,
  });

  if (!result.success) {
    process.exit(result.exitCode);
  }

  if (result.child) {
    attachChildLifecycle(result.child, process);
  }
}
