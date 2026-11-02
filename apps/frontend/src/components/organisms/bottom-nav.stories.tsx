import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { Building2, ClipboardCheck, FolderOpen, ListChecks } from 'lucide-react'

import { BottomNav } from './bottom-nav'

const meta = {
  title: 'Organisms/BottomNav',
  component: BottomNav,
  parameters: { nextjs: { appDirectory: true, navigation: { pathname: '/matters/example' } } },
  args: {
    items: [
      { href: '/my-actions', label: 'My Work', icon: <ListChecks /> },
      { href: '/my-reviews', label: 'Reviews due', icon: <ClipboardCheck /> },
      { href: '/matters', label: 'Matters', icon: <FolderOpen /> },
      { href: '/workspaces', label: 'Workspaces', icon: <Building2 /> },
    ],
  },
  decorators: [
    (Story) => (
      <div data-workbench="pane" className="app-shell min-h-40">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof BottomNav>
export default meta
type Story = StoryObj<typeof meta>

/** Visible at the same <=800px breakpoint as the application shell. */
export const Default: Story = {}
export const VietnameseLabels: Story = {
  args: {
    items: [
      { href: '/my-actions', label: 'Việc của tôi', icon: <ListChecks /> },
      { href: '/my-reviews', label: 'Cần xác minh', icon: <ClipboardCheck /> },
      { href: '/matters', label: 'Hồ sơ', icon: <FolderOpen /> },
      { href: '/workspaces', label: 'Không gian làm việc', icon: <Building2 /> },
    ],
  },
}
