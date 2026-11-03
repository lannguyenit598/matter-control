import { render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const repos = vi.hoisted(() => ({
  matter: vi.fn(),
  members: vi.fn(),
  parties: vi.fn(),
  list: vi.fn(),
  room: vi.fn(),
}))
vi.mock('@/lib/auth', () => ({ getSession: async () => ({ userId: 'u1' }) }))
vi.mock('@/features/matters/repository', () => ({
  matterRepository: { get: repos.matter, members: repos.members },
}))
vi.mock('@/features/work/repository', () => ({
  workRepository: { parties: repos.parties, list: repos.list },
}))
vi.mock('@/features/control/repository', () => ({ controlRepository: { room: repos.room } }))
vi.mock('@/features/control/components/context-forms', () => ({
  CreateContextForm: ({ items }: { items: { label: string }[] }) => (
    <ul aria-label="link choices">
      {items.map((i) => (
        <li key={i.label}>{i.label}</li>
      ))}
    </ul>
  ),
  CloseContextForm: () => null,
}))

import ControlRoomPage from './page'

const item = (id: string, title: string, over: Record<string, unknown> = {}) => ({
  id,
  kind: 'ACTION' as const,
  title,
  execution: 'IN_PROGRESS',
  dependency: 'READY',
  verification: null,
  ownerId: 'u1',
  dueAt: null,
  waitingPartyId: null,
  waitingCondition: null,
  proofRequired: false,
  ...over,
})
const row = (id: string, title: string, over: Record<string, unknown> = {}) => ({
  item: item(id, title, over),
  derived: { timing: 'ON_TRACK', attention: 'NORMAL', attentionReasons: [], criticalChain: false },
  etag: '"e"',
})
const record = (id: string, title: string, status: 'OPEN' | 'CLOSED', links: string[]) => ({
  id,
  kind: 'DECISION' as const,
  title,
  body: '',
  status,
  links,
  createdBy: 'u1',
  createdAt: 'x',
  revision: 1,
  etag: `"${id}"`,
})

/** Runs the real page composition (a server component) and renders what it returns. */
async function renderPage() {
  const tree = ControlRoomPage({ params: Promise.resolve({ matterId: 'm1' }) } as never)
  const inner = (
    tree as { props: { children: { type: (p: unknown) => Promise<unknown>; props: unknown } } }
  ).props.children
  render((await inner.type(inner.props)) as never)
}

beforeEach(() => {
  Object.values(repos).forEach((r) => r.mockReset())
  repos.matter.mockResolvedValue({ matter: { title: 'Atlas', callerRole: 'OWNER' } })
  repos.members.mockResolvedValue({ items: [{ userId: 'u1', displayName: 'Alice' }] })
  repos.parties.mockResolvedValue({ items: [] })
})

describe('Control Room page orchestration (F04)', () => {
  it('describes records with the room snapshot even when a later read disagrees', async () => {
    // The room was built at revision 42; the separate work list was read after somebody renamed the
    // record and closed another decision (revision 43). Facts must come from the room alone.
    repos.room.mockResolvedValue({
      room: {
        asOf: '2026-10-27T01:00:00Z',
        sourceRevision: 42,
        state: {
          total: 2,
          byExecution: {},
          blocked: 0,
          overdue: 0,
          critical: 0,
          awaitingProof: 0,
          openFilings: 0,
          negativeFilings: 0,
        },
        blockers: [],
        nextActions: [{ ...row('a1', 'Sign the SPA'), unblocks: ['b1'], decisions: [] }],
        waiting: [],
        milestones: [],
        gaps: [],
        decisions: [record('d1', 'Wire before signing?', 'OPEN', ['a1'])],
        risks: [],
        findings: [],
        records: [
          record('d1', 'Wire before signing?', 'OPEN', ['a1']),
          record('d2', 'Old decision', 'CLOSED', ['b1']),
        ],
        titles: { a1: 'Sign the SPA', b1: 'Wire the price' },
        changes: [],
      },
    })
    repos.list.mockResolvedValue({
      page: {
        items: [
          { item: item('a1', 'Sign the SPA — RENAMED AFTER THE ROOM'), derived: {}, etag: '"x"' },
          { item: item('b1', 'Wire the price — RENAMED AFTER THE ROOM'), derived: {}, etag: '"x"' },
        ],
      },
      asOf: '2026-10-27T01:00:09Z',
    })
    await renderPage()

    expect(screen.getAllByText(/source revision 42/).length).toBeGreaterThan(0)
    const next = screen.getByRole('region', { name: 'Do next' })
    expect(within(next).getByText(/Releases: Wire the price/)).toBeInTheDocument()
    // no label from the later read leaks into the room's text
    expect(
      screen.queryByText(/RENAMED AFTER THE ROOM/, { selector: ':not(li)' }),
    ).not.toBeInTheDocument()
    // the closed decision comes from the same snapshot as the open one
    expect(screen.getByText(/Old decision/)).toBeInTheDocument()
    expect(screen.getByText(/closed: /)).toBeInTheDocument()
    // the edit form says its own choices were read separately, at their own boundary
    expect(
      screen.getByText(
        /were read separately at 2026-10-27T01:00:09Z; the room above is as of 2026-10-27T01:00:00Z/,
      ),
    ).toBeInTheDocument()
  })

  it('shows an explicit failure instead of a mixed page when the room cannot be read', async () => {
    repos.room.mockRejectedValue(new Error('boom'))
    repos.list.mockResolvedValue({ page: { items: [] }, asOf: null })
    await renderPage()
    expect(screen.queryByText(/source revision/)).not.toBeInTheDocument()
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
  })
})
