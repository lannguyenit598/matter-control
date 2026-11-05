import { NextResponse } from 'next/server'
import { validateHarnessEnvironment } from '../../../src/guards'
import { harnessCaseInputSchema } from '../../../src/schemas'
import { executeCase, getInstalledNextVersion, getHarnessRevision } from '../../../src/executor'
import { RequestIdGenerator } from '../../../src/request-id'

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate',
  Pragma: 'no-cache',
}

const generators = new Map<string, RequestIdGenerator>()

function getRequestIdGen(runId: string): RequestIdGenerator {
  let gen = generators.get(runId)
  if (!gen) {
    gen = new RequestIdGenerator(runId)
    generators.set(runId, gen)
  }
  return gen
}

export async function POST(request: Request) {
  // 1. Guard check: environment and refusal policies
  const envCheck = validateHarnessEnvironment(process.env)
  if (!envCheck.ok) {
    return NextResponse.json(
      {
        error: envCheck.reason,
        refusedKeys: envCheck.refusedKeys,
      },
      { status: envCheck.status, headers: NO_STORE_HEADERS },
    )
  }

  // 2. Parse request body
  let rawBody: unknown
  try {
    rawBody = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400, headers: NO_STORE_HEADERS },
    )
  }

  // 3. Strict allowlist validation including fixed per-case refId table
  const parsed = harnessCaseInputSchema.safeParse(rawBody)
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'Bad Request: validation failed',
        details: parsed.error.issues.map((i) => ({
          path: i.path,
          message: i.message,
        })),
      },
      { status: 400, headers: NO_STORE_HEADERS },
    )
  }

  const { runId, caseId, refId } = parsed.data

  // 4. Execute case
  try {
    const reqIdGen = getRequestIdGen(runId)
    const result = await executeCase({
      runId,
      caseId,
      refId,
      reqIdGen,
      goBaseUrl: envCheck.goBaseUrl,
      nextVersion: getInstalledNextVersion(),
      harnessRevision: getHarnessRevision(),
    })

    return NextResponse.json(result, {
      status: 200,
      headers: NO_STORE_HEADERS,
    })
  } catch (err: any) {
    return NextResponse.json(
      {
        error: 'Execution error: harness internal error',
        caseId,
        runId,
      },
      { status: 500, headers: NO_STORE_HEADERS },
    )
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method Not Allowed' },
    { status: 405, headers: { ...NO_STORE_HEADERS, Allow: 'POST' } },
  )
}

export async function PUT() {
  return GET()
}

export async function PATCH() {
  return GET()
}

export async function DELETE() {
  return GET()
}
