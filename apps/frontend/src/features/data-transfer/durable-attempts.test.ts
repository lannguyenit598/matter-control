// @vitest-environment node
import { randomBytes } from 'node:crypto'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { prepareBffFixture } from '@/test/bff-fixture'
import { cfg } from '@/test/fake-idp'
import { createPostgresState } from '@/lib/oidc/durable-state'
import {
  createPersistentSession,
  destroyPersistentSession,
  sessionKey,
} from '@/lib/oidc/session-persistence'
import {
  acknowledgeAttemptAsync,
  attemptSlotsAsync,
  beginAttemptAsync,
  endAttemptAsync,
  revokeAttemptsAsync,
  type PendingAttempt,
} from './pending-attempts'

vi.mock('@/lib/oidc/config', () => ({ oidcConfig: () => cfg }))
const databaseUrl = process.env.MC_BFF_TEST_DATABASE_URL
const key = randomBytes(32).toString('base64')
const profile = {
  databaseUrl: databaseUrl ?? 'postgres://localhost/absent',
  keyId: 'v1',
  keys: { v1: key },
}
const store = createPostgresState(profile)
const proposal = (): PendingAttempt => ({
  kind: 'bulk',
  matterId: 'synthetic-matter',
  input: {
    attemptKey: 'original-attempt-key',
    rows: [
      {
        rowKey: 'row-1',
        idempotencyKey: 'original-row-key',
        itemId: 'item-1',
        expectedRevision: 1,
        title: 'Synthetic title',
      },
    ],
  },
})

afterEach(() => vi.unstubAllEnvs())
describe.skipIf(!databaseUrl)('durable transfer intent', () => {
  beforeAll(() => prepareBffFixture(profile.databaseUrl))
  beforeEach(() => {
    vi.stubEnv('BFF_STATE_BACKEND', 'postgres')
    vi.stubEnv('BFF_DATABASE_URL', profile.databaseUrl)
    vi.stubEnv('BFF_STATE_KEY_ID', 'v1')
    vi.stubEnv('BFF_STATE_KEYS', JSON.stringify(profile.keys))
  })
  async function session() {
    return {
      sessionHandle: await createPersistentSession(
        cfg,
        {
          sub: 'synthetic-a',
          name: 'A',
          accessToken: 'SYNTHETIC',
          accessExpiresAt: Date.now() + 60_000,
        },
        Date.now(),
        store,
      ),
    }
  }
  it('recovers the frozen request across new session objects and only releases on matching ACK', async () => {
    const a = await session(),
      b = { ...a }
    const input = proposal()
    const first = await beginAttemptAsync(a, input)
    expect(first).not.toBeNull()
    await endAttemptAsync(a, first!)
    if (input.kind === 'bulk') input.input.rows[0]!.title = 'changed'
    expect(await beginAttemptAsync(b, input)).toBeNull()
    const recovered = await beginAttemptAsync(b, proposal())
    expect(recovered).toEqual(first)
    await endAttemptAsync(b, recovered!, [{ rowKey: 'row-1', status: 'SUCCESS_REPLAYED' }])
    expect((await attemptSlotsAsync({ ...a })).get('bulk')?.settled).toBe(true)
    expect(await acknowledgeAttemptAsync(a, 'bulk', 'synthetic-matter', 'wrong')).toBe(false)
    expect(
      await acknowledgeAttemptAsync(b, 'bulk', 'synthetic-matter', 'original-attempt-key'),
    ).toBe(true)
    expect((await attemptSlotsAsync(a)).size).toBe(0)
    expect((await attemptSlotsAsync(await session())).size).toBe(0)
  })
  it('keeps crashes read-only, allows explicit same-key retry after lease, rejects late completion', async () => {
    const a = await session()
    const old = await beginAttemptAsync(a, proposal())
    expect(await beginAttemptAsync({ ...a }, proposal())).toBeNull()
    const root = sessionKey(cfg, a.sessionHandle)
    const child = root + ':attempt:bulk'
    await store.transaction(root, async (tx) => {
      const slot = await tx.read<object>(child)
      await tx.write(child, { ...slot, runningUntil: Date.now() - 1 }, Date.now() + 60_000)
    })
    expect((await attemptSlotsAsync({ ...a })).get('bulk')?.running).toBe(true)
    const retry = await beginAttemptAsync({ ...a }, proposal())
    expect(retry).toEqual(old)
    await endAttemptAsync(a, old!, [{ rowKey: 'row-1', status: 'SUCCESS' }])
    expect((await attemptSlotsAsync(a)).get('bulk')?.running).toBe(true)
    await endAttemptAsync(a, retry!, [{ rowKey: 'row-1', status: 'UNKNOWN' }])
    expect((await attemptSlotsAsync(a)).get('bulk')?.settled).not.toBe(true)
  })
  it('purges lost access and logout cannot be undone by a late completion', async () => {
    const a = await session()
    const pending = await beginAttemptAsync(a, proposal())
    await revokeAttemptsAsync({ ...a }, 'synthetic-matter')
    expect((await attemptSlotsAsync(a)).get('bulk')).toEqual({ blocked: 'synthetic-matter' })
    expect(await beginAttemptAsync(a, proposal())).toBeNull()
    await destroyPersistentSession(cfg, a.sessionHandle, store)
    await expect(endAttemptAsync(a, pending!)).rejects.toMatchObject({ code: 'unauthenticated' })
    const root = sessionKey(cfg, a.sessionHandle)
    expect(await store.transaction(root, (tx) => tx.read(root + ':attempt:bulk'))).toBeUndefined()
  })
  // WP-7: 1 MiB fits under the pilot pending-import ceiling (BFF_MAX_PENDING_BYTES default
  // 5 MiB); the 25 MiB case proves the ceiling is a deliberate, explicit configuration — the
  // test raises it for this scenario only, and the byte-equality assertions are unchanged.
  it('retains exact synthetic import bytes (1048576) in encrypted state', async () => {
    const a = await session()
    const content = new Uint8Array(1024 * 1024).fill(37)
    const input: PendingAttempt = {
      kind: 'import',
      matterId: 'synthetic-matter',
      plan: { runKey: 'run', rowKeys: { R1: 'original-row-key' } },
      upload: { sourceName: 'synthetic.csv', format: 'csv', content },
    }
    const saved = await beginAttemptAsync(a, input)
    await endAttemptAsync(a, saved!)
    const loaded = (await attemptSlotsAsync({ ...a })).get('import')!.attempt!
    expect(loaded.kind).toBe('import')
    if (loaded.kind === 'import')
      expect(Buffer.compare(Buffer.from(loaded.upload.content), Buffer.from(content))).toBe(0)
    await destroyPersistentSession(cfg, a.sessionHandle, store)
  }, 20_000)

  it('retains exact synthetic import bytes (26213376) in encrypted state under an explicit ceiling', async () => {
    vi.stubEnv('BFF_MAX_PENDING_BYTES', String(35 * 1024 * 1024))
    const a = await session()
    const content = new Uint8Array(25 * 1024 * 1024 - 1024).fill(37)
    const input: PendingAttempt = {
      kind: 'import',
      matterId: 'synthetic-matter',
      plan: { runKey: 'run', rowKeys: { R1: 'original-row-key' } },
      upload: { sourceName: 'synthetic.csv', format: 'csv', content },
    }
    const saved = await beginAttemptAsync(a, input)
    await endAttemptAsync(a, saved!)
    const loaded = (await attemptSlotsAsync({ ...a })).get('import')!.attempt!
    expect(loaded.kind).toBe('import')
    if (loaded.kind === 'import')
      expect(Buffer.compare(Buffer.from(loaded.upload.content), Buffer.from(content))).toBe(0)
    await destroyPersistentSession(cfg, a.sessionHandle, store)
  }, 20_000)
})
