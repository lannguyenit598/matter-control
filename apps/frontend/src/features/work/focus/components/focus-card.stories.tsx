import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { PrivateUiProvider } from '@/lib/mc/private-ui-events'
import { FocusProvider } from '../provider'
import { FocusCard } from './focus-card'

const meta = {
  title: 'Features/Work/Focus',
  component: FocusCard,
  args: { target: { matterId: 'story-matter', actionId: 'story-action' } },
  decorators: [
    (Story) => (
      <PrivateUiProvider identity={null}>
        <FocusProvider identity={null}>
          <Story />
        </FocusProvider>
      </PrivateUiProvider>
    ),
  ],
} satisfies Meta<typeof FocusCard>
export default meta
type Story = StoryObj<typeof meta>
export const SessionUnavailable: Story = {}
