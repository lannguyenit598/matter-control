import { LocalizedText } from '@/components/molecules/localized-text'
import type { Metadata } from 'next'

import { MatterTabs } from '@/features/matters/components/matter-tabs'

import { PageHeader } from '@/components/molecules/page-header'
import { DataTransferPanel } from '@/features/data-transfer/components/data-transfer-panel'

export const metadata: Metadata = { title: 'Data' }

export default async function DataPage({ params }: PageProps<'/matters/[matterId]/data'>) {
  const { matterId } = await params
  return (
    <>
      <PageHeader
        title={<LocalizedText en="Data" vi="Dữ liệu" />}
        description={
          <LocalizedText
            en="Bulk edit, import, export and delta brief for this matter."
            vi="Sửa hàng loạt, nhập/xuất dữ liệu và báo cáo thay đổi của hồ sơ này."
          />
        }
      />
      <MatterTabs matterId={matterId} active="data" />
      <DataTransferPanel matterId={matterId} />
    </>
  )
}
