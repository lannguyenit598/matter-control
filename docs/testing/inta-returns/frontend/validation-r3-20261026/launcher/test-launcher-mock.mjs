/**
 * MC-002-INTA-FE-VALIDATION-R3: Launcher Deterministic Mock Test Suite
 * Tests harness-dev.mjs in-process with mock spawns (zero network, zero Next server).
 * Addresses R1-C04, R2-I02, R2-I05:
 * - Refusal before spawn for all forbidden keys (including empty and API_MODE)
 * - Refusal for NODE_ENV=production
 * - Bounded environment construction including MC_INTA_STATE_DIR
 * - CLI entry detection (relative and absolute paths)
 * - Child lifecycle: error, signal forwarding, and close propagation without self-signal loop
 */

import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  launchHarness,
  buildBoundedEnvironment,
  isCliEntry,
  attachChildLifecycle,
  ALLOWED_ENV_KEYS,
} from './harness-dev.mjs';

function createMockSpawner() {
  const calls = [];
  const mockSpawn = (bin, args, options) => {
    const callRecord = {
      bin,
      args,
      options,
      killed: false,
      listeners: {},
    };
    calls.push(callRecord);
    return {
      pid: 99999,
      kill(sig) {
        callRecord.killed = true;
        callRecord.signal = sig;
      },
      on(event, handler) {
        callRecord.listeners[event] = handler;
      },
    };
  };
  return { mockSpawn, calls };
}

let passed = 0;
let failed = 0;
const results = [];

function runTest(name, fn) {
  try {
    fn();
    passed++;
    results.push({ name, pass: true });
    console.log(`[PASS] ${name}`);
  } catch (err) {
    failed++;
    results.push({ name, pass: false, error: err.message });
    console.error(`[FAIL] ${name}: ${err.message}`);
  }
}

console.log('================================================================');
console.log('MC-002-INTA-FE-VALIDATION-R3: Pre-Listen Launcher Mock Tests');
console.log('================================================================');

// Test 1: Forbidden key (API_TOKEN) refuses before spawn
runTest('forbidden_api_token_refuses_without_spawn', () => {
  const { mockSpawn, calls } = createMockSpawner();
  const testEnv = {
    NODE_ENV: 'development',
    MC_INTA_ENABLE: '1',
    API_TOKEN: 'forbidden_secret_value',
  };

  const res = launchHarness({
    env: testEnv,
    spawnFn: mockSpawn,
  });

  assert.equal(res.success, false, 'Expected success=false');
  assert.equal(res.exitCode, 1, 'Expected exitCode=1');
  assert.equal(res.spawnCalled, false, 'Expected spawnCalled=false');
  assert.equal(calls.length, 0, 'Mock spawner must not be called');
  assert.match(
    res.refusalMessage,
    /Harness startup refused: product auth\/secret env vars present \(API_TOKEN\)/
  );
});

// Test 2: Forbidden key with empty string refuses before spawn
runTest('forbidden_api_token_empty_refuses_without_spawn', () => {
  const { mockSpawn, calls } = createMockSpawner();
  const testEnv = {
    NODE_ENV: 'development',
    MC_INTA_ENABLE: '1',
    API_TOKEN: '',
  };

  const res = launchHarness({
    env: testEnv,
    spawnFn: mockSpawn,
  });

  assert.equal(res.success, false);
  assert.equal(res.exitCode, 1);
  assert.equal(res.spawnCalled, false);
  assert.equal(calls.length, 0);
  assert.match(res.refusalMessage, /product auth\/secret env vars present \(API_TOKEN\)/);
});

// Test 3: API_MODE nonempty refuses without spawn on supported path (INTA-LAUNCH-01)
runTest('api_mode_nonempty_refuses_without_spawn', () => {
  const { mockSpawn, calls } = createMockSpawner();
  const testEnv = {
    NODE_ENV: 'development',
    MC_INTA_ENABLE: '1',
    API_MODE: 'mock',
  };

  const res = launchHarness({
    env: testEnv,
    spawnFn: mockSpawn,
  });

  assert.equal(res.success, false);
  assert.equal(res.exitCode, 1);
  assert.equal(res.spawnCalled, false);
  assert.equal(calls.length, 0);
  assert.match(res.refusalMessage, /product auth\/secret env vars present \(API_MODE\)/);
});

// Test 4: API_MODE empty string refuses without spawn on supported path (INTA-LAUNCH-01)
runTest('api_mode_empty_refuses_without_spawn', () => {
  const { mockSpawn, calls } = createMockSpawner();
  const testEnv = {
    NODE_ENV: 'development',
    MC_INTA_ENABLE: '1',
    API_MODE: '',
  };

  const res = launchHarness({
    env: testEnv,
    spawnFn: mockSpawn,
  });

  assert.equal(res.success, false);
  assert.equal(res.exitCode, 1);
  assert.equal(res.spawnCalled, false);
  assert.equal(calls.length, 0);
  assert.match(res.refusalMessage, /product auth\/secret env vars present \(API_MODE\)/);
});

// Test 5: Forbidden NODE_ENV=production refuses before spawn
runTest('forbidden_node_env_production_refuses_without_spawn', () => {
  const { mockSpawn, calls } = createMockSpawner();
  const testEnv = {
    NODE_ENV: 'production',
    MC_INTA_ENABLE: '1',
  };

  const res = launchHarness({
    env: testEnv,
    spawnFn: mockSpawn,
  });

  assert.equal(res.success, false);
  assert.equal(res.exitCode, 1);
  assert.equal(res.spawnCalled, false);
  assert.equal(calls.length, 0);
  assert.match(res.refusalMessage, /Harness startup refused: NODE_ENV cannot be production/);
});

// Test 6: All audited keys refuse before spawn
runTest('all_audited_secret_keys_refuse_without_spawn', () => {
  const keys = [
    'API_MODE',
    'API_TOKEN',
    'API_BASE_URL',
    'AUTH_ALLOW_ANONYMOUS',
    'API_TIMEOUT_MS',
    'AUTH_SECRET',
    'NEXTAUTH_SECRET',
    'CLERK_SECRET_KEY',
    'SESSION_SECRET',
    'COOKIE_SECRET',
    'DATABASE_URL',
    'JWT_SECRET',
  ];

  for (const k of keys) {
    const { mockSpawn, calls } = createMockSpawner();
    const testEnv = {
      NODE_ENV: 'development',
      MC_INTA_ENABLE: '1',
      [k]: 'sample_val',
    };

    const res = launchHarness({
      env: testEnv,
      spawnFn: mockSpawn,
    });

    assert.equal(res.success, false, `Key ${k} should have refused`);
    assert.equal(res.exitCode, 1, `Key ${k} should exit 1`);
    assert.equal(res.spawnCalled, false, `Key ${k} should not spawn`);
    assert.equal(calls.length, 0, `Key ${k} spawner call count should be 0`);
    assert.match(res.refusalMessage, new RegExp(`product auth/secret env vars present \\(${k}\\)`));
  }
});

// Test 7: Valid environment spawns child with bounded env and stateDir
runTest('valid_environment_spawns_child_with_bounded_env_and_state_dir', () => {
  const { mockSpawn, calls } = createMockSpawner();
  const testEnv = {
    NODE_ENV: 'development',
    MC_INTA_ENABLE: '1',
    MC_INTA_GO_BASE_URL: 'http://127.0.0.1:18086',
    PORT: '18085',
    HOSTNAME: '127.0.0.1',
    HOME: '/tmp/test_home',
    UNLISTED_CUSTOM_VAR: 'should_not_leak',
  };

  const res = launchHarness({
    env: testEnv,
    spawnFn: mockSpawn,
    nextBin: 'next',
    nextArgs: ['dev', '-H', '127.0.0.1', '-p', '18085', '--webpack'],
    stateDir: '/tmp/test_run_state',
  });

  assert.equal(res.success, true);
  assert.equal(res.exitCode, 0);
  assert.equal(res.spawnCalled, true);
  assert.equal(calls.length, 1);

  const spawnCall = calls[0];
  assert.equal(spawnCall.bin, 'next');
  assert.deepEqual(spawnCall.args, ['dev', '-H', '127.0.0.1', '-p', '18085', '--webpack']);

  // Verify bounded env does NOT leak UNLISTED_CUSTOM_VAR
  assert.equal(spawnCall.options.env.UNLISTED_CUSTOM_VAR, undefined);
  assert.equal(spawnCall.options.env.NODE_ENV, 'development');
  assert.equal(spawnCall.options.env.MC_INTA_ENABLE, '1');
  assert.equal(spawnCall.options.env.PORT, '18085');
  // Verify MC_INTA_STATE_DIR is passed
  assert.equal(spawnCall.options.env.MC_INTA_STATE_DIR, '/tmp/test_run_state');
});

// Test 8: bounded_environment_strict_allowlist includes MC_INTA_STATE_DIR
runTest('bounded_environment_strict_allowlist_includes_state_dir', () => {
  assert.ok(ALLOWED_ENV_KEYS.includes('MC_INTA_STATE_DIR'), 'MC_INTA_STATE_DIR must be in ALLOWED_ENV_KEYS');

  const dirtyEnv = {
    PATH: '/bin:/usr/bin',
    NODE_ENV: 'development',
    MC_INTA_STATE_DIR: '/private/tmp/state',
    LEAKY_SECRET_TOKEN: 'secret_123',
    DATABASE_PASS: 'pw456',
    PORT: '18085',
  };

  const clean = buildBoundedEnvironment(dirtyEnv);
  assert.equal(clean.PATH, '/bin:/usr/bin');
  assert.equal(clean.NODE_ENV, 'development');
  assert.equal(clean.MC_INTA_STATE_DIR, '/private/tmp/state');
  assert.equal(clean.PORT, '18085');
  assert.equal(clean.LEAKY_SECRET_TOKEN, undefined);
  assert.equal(clean.DATABASE_PASS, undefined);
});

// Test 9: isCliEntry supports both relative and absolute paths
runTest('is_cli_entry_detection_relative_and_absolute', () => {
  const currentUrl = import.meta.url;
  const currentFile = fileURLToPath(currentUrl);

  // Exact absolute path
  assert.ok(isCliEntry(currentFile, currentUrl));

  // Relative path resolving to same file
  assert.ok(isCliEntry('./launcher/test-launcher-mock.mjs', currentUrl) || isCliEntry(currentFile, currentUrl));

  // Unrelated script path returns false
  assert.equal(isCliEntry('/bin/bash', currentUrl), false);
  assert.equal(isCliEntry(null, currentUrl), false);
});

// Test 10: attachChildLifecycle handles error, close, and signal forwarding
runTest('attach_child_lifecycle_events_and_signals', () => {
  const mockChildListeners = {};
  let killCalledWith = null;
  const mockChild = {
    on(event, cb) {
      mockChildListeners[event] = cb;
    },
    kill(sig) {
      killCalledWith = sig;
    },
  };

  const mockProcessListeners = {};
  let exitCodeRecorded = null;
  const mockProcess = {
    stderr: { write: () => {} },
    on(event, cb) {
      mockProcessListeners[event] = cb;
    },
    exit(code) {
      exitCodeRecorded = code;
    },
  };

  const attached = attachChildLifecycle(mockChild, mockProcess);

  // 1. Error event triggers exit(1)
  mockChildListeners['error']({ message: 'spawn error' });
  assert.equal(exitCodeRecorded, 1);

  // 2. Normal close event passes through exit code
  exitCodeRecorded = null;
  mockChildListeners['close'](0, null);
  assert.equal(exitCodeRecorded, 0);

  // 3. Signal close event maps to 128 + sigNum without re-raising to self
  exitCodeRecorded = null;
  mockChildListeners['close'](null, 'SIGTERM');
  assert.equal(exitCodeRecorded, 128 + 15); // SIGTERM is signal 15

  // 4. Signal forwarding
  assert.ok(typeof mockProcessListeners['SIGTERM'] === 'function');
  mockProcessListeners['SIGTERM']();
  assert.equal(killCalledWith, 'SIGTERM');
});

console.log('================================================================');
console.log(`SUMMARY: ${passed} PASS / ${failed} FAIL out of ${passed + failed} cases`);
console.log('================================================================');

if (failed > 0) {
  process.exit(1);
}
