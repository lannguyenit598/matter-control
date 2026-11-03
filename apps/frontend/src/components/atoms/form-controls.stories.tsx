import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { Input } from './input'
import { Select } from './select'
import { Textarea } from './textarea'

const meta = {
  title: 'Atoms/Form controls',
  parameters: {
    docs: { description: { component: 'Native controls styled with design tokens.' } },
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const All: Story = {
  render: () => (
    <div className="flex max-w-sm flex-col gap-4">
      <Input aria-label="Text" placeholder="Text input" />
      <Input aria-label="Invalid" aria-invalid defaultValue="Invalid value" />
      <Input aria-label="Disabled" disabled placeholder="Disabled" />
      <Textarea aria-label="Notes" placeholder="Textarea" />
      <Select
        aria-label="Status"
        placeholder="All statuses"
        options={[
          { value: 'open', label: 'Open' },
          { value: 'closed', label: 'Closed' },
        ]}
      />
    </div>
  ),
}

export const SelectPicker: Story = {
  render: () => (
    <div className="flex max-w-sm flex-col gap-4">
      <label className="flex flex-col gap-1.5 text-sm">
        Loại công việc
        <Select
          defaultValue=""
          placeholder="Bất kỳ"
          options={[
            { value: 'requirement', label: 'Yêu cầu' },
            { value: 'action', label: 'Hành động' },
            { value: 'unavailable', label: 'Không khả dụng', disabled: true },
          ]}
        />
      </label>
      <Select
        aria-label="Long options"
        options={[
          {
            value: 'long',
            label: 'Chuẩn bị hồ sơ tái cấu trúc và rà soát các điều kiện hoàn tất giao dịch',
          },
          { value: 'short', label: 'Rà soát hợp đồng' },
        ]}
      />
      <Select
        aria-label="Invalid choice"
        aria-invalid
        options={[{ value: '', label: 'Chọn trạng thái' }]}
      />
      <Select
        aria-label="Disabled choice"
        disabled
        options={[{ value: 'read-only', label: 'Chỉ xem' }]}
      />
    </div>
  ),
}
