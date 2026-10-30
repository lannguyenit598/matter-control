import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Languages } from 'lucide-react'
import { Select } from './select'

const meta = {
  title: 'Atoms/Select',
  component: Select,
  // This native control has no Next.js routing dependency.
  parameters: { nextjs: { appDirectory: false } },
  args: {
    'aria-label': 'Person',
    placeholder: 'Select a person…',
    options: [
      { value: 'alex', label: 'Alex Nguyen' },
      { value: 'bao', label: 'Bao Tran' },
      { value: 'inactive', label: 'Unavailable member', disabled: true },
    ],
  },
} satisfies Meta<typeof Select>
export default meta
type Story = StoryObj<typeof meta>
export const Placeholder: Story = {}
export const Selected: Story = { args: { defaultValue: 'alex' } }
export const Disabled: Story = { args: { defaultValue: 'alex', disabled: true } }
export const Invalid: Story = { args: { 'aria-invalid': true } }
export const Language: Story = {
  args: {
    'aria-label': 'Ngôn ngữ giao diện',
    leadingIcon: <Languages />,
    placeholder: undefined,
    defaultValue: 'vi',
    options: [
      { value: 'en', label: 'English' },
      { value: 'vi', label: 'Tiếng Việt' },
    ],
  },
}
export const LongList: Story = {
  args: {
    options: Array.from({ length: 40 }, (_, i) => ({
      value: String(i),
      label: `Team member ${i + 1}`,
    })),
  },
}
export const LongLabels: Story = {
  args: {
    options: [
      {
        value: 'long',
        label: 'Corporate legal — international acquisitions and regulatory compliance team',
      },
      { value: 'short', label: 'Finance' },
    ],
  },
}
