import { act, render, screen } from '@testing-library/react'
import { afterEach, expect, it } from 'vitest'

import { setUiLocale } from '@/hooks/use-locale'

import { OutcomeList } from './outcome-list'

afterEach(() => act(() => setUiLocale('en')))

it('keeps unknown outcomes distinct and row identities intact when changing language', () => {
  render(
    <OutcomeList
      submitted={3}
      results={[
        { rowKey: 'literal-Completed', status: 'SUCCESS_REPLAYED' },
        { rowKey: 'row-b', status: 'FAILURE', code: 'storage' },
        { rowKey: 'row-c', status: 'UNKNOWN' },
      ]}
    />,
  )
  expect(screen.getByRole('status')).toHaveTextContent(
    '1 applied (1 already applied earlier), 1 failed, 1 unknown of 3 submitted.',
  )
  act(() => setUiLocale('vi'))
  expect(screen.getByRole('status')).toHaveTextContent(
    '1 đã áp dụng (1 đã áp dụng trước đó), 1 thất bại, 1 chưa rõ kết quả trên 3 dòng đã gửi.',
  )
  expect(screen.getByText('literal-Completed')).toBeInTheDocument()
  expect(screen.getByText('row-c')).toBeInTheDocument()
  expect(screen.getByText(/Lỗi lưu trữ đã hoàn tác cả nhóm/)).toBeInTheDocument()
  expect(screen.getByRole('heading', { name: 'Chưa rõ kết quả' })).toBeInTheDocument()
})
