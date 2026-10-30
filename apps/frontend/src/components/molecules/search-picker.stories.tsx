import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { SearchPicker, type PickerResult } from './search-picker'

const PEOPLE = [
  'Alex Nguyen',
  'Bao Tran',
  'Chau Le',
  'A very long display name that must wrap instead of widening the dialog or hiding the role',
].map((label, i) => ({ value: `u${i}`, label }))

const search = async (query: string): Promise<PickerResult> => ({
  status: 'ok',
  options: PEOPLE.filter((p) => p.label.toLowerCase().includes(query.toLowerCase())),
})

const meta = {
  title: 'Molecules/SearchPicker',
  component: SearchPicker,
  // Plain controls and a fake source: no Next.js routing dependency.
  parameters: { nextjs: { appDirectory: false } },
  args: { name: 'userId', legend: 'Person', searchLabel: 'Search people', search },
  decorators: [
    (Story) => (
      <form className="max-w-md">
        <Story />
      </form>
    ),
  ],
} satisfies Meta<typeof SearchPicker>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const NoMatch: Story = { args: { search: async () => ({ status: 'ok', options: [] }) } }
export const Truncated: Story = {
  args: { search: async () => ({ status: 'ok', options: PEOPLE, truncated: true }) },
}
export const Slow: Story = { args: { search: () => new Promise<PickerResult>(() => {}) } }
export const Unavailable: Story = { args: { search: async () => ({ status: 'unavailable' }) } }
export const Failed: Story = { args: { search: async () => ({ status: 'error' }) } }
export const PermissionLost: Story = { args: { search: async () => ({ status: 'denied' }) } }
export const WithError: Story = { args: { error: 'Select a person', required: true } }
export const SameNames: Story = {
  args: {
    search: async () => ({
      status: 'ok',
      options: [
        { value: 'a', label: 'Alex Nguyen' },
        { value: 'b', label: 'Alex Nguyen' },
      ],
    }),
  },
}
