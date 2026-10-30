import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const router = vi.hoisted(() => ({ refresh: vi.fn(), push: vi.fn() }))
vi.mock('next/navigation', () => ({ useRouter: () => router }))

import { DraftScopeProvider } from '@/components/organisms/draft-scope'
import { ReadFailure } from '@/components/organisms/read-failure'

import { UploadVersionForm } from './document-forms'

const fetchMock = vi.fn()

beforeEach(() => {
  window.sessionStorage.clear()
  router.refresh.mockClear()
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
})

const Form = ({ ns = 'sess-a' }: { ns?: string }) => (
  <DraftScopeProvider namespace={ns}>
    <UploadVersionForm matterId="m1" documentId="d1" />
  </DraftScopeProvider>
)

const pdf = (content: string, name = 'agreement.pdf') =>
  new File([content], name, { type: 'application/pdf' })

function choose(container: HTMLElement, file: File) {
  const input = container.querySelector('input[type="file"]') as HTMLInputElement
  Object.defineProperty(input, 'files', { value: [file], configurable: true })
  fireEvent.change(input)
}

const keyOf = (call: number) =>
  new Headers((fetchMock.mock.calls[call]![1] as RequestInit).headers).get('Idempotency-Key')

const lostAnswer = () => fetchMock.mockRejectedValueOnce(new TypeError('network'))
const stored = () =>
  fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ ok: true }), { status: 200 }))

async function firstAttempt() {
  lostAnswer()
  const first = render(<Form />)
  choose(first.container, pdf('contract text'))
  fireEvent.click(await screen.findByRole('button', { name: 'Upload version' }))
  await screen.findByRole('button', { name: 'Retry upload' })
  // The hash of the file is computed after the failure and stored with the key.
  await waitFor(() => expect(window.sessionStorage.length).toBeGreaterThan(0))
  return first
}

describe('an upload whose answer was lost survives a reload', () => {
  it('retries with the original key when the same file is chosen again', async () => {
    const first = await firstAttempt()
    first.unmount() // reload: the File and the React state are gone

    stored()
    const second = render(<Form />)
    expect(screen.getByText(/earlier upload of "agreement.pdf"/i)).toBeInTheDocument()
    choose(second.container, pdf('contract text')) // same name, size and bytes
    fireEvent.click(await screen.findByRole('button', { name: 'Retry upload' }))
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))
    expect(keyOf(1)).toBe(keyOf(0))
  })

  it('a different file is a different intent and gets a new key', async () => {
    const first = await firstAttempt()
    first.unmount()

    stored()
    const second = render(<Form />)
    choose(second.container, pdf('another text, other bytes'))
    const button = await screen.findByRole('button', { name: 'Upload version' })
    // The control stays disabled while the chosen file is being fingerprinted; clicking it
    // during that check would be swallowed, so wait until it accepts input again.
    await waitFor(() => expect(button).not.toBeDisabled())
    fireEvent.click(button)
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))
    expect(keyOf(1)).not.toBe(keyOf(0))
  })

  it('a stored version clears it', async () => {
    const first = await firstAttempt()
    first.unmount()
    stored()
    const second = render(<Form />)
    choose(second.container, pdf('contract text'))
    fireEvent.click(await screen.findByRole('button', { name: 'Retry upload' }))
    await waitFor(() => expect(router.refresh).toHaveBeenCalled())
    second.unmount()

    render(<Form />)
    expect(screen.queryByText(/earlier upload of/i)).toBeNull()
    expect(window.sessionStorage.length).toBe(0)
  })

  it('another session never sees it, and a denied screen purges it', async () => {
    const first = await firstAttempt()
    first.unmount()

    const other = render(<Form ns="sess-b" />)
    expect(screen.queryByText(/earlier upload of/i)).toBeNull()
    other.unmount()
    render(<ReadFailure kind="forbidden" />).unmount()
    render(<Form />)
    expect(screen.queryByText(/earlier upload of/i)).toBeNull()
  })
})
