import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const router = vi.hoisted(() => ({ refresh: vi.fn() }))
vi.mock('next/navigation', () => ({ useRouter: () => router }))
vi.mock('../actions', () => ({
  promoteTermLineAction: vi.fn(),
  reconcileTermSheetImportAction: vi.fn(),
}))

import { DraftScopeProvider } from '@/components/organisms/draft-scope'

import { promoteTermLineAction, reconcileTermSheetImportAction } from '../actions'
import type { TermSheetLine } from '../schemas'
import { TermSheetPanel } from './term-sheet-panel'

const MATTER = '01900000-0000-7000-8000-0000000000aa'
const VERSION = '01900000-0000-7000-8000-0000000000bb'

// fetch is the import mutation (BFF route); the reconcile action is the receipt read.
const fetchMock = vi.fn()
const reconcile = vi.mocked(reconcileTermSheetImportAction)

beforeEach(() => {
  window.sessionStorage.clear()
  router.refresh.mockClear()
  fetchMock.mockReset()
  reconcile.mockReset()
  vi.stubGlobal('fetch', fetchMock)
})

const Panel = ({ revision = 7 }: { revision?: number }) => (
  <DraftScopeProvider namespace="sess-a">
    <TermSheetPanel matterId={MATTER} matterRevision={revision} canEdit lines={[]} />
  </DraftScopeProvider>
)

const csv = (content: string) => new File([content], 'terms.csv', { type: 'text/csv' })

// user-event fills the input's real FileList, which FormData reads (a patched `files` is ignored).
async function submit(container: HTMLElement, file: File) {
  await userEvent.upload(container.querySelector('input[type="file"]') as HTMLInputElement, file)
  fireEvent.submit(container.querySelector('form')!)
}

const sent = (call: number) => fetchMock.mock.calls[call]![1] as RequestInit
const keyOf = (call: number) => new Headers(sent(call).headers).get('Idempotency-Key')

async function lostImport() {
  fetchMock.mockRejectedValueOnce(new TypeError('network'))
  const first = render(<Panel />)
  fireEvent.change(screen.getByLabelText('Source document version id'), {
    target: { value: VERSION },
  })
  await submit(first.container, csv('row_key,field,value_text,value_date\nn1,NOTE,x,'))
  await screen.findByRole('button', { name: 'Confirm pending import' })
  expect(fetchMock).toHaveBeenCalledTimes(1)
  first.unmount() // reload: the File and the React state are gone
}

describe('a term-sheet import whose answer was lost', () => {
  it('retries with the original key, version and revision after a reload', async () => {
    await lostImport()
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: true, replayed: true }), { status: 200 }),
    )
    const second = render(<Panel revision={9} />)
    expect(screen.getByLabelText('Source document version id')).toHaveValue(VERSION)
    await submit(second.container, csv('row_key,field,value_text,value_date\nn1,NOTE,x,'))
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))
    expect(keyOf(1)).toBe(keyOf(0))
    const body = sent(1).body as FormData
    expect(body.get('expectedRevision')).toBe('7')
    expect(body.get('documentVersionId')).toBe(VERSION)
    expect(await screen.findByRole('button', { name: 'Import' })).toBeInTheDocument()
  })

  it('keeps the original key when the retry meets an expired session', async () => {
    await lostImport()
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({ ok: false, kind: 'unauthenticated', error: 'Sign in again.' }),
        { status: 401 },
      ),
    )
    const second = render(<Panel />)
    await submit(second.container, csv('row_key,field,value_text,value_date\nn1,NOTE,x,'))
    await screen.findByText('Sign in again.')
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(keyOf(1)).toBe(keyOf(0))
    expect(
      await screen.findByRole('button', { name: 'Confirm pending import' }),
    ).toBeInTheDocument()
    expect(window.sessionStorage.length).toBeGreaterThan(0)
  })

  it('refuses a different file while the earlier import is unconfirmed', async () => {
    await lostImport()
    const second = render(<Panel />)
    await submit(second.container, csv('row_key,field,value_text,value_date\nn1,NOTE,other,'))
    await screen.findByText(/Select the original file/)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(
      await screen.findByRole('button', { name: 'Confirm pending import' }),
    ).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /discard/i })).not.toBeInTheDocument()
  })

  it('settles from the receipt when the file is no longer available', async () => {
    await lostImport()
    const key = keyOf(0)
    reconcile.mockResolvedValueOnce({ ok: true, created: 1, replaced: 0, unchanged: 0 })
    render(<Panel />)
    fireEvent.click(screen.getByRole('button', { name: 'Check import result' }))
    expect(await screen.findByRole('button', { name: 'Import' })).toBeInTheDocument()
    expect(reconcile).toHaveBeenCalledTimes(1)
    expect(reconcile).toHaveBeenCalledWith({
      matterId: MATTER,
      idempotencyKey: key,
      documentVersionId: VERSION,
    })
    expect(fetchMock).toHaveBeenCalledTimes(1) // no second mutation
    expect(window.sessionStorage.length).toBe(0)
    expect(router.refresh).toHaveBeenCalled()
  })

  it('keeps the original key when the receipt cannot confirm the import', async () => {
    await lostImport()
    reconcile.mockResolvedValueOnce({
      ok: false,
      kind: 'outcome-unknown',
      error: 'The earlier import is not confirmed yet.',
      retrySameKey: true,
    })
    render(<Panel />)
    fireEvent.click(screen.getByRole('button', { name: 'Check import result' }))
    await screen.findByText('The earlier import is not confirmed yet.')
    expect(reconcile).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(
      await screen.findByRole('button', { name: 'Confirm pending import' }),
    ).toBeInTheDocument()
    expect(window.sessionStorage.length).toBeGreaterThan(0)
  })
})

// ---------------------------------------------------------------------------
// Bug 1 regression: 403 on retry must not delete a pending attempt's key
// ---------------------------------------------------------------------------
const promote = vi.mocked(promoteTermLineAction)

const aLine = (over: Partial<TermSheetLine> = {}): TermSheetLine => ({
  id: '01900000-0000-7000-8000-000000000001',
  documentVersionId: '01900000-0000-7000-8000-0000000000bb',
  field: 'PARTY',
  valueText: 'Công ty TNHH ABC',
  valueDate: null,
  sourceHash: 'a'.repeat(64),
  promotedRef: '',
  promotedKind: '',
  revision: 1,
  ...over,
})

const EditPanel = ({
  revision = 7,
  lines = [aLine()],
}: {
  revision?: number
  lines?: TermSheetLine[]
}) => (
  <DraftScopeProvider namespace="sess-a">
    <TermSheetPanel matterId={MATTER} matterRevision={revision} canEdit lines={lines} />
  </DraftScopeProvider>
)

const ViewerPanel = ({
  revision = 7,
  lines = [aLine()],
}: {
  revision?: number
  lines?: TermSheetLine[]
}) => (
  <DraftScopeProvider namespace="sess-a">
    <TermSheetPanel matterId={MATTER} matterRevision={revision} canEdit={false} lines={lines} />
  </DraftScopeProvider>
)

describe('Bug 1: 403 on retry of an existing pending attempt', () => {
  beforeEach(() => {
    promote.mockReset()
  })

  it('keeps key and payload when a retry of a pending promote gets 403', async () => {
    // First attempt: outcome-unknown
    promote.mockResolvedValueOnce({
      ok: false,
      kind: 'outcome-unknown',
      error: 'Retry with the same key.',
    })
    // Retry: 403 forbidden
    promote.mockResolvedValueOnce({
      ok: false,
      kind: 'forbidden',
      error: 'You do not have permission to do this.',
    })
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true)
    try {
      render(<EditPanel />)
      fireEvent.click(screen.getByRole('button', { name: 'Promote' }))
      await screen.findByText('Retry with the same key.')
      // The pending promote button should exist
      const retryBtn = await screen.findByRole('button', { name: 'Confirm pending promotion' })
      fireEvent.click(retryBtn)
      await screen.findByText('You do not have permission to do this.')
      // Key must still be in storage because the first attempt may have committed
      expect(window.sessionStorage.length).toBeGreaterThan(0)
      // The "Confirm pending promotion" button must still be present
      expect(
        await screen.findByRole('button', { name: 'Confirm pending promotion' }),
      ).toBeInTheDocument()
      // Both calls must use the same key
      expect(promote.mock.calls[0]![0].idempotencyKey).toBe(
        promote.mock.calls[1]![0].idempotencyKey,
      )
    } finally {
      confirm.mockRestore()
    }
  })

  it('clears attempt when a fresh (non-retry) promote gets 403 immediately', async () => {
    promote.mockResolvedValueOnce({
      ok: false,
      kind: 'forbidden',
      error: 'You do not have permission to do this.',
    })
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true)
    try {
      render(<EditPanel />)
      fireEvent.click(screen.getByRole('button', { name: 'Promote' }))
      await screen.findByText('You do not have permission to do this.')
      // No pending key should remain
      expect(window.sessionStorage.length).toBe(0)
      // No "Confirm pending promotion" button
      expect(
        screen.queryByRole('button', { name: 'Confirm pending promotion' }),
      ).not.toBeInTheDocument()
    } finally {
      confirm.mockRestore()
    }
  })

  it('hides "Confirm pending promotion" for Viewer with pending promote', async () => {
    // Seed a pending promote in sessionStorage (as if an Editor lost connectivity)
    promote.mockResolvedValueOnce({
      ok: false,
      kind: 'outcome-unknown',
      error: 'Retry with the same key.',
    })
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true)
    try {
      const { unmount } = render(<EditPanel />)
      fireEvent.click(screen.getByRole('button', { name: 'Promote' }))
      await screen.findByText('Retry with the same key.')
      unmount()
      // Re-render as Viewer (canEdit=false)
      render(<ViewerPanel />)
      // The pending block IS shown (the text about the pending promote)
      expect(screen.getByText(/earlier promotion/)).toBeInTheDocument()
      // But the action button is NOT rendered or is disabled because Viewer cannot write
      expect(
        screen.queryByRole('button', { name: 'Confirm pending promotion' }),
      ).not.toBeInTheDocument()
      // Storage is preserved — the key must not be discarded
      expect(window.sessionStorage.length).toBeGreaterThan(0)
    } finally {
      confirm.mockRestore()
    }
  })

  it('lets a Viewer check an import receipt when they have Matter read access', async () => {
    await lostImport()
    reconcile.mockResolvedValueOnce({ ok: true, created: 2, replaced: 0, unchanged: 1 })
    // Render as Viewer
    render(
      <DraftScopeProvider namespace="sess-a">
        <TermSheetPanel matterId={MATTER} matterRevision={7} canEdit={false} lines={[]} />
      </DraftScopeProvider>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Check import result' }))
    await screen.findByText(/earlier import was applied/)
    expect(reconcile).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledTimes(1) // no new mutation
    expect(window.sessionStorage.length).toBe(0) // cleared on success
  })
})

// ---------------------------------------------------------------------------
// Bug 2 regression: network error on checkImport must not crash the panel
// ---------------------------------------------------------------------------
describe('Bug 2: checkImport network rejection does not crash the panel', () => {
  it('catches reconcile action rejection and keeps the pending key', async () => {
    await lostImport()
    const key = keyOf(0)
    // First check: network error
    reconcile.mockRejectedValueOnce(new TypeError('Failed to fetch'))
    // Second check: success
    reconcile.mockResolvedValueOnce({ ok: true, created: 1, replaced: 0, unchanged: 0 })
    render(<Panel />)
    // The "Check import result" button should be present
    const checkBtn = screen.getByRole('button', { name: 'Check import result' })
    fireEvent.click(checkBtn)
    // The panel must still be rendered (no crash), a message should appear
    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent(/.+/)
    })
    // The key must still exist
    expect(window.sessionStorage.length).toBeGreaterThan(0)
    // No import mutation fired
    expect(fetchMock).toHaveBeenCalledTimes(1)
    // Retry with the same key should succeed
    fireEvent.click(screen.getByRole('button', { name: 'Check import result' }))
    await screen.findByText(/earlier import was applied/)
    expect(reconcile).toHaveBeenCalledTimes(2)
    expect(reconcile.mock.calls[0]![0].idempotencyKey).toBe(key)
    expect(reconcile.mock.calls[1]![0].idempotencyKey).toBe(key)
    // After success, storage is cleared
    expect(window.sessionStorage.length).toBe(0)
  })
})
