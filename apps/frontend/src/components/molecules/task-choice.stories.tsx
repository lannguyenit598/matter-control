import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { ListTodo } from 'lucide-react'

import { TaskChoice } from './task-choice'

const meta = {
  title: 'Molecules/TaskChoice',
  component: TaskChoice,
  parameters: { nextjs: { appDirectory: false } },
  args: {
    icon: <ListTodo />,
    title: 'Action',
    description: 'Work someone needs to do. For example: Prepare the board resolutions.',
    pressed: false,
    onClick: () => {},
  },
} satisfies Meta<typeof TaskChoice>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const Selected: Story = { args: { pressed: true } }
export const NotFinished: Story = { args: { unfinished: true } }
