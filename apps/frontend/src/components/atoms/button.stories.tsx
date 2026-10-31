import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Plus } from 'lucide-react'

import { Button } from './button'

const meta = {
  title: 'Atoms/Button',
  component: Button,
  args: { children: 'Button' },
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'outline', 'ghost', 'destructive'],
    },
    size: { control: 'select', options: ['sm', 'md', 'icon'] },
  },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {}

export const Variants: Story = {
  render: (args) => (
    <div className="flex flex-wrap gap-2">
      {(['primary', 'secondary', 'outline', 'ghost', 'destructive'] as const).map((v) => (
        <Button key={v} {...args} variant={v}>
          {v}
        </Button>
      ))}
    </div>
  ),
}

export const WithIcon: Story = {
  args: {
    children: (
      <>
        <Plus aria-hidden /> New item
      </>
    ),
  },
}

export const Loading: Story = { args: { loading: true, children: 'Saving' } }

export const Disabled: Story = { args: { disabled: true } }

/** The material needs a backdrop; this uses the same atmospheric field as the real app. */
export const GlassOnBackdrop: Story = {
  render: () => (
    <div className="app-shell flex min-h-64 flex-wrap items-center justify-center gap-3 rounded-xl p-8">
      <Button>
        <Plus aria-hidden /> Add record
      </Button>
      <Button variant="outline">View history</Button>
      <Button variant="secondary">Filter records</Button>
      <Button variant="ghost">Cancel</Button>
      <Button loading>Saving</Button>
      <Button variant="outline" disabled>
        Unavailable
      </Button>
      <Button variant="destructive">Remove</Button>
    </div>
  ),
}

export const GlassOnBackdropDark: Story = {
  ...GlassOnBackdrop,
  globals: { theme: 'dark' },
}
