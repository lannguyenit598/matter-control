import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { UiLocaleContext } from '@/hooks/use-locale'
import { UUID_V7 } from '@/lib/mc/idempotency'

import { MailPanel } from './mail-panel'
import type { MailItem } from '../schemas'

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh }) }))
vi.mock('../actions', () => ({ uploadEmlAction: upload }))
const { upload, refresh } = vi.hoisted(() => ({ upload: vi.fn(), refresh: vi.fn() }))

const item: MailItem = {
  id: '01900000-0000-7000-8000-000000000001',
  documentId: '01900000-0000-7000-8000-000000000002',
  versionId: '01900000-0000-7000-8000-000000000003',
  direction: 'INBOUND',
  sender: 'counterparty@example.com',
  recipients: ['a@example.com', 'b@example.com', 'c@example.com', 'd@example.com', 'e@example.com'],
  subject: 'Re: Share purchase agreement',
  sentAt: '2026-11-10T09:30:00Z',
  excerpt: 'Please find the signed copy attached for your records.',
  createdAt: '2026-11-10T09:31:00Z',
}

afterEach(() => {
  vi.clearAllMocks()
})

describe('MailPanel', () => {
  it('lists captured email with sender, truncated recipients, direction and a link to the document', () => {
    render(<MailPanel matterId="m1" items={[item]} />)
    const link = screen.getByRole('link', { name: item.subject })
    expect(link).toHaveAttribute('href', '/matters/m1/documents/' + item.documentId)
    expect(screen.getByText(/counterparty@example.com/)).toBeInTheDocument()
    expect(screen.getByText(/a@example.com, b@example.com, c@example.com \+2/)).toBeInTheDocument()
    expect(screen.getByText('Inbound')).toBeInTheDocument()
    expect(screen.getByText(item.excerpt)).toBeInTheDocument()
  })

  it('shows the empty state when nothing has been captured', () => {
    render(<MailPanel matterId="m1" items={[]} />)
    expect(screen.getByText('No captured email yet')).toBeInTheDocument()
  })

  it('rejects a non-.eml file on the client before any request', () => {
    render(<MailPanel matterId="m1" items={[item]} />)
    fireEvent.change(screen.getByLabelText(/Email file/), {
      target: { files: [new File(['pdf'], 'term.pdf', { type: 'application/pdf' })] },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Upload' }))
    expect(screen.getByText('Only .eml files are accepted.')).toBeInTheDocument()
    expect(upload).not.toHaveBeenCalled()
  })

  it('uploads the .eml with its FormData and a fresh UUIDv7 idempotency key, then refreshes', async () => {
    upload.mockResolvedValue({
      ok: true,
      documentId: item.documentId,
      versionId: item.versionId,
      mailId: item.id,
      replayed: false,
    })
    render(<MailPanel matterId="m1" items={[item]} />)
    fireEvent.change(screen.getByLabelText(/Email file/), {
      target: { files: [new File(['eml'], 'message.eml', { type: 'message/rfc822' })] },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Upload' }))
    await act(async () => {})
    expect(upload).toHaveBeenCalledTimes(1)
    const [matterId, form, key] = upload.mock.calls[0]
    expect(matterId).toBe('m1')
    expect(form).toBeInstanceOf(FormData)
    expect(form.get('file')).toBeInstanceOf(File)
    expect((form.get('file') as File).name).toBe('message.eml')
    expect(form.get('direction')).toBe('INBOUND')
    expect(key).toMatch(UUID_V7)
    expect(refresh).toHaveBeenCalledTimes(1)
  })

  it('keeps the same key for a retry after an unknown outcome and says nothing was assumed', async () => {
    upload
      .mockResolvedValueOnce({
        ok: false,
        kind: 'outcome-unknown',
        error: 'We could not confirm whether this was saved.',
        retrySameKey: true,
      })
      .mockResolvedValueOnce({ ok: true, documentId: item.documentId, mailId: item.id })
    render(<MailPanel matterId="m1" items={[item]} />)
    const file = new File(['eml'], 'message.eml', { type: 'message/rfc822' })
    fireEvent.change(screen.getByLabelText(/Email file/), { target: { files: [file] } })
    fireEvent.click(screen.getByRole('button', { name: 'Upload' }))
    await act(async () => {})
    expect(screen.getByText('Outcome not confirmed')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Upload' }))
    await act(async () => {})
    const firstKey = upload.mock.calls[0][2]
    expect(upload.mock.calls[1][2]).toBe(firstKey)
  })

  it('renders Vietnamese labels under the vi locale', () => {
    render(
      <UiLocaleContext.Provider value="vi">
        <MailPanel matterId="m1" items={[item]} />
      </UiLocaleContext.Provider>,
    )
    expect(screen.getByText('Thư đến')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Tải lên' })).toBeInTheDocument()
  })
})
