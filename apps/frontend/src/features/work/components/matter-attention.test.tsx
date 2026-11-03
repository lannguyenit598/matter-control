import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import type { Assigned, Envelope } from '../schemas'

import { MatterAttention } from './matter-attention'

const env = (id: string, title: string, reasons = 1): Envelope =>
  ({
    item: {
      id,
      title,
      dueAt: null,
      dependencyReasons: Array.from({ length: reasons }, (_, i) => ({ edgeId: `e${i}` })),
    },
    derived: { attentionReasons: ['CRITICAL_CHAIN'] },
  }) as unknown as Envelope

const mine = (id: string, title: string): Assigned =>
  ({ item: { id, title } }) as unknown as Assigned
const none = { ready: [], waiting: [], blocked: [], history: [] }
const base = { matterId: 'm1', here: '/matters/m1' }

describe('MatterAttention', () => {
  it('names each blocked Action with its cause and links into it, remembering the Matter as origin', () => {
    render(
      <MatterAttention
        {...base}
        blocked={[env('b1', 'Sign SPA', 2)]}
        blockedTotal={1}
        mine={none}
      />,
    )
    const link = screen.getByRole('link', { name: 'Sign SPA' })
    const url = new URL(link.getAttribute('href')!, 'http://x')
    expect(url.pathname).toBe('/matters/m1/work/b1')
    expect(url.searchParams.get('from')).toBe('/matters/m1')
    expect(screen.getByText(/2 prerequisite\(s\) not satisfied/)).toBeInTheDocument()
    expect(screen.getByText(/unsatisfied prerequisite of a critical milestone/)).toBeInTheDocument()
  })

  it('exact total when the API gives one, an honest "may be more" when it does not', () => {
    const { rerender } = render(
      <MatterAttention {...base} blocked={[env('b1', 'A')]} blockedTotal={9} mine={none} />,
    )
    expect(screen.getByText(/Showing 1 of 9\./)).toBeInTheDocument()
    rerender(
      <MatterAttention {...base} blocked={[env('b1', 'A')]} blockedTotal={null} mine={none} />,
    )
    expect(screen.getByText(/there may be more/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'See all in Work' })).toHaveAttribute(
      'href',
      '/matters/m1/work?kind=ACTION&dependency=BLOCKED',
    )
  })

  it('nothing blocked is stated; an unreadable list is not reported as "nothing blocked"', () => {
    const { rerender } = render(
      <MatterAttention {...base} blocked={[]} blockedTotal={0} mine={none} />,
    )
    expect(screen.getByText(/No Action in this matter is blocked/)).toBeInTheDocument()
    rerender(<MatterAttention {...base} blocked={null} blockedTotal={null} mine={none} />)
    expect(screen.queryByText(/No Action in this matter is blocked/)).toBeNull()
    expect(screen.getByText(/Blocked work could not be read/)).toBeInTheDocument()
  })

  it('shows the caller’s own next step and per-queue counts for this Matter', () => {
    render(
      <MatterAttention
        {...base}
        blocked={[]}
        blockedTotal={0}
        mine={{
          ...none,
          ready: [mine('r1', 'Draft minutes')],
          waiting: [mine('w1', 'x'), mine('w2', 'y')],
        }}
      />,
    )
    expect(screen.getByRole('link', { name: 'Draft minutes' })).toHaveAttribute(
      'href',
      '/my-actions?queue=ready&item=r1',
    )
    expect(screen.getByRole('link', { name: '2 waiting' })).toHaveAttribute(
      'href',
      '/my-actions?queue=waiting',
    )
  })

  it('nothing assigned vs unreadable assignments are different messages', () => {
    const { rerender } = render(
      <MatterAttention {...base} blocked={[]} blockedTotal={0} mine={none} />,
    )
    expect(screen.getByText(/Nothing in this matter is assigned to you/)).toBeInTheDocument()
    rerender(<MatterAttention {...base} blocked={[]} blockedTotal={0} mine={null} />)
    expect(screen.getByText(/assigned work could not be read/)).toBeInTheDocument()
  })
})
