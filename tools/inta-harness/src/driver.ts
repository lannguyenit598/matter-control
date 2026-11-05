import fs from 'node:fs'
import path from 'node:path'
import url from 'node:url'
import {
  ALLOWED_CASE_IDS,
  type CaseId,
  REF_ID_REQUIRED_CASE_IDS,
  REF_ID_FORBIDDEN_CASE_IDS,
} from './schemas.ts'
import type { HarnessEnvelope } from './envelope.ts'
import { getFixturesForRun } from './fixtures.ts'

export interface CheckpointUserA {
  id: string
  email: string
  name: string
  version: number
  created_at: string
  updated_at: string
}

export interface AssertionRecord {
  caseId: string
  pass: boolean
  notes: string
  blocked?: boolean
  timestampUTC: string
}

export interface DriverState {
  runId: string
  stage: string
  phase?: string
  checkpointA: CheckpointUserA | null
  checkpointABaseline: CheckpointUserA | null
  checkpointACurrent: CheckpointUserA | null
  checkpointBId: string | null
  userXOutcome: 'OUTCOME_UNKNOWN' | null
  envelopes: Map<string, HarnessEnvelope[]>
  assertions: Map<string, AssertionRecord>
}

export const CANONICAL_36_LOGICAL_IDS = [
  'INT-ENV-01',
  'INT-ENV-02',
  'INT-ENV-03',
  'INT-ENV-04',
  'INT-ENV-05',
  'INT-ENV-06',
  'INT-ENV-07',
  'T1',
  'T2',
  'W1',
  'W2',
  'T3',
  'T4',
  'T5',
  'T8',
  'W3',
  'T6-W',
  'T7-W',
  'INT-PERS-01',
  'INT-PERS-02',
  'T9',
  'W9',
  'T10',
  'T11a',
  'T11b',
  'T11c',
  'W11',
  'INT-PERS-03',
  'INT-PERS-04',
  'T12',
  'INT-COR-01',
  'INT-PRIV-01',
  'INT-ISO-01',
  'INT-ISO-02',
  'INT-ISO-03',
  'INT-CONF-01',
] as const

export type LogicalTestId = (typeof CANONICAL_36_LOGICAL_IDS)[number]

/**
 * Validates that an alphanumeric runId is 8-32 characters.
 */
export function validateRunId(runId: string): boolean {
  return /^[a-zA-Z0-9]{8,32}$/.test(runId)
}

/**
 * Generates an alphanumeric runId between 8 and 32 characters.
 */
export function generateRunId(prefix = 'inta'): string {
  const ts = Date.now().toString(36)
  const rand = Math.floor(Math.random() * 10000).toString(36)
  const runId = `${prefix}${ts}${rand}`.toLowerCase()
  if (runId.length < 8) {
    return runId.padEnd(8, '0')
  }
  if (runId.length > 32) {
    return runId.slice(0, 32)
  }
  return runId
}

/**
 * Refuses execution if runId collides with existing foreign evidence or state (F02, R2-F03).
 * When allowResume is true, permits working within this run's own existing assets.
 * Dropped frontend docker-ps execution; fail closed on corrupt counters.
 */
export function assertNoRunIdCollision(
  runId: string,
  evidenceBaseDir = '/tmp/mc002-inta-evidence',
  stateBaseDir = path.join(process.cwd(), '.run-state'),
  allowResume = false,
): void {
  if (!validateRunId(runId)) {
    throw new Error(`Invalid runId format (must be 8-32 alphanumeric): ${runId}`)
  }

  // 1. Check existing evidence directories (only for fresh unreserved runs)
  if (!allowResume) {
    const evidenceCheckDirs = [
      path.join(evidenceBaseDir, 'frontend', runId),
      path.join(evidenceBaseDir, 'backend', runId),
      path.join(evidenceBaseDir, 'environment', runId),
      path.join(evidenceBaseDir, 'qa', runId),
    ]
    for (const dir of evidenceCheckDirs) {
      if (fs.existsSync(dir)) {
        throw new Error(`RunId collision refused: existing evidence found at ${dir}`)
      }
    }
  }

  // 2. Check local run state and counters with fail-closed corruption check (R2-F03)
  const countersPath = path.join(stateBaseDir, 'counters.json')
  if (fs.existsSync(countersPath)) {
    let data: any
    try {
      const content = fs.readFileSync(countersPath, 'utf-8')
      data = JSON.parse(content)
      if (typeof data !== 'object' || data === null) {
        throw new Error('counters.json root must be a JSON object')
      }
    } catch (err: any) {
      throw new Error(`Fail-closed: unreadable or corrupt counter state in ${countersPath} during collision preflight: ${err.message}`)
    }

    if (!allowResume && data[runId] !== undefined) {
      throw new Error(`RunId collision refused: existing counter found for ${runId} in ${countersPath}`)
    }
  }

  if (!allowResume) {
    const checkpointPath = path.join(stateBaseDir, 'checkpoints', `${runId}.json`)
    if (fs.existsSync(checkpointPath)) {
      throw new Error(`RunId collision refused: existing checkpoint found at ${checkpointPath}`)
    }

    const envelopePath = path.join(stateBaseDir, 'envelopes', runId)
    if (fs.existsSync(envelopePath)) {
      throw new Error(`RunId collision refused: existing run state found at ${envelopePath}`)
    }

    const substepsPath = path.join(stateBaseDir, 'substeps', runId)
    if (fs.existsSync(substepsPath)) {
      throw new Error(`RunId collision refused: existing substeps found at ${substepsPath}`)
    }

    const stagesPath = path.join(stateBaseDir, 'stages', runId)
    if (fs.existsSync(stagesPath)) {
      throw new Error(`RunId collision refused: existing stages found at ${stagesPath}`)
    }

    const assertionsPath = path.join(stateBaseDir, 'assertions', `${runId}.json`)
    if (fs.existsSync(assertionsPath)) {
      throw new Error(`RunId collision refused: existing assertions found at ${assertionsPath}`)
    }
  }
}

/**
 * RFC 3339 UTC timestamp check with 0-6 fraction digits.
 */
export const RFC3339_UTC_REGEX =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,6})?Z$/

/**
 * Canonical lowercase UUIDv7 check with version digit 7 and RFC 4122 variant (F01).
 */
export const UUIDV7_LOWERCASE_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/

export class HarnessDriver {
  public readonly runId: string
  public readonly stateDir: string
  public readonly envelopeDir: string
  public readonly checkpointDir: string
  public readonly substepsDir: string
  public readonly assertionsDir: string
  public readonly stagesDir: string
  public state: DriverState

  constructor(runId?: string, stateDir?: string, allowResume = false) {
    this.runId = runId ?? generateRunId()
    this.stateDir = stateDir ?? process.env.MC_INTA_STATE_DIR ?? path.join(process.cwd(), '.run-state')
    this.envelopeDir = path.join(this.stateDir, 'envelopes', this.runId)
    this.checkpointDir = path.join(this.stateDir, 'checkpoints', this.runId)
    this.substepsDir = path.join(this.stateDir, 'substeps', this.runId)
    this.assertionsDir = path.join(this.stateDir, 'assertions')
    this.stagesDir = path.join(this.stateDir, 'stages', this.runId)

    assertNoRunIdCollision(this.runId, undefined, this.stateDir, allowResume)

    fs.mkdirSync(this.envelopeDir, { recursive: true })
    fs.mkdirSync(this.checkpointDir, { recursive: true })
    fs.mkdirSync(this.substepsDir, { recursive: true })
    fs.mkdirSync(this.assertionsDir, { recursive: true })
    fs.mkdirSync(this.stagesDir, { recursive: true })

    this.state = {
      runId: this.runId,
      stage: 'INITIALIZED',
      phase: 'INITIALIZED',
      checkpointA: null,
      checkpointABaseline: null,
      checkpointACurrent: null,
      checkpointBId: null,
      userXOutcome: null,
      envelopes: new Map(),
      assertions: new Map(),
    }

    if (allowResume) {
      this.loadCheckpoint()
      this.loadAssertions()
    }
  }

  // Compatibility getter for checkpointA (returns current state)
  public get checkpointA(): CheckpointUserA | null {
    return this.state.checkpointACurrent
  }

  /**
   * Loads durable checkpoints from disk (R2-F07).
   * Distinguishes immutable baseline checkpoint from mutable current checkpoint.
   */
  public loadCheckpoint(): boolean {
    const baselinePath = path.join(this.checkpointDir, 'checkpointA.baseline.json')
    const currentPath = path.join(this.checkpointDir, 'checkpointA.current.json')
    const statePath = path.join(this.checkpointDir, 'state.json')

    let loaded = false
    if (fs.existsSync(baselinePath)) {
      try {
        const val = JSON.parse(fs.readFileSync(baselinePath, 'utf-8'))
        if (!val || typeof val !== 'object' || !val.id || !val.email) {
          throw new Error('invalid baseline checkpoint structure')
        }
        this.state.checkpointABaseline = val
        loaded = true
      } catch (err: any) {
        throw new Error(
          `Fail-closed: unreadable or corrupt baseline checkpoint in ${baselinePath}: ${err.message}`,
        )
      }
    }
    if (fs.existsSync(currentPath)) {
      try {
        const val = JSON.parse(fs.readFileSync(currentPath, 'utf-8'))
        if (!val || typeof val !== 'object' || !val.id || !val.email) {
          throw new Error('invalid current checkpoint structure')
        }
        this.state.checkpointACurrent = val
        loaded = true
      } catch (err: any) {
        throw new Error(
          `Fail-closed: unreadable or corrupt current checkpoint in ${currentPath}: ${err.message}`,
        )
      }
    }
    if (fs.existsSync(statePath)) {
      try {
        const s = JSON.parse(fs.readFileSync(statePath, 'utf-8'))
        if (!s || typeof s !== 'object') {
          throw new Error('invalid state snapshot structure')
        }
        this.state.stage = s.stage ?? this.state.stage
        this.state.phase = s.stage ?? this.state.stage
        this.state.checkpointBId = s.checkpointBId ?? this.state.checkpointBId
        this.state.userXOutcome = s.userXOutcome ?? this.state.userXOutcome
        loaded = true
      } catch (err: any) {
        throw new Error(
          `Fail-closed: unreadable or corrupt state snapshot in ${statePath}: ${err.message}`,
        )
      }
    }
    const legacyCpPath = path.join(this.stateDir, 'checkpoints', `${this.runId}.json`)
    if (fs.existsSync(legacyCpPath)) {
      try {
        const leg = JSON.parse(fs.readFileSync(legacyCpPath, 'utf-8'))
        if (leg && typeof leg === 'object') {
          if (!this.state.checkpointABaseline && leg.checkpointA) {
            this.state.checkpointABaseline = leg.checkpointA
          }
          if (!this.state.checkpointACurrent && leg.checkpointA) {
            this.state.checkpointACurrent = leg.checkpointA
          }
          loaded = true
        }
      } catch (err: any) {
        throw new Error(
          `Fail-closed: unreadable or corrupt legacy checkpoint in ${legacyCpPath}: ${err.message}`,
        )
      }
    }
    this.state.checkpointA = this.state.checkpointACurrent ?? this.state.checkpointABaseline ?? null
    return loaded
  }

  /**
   * Persists baseline checkpoint A (immutable snapshot after T1) (R2-F07).
   */
  public saveBaselineCheckpoint(userA: CheckpointUserA): void {
    this.state.checkpointABaseline = { ...userA }
    this.state.checkpointACurrent = { ...userA }
    this.state.checkpointA = this.state.checkpointACurrent

    const baselinePath = path.join(this.checkpointDir, 'checkpointA.baseline.json')
    const currentPath = path.join(this.checkpointDir, 'checkpointA.current.json')

    const tmpB = path.join(this.checkpointDir, `.baseline.${process.pid}.${Date.now()}.tmp`)
    fs.writeFileSync(tmpB, JSON.stringify(userA, null, 2), 'utf-8')
    fs.renameSync(tmpB, baselinePath)

    const tmpC = path.join(this.checkpointDir, `.current.${process.pid}.${Date.now()}.tmp`)
    fs.writeFileSync(tmpC, JSON.stringify(userA, null, 2), 'utf-8')
    fs.renameSync(tmpC, currentPath)

    this.saveStateSnapshot()

    // Write backward-compatible checkpoints/<runId>.json
    const legacyCpPath = path.join(this.stateDir, 'checkpoints', `${this.runId}.json`)
    const legacyData = {
      runId: this.runId,
      phase: this.state.stage,
      checkpointA: this.state.checkpointA,
      checkpointBId: this.state.checkpointBId,
      userXOutcome: this.state.userXOutcome,
      updatedAtUTC: new Date().toISOString(),
    }
    const legacyTmp = path.join(this.stateDir, 'checkpoints', `.${this.runId}.${process.pid}.${Date.now()}.tmp`)
    fs.writeFileSync(legacyTmp, JSON.stringify(legacyData, null, 2), 'utf-8')
    fs.renameSync(legacyTmp, legacyCpPath)
  }

  /**
   * Persists current checkpoint A (updated after T9 mutation) (R2-F07).
   */
  public saveCurrentCheckpoint(userA: CheckpointUserA): void {
    this.state.checkpointACurrent = { ...userA }
    this.state.checkpointA = this.state.checkpointACurrent
    const currentPath = path.join(this.checkpointDir, 'checkpointA.current.json')
    const tmpC = path.join(this.checkpointDir, `.current.${process.pid}.${Date.now()}.tmp`)
    fs.writeFileSync(tmpC, JSON.stringify(userA, null, 2), 'utf-8')
    fs.renameSync(tmpC, currentPath)
    this.saveStateSnapshot()

    // Write backward-compatible checkpoints/<runId>.json
    const legacyCpPath = path.join(this.stateDir, 'checkpoints', `${this.runId}.json`)
    const legacyData = {
      runId: this.runId,
      phase: this.state.stage,
      checkpointA: this.state.checkpointA,
      checkpointBId: this.state.checkpointBId,
      userXOutcome: this.state.userXOutcome,
      updatedAtUTC: new Date().toISOString(),
    }
    const legacyTmp = path.join(this.stateDir, 'checkpoints', `.${this.runId}.${process.pid}.${Date.now()}.tmp`)
    fs.writeFileSync(legacyTmp, JSON.stringify(legacyData, null, 2), 'utf-8')
    fs.renameSync(legacyTmp, legacyCpPath)
  }

  /**
   * Saves state metadata snapshot.
   */
  public saveStateSnapshot(): void {
    const data = {
      runId: this.runId,
      stage: this.state.stage,
      checkpointBId: this.state.checkpointBId,
      userXOutcome: this.state.userXOutcome,
      updatedAtUTC: new Date().toISOString(),
    }
    const statePath = path.join(this.checkpointDir, 'state.json')
    const tmp = path.join(this.checkpointDir, `.state.${process.pid}.${Date.now()}.tmp`)
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf-8')
    fs.renameSync(tmp, statePath)
  }

  /**
   * Loads durable assertions from disk (R2-F07).
   */
  public loadAssertions(): void {
    const aFile = path.join(this.assertionsDir, `${this.runId}.json`)
    if (fs.existsSync(aFile)) {
      let arr: any
      try {
        arr = JSON.parse(fs.readFileSync(aFile, 'utf-8'))
      } catch (err: any) {
        throw new Error(
          `Fail-closed: unreadable or corrupt assertions file in ${aFile}: ${err.message}`,
        )
      }
      if (!Array.isArray(arr)) {
        throw new Error(
          `Fail-closed: corrupt assertions file in ${aFile} (expected array of assertions)`,
        )
      }
      for (const rec of arr) {
        if (!rec || typeof rec !== 'object' || !rec.caseId) {
          throw new Error(
            `Fail-closed: corrupt assertion record in ${aFile}`,
          )
        }
        this.state.assertions.set(rec.caseId, rec)
      }
    }
  }

  /**
   * Records and persists an assertion result durably (F01, R2-F07).
   */
  public recordAssertion(
    caseId: string,
    pass: boolean,
    notes: string,
    truncated = false,
  ): void {
    const rec: AssertionRecord = truncated
      ? {
          caseId,
          pass: false,
          blocked: true,
          notes: `BLOCKED: Body truncated (>16KiB cap) — cannot establish assertion (${notes})`,
          timestampUTC: new Date().toISOString(),
        }
      : {
          caseId,
          pass,
          notes,
          timestampUTC: new Date().toISOString(),
        }

    this.state.assertions.set(caseId, rec)

    // Persist assertions list atomically
    const aFile = path.join(this.assertionsDir, `${this.runId}.json`)
    const aTmp = path.join(this.assertionsDir, `.${this.runId}.${process.pid}.${Date.now()}.tmp`)
    const all = Array.from(this.state.assertions.values())
    fs.writeFileSync(aTmp, JSON.stringify(all, null, 2), 'utf-8')
    fs.renameSync(aTmp, aFile)
  }

  /**
   * Atomically checks and reserves a one-shot substep intent BEFORE dispatch (R2-F02).
   * Refuses dispatch if case was already started, completed, or outcome-unknown.
   * Fail closed on corrupt status.
   */
  public reserveSubstepIntent(caseId: string): void {
    const statusFile = path.join(this.substepsDir, `${caseId}.status`)
    if (fs.existsSync(statusFile)) {
      let st: any
      try {
        const content = fs.readFileSync(statusFile, 'utf-8')
        st = JSON.parse(content)
      } catch (err: any) {
        throw new Error(
          `Fail-closed: unreadable or corrupt substep status for ${caseId} in ${statusFile}: ${err.message}`,
        )
      }

      if (
        st &&
        typeof st === 'object' &&
        st.caseId === caseId &&
        (st.state === 'completed' || st.state === 'started' || st.state === 'unknown')
      ) {
        throw new Error(
          `Dispatch refused by one-shot intent guard: case ${caseId} is already ${st.state} for runId ${this.runId}. Replay of mutations/attempts is prohibited.`,
        )
      }

      throw new Error(
        `Fail-closed: existing intent file already present with unrecognized state or shape for case ${caseId} in ${statusFile}. Replay/overwrite prohibited.`,
      )
    }

    // Atomically reserve started intent
    const tmp = path.join(this.substepsDir, `.${caseId}.${process.pid}.${Date.now()}.tmp`)
    fs.writeFileSync(
      tmp,
      JSON.stringify(
        { caseId, state: 'started', startedAtUTC: new Date().toISOString() },
        null,
        2,
      ),
      'utf-8',
    )
    fs.renameSync(tmp, statusFile)
  }

  /**
   * Marks a substep intent completed or unknown after dispatch and assertion (R2-F02).
   */
  public completeSubstepIntent(caseId: string, state: 'completed' | 'unknown' = 'completed'): void {
    const statusFile = path.join(this.substepsDir, `${caseId}.status`)
    const tmp = path.join(this.substepsDir, `.${caseId}.${process.pid}.${Date.now()}.tmp`)
    fs.writeFileSync(
      tmp,
      JSON.stringify(
        { caseId, state, completedAtUTC: new Date().toISOString() },
        null,
        2,
      ),
      'utf-8',
    )
    fs.renameSync(tmp, statusFile)
  }

  /**
   * Persists an envelope to disk with write-once ledger enforcement (F01).
   */
  public persistEnvelope(caseId: string, envelopes: HarnessEnvelope[]): void {
    this.state.envelopes.set(caseId, envelopes)
    const outPath = path.join(this.envelopeDir, `${caseId}.json`)
    const serialized = JSON.stringify(envelopes, null, 2)

    if (fs.existsSync(outPath)) {
      const existing = fs.readFileSync(outPath, 'utf-8')
      if (existing === serialized) {
        return // Idempotent byte-equal write
      }
      throw new Error(
        `Duplicate case execution refused by write-once ledger: ${caseId} already executed with different content for runId ${this.runId}`,
      )
    }

    const tmpPath = path.join(
      this.envelopeDir,
      `.${caseId}.${process.pid}.${Date.now()}.tmp`,
    )
    fs.writeFileSync(tmpPath, serialized, 'utf-8')
    fs.renameSync(tmpPath, outPath)
  }

  /**
   * Helper: checks wire x-request-id echo matches envelope requestId (R2-F06).
   */
  private assertWireEcho(caseId: string, envelope: HarnessEnvelope): void {
    const echoId = envelope.wire?.headers?.['x-request-id']
    if (!echoId || echoId !== envelope.requestId) {
      this.recordAssertion(
        caseId,
        false,
        `Wire x-request-id echo mismatch: expected '${envelope.requestId}', got '${echoId ?? 'missing'}'`,
      )
      throw new Error(
        `${caseId} failed: wire x-request-id echo mismatch: expected '${envelope.requestId}', got '${echoId ?? 'missing'}'`,
      )
    }
  }

  /**
   * Asserts User A created state in T1 and saves baseline & current checkpoints (F01, R2-F07).
   */
  public assertT1(envelope: HarnessEnvelope): CheckpointUserA {
    if (envelope.truncated) {
      this.recordAssertion('T1', false, 'Envelope body truncated', true)
      throw new Error('T1 assertion blocked: envelope body was truncated')
    }

    if (envelope.outcome !== 'value' || !envelope.value) {
      this.recordAssertion('T1', false, `Expected outcome value, got ${envelope.outcome}`)
      throw new Error(`T1 failed: unexpected outcome ${envelope.outcome}`)
    }

    const val = envelope.value as any
    if (!UUIDV7_LOWERCASE_REGEX.test(val.id)) {
      this.recordAssertion('T1', false, `Invalid User A id format (must be lowercase UUIDv7): ${val.id}`)
      throw new Error(`T1 failed: invalid User A id format: ${val.id}`)
    }

    const f = getFixturesForRun(this.runId)
    if (val.email !== f.userA.initial.email) {
      this.recordAssertion('T1', false, `Expected email ${f.userA.initial.email}, got ${val.email}`)
      throw new Error(`T1 failed: email mismatch vs fixture A: ${val.email}`)
    }

    if (val.name !== f.userA.initial.name) {
      this.recordAssertion('T1', false, `Expected name ${f.userA.initial.name}, got ${val.name}`)
      throw new Error(`T1 failed: name mismatch vs fixture A: ${val.name}`)
    }

    if (val.version !== 1) {
      this.recordAssertion('T1', false, `Expected version 1, got ${val.version}`)
      throw new Error(`T1 failed: expected version 1, got ${val.version}`)
    }

    if (!RFC3339_UTC_REGEX.test(val.created_at)) {
      this.recordAssertion('T1', false, `Invalid created_at RFC 3339: ${val.created_at}`)
      throw new Error(`T1 failed: invalid created_at RFC 3339 UTC: ${val.created_at}`)
    }

    if (!RFC3339_UTC_REGEX.test(val.updated_at)) {
      this.recordAssertion('T1', false, `Invalid updated_at RFC 3339: ${val.updated_at}`)
      throw new Error(`T1 failed: invalid updated_at RFC 3339 UTC: ${val.updated_at}`)
    }

    const userA: CheckpointUserA = {
      id: val.id,
      email: val.email,
      name: val.name,
      version: val.version,
      created_at: val.created_at,
      updated_at: val.updated_at,
    }

    this.saveBaselineCheckpoint(userA)
    this.recordAssertion('T1', true, 'User A created with version 1, valid UUIDv7 and RFC 3339 UTC timestamps')
    return userA
  }

  /**
   * Asserts T2 readback matches current checkpoint field-for-field.
   */
  public assertT2(envelope: HarnessEnvelope, expectedCp?: CheckpointUserA): void {
    const cp = expectedCp ?? this.state.checkpointACurrent ?? this.state.checkpointABaseline
    if (!cp) {
      throw new Error('T2 assertion error: Checkpoint A missing')
    }
    if (envelope.truncated) {
      this.recordAssertion('T2', false, 'Envelope body truncated', true)
      throw new Error('T2 assertion blocked: envelope body was truncated')
    }

    const val = envelope.value as any

    const match =
      val.id === cp.id &&
      val.email === cp.email &&
      val.name === cp.name &&
      val.version === cp.version &&
      val.created_at === cp.created_at &&
      val.updated_at === cp.updated_at

    if (!match) {
      this.recordAssertion('T2', false, 'T2 readback does not match checkpoint field-for-field')
      throw new Error('T2 failed: readback mismatch vs checkpoint A')
    }

    this.recordAssertion('T2', true, 'T2 readback matches checkpoint field-for-field')
  }

  /**
   * Asserts W1 User B wire creation headers, status and x-request-id echo (F01, R2-F06).
   */
  public assertW1(envelope: HarnessEnvelope): string {
    if (envelope.truncated) {
      this.recordAssertion('W1', false, 'Envelope body truncated', true)
      throw new Error('W1 assertion blocked: envelope body was truncated')
    }
    if (envelope.wire?.status !== 201) {
      this.recordAssertion('W1', false, `Expected wire status 201, got ${envelope.wire?.status}`)
      throw new Error(`W1 failed: expected wire status 201, got ${envelope.wire?.status}`)
    }

    const val = envelope.value as any
    if (!val?.id || !UUIDV7_LOWERCASE_REGEX.test(val.id)) {
      this.recordAssertion('W1', false, `Invalid User B id format: ${val?.id}`)
      throw new Error(`W1 failed: invalid User B id format: ${val?.id}`)
    }

    const loc = envelope.wire?.headers?.location
    const expectedLoc = `/api/v1/users/${val.id}`
    if (loc !== expectedLoc) {
      this.recordAssertion('W1', false, `Expected Location header ${expectedLoc}, got ${loc}`)
      throw new Error(`W1 failed: Location header mismatch: expected ${expectedLoc}, got ${loc}`)
    }

    const etag = envelope.wire?.headers?.etag
    if (etag !== '"1"') {
      this.recordAssertion('W1', false, `Expected ETag "1", got ${etag}`)
      throw new Error(`W1 failed: ETag mismatch: expected "1", got ${etag}`)
    }

    const contentType = envelope.wire?.headers?.['content-type']
    if (!contentType?.includes('application/json')) {
      this.recordAssertion('W1', false, `Expected content-type application/json, got ${contentType}`)
      throw new Error(`W1 failed: content-type mismatch: got ${contentType}`)
    }

    // R2-F06: Assert wire x-request-id echo
    this.assertWireEcho('W1', envelope)

    this.state.checkpointBId = val.id
    this.saveStateSnapshot()
    this.recordAssertion('W1', true, 'User B created with 201, valid Location, ETag "1", JSON content-type and x-request-id echo')
    return val.id
  }

  /**
   * Asserts W2 wire read User A before T9 with ETag "1" and x-request-id echo (F01, R2-F06).
   */
  public assertW2(envelope: HarnessEnvelope): void {
    if (envelope.wire?.status !== 200) {
      this.recordAssertion('W2', false, `Expected wire status 200, got ${envelope.wire?.status}`)
      throw new Error(`W2 failed: expected wire status 200`)
    }
    const etag = envelope.wire?.headers?.etag
    if (etag !== '"1"') {
      this.recordAssertion('W2', false, `Expected ETag "1", got ${etag}`)
      throw new Error(`W2 failed: ETag mismatch: expected "1", got ${etag}`)
    }
    this.assertWireEcho('W2', envelope)
    this.recordAssertion('W2', true, 'W2 read User A with 200, ETag "1" and x-request-id echo')
  }

  /**
   * Asserts T3 missing UUID -> 404 / NOT_FOUND (F01).
   */
  public assertT3(envelope: HarnessEnvelope): void {
    if (envelope.outcome !== 'apiError' || envelope.apiError?.status !== 404 || envelope.apiError?.code !== 'NOT_FOUND') {
      this.recordAssertion('T3', false, `Expected 404/NOT_FOUND, got ${envelope.outcome}/${envelope.apiError?.code}`)
      throw new Error(`T3 failed: expected 404/NOT_FOUND, got ${envelope.outcome}`)
    }
    this.recordAssertion('T3', true, 'T3 missing UUID returned 404 NOT_FOUND')
  }

  /**
   * Asserts T4 malformed and uppercase UUIDs -> two distinct 404 observations (F01).
   */
  public assertT4(envelopes: HarnessEnvelope[]): void {
    if (envelopes.length !== 2) {
      this.recordAssertion('T4', false, `Expected 2 substeps, got ${envelopes.length}`)
      throw new Error(`T4 failed: expected 2 substeps, got ${envelopes.length}`)
    }
    if (envelopes[0].requestId === envelopes[1].requestId) {
      this.recordAssertion('T4', false, 'Expected unique request IDs for T4 substeps')
      throw new Error('T4 failed: substep request IDs collided')
    }
    for (let i = 0; i < 2; i++) {
      const step = envelopes[i]
      if (step.outcome !== 'apiError' || step.apiError?.status !== 404 || step.apiError?.code !== 'NOT_FOUND') {
        this.recordAssertion('T4', false, `Substep ${i} expected 404/NOT_FOUND, got ${step.outcome}`)
        throw new Error(`T4 failed on substep ${i}: expected 404/NOT_FOUND`)
      }
    }
    this.recordAssertion('T4', true, 'T4 executed two distinct 404 NOT_FOUND substeps with unique request IDs')
  }

  /**
   * Asserts T5 invalid name -> 422 and User A readback unchanged (F01).
   */
  public assertT5(envelopes: HarnessEnvelope[]): void {
    if (envelopes.length !== 2) {
      throw new Error(`T5 expected 2 substeps, got ${envelopes.length}`)
    }
    const [substep0, substep1] = envelopes
    if (substep0.truncated) {
      this.recordAssertion('T5', false, 'T5 substep 0 body truncated', true)
      throw new Error('T5 assertion blocked: substep 0 truncated')
    }
    if (substep0.outcome !== 'apiError' || substep0.apiError?.status !== 422 || substep0.apiError?.code !== 'VALIDATION_ERROR') {
      this.recordAssertion('T5', false, `Substep 0 expected 422/VALIDATION_ERROR, got ${substep0.outcome}`)
      throw new Error(`T5 failed on substep 0: expected 422/VALIDATION_ERROR`)
    }
    this.assertT2(substep1, this.state.checkpointABaseline ?? undefined)
    this.recordAssertion('T5', true, 'T5 rejected empty name with 422 and verified User A unchanged')
  }

  /**
   * Asserts T8 duplicate email -> 409 and User A readback unchanged (F01).
   */
  public assertT8(envelopes: HarnessEnvelope[]): void {
    if (envelopes.length !== 2) {
      throw new Error(`T8 expected 2 substeps, got ${envelopes.length}`)
    }
    const [substep0, substep1] = envelopes
    if (substep0.truncated) {
      this.recordAssertion('T8', false, 'T8 substep 0 body truncated', true)
      throw new Error('T8 assertion blocked: substep 0 truncated')
    }
    if (substep0.outcome !== 'apiError' || substep0.apiError?.status !== 409 || substep0.apiError?.code !== 'HTTP_ERROR') {
      this.recordAssertion('T8', false, `Substep 0 expected 409/HTTP_ERROR, got ${substep0.outcome}`)
      throw new Error(`T8 failed on substep 0: expected 409/HTTP_ERROR`)
    }
    this.assertT2(substep1, this.state.checkpointABaseline ?? undefined)
    this.recordAssertion('T8', true, 'T8 rejected duplicate email with 409 and verified User A unchanged')
  }

  /**
   * Asserts W3 wire GET missing UUID -> 404 / application/problem+json and echo (F01, R2-F06).
   */
  public assertW3(envelope: HarnessEnvelope): void {
    if (envelope.wire?.status !== 404) {
      this.recordAssertion('W3', false, `Expected wire status 404, got ${envelope.wire?.status}`)
      throw new Error(`W3 failed: expected wire status 404`)
    }
    const ct = envelope.wire?.headers?.['content-type']
    if (!ct?.includes('application/problem+json')) {
      this.recordAssertion('W3', false, `Expected application/problem+json, got ${ct}`)
      throw new Error(`W3 failed: content-type mismatch: got ${ct}`)
    }
    this.assertWireEcho('W3', envelope)
    this.recordAssertion('W3', true, 'W3 returned 404 with application/problem+json and x-request-id echo')
  }

  /**
   * Asserts T6-W wire POST malformed JSON -> 400 / application/problem+json and echo (F01, R2-F06).
   */
  public assertT6W(envelope: HarnessEnvelope): void {
    if (envelope.wire?.status !== 400) {
      this.recordAssertion('T6-W', false, `Expected wire status 400, got ${envelope.wire?.status}`)
      throw new Error(`T6-W failed: expected wire status 400`)
    }
    const ct = envelope.wire?.headers?.['content-type']
    if (!ct?.includes('application/problem+json')) {
      this.recordAssertion('T6-W', false, `Expected application/problem+json, got ${ct}`)
      throw new Error(`T6-W failed: content-type mismatch: got ${ct}`)
    }
    this.assertWireEcho('T6-W', envelope)
    this.recordAssertion('T6-W', true, 'T6-W returned 400 with application/problem+json and x-request-id echo')
  }

  /**
   * Asserts T7-W wire POST missing content-type -> 415 / application/problem+json and echo (F01, R2-F06).
   */
  public assertT7W(envelope: HarnessEnvelope): void {
    if (envelope.wire?.status !== 415) {
      this.recordAssertion('T7-W', false, `Expected wire status 415, got ${envelope.wire?.status}`)
      throw new Error(`T7-W failed: expected wire status 415`)
    }
    const ct = envelope.wire?.headers?.['content-type']
    if (!ct?.includes('application/problem+json')) {
      this.recordAssertion('T7-W', false, `Expected application/problem+json, got ${ct}`)
      throw new Error(`T7-W failed: content-type mismatch: got ${ct}`)
    }
    this.assertWireEcho('T7-W', envelope)
    this.recordAssertion('T7-W', true, 'T7-W returned 415 with application/problem+json and x-request-id echo')
  }

  /**
   * Asserts INT-PERS-01 readback after Go restart (F01).
   */
  public assertPers01(envelope: HarnessEnvelope): void {
    this.assertT2(envelope, this.state.checkpointABaseline ?? undefined)
    this.recordAssertion('INT-PERS-01', true, 'INT-PERS-01 verified User A unchanged across Go restart')
  }

  /**
   * Asserts INT-PERS-02 readback after PG restart (F01).
   */
  public assertPers02(envelope: HarnessEnvelope): void {
    this.assertT2(envelope, this.state.checkpointABaseline ?? undefined)
    this.recordAssertion('INT-PERS-02', true, 'INT-PERS-02 verified User A unchanged across PostgreSQL restart')
  }

  /**
   * Asserts T9 PATCH User A -> version 2 and updated name (F01, R2-F09).
   */
  public assertT9(envelope: HarnessEnvelope): CheckpointUserA {
    const cp = this.state.checkpointACurrent ?? this.state.checkpointABaseline ?? this.state.checkpointA
    if (!cp) {
      throw new Error('T9 assertion error: Checkpoint A missing')
    }
    if (envelope.truncated) {
      this.recordAssertion('T9', false, 'Envelope body truncated', true)
      throw new Error('T9 assertion blocked: envelope body was truncated')
    }
    if (envelope.outcome !== 'value' || !envelope.value) {
      this.recordAssertion('T9', false, `Expected outcome value, got ${envelope.outcome}`)
      throw new Error(`T9 failed: unexpected outcome ${envelope.outcome}`)
    }

    const val = envelope.value as any

    if (val.id !== cp.id) {
      this.recordAssertion('T9', false, `Expected id ${cp.id}, got ${val.id}`)
      throw new Error(`T9 failed: id mismatch`)
    }
    if (val.email !== cp.email) {
      this.recordAssertion('T9', false, `Expected email ${cp.email}, got ${val.email}`)
      throw new Error(`T9 failed: email mismatch`)
    }
    if (val.version !== 2) {
      this.recordAssertion('T9', false, `Expected version 2, got ${val.version}`)
      throw new Error(`T9 failed: expected version 2, got ${val.version}`)
    }
    if (val.name !== 'INTA_A_UPDATED') {
      this.recordAssertion('T9', false, `Expected name INTA_A_UPDATED, got ${val.name}`)
      throw new Error(`T9 failed: expected name INTA_A_UPDATED, got ${val.name}`)
    }
    if (!RFC3339_UTC_REGEX.test(val.updated_at)) {
      this.recordAssertion('T9', false, `Invalid updated_at RFC 3339: ${val.updated_at}`)
      throw new Error(`T9 failed: invalid updated_at RFC 3339 UTC: ${val.updated_at}`)
    }

    const updatedUserA: CheckpointUserA = {
      ...cp,
      version: 2,
      name: 'INTA_A_UPDATED',
      updated_at: val.updated_at,
    }
    this.saveCurrentCheckpoint(updatedUserA)
    this.recordAssertion('T9', true, 'T9 updated User A to version 2 with name INTA_A_UPDATED and verified RFC 3339 UTC updated_at')
    return updatedUserA
  }

  /**
   * Asserts W9 wire GET User A after T9 -> ETag "2" and echo (F01, R2-F06).
   */
  public assertW9(envelope: HarnessEnvelope): void {
    if (envelope.wire?.status !== 200) {
      this.recordAssertion('W9', false, `Expected wire status 200, got ${envelope.wire?.status}`)
      throw new Error(`W9 failed: expected wire status 200`)
    }
    const etag = envelope.wire?.headers?.etag
    if (etag !== '"2"') {
      this.recordAssertion('W9', false, `Expected ETag "2", got ${etag}`)
      throw new Error(`W9 failed: expected ETag "2", got ${etag}`)
    }
    this.assertWireEcho('W9', envelope)
    this.recordAssertion('W9', true, 'W9 read User A with 200, ETag "2" and x-request-id echo')
  }

  /**
   * Asserts T10 stale update -> 412 and User A version 2 preserved (F01).
   */
  public assertT10(envelopes: HarnessEnvelope[]): void {
    if (envelopes.length !== 2) {
      throw new Error(`T10 expected 2 substeps, got ${envelopes.length}`)
    }
    const [substep0, substep1] = envelopes
    if (substep0.truncated) {
      this.recordAssertion('T10', false, 'T10 substep 0 body truncated', true)
      throw new Error('T10 assertion blocked: substep 0 truncated')
    }
    if (substep0.outcome !== 'apiError' || substep0.apiError?.status !== 412 || substep0.apiError?.code !== 'HTTP_ERROR') {
      this.recordAssertion('T10', false, `Substep 0 expected 412/HTTP_ERROR, got ${substep0.outcome}`)
      throw new Error(`T10 failed on substep 0: expected 412/HTTP_ERROR`)
    }
    this.assertT2(substep1, this.state.checkpointACurrent ?? undefined)
    this.recordAssertion('T10', true, 'T10 rejected stale update with 412 and verified User A version 2 preserved')
  }

  /**
   * Asserts T11a GET A during PG outage -> 503 unavailable with native literals (F01).
   */
  public assertT11a(envelope: HarnessEnvelope): void {
    if (envelope.outcome !== 'apiError' || envelope.apiError?.status !== 503) {
      this.recordAssertion('T11a', false, `Expected 503, got ${envelope.outcome}`)
      throw new Error(`T11a failed: expected 503, got ${envelope.outcome}`)
    }
    if (envelope.classification !== 'unavailable') {
      this.recordAssertion('T11a', false, `Expected classification unavailable, got ${envelope.classification}`)
      throw new Error(`T11a failed: expected classification unavailable`)
    }
    const details = envelope.apiError?.details as any
    if (details?.type !== '/problems/unavailable' || details?.retryAfter !== 1 || !details?.detail?.includes('service temporarily unavailable')) {
      this.recordAssertion('T11a', false, `Native 503 problem detail mismatch: ${JSON.stringify(details)}`)
      throw new Error(`T11a failed: native problem detail mismatch`)
    }
    this.recordAssertion('T11a', true, 'T11a returned 503 unavailable with native problem literals (/problems/unavailable, retryAfter: 1)')
  }

  /**
   * Asserts T11b PATCH A during PG outage -> 503 unavailable (F01).
   */
  public assertT11b(envelope: HarnessEnvelope): void {
    if (envelope.outcome !== 'apiError' || envelope.apiError?.status !== 503) {
      this.recordAssertion('T11b', false, `Expected 503, got ${envelope.outcome}`)
      throw new Error(`T11b failed: expected 503`)
    }
    if (envelope.classification !== 'unavailable') {
      this.recordAssertion('T11b', false, `Expected classification unavailable, got ${envelope.classification}`)
      throw new Error(`T11b failed: expected classification unavailable`)
    }
    this.recordAssertion('T11b', true, 'T11b returned 503 unavailable')
  }

  /**
   * Asserts T11c POST X during PG outage -> 503 unavailable, userXOutcome = OUTCOME_UNKNOWN (F01).
   */
  public assertT11c(envelope: HarnessEnvelope): void {
    if (envelope.outcome !== 'apiError' || envelope.apiError?.status !== 503) {
      this.recordAssertion('T11c', false, `Expected 503, got ${envelope.outcome}`)
      throw new Error(`T11c failed: expected 503`)
    }
    if (envelope.classification !== 'unavailable') {
      this.recordAssertion('T11c', false, `Expected classification unavailable, got ${envelope.classification}`)
      throw new Error(`T11c failed: expected classification unavailable`)
    }
    this.state.userXOutcome = 'OUTCOME_UNKNOWN'
    this.saveStateSnapshot()
    this.recordAssertion('T11c', true, 'T11c returned 503 unavailable; User X outcome marked OUTCOME_UNKNOWN (no replay/probe)')
  }

  /**
   * Asserts W11 wire GET A during PG outage -> 503 / application/problem+json and echo (F01, R2-F06).
   */
  public assertW11(envelope: HarnessEnvelope): void {
    if (envelope.wire?.status !== 503) {
      this.recordAssertion('W11', false, `Expected wire status 503, got ${envelope.wire?.status}`)
      throw new Error(`W11 failed: expected wire status 503`)
    }
    const ct = envelope.wire?.headers?.['content-type']
    if (!ct?.includes('application/problem+json')) {
      this.recordAssertion('W11', false, `Expected application/problem+json, got ${ct}`)
      throw new Error(`W11 failed: content-type mismatch: got ${ct}`)
    }
    this.assertWireEcho('W11', envelope)
    this.recordAssertion('W11', true, 'W11 returned 503 with application/problem+json and x-request-id echo')
  }

  /**
   * Asserts INT-PERS-03 recovery readback (F01).
   */
  public assertPers03(envelope: HarnessEnvelope): void {
    this.assertT2(envelope, this.state.checkpointACurrent ?? undefined)
    this.recordAssertion('INT-PERS-03', true, 'INT-PERS-03 verified User A recovery state after PG restart')
  }

  /**
   * Asserts INT-PERS-04 recovery readback (F01).
   */
  public assertPers04(envelope: HarnessEnvelope): void {
    this.assertT2(envelope, this.state.checkpointACurrent ?? undefined)
    this.recordAssertion('INT-PERS-04', true, 'INT-PERS-04 verified User A read-only recovery')
  }

  /**
   * Asserts T12 GET A after Go stopped -> status 0, NETWORK_ERROR, unavailable (F01).
   */
  public assertT12(envelope: HarnessEnvelope): void {
    if (envelope.outcome !== 'apiError' || envelope.apiError?.status !== 0 || envelope.apiError?.code !== 'NETWORK_ERROR') {
      this.recordAssertion('T12', false, `Expected status 0/NETWORK_ERROR, got ${envelope.outcome}/${envelope.apiError?.code}`)
      throw new Error(`T12 failed: expected status 0/NETWORK_ERROR`)
    }
    if (envelope.classification !== 'unavailable') {
      this.recordAssertion('T12', false, `Expected classification unavailable, got ${envelope.classification}`)
      throw new Error(`T12 failed: expected classification unavailable`)
    }
    this.recordAssertion('T12', true, 'T12 verified NETWORK_ERROR and unavailable classification after Go shutdown')
  }

  /**
   * Backward-compatible helper for pause status.
   */
  public pauseForUpstreamCoordination(envReady: boolean): void {
    if (!envReady) {
      this.state.stage = 'PAUSED_WAITING_ENV'
      this.state.phase = 'PAUSED_WAITING_ENV'
      return
    }
    this.state.stage = 'ENV_COORDINATED_READY'
    this.state.phase = 'ENV_COORDINATED_READY'
  }

  /**
   * Checks driver-only upstream readiness gate (F01).
   */
  public checkEnvReadiness(envReadyOption?: boolean): boolean {
    const isReady = Boolean(envReadyOption || process.env.MC_INTA_ENV_READY === '1')
    if (!isReady) {
      this.state.stage = 'PAUSED_WAITING_ENV'
      return false
    }
    return true
  }

  /**
   * Helper: check if a prior stage was completed (R2-F01).
   */
  public isStageCompleted(stageNum: number): boolean {
    const markerFile = path.join(this.stagesDir, `stage${stageNum}.completed`)
    if (!fs.existsSync(markerFile)) {
      return false
    }
    let data: any
    try {
      const content = fs.readFileSync(markerFile, 'utf-8')
      data = JSON.parse(content)
    } catch (err: any) {
      throw new Error(
        `Fail-closed: unreadable or corrupt stage completion marker for stage ${stageNum} in ${markerFile}: ${err.message}`,
      )
    }
    if (!data || typeof data !== 'object' || data.stage !== stageNum) {
      throw new Error(
        `Fail-closed: corrupt stage completion marker for stage ${stageNum} in ${markerFile} (expected stage: ${stageNum}, got: ${data?.stage})`,
      )
    }
    return true
  }

  /**
   * Helper: record stage completion marker atomically (R2-F01, R3-F03).
   */
  public markStageCompleted(stageNum: number): void {
    const markerFile = path.join(this.stagesDir, `stage${stageNum}.completed`)
    const tmpFile = path.join(this.stagesDir, `.stage${stageNum}.${process.pid}.${Date.now()}.tmp`)
    fs.writeFileSync(
      tmpFile,
      JSON.stringify({ stage: stageNum, completedAtUTC: new Date().toISOString() }, null, 2),
      'utf-8',
    )
    fs.renameSync(tmpFile, markerFile)
    this.state.stage = `STAGE_${stageNum}_COMPLETED`
    this.saveStateSnapshot()
  }

  /**
   * Dispatches a single case to the local Next.js dev server endpoint with pre-dispatch intent guard (F01, R2-F02).
   */
  public async dispatchCaseToHarness(
    caseId: CaseId,
    refId?: string,
    harnessBaseUrl = 'http://127.0.0.1:18085',
  ): Promise<HarnessEnvelope[]> {
    // 1. R2-F02: Atomically reserve started intent BEFORE any I/O
    this.reserveSubstepIntent(caseId)

    const payload: { runId: string; caseId: CaseId; refId?: string } = {
      runId: this.runId,
      caseId,
    }
    if (refId) {
      payload.refId = refId
    }

    try {
      const response = await fetch(`${harnessBaseUrl}/harness/case`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        cache: 'no-store',
      })

      if (!response.ok) {
        const errText = await response.text()
        throw new Error(
          `Harness dispatch failed for ${caseId}: HTTP ${response.status} ${response.statusText} — ${errText}`,
        )
      }

      const json = (await response.json()) as any
      if (!json?.substeps || !Array.isArray(json.substeps)) {
        throw new Error(`Malformed harness response for ${caseId}: missing substeps array`)
      }

      return json.substeps as HarnessEnvelope[]
    } catch (err: any) {
      if (caseId === 'T11c') {
        this.completeSubstepIntent('T11c', 'unknown')
        this.state.userXOutcome = 'OUTCOME_UNKNOWN'
        this.saveStateSnapshot()
      }
      throw err
    }
  }

  /**
   * Executes a specific stage command with strict causal ordering and confirmation gates (R2-F01).
   */
  public async runStage(
    stageNum: number,
    options?: {
      envReady?: boolean
      harnessBaseUrl?: string
      confirmGoRestarted?: boolean
      confirmPgRestarted?: boolean
      confirmPgStopped?: boolean
      confirmPgRecovered?: boolean
      confirmGoStopped?: boolean
    },
  ): Promise<{ ok: boolean; reason?: string; executedCases: string[] }> {
    if (this.isStageCompleted(stageNum)) {
      throw new Error(
        `Stage ${stageNum} already completed for runId ${this.runId}. Replay of completed stage is prohibited.`,
      )
    }

    const harnessBaseUrl = options?.harnessBaseUrl ?? 'http://127.0.0.1:18085'
    const executedCases: string[] = []

    switch (stageNum) {
      case 1: {
        // Stage 1: Baseline and Initial Negatives (T1, T2, W1, W2, T3, T4, T5, T8, W3, T6-W, T7-W)
        if (!this.checkEnvReadiness(options?.envReady)) {
          console.log(`[DRIVER_PAUSED] Stage 1 paused: upstream environment not verified ready.`)
          console.log('Set MC_INTA_ENV_READY=1 or pass --env-ready after Codex/ZCode verified handoff.')
          return { ok: false, reason: 'PAUSED_WAITING_ENV', executedCases: [] }
        }

        console.log(`[DRIVER] Executing Stage 1 (Baseline & Initial Negatives) for runId ${this.runId}...`)

        // T1: POST User A
        const t1Steps = await this.dispatchCaseToHarness('T1', undefined, harnessBaseUrl)
        this.persistEnvelope('T1', t1Steps)
        const cpA = this.assertT1(t1Steps[0])
        this.completeSubstepIntent('T1')
        executedCases.push('T1')

        // T2: GET User A
        const t2Steps = await this.dispatchCaseToHarness('T2', cpA.id, harnessBaseUrl)
        this.persistEnvelope('T2', t2Steps)
        this.assertT2(t2Steps[0])
        this.completeSubstepIntent('T2')
        executedCases.push('T2')

        // W1: POST User B (wire)
        const w1Steps = await this.dispatchCaseToHarness('W1', undefined, harnessBaseUrl)
        this.persistEnvelope('W1', w1Steps)
        this.assertW1(w1Steps[0])
        this.completeSubstepIntent('W1')
        executedCases.push('W1')

        // W2: GET User A (wire)
        const w2Steps = await this.dispatchCaseToHarness('W2', cpA.id, harnessBaseUrl)
        this.persistEnvelope('W2', w2Steps)
        this.assertW2(w2Steps[0])
        this.completeSubstepIntent('W2')
        executedCases.push('W2')

        // T3: GET missing UUID
        const t3Steps = await this.dispatchCaseToHarness('T3', undefined, harnessBaseUrl)
        this.persistEnvelope('T3', t3Steps)
        this.assertT3(t3Steps[0])
        this.completeSubstepIntent('T3')
        executedCases.push('T3')

        // T4: Malformed and uppercase UUIDs
        const t4Steps = await this.dispatchCaseToHarness('T4', undefined, harnessBaseUrl)
        this.persistEnvelope('T4', t4Steps)
        this.assertT4(t4Steps)
        this.completeSubstepIntent('T4')
        executedCases.push('T4')

        // T5: Invalid name (422) + User A readback
        const t5Steps = await this.dispatchCaseToHarness('T5', cpA.id, harnessBaseUrl)
        this.persistEnvelope('T5', t5Steps)
        this.assertT5(t5Steps)
        this.completeSubstepIntent('T5')
        executedCases.push('T5')

        // T8: Duplicate email (409) + User A readback
        const t8Steps = await this.dispatchCaseToHarness('T8', cpA.id, harnessBaseUrl)
        this.persistEnvelope('T8', t8Steps)
        this.assertT8(t8Steps)
        this.completeSubstepIntent('T8')
        executedCases.push('T8')

        // W3: GET missing UUID (wire 404)
        const w3Steps = await this.dispatchCaseToHarness('W3', undefined, harnessBaseUrl)
        this.persistEnvelope('W3', w3Steps)
        this.assertW3(w3Steps[0])
        this.completeSubstepIntent('W3')
        executedCases.push('W3')

        // T6-W: Malformed JSON (wire 400)
        const t6wSteps = await this.dispatchCaseToHarness('T6-W', undefined, harnessBaseUrl)
        this.persistEnvelope('T6-W', t6wSteps)
        this.assertT6W(t6wSteps[0])
        this.completeSubstepIntent('T6-W')
        executedCases.push('T6-W')

        // T7-W: Missing content-type (wire 415)
        const t7wSteps = await this.dispatchCaseToHarness('T7-W', undefined, harnessBaseUrl)
        this.persistEnvelope('T7-W', t7wSteps)
        this.assertT7W(t7wSteps[0])
        this.completeSubstepIntent('T7-W')
        executedCases.push('T7-W')

        this.markStageCompleted(1)

        console.log('\n[LIFECYCLE_BARRIER] Stage 1 completed successfully.')
        console.log(`Baseline Checkpoint User A persisted to ${this.checkpointDir}/checkpointA.baseline.json`)
        console.log('>>> External owner action required: ZCode restart Go binary (INT-PERS-01). <<<')
        console.log('>>> Resume Stage 2 by passing --confirm-go-restarted after Go restart is verified. <<<')
        return { ok: true, executedCases }
      }

      case 2: {
        // Stage 2: Readback after Go restart ONLY (INT-PERS-01)
        if (!this.isStageCompleted(1)) {
          throw new Error('Stage 2 order violation: Stage 1 must be completed first.')
        }

        const goRestartConfirmed = Boolean(
          options?.confirmGoRestarted || process.env.MC_INTA_CONFIRM_GO_RESTARTED === '1',
        )
        if (!goRestartConfirmed) {
          console.log('[DRIVER_PAUSED] Stage 2 paused: Go restart confirmation missing.')
          console.log('Set MC_INTA_CONFIRM_GO_RESTARTED=1 or pass --confirm-go-restarted after ZCode restarts Go.')
          return { ok: false, reason: 'PAUSED_WAITING_GO_RESTART_CONFIRMATION', executedCases: [] }
        }

        console.log(`[DRIVER] Executing Stage 2 (INT-PERS-01 after Go restart) for runId ${this.runId}...`)
        const cpA = this.state.checkpointABaseline
        if (!cpA) {
          throw new Error('Stage 2 error: Checkpoint A missing. Run stage 1 first.')
        }

        const pers01Steps = await this.dispatchCaseToHarness('INT-PERS-01', cpA.id, harnessBaseUrl)
        this.persistEnvelope('INT-PERS-01', pers01Steps)
        this.assertPers01(pers01Steps[0])
        this.completeSubstepIntent('INT-PERS-01')
        executedCases.push('INT-PERS-01')

        this.markStageCompleted(2)

        console.log('\n[LIFECYCLE_BARRIER] Stage 2 completed successfully.')
        console.log('User A verified unchanged after Go restart alone.')
        console.log('>>> External owner action required: Codex stop and restart same PostgreSQL container (INT-PERS-02). <<<')
        console.log('>>> Resume Stage 3 by passing --confirm-pg-restarted after PostgreSQL restart is verified. <<<')
        return { ok: true, executedCases }
      }

      case 3: {
        // Stage 3: Readback after PostgreSQL restart (INT-PERS-02)
        if (!this.isStageCompleted(2)) {
          throw new Error('Stage 3 order violation: Stage 2 must be completed first.')
        }

        const pgRestartConfirmed = Boolean(
          options?.confirmPgRestarted || process.env.MC_INTA_CONFIRM_PG_RESTARTED === '1',
        )
        if (!pgRestartConfirmed) {
          console.log('[DRIVER_PAUSED] Stage 3 paused: PostgreSQL restart confirmation missing.')
          console.log('Set MC_INTA_CONFIRM_PG_RESTARTED=1 or pass --confirm-pg-restarted after Codex restarts PG.')
          return { ok: false, reason: 'PAUSED_WAITING_PG_RESTART_CONFIRMATION', executedCases: [] }
        }

        console.log(`[DRIVER] Executing Stage 3 (INT-PERS-02 after PG restart) for runId ${this.runId}...`)
        const cpA = this.state.checkpointABaseline
        if (!cpA) {
          throw new Error('Stage 3 error: Checkpoint A missing.')
        }

        const pers02Steps = await this.dispatchCaseToHarness('INT-PERS-02', cpA.id, harnessBaseUrl)
        this.persistEnvelope('INT-PERS-02', pers02Steps)
        this.assertPers02(pers02Steps[0])
        this.completeSubstepIntent('INT-PERS-02')
        executedCases.push('INT-PERS-02')

        this.markStageCompleted(3)

        console.log('\n[LIFECYCLE_BARRIER] Stage 3 completed successfully.')
        console.log('User A verified unchanged after PostgreSQL restart.')
        console.log('Next: Run Stage 4 for mutations and stale update.')
        return { ok: true, executedCases }
      }

      case 4: {
        // Stage 4: Mutations & Stale Update (T9, W9, T10)
        if (!this.isStageCompleted(3)) {
          throw new Error('Stage 4 order violation: Stage 3 must be completed first.')
        }

        console.log(`[DRIVER] Executing Stage 4 (Mutations & Stale Update) for runId ${this.runId}...`)
        const cpA = this.state.checkpointABaseline
        if (!cpA) {
          throw new Error('Stage 4 error: Checkpoint A missing.')
        }

        // T9: PATCH User A with If-Match "1"
        const t9Steps = await this.dispatchCaseToHarness('T9', cpA.id, harnessBaseUrl)
        this.persistEnvelope('T9', t9Steps)
        this.assertT9(t9Steps[0])
        this.completeSubstepIntent('T9')
        executedCases.push('T9')

        // W9: Wire GET User A -> ETag "2"
        const w9Steps = await this.dispatchCaseToHarness('W9', cpA.id, harnessBaseUrl)
        this.persistEnvelope('W9', w9Steps)
        this.assertW9(w9Steps[0])
        this.completeSubstepIntent('W9')
        executedCases.push('W9')

        // T10: PATCH User A with stale If-Match "1" (412) + readback
        const t10Steps = await this.dispatchCaseToHarness('T10', cpA.id, harnessBaseUrl)
        this.persistEnvelope('T10', t10Steps)
        this.assertT10(t10Steps)
        this.completeSubstepIntent('T10')
        executedCases.push('T10')

        this.markStageCompleted(4)

        console.log('\n[LIFECYCLE_BARRIER] Stage 4 completed successfully.')
        console.log('User A updated to version 2 (name INTA_A_UPDATED). Stale update 412 verified.')
        console.log('>>> External owner action required: Codex stop PostgreSQL container (T11 outage with Go running). <<<')
        console.log('>>> Resume Stage 5 by passing --confirm-pg-stopped after PostgreSQL is stopped. <<<')
        return { ok: true, executedCases }
      }

      case 5: {
        // Stage 5: Outage Cases (T11a, T11b, T11c, W11)
        if (!this.isStageCompleted(4)) {
          throw new Error('Stage 5 order violation: Stage 4 must be completed first.')
        }

        const pgStoppedConfirmed = Boolean(
          options?.confirmPgStopped || process.env.MC_INTA_CONFIRM_PG_STOPPED === '1',
        )
        if (!pgStoppedConfirmed) {
          console.log('[DRIVER_PAUSED] Stage 5 paused: PostgreSQL outage stop confirmation missing.')
          console.log('Set MC_INTA_CONFIRM_PG_STOPPED=1 or pass --confirm-pg-stopped after Codex stops PG.')
          return { ok: false, reason: 'PAUSED_WAITING_PG_STOP_CONFIRMATION', executedCases: [] }
        }

        console.log(`[DRIVER] Executing Stage 5 (Outage Cases) for runId ${this.runId}...`)
        const cpA = this.state.checkpointACurrent
        if (!cpA) {
          throw new Error('Stage 5 error: Current Checkpoint A missing.')
        }

        // T11a: GET User A during PG outage
        const t11aSteps = await this.dispatchCaseToHarness('T11a', cpA.id, harnessBaseUrl)
        this.persistEnvelope('T11a', t11aSteps)
        this.assertT11a(t11aSteps[0])
        this.completeSubstepIntent('T11a')
        executedCases.push('T11a')

        // T11b: PATCH User A during PG outage
        const t11bSteps = await this.dispatchCaseToHarness('T11b', cpA.id, harnessBaseUrl)
        this.persistEnvelope('T11b', t11bSteps)
        this.assertT11b(t11bSteps[0])
        this.completeSubstepIntent('T11b')
        executedCases.push('T11b')

        // T11c: POST User X during PG outage (X outcome always UNKNOWN)
        const t11cSteps = await this.dispatchCaseToHarness('T11c', undefined, harnessBaseUrl)
        this.persistEnvelope('T11c', t11cSteps)
        this.assertT11c(t11cSteps[0])
        this.completeSubstepIntent('T11c', 'unknown')
        executedCases.push('T11c')

        // W11: Wire GET User A during PG outage
        const w11Steps = await this.dispatchCaseToHarness('W11', cpA.id, harnessBaseUrl)
        this.persistEnvelope('W11', w11Steps)
        this.assertW11(w11Steps[0])
        this.completeSubstepIntent('W11')
        executedCases.push('W11')

        this.markStageCompleted(5)

        console.log('\n[LIFECYCLE_BARRIER] Stage 5 completed successfully.')
        console.log('Outage 503 verified for T11a/b/c, W11; User X outcome marked OUTCOME_UNKNOWN.')
        console.log('>>> External owner action required: Codex restart PostgreSQL container without restarting Go. <<<')
        console.log('>>> Resume Stage 6 by passing --confirm-pg-recovered after PostgreSQL is running. <<<')
        return { ok: true, executedCases }
      }

      case 6: {
        // Stage 6: Recovery Reads (INT-PERS-03, INT-PERS-04)
        if (!this.isStageCompleted(5)) {
          throw new Error('Stage 6 order violation: Stage 5 must be completed first.')
        }

        const pgRecoveredConfirmed = Boolean(
          options?.confirmPgRecovered || process.env.MC_INTA_CONFIRM_PG_RECOVERED === '1',
        )
        if (!pgRecoveredConfirmed) {
          console.log('[DRIVER_PAUSED] Stage 6 paused: PostgreSQL recovery confirmation missing.')
          console.log('Set MC_INTA_CONFIRM_PG_RECOVERED=1 or pass --confirm-pg-recovered after Codex restarts PG.')
          return { ok: false, reason: 'PAUSED_WAITING_PG_RECOVERY_CONFIRMATION', executedCases: [] }
        }

        console.log(`[DRIVER] Executing Stage 6 (Recovery Reads) for runId ${this.runId}...`)
        const cpA = this.state.checkpointACurrent
        if (!cpA) {
          throw new Error('Stage 6 error: Current Checkpoint A missing.')
        }

        // INT-PERS-03: Recovery readback
        const pers03Steps = await this.dispatchCaseToHarness('INT-PERS-03', cpA.id, harnessBaseUrl)
        this.persistEnvelope('INT-PERS-03', pers03Steps)
        this.assertPers03(pers03Steps[0])
        this.completeSubstepIntent('INT-PERS-03')
        executedCases.push('INT-PERS-03')

        // INT-PERS-04: Read-only recovery readback
        const pers04Steps = await this.dispatchCaseToHarness('INT-PERS-04', cpA.id, harnessBaseUrl)
        this.persistEnvelope('INT-PERS-04', pers04Steps)
        this.assertPers04(pers04Steps[0])
        this.completeSubstepIntent('INT-PERS-04')
        executedCases.push('INT-PERS-04')

        this.markStageCompleted(6)

        console.log('\n[LIFECYCLE_BARRIER] Stage 6 completed successfully.')
        console.log('User A recovery state verified (version 2 preserved).')
        console.log('>>> External owner action required: ZCode stop Go binary for T12. <<<')
        console.log('>>> Resume Stage 7 by passing --confirm-go-stopped after Go is stopped. <<<')
        return { ok: true, executedCases }
      }

      case 7: {
        // Stage 7: Shutdown Case (T12)
        if (!this.isStageCompleted(6)) {
          throw new Error('Stage 7 order violation: Stage 6 must be completed first.')
        }

        const goStoppedConfirmed = Boolean(
          options?.confirmGoStopped || process.env.MC_INTA_CONFIRM_GO_STOPPED === '1',
        )
        if (!goStoppedConfirmed) {
          console.log('[DRIVER_PAUSED] Stage 7 paused: Go stop confirmation missing.')
          console.log('Set MC_INTA_CONFIRM_GO_STOPPED=1 or pass --confirm-go-stopped after ZCode stops Go.')
          return { ok: false, reason: 'PAUSED_WAITING_GO_STOP_CONFIRMATION', executedCases: [] }
        }

        console.log(`[DRIVER] Executing Stage 7 (Shutdown Case T12) for runId ${this.runId}...`)
        const cpA = this.state.checkpointACurrent
        if (!cpA) {
          throw new Error('Stage 7 error: Current Checkpoint A missing.')
        }

        // T12: GET User A after Go stopped
        const t12Steps = await this.dispatchCaseToHarness('T12', cpA.id, harnessBaseUrl)
        this.persistEnvelope('T12', t12Steps)
        this.assertT12(t12Steps[0])
        this.completeSubstepIntent('T12')
        executedCases.push('T12')

        this.markStageCompleted(7)

        console.log('\n[LIFECYCLE_SUMMARY] Stage 7 completed successfully.')
        console.log('All 23 companion endpoint cases completed and asserted.')
        console.log('13 external-owner procedures (INT-ENV-01..07, INT-COR-01, INT-PRIV-01, INT-ISO-01..03, INT-CONF-01) remain pending external-owner evidence.')
        return { ok: true, executedCases }
      }

      default:
        throw new Error(`Unknown stage number: ${stageNum} (must be 1..7)`)
    }
  }
}

/**
 * CLI runner main function (F01, R2-F01, R4-F05).
 */
export async function main(argv: string[] = process.argv.slice(2)): Promise<void> {
  const args = argv
  const cmd = args[0] ?? 'help'

  if (cmd === 'help' || cmd === '--help' || cmd === '-h') {
    console.log('MC-002-INTA-FE Executable Stage Runner (R4)')
    console.log('Usage:')
    console.log('  node src/driver.ts stage1 [--runId=<id>] [--env-ready] [--state-dir=<dir>]')
    console.log('  node src/driver.ts stage2 [--runId=<id>] [--confirm-go-restarted] [--state-dir=<dir>]')
    console.log('  node src/driver.ts stage3 [--runId=<id>] [--confirm-pg-restarted] [--state-dir=<dir>]')
    console.log('  node src/driver.ts stage4 [--runId=<id>] [--state-dir=<dir>]')
    console.log('  node src/driver.ts stage5 [--runId=<id>] [--confirm-pg-stopped] [--state-dir=<dir>]')
    console.log('  node src/driver.ts stage6 [--runId=<id>] [--confirm-pg-recovered] [--state-dir=<dir>]')
    console.log('  node src/driver.ts stage7 [--runId=<id>] [--confirm-go-stopped] [--state-dir=<dir>]')
    console.log('  node src/driver.ts status [--runId=<id>] [--state-dir=<dir>]')
    process.exit(0)
  }

  let runId: string | undefined
  let envReady = false
  let confirmGoRestarted = false
  let confirmPgRestarted = false
  let confirmPgStopped = false
  let confirmPgRecovered = false
  let confirmGoStopped = false
  let stateDir: string | undefined
  let harnessUrl: string | undefined

  for (const arg of args.slice(1)) {
    if (arg.startsWith('--runId=')) {
      runId = arg.slice(8)
    } else if (arg === '--env-ready') {
      envReady = true
    } else if (arg === '--confirm-go-restarted') {
      confirmGoRestarted = true
    } else if (arg === '--confirm-pg-restarted') {
      confirmPgRestarted = true
    } else if (arg === '--confirm-pg-stopped') {
      confirmPgStopped = true
    } else if (arg === '--confirm-pg-recovered') {
      confirmPgRecovered = true
    } else if (arg === '--confirm-go-stopped') {
      confirmGoStopped = true
    } else if (arg.startsWith('--state-dir=')) {
      stateDir = arg.slice(12)
    } else if (arg.startsWith('--harness-url=')) {
      harnessUrl = arg.slice(14)
    }
  }

  if (cmd.startsWith('phase')) {
    console.error(`Legacy phase command '${cmd}' is prohibited. Use canonical stage1..7 commands.`)
    process.exit(1)
  }

  const allowResume = cmd !== 'stage1'
  const driver = new HarnessDriver(runId, stateDir, allowResume)

  if (cmd === 'status') {
    console.log('--- Harness Driver State (R4) ---')
    console.log(`runId: ${driver.runId}`)
    console.log(`stage: ${driver.state.stage}`)
    console.log(`checkpointABaseline: ${JSON.stringify(driver.state.checkpointABaseline)}`)
    console.log(`checkpointACurrent: ${JSON.stringify(driver.state.checkpointACurrent)}`)
    console.log(`checkpointBId: ${driver.state.checkpointBId}`)
    console.log(`userXOutcome: ${driver.state.userXOutcome}`)
    console.log(`persistedEnvelopes: ${driver.state.envelopes.size}`)
    console.log(`assertions: ${driver.state.assertions.size}`)
    process.exit(0)
  }

  const stageMatch = cmd.match(/^stage([1-7])$/)
  if (stageMatch) {
    const stageNum = parseInt(stageMatch[1], 10)
    const result = await driver.runStage(stageNum, {
      envReady,
      harnessBaseUrl: harnessUrl,
      confirmGoRestarted,
      confirmPgRestarted,
      confirmPgStopped,
      confirmPgRecovered,
      confirmGoStopped,
    })
    if (!result.ok) {
      process.exit(2) // Paused waiting confirmation exit code
    }
    process.exit(0)
  }

  console.error(`Unknown command: ${cmd}. Run 'node src/driver.ts help' for usage.`)
  process.exit(1)
}

if (process.argv[1]) {
  try {
    const isMain = url.fileURLToPath(import.meta.url) === fs.realpathSync(process.argv[1])
    if (isMain) {
      main().catch((err) => {
        console.error('Fatal error in driver:', err)
        process.exit(1)
      })
    }
  } catch {}
}
