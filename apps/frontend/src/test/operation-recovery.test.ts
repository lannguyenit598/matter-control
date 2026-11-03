// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/env', () => ({
  serverEnv: { API_MODE: 'rest', API_BASE_URL: 'http://api.test/api/v1', API_TIMEOUT_MS: 500 },
}))
vi.mock('@/lib/auth', () => ({
  requireSession: async () => ({ userId: 'u', permissions: ['*'], accessToken: 'USER-TOKEN' }),
}))
vi.mock('next/cache', () => ({ revalidatePath: () => {} }))

import {
  createMatterAction,
  grantMatterMemberAction,
  revokeMatterMemberAction,
} from '@/features/matters/actions'
import { createRequirementAction } from '@/features/requirements/actions'
import {
  createWorkspaceAction,
  grantWorkspaceMemberAction,
  revokeWorkspaceMemberAction,
} from '@/features/workspaces/actions'

import type { McActionResult } from '@/lib/mc/action-result'

const ID = '0192b1c4-0000-7000-8000-000000000001'
const KEY = '0192b1c4-0000-7000-8000-0000000000aa'
const ETAG = '"abc"'

/** Every product command with its contract classification (§2.1): receipted creation vs CAS-only. */
const COMMANDS: [string, 'receipted' | 'cas-only', () => Promise<McActionResult>][] = [
  [
    'createWorkspace',
    'receipted',
    () => createWorkspaceAction({ idempotencyKey: KEY, name: 'Acme' }),
  ],
  [
    'createMatter',
    'receipted',
    () =>
      createMatterAction({ idempotencyKey: KEY, workspaceId: ID, ifMatch: ETAG, title: 'Atlas' }),
  ],
  [
    'createRequirement',
    'receipted',
    () => createRequirementAction({ idempotencyKey: KEY, matterId: ID, title: 'T', outcome: 'O' }),
  ],
  [
    'grantWorkspaceMember',
    'cas-only',
    () =>
      grantWorkspaceMemberAction({ workspaceId: ID, userId: ID, role: 'MEMBER', ifMatch: ETAG }),
  ],
  [
    'revokeWorkspaceMember',
    'cas-only',
    () => revokeWorkspaceMemberAction({ workspaceId: ID, userId: ID, ifMatch: ETAG }),
  ],
  [
    'grantMatterMember',
    'cas-only',
    () => grantMatterMemberAction({ matterId: ID, userId: ID, role: 'VIEWER', ifMatch: ETAG }),
  ],
  [
    'revokeMatterMember',
    'cas-only',
    () => revokeMatterMemberAction({ matterId: ID, userId: ID, ifMatch: ETAG }),
  ],
]

let fetchMock: ReturnType<typeof vi.fn>
beforeEach(() => {
  fetchMock = vi.fn()
  vi.stubGlobal('fetch', fetchMock)
})
afterEach(() => vi.unstubAllGlobals())

const lostBody = (status: number) =>
  new Response(
    new ReadableStream({
      start(c) {
        c.error(new TypeError('terminated'))
      },
    }),
    { status },
  )

const SCENARIOS: [string, () => Response | Promise<never>][] = [
  ['the connection drops', () => Promise.reject(new TypeError('socket hang up'))],
  ['a success arrives with a lost body', () => lostBody(201)],
  [
    'the API itself reports an unknown outcome',
    () => new Response('{"type":"urn:mc:outcome-unknown"}', { status: 503 }),
  ],
]

describe.each(COMMANDS)('%s (%s)', (_name, kind, run) => {
  it.each(SCENARIOS)('keeps UNKNOWN and the right recovery when %s', async (_s, answer) => {
    fetchMock.mockImplementation(async () => answer())
    const r = await run()
    expect(r).toMatchObject({ ok: false, kind: 'outcome-unknown' })
    if (kind === 'receipted') {
      expect(r).toMatchObject({ retrySameKey: true })
      expect('requiresReread' in r && r.requiresReread).toBeFalsy()
    } else {
      expect(r).toMatchObject({ requiresReread: true })
      expect('retrySameKey' in r && r.retrySameKey).toBeFalsy()
    }
    // exactly the one attempt: the action layer never resends on its own
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('sends an Idempotency-Key if and only if the command is receipted', async () => {
    fetchMock.mockImplementation(async () => new Response('{}', { status: 500 }))
    await run()
    const headers = new Headers((fetchMock.mock.calls[0] as [unknown, RequestInit])[1].headers)
    expect(headers.has('idempotency-key')).toBe(kind === 'receipted')
    if (kind === 'receipted') expect(headers.get('idempotency-key')).toBe(KEY)
  })
})

describe('a definite refusal is not an unknown outcome', () => {
  it('412 on a CAS-only command is "stale", never a resend prompt', async () => {
    fetchMock.mockResolvedValue(
      new Response('{"type":"urn:mc:precondition-failed"}', { status: 412 }),
    )
    const r = await grantWorkspaceMemberAction({
      workspaceId: ID,
      userId: ID,
      role: 'MEMBER',
      ifMatch: ETAG,
    })
    expect(r).toMatchObject({ ok: false, kind: 'stale' })
    expect('requiresReread' in r && r.requiresReread).toBeFalsy()
  })
})
