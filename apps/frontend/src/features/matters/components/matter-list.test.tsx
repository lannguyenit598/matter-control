import { render, screen, within } from '@testing-library/react'
import { expect, it } from 'vitest'
import { MatterList } from './matter-list'

const matter = (id: string, title: string, callerRole = 'OWNER') => ({
  id,
  workspaceId: 'w',
  title,
  revision: 1,
  eventSeq: 1,
  callerRole,
  lastRecordedAt: '2026-10-29T00:00:00Z',
})

it('puts the one create action in the section header when the page grants it', () => {
  render(<MatterList items={[]} total={0} action={<button>Create matter</button>} />)
  expect(screen.getByRole('heading', { name: 'Matters' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Create matter' })).toBeInTheDocument()
})

it('does not offer creation when the page has not granted the affordance', () => {
  render(<MatterList items={[]} total={0} />)
  expect(screen.queryByRole('button', { name: /Create/ })).not.toBeInTheDocument()
  expect(screen.getByText(/Workspace ownership alone does not grant access/)).toBeInTheDocument()
})

it('lists titles as real links with the caller role and the real total', () => {
  render(
    <MatterList
      items={[matter('m1', 'Acquisition of Acme'), matter('m2', 'Lease', 'VIEWER')]}
      total={2}
    />,
  )
  const link = screen.getByRole('link', { name: /Acquisition of Acme/ })
  expect(link).toHaveAttribute('href', '/matters/m1')
  expect(within(link).getByText('Owner')).toBeInTheDocument()
  expect(screen.getByRole('link', { name: /Lease/ })).toHaveTextContent('Viewer')
  expect(screen.getByRole('heading', { name: /Matters/ })).toHaveTextContent('2 you can access')
  expect(link.closest('a')?.querySelector('a, button')).toBeNull() // no nested interactive target
})
