import { act, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'

import { setUiLocale } from '@/hooks/use-locale'

import GlobalError from './global-error'

afterEach(() => act(() => setUiLocale('en')))

it('renders title text as a primitive and follows the interface locale', () => {
  render(<GlobalError error={new Error('synthetic')} retry={vi.fn()} />)
  expect(document.querySelector('title')).toHaveTextContent('Something went wrong')
  act(() => setUiLocale('vi'))
  expect(document.querySelector('title')).toHaveTextContent('Đã xảy ra lỗi')
  expect(screen.getByRole('heading')).toHaveTextContent('Đã xảy ra lỗi')
})
