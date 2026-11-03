import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { InlineEdit } from './inline-edit'

const meta = {
  title: 'Organisms/Inline edit',
  component: InlineEdit,
  args: {
    label: 'agreement title',
    value: 'Draft agreement',
    canEdit: true,
    run: async () => ({ ok: true }),
  },
  parameters: { nextjs: { appDirectory: true } },
} satisfies Meta<typeof InlineEdit>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const LinkedTitle: Story = {
  args: {
    display: (
      <a href="#details" className="font-medium underline-offset-4 hover:underline">
        Draft agreement
      </a>
    ),
  },
}
export const ReadOnlyLink: Story = { args: { ...LinkedTitle.args, canEdit: false } }
