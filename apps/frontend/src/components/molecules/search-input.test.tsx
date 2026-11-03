import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { UiLocaleContext } from '@/hooks/use-locale'

import { SearchInput } from './search-input'

describe('SearchInput', () => {
  it('shows a clear button only when there is a value', async () => {
    const onClear = vi.fn()
    const { rerender } = render(
      <SearchInput aria-label="Search" value="" onChange={() => {}} onClear={onClear} />,
    )
    expect(screen.queryByRole('button', { name: 'Clear search' })).not.toBeInTheDocument()

    rerender(<SearchInput aria-label="Search" value="abc" onChange={() => {}} onClear={onClear} />)
    await userEvent.click(screen.getByRole('button', { name: 'Clear search' }))
    expect(onClear).toHaveBeenCalledOnce()
  })

  it('names the icon in Vietnamese and clears without submitting its enclosing form', async () => {
    const onClear = vi.fn()
    const submit = vi.fn((event: React.FormEvent) => event.preventDefault())
    render(
      <UiLocaleContext.Provider value="vi">
        <form onSubmit={submit}>
          <SearchInput aria-label="Tìm hồ sơ" value="hồ sơ" onChange={() => {}} onClear={onClear} />
        </form>
      </UiLocaleContext.Provider>,
    )
    const clear = screen.getByRole('button', { name: 'Xóa tìm kiếm' })
    expect(clear).toHaveAttribute('type', 'button')
    await userEvent.click(clear)
    expect(onClear).toHaveBeenCalledOnce()
    expect(submit).not.toHaveBeenCalled()
  })

  it.each(['disabled', 'readOnly'] as const)('cannot clear a %s search field', async (state) => {
    const onClear = vi.fn()
    render(
      <SearchInput
        aria-label="Search"
        value="abc"
        onChange={() => {}}
        onClear={onClear}
        {...{ [state]: true }}
      />,
    )
    const clear = screen.getByRole('button', { name: 'Clear search' })
    expect(clear).toBeDisabled()
    await userEvent.click(clear)
    expect(onClear).not.toHaveBeenCalled()
  })
})
