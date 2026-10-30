/**
 * MC-002-INTA-FE-VALIDATION-R2: Pre-Listen Harness Launcher Prototype
 * Addresses R1-C04:
 * - Executes startup guard before opening ANY socket or spawning Next.js
 * - Imports directly from frozen src/guards.ts using Node 24 native type stripping
 * - Constructs an explicit bounded environment allowlist (no broad process.env spread)
 * - Exposes an injectable spawner interface for deterministic mock testing
 */

import { spawn as defaultSpawn } from 'node:child_process';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

// Direct import of existing frozen TypeScript guard via Node 24 type stripping
// Pin SHA-256: 0f5f245316450d76d47f79a1b668a777ef9e1134008cbbc1c566808c654ef928
import { validateHarnessStartup } from '/tmp/mc002-inta-harness/src/guards.ts';

export const ALLOWED_ENV_KEYS = [
  'PATH',
  'NODE_ENV',
  'MC_INTA_ENABLE',
  'MC_INTA_GO_BASE_URL',
  'PORT',
  'HOSTNAME',
  'HOME',
  'TERM',
  'SHELL',
  'TMPDIR',
];

/**
 * Builds an explicit, bounded environment allowlist.
 * Ensures no unvetted or sensitive environment variables are leaked to the child.
 */
export function buildBoundedEnvironment(sourceEnv) {
  const bounded = {};
  for (const key of ALLOWED_ENV_KEYS) {
    if (sourceEnv[key] !== undefined) {
      bounded[key] = sourceEnv[key];
    }
  }
  // Ensure default port and host are set if omitted
  if (!bounded.PORT && sourceEnv.PORT) bounded.PORT = sourceEnv.PORT;
  if (!bounded.HOSTNAME && sourceEnv.HOSTNAME) bounded.HOSTNAME = sourceEnv.HOSTNAME;
  return bounded;
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
} = {}) {
  // Step 1: Execute guard BEFORE any process spawn or socket listener
  try {
    validateHarnessStartup(env);
  } catch (err) {
    const refusalMessage = err?.message || String(err);
    // Write refusal to stderr exactly as expected by the contract
    process.stderr.write(`${refusalMessage}\n`);
    return {
      success: false,
      exitCode: 1,
      refusalMessage,
      spawnCalled: false,
      child: null,
    };
  }

  // Step 2: Build strictly bounded environment (no broad spread)
  const boundedEnv = buildBoundedEnvironment(env);

  // Step 3: Spawn child process only after successful guard validation
  let child;
  try {
    child = spawnFn(nextBin, nextArgs, {
      env: boundedEnv,
      cwd,
      stdio: 'inherit',
    });
  } catch (err) {
    process.stderr.write(`Spawn failure: ${err?.message}\n`);
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
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const result = launchHarness({
    env: process.env,
    spawnFn: defaultSpawn,
  });

  if (!result.success) {
    process.exit(result.exitCode);
  }

  if (result.child) {
    result.child.on('error', (err) => {
      process.stderr.write(`Child process error: ${err.message}\n`);
      process.exit(1);
    });
    result.child.on('close', (code, signal) => {
      if (signal) {
        process.kill(process.pid, signal);
      } else {
        process.exit(code ?? 0);
      }
    });

    // Forward termination signals to child
    const forwardSignal = (sig) => {
      try {
        result.child.kill(sig);
      } catch (_) {}
    };
    process.on('SIGTERM', () => forwardSignal('SIGTERM'));
    process.on('SIGINT', () => forwardSignal('SIGINT'));
  }
}
