import 'server-only'

import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto'
import { Socket } from 'node:net'
import { Client } from 'pg'

import { McError } from '@/lib/mc/errors'

export type StateTransaction = {
  read<T>(key: string): Promise<T | undefined>
  write<T>(key: string, value: T, expiresAt: number): Promise<void>
  removeFamily(key: string): Promise<void>
}

export type StateStore = {
  transaction<R>(lockKey: string, body: (tx: StateTransaction) => Promise<R>): Promise<R>
}

export type DurableConfig = {
  databaseUrl: string
  ca?: string
  keyId: string
  keys: Record<string, string>
}

const MAX_BYTES = 36 * 1024 * 1024

/** AES-GCM binds ciphertext to its database key; moving a row cannot change its scope. */
export function sealState(
  value: unknown,
  rowKey: string,
  cfg: Pick<DurableConfig, 'keyId' | 'keys'>,
): Buffer {
  const key = Buffer.from(cfg.keys[cfg.keyId] ?? '', 'base64')
  if (key.length !== 32 || !/^[a-zA-Z0-9_-]{1,32}$/.test(cfg.keyId))
    throw new Error('Invalid BFF state encryption configuration')
  const plain = Buffer.from(
    JSON.stringify(value, (_key, v) =>
      v instanceof Uint8Array ? { __mcBytes: Buffer.from(v).toString('base64') } : v,
    ),
  )
  if (plain.length > MAX_BYTES) throw new McError('payload-too-large', 413)
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  cipher.setAAD(Buffer.from(rowKey))
  const encrypted = Buffer.concat([cipher.update(plain), cipher.final()])
  const kid = Buffer.from(cfg.keyId)
  return Buffer.concat([Buffer.from([1, kid.length]), kid, iv, cipher.getAuthTag(), encrypted])
}

export function openState<T>(sealed: Buffer, rowKey: string, keys: Record<string, string>): T {
  if (sealed.length < 31 || sealed[0] !== 1 || sealed[1]! > 32)
    throw new Error('Invalid sealed state')
  const n = sealed[1]!
  const key = Buffer.from(keys[sealed.subarray(2, 2 + n).toString()] ?? '', 'base64')
  if (key.length !== 32) throw new Error('Unknown state key version')
  const decipher = createDecipheriv('aes-256-gcm', key, sealed.subarray(2 + n, 14 + n))
  decipher.setAAD(Buffer.from(rowKey))
  decipher.setAuthTag(sealed.subarray(14 + n, 30 + n))
  const plain = Buffer.concat([decipher.update(sealed.subarray(30 + n)), decipher.final()])
  return JSON.parse(plain.toString(), (_key, v) =>
    v && typeof v === 'object' && Object.keys(v).length === 1 && typeof v.__mcBytes === 'string'
      ? new Uint8Array(Buffer.from(v.__mcBytes, 'base64'))
      : v,
  ) as T
}

/** New client per transaction: no TCP handle is shared between Worker request contexts. */
export function createPostgresState(cfg: DurableConfig): StateStore {
  // Validate key configuration before any network I/O.
  sealState(null, 'config-check', cfg)
  const url = new URL(cfg.databaseUrl)
  if (!['postgres:', 'postgresql:'].includes(url.protocol))
    throw new Error('Invalid BFF database URL')
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
  const localPlaintext = local && ['disable', null].includes(url.searchParams.get('sslmode'))
  if (!local && url.searchParams.get('sslmode') !== 'verify-full')
    throw new Error('Remote BFF database requires sslmode=verify-full')
  // pg connectionString SSL parameters override the explicit ssl object; do not allow that.
  url.search = ''
  return {
    async transaction<R>(lockKey: string, body: (tx: StateTransaction) => Promise<R>): Promise<R> {
      const client = new Client({
        // Use nodejs_compat's native Socket. pg-cloudflare's legacy close loop can reject
        // after client.end(), producing unhandled request-context errors in workerd.
        stream: () => new Socket(),
        connectionString: url.toString(),
        ssl: localPlaintext
          ? false
          : { rejectUnauthorized: true, ...(cfg.ca ? { ca: cfg.ca } : {}) },
        connectionTimeoutMillis: 5000,
        query_timeout: 10000,
        statement_timeout: 10000,
        application_name: 'mc-bff',
      })
      try {
        await client.connect()
        await client.query('BEGIN')
        await client.query("SET LOCAL lock_timeout = '5s'")
        await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1::text, 0))', [lockKey])
        const result = await body({
          async read<T>(key: string) {
            const rows = await client.query<{ sealed: Buffer }>(
              'SELECT sealed FROM mc_bff.state WHERE state_key = $1 AND expires_at > clock_timestamp()',
              [key],
            )
            return rows.rows[0] ? openState<T>(rows.rows[0].sealed, key, cfg.keys) : undefined
          },
          async write<T>(key: string, value: T, expiresAt: number) {
            await client.query(
              'INSERT INTO mc_bff.state (state_key, sealed, expires_at) VALUES ($1, $2, $3) ON CONFLICT (state_key) DO UPDATE SET sealed = EXCLUDED.sealed, expires_at = EXCLUDED.expires_at',
              [key, sealState(value, key, cfg), new Date(expiresAt)],
            )
          },
          async removeFamily(key: string) {
            await client.query(
              'DELETE FROM mc_bff.state WHERE state_key = $1 OR starts_with(state_key, $2)',
              [key, key + ':'],
            )
          },
        })
        await client.query('COMMIT')
        return result
      } catch (error) {
        await client.query('ROLLBACK').catch(() => {})
        if (error instanceof McError) throw error
        // Never retain driver errors: connection errors can contain database credentials.
        throw new McError('unavailable', 503)
      } finally {
        await client.end().catch(() => {})
      }
    },
  }
}

/** Explicit profile; an invalid durable configuration never falls back to process memory. */
export function durableState(): StateStore | undefined {
  const backend = process.env.BFF_STATE_BACKEND ?? 'memory'
  if (backend === 'memory') return undefined
  if (backend !== 'postgres') throw new McError('unavailable', 503)
  try {
    return createPostgresState({
      databaseUrl: process.env.BFF_DATABASE_URL ?? '',
      keyId: process.env.BFF_STATE_KEY_ID ?? '',
      keys: JSON.parse(process.env.BFF_STATE_KEYS ?? '{}') as Record<string, string>,
      ca: process.env.BFF_DATABASE_CA,
    })
  } catch {
    throw new McError('unavailable', 503)
  }
}

export function stateKey(
  cfg: { issuer: string; clientId: string; appOrigin: string },
  kind: string,
  handle: string,
) {
  const namespace = createHash('sha256')
    .update(JSON.stringify([cfg.issuer, cfg.clientId, cfg.appOrigin]))
    .digest('hex')
  const hash = createHash('sha256').update(handle).digest('hex')
  return `${kind}:${namespace}:${hash}`
}
