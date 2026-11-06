import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }))

import { TermSheetPanel } from './term-sheet-panel'
import type { TermSheetLine } from '../schemas'
import { promoteTermLineAction } from '../actions'

vi.mock('../actions', () => ({ promoteTermLineAction: vi.fn() }))

const line = (over: Partial<TermSheetLine>): TermSheetLine => ({
  id: '01900000-0000-7000-8000-000000000001',
  documentVersionId: '01900000-0000-7000-8000-000000000003',
  field: 'PARTY',
  valueText: 'Công ty TNHH ABC',
  valueDate: null,
  sourceHash: 'a'.repeat(64),
  promotedRef: '',
  promotedKind: '',
  revision: 1,
  ...over,
})

describe('TermSheetPanel', () => {
  it('renders every fact with its field label, value and source pin', () => {
    render(
      <TermSheetPanel
        matterId="m1"
        matterRevision={1}
        lines={[
          line({}),
          line({
            id: '01900000-0000-7000-8000-000000000004',
            field: 'EFFECTIVE_DATE',
            valueText: null,
            valueDate: '2026-12-01T00:00:00Z',
          }),
        ]}
      />,
    )
    expect(screen.getByText('Party')).toBeInTheDocument()
    expect(screen.getByText('Công ty TNHH ABC')).toBeInTheDocument()
    expect(screen.getByText('Effective date')).toBeInTheDocument()
    expect(screen.getByText('2026-12-01')).toBeInTheDocument()
    // The source pin is the content hash prefix, per line.
    expect(screen.getAllByText('aaaaaaaaaa…')).toHaveLength(2)
    expect(screen.getAllByText('Fact only')).toHaveLength(2)
  })

  it('shows the empty state and keeps the import form reachable', () => {
    render(<TermSheetPanel matterId="m1" matterRevision={1} lines={[]} />)
    expect(screen.getByText(/No term lines yet/)).toBeInTheDocument()
    expect(screen.getByLabelText('Source document version id')).toBeInTheDocument()
    expect(screen.getByLabelText('Spreadsheet (CSV/XLSX)')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Import' })).toBeEnabled()
  })

  it('exposes a promote action per unpromoted line and the kind once promoted', () => {
    render(
      <TermSheetPanel
        matterId="m1"
        matterRevision={1}
        lines={[
          line({}),
          line({
            id: '01900000-0000-7000-8000-000000000005',
            field: 'GOVERNING_LAW',
            valueText: 'Việt Nam',
            promotedRef: '01900000-0000-7000-8000-000000000006',
            promotedKind: 'requirement',
          }),
        ]}
      />,
    )
    expect(screen.getByRole('button', { name: 'Promote' })).toBeInTheDocument()
    expect(screen.getByText('Requirement draft')).toBeInTheDocument()
    expect(screen.queryByText('Fact only')).toBeInTheDocument() // only the unpromoted one
  })
  it('reuses the promotion intent after an unknown result and a replaced source line', async () => {
    const promote = vi.mocked(promoteTermLineAction)
    promote.mockResolvedValueOnce({
      ok: false,
      kind: 'outcome-unknown',
      error: 'Retry with the same key.',
    })
    promote.mockResolvedValueOnce({
      ok: true,
      id: 'draft-id',
      targetKind: 'action',
      replayed: true,
    })
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true)
    try {
      const { rerender } = render(
        <TermSheetPanel matterId="m1" matterRevision={1} lines={[line({})]} />,
      )
      fireEvent.click(screen.getByRole('button', { name: 'Promote' }))
      await screen.findByText('Retry with the same key.')
      rerender(<TermSheetPanel matterId="m1" matterRevision={2} lines={[]} />)
      fireEvent.click(screen.getByRole('button', { name: 'Confirm pending promotion' }))
      expect(await screen.findByRole('link', { name: 'Open confirmed draft' })).toHaveAttribute(
        'href',
        '/matters/m1/work/draft-id',
      )
      expect(promote.mock.calls[0]?.[0].idempotencyKey).toMatch(/^[0-9a-f-]{14}7/)
      expect(promote.mock.calls[1]).toEqual(promote.mock.calls[0])
    } finally {
      confirm.mockRestore()
    }
  })
})
