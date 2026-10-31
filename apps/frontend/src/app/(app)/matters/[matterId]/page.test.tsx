import { render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// BF-07: the Matter landing leads with the Control Room's own operational brief.
const repos = vi.hoisted(() => ({
  session: vi.fn(),
  matter: vi.fn(),
  members: vi.fn(),
  history: vi.fn(),
  candidates: vi.fn(),
  room: vi.fn(),
  parties: vi.fn(),
  mine: vi.fn(),
}))
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }))
vi.mock('@/lib/auth', () => ({ getSession: repos.session }))
vi.mock('@/features/matters/repository', () => ({
  matterRepository: {
    get: repos.matter,
    members: repos.members,
    history: repos.history,
    memberCandidates: repos.candidates,
  },
}))
vi.mock('@/features/control/repository', () => ({ controlRepository: { room: repos.room } }))
vi.mock('@/features/work/repository', () => ({
  workRepository: { parties: repos.parties, myActions: repos.mine },
}))
vi.mock('@/features/matters/actions', () => ({}))
vi.mock('@/features/requirements/actions', () => ({ createRequirementAction: vi.fn() }))
vi.mock('@/features/work/actions', () => ({
  createActionAction: vi.fn(),
  searchWorkItemsAction: vi.fn(),
}))

import MatterPage from './page'

const room = {
  asOf: '2026-10-30T03:00:00Z',
  sourceRevision: 7,
  state: {
    total: 3,
    byExecution: { WAITING: 1 },
    blocked: 1,
    overdue: 0,
    critical: 0,
    awaitingProof: 1,
    openFilings: 1,
    negativeFilings: 0,
  },
  blockers: [],
  nextActions: [],
  waiting: [],
  milestones: [],
  gaps: [],
  decisions: [],
  risks: [],
  findings: [],
  records: [],
  titles: {},
  changes: [],
}

async function renderPage(search: Record<string, string> = {}) {
  const tree = MatterPage({
    params: Promise.resolve({ matterId: 'm1' }),
    searchParams: Promise.resolve(search),
  } as never)
  const inner = (
    tree as { props: { children: { type: (p: unknown) => Promise<unknown>; props: unknown } } }
  ).props.children
  render((await inner.type(inner.props)) as never)
}

beforeEach(() => {
  Object.values(repos).forEach((r) => r.mockReset())
  repos.session.mockResolvedValue({ userId: 'u1' })
  repos.matter.mockResolvedValue({
    matter: { title: 'Atlas', callerRole: 'OWNER' },
    etag: '"m"',
    asOf: '2026-10-30T03:00:00Z',
  })
  repos.members.mockResolvedValue({
    items: [{ userId: 'u1', displayName: 'Alice', status: 'ACTIVE', role: 'OWNER' }],
  })
  repos.history.mockResolvedValue({
    items: [],
    asOf: '2026-10-30T03:00:00Z',
    page: { nextCursor: null },
  })
  repos.candidates.mockResolvedValue({ items: [] })
  repos.room.mockResolvedValue({ room })
  repos.parties.mockResolvedValue({ items: [] })
  repos.mine.mockResolvedValue({
    actions: { next: [], waiting: [], blocked: [], historical: [] },
  })
})

describe('Matter landing', () => {
  it('leads with the operational brief read from the Control Room model', async () => {
    await renderPage()
    expect(screen.getByRole('heading', { name: 'Where this matter stands' })).toBeVisible()
    expect(repos.room).toHaveBeenCalledWith('m1')
    // Same component and snapshot as the Control Room tab: its sections lead the landing.
    expect(screen.getAllByText(/source revision 7/).length).toBeGreaterThan(0)
    expect(screen.getByRole('region', { name: 'Blocked' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Do next' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'What changed' })).toBeInTheDocument()
  })

  it('is a condensed brief: no gaps or decision sections, a link to the full Control Room (BF-07)', async () => {
    await renderPage()
    expect(screen.queryByRole('region', { name: 'Gaps' })).not.toBeInTheDocument()
    expect(
      screen.queryByRole('region', { name: 'Open decisions, risks and findings' }),
    ).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Open the full Control Room/ })).toHaveAttribute(
      'href',
      '/matters/m1/control-room',
    )
  })

  it('keeps administration behind an intentional disclosure and says so when the brief fails', async () => {
    repos.room.mockRejectedValue(new Error('down'))
    await renderPage()
    expect(screen.getByText('The operational brief could not be read')).toBeVisible()
    const access = screen.getByText('Members and access').closest('details')!
    expect(access).not.toHaveAttribute('open')
    expect(within(access).getAllByText('Alice').length).toBeGreaterThan(0)
  })

  it('offers Create status brief from the matter context (BF-10)', async () => {
    await renderPage()
    expect(screen.getByRole('link', { name: /Create status brief/ })).toHaveAttribute(
      'href',
      '/matters/m1/data#status-brief',
    )
  })

  it('opens the access section right after the matter is created', async () => {
    await renderPage({ created: '1' })
    expect(screen.getByText('Members and access').closest('details')).toHaveAttribute('open')
  })
})
