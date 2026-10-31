import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const router = vi.hoisted(() => ({ push: vi.fn(), refresh: vi.fn() }))
vi.mock('next/navigation', () => ({ useRouter: () => router }))

import { MatterSearch, searchHref } from './matter-search'

beforeEach(() => router.push.mockClear())

describe('MatterSearch (client-side navigation)', () => {
  it('pushes the search URL through the router instead of reloading the document', () => {
    render(<MatterSearch query="" />)
    fireEvent.change(screen.getByLabelText('Search matters by name'), {
      target: { value: ' Atlas & Co ' },
    })
    const submitted = fireEvent.submit(screen.getByRole('search'))
    expect(submitted).toBe(false) // preventDefault: no whole-document navigation
    expect(router.push).toHaveBeenCalledWith('/matters?q=Atlas%20%26%20Co', { scroll: false })
  })

  it('an empty search returns to the plain list, one history entry per search', () => {
    render(<MatterSearch query="atlas" />)
    fireEvent.change(screen.getByLabelText('Search matters by name'), { target: { value: '   ' } })
    fireEvent.submit(screen.getByRole('search'))
    expect(router.push).toHaveBeenCalledTimes(1)
    expect(router.push).toHaveBeenCalledWith('/matters', { scroll: false })
  })

  it('follows the URL: the box shows the query of the current page (Back/Forward re-render it)', () => {
    const { rerender } = render(<MatterSearch query="atlas" />)
    expect(screen.getByLabelText('Search matters by name')).toHaveValue('atlas')
    rerender(<MatterSearch query="beta" />)
    expect(screen.getByLabelText('Search matters by name')).toHaveValue('beta')
    rerender(<MatterSearch query="" />)
    expect(screen.getByLabelText('Search matters by name')).toHaveValue('')
  })

  it('stays a real GET form for the moment before scripts load', () => {
    render(<MatterSearch query="" />)
    const form = screen.getByRole('search')
    expect(form).toHaveAttribute('method', 'get')
    expect(form).toHaveAttribute('action', '/matters')
  })

  it('caps the query like the API', () => {
    expect(searchHref('x'.repeat(150))).toBe(`/matters?q=${'x'.repeat(100)}`)
  })
})
