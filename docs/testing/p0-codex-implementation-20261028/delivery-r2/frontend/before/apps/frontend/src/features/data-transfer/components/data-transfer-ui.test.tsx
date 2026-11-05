import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const actions = vi.hoisted(() => ({
  bulkPreview: vi.fn(),
  bulkCommit: vi.fn(),
  importPreview: vi.fn(),
  importCommit: vi.fn(),
  brief: vi.fn(),
}))
vi.mock('../actions', () => ({
  bulkPreviewAction: actions.bulkPreview,
  bulkCommitAction: actions.bulkCommit,
  importPreviewAction: actions.importPreview,
  importCommitAction: actions.importCommit,
  briefAction: actions.brief,
}))

import { UUID_V7 } from '@/lib/mc/idempotency'

import { BriefSection } from './brief-section'
import { BulkSection } from './bulk-section'
import { ImportSection } from './import-section'

const ITEM = '0192b1c4-0000-7000-8000-000000000001'

beforeEach(() => {
  Object.values(actions).forEach((a) => a.mockReset())
})

const previewOf = (valid = true) => ({
  ok: true,
  preview: {
    previewId: 'p1',
    asOf: '2026-10-27T09:00:00Z',
    rows: [{ rowKey: 'row-1', itemId: ITEM, found: true, valid, title: 'Old title', revision: 1 }],
  },
})

async function readyBulk() {
  actions.bulkPreview.mockResolvedValue(previewOf())
  render(<BulkSection matterId="m1" />)
  fireEvent.click(screen.getByRole('button', { name: 'Add row' }))
  fireEvent.change(screen.getByLabelText(/Item id/), { target: { value: ITEM } })
  fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'set' } })
  fireEvent.change(screen.getByLabelText('Title new value'), { target: { value: 'Renamed' } })
  fireEvent.click(screen.getByRole('button', { name: 'Preview' }))
  await screen.findByRole('list', { name: 'Preview' })
}

describe('BulkSection', () => {
  it('defaults every field to Unchanged and offers Clear only where clearing is allowed', () => {
    render(<BulkSection matterId="m1" />)
    fireEvent.click(screen.getByRole('button', { name: 'Add row' }))
    for (const label of ['Title', 'Description', 'Internal owner (user id)', 'Due (RFC 3339)'])
      expect(screen.getByLabelText(label)).toHaveValue('unchanged')
    const optionsOf = (label: string) =>
      within(screen.getByLabelText(label))
        .getAllByRole('option')
        .map((o) => o.textContent)
    expect(optionsOf('Title')).not.toContain('Clear')
    expect(optionsOf('Due (RFC 3339)')).toContain('Clear')
    expect(screen.getAllByText(/Cannot be cleared/)).toHaveLength(2) // title and description say why
  })

  it('cannot commit before a preview, nor after the rows changed since it', async () => {
    render(<BulkSection matterId="m1" />)
    fireEvent.click(screen.getByRole('button', { name: 'Add row' }))
    expect(screen.getByRole('button', { name: 'Commit' })).toBeDisabled()
    cleanup()
    await readyBulk()
    expect(screen.getByRole('button', { name: 'Commit' })).toBeEnabled()
    fireEvent.change(screen.getByLabelText('Title new value'), {
      target: { value: 'Edited after preview' },
    })
    expect(screen.getByRole('button', { name: 'Commit' })).toBeDisabled()
    expect(screen.getByText('The rows changed after the preview')).toBeInTheDocument()
  })

  it('sends only what was set (unchanged omitted, clear as empty) with UUIDv7 keys it minted', async () => {
    await readyBulk()
    actions.bulkCommit.mockResolvedValue({
      ok: true,
      results: [{ rowKey: 'row-1', itemId: ITEM, status: 'SUCCESS', revision: 2 }],
    })
    fireEvent.click(screen.getByRole('button', { name: 'Commit' }))
    await waitFor(() => expect(actions.bulkCommit).toHaveBeenCalledTimes(1))
    const [matterId, input] = actions.bulkCommit.mock.calls[0]!
    expect(matterId).toBe('m1')
    expect(input.rows[0]).toMatchObject({
      rowKey: 'row-1',
      itemId: ITEM,
      expectedRevision: 1,
      title: 'Renamed',
    })
    expect(input.rows[0]).not.toHaveProperty('description')
    expect(UUID_V7.test(input.attemptKey)).toBe(true)
    expect(UUID_V7.test(input.rows[0].idempotencyKey)).toBe(true)
    expect(await screen.findByText(/1 applied/)).toBeInTheDocument()
  })

  it('keeps a lost answer UNKNOWN, locks the rows and retries with the SAME keys', async () => {
    await readyBulk()
    actions.bulkCommit.mockResolvedValueOnce({
      ok: false,
      kind: 'outcome-unknown',
      error: 'We could not confirm whether this was saved.',
      retrySameKey: true,
    })
    fireEvent.click(screen.getByRole('button', { name: 'Commit' }))
    expect(await screen.findByText('The answer was lost')).toBeInTheDocument()
    const retry = screen.getByRole('button', { name: 'Retry the same attempt' })
    expect(screen.getByLabelText(/Item id/)).toBeDisabled() // the attempt cannot be edited out from under its keys
    expect(screen.queryByText(/applied/i)).not.toBeInTheDocument()

    actions.bulkCommit.mockResolvedValueOnce({
      ok: true,
      results: [{ rowKey: 'row-1', itemId: ITEM, status: 'SUCCESS_REPLAYED', revision: 2 }],
    })
    fireEvent.click(retry)
    await waitFor(() => expect(actions.bulkCommit).toHaveBeenCalledTimes(2))
    expect(actions.bulkCommit.mock.calls[1]![1]).toEqual(actions.bulkCommit.mock.calls[0]![1])
    expect(await screen.findByText(/1 applied \(1 already applied earlier\)/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Retry the same attempt' })).not.toBeInTheDocument()
  })

  it('groups per-row results as applied, failed and unknown, and the counts add up', async () => {
    actions.bulkPreview.mockResolvedValue(previewOf())
    render(<BulkSection matterId="m1" />)
    fireEvent.click(screen.getByRole('button', { name: 'Add row' }))
    fireEvent.click(screen.getByRole('button', { name: 'Add row' }))
    fireEvent.click(screen.getByRole('button', { name: 'Add row' }))
    for (const el of screen.getAllByLabelText(/Item id/))
      fireEvent.change(el, { target: { value: ITEM } })
    fireEvent.click(screen.getByRole('button', { name: 'Preview' }))
    await screen.findByRole('list', { name: 'Preview' })
    actions.bulkCommit.mockResolvedValue({
      ok: true,
      results: [
        { rowKey: 'row-1', status: 'SUCCESS' },
        { rowKey: 'row-2', status: 'FAILURE', code: 'stale' },
        { rowKey: 'row-3', status: 'UNKNOWN' },
      ],
    })
    fireEvent.click(screen.getByRole('button', { name: 'Commit' }))
    expect(
      await screen.findByText(/1 applied, 1 failed, 1 unknown of 3 submitted/),
    ).toBeInTheDocument()
    expect(
      within(screen.getByRole('region', { name: 'Failed rows' })).getByText(
        /changed since you read it/,
      ),
    ).toBeInTheDocument()
    expect(
      within(screen.getByRole('region', { name: 'Unknown rows' })).getByText(
        /attempt identity kept/,
      ),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Retry the same attempt' })).toBeEnabled()
    // discarding is an explicit choice and unlocks editing
    fireEvent.click(screen.getByRole('button', { name: 'Discard this attempt' }))
    expect(screen.getAllByLabelText(/Item id/)[0]).toBeEnabled()
  })

  it('says plainly when access was withdrawn and keeps the draft', async () => {
    await readyBulk()
    actions.bulkCommit.mockResolvedValue({
      ok: false,
      kind: 'forbidden',
      error: 'You do not have permission to do this.',
    })
    fireEvent.click(screen.getByRole('button', { name: 'Commit' }))
    expect(await screen.findByText('Commit failed')).toBeInTheDocument()
    expect(screen.getByText('You do not have permission to do this.')).toBeInTheDocument()
    expect(screen.getByLabelText(/Item id/)).toHaveValue(ITEM)
  })

  it('shows a failed preview instead of silently doing nothing', async () => {
    actions.bulkPreview.mockResolvedValue({
      ok: false,
      kind: 'not-found',
      error: 'This item no longer exists or you no longer have access to it.',
    })
    render(<BulkSection matterId="m1" />)
    fireEvent.click(screen.getByRole('button', { name: 'Add row' }))
    fireEvent.click(screen.getByRole('button', { name: 'Preview' }))
    expect(await screen.findByText('Preview failed')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Commit' })).toBeDisabled()
  })
})

const importPreview = (
  groups: { id: number; rowIdx: number[]; valid: boolean }[],
  rows: object[],
) => ({
  ok: true,
  preview: { sourceName: 'counsel.csv', asOf: '2026-10-27T09:00:00Z', groups, rows },
})
const planRow = (rowKey: string, errors: string[] = []) => ({
  rowKey,
  kind: 'ACTION',
  title: `Title ${rowKey}`,
  dependencies: [],
  errors,
})
const chooseFile = (name = 'counsel.csv') => {
  const input = screen.getByLabelText('File')
  fireEvent.change(input, {
    target: { files: [new File(['rowkey,kind,title\nR1,ACTION,x'], name, { type: 'text/csv' })] },
  })
}

describe('ImportSection', () => {
  it('explains a rejected connected group while an independent group stays valid', async () => {
    actions.importPreview.mockResolvedValue(
      importPreview(
        [
          { id: 1, rowIdx: [0, 1], valid: false },
          { id: 2, rowIdx: [2], valid: true },
        ],
        [
          planRow('B1'),
          planRow('B2', ['dependency NOPE is neither a row key of this file nor an existing item']),
          planRow('C1'),
        ],
      ),
    )
    render(<ImportSection matterId="m1" />)
    chooseFile()
    fireEvent.click(screen.getByRole('button', { name: 'Preview' }))
    const groups = await screen.findByRole('list', { name: 'Groups' })
    expect(within(groups).getByText('Rejected whole')).toBeInTheDocument()
    expect(within(groups).getByText('Valid group')).toBeInTheDocument()
    expect(within(groups).getByText(/connected by dependencies/)).toBeInTheDocument()
    expect(within(groups).getByText(/NOPE/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Commit valid groups' })).toBeEnabled()
  })

  it('offers no commit when no group is valid', async () => {
    actions.importPreview.mockResolvedValue(
      importPreview(
        [{ id: 1, rowIdx: [0], valid: false }],
        [planRow('X', ['title must not be blank'])],
      ),
    )
    render(<ImportSection matterId="m1" />)
    chooseFile()
    fireEvent.click(screen.getByRole('button', { name: 'Preview' }))
    await screen.findByRole('list', { name: 'Groups' })
    expect(screen.getByRole('button', { name: 'Commit valid groups' })).toBeDisabled()
  })

  it('freezes one key per previewed row and resends them unchanged after a lost answer', async () => {
    actions.importPreview.mockResolvedValue(
      importPreview([{ id: 1, rowIdx: [0, 1], valid: true }], [planRow('R1'), planRow('A1')]),
    )
    render(<ImportSection matterId="m1" />)
    chooseFile()
    fireEvent.click(screen.getByRole('button', { name: 'Preview' }))
    await screen.findByRole('list', { name: 'Groups' })

    actions.importCommit.mockResolvedValueOnce({
      ok: false,
      kind: 'outcome-unknown',
      error: 'lost',
      retrySameKey: true,
    })
    fireEvent.click(screen.getByRole('button', { name: 'Commit valid groups' }))
    expect(await screen.findByText('The answer was lost')).toBeInTheDocument()

    actions.importCommit.mockResolvedValueOnce({
      ok: true,
      results: [
        { rowKey: 'R1', status: 'SUCCESS_REPLAYED', itemId: 'i1' },
        { rowKey: 'A1', status: 'SUCCESS_REPLAYED', itemId: 'i2' },
      ],
    })
    fireEvent.click(screen.getByRole('button', { name: 'Retry the same attempt' }))
    await waitFor(() => expect(actions.importCommit).toHaveBeenCalledTimes(2))
    const [, , planA] = actions.importCommit.mock.calls[0]!
    const [, , planB] = actions.importCommit.mock.calls[1]!
    expect(planB).toEqual(planA)
    expect(Object.keys(planA.rowKeys)).toEqual(['R1', 'A1'])
    expect(Object.values(planA.rowKeys).every((k) => UUID_V7.test(k as string))).toBe(true)
    expect(await screen.findByText(/2 applied \(2 already applied earlier\)/)).toBeInTheDocument()
  })

  it('discards the preview and the attempt when another file is chosen', async () => {
    actions.importPreview.mockResolvedValue(
      importPreview([{ id: 1, rowIdx: [0], valid: true }], [planRow('R1')]),
    )
    render(<ImportSection matterId="m1" />)
    chooseFile()
    fireEvent.click(screen.getByRole('button', { name: 'Preview' }))
    await screen.findByRole('list', { name: 'Groups' })
    chooseFile('other.csv')
    expect(screen.queryByRole('list', { name: 'Groups' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Commit valid groups' })).toBeDisabled()
  })

  it('reports an unreadable file in the page, not in a browser alert', async () => {
    const alert = vi.spyOn(window, 'alert').mockImplementation(() => {})
    actions.importPreview.mockResolvedValue({
      ok: false,
      kind: 'validation',
      error: 'That file is larger than the upload limit. Nothing was stored.',
    })
    render(<ImportSection matterId="m1" />)
    chooseFile()
    fireEvent.click(screen.getByRole('button', { name: 'Preview' }))
    expect(await screen.findByText('The file could not be previewed')).toBeInTheDocument()
    expect(alert).not.toHaveBeenCalled()
  })
})

const briefResult = (over: object = {}) => ({
  matterId: 'm1',
  t1: '2026-10-01T00:00:00Z',
  t2: '2026-10-27T00:00:00Z',
  asOf: '2026-10-27T09:00:00Z',
  changes: [],
  outstanding: [],
  ...over,
})
const generate = async (t1 = '2026-10-01T00:00:00Z', t2 = '2026-10-27T00:00:00Z') => {
  fireEvent.change(screen.getByLabelText(/^t1 \(/), { target: { value: t1 } })
  fireEvent.change(screen.getByLabelText(/^t2 \(/), { target: { value: t2 } })
  fireEvent.click(screen.getByRole('button', { name: 'Generate brief' }))
}

describe('BriefSection', () => {
  it('states explicitly that nothing changed, and still lists what is outstanding', async () => {
    actions.brief.mockResolvedValue({
      ok: true,
      brief: briefResult({
        outstanding: [
          {
            itemId: 'a1',
            kind: 'ACTION',
            title: 'File the form',
            execution: 'IN_PROGRESS',
            dependency: 'BLOCKED',
            proofExpired: false,
          },
        ],
      }),
    })
    render(<BriefSection matterId="m1" />)
    await generate()
    expect(await screen.findByText('No changes were recorded in this window.')).toBeInTheDocument()
    expect(screen.getByText(/File the form/)).toBeInTheDocument()
    expect(screen.getByText(/dependency BLOCKED/)).toBeInTheDocument()
  })

  it('says so when nothing is outstanding and marks late-recorded changes and expired proof', async () => {
    actions.brief.mockResolvedValue({
      ok: true,
      brief: briefResult({
        changes: [
          {
            seq: 4,
            id: 'e1',
            type: 'work.execution_changed',
            targetKind: 'ACTION',
            targetId: 'a1',
            recordedAt: '2026-10-20T00:00:00Z',
            effectiveAt: '2026-09-01T00:00:00Z',
            lateRecorded: true,
          },
        ],
        outstanding: [
          {
            itemId: 'r1',
            kind: 'REQUIREMENT',
            title: 'Approval',
            verification: 'VERIFIED',
            proofExpired: true,
          },
        ],
      }),
    })
    render(<BriefSection matterId="m1" />)
    await generate()
    expect(await screen.findByText('Recorded late')).toBeInTheDocument()
    expect(screen.getByText('Proof expired by t2')).toBeInTheDocument()
  })

  it('produces no report for an invalid window and clears the previous one', async () => {
    actions.brief.mockResolvedValueOnce({ ok: true, brief: briefResult() })
    render(<BriefSection matterId="m1" />)
    await generate()
    await screen.findByText('No changes were recorded in this window.')
    actions.brief.mockResolvedValueOnce({
      ok: false,
      kind: 'validation',
      error: 'Please fix the highlighted fields.',
      fieldErrors: { t2: ['The end of the window cannot be before its start.'] },
    })
    await generate('2026-10-27T00:00:00Z', '2026-10-01T00:00:00Z')
    expect(await screen.findByText('No brief was produced')).toBeInTheDocument()
    expect(
      screen.getByText('The end of the window cannot be before its start.'),
    ).toBeInTheDocument()
    expect(screen.queryByText('No changes were recorded in this window.')).not.toBeInTheDocument()
  })

  it('tells the user when history is too incomplete to build a correct brief', async () => {
    actions.brief.mockResolvedValue({
      ok: false,
      kind: 'error',
      error:
        'A correct brief cannot be produced: the history behind this window is incomplete. No report was created.',
    })
    render(<BriefSection matterId="m1" />)
    await generate()
    expect(await screen.findByText(/history behind this window is incomplete/)).toBeInTheDocument()
  })
})
