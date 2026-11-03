import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { LocalDateTimeField } from './local-datetime-field'
import { FormDialog } from '@/components/organisms/form-dialog'
import { SelectionControl } from '@/components/atoms/selection-control'

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

export const InsideDialog: Story = {
  parameters: { nextjs: { appDirectory: false } },
  render: (args) => (
    <FormDialog trigger="Schedule work" title="Schedule work">
      {() => (
        <div className="flex flex-col gap-4">
          <LocalDateTimeField {...args} />
          <label className="flex items-center gap-3 text-sm">
            <SelectionControl />
            Include this deadline in the plan
          </label>
          <label className="flex items-center gap-3 text-sm">
            <SelectionControl defaultChecked />
            Keep the original evidence
          </label>
        </div>
      )}
    </FormDialog>
  ),
}
