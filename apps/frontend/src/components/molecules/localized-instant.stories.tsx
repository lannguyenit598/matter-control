import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { LocalizedInstant } from './localized-instant'
import { LocaleToggle } from './locale-toggle'

const meta = {
  title: 'Molecules/LocalizedInstant',
  component: LocalizedInstant,
  args: { iso: '2026-10-28T09:15:00Z' },
} satisfies Meta<typeof LocalizedInstant>

export default meta
type Story = StoryObj<typeof meta>

export const DisplayPreferences: Story = {
  render: (args) => (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <LocaleToggle />
      </div>
      <LocalizedInstant {...args} />
      <label>
        Untranslated draft
        <input defaultValue="Original legal wording" />
      </label>
    </div>
  ),
}
