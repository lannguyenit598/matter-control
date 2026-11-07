import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { Input } from '@/components/atoms/input'

import { FormField } from './form-field'

const meta = {
  title: 'Molecules/FormField',
  component: FormField,
  // W6 (UX-B-05): realistic field measure — a form field never spans the 1440px canvas.
  decorators: [
    (Story) => (
      <div className="max-w-[420px]">
        <Story />
      </div>
    ),
  ],
  args: {
    label: 'Email',
    hint: 'We never share your email.',
    children: (field) => <Input type="email" placeholder="you@company.com" {...field} />,
  },
} satisfies Meta<typeof FormField>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const Required: Story = { args: { required: true } }
export const WithError: Story = { args: { error: 'Enter a valid email address' } }
