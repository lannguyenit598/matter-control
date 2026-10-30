// @vitest-environment node
import { randomBytes } from 'node:crypto'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import { prepareBffFixture } from '@/test/bff-fixture'
import { cfg, FakeIdp } from '@/test/fake-idp'
import { createPostgresState, openState, sealState, type DurableConfig } from './durable-state'
import { beginLogin, completeLogin, OidcError, resetOidcState } from './flow'
import {
  createPersistentSession,
  destroyPersistentSession,
  livePersistentSession,
  sessionKey,
} from './session-persistence'

const key = randomBytes(32).toString('base64')
const keys = { v1: key }
const encryption = { keys, keyId: 'v1' }
afterEach(() => vi.unstubAllEnvs())

it('seals tokens and binary data, authenticates scope and supports retained key versions', () => {
  const value = { token: 'SYNTHETIC-SECRET-TOKEN', bytes: new Uint8Array([0, 255, 32]) }
  const sealed = sealState(value, 'scope-a', encryption)
  expect(sealed.toString()).not.toContain(value.token)
  expect(openState(sealed, 'scope-a', keys)).toEqual(value)
  expect(() => openState(sealed, 'scope-b', keys)).toThrow()
  const changed = Buffer.from(sealed)
  changed[changed.length - 1] = changed[changed.length - 1]! ^ 1
  expect(() => openState(changed, 'scope-a', keys)).toThrow()
  expect(() => openState(sealed, 'scope-a', {})).toThrow()
  expect(openState(sealed, 'scope-a', { ...keys, v2: randomBytes(32).toString('base64') })).toEqual(
    value,
  )
})

it('requires verified TLS for a remote database and refuses a missing encryption key', () => {
  expect(() =>
    createPostgresState({ databaseUrl: 'postgres://db.invalid/db', ...encryption }),
  ).toThrow('verify-full')
  expect(() =>
    createPostgresState({ databaseUrl: 'postgres://localhost/db', keyId: 'v1', keys: {} }),
  ).toThrow()
})

const databaseUrl = process.env.MC_BFF_TEST_DATABASE_URL
describe.skipIf(!databaseUrl)('durable PostgreSQL profile on a fresh local fixture', () => {
  const profile: DurableConfig = {
    databaseUrl: databaseUrl ?? 'postgres://localhost/absent',
    ...encryption,
  }
  const config = { ...cfg, clientId: `fixture-${randomBytes(8).toString('hex')}` }
  const store = createPostgresState(profile)
  const second = createPostgresState(profile)
  const tokens = {
    sub: 'synthetic-a',
    name: 'Synthetic A',
    accessToken: 'OLD',
    refreshToken: 'REFRESH-ONE',
    accessExpiresAt: Date.now() + 1000,
  }

  beforeAll(() => prepareBffFixture(profile.databaseUrl))

  it('shares encrypted state across independent clients and expires rows', async () => {
    const id = `counter:${randomBytes(8).toString('hex')}`
    await store.transaction(id, (tx) => tx.write(id, { n: 0 }, Date.now() + 60_000))
    await Promise.all(
      Array.from({ length: 10 }, (_, i) =>
        (i % 2 ? store : second).transaction(id, async (tx) => {
          const old = await tx.read<{ n: number }>(id)
          await tx.write(id, { n: old!.n + 1 }, Date.now() + 60_000)
        }),
      ),
    )
    expect(await second.transaction(id, (tx) => tx.read(id))).toEqual({ n: 10 })
    await store.transaction(id, (tx) => tx.write(id, { n: 10 }, Date.now() - 1))
    expect(await second.transaction(id, (tx) => tx.read(id))).toBeUndefined()
  })

  it('makes exactly one real refresh call across concurrent store instances', async () => {
    const h = await createPersistentSession(config, tokens, Date.now(), store)
    const refresh = vi.fn(async () => ({
      accessToken: 'NEW',
      refreshToken: 'REFRESH-TWO',
      accessExpiresAt: Date.now() + 60_000,
    }))
    const results = await Promise.all(
      [store, second, store].map((s) => livePersistentSession(config, h, s, Date.now(), refresh)),
    )
    expect(refresh).toHaveBeenCalledTimes(1)
    expect(results.map((r) => r?.accessToken)).toEqual(['NEW', 'NEW', 'NEW'])
    expect((await livePersistentSession(config, h, second))?.record.sub).toBe(tokens.sub)
  })

  it('refuses an expired access token when the issuer provided no refresh token', async () => {
    const now = Date.now()
    const h = await createPersistentSession(
      config,
      { ...tokens, refreshToken: undefined, accessExpiresAt: now - 1 },
      now,
      store,
    )
    const refresh = vi.fn()
    expect(await livePersistentSession(config, h, second, now, refresh)).toBeNull()
    expect(refresh).not.toHaveBeenCalled()
  })

  it('cannot resurrect a session or child attempt when logout races a refresh', async () => {
    const h = await createPersistentSession(config, tokens, Date.now(), store)
    let started!: () => void
    const start = new Promise<void>((resolve) => {
      started = resolve
    })
    let finish!: (v: { accessToken: string; accessExpiresAt: number }) => void
    const reply = new Promise<{ accessToken: string; accessExpiresAt: number }>((resolve) => {
      finish = resolve
    })
    const pending = livePersistentSession(config, h, store, Date.now(), async () => {
      started()
      return reply
    })
    await start
    const rowKey = sessionKey(config, h)
    await second.transaction(rowKey, (tx) =>
      tx.write(rowKey + ':attempt:bulk', { synthetic: true }, Date.now() + 60_000),
    )
    await destroyPersistentSession(config, h, second)
    finish({ accessToken: 'TOO-LATE', accessExpiresAt: Date.now() + 60_000 })
    expect(await pending).toBeNull()
    expect(await livePersistentSession(config, h, second)).toBeNull()
    expect(
      await second.transaction(rowKey, (tx) => tx.read(rowKey + ':attempt:bulk')),
    ).toBeUndefined()
  })

  it('does not reuse a rotating token after an unknown refresh or abandoned claim', async () => {
    const now = Date.now()
    const h = await createPersistentSession(
      config,
      { ...tokens, accessExpiresAt: now + 2000 },
      now,
      store,
    )
    const refresh = vi.fn(async () => {
      throw new OidcError('unavailable', 'synthetic lost response')
    })
    expect((await livePersistentSession(config, h, store, now, refresh))?.accessToken).toBe('OLD')
    expect(await livePersistentSession(config, h, second, now + 3000, refresh)).toBeNull()
    expect(refresh).toHaveBeenCalledTimes(1)
    const h2 = await createPersistentSession(
      config,
      { ...tokens, accessExpiresAt: now - 1000 },
      now,
      store,
    )
    const rowKey = sessionKey(config, h2)
    await store.transaction(rowKey, async (tx) => {
      const rec = await tx.read<object>(rowKey)
      await tx.write(
        rowKey,
        { ...rec, refreshAttempt: { id: 'crashed', startedAt: now - 20_000 } },
        now + config.absoluteMs,
      )
    })
    expect(await livePersistentSession(config, h2, second, now, refresh)).toBeNull()
    expect(refresh).toHaveBeenCalledTimes(1)
  })

  it('refuses idle expiry even though the stored row has not reached absolute expiry', async () => {
    const now = Date.now()
    const h = await createPersistentSession(config, tokens, now - config.idleMs - 10, store)
    const refresh = vi.fn()
    expect(await livePersistentSession(config, h, second, now, refresh)).toBeNull()
    expect(refresh).not.toHaveBeenCalled()
  })

  it('retains PKCE across module state reset, rejects an unbound callback and consumes once', async () => {
    vi.stubEnv('BFF_STATE_BACKEND', 'postgres')
    vi.stubEnv('BFF_DATABASE_URL', profile.databaseUrl)
    vi.stubEnv('BFF_STATE_KEYS', JSON.stringify(keys))
    vi.stubEnv('BFF_STATE_KEY_ID', 'v1')
    const idp = new FakeIdp()
    idp.install()
    const { url, state } = await beginLogin(cfg, '/workspaces')
    const nonce = new URL(url).searchParams.get('nonce')!
    idp.tokenResponse = {
      access_token: 'SYNTHETIC-ACCESS',
      expires_in: 300,
      id_token: idp.idToken(nonce),
    }
    resetOidcState()
    await expect(
      completeLogin(cfg, { code: 'c', state, cookieState: 'wrong' }),
    ).rejects.toMatchObject({ code: 'invalid' })
    expect((await completeLogin(cfg, { code: 'c', state, cookieState: state })).tokens.sub).toBe(
      'user-1',
    )
    await expect(
      completeLogin(cfg, { code: 'c', state, cookieState: state }),
    ).rejects.toMatchObject({ code: 'invalid' })
  })
})
