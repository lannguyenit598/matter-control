/**
 * MC-002-INTA-FE-VALIDATION-R3: Pre-Listen Harness Launcher Prototype
 * Addresses R1-C04, R2-I02, R2-I05:
 * - Executes startup guard before opening ANY socket or spawning Next.js
 * - Imports directly from frozen src/guards.ts using Node 24 native type stripping
 * - Constructs an explicit bounded environment allowlist including MC_INTA_STATE_DIR
 * - Binds cwd, nextBin, nextArgs, and private state directory explicitly
 * - Provides safe CLI entry detection supporting both relative and absolute invocations
 * - Fully exposes lifecycle and signal-forwarding hooks for in-process testing
 */

import { spawn as defaultSpawn } from 'node:child_process';
import os from 'node:os';
import { resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

// Direct import of existing frozen TypeScript guard via Node 24 native type stripping
// Expected SHA-256: 0f5f245316450d76d47f79a1b668a777ef9e1134008cbbc1c566808c654ef928
import { validateHarnessStartup } from '/tmp/mc002-inta-harness/src/guards.ts';

export const ALLOWED_ENV_KEYS = [
  'PATH',
  'NODE_ENV',
  'MC_INTA_ENABLE',
  'MC_INTA_GO_BASE_URL',
  'MC_INTA_STATE_DIR',
  'PORT',
  'HOSTNAME',
  'HOME',
  'TERM',
  'SHELL',
  'TMPDIR',
];

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

  // Forward termination signals to child
  const forwardSignal = (sig) => {
    try {
      if (typeof child.kill === 'function') {
        child.kill(sig);
      }
    } catch (_) {}
  };

  if (typeof processObj.on === 'function') {
    processObj.on('SIGTERM', () => forwardSignal('SIGTERM'));
    processObj.on('SIGINT', () => forwardSignal('SIGINT'));
  }

  return { onChildError, onChildClose, forwardSignal };
}

/**
 * Executes harness startup validation and conditional child spawn.
 * Returns an execution result object.
 */
export function launchHarness({
  env = process.env,
  spawnFn = defaultSpawn,
  nextBin = 'next',
  nextArgs = ['dev', '-H', '127.0.0.1', '-p', '18085', '--webpack'],
  cwd = process.cwd(),
  stateDir = null,
} = {}) {
  // Step 1: Execute guard BEFORE any process spawn or socket listener
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

  // Step 2: Build strictly bounded environment
  const effectiveEnv = { ...env };
  if (stateDir && !effectiveEnv.MC_INTA_STATE_DIR) {
    effectiveEnv.MC_INTA_STATE_DIR = stateDir;
  }
  const boundedEnv = buildBoundedEnvironment(effectiveEnv);

  // Step 3: Spawn child process only after successful guard validation
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

// Direct CLI invocation entrypoint
if (isCliEntry()) {
  const result = launchHarness({
    env: process.env,
    spawnFn: defaultSpawn,
  });

  if (!result.success) {
    process.exit(result.exitCode);
  }

  if (result.child) {
    attachChildLifecycle(result.child, process);
  }
}
