import { render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/hooks/use-time-zone', () => ({ useTimeZone: () => 'UTC' }))

import type { PendingAssessment } from '../schemas'

import { assessHref, ReviewQueue } from './review-queue'

const row = (over: Partial<PendingAssessment> = {}): PendingAssessment => ({
  matterId: 'm1',
  matterTitle: 'Atlas',
  subjectId: 'f1',
  subjectKind: 'ACTION',
  subjectTitle: 'Merger filing',
  subjectEpoch: 0,
  criterionId: 'c1',
  criterionTitle: 'Signed filing form',
  criterionRevision: 1,
  criterionPurpose: 'PACKAGE',
  claimId: 'k1',
  claimedAt: '2026-10-30T03:00:00Z',
  claimedBy: 'u1',
  claimedByName: 'Alice',
  evidenceId: 'e1',
  evidenceKind: 'DOCUMENT_VERSION',
  evidenceReference: '',
  submittedBy: 'u1',
  submittedByName: 'Alice',
  versionId: 'v1',
  versionLabel: 'Filing package · v2 · package.pdf',
  reason: 'PENDING_REVIEW',
  ...over,
})

const props = { total: 1, nextHref: null, firstHref: null, here: '/my-reviews' }

describe('ReviewQueue', () => {
  it('names the exact criterion, matter, record, evidence version and offerer, and links to the assessment', () => {
    render(<ReviewQueue {...props} items={[row()]} />)
    const item = screen.getByRole('listitem')
    expect(within(item).getByText('Signed filing form')).toBeInTheDocument()
    expect(within(item).getByRole('link', { name: 'Atlas' })).toHaveAttribute('href', '/matters/m1')
    expect(item).toHaveTextContent('Action: Merger filing')
    expect(item).toHaveTextContent('Filing package · v2 · package.pdf')
    expect(item).toHaveTextContent('Offered by Alice')
    const link = within(item).getByRole('link', { name: /Open to assess/ })
    const url = new URL(link.getAttribute('href')!, 'http://x')
    expect(url.pathname).toBe('/matters/m1/work/f1')
    expect(url.searchParams.get('criterion')).toBe('c1')
    expect(url.searchParams.get('from')).toBe('/my-reviews')
  })

  it('labels an outcome criterion and a review that must be repeated after a reopen', () => {
    render(
      <ReviewQueue
        {...props}
        items={[row({ criterionPurpose: 'OUTCOME', reason: 'OLD_EPOCH' })]}
      />,
    )
    expect(screen.getByText('Authority outcome')).toBeInTheDocument()
    expect(screen.getByText('Review again after reopening')).toBeInTheDocument()
  })

  it('shows an external reference instead of a version', () => {
    render(
      <ReviewQueue
        {...props}
        items={[
          row({
            evidenceKind: 'EXTERNAL_REFERENCE',
            evidenceReference: 'REF-9',
            versionId: null,
            versionLabel: '',
          }),
        ]}
      />,
    )
    expect(screen.getByText(/“REF-9”/)).toBeInTheDocument()
  })

  it('explains an empty queue, including that owner status alone is not verifier authority', () => {
    render(<ReviewQueue {...props} items={[]} total={0} />)
    expect(screen.getByText('Nothing is waiting for your review')).toBeInTheDocument()
    expect(screen.getByText(/Owner status alone does not make you a verifier/)).toBeInTheDocument()
  })

  it('pages with plain links', () => {
    render(
      <ReviewQueue
        {...props}
        items={[row()]}
        nextHref="/my-reviews?cursor=abc"
        firstHref="/my-reviews"
      />,
    )
    expect(screen.getByRole('link', { name: 'Show more' })).toHaveAttribute(
      'href',
      '/my-reviews?cursor=abc',
    )
    expect(screen.getByRole('link', { name: 'Back to the oldest' })).toHaveAttribute(
      'href',
      '/my-reviews',
    )
  })

  it('builds a destination that keeps the origin and rejects nothing it should keep', () => {
    expect(assessHref(row(), '/my-reviews?cursor=x')).toContain('from=%2Fmy-reviews%3Fcursor%3Dx')
  })
})
