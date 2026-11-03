import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { eventSchema } from '../schemas'

import { MatterHistory } from './matter-history'

const event = {
  seq: 12,
  id: 'event-12',
  type: 'requirement.edited',
  schemaVersion: 1,
  actorKind: 'HUMAN',
  actorId: 'member-1',
  targetKind: 'REQUIREMENT',
  targetId: 'requirement-2',
  effectiveAt: '2026-10-27T09:00:00Z',
  recordedAt: '2026-10-28T10:00:00Z',
  reason: 'Correction after review',
  causeSeq: 10,
  correlationId: 'correlation-4',
  commandKey: 'command-5',
  before: { title: 'Earlier wording' },
  after: { title: 'Reviewed wording' },
}

describe('MatterHistory', () => {
  it('shows the member name for a known actor id and the recorded id otherwise', () => {
    const { rerender } = render(
      <MatterHistory
        events={[eventSchema.parse(event)]}
        nextHref={null}
        actorNames={{ 'member-1': 'Alice' }}
      />,
    )
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.queryByText('member-1')).toBeNull()
    rerender(<MatterHistory events={[eventSchema.parse(event)]} nextHref={null} actorNames={{}} />)
    expect(screen.getByText('member-1')).toBeInTheDocument()
  })

  it('retains and presents the attributed event payload instead of stripping provenance', () => {
    const parsed = eventSchema.parse(event)
    expect(parsed).toEqual(event)
    render(<MatterHistory events={[parsed]} nextHref="/matters/m/history?cursor=opaque" />)
    fireEvent.click(screen.getByLabelText('Event details'))
    expect(screen.getByText('member-1')).toBeVisible()
    expect(screen.getByText('Correction after review')).toBeVisible()
    expect(screen.getByText('correlation-4')).toBeVisible()
    expect(screen.getByText(/Earlier wording/)).toBeVisible()
    expect(screen.getByText(/Reviewed wording/)).toBeVisible()
    expect(screen.getByRole('link', { name: 'Next page' })).toHaveAttribute(
      'href',
      '/matters/m/history?cursor=opaque',
    )
    expect(screen.getByText('Effective time')).toBeVisible()
    expect(screen.getByText('Recorded time')).toBeVisible()
  })

  it('does not infer an actor, reason, cause or payload when the API records null', () => {
    const parsed = eventSchema.parse({
      ...event,
      actorId: null,
      reason: null,
      causeSeq: null,
      correlationId: null,
      commandKey: null,
      before: null,
      after: null,
    })
    render(<MatterHistory events={[parsed]} nextHref={null} />)
    expect(screen.queryByRole('link', { name: 'Next page' })).not.toBeInTheDocument()
    expect(screen.getAllByText('Not recorded').length).toBeGreaterThan(0)
    expect(screen.queryByText('member-1')).not.toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})
