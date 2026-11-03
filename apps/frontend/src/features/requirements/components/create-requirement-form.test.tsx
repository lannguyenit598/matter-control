import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, expect, it, vi } from 'vitest'

const router = vi.hoisted(() => ({ push: vi.fn(), refresh: vi.fn() }))
const create = vi.hoisted(() => vi.fn())
vi.mock('next/navigation', () => ({ useRouter: () => router }))
vi.mock('../actions', () => ({ createRequirementAction: create }))
import { CreateRequirementForm } from './create-requirement-form'

beforeEach(() => {
  vi.clearAllMocks()
})

it('opens the operational work detail after creating a requirement', async () => {
  create.mockResolvedValue({ ok: true, id: 'new-requirement' })
  render(<CreateRequirementForm matterId="current-matter" />)
  fireEvent.change(screen.getByLabelText(/^Title/), {
    target: { value: 'Board approval obtained' },
  })
  fireEvent.change(screen.getByLabelText(/^Intended outcome/), {
    target: { value: 'Signed board approval is available' },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Create requirement' }))
  await waitFor(() =>
    expect(router.push).toHaveBeenCalledWith('/matters/current-matter/work/new-requirement'),
  )
})
