import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Pencil } from 'lucide-react'

import { IconDisclosure } from './icon-disclosure'

const meta = {
  title: 'Molecules/IconDisclosure',
  component: IconDisclosure,
  args: {
    icon: <Pencil />,
    label: { en: 'Edit TMA', vi: 'Sửa TMA' },
    children: <p className="text-sm">The form opens here, in place.</p>,
  },
} satisfies Meta<typeof IconDisclosure>

export default meta
type Story = StoryObj<typeof meta>

export const Closed: Story = {}
export const Open: Story = { args: { open: true } }
