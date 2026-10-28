import fs from 'node:fs'
import path from 'node:path'

export interface RequestIdGeneratorOptions {
  stateDir?: string
  initialSeq?: number
}

/**
 * Deterministic Request ID generator conforming to INTA-1 §3 and INTA-FE-R03.
 *
 * Emits IDs matching: mc-int-<runId>-<caseId>-<seq>
 * Total length <= 128 safe characters.
 *
 * Persists counter per runId in run-local storage (.run-state/counters.json)
 * so counters never reset on process restarts, dev module reloads, or runId switching.
 */
export class RequestIdGenerator {
  private seq: number
  private stateDir: string | null
  private stateFile: string | null

  constructor(
    public readonly runId: string,
    options?: RequestIdGeneratorOptions,
  ) {
    if (!/^[a-zA-Z0-9]{8,32}$/.test(runId)) {
      throw new Error(`Invalid runId format for RequestIdGenerator (must be 8-32 alphanumeric): ${runId}`)
    }

    this.stateDir =
      options?.stateDir ??
      process.env.MC_INTA_STATE_DIR ??
      path.join(process.cwd(), '.run-state')

    if (this.stateDir) {
      try {
        fs.mkdirSync(this.stateDir, { recursive: true })
        this.stateFile = path.join(this.stateDir, 'counters.json')
      } catch (err: any) {
        throw new Error(`Failed to initialize stateDir for RequestIdGenerator: ${err.message}`)
      }
    } else {
      this.stateFile = null
    }

    if (options?.initialSeq !== undefined) {
      this.seq = options.initialSeq
    } else {
      this.seq = this.loadPersistedSeq()
    }
  }

  private loadPersistedSeq(): number {
    if (!this.stateFile || !fs.existsSync(this.stateFile)) {
      return 0
    }
    try {
      const content = fs.readFileSync(this.stateFile, 'utf-8')
      const data = JSON.parse(content)
      if (typeof data !== 'object' || data === null) {
        throw new Error('counters.json root must be a JSON object')
      }
      if (data[this.runId] !== undefined) {
        if (typeof data[this.runId] !== 'number' || !Number.isInteger(data[this.runId])) {
          throw new Error(`Corrupt counter for runId ${this.runId} in counters.json: not an integer`)
        }
        return data[this.runId]
      }
      return 0
    } catch (err: any) {
      throw new Error(`Fail-closed: unreadable or corrupt counter state in ${this.stateFile}: ${err.message}`)
    }
  }

  private persistSeq(seq: number): void {
    if (!this.stateFile || !this.stateDir) return
    try {
      let data: Record<string, number> = {}
      if (fs.existsSync(this.stateFile)) {
        const content = fs.readFileSync(this.stateFile, 'utf-8')
        data = JSON.parse(content)
        if (typeof data !== 'object' || data === null) {
          throw new Error('counters.json root must be a JSON object')
        }
      }

      const onDiskSeq = typeof data[this.runId] === 'number' ? data[this.runId] : 0
      const finalSeq = Math.max(seq, onDiskSeq)
      data[this.runId] = finalSeq
      this.seq = Math.max(this.seq, finalSeq)

      // Atomic write via temp file + rename in same directory:
      const tempFile = path.join(
        this.stateDir,
        `.counters.${this.runId}.${process.pid}.${Date.now()}.${Math.random().toString(36).slice(2)}.tmp`
      )
      fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8')
      fs.renameSync(tempFile, this.stateFile)
    } catch (err: any) {
      throw new Error(`Fail-closed: failed to persist counter state in ${this.stateFile}: ${err.message}`)
    }
  }

  public currentSeq(): number {
    return this.seq
  }

  public next(caseId: string): string {
    let onDiskSeq = 0
    if (this.stateFile && fs.existsSync(this.stateFile)) {
      try {
        const content = fs.readFileSync(this.stateFile, 'utf-8')
        const data = JSON.parse(content)
        if (typeof data !== 'object' || data === null) {
          throw new Error('counters.json root must be a JSON object')
        }
        if (data[this.runId] !== undefined) {
          if (typeof data[this.runId] !== 'number' || !Number.isInteger(data[this.runId])) {
            throw new Error(`Corrupt counter for runId ${this.runId} in counters.json: not an integer`)
          }
          onDiskSeq = data[this.runId]
        }
      } catch (err: any) {
        throw new Error(`Fail-closed: unreadable or corrupt counter state in ${this.stateFile}: ${err.message}`)
      }
    }

    this.seq = Math.max(this.seq, onDiskSeq) + 1
    this.persistSeq(this.seq)

    const id = `mc-int-${this.runId}-${caseId}-${this.seq}`
    if (id.length > 128) {
      throw new Error(`RequestId exceeds 128 characters: ${id}`)
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(id)) {
      throw new Error(`RequestId contains invalid characters: ${id}`)
    }
    return id
  }
}
