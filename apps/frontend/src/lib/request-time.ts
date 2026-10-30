import 'server-only'

import { connection } from 'next/server'

/**
 * Waits for an incoming request before continuing (never during prerendering). Wrapped so unit tests,
 * which have no request scope, can replace it in src/test/setup.ts without loading next/server.
 */
export const awaitRequest = connection
