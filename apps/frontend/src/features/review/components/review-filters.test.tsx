import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { UiLocaleContext } from '@/hooks/use-locale'

import { ReviewFilters } from './review-filters'

describe('ReviewFilters', () => {
  it('keeps the grid, state and query in its GET form with a named search control', () => {
    render(<ReviewFilters matterId="m1" gridId="g1" filter={{ q: 'consent', state: 'PENDING' }} />)
    const form = screen.getByRole('search') as HTMLFormElement
    const fields = new FormData(form)
    expect(form).toHaveAttribute('method', 'get')
    expect(fields.get('grid')).toBe('g1')
    expect(fields.get('state')).toBe('PENDING')
    expect(fields.get('q')).toBe('consent')
    expect(screen.getByRole('button', { name: 'Search' })).toHaveAttribute('type', 'submit')
    expect(
      screen.getByRole('searchbox', { name: 'Search answers, questions and documents' }),
    ).toHaveValue('consent')
  })

  it('localizes the search button and field label', () => {
    render(
      <UiLocaleContext.Provider value="vi">
        <ReviewFilters matterId="m1" gridId="g1" filter={{}} />
      </UiLocaleContext.Provider>,
    )
    expect(screen.getByRole('button', { name: 'Tìm' })).toBeInTheDocument()
    expect(
      screen.getByRole('searchbox', { name: 'Tìm câu trả lời, câu hỏi và tài liệu' }),
    ).toBeInTheDocument()
  })
})
