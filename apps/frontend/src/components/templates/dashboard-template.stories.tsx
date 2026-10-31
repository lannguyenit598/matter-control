import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { LayoutDashboard, Settings, Users } from 'lucide-react'

import { Skeleton } from '@/components/atoms/skeleton'
import { Button } from '@/components/atoms/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/atoms/card'
import { DataTable } from '@/components/organisms/data-table'
import { PageHeader } from '@/components/molecules/page-header'
import { ThemeToggle } from '@/components/molecules/theme-toggle'
import { AppHeader } from '@/components/organisms/app-header'
import { AppSidebar } from '@/components/organisms/app-sidebar'
import { MobileNav } from '@/components/organisms/mobile-nav'

import { DashboardTemplate } from './dashboard-template'

const nav = [
  { href: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard /> },
  { href: '/users', label: 'Users', icon: <Users /> },
  { href: '/settings', label: 'Settings', icon: <Settings /> },
]

const meta = {
  title: 'Templates/DashboardTemplate',
  component: DashboardTemplate,
  parameters: { layout: 'fullscreen', nextjs: { navigation: { pathname: '/dashboard' } } },
  args: {
    sidebar: <AppSidebar brand="Acme Admin" items={nav} />,
    header: <AppHeader start={<MobileNav items={nav} />} end={<ThemeToggle />} />,
    // Template = structure with placeholder content; real content belongs to the Page.
    children: (
      <div className="flex flex-col gap-6">
        <PageHeader title="Page title" description="Page description" />
        <div className="grid gap-4 sm:grid-cols-3">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
        <Skeleton className="h-64" />
      </div>
    ),
  },
} satisfies Meta<typeof DashboardTemplate>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const LiquidWorkbench: Story = {
  args: {
    children: (
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Atlas restructuring"
          description="A clear view of the work, with evidence behind every decision."
          actions={<Button>New record</Button>}
        />
        <div className="grid gap-4 sm:grid-cols-3">
          {['Ready for review', 'Awaiting proof', 'Next milestone'].map((title) => (
            <Card key={title}>
              <CardHeader>
                <CardTitle>{title}</CardTitle>
              </CardHeader>
              <CardContent>Operational truth, in context.</CardContent>
            </Card>
          ))}
        </div>
        <DataTable
          caption="Synthetic matter records"
          getRowKey={(row) => row.title}
          rows={[
            { title: 'Board approval', owner: 'Linh Nguyen', status: 'Awaiting proof' },
            { title: 'Share transfer agreement', owner: 'Mai Tran', status: 'In progress' },
            { title: 'Authority submission', owner: 'An Le', status: 'Ready' },
          ]}
          columns={[
            { id: 'title', header: 'Record', cell: (row) => row.title },
            { id: 'owner', header: 'Owner', cell: (row) => row.owner },
            { id: 'status', header: 'Status', cell: (row) => row.status },
            {
              id: 'action',
              header: 'Action',
              cell: () => (
                <Button variant="outline" size="sm">
                  Open record
                </Button>
              ),
            },
          ]}
        />
      </div>
    ),
  },
}

export const LiquidWorkbenchDark: Story = {
  ...LiquidWorkbench,
  globals: { theme: 'dark' },
}
