import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { LocalDateTimeField } from './local-datetime-field'

const meta = {
  title: 'Molecules/LocalDateTimeField',
  component: LocalDateTimeField,
  args: { name: 'due', label: 'Due (date and time)' },
} satisfies Meta<typeof LocalDateTimeField>

export default meta
type Story = StoryObj<typeof meta>

/** The device zone is shown read-only; the stored instant is preserved when the value is untouched. */
export const Empty: Story = {}
export const EditingAnInstant: Story = { args: { current: '2026-10-30T03:00:27Z' } }
export const WithError: Story = { args: { error: 'Enter a valid date and time.', required: true } }
