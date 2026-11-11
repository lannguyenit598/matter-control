'use server'

import { cookies } from 'next/headers'

import { requireSession } from '@/lib/auth'
import { MESSAGES, fieldFailure, toMcFailure, type McActionResult } from '@/lib/mc/action-result'
import { pathId } from '@/lib/mc/client'
import { oidcConfig } from '@/lib/oidc/config'

import { isEmlFile, MAX_EML_BYTES, mailDirectionSchema, type MailIntakeResult } from './schemas'

export type MailUploadOutcome = McActionResult & Partial<MailIntakeResult>

/** An upload whose answer was lost may have committed: the SAME request with the SAME key is safe. */
const UNKNOWN_RETRY: Extract<McActionResult, { ok: false }> = {
  ok: false,
  kind: 'outcome-unknown',
  error: MESSAGES['outcome-unknown'],
  retrySameKey: true,
}

/**
 * Intake of one captured email (.eml). The bytes go to the same-origin BFF upload route — never
 * through this action's own body — so the route's same-origin guard and header rules stay the one
 * place that owns the raw backend wire. The key is minted in the browser per intent and resent
 * unchanged for every retry of the same file.
 */
export async function uploadEmlAction(
  matterId: string,
  form: FormData,
  idempotencyKey: string,
): Promise<MailUploadOutcome> {
  try {
    await requireSession()
    const cfg = oidcConfig()
    if (!cfg) return { ok: false, kind: 'forbidden', error: MESSAGES.forbidden }
    pathId(matterId)
    const file = form.get('file')
    if (!(file instanceof File)) return fieldFailure('file', 'The upload is incomplete.')
    if (!isEmlFile(file)) return fieldFailure('file', 'Only .eml files are accepted.')
    if (file.size > MAX_EML_BYTES)
      return fieldFailure('file', 'That file is larger than the 25 MiB upload limit.')
    const direction = mailDirectionSchema.safeParse(form.get('direction'))
    const body = new FormData()
    body.set('file', file, file.name)
    body.set('direction', direction.success ? direction.data : 'INBOUND')
    // The BFF route authenticates the forwarded call from the session cookie and its Origin rule.
    const session = (await cookies()).get(cfg.sessionCookie)
    if (!session) return { ok: false, kind: 'unauthenticated', error: MESSAGES.unauthenticated }
    let res: Response
    try {
      res = await fetch(`${cfg.appOrigin}/api/matters/${matterId}/mail-intake`, {
        method: 'POST',
        headers: {
          Cookie: `${cfg.sessionCookie}=${session.value}`,
          Origin: cfg.appOrigin,
          'Idempotency-Key': idempotencyKey,
        },
        // The multipart boundary belongs to the runtime: no explicit Content-Type here.
        body,
      })
    } catch {
      return UNKNOWN_RETRY
    }
    const json = (await res.json().catch(() => null)) as MailUploadOutcome | null
    if (json && json.ok === true) return { ...json, replayed: json.replayed === true }
    if (json && json.ok === false) return { ...json, error: json.error ?? MESSAGES.error }
    // A 2xx or 5xx whose body is unusable may have committed.
    return UNKNOWN_RETRY
  } catch (error) {
    return toMcFailure(error)
  }
}
