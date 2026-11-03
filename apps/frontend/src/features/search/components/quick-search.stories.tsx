import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { SearchBody } from './quick-search'

const meta = {
  title: 'Features/Search/QuickSearch',
  component: SearchBody,
  args: {
    destinations: [
      { href: '/my-actions', en: 'My Work', vi: 'Việc của tôi' },
      { href: '/matters', en: 'Matters', vi: 'Hồ sơ' },
      { href: '/workspaces', en: 'Workspaces', vi: 'Không gian' },
    ],
    close: () => {},
  },
} satisfies Meta<typeof SearchBody>
export default meta
type Story = StoryObj<typeof meta>
export const Pages: Story = {}
