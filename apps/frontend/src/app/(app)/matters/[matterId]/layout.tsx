import { Suspense } from 'react'

import { Skeleton } from '@/components/atoms/skeleton'
import { MatterScope } from '@/features/matters/components/matter-scope'

export default function MatterLayout({ children, params }: LayoutProps<'/matters/[matterId]'>) {
  return (
    <Suspense fallback={<Skeleton className="h-32 w-full" />}>
      <Scope params={params}>{children}</Scope>
    </Suspense>
  )
}

async function Scope({
  children,
  params,
}: Pick<LayoutProps<'/matters/[matterId]'>, 'children' | 'params'>) {
  const { matterId } = await params
  return <MatterScope matterId={matterId}>{children}</MatterScope>
}
