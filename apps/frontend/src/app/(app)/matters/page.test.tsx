import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }))

const repos = vi.hoisted(() => ({ discover: vi.fn(), session: vi.fn() }))
vi.mock('next/server', () => ({ connection: async () => undefined }))
vi.mock('@/lib/auth', () => ({ getSession: repos.session }))
vi.mock('@/features/matters/repository', () => ({ matterRepository: { discover: repos.discover } }))

import MattersPage from './page'

async function renderPage(search: Record<string, string | string[]> = {}) {
  const tree = MattersPage({ searchParams: Promise.resolve(search) } as never)
  const inner = (
    tree as { props: { children: Array<{ props?: { children?: unknown } } | unknown> } }
  ).props.children
  const suspense = (
    inner as Array<{
      props: { children: { type: (p: unknown) => Promise<unknown>; props: unknown } }
    }>
  )[1]!
  const el = suspense.props.children
  render((await el.type(el.props)) as never)
}

const page = (items: unknown[], nextCursor: string | null = null) => ({
  items,
  page: { limit: 25, maxLimit: 100, total: items.length, nextCursor },
})

beforeEach(() => {
  Object.values(repos).forEach((r) => r.mockReset())
  repos.session.mockResolvedValue({ userId: 'u1' })
})

describe('Matters entry (BF-08)', () => {
  it('searches across workspaces by the q parameter and shows the workspace', async () => {
    repos.discover.mockResolvedValue(
      page(
        [
          {
            id: 'm1',
            workspaceId: 'w1',
            title: 'Atlas',
            revision: 1,
            eventSeq: 1,
            callerRole: 'OWNER',
            lastRecordedAt: 'x',
            workspaceName: 'Acme',
          },
        ],
        'cur-1',
      ),
    )
    await renderPage({ q: ' atlas ' })
    expect(repos.discover).toHaveBeenCalledWith('atlas', undefined)
    expect(screen.getByText(/Workspace/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Show more matters' })).toHaveAttribute(
      'href',
      '/matters?q=atlas&cursor=cur-1',
    )
  })

  it('ignores hostile or oversized parameters instead of forwarding them', async () => {
    repos.discover.mockResolvedValue(page([]))
    await renderPage({ q: ['a', 'b'], cursor: 'x'.repeat(401) })
    expect(repos.discover).toHaveBeenCalledWith('', undefined)
  })

  it('asks the person to sign in and never reads when there is no session', async () => {
    repos.session.mockResolvedValue(null)
    await renderPage()
    expect(repos.discover).not.toHaveBeenCalled()
  })

  it('says so when the read fails instead of showing an empty list', async () => {
    repos.discover.mockRejectedValue(new Error('down'))
    await renderPage()
    expect(screen.queryByText('No matters you can open')).not.toBeInTheDocument()
  })
})
