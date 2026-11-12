import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { UiLocaleContext } from '@/hooks/use-locale'
import { UUID_V7 } from '@/lib/mc/idempotency'
import { MAX_EML_BYTES, type MailItem } from '../schemas'
import { MailPanel } from './mail-panel'

const { refresh } = vi.hoisted(() => ({ refresh: vi.fn() }))
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh }) }))
const fetchMock = vi.fn()
const item: MailItem = {
  id: 'mail1',
  documentId: 'doc1',
  versionId: 'version1',
  direction: 'INBOUND',
  sender: 'synthetic@example.invalid',
  recipients: [],
  subject: 'Dated synthetic mail',
  sentAt: '2026-11-11T00:00:00Z',
  excerpt: '',
  createdAt: '2026-11-12T00:00:00Z',
}
const success = () =>
  new Response(
    JSON.stringify({
      ok: true,
      documentId: 'doc1',
      versionId: 'version1',
      mailId: 'mail1',
      replayed: false,
    }),
    { status: 201 },
  )
function pick(file: File) {
  fireEvent.change(screen.getByLabelText(/Email file/), { target: { files: [file] } })
}
async function submit() {
  fireEvent.click(screen.getByRole('button', { name: 'Upload' }))
  await act(async () => {})
}
const key = (n: number) => new Headers(fetchMock.mock.calls[n]![1].headers).get('Idempotency-Key')
beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
  fetchMock.mockReset()
  refresh.mockClear()
})
afterEach(() => vi.unstubAllGlobals())

it('renders an explicit unavailable sent date without hiding dated mail', () => {
  render(
    <MailPanel
      matterId="m1"
      items={[item, { ...item, id: 'mail2', subject: 'Undated synthetic mail', sentAt: null }]}
    />,
  )
  expect(screen.getByRole('link', { name: item.subject })).toBeInTheDocument()
  expect(
    within(screen.getByRole('link', { name: 'Undated synthetic mail' }).closest('li')!).getByText(
      'Sent date unavailable',
    ),
  ).toBeInTheDocument()
})
it('renders Vietnamese missing-date copy', () => {
  render(
    <UiLocaleContext.Provider value="vi">
      <MailPanel matterId="m1" items={[{ ...item, sentAt: null }]} />
    </UiLocaleContext.Provider>,
  )
  expect(screen.getByText('Không có ngày gửi')).toBeInTheDocument()
})
it('uploads directly to the BFF with the selected file, then refreshes', async () => {
  fetchMock.mockResolvedValue(success())
  render(<MailPanel matterId="m1" items={[]} />)
  const file = new File(['synthetic'], 'message.eml')
  pick(file)
  await submit()
  expect(fetchMock).toHaveBeenCalledTimes(1)
  const [url, req] = fetchMock.mock.calls[0]!
  expect(url).toBe('/api/matters/m1/mail-intake')
  expect(req.body.get('file')).toBe(file)
  expect(req.body.get('direction')).toBe('INBOUND')
  expect(new Headers(req.headers).has('Content-Type')).toBe(false)
  expect(key(0)).toMatch(UUID_V7)
  expect(refresh).toHaveBeenCalledTimes(1)
})
it.each([2 * 1024 * 1024, MAX_EML_BYTES])(
  'accepts a file of %i bytes without a Server Action',
  async (size) => {
    fetchMock.mockResolvedValue(success())
    render(<MailPanel matterId="m1" items={[]} />)
    pick(new File([new Uint8Array(size)], 'large.eml'))
    await submit()
    expect(fetchMock).toHaveBeenCalledTimes(1)
  },
)
it('refuses extension and max+1 before sending any request', async () => {
  render(<MailPanel matterId="m1" items={[]} />)
  pick(new File(['x'], 'message.pdf'))
  await submit()
  expect(screen.getByText('Only .eml files are accepted.')).toBeInTheDocument()
  pick(new File([new Uint8Array(MAX_EML_BYTES + 1)], 'too-large.eml'))
  await submit()
  expect(screen.getByText('That file is larger than the 25 MiB limit.')).toBeInTheDocument()
  expect(fetchMock).not.toHaveBeenCalled()
})
it('retries unknown outcomes with the same key and creates a new key for a new selection', async () => {
  fetchMock
    .mockRejectedValueOnce(new TypeError('synthetic transport loss'))
    .mockResolvedValueOnce(success())
    .mockResolvedValueOnce(success())
  render(<MailPanel matterId="m1" items={[]} />)
  pick(new File(['x'], 'message.eml'))
  await submit()
  expect(screen.getByText('Outcome not confirmed')).toBeInTheDocument()
  await submit()
  expect(key(1)).toBe(key(0))
  pick(new File(['y'], 'another.eml'))
  await submit()
  expect(key(2)).not.toBe(key(0))
})
it('keeps the selected intent locked while the request is pending', async () => {
  let resolve!: (value: Response) => void
  fetchMock.mockReturnValue(
    new Promise<Response>((r) => {
      resolve = r
    }),
  )
  render(<MailPanel matterId="m1" items={[]} />)
  pick(new File(['x'], 'message.eml'))
  await submit()
  expect(screen.getByLabelText(/Email file/)).toBeDisabled()
  await act(async () => {
    resolve(success())
  })
  expect(screen.getByLabelText(/Email file/)).not.toBeDisabled()
})
it.each([401, 403])('displays structured refusal %i and does not refresh', async (status) => {
  fetchMock.mockResolvedValue(
    new Response(
      JSON.stringify({
        ok: false,
        kind: status === 401 ? 'unauthenticated' : 'forbidden',
        error: 'Synthetic refusal',
      }),
      { status },
    ),
  )
  render(<MailPanel matterId="m1" items={[]} />)
  pick(new File(['x'], 'message.eml'))
  await submit()
  expect(screen.getByText('Synthetic refusal')).toBeInTheDocument()
  expect(refresh).not.toHaveBeenCalled()
})

it.each([401, 403])(
  'retains the original request key after an unknown outcome followed by HTTP %i',
  async (status) => {
    fetchMock
      .mockRejectedValueOnce(new TypeError('synthetic lost response'))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            ok: false,
            kind: status === 401 ? 'unauthenticated' : 'forbidden',
            error: 'Synthetic temporary refusal',
          }),
          { status },
        ),
      )
      .mockResolvedValueOnce(success())
    render(<MailPanel matterId="m1" items={[]} />)
    const file = new File(['same synthetic bytes'], 'message.eml')
    pick(file)
    await submit()
    await submit()
    await submit()
    expect(fetchMock).toHaveBeenCalledTimes(3)
    expect(key(1)).toBe(key(0))
    expect(key(2)).toBe(key(0))
    for (const [, request] of fetchMock.mock.calls) expect(request.body.get('file')).toBe(file)
  },
)
