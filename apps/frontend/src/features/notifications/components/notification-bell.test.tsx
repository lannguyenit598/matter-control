import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { UiLocaleContext } from '@/hooks/use-locale'

import { BellButton } from './bell-button'
import { unreadOf, type NotificationItem } from '../schemas'

vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: refresh }) }))
vi.mock('../actions', () => ({ markSeenAction: markSeen }))
const { markSeen, refresh } = vi.hoisted(() => ({ markSeen: vi.fn(), refresh: vi.fn() }))

const item = (over: Partial<NotificationItem>): NotificationItem => ({
  id: 'OVERDUE:m1:i1',
  kind: 'OVERDUE',
  matterId: 'm1',
  matterTitle: 'Atlas',
  itemId: 'i1',
  title: 'Response to notice is late',
  dueAt: '2026-11-01T09:00:00Z',
  createdAt: '2026-11-10T09:00:00Z',
  ...over,
})

afterEach(() => {
  vi.clearAllMocks()
})

describe('BellButton', () => {
  it('names the bell with the unread count, caps the badge at 9+ and toggles aria-expanded', () => {
    render(<BellButton items={[item({})]} seenAt={null} unread={12} />)
    const bell = screen.getByRole('button', { name: 'Notifications (9+)' })
    expect(bell).toHaveAttribute('aria-expanded', 'false')
    expect(screen.getByText('9+')).toHaveAttribute('aria-hidden', 'true')
    fireEvent.click(bell)
    expect(bell).toHaveAttribute('aria-expanded', 'true')
  })

  it('opens a panel grouped by kind, linking reviews to the queue and the rest to the matter', () => {
    render(
      <BellButton
        items={[
          item({}),
          item({
            id: 'REVIEW_PENDING:m1:i2',
            kind: 'REVIEW_PENDING',
            matterId: null,
            title: 'Proof awaits your verification',
            dueAt: null,
          }),
        ]}
        seenAt={null}
        unread={2}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Notifications (2)' }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Overdue · 1')).toBeInTheDocument()
    expect(screen.getByText('Pending review · 1')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Response to notice is late/ })).toHaveAttribute(
      'href',
      '/matters/m1',
    )
    expect(screen.getByRole('link', { name: /Proof awaits your verification/ })).toHaveAttribute(
      'href',
      '/my-reviews',
    )
  })

  it('shows an empty state and no mark-seen button when there is nothing', () => {
    render(<BellButton items={[]} seenAt={null} unread={0} />)
    fireEvent.click(screen.getByRole('button', { name: 'Notifications' }))
    expect(screen.getByText('No notifications')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Mark as seen' })).not.toBeInTheDocument()
  })

  it('marks the feed seen through the action and refreshes the server read', async () => {
    markSeen.mockResolvedValue({ ok: true, seenAt: '2026-11-10T10:00:00Z' })
    render(<BellButton items={[item({})]} seenAt={null} unread={1} />)
    fireEvent.click(screen.getByRole('button', { name: 'Notifications (1)' }))
    fireEvent.click(screen.getByRole('button', { name: 'Mark as seen' }))
    await act(async () => {})
    expect(markSeen).toHaveBeenCalledTimes(1)
    expect(refresh).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('button', { name: 'Notifications (1)' })).toBeInTheDocument()
  })

  it('counts unread items against the seen marker only (null seenAt means everything is unread)', () => {
    const items = [
      item({ createdAt: '2026-11-09T09:00:00Z' }),
      item({ id: 'OVERDUE:m1:i2', createdAt: '2026-11-10T09:00:00Z' }),
    ]
    expect(unreadOf(items, null)).toBe(2)
    expect(unreadOf(items, '2026-11-09T12:00:00Z')).toBe(1)
    expect(unreadOf(items, '2026-11-10T12:00:00Z')).toBe(0)
  })

  it('renders Vietnamese kind labels and accessible name under the vi locale', () => {
    render(
      <UiLocaleContext.Provider value="vi">
        <BellButton items={[item({})]} seenAt={null} unread={1} />
      </UiLocaleContext.Provider>,
    )
    expect(screen.getByRole('button', { name: 'Thông báo (1)' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Thông báo (1)' }))
    expect(screen.getByText('Quá hạn · 1')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Đánh dấu đã xem' })).toBeInTheDocument()
  })
})
