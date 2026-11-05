import { z } from 'zod'

export const ALLOWED_CASE_IDS = [
  'T1',
  'T2',
  'T3',
  'T4',
  'T5',
  'T8',
  'T9',
  'T10',
  'T11a',
  'T11b',
  'T11c',
  'T12',
  'W1',
  'W2',
  'W3',
  'T6-W',
  'T7-W',
  'W9',
  'W11',
  'INT-PERS-01',
  'INT-PERS-02',
  'INT-PERS-03',
  'INT-PERS-04',
] as const

export type CaseId = (typeof ALLOWED_CASE_IDS)[number]

/**
 * Fixed per-case refId requirement table (frozen INTA-1 / R06).
 * refId is required where a fixed record-route case requires it;
 * forbidden on create / fixed-literal / synthetic wire / fault cases without an existing record target.
 */
export const REF_ID_REQUIRED_CASE_IDS: ReadonlySet<CaseId> = new Set<CaseId>([
  'T2',
  'T5',
  'T8',
  'T9',
  'T10',
  'T11a',
  'T11b',
  'T12',
  'W2',
  'W9',
  'W11',
  'INT-PERS-01',
  'INT-PERS-02',
  'INT-PERS-03',
  'INT-PERS-04',
])

export const REF_ID_FORBIDDEN_CASE_IDS: ReadonlySet<CaseId> = new Set<CaseId>([
  'T1',
  'T3',
  'T4',
  'T11c',
  'W1',
  'W3',
  'T6-W',
  'T7-W',
])

export function isRefIdRequired(caseId: CaseId): boolean {
  return REF_ID_REQUIRED_CASE_IDS.has(caseId)
}

export function isRefIdForbidden(caseId: CaseId): boolean {
  return REF_ID_FORBIDDEN_CASE_IDS.has(caseId)
}

const CANONICAL_LOWERCASE_UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

export const harnessCaseInputSchema = z
  .object({
    runId: z
      .string()
      .regex(/^[a-zA-Z0-9]{8,32}$/, 'runId must be 8-32 alphanumeric characters'),
    caseId: z.enum(ALLOWED_CASE_IDS),
    refId: z
      .string()
      .regex(CANONICAL_LOWERCASE_UUID_REGEX, 'refId must be lowercase canonical UUID')
      .optional(),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (isRefIdRequired(data.caseId) && !data.refId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `refId is required for case ${data.caseId}`,
        path: ['refId'],
      })
    }
    if (isRefIdForbidden(data.caseId) && data.refId !== undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `refId is forbidden for case ${data.caseId}`,
        path: ['refId'],
      })
    }
  })

export type HarnessCaseInput = z.infer<typeof harnessCaseInputSchema>

/**
 * Go native User schema with snake_case time fields (INTA-FE-R01).
 * Timestamps are RFC 3339 UTC with 0-6 fraction digits.
 */
export const nativeUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(1),
  version: z.number().int().positive(),
  created_at: z.string(),
  updated_at: z.string(),
})

export type NativeUser = z.infer<typeof nativeUserSchema>
