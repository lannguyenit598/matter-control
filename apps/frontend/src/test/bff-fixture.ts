import { readFile } from 'node:fs/promises'
import { Client } from 'pg'

export async function prepareBffFixture(databaseUrl: string) {
  const url = new URL(databaseUrl)
  if (!['localhost', '127.0.0.1'].includes(url.hostname) || url.pathname !== '/mc_fixture')
    throw new Error('These tests require the explicitly owned disposable mc_fixture database')
  const client = new Client({ connectionString: databaseUrl })
  try {
    await client.connect()
    await client.query('BEGIN')
    // Independent Vitest workers must not race schema bootstrap.
    await client.query("SELECT pg_advisory_xact_lock(hashtextextended('mc-bff-test-bootstrap', 0))")
    await client.query(
      await readFile(new URL('../../../../ops/adr006/bff-state.sql', import.meta.url), 'utf8'),
    )
    await client.query('COMMIT')
  } catch (error) {
    await client.query('ROLLBACK').catch(() => undefined)
    throw error
  } finally {
    await client.end()
  }
}
