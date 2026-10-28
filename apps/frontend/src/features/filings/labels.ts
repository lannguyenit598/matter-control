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

/** A browser datetime-local value as an RFC 3339 instant with an explicit offset. */
export function toInstant(local: string | undefined): string {
  if (!local) return ''
  const d = new Date(local)
  return Number.isNaN(d.getTime()) ? '' : d.toISOString()
}

export function userName(names: Record<string, string>, id: string | null | undefined) {
  if (!id) return 'nobody'
  return names[id] ?? 'a former member'
}
