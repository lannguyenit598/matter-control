import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { WorkFilters } from './work-filters'

const meta = {
  title: 'Features/Work/Filters',
  component: WorkFilters,
  // The App Router fixture does not support Next 16.4's render tree; routing is tested separately.
  parameters: { nextjs: { appDirectory: false } },
  args: {
    basePath: '/matters/example/work',
    query: {},
    members: [{ userId: 'example-member', displayName: 'Nguyễn Minh Anh' }],
    workstreams: [{ id: 'example-stream', name: 'Pháp lý doanh nghiệp', revision: 1 }],
  },
} satisfies Meta<typeof WorkFilters>

export default meta
type Story = StoryObj<typeof meta>

export const SimpleSearch: Story = {}
export const AppliedFilters: Story = {
  args: {
    query: { q: 'Approval', execution: 'WAITING', owner: 'example-member' },
    density: 'compact',
  },
}
