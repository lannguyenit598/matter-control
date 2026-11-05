/**
 * MC-002-INTA-FE-VALIDATION-R4: Pre-Listen Harness Launcher Prototype
 * Addresses R1-C04, R2-I02, R2-I05, R3-N02, NF-1, NF-3:
 * - Executes runtime integrity check and startup guard before opening ANY socket or spawning Next.js
 * - Imports directly from frozen src/guards.ts using Node 24 native type stripping
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
import { fileURLToPath } from 'node:url';

// Direct import of existing frozen TypeScript guard via Node 24 native type stripping
import { validateHarnessStartup } from '/tmp/mc002-inta-harness/src/guards.ts';

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
 * Verifies the existence, readability, and cryptographic hash of the guard file (NF-3).
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
      // Map signal to standard Unix exit code (128 + signal_number) without re-raising to self
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
export function launchHarness({
  env = process.env,
  spawnFn = defaultSpawn,
  guardPath = DEFAULT_GUARD_PATH,
  nextBin = DEFAULT_NEXT_BIN,
  nextArgs = ['dev', '-H', '127.0.0.1', '-p', '18085', '--webpack'],
  cwd = DEFAULT_HARNESS_CWD,
  stateDir = null,
} = {}) {
  // Step 1: Verify guard file cryptographic integrity before execution (NF-3)
  try {
    verifyGuardIntegrity(guardPath);
  } catch (err) {
    const integrityError = err?.message || String(err);
    if (process.stderr && process.stderr.write) {
      process.stderr.write(`${integrityError}\n`);
    }
    return {
      success: false,
      exitCode: 1,
      refusalMessage: integrityError,
      spawnCalled: false,
      child: null,
    };
  }

  // Step 2: Execute startup guard BEFORE any process spawn or socket listener
  try {
    validateHarnessStartup(env);
  } catch (err) {
    const refusalMessage = err?.message || String(err);
    if (process.stderr && process.stderr.write) {
      process.stderr.write(`${refusalMessage}\n`);
    }
    return {
      success: false,
      exitCode: 1,
      refusalMessage,
      spawnCalled: false,
      child: null,
    };
  }

  // Step 3: Build strictly bounded environment
  const effectiveEnv = { ...env };
  if (stateDir && !effectiveEnv.MC_INTA_STATE_DIR) {
    effectiveEnv.MC_INTA_STATE_DIR = stateDir;
  }
  const boundedEnv = buildBoundedEnvironment(effectiveEnv);

  // Step 4: Spawn child process only after successful guard validation
  let child;
  try {
    child = spawnFn(nextBin, nextArgs, {
      env: boundedEnv,
      cwd,
      stdio: 'inherit',
    });
  } catch (err) {
    if (process.stderr && process.stderr.write) {
      process.stderr.write(`Spawn failure: ${err?.message || err}\n`);
    }
    return {
      success: false,
      exitCode: 127,
      refusalMessage: null,
      spawnCalled: true,
      error: err,
      child: null,
    };
  }

  return {
    success: true,
    exitCode: 0,
    refusalMessage: null,
    spawnCalled: true,
    boundedEnv,
    child,
  };
}

// Direct CLI invocation entrypoint (R3-N02, R2-I05)
if (isCliEntry()) {
  const result = launchHarness({
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
