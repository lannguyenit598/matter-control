import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawn, execSync, type ChildProcess } from 'node:child_process'

const HARNESS_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const HARNESS_PORT = 18085
const UPSTREAM_PORT = 18086
const HARNESS_HOST = '127.0.0.1'
const HARNESS_BASE_URL = `http://${HARNESS_HOST}:${HARNESS_PORT}`

const RUN_ID = 'inta20261025a' // Valid 8-32 alphanumeric runId
const STATE_DIR = path.join(HARNESS_ROOT, '.run-state')
const PID_FILE = path.join(STATE_DIR, 'harness.pid')
const PROVENANCE_FILE = path.join(STATE_DIR, 'harness.provenance')

fs.mkdirSync(STATE_DIR, { recursive: true })

interface GuardCheckResult {
  checkNum: number | string
  name: string
  method: string
  url: string
  payload?: any
  headers?: Record<string, string>
  expectedStatus: number | string
  actualStatus: number | string
  actualHeaders?: Record<string, string>
  actualBodyText: string
  parsedBody?: any
  pass: boolean
  failureReason?: string
}

async function waitForServer(url: string, timeoutMs = 15000): Promise<boolean> {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url, { method: 'GET', cache: 'no-store' })
      if (res.status === 405 || res.status === 200 || res.status === 404) {
        return true
      }
    } catch {
      // Server not ready yet
    }
    await new Promise((r) => setTimeout(r, 200))
  }
  return false
}

async function isPortInUse(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = http.createServer()
    server.once('error', (err: any) => {
      if (err.code === 'EADDRINUSE') {
        resolve(true)
      } else {
        resolve(false)
      }
    })
    server.once('listening', () => {
      server.close(() => resolve(false))
    })
    server.listen(port, HARNESS_HOST)
  })
}

function recordProvenance(pid: number): void {
  const startTime = execSync(`ps -p ${pid} -o lstart=`, { encoding: 'utf-8' }).trim()
  const cmd = execSync(`ps -p ${pid} -o command=`, { encoding: 'utf-8' }).trim()
  if (!startTime || !cmd) {
    throw new Error(`Failed to capture start-identity provenance for spawned PID ${pid}`)
  }
  fs.writeFileSync(PID_FILE, String(pid), 'utf-8')
  fs.writeFileSync(
    PROVENANCE_FILE,
    `pid=${pid}\nstartTime=${startTime}\ncmd=${cmd}\n`,
    'utf-8',
  )
}

async function stopOwnedHarness(pid: number): Promise<void> {
  console.log(`[${new Date().toISOString()}] Sending SIGTERM to owned PID ${pid}...`)
  try {
    process.kill(pid, 'SIGTERM')
  } catch {
    // Already stopped
  }

  const start = Date.now()
  while (Date.now() - start < 5000) {
    try {
      process.kill(pid, 0)
      await new Promise((r) => setTimeout(r, 100))
    } catch {
      console.log(`[${new Date().toISOString()}] Owned PID ${pid} stopped gracefully.`)
      if (fs.existsSync(PID_FILE)) fs.unlinkSync(PID_FILE)
      if (fs.existsSync(PROVENANCE_FILE)) fs.unlinkSync(PROVENANCE_FILE)
      return
    }
  }

  console.log(`[${new Date().toISOString()}] Owned PID ${pid} did not exit within 5s; sending SIGKILL...`)
  try {
    process.kill(pid, 'SIGKILL')
  } catch {}
  const killStart = Date.now()
  while (Date.now() - killStart < 2000) {
    try {
      process.kill(pid, 0)
      await new Promise((r) => setTimeout(r, 50))
    } catch {
      break
    }
  }
  if (fs.existsSync(PID_FILE)) fs.unlinkSync(PID_FILE)
  if (fs.existsSync(PROVENANCE_FILE)) fs.unlinkSync(PROVENANCE_FILE)
}

async function main() {
  console.log('='.repeat(80))
  console.log('MC-002-INTA-FE Authoritative Live Harness Guard Verification (R4)')
  console.log(`UTC Started: ${new Date().toISOString()}`)
  console.log(`Host: ${HARNESS_HOST}:${HARNESS_PORT}`)
  console.log(`Target runId: ${RUN_ID}`)
  console.log('='.repeat(80))

  // 1. Port conflict pre-check
  if (await isPortInUse(HARNESS_PORT)) {
    console.error(`FATAL: Port ${HARNESS_PORT} is already in use! Port conflict means STOP.`)
    process.exit(1)
  }
  if (await isPortInUse(UPSTREAM_PORT)) {
    console.error(`FATAL: Upstream port ${UPSTREAM_PORT} is already in use! Cannot start synthetic observer.`)
    process.exit(1)
  }

  // 2. Start pure synthetic upstream observer on 18086 to measure zero upstream calls
  console.log('\n--- Starting Synthetic Upstream Call Observer on 127.0.0.1:18086 ---')
  console.log('NOTE: Pure synthetic double for guard verification only — not real Go/PG.')
  let upstreamRequestsReceived = 0
  const upstreamServer = http.createServer((req, res) => {
    upstreamRequestsReceived++
    console.warn(`[UPSTREAM OBSERVER ALERT] Unexpected upstream call received: ${req.method} ${req.url}`)
    res.writeHead(500, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Unexpected upstream request during guard check' }))
  })
  await new Promise<void>((resolve) => upstreamServer.listen(UPSTREAM_PORT, HARNESS_HOST, () => resolve()))
  console.log(`Upstream observer listening on ${HARNESS_HOST}:${UPSTREAM_PORT}`)

  const results: GuardCheckResult[] = []
  const activePids = new Set<number>()
  const nextBinary = path.join(HARNESS_ROOT, 'node_modules/.bin/next')

  try {
    // ============================================================================
    // Phase 1: Test Checks 1-5 with MC_INTA_ENABLE=1 (Default clean environment)
    // ============================================================================
    console.log('\n' + '='.repeat(80))
    console.log('=== Phase 1: Checks 1–5 with MC_INTA_ENABLE=1 (Enabled) ===')
    console.log('='.repeat(80))

    const envPhase1: Record<string, string | undefined> = {
      ...process.env,
      MC_INTA_ENABLE: '1',
      NODE_ENV: 'development',
      MC_INTA_GO_BASE_URL: `http://${HARNESS_HOST}:${UPSTREAM_PORT}`,
    }
    delete envPhase1.API_MODE
    delete envPhase1.API_TOKEN
    delete envPhase1.API_BASE_URL
    delete envPhase1.AUTH_ALLOW_ANONYMOUS
    delete envPhase1.AUTH_SECRET

    const devProcess1 = spawn(nextBinary, ['dev', '-H', HARNESS_HOST, '-p', String(HARNESS_PORT), '--webpack'], {
      env: envPhase1 as NodeJS.ProcessEnv,
      cwd: HARNESS_ROOT,
      stdio: ['pipe', 'pipe', 'pipe'],
    })

    const pid1 = devProcess1.pid!
    activePids.add(pid1)
    recordProvenance(pid1)
    console.log(`Next.js dev server spawned (PID ${pid1}) on ${HARNESS_HOST}:${HARNESS_PORT}`)

    devProcess1.stdout?.on('data', (d: Buffer) => {
      const s = d.toString()
      if (s.includes('Ready') || s.includes('Local:')) {
        console.log(`[Next Dev stdout]: ${s.trim()}`)
      }
    })
    devProcess1.stderr?.on('data', (d: Buffer) => {
      console.error(`[Next Dev stderr]: ${d.toString().trim()}`)
    })

    const ready1 = await waitForServer(`${HARNESS_BASE_URL}/harness/case`)
    if (!ready1) {
      throw new Error('FATAL: Harness dev server failed to become ready within timeout')
    }
    console.log(`Harness server ready at ${HARNESS_BASE_URL}/harness/case`)

    // --- Check 1: GET /harness/case -> Expected 405 Method Not Allowed ---
    {
      console.log('\n--- Check 1: GET /harness/case -> Expected 405 Method Not Allowed ---')
      console.log(`Equivalent curl: curl -X GET "${HARNESS_BASE_URL}/harness/case"`)
      const res = await fetch(`${HARNESS_BASE_URL}/harness/case`, { method: 'GET', cache: 'no-store' })
      const bodyText = await res.text()
      let parsed: any = null
      try { parsed = JSON.parse(bodyText) } catch {}
      console.log(`HTTP Status: ${res.status} ${res.statusText}`)
      const allowHeader = res.headers.get('allow')
      const cacheControlHeader = res.headers.get('cache-control')
      console.log(`Headers: cache-control=${cacheControlHeader}, allow=${allowHeader}`)
      console.log(`Body: ${bodyText}`)

      // Assert Allow: POST and Cache-Control: no-store (F08)
      const pass =
        res.status === 405 &&
        parsed?.error === 'Method Not Allowed' &&
        allowHeader === 'POST' &&
        Boolean(cacheControlHeader?.includes('no-store'))

      console.log(`Computed Verdict: ${pass ? 'PASS' : 'FAIL'} (status=405, allow=POST, cache-control=no-store)`)
      results.push({
        checkNum: 1,
        name: 'GET method not allowed with Allow: POST and Cache-Control: no-store (F08)',
        method: 'GET',
        url: `${HARNESS_BASE_URL}/harness/case`,
        expectedStatus: 405,
        actualStatus: res.status,
        actualHeaders: Object.fromEntries(res.headers.entries()),
        actualBodyText: bodyText,
        parsedBody: parsed,
        pass,
      })
    }

    // --- Check 2: POST /harness/case with non-JSON body -> Expected 400 Bad Request ---
    {
      console.log('\n--- Check 2: POST /harness/case with non-JSON body -> Expected 400 Bad Request ---')
      console.log(`Equivalent curl: curl -X POST "${HARNESS_BASE_URL}/harness/case" -H "Content-Type: application/json" -d "this is not json"`)
      const res = await fetch(`${HARNESS_BASE_URL}/harness/case`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'this is not json',
        cache: 'no-store',
      })
      const bodyText = await res.text()
      let parsed: any = null
      try { parsed = JSON.parse(bodyText) } catch {}
      console.log(`HTTP Status: ${res.status} ${res.statusText}`)
      console.log(`Body: ${bodyText}`)

      const pass = res.status === 400 && parsed?.error === 'Invalid JSON body'
      console.log(`Computed Verdict: ${pass ? 'PASS' : 'FAIL'}`)
      results.push({
        checkNum: 2,
        name: 'Non-JSON body rejection',
        method: 'POST',
        url: `${HARNESS_BASE_URL}/harness/case`,
        payload: 'this is not json',
        expectedStatus: 400,
        actualStatus: res.status,
        actualHeaders: Object.fromEntries(res.headers.entries()),
        actualBodyText: bodyText,
        parsedBody: parsed,
        pass,
      })
    }

    // --- Check 3: POST /harness/case with unknown caseId -> Expected 400 Bad Request ---
    {
      console.log('\n--- Check 3: POST /harness/case with unknown caseId -> Expected 400 Bad Request ---')
      const payload = { runId: RUN_ID, caseId: 'UNKNOWN_CASE' }
      console.log(`Equivalent curl: curl -X POST "${HARNESS_BASE_URL}/harness/case" -H "Content-Type: application/json" -d '${JSON.stringify(payload)}'`)
      const res = await fetch(`${HARNESS_BASE_URL}/harness/case`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        cache: 'no-store',
      })
      const bodyText = await res.text()
      let parsed: any = null
      try { parsed = JSON.parse(bodyText) } catch {}
      console.log(`HTTP Status: ${res.status} ${res.statusText}`)
      console.log(`Body: ${bodyText}`)

      const hasCaseIdIssue = parsed?.details?.some((d: any) => d.path?.includes('caseId'))
      const hasRunIdIssue = parsed?.details?.some((d: any) => d.path?.includes('runId'))
      const pass = res.status === 400 && Boolean(hasCaseIdIssue) && !hasRunIdIssue
      console.log(`Computed Verdict: ${pass ? 'PASS' : 'FAIL'} (hasCaseIdIssue=${hasCaseIdIssue}, noRunIdConfounding=${!hasRunIdIssue})`)
      results.push({
        checkNum: 3,
        name: 'Unknown caseId rejection without runId confounding',
        method: 'POST',
        url: `${HARNESS_BASE_URL}/harness/case`,
        payload,
        expectedStatus: 400,
        actualStatus: res.status,
        actualHeaders: Object.fromEntries(res.headers.entries()),
        actualBodyText: bodyText,
        parsedBody: parsed,
        pass,
      })
    }

    // --- Check 4: POST /harness/case with extra prohibited field -> Expected 400 Bad Request ---
    {
      console.log('\n--- Check 4: POST /harness/case with extra prohibited field -> Expected 400 Bad Request ---')
      const payload = { runId: RUN_ID, caseId: 'T1', prohibitedProxyField: 'malicious' }
      console.log(`Equivalent curl: curl -X POST "${HARNESS_BASE_URL}/harness/case" -H "Content-Type: application/json" -d '${JSON.stringify(payload)}'`)
      const res = await fetch(`${HARNESS_BASE_URL}/harness/case`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        cache: 'no-store',
      })
      const bodyText = await res.text()
      let parsed: any = null
      try { parsed = JSON.parse(bodyText) } catch {}
      console.log(`HTTP Status: ${res.status} ${res.statusText}`)
      console.log(`Body: ${bodyText}`)

      const hasUnrecognizedKey = parsed?.details?.some(
        (d: any) => d.message?.includes('unrecognized_keys') || d.message?.includes('Unrecognized key'),
      )
      const pass = res.status === 400 && Boolean(hasUnrecognizedKey)
      console.log(`Computed Verdict: ${pass ? 'PASS' : 'FAIL'} (hasUnrecognizedKeyIssue=${hasUnrecognizedKey})`)
      results.push({
        checkNum: 4,
        name: 'Extra control field rejection (Strict schema)',
        method: 'POST',
        url: `${HARNESS_BASE_URL}/harness/case`,
        payload,
        expectedStatus: 400,
        actualStatus: res.status,
        actualHeaders: Object.fromEntries(res.headers.entries()),
        actualBodyText: bodyText,
        parsedBody: parsed,
        pass,
      })
    }

    // --- Check 5: POST /harness/case with invalid refId for T2 -> Expected 400 Bad Request ---
    {
      console.log('\n--- Check 5: POST /harness/case with invalid refId for T2 -> Expected 400 Bad Request ---')
      const payload = { runId: RUN_ID, caseId: 'T2', refId: 'not-a-valid-uuid' }
      console.log(`Equivalent curl: curl -X POST "${HARNESS_BASE_URL}/harness/case" -H "Content-Type: application/json" -d '${JSON.stringify(payload)}'`)
      const res = await fetch(`${HARNESS_BASE_URL}/harness/case`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        cache: 'no-store',
      })
      const bodyText = await res.text()
      let parsed: any = null
      try { parsed = JSON.parse(bodyText) } catch {}
      console.log(`HTTP Status: ${res.status} ${res.statusText}`)
      console.log(`Body: ${bodyText}`)

      const hasRefIdIssue = parsed?.details?.some((d: any) => d.path?.includes('refId'))
      const pass = res.status === 400 && Boolean(hasRefIdIssue)
      console.log(`Computed Verdict: ${pass ? 'PASS' : 'FAIL'} (hasRefIdIssue=${hasRefIdIssue})`)
      results.push({
        checkNum: 5,
        name: 'Invalid refId UUID format rejection for T2',
        method: 'POST',
        url: `${HARNESS_BASE_URL}/harness/case`,
        payload,
        expectedStatus: 400,
        actualStatus: res.status,
        actualHeaders: Object.fromEntries(res.headers.entries()),
        actualBodyText: bodyText,
        parsedBody: parsed,
        pass,
      })
    }

    // Stop Phase 1 process gracefully
    await stopOwnedHarness(pid1)
    activePids.delete(pid1)

    // ============================================================================
    // Phase 2: Check 6 with MC_INTA_ENABLE unset (Disabled, Default) -> 404
    // ============================================================================
    console.log('\n' + '='.repeat(80))
    console.log('=== Phase 2: Check 6 without MC_INTA_ENABLE (Disabled, Default) ===')
    console.log('='.repeat(80))

    const envPhase2: Record<string, string | undefined> = {
      ...process.env,
      NODE_ENV: 'development',
      MC_INTA_GO_BASE_URL: `http://${HARNESS_HOST}:${UPSTREAM_PORT}`,
    }
    delete envPhase2.MC_INTA_ENABLE
    delete envPhase2.API_MODE

    const devProcess2 = spawn(nextBinary, ['dev', '-H', HARNESS_HOST, '-p', String(HARNESS_PORT), '--webpack'], {
      env: envPhase2 as NodeJS.ProcessEnv,
      cwd: HARNESS_ROOT,
      stdio: ['pipe', 'pipe', 'pipe'],
    })

    const pid2 = devProcess2.pid!
    activePids.add(pid2)
    recordProvenance(pid2)
    console.log(`Next.js dev server spawned without MC_INTA_ENABLE (PID ${pid2})`)

    const ready2 = await waitForServer(`${HARNESS_BASE_URL}/harness/case`)
    if (!ready2) {
      throw new Error('FATAL: Phase 2 server failed to become ready')
    }

    {
      console.log('\n--- Check 6: POST /harness/case when disabled -> Expected 404 Not Found ---')
      const payload = { runId: RUN_ID, caseId: 'T1' }
      console.log(`Equivalent curl: curl -X POST "${HARNESS_BASE_URL}/harness/case" -H "Content-Type: application/json" -d '${JSON.stringify(payload)}'`)
      const res = await fetch(`${HARNESS_BASE_URL}/harness/case`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        cache: 'no-store',
      })
      const bodyText = await res.text()
      let parsed: any = null
      try { parsed = JSON.parse(bodyText) } catch {}
      console.log(`HTTP Status: ${res.status} ${res.statusText}`)
      console.log(`Body: ${bodyText}`)

      const pass = res.status === 404 && parsed?.error?.includes('MC_INTA_ENABLE=1 is required')
      console.log(`Computed Verdict: ${pass ? 'PASS' : 'FAIL'}`)
      results.push({
        checkNum: 6,
        name: 'Opt-in flag missing 404 refusal',
        method: 'POST',
        url: `${HARNESS_BASE_URL}/harness/case`,
        payload,
        expectedStatus: 404,
        actualStatus: res.status,
        actualHeaders: Object.fromEntries(res.headers.entries()),
        actualBodyText: bodyText,
        parsedBody: parsed,
        pass,
      })
    }

    // Stop Phase 2 process gracefully
    await stopOwnedHarness(pid2)
    activePids.delete(pid2)

    // ============================================================================
    // Phase 3: Check 7 with Prohibited Product Auth Env -> Startup Refusal (INTA-FE-R07, F06)
    // ============================================================================
    console.log('\n' + '='.repeat(80))
    console.log('=== Phase 3: Check 7 Startup Refusal with Product Auth Env (INTA-FE-R07, F06) ===')
    console.log('='.repeat(80))

    const envPhase3: Record<string, string | undefined> = {
      ...process.env,
      MC_INTA_ENABLE: '1',
      API_MODE: 'demo', // Prohibited product auth key
      NODE_ENV: 'development',
      MC_INTA_GO_BASE_URL: `http://${HARNESS_HOST}:${UPSTREAM_PORT}`,
    }

    console.log('Attempting to boot Next.js dev server with API_MODE=demo...')
    console.log(`argv: ${nextBinary} dev -H ${HARNESS_HOST} -p ${HARNESS_PORT} --webpack`)

    let startupStderr3 = ''
    let startupExitCode3: number | null = null

    const devProcess3 = spawn(nextBinary, ['dev', '-H', HARNESS_HOST, '-p', String(HARNESS_PORT), '--webpack'], {
      env: envPhase3 as NodeJS.ProcessEnv,
      cwd: HARNESS_ROOT,
      stdio: ['pipe', 'pipe', 'pipe'],
    })
    const pid3 = devProcess3.pid!
    activePids.add(pid3)

    devProcess3.stderr?.on('data', (d: Buffer) => {
      startupStderr3 += d.toString()
    })

    await new Promise<void>((resolve) => {
      let timer: NodeJS.Timeout | null = null
      devProcess3.on('exit', (code) => {
        startupExitCode3 = code
        activePids.delete(pid3)
        if (timer) clearTimeout(timer)
        resolve()
      })
      // Timeout: if it hung, escalate SIGTERM -> SIGKILL but keep tracking until observed exit (R2-F05)
      timer = setTimeout(async () => {
        if (startupExitCode3 === null) {
          try {
            devProcess3.kill('SIGTERM')
            const waitStart = Date.now()
            while (Date.now() - waitStart < 2000) {
              if (startupExitCode3 !== null) break
              await new Promise((r) => setTimeout(r, 100))
            }
            if (startupExitCode3 === null) {
              devProcess3.kill('SIGKILL')
            }
          } catch {}
        }
        resolve()
      }, 5000)
    })

    console.log(`Process Exit Code: ${startupExitCode3}`)
    console.log(`Process stderr: ${startupStderr3.trim()}`)

    const port18085ClosedAfterCheck7 = !(await isPortInUse(HARNESS_PORT))
    console.log(`Port ${HARNESS_PORT} remained closed: ${port18085ClosedAfterCheck7}`)

    // Require numeric non-zero exit code (F06)
    const startupRefusal3Passed =
      typeof startupExitCode3 === 'number' &&
      startupExitCode3 !== 0 &&
      startupStderr3.includes('product auth/secret env vars present (API_MODE)') &&
      port18085ClosedAfterCheck7

    console.log(`Computed Verdict: ${startupRefusal3Passed ? 'PASS' : 'FAIL'} (numericNonZero=${typeof startupExitCode3 === 'number' && startupExitCode3 !== 0})`)
    results.push({
      checkNum: 7,
      name: 'Startup refusal before listen on product auth env (INTA-FE-R07, F06)',
      method: 'STARTUP_EXECUTION',
      url: `${HARNESS_BASE_URL}/harness/case`,
      payload: { env: 'API_MODE=demo' },
      expectedStatus: 'EXIT_NONZERO_BEFORE_LISTEN',
      actualStatus: `EXIT_${startupExitCode3}`,
      actualBodyText: startupStderr3.trim(),
      pass: startupRefusal3Passed,
    })

    // ============================================================================
    // Phase 4: Check 7b with NODE_ENV=production -> Startup Refusal (INTA-FE-R07, F04, F06)
    // ============================================================================
    console.log('\n' + '='.repeat(80))
    console.log('=== Phase 4: Check 7b Startup Refusal with NODE_ENV=production (F04, F06) ===')
    console.log('='.repeat(80))

    const envPhase4: Record<string, string | undefined> = {
      ...process.env,
      MC_INTA_ENABLE: '1',
      NODE_ENV: 'production',
      MC_INTA_GO_BASE_URL: `http://${HARNESS_HOST}:${UPSTREAM_PORT}`,
    }
    delete envPhase4.API_MODE

    console.log('Attempting to boot Next.js dev server with NODE_ENV=production...')
    console.log(`argv: ${nextBinary} dev -H ${HARNESS_HOST} -p ${HARNESS_PORT} --webpack`)

    let startupStderr4 = ''
    let startupExitCode4: number | null = null

    const devProcess4 = spawn(nextBinary, ['dev', '-H', HARNESS_HOST, '-p', String(HARNESS_PORT), '--webpack'], {
      env: envPhase4 as NodeJS.ProcessEnv,
      cwd: HARNESS_ROOT,
      stdio: ['pipe', 'pipe', 'pipe'],
    })
    const pid4 = devProcess4.pid!
    activePids.add(pid4)

    devProcess4.stderr?.on('data', (d: Buffer) => {
      startupStderr4 += d.toString()
    })

    await new Promise<void>((resolve) => {
      let timer: NodeJS.Timeout | null = null
      devProcess4.on('exit', (code) => {
        startupExitCode4 = code
        activePids.delete(pid4)
        if (timer) clearTimeout(timer)
        resolve()
      })
      timer = setTimeout(async () => {
        if (startupExitCode4 === null) {
          try {
            devProcess4.kill('SIGTERM')
            const waitStart = Date.now()
            while (Date.now() - waitStart < 2000) {
              if (startupExitCode4 !== null) break
              await new Promise((r) => setTimeout(r, 100))
            }
            if (startupExitCode4 === null) {
              devProcess4.kill('SIGKILL')
            }
          } catch {}
        }
        resolve()
      }, 5000)
    })

    console.log(`Process Exit Code: ${startupExitCode4}`)
    console.log(`Process stderr: ${startupStderr4.trim()}`)

    const port18085ClosedAfterCheck7b = !(await isPortInUse(HARNESS_PORT))
    console.log(`Port ${HARNESS_PORT} remained closed: ${port18085ClosedAfterCheck7b}`)

    const startupRefusal4Passed =
      typeof startupExitCode4 === 'number' &&
      startupExitCode4 !== 0 &&
      startupStderr4.includes('NODE_ENV cannot be production') &&
      port18085ClosedAfterCheck7b

    console.log(`Computed Verdict: ${startupRefusal4Passed ? 'PASS' : 'FAIL'} (numericNonZero=${typeof startupExitCode4 === 'number' && startupExitCode4 !== 0})`)
    results.push({
      checkNum: '7b',
      name: 'Startup refusal before listen on NODE_ENV=production (F04, F06)',
      method: 'STARTUP_EXECUTION',
      url: `${HARNESS_BASE_URL}/harness/case`,
      payload: { env: 'NODE_ENV=production' },
      expectedStatus: 'EXIT_NONZERO_BEFORE_LISTEN',
      actualStatus: `EXIT_${startupExitCode4}`,
      actualBodyText: startupStderr4.trim(),
      pass: startupRefusal4Passed,
    })

  } finally {
    // Ensure all spawned processes and synthetic observer are stopped gracefully (F06, R2-F05)
    for (const pid of activePids) {
      await stopOwnedHarness(pid)
    }
    activePids.clear()
    upstreamServer.close()
  }

  // ============================================================================
  // Summary & Zero Upstream Assertion
  // ============================================================================
  console.log('\n' + '='.repeat(80))
  console.log('MC-002-INTA-FE Authoritative Guard Verification Summary (R4)')
  console.log('='.repeat(80))

  let allChecksPassed = true
  for (const r of results) {
    console.log(`Check ${r.checkNum}: [${r.pass ? 'PASS' : 'FAIL'}] ${r.name} (Expected ${r.expectedStatus}, got ${r.actualStatus})`)
    if (!r.pass) allChecksPassed = false
  }

  console.log('\n--- Measured Upstream Calls ---')
  console.log(`Total HTTP requests received by synthetic upstream observer (127.0.0.1:${UPSTREAM_PORT}): ${upstreamRequestsReceived}`)
  const zeroUpstreamPassed = upstreamRequestsReceived === 0
  console.log(`Zero Upstream Assertion: ${zeroUpstreamPassed ? 'PASS' : 'FAIL'}`)

  // Final verification that port 18085 is closed
  const port18085Closed = !(await isPortInUse(HARNESS_PORT))
  console.log(`Port ${HARNESS_PORT} closed verification: ${port18085Closed ? 'PASS' : 'FAIL'}`)

  if (allChecksPassed && zeroUpstreamPassed && port18085Closed) {
    console.log(`\nOVERALL RESULT: ${results.length}/${results.length} LIVE GUARD CHECKS PASS + ZERO UPSTREAM CALLS MEASURED`)
    console.log(`UTC Completed: ${new Date().toISOString()}`)
    process.exit(0)
  } else {
    console.error('\nOVERALL RESULT: FAILED GUARD VERIFICATION')
    console.log(`UTC Completed: ${new Date().toISOString()}`)
    process.exit(1)
  }
}

main().catch((err) => {
  console.error('Unhandled fatal error in live-guards:', err)
  process.exit(1)
})
