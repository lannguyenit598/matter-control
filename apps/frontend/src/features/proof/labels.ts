export const CRITERION_REASON: Record<string, string> = {
  MISSING: 'No evidence offered yet',
  PENDING_REVIEW: 'Offered, waiting for an independent verifier',
  REJECTED: 'Rejected by a verifier',
  EXPIRED: 'The accepted proof is past its validity',
  WITHDRAWN: 'The evidence was withdrawn',
  VERSION_SUPERSEDED: 'Accepted on a version that is no longer the required one',
  REVOKED: 'The acceptance was revoked',
  DISPUTED: 'Challenged: waiting for an independent verifier',
  NOT_YET_VALID: 'The evidence is not valid yet',
  OLD_EPOCH: 'Accepted before the record was reopened; it must be reviewed again',
}

export const VERSION_RULE_LABEL: Record<string, string> = {
  NONE: 'Any evidence',
  CURRENT_AUTHORITATIVE: 'The current version of a document',
  FIXED: 'One exact version',
}

export function userName(names: Record<string, string>, id: string | null | undefined) {
  if (!id) return 'nobody'
  return names[id] ?? 'a former member'
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KiB`
  return `${(n / 1024 / 1024).toFixed(1)} MiB`
}
