import { fireEvent, render, screen } from '@testing-library/react'
import { RouterContext } from 'next/dist/shared/lib/router-context.shared-runtime'
import type { NextRouter } from 'next/router'
import { describe, expect, it, vi } from 'vitest'

// Vitest resolves next/form to its standard router entry; the production build uses App Router.
// The workspace people search no longer navigates: it is a read inside the Add member dialog
// (see people-picker-flow.test.tsx), so only the work filters remain URL state here.
import { WorkFilters } from '@/features/work/components/work-filters'

const router = {
  push: vi.fn(),
  replace: vi.fn(),
  prefetch: vi.fn(),
  refresh: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
}

function mount(children: React.ReactNode) {
  router.push.mockClear()
  render(
    <RouterContext.Provider value={router as unknown as NextRouter}>
      {children}
    </RouterContext.Provider>,
  )
}

describe('Search navigation', () => {
  it('applies work filters with internal navigation and starts at the first page', () => {
    mount(
      <WorkFilters
        basePath="/matters/m1/work"
        query={{ q: 'approval', owner: 'u1', desc: 'true', cursor: 'old' }}
        density="compact"
        workstreams={[]}
        members={[{ userId: 'u1', displayName: 'Alex' }]}
      />,
    )
    expect(fireEvent.submit(screen.getByRole('search', { name: 'Filter work items' }))).toBe(false)
    const [destination, , options] = router.push.mock.calls[0]!
    const url = new URL(destination)
    expect(url.pathname).toBe('/matters/m1/work')
    expect(url.searchParams.get('q')).toBe('approval')
    expect(url.searchParams.get('owner')).toBe('u1')
    expect(url.searchParams.has('page')).toBe(false)
    expect(url.searchParams.has('cursor')).toBe(false)
    expect(url.searchParams.get('density')).toBe('compact')
    expect(url.searchParams.get('desc')).toBe('true')
    expect(options).toEqual({ scroll: false })
  })
})
