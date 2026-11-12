import { MESSAGES, fieldFailure } from '@/lib/mc/action-result'
import { idSchema } from '@/lib/mc/schemas'
import { UUID_V7 } from '@/lib/mc/idempotency'

import {
  isEmlFile,
  MAX_EML_BYTES,
  mailUploadOutcomeSchema,
  type MailUploadOutcome,
} from './schemas'

const UNKNOWN_RETRY = {
  ok: false,
  kind: 'outcome-unknown',
  error: MESSAGES['outcome-unknown'],
  retrySameKey: true,
} as const

export const mailUploadRepository = {
  async intake(matterId: string, file: File, idempotencyKey: string): Promise<MailUploadOutcome> {
    if (!idSchema.safeParse(matterId).success || !UUID_V7.test(idempotencyKey))
      return fieldFailure('file', 'The upload is incomplete.')
    if (!isEmlFile(file) || file.size > MAX_EML_BYTES)
      return fieldFailure('file', 'Only .eml files up to 25 MiB are accepted.')
    const body = new FormData()
    body.set('file', file)
    body.set('direction', 'INBOUND')
    try {
      const response = await fetch(`/api/matters/${matterId}/mail-intake`, {
        method: 'POST',
        headers: { 'Idempotency-Key': idempotencyKey },
        body,
      })
      const json: unknown = await response.json().catch(() => null)
      const parsed = mailUploadOutcomeSchema.safeParse(json)
      if (parsed.success && response.ok && parsed.data.ok) return parsed.data
      if (parsed.success && !response.ok && !parsed.data.ok) {
        if (parsed.data.kind === 'outcome-unknown') return UNKNOWN_RETRY
        if (response.status < 500) return parsed.data
        // A server error may follow a commit even when it carries a structured body.
      }
      return UNKNOWN_RETRY
    } catch {
      // Transport or body-consumption failure does not prove that intake rolled back.
      return UNKNOWN_RETRY
    }
  },
}
