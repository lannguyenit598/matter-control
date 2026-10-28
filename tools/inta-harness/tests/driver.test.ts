import { describe, expect, it, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { spawnSync, spawn } from 'node:child_process'
import {
  HarnessDriver,
  generateRunId,
  validateRunId,
  assertNoRunIdCollision,
  CANONICAL_36_LOGICAL_IDS,
  UUIDV7_LOWERCASE_REGEX,
} from '../src/driver.js'
import type { HarnessEnvelope } from '../src/envelope.js'

describe('HarnessDriver (INTA-FE-R02)', () => {
  const testStateDir = path.join(process.cwd(), '.test-driver-state')
  const testEvidenceDir = path.join(process.cwd(), '.test-driver-evidence')

  beforeEach(() => {
    fs.mkdirSync(testStateDir, { recursive: true })
    fs.mkdirSync(testEvidenceDir, { recursive: true })
  })

  afterEach(() => {
    try {
      fs.rmSync(testStateDir, { recursive: true, force: true })
      fs.rmSync(testEvidenceDir, { recursive: true, force: true })
    } catch {}
  })

  it('generates valid 8-32 alphanumeric runId', () => {
    const runId = generateRunId()
    expect(validateRunId(runId)).toBe(true)
    expect(runId.length).toBeGreaterThanOrEqual(8)
    expect(runId.length).toBeLessThanOrEqual(32)
    expect(/^[a-zA-Z0-9]+$/.test(runId)).toBe(true)
  })

  it('refuses collision when evidence folder for runId already exists (R02)', () => {
    const existingRunId = 'existingrun1234'
    const collisionDir = path.join(testEvidenceDir, 'frontend', existingRunId)
    fs.mkdirSync(collisionDir, { recursive: true })

    expect(() =>
      assertNoRunIdCollision(existingRunId, testEvidenceDir, testStateDir),
    ).toThrow(/RunId collision refused: existing evidence found/)
  })

  it('contains all 36 required canonical logical IDs', () => {
    expect(CANONICAL_36_LOGICAL_IDS).toHaveLength(36)
    // Check key required IDs
    expect(CANONICAL_36_LOGICAL_IDS).toContain('INT-ENV-01')
    expect(CANONICAL_36_LOGICAL_IDS).toContain('INT-ENV-05')
    expect(CANONICAL_36_LOGICAL_IDS).toContain('INT-ENV-06')
    expect(CANONICAL_36_LOGICAL_IDS).toContain('INT-ENV-07')
    expect(CANONICAL_36_LOGICAL_IDS).toContain('T1')
    expect(CANONICAL_36_LOGICAL_IDS).toContain('T2')
    expect(CANONICAL_36_LOGICAL_IDS).toContain('T5')
    expect(CANONICAL_36_LOGICAL_IDS).toContain('T8')
    expect(CANONICAL_36_LOGICAL_IDS).toContain('T9')
    expect(CANONICAL_36_LOGICAL_IDS).toContain('T10')
    expect(CANONICAL_36_LOGICAL_IDS).toContain('T11a')
    expect(CANONICAL_36_LOGICAL_IDS).toContain('T11b')
    expect(CANONICAL_36_LOGICAL_IDS).toContain('T11c')
    expect(CANONICAL_36_LOGICAL_IDS).toContain('T12')
    expect(CANONICAL_36_LOGICAL_IDS).toContain('W1')
    expect(CANONICAL_36_LOGICAL_IDS).toContain('W9')
    expect(CANONICAL_36_LOGICAL_IDS).toContain('W11')
    expect(CANONICAL_36_LOGICAL_IDS).toContain('INT-PERS-01')
    expect(CANONICAL_36_LOGICAL_IDS).toContain('INT-PERS-02')
    expect(CANONICAL_36_LOGICAL_IDS).toContain('INT-PERS-03')
    expect(CANONICAL_36_LOGICAL_IDS).toContain('INT-PERS-04')
    expect(CANONICAL_36_LOGICAL_IDS).toContain('INT-COR-01')
    expect(CANONICAL_36_LOGICAL_IDS).toContain('INT-PRIV-01')
    expect(CANONICAL_36_LOGICAL_IDS).toContain('INT-ISO-01')
    expect(CANONICAL_36_LOGICAL_IDS).toContain('INT-ISO-02')
    expect(CANONICAL_36_LOGICAL_IDS).toContain('INT-ISO-03')
    expect(CANONICAL_36_LOGICAL_IDS).toContain('INT-CONF-01')
  })

  it('records Checkpoint A from valid T1 envelope and verifies RFC 3339 UTC timestamps (R01, R02)', () => {
    const driver = new HarnessDriver('drivertest123', testStateDir)
    const validT1Envelope: HarnessEnvelope = {
      runId: 'drivertest123',
      caseId: 'T1',
      requestId: 'mc-int-drivertest123-T1-1',
      mode: 'app-client',
      method: 'POST',
      routeTemplate: '/api/v1/users',
      startedAtUTC: '2026-10-25T03:00:00Z',
      latencyMs: 15,
      actualNextVersion: '16.4.2',
      harnessRevision: 'e25bbc6933264fc46a729e6a364a3bfa02d8038f',
      outcome: 'value',
      classification: 'success',
      value: {
        id: '0192e23b-6e9f-7b71-91ea-42b7e199db1c',
        email: 'inta-a-drivertest123@example.test',
        name: 'INTA_A_INITIAL',
        version: 1,
        created_at: '2026-10-25T03:00:00.123456Z',
        updated_at: '2026-10-25T03:00:00.123456Z',
      },
      apiError: null,
      wire: null,
      truncated: false,
    }

    const cp = driver.assertT1(validT1Envelope)
    expect(cp.id).toBe('0192e23b-6e9f-7b71-91ea-42b7e199db1c')
    expect(cp.version).toBe(1)
    expect(driver.state.assertions.get('T1')?.pass).toBe(true)

    // T2 assertion
    const validT2Envelope: HarnessEnvelope = {
      ...validT1Envelope,
      caseId: 'T2',
      requestId: 'mc-int-drivertest123-T2-1',
      method: 'GET',
      routeTemplate: '/api/v1/users/{id}',
    }
    expect(() => driver.assertT2(validT2Envelope)).not.toThrow()
    expect(driver.state.assertions.get('T2')?.pass).toBe(true)
  })

  it('blocks assertion acceptance when evidence is truncated (R05)', () => {
    const driver = new HarnessDriver('truncatetest1', testStateDir)
    const truncatedEnvelope: HarnessEnvelope = {
      runId: 'truncatetest1',
      caseId: 'T1',
      requestId: 'mc-int-truncatetest1-T1-1',
      mode: 'app-client',
      method: 'POST',
      routeTemplate: '/api/v1/users',
      startedAtUTC: '2026-10-25T03:00:00Z',
      latencyMs: 15,
      actualNextVersion: '16.4.2',
      harnessRevision: 'e25bbc6933264fc46a729e6a364a3bfa02d8038f',
      outcome: 'value',
      classification: 'success',
      value: 'truncated-string-content',
      apiError: null,
      wire: null,
      truncated: true,
    }

    expect(() => driver.assertT1(truncatedEnvelope)).toThrow(/T1 assertion blocked: envelope body was truncated/)
    expect(driver.state.assertions.get('T1')?.blocked).toBe(true)
  })

  it('pauses safely for upstream coordination before execution', () => {
    const driver = new HarnessDriver('pausetest123', testStateDir)
    driver.pauseForUpstreamCoordination(false)
    expect(driver.state.phase).toBe('PAUSED_WAITING_ENV')

    driver.pauseForUpstreamCoordination(true)
    expect(driver.state.phase).toBe('ENV_COORDINATED_READY')
  })

  it('validates UUIDv7 version digit and variant strictly (F01)', () => {
    // Valid UUIDv7 (version 7, variant 8, 9, a, or b)
    expect(UUIDV7_LOWERCASE_REGEX.test('0192e23b-6e9f-7b71-91ea-42b7e199db1c')).toBe(true)
    // Invalid: version 4
    expect(UUIDV7_LOWERCASE_REGEX.test('0192e23b-6e9f-4b71-91ea-42b7e199db1c')).toBe(false)
    // Invalid: uppercase
    expect(UUIDV7_LOWERCASE_REGEX.test('0192E23B-6E9F-7B71-91EA-42B7E199DB1C')).toBe(false)
  })

  it('refuses T1 when email or name does not match fixture A (F01)', () => {
    const driver = new HarnessDriver('fixtest1234', testStateDir)
    const baseEnvelope: HarnessEnvelope = {
      runId: 'fixtest1234',
      caseId: 'T1',
      requestId: 'mc-int-fixtest1234-T1-1',
      mode: 'app-client',
      method: 'POST',
      routeTemplate: '/api/v1/users',
      startedAtUTC: '2026-10-25T03:00:00Z',
      latencyMs: 15,
      actualNextVersion: '16.4.2',
      harnessRevision: '6e2f65b51e7ead3c84274e717f8f3bcaeccf9b91',
      outcome: 'value',
      classification: 'success',
      value: {
        id: '0192e23b-6e9f-7b71-91ea-42b7e199db1c',
        email: 'wrong-email@example.test',
        name: 'INTA_A_INITIAL',
        version: 1,
        created_at: '2026-10-25T03:00:00.000Z',
        updated_at: '2026-10-25T03:00:00.000Z',
      },
      apiError: null,
      wire: null,
      truncated: false,
    }

    expect(() => driver.assertT1(baseEnvelope)).toThrow(/email mismatch vs fixture A/)

    // Wrong name
    const wrongNameEnv: HarnessEnvelope = {
      ...baseEnvelope,
      value: {
        ...(baseEnvelope.value as any),
        email: 'inta-a-fixtest1234@example.test',
        name: 'WRONG_NAME',
      },
    }
    expect(() => driver.assertT1(wrongNameEnv)).toThrow(/name mismatch vs fixture A/)
  })

  it('enforces write-once envelope persistence and refuses duplicate mutation replay (F01)', () => {
    const driver = new HarnessDriver('wronce12345', testStateDir)
    const dummyEnvelope: HarnessEnvelope = {
      runId: 'wronce12345',
      caseId: 'T1',
      requestId: 'mc-int-wronce12345-T1-1',
      mode: 'app-client',
      method: 'POST',
      routeTemplate: '/api/v1/users',
      startedAtUTC: '2026-10-25T03:00:00Z',
      latencyMs: 10,
      actualNextVersion: '16.4.2',
      harnessRevision: '6e2f65b51e7ead3c84274e717f8f3bcaeccf9b91',
      outcome: 'value',
      classification: 'success',
      value: { id: '0192e23b-6e9f-7b71-91ea-42b7e199db1c' },
      apiError: null,
      wire: null,
      truncated: false,
    }

    // First write succeeds
    expect(() => driver.persistEnvelope('T1', [dummyEnvelope])).not.toThrow()

    // Idempotent byte-equal write succeeds without error
    expect(() => driver.persistEnvelope('T1', [dummyEnvelope])).not.toThrow()

    // Conflicting duplicate execution throws refusal
    const conflictingEnv: HarnessEnvelope = {
      ...dummyEnvelope,
      requestId: 'mc-int-wronce12345-T1-2', // Different requestId
    }
    expect(() => driver.persistEnvelope('T1', [conflictingEnv])).toThrow(
      /Duplicate case execution refused by write-once ledger: T1 already executed/,
    )
  })

  it('persists and restores durable checkpoints across restarts (F01)', () => {
    const runId = 'durable12345'
    const driver1 = new HarnessDriver(runId, testStateDir)

    const validT1Envelope: HarnessEnvelope = {
      runId,
      caseId: 'T1',
      requestId: `mc-int-${runId}-T1-1`,
      mode: 'app-client',
      method: 'POST',
      routeTemplate: '/api/v1/users',
      startedAtUTC: '2026-10-25T03:00:00Z',
      latencyMs: 15,
      actualNextVersion: '16.4.2',
      harnessRevision: '6e2f65b51e7ead3c84274e717f8f3bcaeccf9b91',
      outcome: 'value',
      classification: 'success',
      value: {
        id: '0192e23b-6e9f-7b71-91ea-42b7e199db1c',
        email: `inta-a-${runId}@example.test`,
        name: 'INTA_A_INITIAL',
        version: 1,
        created_at: '2026-10-25T03:00:00.123456Z',
        updated_at: '2026-10-25T03:00:00.123456Z',
      },
      apiError: null,
      wire: null,
      truncated: false,
    }

    driver1.assertT1(validT1Envelope)
    expect(driver1.state.checkpointA?.version).toBe(1)

    // Checkpoint file should exist on disk
    const cpFile = path.join(testStateDir, 'checkpoints', `${runId}.json`)
    expect(fs.existsSync(cpFile)).toBe(true)

    // Second driver instance simulating reload / resume (with allowResume=true)
    const driver2 = new HarnessDriver(runId, testStateDir, true)
    expect(driver2.state.checkpointA).not.toBeNull()
    expect(driver2.state.checkpointA?.id).toBe('0192e23b-6e9f-7b71-91ea-42b7e199db1c')
    expect(driver2.state.checkpointA?.version).toBe(1)
  })

  it('asserts T9 mutation and updates checkpoint to version 2 (F01)', () => {
    const runId = 't9mutation12'
    const driver = new HarnessDriver(runId, testStateDir)
    driver.state.checkpointA = {
      id: '0192e23b-6e9f-7b71-91ea-42b7e199db1c',
      email: `inta-a-${runId}@example.test`,
      name: 'INTA_A_INITIAL',
      version: 1,
      created_at: '2026-10-25T03:00:00Z',
      updated_at: '2026-10-25T03:00:00Z',
    }

    const t9Envelope: HarnessEnvelope = {
      runId,
      caseId: 'T9',
      requestId: `mc-int-${runId}-T9-1`,
      mode: 'app-client',
      method: 'PATCH',
      routeTemplate: '/api/v1/users/{id}',
      startedAtUTC: '2026-10-25T03:05:00Z',
      latencyMs: 12,
      actualNextVersion: '16.4.2',
      harnessRevision: '6e2f65b51e7ead3c84274e717f8f3bcaeccf9b91',
      outcome: 'value',
      classification: 'success',
      value: {
        id: '0192e23b-6e9f-7b71-91ea-42b7e199db1c',
        email: `inta-a-${runId}@example.test`,
        name: 'INTA_A_UPDATED',
        version: 2,
        created_at: '2026-10-25T03:00:00Z',
        updated_at: '2026-10-25T03:05:00Z',
      },
      apiError: null,
      wire: null,
      truncated: false,
    }

    const updatedCp = driver.assertT9(t9Envelope)
    expect(updatedCp.version).toBe(2)
    expect(updatedCp.name).toBe('INTA_A_UPDATED')
    expect(driver.state.checkpointA?.version).toBe(2)
  })

  it('asserts T11a native 503 problem details and marks T11c OUTCOME_UNKNOWN (F01)', () => {
    const runId = 'outagetest12'
    const driver = new HarnessDriver(runId, testStateDir)

    const t11aEnvelope: HarnessEnvelope = {
      runId,
      caseId: 'T11a',
      requestId: `mc-int-${runId}-T11a-1`,
      mode: 'app-client',
      method: 'GET',
      routeTemplate: '/api/v1/users/{id}',
      startedAtUTC: '2026-10-25T03:10:00Z',
      latencyMs: 5,
      actualNextVersion: '16.4.2',
      harnessRevision: '6e2f65b51e7ead3c84274e717f8f3bcaeccf9b91',
      outcome: 'apiError',
      classification: 'unavailable',
      value: null,
      apiError: {
        status: 503,
        code: 'HTTP_ERROR',
        message: 'service temporarily unavailable',
        details: {
          type: '/problems/unavailable',
          title: 'Service Unavailable',
          status: 503,
          detail: 'service temporarily unavailable',
          retryAfter: 1,
        },
      },
      wire: null,
      truncated: false,
    }

    expect(() => driver.assertT11a(t11aEnvelope)).not.toThrow()
    expect(driver.state.assertions.get('T11a')?.pass).toBe(true)

    // T11c: POST X during PG outage
    const t11cEnvelope: HarnessEnvelope = {
      ...t11aEnvelope,
      caseId: 'T11c',
      requestId: `mc-int-${runId}-T11c-1`,
      method: 'POST',
      routeTemplate: '/api/v1/users',
    }
    driver.assertT11c(t11cEnvelope)
    expect(driver.state.userXOutcome).toBe('OUTCOME_UNKNOWN')
  })

  it('refuses collision when counters.json has runId entry (F02)', () => {
    const runId = 'collisionRun123'
    const countersPath = path.join(testStateDir, 'counters.json')
    fs.writeFileSync(countersPath, JSON.stringify({ [runId]: 10 }), 'utf-8')

    expect(() =>
      assertNoRunIdCollision(runId, testEvidenceDir, testStateDir),
    ).toThrow(/RunId collision refused: existing counter found/)
  })

  it('enforces causal stage ordering: stage N requires stage N-1 completed (R2-F01)', async () => {
    const driver = new HarnessDriver('stageordertest', testStateDir)

    // Stage 2 cannot run before Stage 1
    await expect(driver.runStage(2, { confirmGoRestarted: true })).rejects.toThrow(
      /Stage 2 order violation: Stage 1 must be completed first/,
    )

    // Stage 3 cannot run before Stage 2
    await expect(driver.runStage(3, { confirmPgRestarted: true })).rejects.toThrow(
      /Stage 3 order violation: Stage 2 must be completed first/,
    )

    // Stage 4 cannot run before Stage 3
    await expect(driver.runStage(4)).rejects.toThrow(
      /Stage 4 order violation: Stage 3 must be completed first/,
    )

    // Stage 5 cannot run before Stage 4
    await expect(driver.runStage(5, { confirmPgStopped: true })).rejects.toThrow(
      /Stage 5 order violation: Stage 4 must be completed first/,
    )

    // Stage 6 cannot run before Stage 5
    await expect(driver.runStage(6, { confirmPgRecovered: true })).rejects.toThrow(
      /Stage 6 order violation: Stage 5 must be completed first/,
    )

    // Stage 7 cannot run before Stage 6
    await expect(driver.runStage(7, { confirmGoStopped: true })).rejects.toThrow(
      /Stage 7 order violation: Stage 6 must be completed first/,
    )
  })

  it('enforces explicit operator confirmation barriers before restart-dependent stages (R2-F01)', async () => {
    const driver = new HarnessDriver('confirmgates', testStateDir)
    // Mark stage 1 completed
    driver.markStageCompleted(1)
    driver.state.checkpointABaseline = {
      id: '0192e23b-6e9f-7b71-91ea-42b7e199db1c',
      email: 'inta-a-confirmgates@example.test',
      name: 'INTA_A_INITIAL',
      version: 1,
      created_at: '2026-10-25T03:00:00Z',
      updated_at: '2026-10-25T03:00:00Z',
    }

    // Stage 2 without --confirm-go-restarted pauses safely with 0 dispatches
    const r2 = await driver.runStage(2)
    expect(r2.ok).toBe(false)
    expect(r2.reason).toBe('PAUSED_WAITING_GO_RESTART_CONFIRMATION')
    expect(r2.executedCases).toHaveLength(0)

    // Mark stage 2 completed
    driver.markStageCompleted(2)
    // Stage 3 without --confirm-pg-restarted pauses safely with 0 dispatches
    const r3 = await driver.runStage(3)
    expect(r3.ok).toBe(false)
    expect(r3.reason).toBe('PAUSED_WAITING_PG_RESTART_CONFIRMATION')
    expect(r3.executedCases).toHaveLength(0)

    // Mark stage 4 completed
    driver.markStageCompleted(3)
    driver.markStageCompleted(4)
    driver.state.checkpointACurrent = { ...driver.state.checkpointABaseline, version: 2 }
    // Stage 5 without --confirm-pg-stopped pauses safely
    const r5 = await driver.runStage(5)
    expect(r5.ok).toBe(false)
    expect(r5.reason).toBe('PAUSED_WAITING_PG_STOP_CONFIRMATION')

    // Mark stage 5 completed
    driver.markStageCompleted(5)
    // Stage 6 without --confirm-pg-recovered pauses safely
    const r6 = await driver.runStage(6)
    expect(r6.ok).toBe(false)
    expect(r6.reason).toBe('PAUSED_WAITING_PG_RECOVERY_CONFIRMATION')

    // Mark stage 6 completed
    driver.markStageCompleted(6)
    // Stage 7 without --confirm-go-stopped pauses safely
    const r7 = await driver.runStage(7)
    expect(r7.ok).toBe(false)
    expect(r7.reason).toBe('PAUSED_WAITING_GO_STOP_CONFIRMATION')
  })

  it('reserves one-shot intent before dispatch and refuses replay of started/completed/unknown cases (R2-F02)', () => {
    const runId = 'intentguard1'
    const driver = new HarnessDriver(runId, testStateDir)

    // Reserving fresh case succeeds
    expect(() => driver.reserveSubstepIntent('T1')).not.toThrow()

    // Reserving an already started case throws refusal
    expect(() => driver.reserveSubstepIntent('T1')).toThrow(
      /Dispatch refused by one-shot intent guard: case T1 is already started/,
    )

    // Completing case
    driver.completeSubstepIntent('T1', 'completed')

    // Attempting to re-reserve completed case throws refusal
    expect(() => driver.reserveSubstepIntent('T1')).toThrow(
      /Dispatch refused by one-shot intent guard: case T1 is already completed/,
    )

    // T11c marked unknown
    driver.reserveSubstepIntent('T11c')
    driver.completeSubstepIntent('T11c', 'unknown')

    // Attempting to re-reserve T11c throws refusal (never retry unknown X)
    expect(() => driver.reserveSubstepIntent('T11c')).toThrow(
      /Dispatch refused by one-shot intent guard: case T11c is already unknown/,
    )
  })

  it('fails closed when substep intent status is corrupt or shape-invalid (R2-F02, R3-F01)', () => {
    const runId = 'corruptintent'
    const driver = new HarnessDriver(runId, testStateDir)
    const statusFile = path.join(driver.substepsDir, 'T1.status')

    // Syntax error JSON
    fs.writeFileSync(statusFile, '{ corrupt json !!!', 'utf-8')
    expect(() => driver.reserveSubstepIntent('T1')).toThrow(/Fail-closed: unreadable or corrupt substep status/)

    // Shape-invalid but parseable JSON: {} (Codex counterexample)
    fs.writeFileSync(statusFile, '{}', 'utf-8')
    expect(() => driver.reserveSubstepIntent('T1')).toThrow(
      /Fail-closed: existing intent file already present with unrecognized state or shape/,
    )

    // Unrecognized state
    fs.writeFileSync(statusFile, JSON.stringify({ caseId: 'T1', state: 'garbage' }), 'utf-8')
    expect(() => driver.reserveSubstepIntent('T1')).toThrow(
      /Fail-closed: existing intent file already present with unrecognized state or shape/,
    )

    // Mismatched caseId
    fs.writeFileSync(statusFile, JSON.stringify({ caseId: 'WRONG_CASE', state: 'started' }), 'utf-8')
    expect(() => driver.reserveSubstepIntent('T1')).toThrow(
      /Fail-closed: existing intent file already present with unrecognized state or shape/,
    )

    // Non-object JSON
    fs.writeFileSync(statusFile, 'null', 'utf-8')
    expect(() => driver.reserveSubstepIntent('T1')).toThrow(
      /Fail-closed: existing intent file already present with unrecognized state or shape/,
    )
  })

  it('asserts wire x-request-id echo strictly and fails on missing or mismatched header (R2-F06)', () => {
    const driver = new HarnessDriver('echotest1', testStateDir)
    const validW1Envelope: HarnessEnvelope = {
      runId: 'echotest1',
      caseId: 'W1',
      requestId: 'mc-int-echotest1-W1-1',
      mode: 'wire',
      method: 'POST',
      routeTemplate: '/api/v1/users',
      startedAtUTC: '2026-10-25T03:00:00Z',
      latencyMs: 15,
      actualNextVersion: '16.4.2',
      harnessRevision: '79322fcb2c72bb3db20d55f3f3fc860e7e7ee2dc',
      outcome: 'value',
      classification: 'success',
      value: { id: '0192e23b-6e9f-7b71-91ea-42b7e199db1c' },
      apiError: null,
      wire: {
        status: 201,
        headers: {
          location: '/api/v1/users/0192e23b-6e9f-7b71-91ea-42b7e199db1c',
          etag: '"1"',
          'content-type': 'application/json',
          'x-request-id': 'mc-int-echotest1-W1-1', // Correct echo
        },
      },
      truncated: false,
    }

    // Matching echo succeeds
    expect(() => driver.assertW1(validW1Envelope)).not.toThrow()

    // Mismatched echo throws
    const mismatchedEchoEnv: HarnessEnvelope = {
      ...validW1Envelope,
      wire: {
        ...validW1Envelope.wire!,
        headers: {
          ...validW1Envelope.wire!.headers!,
          'x-request-id': 'wrong-request-id',
        },
      },
    }
    expect(() => driver.assertW1(mismatchedEchoEnv)).toThrow(/wire x-request-id echo mismatch/)

    // Missing echo throws
    const missingEchoEnv: HarnessEnvelope = {
      ...validW1Envelope,
      wire: {
        ...validW1Envelope.wire!,
        headers: {
          location: '/api/v1/users/0192e23b-6e9f-7b71-91ea-42b7e199db1c',
          etag: '"1"',
          'content-type': 'application/json',
          // x-request-id omitted
        },
      },
    }
    expect(() => driver.assertW1(missingEchoEnv)).toThrow(/wire x-request-id echo mismatch/)
  })

  it('preflight allows resume for existing same-run assets, but fails closed on corrupt counters (R2-F03)', () => {
    const runId = 'resumepreflight'
    const evDir = path.join(testEvidenceDir, 'frontend', runId)
    fs.mkdirSync(evDir, { recursive: true })

    // allowResume=false refuses collision
    expect(() => assertNoRunIdCollision(runId, testEvidenceDir, testStateDir, false)).toThrow(
      /RunId collision refused: existing evidence found/,
    )

    // allowResume=true succeeds
    expect(() => assertNoRunIdCollision(runId, testEvidenceDir, testStateDir, true)).not.toThrow()

    // Corrupt counters.json throws fail-closed even with allowResume=true
    const countersPath = path.join(testStateDir, 'counters.json')
    fs.writeFileSync(countersPath, 'corrupt json not valid', 'utf-8')
    expect(() => assertNoRunIdCollision(runId, testEvidenceDir, testStateDir, true)).toThrow(
      /Fail-closed: unreadable or corrupt counter state/,
    )
  })

  it('persists durable assertions across driver reload and preserves immutable baseline checkpoint across phases (R2-F07)', () => {
    const runId = 'durableassertions'
    const driver1 = new HarnessDriver(runId, testStateDir)

    const validT1Envelope: HarnessEnvelope = {
      runId,
      caseId: 'T1',
      requestId: `mc-int-${runId}-T1-1`,
      mode: 'app-client',
      method: 'POST',
      routeTemplate: '/api/v1/users',
      startedAtUTC: '2026-10-25T03:00:00Z',
      latencyMs: 15,
      actualNextVersion: '16.4.2',
      harnessRevision: '79322fcb2c72bb3db20d55f3f3fc860e7e7ee2dc',
      outcome: 'value',
      classification: 'success',
      value: {
        id: '0192e23b-6e9f-7b71-91ea-42b7e199db1c',
        email: `inta-a-${runId}@example.test`,
        name: 'INTA_A_INITIAL',
        version: 1,
        created_at: '2026-10-25T03:00:00.123456Z',
        updated_at: '2026-10-25T03:00:00.123456Z',
      },
      apiError: null,
      wire: null,
      truncated: false,
    }

    driver1.assertT1(validT1Envelope)
    expect(driver1.state.checkpointABaseline?.version).toBe(1)
    expect(driver1.state.checkpointACurrent?.version).toBe(1)

    // Perform T9 mutation
    const t9Envelope: HarnessEnvelope = {
      runId,
      caseId: 'T9',
      requestId: `mc-int-${runId}-T9-1`,
      mode: 'app-client',
      method: 'PATCH',
      routeTemplate: '/api/v1/users/{id}',
      startedAtUTC: '2026-10-25T03:05:00Z',
      latencyMs: 12,
      actualNextVersion: '16.4.2',
      harnessRevision: '79322fcb2c72bb3db20d55f3f3fc860e7e7ee2dc',
      outcome: 'value',
      classification: 'success',
      value: {
        id: '0192e23b-6e9f-7b71-91ea-42b7e199db1c',
        email: `inta-a-${runId}@example.test`,
        name: 'INTA_A_UPDATED',
        version: 2,
        created_at: '2026-10-25T03:00:00Z',
        updated_at: '2026-10-25T03:05:00Z',
      },
      apiError: null,
      wire: null,
      truncated: false,
    }
    driver1.assertT9(t9Envelope)

    // Baseline remains immutable at version 1!
    expect(driver1.state.checkpointABaseline?.version).toBe(1)
    expect(driver1.state.checkpointACurrent?.version).toBe(2)

    // Create fresh instance with allowResume=true
    const driver2 = new HarnessDriver(runId, testStateDir, true)
    expect(driver2.state.checkpointABaseline?.version).toBe(1)
    expect(driver2.state.checkpointACurrent?.version).toBe(2)

    // Verify assertions are reloaded
    expect(driver2.state.assertions.size).toBeGreaterThanOrEqual(2)
    expect(driver2.state.assertions.get('T1')?.pass).toBe(true)
    expect(driver2.state.assertions.get('T9')?.pass).toBe(true)
  })

  it('fails closed when stage completion marker is corrupt or truncated (R3-F03)', async () => {
    const driver = new HarnessDriver('corruptmarker', testStateDir)
    const marker3 = path.join(driver.stagesDir, 'stage3.completed')

    // Corrupt JSON
    fs.writeFileSync(marker3, '{ corrupt marker !!!', 'utf-8')
    expect(() => driver.isStageCompleted(3)).toThrow(
      /Fail-closed: unreadable or corrupt stage completion marker for stage 3/,
    )

    // Wrong stage in marker
    fs.writeFileSync(marker3, JSON.stringify({ stage: 99 }), 'utf-8')
    expect(() => driver.isStageCompleted(3)).toThrow(
      /Fail-closed: corrupt stage completion marker for stage 3/,
    )

    // Running Stage 4 with corrupt stage 3 marker throws before any I/O
    await expect(driver.runStage(4)).rejects.toThrow(
      /Fail-closed: corrupt stage completion marker for stage 3/,
    )
  })

  it('fails closed on resume when durable state files are unreadable or corrupt (R3-F03)', () => {
    const runId = 'corruptreaders'
    const driver1 = new HarnessDriver(runId, testStateDir)
    driver1.recordAssertion('T1', true, 'T1 passed')

    // Corrupt assertions/<runId>.json
    const aFile = path.join(driver1.assertionsDir, `${runId}.json`)
    fs.writeFileSync(aFile, '{ corrupt json !!!', 'utf-8')

    expect(() => new HarnessDriver(runId, testStateDir, true)).toThrow(
      /Fail-closed: unreadable or corrupt assertions file/,
    )

    // Assertions file with non-array root
    fs.writeFileSync(aFile, JSON.stringify({ not: 'an array' }), 'utf-8')
    expect(() => new HarnessDriver(runId, testStateDir, true)).toThrow(
      /Fail-closed: corrupt assertions file .* \(expected array of assertions\)/,
    )

    // Restore valid assertions, corrupt checkpointA.baseline.json
    fs.writeFileSync(aFile, JSON.stringify([]), 'utf-8')
    const cpBaseline = path.join(driver1.checkpointDir, 'checkpointA.baseline.json')
    fs.writeFileSync(cpBaseline, '{ corrupt checkpoint !!!', 'utf-8')

    expect(() => new HarnessDriver(runId, testStateDir, true)).toThrow(
      /Fail-closed: unreadable or corrupt baseline checkpoint/,
    )
  })

  it('deterministic fake-transport runner fixture exercises full stage1..7 orchestration in causal order (R3-F04)', async () => {
    const runId = 'faketransport1'
    const driver = new HarnessDriver(runId, testStateDir)

    // Capture all fetch dispatches
    const dispatchCalls: Array<{ caseId: string; refId?: string }> = []

    const originalFetch = global.fetch
    global.fetch = (async (url: any, init: any) => {
      const parsedBody = JSON.parse(init.body)
      const caseId = parsedBody.caseId
      const refId = parsedBody.refId
      dispatchCalls.push({ caseId, refId })

      const fixtureEnvelopes: Record<string, HarnessEnvelope[]> = {
        T1: [
          {
            runId,
            caseId: 'T1',
            requestId: `mc-int-${runId}-T1-1`,
            mode: 'app-client',
            method: 'POST',
            routeTemplate: '/api/v1/users',
            startedAtUTC: '2026-10-25T03:00:00Z',
            latencyMs: 15,
            actualNextVersion: '16.4.2',
            harnessRevision: 'cfec8694799634b05438764aec56858dc26c8764',
            outcome: 'value',
            classification: 'success',
            value: {
              id: '0192e23b-6e9f-7b71-91ea-42b7e199db1c',
              email: `inta-a-${runId}@example.test`,
              name: 'INTA_A_INITIAL',
              version: 1,
              created_at: '2026-10-25T03:00:00.123456Z',
              updated_at: '2026-10-25T03:00:00.123456Z',
            },
            apiError: null,
            wire: null,
            truncated: false,
          },
        ],
        T2: [
          {
            runId,
            caseId: 'T2',
            requestId: `mc-int-${runId}-T2-1`,
            mode: 'app-client',
            method: 'GET',
            routeTemplate: '/api/v1/users/{id}',
            startedAtUTC: '2026-10-25T03:01:00Z',
            latencyMs: 10,
            actualNextVersion: '16.4.2',
            harnessRevision: 'cfec8694799634b05438764aec56858dc26c8764',
            outcome: 'value',
            classification: 'success',
            value: {
              id: '0192e23b-6e9f-7b71-91ea-42b7e199db1c',
              email: `inta-a-${runId}@example.test`,
              name: 'INTA_A_INITIAL',
              version: 1,
              created_at: '2026-10-25T03:00:00.123456Z',
              updated_at: '2026-10-25T03:00:00.123456Z',
            },
            apiError: null,
            wire: null,
            truncated: false,
          },
        ],
        W1: [
          {
            runId,
            caseId: 'W1',
            requestId: `mc-int-${runId}-W1-1`,
            mode: 'wire',
            method: 'POST',
            routeTemplate: '/api/v1/users',
            startedAtUTC: '2026-10-25T03:02:00Z',
            latencyMs: 14,
            actualNextVersion: '16.4.2',
            harnessRevision: 'cfec8694799634b05438764aec56858dc26c8764',
            outcome: 'value',
            classification: 'success',
            value: { id: '0192e23b-6e9f-7b71-91ea-42b7e199db1d' },
            apiError: null,
            wire: {
              status: 201,
              headers: {
                location: '/api/v1/users/0192e23b-6e9f-7b71-91ea-42b7e199db1d',
                etag: '"1"',
                'content-type': 'application/json',
                'x-request-id': `mc-int-${runId}-W1-1`,
              },
            },
            truncated: false,
          },
        ],
        W2: [
          {
            runId,
            caseId: 'W2',
            requestId: `mc-int-${runId}-W2-1`,
            mode: 'wire',
            method: 'GET',
            routeTemplate: '/api/v1/users/{id}',
            startedAtUTC: '2026-10-25T03:03:00Z',
            latencyMs: 11,
            actualNextVersion: '16.4.2',
            harnessRevision: 'cfec8694799634b05438764aec56858dc26c8764',
            outcome: 'value',
            classification: 'success',
            value: {
              id: '0192e23b-6e9f-7b71-91ea-42b7e199db1c',
              email: `inta-a-${runId}@example.test`,
              name: 'INTA_A_INITIAL',
              version: 1,
              created_at: '2026-10-25T03:00:00.123456Z',
              updated_at: '2026-10-25T03:00:00.123456Z',
            },
            apiError: null,
            wire: {
              status: 200,
              headers: {
                etag: '"1"',
                'x-request-id': `mc-int-${runId}-W2-1`,
              },
            },
            truncated: false,
          },
        ],
        T3: [
          {
            runId,
            caseId: 'T3',
            requestId: `mc-int-${runId}-T3-1`,
            mode: 'app-client',
            method: 'GET',
            routeTemplate: '/api/v1/users/{id}',
            startedAtUTC: '2026-10-25T03:04:00Z',
            latencyMs: 8,
            actualNextVersion: '16.4.2',
            harnessRevision: 'cfec8694799634b05438764aec56858dc26c8764',
            outcome: 'apiError',
            classification: 'clientError',
            value: null,
            apiError: { status: 404, code: 'NOT_FOUND', message: 'User not found' },
            wire: null,
            truncated: false,
          },
        ],
        T4: [
          {
            runId,
            caseId: 'T4',
            requestId: `mc-int-${runId}-T4-1`,
            mode: 'app-client',
            method: 'GET',
            routeTemplate: '/api/v1/users/{id}',
            startedAtUTC: '2026-10-25T03:04:10Z',
            latencyMs: 7,
            actualNextVersion: '16.4.2',
            harnessRevision: 'cfec8694799634b05438764aec56858dc26c8764',
            outcome: 'apiError',
            classification: 'clientError',
            value: null,
            apiError: { status: 404, code: 'NOT_FOUND', message: 'User not found' },
            wire: null,
            truncated: false,
          },
          {
            runId,
            caseId: 'T4',
            requestId: `mc-int-${runId}-T4-2`,
            mode: 'app-client',
            method: 'GET',
            routeTemplate: '/api/v1/users/{id}',
            startedAtUTC: '2026-10-25T03:04:11Z',
            latencyMs: 7,
            actualNextVersion: '16.4.2',
            harnessRevision: 'cfec8694799634b05438764aec56858dc26c8764',
            outcome: 'apiError',
            classification: 'clientError',
            value: null,
            apiError: { status: 404, code: 'NOT_FOUND', message: 'User not found' },
            wire: null,
            truncated: false,
          },
        ],
        T5: [
          {
            runId,
            caseId: 'T5',
            requestId: `mc-int-${runId}-T5-1`,
            mode: 'app-client',
            method: 'POST',
            routeTemplate: '/api/v1/users',
            startedAtUTC: '2026-10-25T03:04:20Z',
            latencyMs: 9,
            actualNextVersion: '16.4.2',
            harnessRevision: 'cfec8694799634b05438764aec56858dc26c8764',
            outcome: 'apiError',
            classification: 'clientError',
            value: null,
            apiError: { status: 422, code: 'VALIDATION_ERROR', message: 'Validation failed' },
            wire: null,
            truncated: false,
          },
          {
            runId,
            caseId: 'T5',
            requestId: `mc-int-${runId}-T5-2`,
            mode: 'app-client',
            method: 'GET',
            routeTemplate: '/api/v1/users/{id}',
            startedAtUTC: '2026-10-25T03:04:21Z',
            latencyMs: 8,
            actualNextVersion: '16.4.2',
            harnessRevision: 'cfec8694799634b05438764aec56858dc26c8764',
            outcome: 'value',
            classification: 'success',
            value: {
              id: '0192e23b-6e9f-7b71-91ea-42b7e199db1c',
              email: `inta-a-${runId}@example.test`,
              name: 'INTA_A_INITIAL',
              version: 1,
              created_at: '2026-10-25T03:00:00.123456Z',
              updated_at: '2026-10-25T03:00:00.123456Z',
            },
            apiError: null,
            wire: null,
            truncated: false,
          },
        ],
        T8: [
          {
            runId,
            caseId: 'T8',
            requestId: `mc-int-${runId}-T8-1`,
            mode: 'app-client',
            method: 'POST',
            routeTemplate: '/api/v1/users',
            startedAtUTC: '2026-10-25T03:04:30Z',
            latencyMs: 9,
            actualNextVersion: '16.4.2',
            harnessRevision: 'cfec8694799634b05438764aec56858dc26c8764',
            outcome: 'apiError',
            classification: 'clientError',
            value: null,
            apiError: { status: 409, code: 'HTTP_ERROR', message: 'Conflict' },
            wire: null,
            truncated: false,
          },
          {
            runId,
            caseId: 'T8',
            requestId: `mc-int-${runId}-T8-2`,
            mode: 'app-client',
            method: 'GET',
            routeTemplate: '/api/v1/users/{id}',
            startedAtUTC: '2026-10-25T03:04:31Z',
            latencyMs: 8,
            actualNextVersion: '16.4.2',
            harnessRevision: 'cfec8694799634b05438764aec56858dc26c8764',
            outcome: 'value',
            classification: 'success',
            value: {
              id: '0192e23b-6e9f-7b71-91ea-42b7e199db1c',
              email: `inta-a-${runId}@example.test`,
              name: 'INTA_A_INITIAL',
              version: 1,
              created_at: '2026-10-25T03:00:00.123456Z',
              updated_at: '2026-10-25T03:00:00.123456Z',
            },
            apiError: null,
            wire: null,
            truncated: false,
          },
        ],
        W3: [
          {
            runId,
            caseId: 'W3',
            requestId: `mc-int-${runId}-W3-1`,
            mode: 'wire',
            method: 'GET',
            routeTemplate: '/api/v1/users/{id}',
            startedAtUTC: '2026-10-25T03:04:40Z',
            latencyMs: 10,
            actualNextVersion: '16.4.2',
            harnessRevision: 'cfec8694799634b05438764aec56858dc26c8764',
            outcome: 'value',
            classification: 'clientError',
            value: null,
            apiError: null,
            wire: {
              status: 404,
              headers: {
                'content-type': 'application/problem+json',
                'x-request-id': `mc-int-${runId}-W3-1`,
              },
            },
            truncated: false,
          },
        ],
        'T6-W': [
          {
            runId,
            caseId: 'T6-W',
            requestId: `mc-int-${runId}-T6-W-1`,
            mode: 'wire',
            method: 'POST',
            routeTemplate: '/api/v1/users',
            startedAtUTC: '2026-10-25T03:04:50Z',
            latencyMs: 8,
            actualNextVersion: '16.4.2',
            harnessRevision: 'cfec8694799634b05438764aec56858dc26c8764',
            outcome: 'value',
            classification: 'clientError',
            value: null,
            apiError: null,
            wire: {
              status: 400,
              headers: {
                'content-type': 'application/problem+json',
                'x-request-id': `mc-int-${runId}-T6-W-1`,
              },
            },
            truncated: false,
          },
        ],
        'T7-W': [
          {
            runId,
            caseId: 'T7-W',
            requestId: `mc-int-${runId}-T7-W-1`,
            mode: 'wire',
            method: 'POST',
            routeTemplate: '/api/v1/users',
            startedAtUTC: '2026-10-25T03:04:55Z',
            latencyMs: 8,
            actualNextVersion: '16.4.2',
            harnessRevision: 'cfec8694799634b05438764aec56858dc26c8764',
            outcome: 'value',
            classification: 'clientError',
            value: null,
            apiError: null,
            wire: {
              status: 415,
              headers: {
                'content-type': 'application/problem+json',
                'x-request-id': `mc-int-${runId}-T7-W-1`,
              },
            },
            truncated: false,
          },
        ],
        'INT-PERS-01': [
          {
            runId,
            caseId: 'INT-PERS-01',
            requestId: `mc-int-${runId}-INT-PERS-01-1`,
            mode: 'app-client',
            method: 'GET',
            routeTemplate: '/api/v1/users/{id}',
            startedAtUTC: '2026-10-25T03:05:00Z',
            latencyMs: 12,
            actualNextVersion: '16.4.2',
            harnessRevision: 'cfec8694799634b05438764aec56858dc26c8764',
            outcome: 'value',
            classification: 'success',
            value: {
              id: '0192e23b-6e9f-7b71-91ea-42b7e199db1c',
              email: `inta-a-${runId}@example.test`,
              name: 'INTA_A_INITIAL',
              version: 1,
              created_at: '2026-10-25T03:00:00.123456Z',
              updated_at: '2026-10-25T03:00:00.123456Z',
            },
            apiError: null,
            wire: null,
            truncated: false,
          },
        ],
        'INT-PERS-02': [
          {
            runId,
            caseId: 'INT-PERS-02',
            requestId: `mc-int-${runId}-INT-PERS-02-1`,
            mode: 'app-client',
            method: 'GET',
            routeTemplate: '/api/v1/users/{id}',
            startedAtUTC: '2026-10-25T03:06:00Z',
            latencyMs: 12,
            actualNextVersion: '16.4.2',
            harnessRevision: 'cfec8694799634b05438764aec56858dc26c8764',
            outcome: 'value',
            classification: 'success',
            value: {
              id: '0192e23b-6e9f-7b71-91ea-42b7e199db1c',
              email: `inta-a-${runId}@example.test`,
              name: 'INTA_A_INITIAL',
              version: 1,
              created_at: '2026-10-25T03:00:00.123456Z',
              updated_at: '2026-10-25T03:00:00.123456Z',
            },
            apiError: null,
            wire: null,
            truncated: false,
          },
        ],
        T9: [
          {
            runId,
            caseId: 'T9',
            requestId: `mc-int-${runId}-T9-1`,
            mode: 'app-client',
            method: 'PATCH',
            routeTemplate: '/api/v1/users/{id}',
            startedAtUTC: '2026-10-25T03:07:00Z',
            latencyMs: 13,
            actualNextVersion: '16.4.2',
            harnessRevision: 'cfec8694799634b05438764aec56858dc26c8764',
            outcome: 'value',
            classification: 'success',
            value: {
              id: '0192e23b-6e9f-7b71-91ea-42b7e199db1c',
              email: `inta-a-${runId}@example.test`,
              name: 'INTA_A_UPDATED',
              version: 2,
              created_at: '2026-10-25T03:00:00.123456Z',
              updated_at: '2026-10-25T03:07:00Z',
            },
            apiError: null,
            wire: null,
            truncated: false,
          },
        ],
        W9: [
          {
            runId,
            caseId: 'W9',
            requestId: `mc-int-${runId}-W9-1`,
            mode: 'wire',
            method: 'GET',
            routeTemplate: '/api/v1/users/{id}',
            startedAtUTC: '2026-10-25T03:07:10Z',
            latencyMs: 11,
            actualNextVersion: '16.4.2',
            harnessRevision: 'cfec8694799634b05438764aec56858dc26c8764',
            outcome: 'value',
            classification: 'success',
            value: {
              id: '0192e23b-6e9f-7b71-91ea-42b7e199db1c',
              email: `inta-a-${runId}@example.test`,
              name: 'INTA_A_UPDATED',
              version: 2,
              created_at: '2026-10-25T03:00:00.123456Z',
              updated_at: '2026-10-25T03:07:00Z',
            },
            apiError: null,
            wire: {
              status: 200,
              headers: {
                etag: '"2"',
                'x-request-id': `mc-int-${runId}-W9-1`,
              },
            },
            truncated: false,
          },
        ],
        T10: [
          {
            runId,
            caseId: 'T10',
            requestId: `mc-int-${runId}-T10-1`,
            mode: 'app-client',
            method: 'PATCH',
            routeTemplate: '/api/v1/users/{id}',
            startedAtUTC: '2026-10-25T03:07:20Z',
            latencyMs: 10,
            actualNextVersion: '16.4.2',
            harnessRevision: 'cfec8694799634b05438764aec56858dc26c8764',
            outcome: 'apiError',
            classification: 'clientError',
            value: null,
            apiError: { status: 412, code: 'HTTP_ERROR', message: 'Precondition Failed' },
            wire: null,
            truncated: false,
          },
          {
            runId,
            caseId: 'T10',
            requestId: `mc-int-${runId}-T10-2`,
            mode: 'app-client',
            method: 'GET',
            routeTemplate: '/api/v1/users/{id}',
            startedAtUTC: '2026-10-25T03:07:21Z',
            latencyMs: 9,
            actualNextVersion: '16.4.2',
            harnessRevision: 'cfec8694799634b05438764aec56858dc26c8764',
            outcome: 'value',
            classification: 'success',
            value: {
              id: '0192e23b-6e9f-7b71-91ea-42b7e199db1c',
              email: `inta-a-${runId}@example.test`,
              name: 'INTA_A_UPDATED',
              version: 2,
              created_at: '2026-10-25T03:00:00.123456Z',
              updated_at: '2026-10-25T03:07:00Z',
            },
            apiError: null,
            wire: null,
            truncated: false,
          },
        ],
        T11a: [
          {
            runId,
            caseId: 'T11a',
            requestId: `mc-int-${runId}-T11a-1`,
            mode: 'app-client',
            method: 'GET',
            routeTemplate: '/api/v1/users/{id}',
            startedAtUTC: '2026-10-25T03:08:00Z',
            latencyMs: 11,
            actualNextVersion: '16.4.2',
            harnessRevision: 'cfec8694799634b05438764aec56858dc26c8764',
            outcome: 'apiError',
            classification: 'unavailable',
            value: null,
            apiError: {
              status: 503,
              code: 'HTTP_ERROR',
              message: 'service temporarily unavailable',
              details: {
                type: '/problems/unavailable',
                retryAfter: 1,
                detail: 'service temporarily unavailable',
              },
            },
            wire: null,
            truncated: false,
          },
        ],
        T11b: [
          {
            runId,
            caseId: 'T11b',
            requestId: `mc-int-${runId}-T11b-1`,
            mode: 'app-client',
            method: 'PATCH',
            routeTemplate: '/api/v1/users/{id}',
            startedAtUTC: '2026-10-25T03:08:10Z',
            latencyMs: 11,
            actualNextVersion: '16.4.2',
            harnessRevision: 'cfec8694799634b05438764aec56858dc26c8764',
            outcome: 'apiError',
            classification: 'unavailable',
            value: null,
            apiError: { status: 503, code: 'HTTP_ERROR', message: 'service temporarily unavailable' },
            wire: null,
            truncated: false,
          },
        ],
        T11c: [
          {
            runId,
            caseId: 'T11c',
            requestId: `mc-int-${runId}-T11c-1`,
            mode: 'app-client',
            method: 'POST',
            routeTemplate: '/api/v1/users',
            startedAtUTC: '2026-10-25T03:08:20Z',
            latencyMs: 11,
            actualNextVersion: '16.4.2',
            harnessRevision: 'cfec8694799634b05438764aec56858dc26c8764',
            outcome: 'apiError',
            classification: 'unavailable',
            value: null,
            apiError: { status: 503, code: 'HTTP_ERROR', message: 'service temporarily unavailable' },
            wire: null,
            truncated: false,
          },
        ],
        W11: [
          {
            runId,
            caseId: 'W11',
            requestId: `mc-int-${runId}-W11-1`,
            mode: 'wire',
            method: 'GET',
            routeTemplate: '/api/v1/users/{id}',
            startedAtUTC: '2026-10-25T03:08:30Z',
            latencyMs: 10,
            actualNextVersion: '16.4.2',
            harnessRevision: 'cfec8694799634b05438764aec56858dc26c8764',
            outcome: 'value',
            classification: 'unavailable',
            value: null,
            apiError: null,
            wire: {
              status: 503,
              headers: {
                'content-type': 'application/problem+json',
                'x-request-id': `mc-int-${runId}-W11-1`,
              },
            },
            truncated: false,
          },
        ],
        'INT-PERS-03': [
          {
            runId,
            caseId: 'INT-PERS-03',
            requestId: `mc-int-${runId}-INT-PERS-03-1`,
            mode: 'app-client',
            method: 'GET',
            routeTemplate: '/api/v1/users/{id}',
            startedAtUTC: '2026-10-25T03:09:00Z',
            latencyMs: 12,
            actualNextVersion: '16.4.2',
            harnessRevision: 'cfec8694799634b05438764aec56858dc26c8764',
            outcome: 'value',
            classification: 'success',
            value: {
              id: '0192e23b-6e9f-7b71-91ea-42b7e199db1c',
              email: `inta-a-${runId}@example.test`,
              name: 'INTA_A_UPDATED',
              version: 2,
              created_at: '2026-10-25T03:00:00.123456Z',
              updated_at: '2026-10-25T03:07:00Z',
            },
            apiError: null,
            wire: null,
            truncated: false,
          },
        ],
        'INT-PERS-04': [
          {
            runId,
            caseId: 'INT-PERS-04',
            requestId: `mc-int-${runId}-INT-PERS-04-1`,
            mode: 'app-client',
            method: 'GET',
            routeTemplate: '/api/v1/users/{id}',
            startedAtUTC: '2026-10-25T03:09:10Z',
            latencyMs: 12,
            actualNextVersion: '16.4.2',
            harnessRevision: 'cfec8694799634b05438764aec56858dc26c8764',
            outcome: 'value',
            classification: 'success',
            value: {
              id: '0192e23b-6e9f-7b71-91ea-42b7e199db1c',
              email: `inta-a-${runId}@example.test`,
              name: 'INTA_A_UPDATED',
              version: 2,
              created_at: '2026-10-25T03:00:00.123456Z',
              updated_at: '2026-10-25T03:07:00Z',
            },
            apiError: null,
            wire: null,
            truncated: false,
          },
        ],
        T12: [
          {
            runId,
            caseId: 'T12',
            requestId: `mc-int-${runId}-T12-1`,
            mode: 'app-client',
            method: 'GET',
            routeTemplate: '/api/v1/users/{id}',
            startedAtUTC: '2026-10-25T03:10:00Z',
            latencyMs: 5,
            actualNextVersion: '16.4.2',
            harnessRevision: 'cfec8694799634b05438764aec56858dc26c8764',
            outcome: 'apiError',
            classification: 'unavailable',
            value: null,
            apiError: { status: 0, code: 'NETWORK_ERROR', message: 'Connection refused' },
            wire: null,
            truncated: false,
          },
        ],
      }

      const envs = fixtureEnvelopes[caseId]
      if (!envs) {
        throw new Error(`Fake fetch: no fixture configured for caseId ${caseId}`)
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({ ok: true, runId, caseId, substeps: envs }),
      } as any
    }) as any

    try {
      // 1. Stage 1 without --env-ready pauses safely with ZERO sends
      const r1NoEnv = await driver.runStage(1, { envReady: false })
      expect(r1NoEnv.ok).toBe(false)
      expect(r1NoEnv.reason).toBe('PAUSED_WAITING_ENV')
      expect(dispatchCalls).toHaveLength(0)

      // 2. Stage 2 before Stage 1 throws order violation with ZERO sends
      await expect(driver.runStage(2, { confirmGoRestarted: true })).rejects.toThrow(
        /Stage 2 order violation: Stage 1 must be completed first/,
      )
      expect(dispatchCalls).toHaveLength(0)

      // 3. Stage 1 with --env-ready executes all 11 cases
      const r1 = await driver.runStage(1, { envReady: true })
      expect(r1.ok).toBe(true)
      expect(r1.executedCases).toHaveLength(11)
      expect(dispatchCalls).toHaveLength(11)
      expect(driver.isStageCompleted(1)).toBe(true)
      expect(driver.state.checkpointABaseline?.version).toBe(1)
      expect(driver.state.checkpointACurrent?.version).toBe(1)

      // 4. Completed Stage 1 replay refusal with ZERO additional sends
      await expect(driver.runStage(1, { envReady: true })).rejects.toThrow(
        /Stage 1 already completed for runId .*\. Replay of completed stage is prohibited\./,
      )
      expect(dispatchCalls).toHaveLength(11)

      // 5. Stage 2 without --confirm-go-restarted pauses with ZERO additional sends
      const r2NoConfirm = await driver.runStage(2)
      expect(r2NoConfirm.ok).toBe(false)
      expect(r2NoConfirm.reason).toBe('PAUSED_WAITING_GO_RESTART_CONFIRMATION')
      expect(dispatchCalls).toHaveLength(11)

      // 6. Stage 2 with confirmation executes INT-PERS-01 (1 dispatch)
      const r2 = await driver.runStage(2, { confirmGoRestarted: true })
      expect(r2.ok).toBe(true)
      expect(r2.executedCases).toEqual(['INT-PERS-01'])
      expect(dispatchCalls).toHaveLength(12)
      expect(driver.isStageCompleted(2)).toBe(true)

      // 7. Stage 3 without --confirm-pg-restarted pauses with ZERO additional sends
      const r3NoConfirm = await driver.runStage(3)
      expect(r3NoConfirm.ok).toBe(false)
      expect(r3NoConfirm.reason).toBe('PAUSED_WAITING_PG_RESTART_CONFIRMATION')
      expect(dispatchCalls).toHaveLength(12)

      // 8. Stage 3 with confirmation executes INT-PERS-02 (1 dispatch)
      const r3 = await driver.runStage(3, { confirmPgRestarted: true })
      expect(r3.ok).toBe(true)
      expect(r3.executedCases).toEqual(['INT-PERS-02'])
      expect(dispatchCalls).toHaveLength(13)
      expect(driver.isStageCompleted(3)).toBe(true)

      // 9. Stage 4 executes T9, W9, T10 (3 dispatches), updates checkpoint to version 2
      const r4 = await driver.runStage(4)
      expect(r4.ok).toBe(true)
      expect(r4.executedCases).toEqual(['T9', 'W9', 'T10'])
      expect(dispatchCalls).toHaveLength(16)
      expect(driver.isStageCompleted(4)).toBe(true)
      expect(driver.state.checkpointABaseline?.version).toBe(1) // Immutable!
      expect(driver.state.checkpointACurrent?.version).toBe(2)

      // 10. Stage 5 without --confirm-pg-stopped pauses with ZERO additional sends
      const r5NoConfirm = await driver.runStage(5)
      expect(r5NoConfirm.ok).toBe(false)
      expect(r5NoConfirm.reason).toBe('PAUSED_WAITING_PG_STOP_CONFIRMATION')
      expect(dispatchCalls).toHaveLength(16)

      // 11. Stage 5 with confirmation executes T11a, T11b, T11c, W11 (4 dispatches)
      const r5 = await driver.runStage(5, { confirmPgStopped: true })
      expect(r5.ok).toBe(true)
      expect(r5.executedCases).toEqual(['T11a', 'T11b', 'T11c', 'W11'])
      expect(dispatchCalls).toHaveLength(20)
      expect(driver.isStageCompleted(5)).toBe(true)
      expect(driver.state.userXOutcome).toBe('OUTCOME_UNKNOWN')

      // 12. Stage 6 without --confirm-pg-recovered pauses with ZERO additional sends
      const r6NoConfirm = await driver.runStage(6)
      expect(r6NoConfirm.ok).toBe(false)
      expect(r6NoConfirm.reason).toBe('PAUSED_WAITING_PG_RECOVERY_CONFIRMATION')
      expect(dispatchCalls).toHaveLength(20)

      // 13. Stage 6 with confirmation executes INT-PERS-03, INT-PERS-04 (2 dispatches)
      const r6 = await driver.runStage(6, { confirmPgRecovered: true })
      expect(r6.ok).toBe(true)
      expect(r6.executedCases).toEqual(['INT-PERS-03', 'INT-PERS-04'])
      expect(dispatchCalls).toHaveLength(22)
      expect(driver.isStageCompleted(6)).toBe(true)

      // 14. Stage 7 without --confirm-go-stopped pauses with ZERO additional sends
      const r7NoConfirm = await driver.runStage(7)
      expect(r7NoConfirm.ok).toBe(false)
      expect(r7NoConfirm.reason).toBe('PAUSED_WAITING_GO_STOP_CONFIRMATION')
      expect(dispatchCalls).toHaveLength(22)

      // 15. Stage 7 with confirmation executes T12 (1 dispatch)
      const r7 = await driver.runStage(7, { confirmGoStopped: true })
      expect(r7.ok).toBe(true)
      expect(r7.executedCases).toEqual(['T12'])
      expect(dispatchCalls).toHaveLength(23)
      expect(driver.isStageCompleted(7)).toBe(true)

      // All 23 endpoint dispatches completed in causal order!
      expect(driver.state.assertions.size).toBe(23)

      // 16. Simulated reload and resume
      const reloadedDriver = new HarnessDriver(runId, testStateDir, true)
      expect(reloadedDriver.state.checkpointABaseline?.version).toBe(1)
      expect(reloadedDriver.state.checkpointACurrent?.version).toBe(2)
      expect(reloadedDriver.state.userXOutcome).toBe('OUTCOME_UNKNOWN')
      expect(reloadedDriver.state.assertions.size).toBe(23)
      expect(reloadedDriver.isStageCompleted(7)).toBe(true)

      // 17. Replaying any stage on reloaded driver throws refusal with ZERO additional sends
      await expect(reloadedDriver.runStage(1, { envReady: true })).rejects.toThrow(
        /Stage 1 already completed for runId .*\. Replay of completed stage is prohibited\./,
      )
      await expect(reloadedDriver.runStage(5, { confirmPgStopped: true })).rejects.toThrow(
        /Stage 5 already completed for runId .*\. Replay of completed stage is prohibited\./,
      )
      expect(dispatchCalls).toHaveLength(23)

      // 18. Simulated crash after upstream write before completion (intent left started)
      const crashRunId = 'crashsim123'
      const crashDriver = new HarnessDriver(crashRunId, testStateDir)
      const crashStatusFile = path.join(crashDriver.substepsDir, 'T1.status')
      fs.writeFileSync(
        crashStatusFile,
        JSON.stringify({ caseId: 'T1', state: 'started', startedAtUTC: '2026-10-25T03:00:00Z' }),
        'utf-8',
      )

      await expect(crashDriver.runStage(1, { envReady: true })).rejects.toThrow(
        /Dispatch refused by one-shot intent guard: case T1 is already started/,
      )
      expect(dispatchCalls).toHaveLength(23) // ZERO sends!

      // 19. T11c never retried if marked unknown
      const xRunId = 'xunknownsim123'
      const xDriver = new HarnessDriver(xRunId, testStateDir)
      const xStatusFile = path.join(xDriver.substepsDir, 'T11c.status')
      fs.writeFileSync(
        xStatusFile,
        JSON.stringify({ caseId: 'T11c', state: 'unknown', completedAtUTC: '2026-10-25T03:00:00Z' }),
        'utf-8',
      )

      expect(() => xDriver.reserveSubstepIntent('T11c')).toThrow(
        /Dispatch refused by one-shot intent guard: case T11c is already unknown/,
      )
      expect(dispatchCalls).toHaveLength(23) // ZERO sends!
    } finally {
      global.fetch = originalFetch
    }
  })

  it('stop-harness script requires nonempty matching recorded PID, startTime, and command (R3-F02)', () => {
    const harnessRoot = path.resolve(process.cwd())
    const runStateDir = path.join(harnessRoot, '.run-state')
    fs.mkdirSync(runStateDir, { recursive: true })
    const pidFile = path.join(runStateDir, 'harness.pid')
    const provFile = path.join(runStateDir, 'harness.provenance')
    const stopScript = path.join(harnessRoot, 'scripts', 'stop-harness.sh')

    // Spawn an orphaned dummy process to test signals and reap cleanly without zombies
    const pidDump = path.join(testStateDir, `dummy_pid_${Date.now()}.txt`)
    spawnSync('sh', ['-c', `(sleep 30 & echo $! > "${pidDump}") </dev/null >/dev/null 2>&1`])
    const dummyPid = parseInt(fs.readFileSync(pidDump, 'utf-8').trim(), 10)
    fs.unlinkSync(pidDump)
    expect(dummyPid).toBeGreaterThan(0)

    try {
      const actualStart = spawnSync('ps', ['-p', String(dummyPid), '-o', 'lstart='], { encoding: 'utf-8' }).stdout.trim()
      const actualCmd = spawnSync('ps', ['-p', String(dummyPid), '-o', 'command='], { encoding: 'utf-8' }).stdout.trim()

      fs.writeFileSync(pidFile, String(dummyPid), 'utf-8')

      // Case A: Blank startTime in provenance -> refuse with exit 1, zero signals, retain files
      fs.writeFileSync(provFile, `pid=${dummyPid}\nstartTime=\ncmd=${actualCmd}\n`, 'utf-8')
      const resA = spawnSync('bash', [stopScript], { encoding: 'utf-8' })
      expect(resA.status).toBe(1)
      expect(resA.stderr).toMatch(/Missing or blank required provenance fields/)
      expect(fs.existsSync(pidFile)).toBe(true) // Retained for manual disposition
      expect(fs.existsSync(provFile)).toBe(true)
      expect(() => process.kill(dummyPid, 0)).not.toThrow() // Still alive! Zero signals sent!

      // Case B: Blank cmd in provenance -> refuse with exit 1, zero signals, retain files
      fs.writeFileSync(provFile, `pid=${dummyPid}\nstartTime=${actualStart}\ncmd=\n`, 'utf-8')
      const resB = spawnSync('bash', [stopScript], { encoding: 'utf-8' })
      expect(resB.status).toBe(1)
      expect(resB.stderr).toMatch(/Missing or blank required provenance fields/)
      expect(() => process.kill(dummyPid, 0)).not.toThrow()

      // Case C: Mismatched cmd -> refuse with exit 1, zero signals, retain files
      fs.writeFileSync(provFile, `pid=${dummyPid}\nstartTime=${actualStart}\ncmd=foreign-malicious-cmd\n`, 'utf-8')
      const resC = spawnSync('bash', [stopScript], { encoding: 'utf-8' })
      expect(resC.status).toBe(1)
      expect(resC.stderr).toMatch(/Process command mismatch for PID/)
      expect(() => process.kill(dummyPid, 0)).not.toThrow()

      // Case D: Mismatched start time -> refuse with exit 1, zero signals, retain files
      fs.writeFileSync(provFile, `pid=${dummyPid}\nstartTime=Sun Oct 25 00:00:00 2020\ncmd=${actualCmd}\n`, 'utf-8')
      const resD = spawnSync('bash', [stopScript], { encoding: 'utf-8' })
      expect(resD.status).toBe(1)
      expect(resD.stderr).toMatch(/Process start time mismatch for PID/)
      expect(() => process.kill(dummyPid, 0)).not.toThrow()

      // Case E: Valid matching provenance -> stops owned process, exits 0, unlinks files
      fs.writeFileSync(provFile, `pid=${dummyPid}\nstartTime=${actualStart}\ncmd=${actualCmd}\n`, 'utf-8')
      const resE = spawnSync('bash', [stopScript], { encoding: 'utf-8' })
      expect(resE.status).toBe(0)
      expect(resE.stdout).toMatch(/Verified provenance for owned PID/)
      expect(fs.existsSync(pidFile)).toBe(false) // Cleaned up after successful verified stop
      expect(fs.existsSync(provFile)).toBe(false)
    } finally {
      try {
        process.kill(dummyPid, 'SIGKILL')
      } catch {}
      try {
        if (fs.existsSync(pidFile)) fs.unlinkSync(pidFile)
        if (fs.existsSync(provFile)) fs.unlinkSync(provFile)
      } catch {}
    }
  })
})
