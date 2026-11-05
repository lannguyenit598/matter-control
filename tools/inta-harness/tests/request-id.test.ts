import { describe, expect, it, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { RequestIdGenerator } from '../src/request-id.js'

describe('RequestIdGenerator (INTA-FE-R03)', () => {
  const testStateDir = path.join(process.cwd(), '.test-run-state')

  beforeEach(() => {
    fs.mkdirSync(testStateDir, { recursive: true })
  })

  afterEach(() => {
    try {
      fs.rmSync(testStateDir, { recursive: true, force: true })
    } catch {}
  })

  it('generates monotonic request IDs formatted as mc-int-<runId>-<caseId>-<seq>', () => {
    const gen = new RequestIdGenerator('runABC1234', { stateDir: testStateDir })
    const id1 = gen.next('T1')
    const id2 = gen.next('T1')
    const id3 = gen.next('T2')

    expect(id1).toBe('mc-int-runABC1234-T1-1')
    expect(id2).toBe('mc-int-runABC1234-T1-2')
    expect(id3).toBe('mc-int-runABC1234-T2-3')
    expect(id1.length).toBeLessThanOrEqual(128)
    expect(/^mc-int-runABC1234-T[12]-[123]$/.test(id1)).toBe(true)
  })

  it('prevents ID collision across process restarts via persisted counter (R03)', () => {
    const runId = 'restartRun1234'
    // First process execution
    const genBoot1 = new RequestIdGenerator(runId, { stateDir: testStateDir })
    const id1 = genBoot1.next('T1')
    const id2 = genBoot1.next('T2')
    expect(id1).toBe(`mc-int-${runId}-T1-1`)
    expect(id2).toBe(`mc-int-${runId}-T2-2`)

    // Second process execution (simulating server reboot / dev hot reload with fresh memory)
    const genBoot2 = new RequestIdGenerator(runId, { stateDir: testStateDir })
    const id3 = genBoot2.next('T1')
    const id4 = genBoot2.next('T9')

    expect(id3).toBe(`mc-int-${runId}-T1-3`)
    expect(id4).toBe(`mc-int-${runId}-T9-4`)

    // None of the IDs must collide
    const set = new Set([id1, id2, id3, id4])
    expect(set.size).toBe(4)
  })

  it('maintains independent non-colliding counters when switching runIds (R03)', () => {
    const runA = 'runA12345678'
    const runB = 'runB12345678'

    const genA1 = new RequestIdGenerator(runA, { stateDir: testStateDir })
    expect(genA1.next('T1')).toBe(`mc-int-${runA}-T1-1`)
    expect(genA1.next('T2')).toBe(`mc-int-${runA}-T2-2`)

    // Switch to runB
    const genB = new RequestIdGenerator(runB, { stateDir: testStateDir })
    expect(genB.next('T1')).toBe(`mc-int-${runB}-T1-1`)

    // Switch back to runA — counter for runA must NOT have been reset
    const genA2 = new RequestIdGenerator(runA, { stateDir: testStateDir })
    expect(genA2.next('T5')).toBe(`mc-int-${runA}-T5-3`)
  })

  it('rejects invalid runId formats', () => {
    expect(() => new RequestIdGenerator('short', { stateDir: testStateDir })).toThrow(/Invalid runId format/)
    expect(() => new RequestIdGenerator('a'.repeat(33), { stateDir: testStateDir })).toThrow(/Invalid runId format/)
    expect(() => new RequestIdGenerator('invalid!', { stateDir: testStateDir })).toThrow(/Invalid runId format/)
  })

  it('fails closed when counters.json is corrupt or unreadable (F02)', () => {
    const runId = 'failClosed123'
    const countersFile = path.join(testStateDir, 'counters.json')
    // Corrupt JSON content
    fs.writeFileSync(countersFile, '{ corrupt json !!!', 'utf-8')

    expect(() => new RequestIdGenerator(runId, { stateDir: testStateDir })).toThrow(/Fail-closed/)

    // Non-integer counter value
    fs.writeFileSync(countersFile, JSON.stringify({ [runId]: 'not-a-number' }), 'utf-8')
    expect(() => new RequestIdGenerator(runId, { stateDir: testStateDir })).toThrow(/Fail-closed/)
  })

  it('prevents downward overwrite from stale overlapping instances (F02)', () => {
    const runId = 'overlapRun123'
    const genInstance1 = new RequestIdGenerator(runId, { stateDir: testStateDir })
    const genInstance2 = new RequestIdGenerator(runId, { stateDir: testStateDir })

    // Instance 2 generates up to seq 3
    expect(genInstance2.next('T1')).toBe(`mc-int-${runId}-T1-1`)
    expect(genInstance2.next('T2')).toBe(`mc-int-${runId}-T2-2`)
    expect(genInstance2.next('T3')).toBe(`mc-int-${runId}-T3-3`)

    // Now Instance 1 (which had loaded seq 0 earlier) generates next
    // It must NOT overwrite disk back down to 1
    const idFromInst1 = genInstance1.next('T4')
    expect(idFromInst1).toBe(`mc-int-${runId}-T4-4`)

    // A fresh boot loads seq >= 4
    const genBootFresh = new RequestIdGenerator(runId, { stateDir: testStateDir })
    expect(genBootFresh.next('T5')).toBe(`mc-int-${runId}-T5-5`)
  })
})
