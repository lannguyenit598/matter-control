import type { FilingStage } from './schemas'

export const STAGE_LABEL: Record<FilingStage, string> = {
  REQUIREMENT: 'Requirement',
  PACKAGE_PREPARATION: 'Package preparation',
  SIGNATURE: 'Signature',
  SUBMISSION: 'Submission',
  RECEIPT: 'Receipt',
  AUTHORITY_REVIEW: 'Authority review',
  SUPPLEMENT: 'Supplement',
  RESPONSE: 'Response',
  APPROVAL: 'Approval',
}

export const STAGE_HELP: Record<FilingStage, string> = {
  REQUIREMENT:
    'The obligation is recorded. Assign an owner and declare the package criteria to start.',
  PACKAGE_PREPARATION: 'Prepare the package. Identify the versions it will contain.',
  SIGNATURE:
    'Collect signatures. Submission needs every mandatory criterion satisfied by an independent verifier.',
  SUBMISSION: 'Submitted is not completed: the filing waits for the authority’s acknowledgement.',
  RECEIPT: 'Acknowledgement received. Receipt is not approval.',
  AUTHORITY_REVIEW: 'Waiting for the authority. Review is not approval.',
  SUPPLEMENT:
    'The authority asked for more. This opens a new cycle with its own owner and due date.',
  RESPONSE: 'Respond with the exact versions submitted in this cycle.',
  APPROVAL: 'The authority’s decision, supported by outcome evidence.',
}

export const OBSERVATION_LABEL: Record<string, string> = {
  STAGE: 'Stage change',
  NEGATIVE_OUTCOME: 'Rejection or withdrawal recorded',
  CLOSE_NEGATIVE: 'Closed after a negative outcome',
  REOPEN: 'Reopened',
  CORRECTION: 'Correction',
}

export function userName(names: Record<string, string>, id: string | null | undefined) {
  if (!id) return 'nobody'
  return names[id] ?? 'a former member'
}

// ---- Pre-flight panel (MC-PREFLIGHT-01) ----
// Machine fields come from the read model; every sentence here is UI copy. Vietnamese labels
// are DRAFT pending R10 ratification — check terminology-final.md before merging copy changes.

export const PREFLIGHT_PURPOSE_LABEL: Record<string, { en: string; vi: string }> = {
  PACKAGE: { en: 'Package', vi: 'Gói hồ sơ' },
  SIGNATURE: { en: 'Signature', vi: 'Chữ ký' },
  OUTCOME: { en: 'Outcome', vi: 'Kết quả' },
}

export const PREFLIGHT_STATE_LABEL: Record<string, { en: string; vi: string }> = {
  SATISFIED: { en: 'Satisfied', vi: 'Đã đủ' },
  UNSATISFIED: { en: 'Not satisfied', vi: 'Chưa đủ' },
  WAIVED: { en: 'Waived', vi: 'Được miễn' },
  DISPUTED: { en: 'Disputed', vi: 'Đang tranh chấp' },
  PENDING_ASSESSMENT: { en: 'Awaiting assessment', vi: 'Đang chờ xác minh' },
}

/** Cause text per row identity: statuses never speak through a bare badge (brand commitment). */
export function preflightCause(row: { kind: string; state: string; blocking: boolean }): {
  en: string
  vi: string
} {
  if (row.kind === 'MISSING_PACKAGE')
    return {
      en: 'No package criterion is declared; declare what the package must contain.',
      vi: 'Chưa khai tiêu chí gói hồ sơ; cần khai gói cần có gì.',
    }
  if (row.kind === 'SIGNATURE_REQUIREMENT') {
    if (row.state === 'WAIVED')
      return {
        en: 'The owner decided signatures do not apply.',
        vi: 'Chủ hồ sơ quyết định không áp dụng chữ ký.',
      }
    if (row.blocking)
      return {
        en: 'No SIGNATURE criterion is declared for the filing’s signatures.',
        vi: 'Chưa khai tiêu chí chữ ký cho hồ sơ khai này.',
      }
    return {
      en: 'A signature on the submitted versions is checked at submission time.',
      vi: 'Chữ ký trên phiên bản nộp sẽ được kiểm tra lúc nộp.',
    }
  }
  switch (row.state) {
    case 'SATISFIED':
      return {
        en: 'Accepted by an independent verifier.',
        vi: 'Đã được người xác minh độc lập chấp nhận.',
      }
    case 'PENDING_ASSESSMENT':
      return {
        en: 'Proof was offered and is waiting for an independent assessment.',
        vi: 'Bằng chứng đã được nộp, đang chờ người xác minh độc lập.',
      }
    case 'DISPUTED':
      return {
        en: 'An open dispute questions this proof; resolve it before counting it.',
        vi: 'Bằng chứng đang bị tranh chấp; cần giải quyết trước khi tính.',
      }
    case 'WAIVED':
      return { en: 'Waived by the owner.', vi: 'Được chủ hồ sơ miễn.' }
    default:
      return {
        en: 'No accepted proof covers this requirement yet.',
        vi: 'Chưa có bằng chứng được chấp nhận cho yêu cầu này.',
      }
  }
}
