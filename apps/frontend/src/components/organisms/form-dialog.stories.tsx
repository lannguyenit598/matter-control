import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { Input } from '@/components/atoms/input'

import { FormDialog, TaskDialog } from './form-dialog'

const meta = {
  title: 'Organisms/FormDialog',
  component: FormDialog,
  parameters: { nextjs: { appDirectory: false } },
  args: {
    trigger: 'Create item',
    title: 'Create item',
    description: 'Start with a name. More can be added afterwards.',
    children: ({ close }) => (
      <div className="flex flex-col gap-3">
        <Input aria-label="Name" data-autofocus />
        <button type="button" className="self-start underline" onClick={close}>
          Done
        </button>
      </div>
    ),
  },
} satisfies Meta<typeof FormDialog>
export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const Secondary: Story = { args: { triggerVariant: 'outline' } }

/** For server pages: plain children, mounted for as long as the page is. */
export const ServerPageTask: StoryObj<typeof TaskDialog> = {
  render: () => (
    <TaskDialog
      trigger="Add milestone"
      title="Add milestone"
      description="A point in the matter that is ready only when its required Requirements are met."
    >
      <Input aria-label="Milestone name" data-autofocus />
    </TaskDialog>
  ),
}
