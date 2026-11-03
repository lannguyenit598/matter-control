import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { Badge } from '@/components/atoms/badge'
import { Button } from '@/components/atoms/button'

import { LIST_CLASS, ListSection, ROW_CLASS } from './list-section'

const meta = {
  title: 'Molecules/ListSection',
  component: ListSection,
  parameters: { nextjs: { appDirectory: false } },
  args: {
    title: 'Members',
    count: 2,
    description: 'People who can open this.',
    action: <Button variant="outline">Add member</Button>,
    children: (
      <ul className={LIST_CLASS}>
        {[
          'Alex Nguyen',
          'A very long name that wraps onto a second line without hiding the badge',
        ].map((name) => (
          <li key={name} className={ROW_CLASS}>
            <span className="min-w-0 font-medium break-words">{name}</span>
            <Badge variant="neutral">Member</Badge>
          </li>
        ))}
      </ul>
    ),
  },
} satisfies Meta<typeof ListSection>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const WithoutAction: Story = { args: { action: undefined } }
