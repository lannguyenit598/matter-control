import { fireEvent, render, screen } from '@testing-library/react'
import { useContext, useEffect } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { UnresolvedReporter } from '@/components/organisms/intent-form'

vi.mock('../actions', () => ({
  recoverTransfersAction: async () => ({ ok: true, attempts: [] }),
  acknowledgeTransferAction: async () => {},
}))
// The sections are tested on their own; here only how the page hosts them matters.
vi.mock('./import-section', () => ({
  ImportSection: function Import() {
    const report = useContext(UnresolvedReporter)
    useEffect(() => report?.(true), [report])
    return (
      <section aria-label="import-task">
        <input aria-label="Import draft" />
      </section>
    )
  },
}))
vi.mock('./bulk-section', () => ({
  BulkSection: () => (
    <section aria-label="bulk-task">
      <input aria-label="Bulk draft" />
    </section>
  ),
}))
vi.mock('./brief-section', () => ({
  BriefSection: () => <section aria-label="brief-task">Draft brief</section>,
}))

import { DataTransferPanel } from './data-transfer-panel'

const panel = () => render(<DataTransferPanel matterId="m1" items={[]} members={[]} />)

describe('DataTransferPanel', () => {
  it('opens as a chooser: no editor, preview or brief is on screen yet', async () => {
    panel()
    for (const name of [/^Import file/, /^Bulk update/, /^Export/, /^Draft status brief/])
      expect(screen.getByRole('button', { name })).toHaveAttribute('aria-pressed', 'false')
    await screen.findByLabelText('Import draft', { selector: 'input' })
    expect(screen.getByLabelText('Import draft')).not.toBeVisible()
    expect(screen.getByLabelText('Bulk draft')).not.toBeVisible()
    expect(screen.getByText('Draft brief')).not.toBeVisible()
    expect(screen.getByRole('link', { name: 'Download CSV', hidden: true })).not.toBeVisible()
  })

  it('shows only the chosen task and keeps the other task, and what was typed in it, mounted', async () => {
    panel()
    const bulk = await screen.findByLabelText('Bulk draft')
    fireEvent.click(screen.getByRole('button', { name: /^Bulk update/ }))
    expect(bulk).toBeVisible()
    fireEvent.change(bulk, { target: { value: 'kept' } })
    fireEvent.click(screen.getByRole('button', { name: /^Import file/ }))
    expect(bulk).not.toBeVisible()
    expect(screen.getByLabelText('Import draft')).toBeVisible()
    fireEvent.click(screen.getByRole('button', { name: /^Bulk update/ }))
    expect(screen.getByLabelText('Bulk draft')).toBe(bulk)
    expect(bulk).toHaveValue('kept')
  })

  it('says a task still needs attention while another one is showing', async () => {
    panel()
    await screen.findByLabelText('Import draft')
    fireEvent.click(screen.getByRole('button', { name: /^Export/ }))
    expect(screen.getByRole('button', { name: /^Import file.*Not finished/ })).toBeVisible()
    expect(screen.getByRole('link', { name: 'Download XLSX' })).toHaveAttribute(
      'href',
      '/api/matters/m1/export?format=xlsx',
    )
  })

  it('labels the brief as a draft', () => {
    panel()
    expect(screen.getByRole('button', { name: /^Draft status brief/ })).toBeVisible()
  })
})
