/**
 * MC-002-INTA-FE-VALIDATION-R4: Launcher Deterministic Mock Test Suite
 * Tests harness-dev.mjs in-process with mock spawns (zero network, zero Next server).
 * Addresses R1-C04, R2-I02, R2-I05, R3-N02, R3-N06, NF-1, NF-3:
 * - Refusal before spawn for all forbidden keys (including empty and API_MODE)
 * - Refusal for NODE_ENV=production
 * - Bounded environment construction including MC_INTA_STATE_DIR, SHELL, TMPDIR
 * - Direct relative CLI entry detection without OR-fallback (NF-6/T9 fix)
 * - Guard integrity verification (NF-3)
 * - Child lifecycle: error, signal forwarding error visibility, and close propagation without self-signal loop
 */

import assert from 'node:assert/strict';
import path, { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  launchHarness,
  buildBoundedEnvironment,
  isCliEntry,
  attachChildLifecycle,
  verifyGuardIntegrity,
  ALLOWED_ENV_KEYS,
  DEFAULT_GUARD_PATH,
  EXPECTED_GUARD_SHA256,
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
        return true;
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
console.log('MC-002-INTA-FE-VALIDATION-R4: Pre-Listen Launcher Mock Tests');
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

  assert.equal(res.success, false, 'Expected success=false');
  assert.equal(res.exitCode, 1, 'Expected exitCode=1');
  assert.equal(res.spawnCalled, false, 'Expected spawnCalled=false');
  assert.equal(calls.length, 0, 'Mock spawner must not be called');
  assert.match(
    res.refusalMessage,
    /Harness startup refused: product auth\/secret env vars present \(API_TOKEN\)/
  );
});

// Test 3: API_MODE nonempty refuses before spawn
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
  assert.match(
    res.refusalMessage,
    /Harness startup refused: product auth\/secret env vars present \(API_MODE\)/
  );
});

// Test 4: API_MODE empty string refuses before spawn
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
  assert.match(
    res.refusalMessage,
    /Harness startup refused: product auth\/secret env vars present \(API_MODE\)/
  );
});

// Test 5: NODE_ENV=production refuses before spawn
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

// Test 6: All audited secret keys refuse before spawn
runTest('all_audited_secret_keys_refuse_without_spawn', () => {
  const auditedKeys = [
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

  for (const k of auditedKeys) {
    const { mockSpawn, calls } = createMockSpawner();
    const testEnv = {
      NODE_ENV: 'development',
      MC_INTA_ENABLE: '1',
      [k]: 'some_secret_val',
    };
    const res = launchHarness({
      env: testEnv,
      spawnFn: mockSpawn,
    });
    assert.equal(res.success, false, `Expected refusal for ${k}`);
    assert.equal(res.exitCode, 1);
    assert.equal(res.spawnCalled, false);
    assert.equal(calls.length, 0);
    assert.match(
      res.refusalMessage,
      new RegExp(`Harness startup refused: product auth/secret env vars present \\(${k}\\)`)
    );
  }
});

// Test 7: Valid environment spawns child with bounded environment
runTest('valid_environment_spawns_child_with_bounded_env_and_state_dir', () => {
  const { mockSpawn, calls } = createMockSpawner();
  const testEnv = {
    PATH: '/usr/local/bin:/usr/bin:/bin',
    NODE_ENV: 'development',
    MC_INTA_ENABLE: '1',
    MC_INTA_GO_BASE_URL: 'http://127.0.0.1:18086',
    MC_INTA_STATE_DIR: '/tmp/test_state_123',
    SECRET_KEY_UNLEAKED: 'dont_pass_me',
    PORT: '18085',
    HOME: '/tmp/fakehome',
    SHELL: '/bin/bash',
    TMPDIR: '/tmp/faketmp',
  };

  const res = launchHarness({
    env: testEnv,
    spawnFn: mockSpawn,
  });

  assert.equal(res.success, true);
  assert.equal(res.spawnCalled, true);
  assert.equal(calls.length, 1);

  const spawnCall = calls[0];
  assert.equal(spawnCall.options.env.PATH, '/usr/local/bin:/usr/bin:/bin');
  assert.equal(spawnCall.options.env.NODE_ENV, 'development');
  assert.equal(spawnCall.options.env.MC_INTA_STATE_DIR, '/tmp/test_state_123');
  assert.equal(spawnCall.options.env.PORT, '18085');
  assert.equal(spawnCall.options.env.SHELL, '/bin/bash');
  assert.equal(spawnCall.options.env.TMPDIR, '/tmp/faketmp');
  assert.equal(spawnCall.options.env.SECRET_KEY_UNLEAKED, undefined);
});

// Test 8: Bounded environment allowlist strictly filters unknown keys
runTest('bounded_environment_strict_allowlist_includes_state_dir', () => {
  const dirtyEnv = {
    PATH: '/bin:/usr/bin',
    NODE_ENV: 'development',
    MC_INTA_STATE_DIR: '/private/tmp/state',
    LEAKY_SECRET_TOKEN: 'secret_123',
    DATABASE_PASS: 'pw456',
    PORT: '18085',
    SHELL: '/bin/zsh',
    TMPDIR: '/tmp/custom_tmp',
  };

  const clean = buildBoundedEnvironment(dirtyEnv);
  assert.equal(clean.PATH, '/bin:/usr/bin');
  assert.equal(clean.NODE_ENV, 'development');
  assert.equal(clean.MC_INTA_STATE_DIR, '/private/tmp/state');
  assert.equal(clean.PORT, '18085');
  assert.equal(clean.SHELL, '/bin/zsh');
  assert.equal(clean.TMPDIR, '/tmp/custom_tmp');
  assert.equal(clean.LEAKY_SECRET_TOKEN, undefined);
  assert.equal(clean.DATABASE_PASS, undefined);
});

// Test 9: isCliEntry supports both relative and absolute paths without OR-fallback (R3-N06)
runTest('is_cli_entry_detection_relative_and_absolute', () => {
  const currentUrl = import.meta.url;
  const currentFile = fileURLToPath(currentUrl);

  // Exact absolute path
  assert.ok(isCliEntry(currentFile, currentUrl));

  // Exact relative path computed from cwd without OR-fallback
  const relPath = path.relative(process.cwd(), currentFile);
  assert.ok(isCliEntry(relPath, currentUrl), `Relative path ${relPath} must resolve to current module`);
  assert.ok(isCliEntry(`./${relPath}`, currentUrl), `Prefixed relative path ./${relPath} must resolve to current module`);

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
      return true;
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

// Test 11: verifyGuardIntegrity passes on valid guard and fails on mismatch (NF-3)
runTest('guard_integrity_verification', () => {
  // Valid guard path passes
  assert.ok(verifyGuardIntegrity(DEFAULT_GUARD_PATH, EXPECTED_GUARD_SHA256));

  // Missing path throws
  assert.throws(
    () => verifyGuardIntegrity('/tmp/non_existent_guard.ts', EXPECTED_GUARD_SHA256),
    /Guard integrity failure: file not found/
  );

  // Mismatched hash throws
  assert.throws(
    () => verifyGuardIntegrity(DEFAULT_GUARD_PATH, 'badhash0000000000000000000000000000000000000000000000000000000000'),
    /Guard integrity mismatch/
  );
});

// Test 12: forwardSignal surfaces errors and doesn't swallow them (R3-N05, R2-I05)
runTest('signal_forwarding_surfaces_failures', () => {
  const stderrMsgs = [];
  const mockChild = {
    on: () => {},
    kill: (sig) => false, // simulates kill returning false
  };
  const mockProcess = {
    stderr: { write: (msg) => stderrMsgs.push(msg) },
    on: (evt, handler) => {
      if (evt === 'SIGTERM') handler();
    },
    exit: () => {},
  };
  attachChildLifecycle(mockChild, mockProcess);
  assert.ok(stderrMsgs.some((m) => m.includes('Signal delivery failed for SIGTERM')));
});

// Test 13: launchHarness passes explicit stateDir and cwd bindings (R3-N02, NF-1)
runTest('launch_harness_explicit_bindings', () => {
  const { mockSpawn, calls } = createMockSpawner();
  const testEnv = {
    PATH: '/bin:/usr/bin',
    NODE_ENV: 'development',
    MC_INTA_ENABLE: '1',
    MC_INTA_GO_BASE_URL: 'http://127.0.0.1:18086',
  };
  const res = launchHarness({
    env: testEnv,
    spawnFn: mockSpawn,
    stateDir: '/tmp/test-state-dir',
    nextBin: '/tmp/test/bin/next',
    cwd: '/tmp/test-harness',
  });
  assert.equal(res.success, true);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].bin, '/tmp/test/bin/next');
  assert.equal(calls[0].options.cwd, '/tmp/test-harness');
  assert.equal(calls[0].options.env.MC_INTA_STATE_DIR, '/tmp/test-state-dir');
});

console.log('================================================================');
console.log(`SUMMARY: ${passed} PASS / ${failed} FAIL out of ${passed + failed} cases`);
console.log('================================================================');

if (failed > 0) {
  process.exit(1);
}
