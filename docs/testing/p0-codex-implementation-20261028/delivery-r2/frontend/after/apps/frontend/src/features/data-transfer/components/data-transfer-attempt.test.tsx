import { File as NodeFile } from 'node:buffer'

import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const request = vi.hoisted(() => vi.fn())
vi.mock('@/lib/mc/client', () => ({ mcRequest: request, pathId: (id: string) => id }))
vi.mock('@/lib/auth', () => ({ requireSession: async () => ({ userId: 'synthetic-user' }) }))
vi.mock('next/cache', () => ({ revalidatePath: () => {} }))

import { McError } from '@/lib/mc/errors'

import { BulkSection } from './bulk-section'
import { ImportSection } from './import-section'

const bulkPreview = {
  previewId: 'synthetic-preview',
  asOf: '2026-10-28T00:00:00Z',
  rows: [{ rowKey: 'row-1', itemId: 'item-1', title: 'Before', revision: 1, valid: true }],
}
const importPreview = {
  sourceName: 'synthetic.csv',
  asOf: '2026-10-28T00:00:00Z',
  rows: [{ rowKey: 'R1', kind: 'ACTION', title: 'Synthetic', dependencies: [], errors: [] }],
  groups: [{ id: 1, rowIdx: [0], valid: true }],
}
const result = (rowKey: string, status = 'SUCCESS') => ({ rowKey, status })

beforeEach(() => request.mockReset())

async function readyBulk() {
  request.mockResolvedValueOnce({ data: bulkPreview })
  render(<BulkSection matterId="matter-1" />)
  fireEvent.click(screen.getByRole('button', { name: 'Add row' }))
  fireEvent.change(screen.getByLabelText(/Item id/), { target: { value: 'item-1' } })
  fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'set' } })
  fireEvent.change(screen.getByLabelText('Title new value'), { target: { value: 'After' } })
  fireEvent.click(screen.getByRole('button', { name: 'Preview' }))
  await screen.findByRole('list', { name: 'Preview' })
}

async function readyImport() {
  request.mockResolvedValueOnce({ data: importPreview })
  render(<ImportSection matterId="matter-1" />)
  fireEvent.change(screen.getByLabelText('File'), {
    target: { files: [new NodeFile(['rowkey,kind,title\nR1,ACTION,Synthetic'], 'synthetic.csv')] },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Preview' }))
  await screen.findByRole('list', { name: 'Groups' })
}

describe('bulk panel → actions → repository attempt', () => {
  it('invalidates approval permanently on edit, add or remove, even if the payload is restored', async () => {
    await readyBulk()
    fireEvent.change(screen.getByLabelText('Title new value'), { target: { value: 'Changed' } })
    fireEvent.change(screen.getByLabelText('Title new value'), { target: { value: 'After' } })
    expect(screen.getByRole('button', { name: 'Commit' })).toBeDisabled()
    request.mockResolvedValueOnce({ data: bulkPreview })
    fireEvent.click(screen.getByRole('button', { name: 'Preview' }))
    await waitFor(() => expect(screen.getByRole('button', { name: 'Commit' })).toBeEnabled())
    fireEvent.click(screen.getByRole('button', { name: 'Add row' }))
    fireEvent.click(screen.getByRole('button', { name: 'Remove row 2' }))
    expect(screen.getByRole('button', { name: 'Commit' })).toBeDisabled()
  })

  it('locks pending edits and duplicate submission, then reconciles identical payload and keys', async () => {
    await readyBulk()
    let resolve!: (value: { data: object[] }) => void
    request.mockImplementationOnce(
      () =>
        new Promise((done) => {
          resolve = done
        }),
    )
    fireEvent.click(screen.getByRole('button', { name: 'Commit' }))
    fireEvent.click(screen.getByRole('button', { name: 'Commit' }))
    expect(screen.getByLabelText('Title new value')).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Add row' })).toBeDisabled()
    await waitFor(() => expect(request).toHaveBeenCalledTimes(2))
    const previewRows = request.mock.calls[0]![1].body.rows
    const frozen = request.mock.calls[1]![1].body
    expect(frozen.rows).toEqual(
      previewRows.map((row: object) => ({ ...row, idempotencyKey: expect.any(String) })),
    )
    await act(async () => resolve({ data: [result('row-1', 'UNKNOWN')] }))
    expect(
      await screen.findByText(/0 applied, 0 failed, 1 unknown of 1 submitted/),
    ).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Discard this attempt' })).not.toBeInTheDocument()
    request.mockResolvedValueOnce({ data: [result('row-1', 'SUCCESS_REPLAYED')] })
    fireEvent.click(screen.getByRole('button', { name: 'Retry the same attempt' }))
    await screen.findByText(/1 applied \(1 already applied earlier\)/)
    expect(request.mock.calls[2]![1].body).toEqual(frozen)
    expect(screen.getByRole('button', { name: 'Commit' })).toBeDisabled()
  })

  it.each([
    { receipts: [] },
    { receipts: [result('row-1'), result('row-1')] },
    { receipts: [result('unexpected')] },
    { receipts: [result('row-1'), result('unexpected')] },
  ])('keeps missing or ambiguous row receipts unknown: %j', async ({ receipts }) => {
    await readyBulk()
    request.mockResolvedValueOnce({ data: receipts })
    fireEvent.click(screen.getByRole('button', { name: 'Commit' }))
    expect(
      await screen.findByText(/0 applied, 0 failed, 1 unknown of 1 submitted/),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Retry the same attempt' })).toBeEnabled()
  })
})

describe('import panel → actions → repository attempt', () => {
  it('locks file replacement while pending, preserves run/file/row keys on UNKNOWN and consumes settled preview', async () => {
    await readyImport()
    let reject!: (reason: Error) => void
    request.mockImplementationOnce(
      () =>
        new Promise((_done, fail) => {
          reject = fail
        }),
    )
    fireEvent.click(screen.getByRole('button', { name: 'Commit valid groups' }))
    await waitFor(() => expect(request).toHaveBeenCalledTimes(2))
    expect(screen.getByLabelText('File')).toBeDisabled()
    const first = request.mock.calls[1]![1].raw.body as FormData
    await act(async () => reject(new McError('outcome-unknown', 503, { receipted: true })))
    await screen.findByText('The answer was lost')
    expect(screen.queryByRole('button', { name: 'Discard this attempt' })).not.toBeInTheDocument()
    request.mockResolvedValueOnce({ data: [result('R1', 'SUCCESS_REPLAYED')] })
    fireEvent.click(screen.getByRole('button', { name: 'Retry the same attempt' }))
    await screen.findByText(/1 applied \(1 already applied earlier\)/)
    const retry = request.mock.calls[2]![1].raw.body as FormData
    expect(retry.get('plan')).toBe(first.get('plan'))
    expect(retry.get('sourceName')).toBe(first.get('sourceName'))
    expect(retry.get('file')).toEqual(first.get('file'))
    expect(screen.getByRole('button', { name: 'Commit valid groups' })).toBeDisabled()
    request.mockResolvedValueOnce({ data: importPreview })
    fireEvent.click(screen.getByRole('button', { name: 'Preview' }))
    await screen.findByRole('list', { name: 'Groups' })
    request.mockResolvedValueOnce({ data: [result('R1')] })
    fireEvent.click(screen.getByRole('button', { name: 'Commit valid groups' }))
    await screen.findByText(/1 applied, 0 failed, 0 unknown/)
    expect(request.mock.calls[4]![1].raw.body.get('plan')).not.toBe(first.get('plan'))
  })

  it('keeps a mixed expected and unexpected receipt response unresolved', async () => {
    await readyImport()
    request.mockResolvedValueOnce({ data: [result('R1'), result('unexpected')] })
    fireEvent.click(screen.getByRole('button', { name: 'Commit valid groups' }))
    await screen.findByText(/0 applied, 0 failed, 1 unknown of 1 submitted/)
    expect(screen.getByLabelText('File')).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Retry the same attempt' })).toBeEnabled()
    expect(screen.queryByRole('button', { name: 'Commit valid groups' })).not.toBeInTheDocument()
  })

  it('accounts for all submitted rows when an import receipt is missing', async () => {
    await readyImport()
    request.mockResolvedValueOnce({ data: [] })
    fireEvent.click(screen.getByRole('button', { name: 'Commit valid groups' }))
    await screen.findByText(/0 applied, 0 failed, 1 unknown of 1 submitted/)
    expect(
      within(screen.getByRole('region', { name: 'Unknown rows' })).getByText('R1'),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('File')).toBeDisabled()
  })
})
