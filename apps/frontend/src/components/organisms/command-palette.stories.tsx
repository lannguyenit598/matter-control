import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { CommandPalette } from './command-palette'

const meta = {
  title: 'Organisms/CommandPalette',
  component: CommandPalette,
  parameters: { nextjs: { appDirectory: false } },
} satisfies Meta<typeof CommandPalette>
export default meta
type Story = StoryObj<typeof meta>

/** Header trigger + ⌘K dialog over the app's main destinations. */
export const Default: Story = {}
