import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { Button } from '@/components/atoms/button'

import { ActionAnnouncer, announceActionResult } from './action-announcer'

const meta = {
  title: 'Organisms/ActionAnnouncer',
  component: ActionAnnouncer,
} satisfies Meta<typeof ActionAnnouncer>

export default meta
type Story = StoryObj<typeof meta>

/** Synthetic result controls; no request or domain mutation is sent. Inspect the live region with AT. */
export const Results: Story = {
  render: () => (
    <ActionAnnouncer>
      <div className="flex flex-wrap gap-3">
        <Button onClick={() => announceActionResult({ ok: true })}>Announce saved</Button>
        <Button
          variant="outline"
          onClick={() => announceActionResult({ ok: true, replayed: true })}
        >
          Announce replayed result
        </Button>
        <Button
          variant="outline"
          onClick={() =>
            announceActionResult({
              ok: false,
              kind: 'outcome-unknown',
              error: '',
              requiresReread: true,
            })
          }
        >
          Announce unknown outcome
        </Button>
      </div>
    </ActionAnnouncer>
  ),
}
