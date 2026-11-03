import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { SelectionControl } from './selection-control'

const meta = { title: 'Atoms/SelectionControl', component: SelectionControl } satisfies Meta<
  typeof SelectionControl
>
export default meta
type Story = StoryObj<typeof meta>

export const States: Story = {
  render: () => (
    <div className="flex max-w-sm flex-col gap-3 text-sm">
      <label className="flex items-center gap-3">
        <SelectionControl name="proof" />
        Include this document
      </label>
      <label className="flex items-center gap-3">
        <SelectionControl defaultChecked />
        Selected evidence
      </label>
      <label className="flex items-center gap-3">
        <SelectionControl disabled defaultChecked />
        Unavailable evidence
      </label>
      <label className="flex items-center gap-3">
        <SelectionControl aria-invalid="true" />
        Required selection
      </label>
      <label className="flex items-center gap-3">
        <SelectionControl
          ref={(node) => {
            if (node) node.indeterminate = true
          }}
        />
        Some records selected
      </label>
      <label className="flex items-center gap-3">
        <SelectionControl type="radio" name="person" defaultChecked />
        Nguyễn Minh Anh
      </label>
      <label className="flex items-center gap-3">
        <SelectionControl type="radio" name="person" />
        Trần Bảo — Legal operations and corporate transactions
      </label>
    </div>
  ),
}
