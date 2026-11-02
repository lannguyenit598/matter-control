import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { SearchBody, ResultMetadata } from './components/quick-search'
import { searchInputSchema, resultHref, type SearchItem, type SearchResponse } from './schemas'
import { McError } from '@/lib/mc/errors'
import { PrivateUiProvider, onPrivateUi } from '@/lib/mc/private-ui-events'

vi.mock('next/navigation', () => ({ usePathname: () => '/my-actions' }))
const { read } = vi.hoisted(() => ({ read: vi.fn() }))
vi.mock('./client', () => ({ searchRecords: read }))
const epoch = 'b'.repeat(24)
const item: SearchItem = {
  sameName: false,
  id: 'action-one',
  kind: 'ACTION',
  label: 'Hợp đồng',
  workspaceId: 'ws',
  workspaceName: 'Legal',
  matterId: 'matter',
  matterTitle: 'Atlas',
  role: 'EDITOR',
  outcome: 'Signed copy received',
  execution: 'IN_PROGRESS',
  dueAt: null,
  version: 0,
  uploadedAt: null,
}
const result = (row: SearchItem): SearchResponse => ({
  groups: {
    workItems: {
      status: 'ok',
      items: [row],
      hasMore: false,
      nextCursor: '',
      asOf: '2026-11-01T00:00:00Z',
    },
  },
})
const pages = [{ href: '/matters', en: 'Matters', vi: 'Hồ sơ' }]
afterEach(() => {
  vi.useRealTimers()
  vi.clearAllMocks()
})

it('broadcasts session loss observed during paging and clears the private query', async () => {
  vi.useFakeTimers()
  const first: SearchResponse = {
    groups: {
      workItems: {
        status: 'ok',
        items: [item],
        hasMore: true,
        nextCursor: 'cursor',
        asOf: '2026-11-01T00:00:00Z',
      },
    },
  }
  read
    .mockResolvedValue(first)
    .mockResolvedValueOnce(first)
    .mockRejectedValueOnce(new McError('unauthenticated', 401))
  const seen: string[] = []
  const off = onPrivateUi((event) => {
    seen.push(event.type)
  })
  render(
    <PrivateUiProvider
      identity={{ principalKey: 'a'.repeat(64), epoch, validUntil: '2099-01-01T00:00:00.000Z' }}
    >
      <SearchBody epoch={epoch} destinations={pages} close={() => {}} />
    </PrivateUiProvider>,
  )
  const input = screen.getByRole('searchbox')
  fireEvent.change(input, { target: { value: 'focus' } })
  await act(async () => {
    await vi.advanceTimersByTimeAsync(210)
  })
  fireEvent.click(screen.getByRole('button', { name: 'Show more work items' }))
  await act(async () => {})
  off()
  expect(seen).toContain('session-ended')
  expect(input).toHaveValue('')
  expect(screen.queryByText('Signed copy received')).not.toBeInTheDocument()
  fireEvent.change(input, { target: { value: 'next' } })
  await act(async () => {
    await vi.advanceTimersByTimeAsync(210)
  })
  expect(read).toHaveBeenCalledTimes(2)
})

it('validates Unicode code points and builds only known authorized detail routes', () => {
  expect(searchInputSchema.safeParse({ q: '😀'.repeat(100), epoch }).success).toBe(true)
  expect(searchInputSchema.safeParse({ q: '😀'.repeat(101), epoch }).success).toBe(false)
  expect(searchInputSchema.safeParse({ q: 'ab\n', epoch }).success).toBe(false)
  expect(resultHref(item)).toBe('/matters/matter/work/action-one')
  expect(() => resultHref({ ...item, id: '../bad' })).toThrow()
})
it('shows authorized discriminators and an honest fallback for identical metadata', () => {
  render(<ResultMetadata row={item} duplicate />)
  expect(screen.getByText('Signed copy received')).toBeInTheDocument()
  expect(screen.getByText('In progress')).toBeInTheDocument()
  expect(screen.getByText('Same name — open to inspect')).toBeInTheDocument()
  expect(screen.queryByText('action-one')).not.toBeInTheDocument()
})
it('never requests one character/IME input; ignores a late old query and never jumps to a Page while loading', async () => {
  vi.useFakeTimers()
  let finish: (r: SearchResponse) => void = () => {}
  read.mockReturnValueOnce(
    new Promise<SearchResponse>((resolve) => {
      finish = resolve
    }),
  )
  read.mockResolvedValue(result({ ...item, label: 'New response' }))
  const close = vi.fn()
  render(<SearchBody epoch={epoch} destinations={pages} close={close} />)
  const input = screen.getByRole('searchbox')
  fireEvent.change(input, { target: { value: 'a' } })
  await act(async () => {
    await vi.advanceTimersByTimeAsync(210)
  })
  expect(read).not.toHaveBeenCalled()
  fireEvent.compositionStart(input)
  fireEvent.change(input, { target: { value: 'at' } })
  await act(async () => {
    await vi.advanceTimersByTimeAsync(210)
  })
  expect(read).not.toHaveBeenCalled()
  fireEvent.compositionEnd(input, { target: { value: 'at' } })
  await act(async () => {
    await vi.advanceTimersByTimeAsync(210)
  })
  fireEvent.keyDown(input, { key: 'Enter' })
  expect(close).not.toHaveBeenCalled()
  fireEvent.change(input, { target: { value: 'next' } })
  await act(async () => {
    await vi.advanceTimersByTimeAsync(210)
  })
  expect(screen.getByText('New response')).toBeInTheDocument()
  await act(async () => finish(result({ ...item, label: 'Old secret' })))
  expect(screen.queryByText('Old secret')).not.toBeInTheDocument()
})
