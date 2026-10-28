'use client'

import { LocalizedText } from '@/components/molecules/localized-text'

import { buttonVariants } from '@/components/atoms/button'

import { BriefSection } from './brief-section'
import { BulkSection } from './bulk-section'
import { ImportSection } from './import-section'
import { RecoveryGate } from './recovery-gate'

/** Bulk edit, import, export and the draft brief of one matter (contract §2.7). */
export function DataTransferPanel({ matterId }: { matterId: string }) {
  return (
    <div className="flex flex-col gap-8">
      <RecoveryGate key={matterId} matterId={matterId}>
        <BulkSection matterId={matterId} />
        <ImportSection matterId={matterId} />
      </RecoveryGate>
      <section className="flex flex-col gap-3" aria-labelledby="export-heading">
        <h2 id="export-heading" className="text-lg font-semibold">
          <LocalizedText en="Export" vi="Xuất dữ liệu" />
        </h2>
        <p className="text-sm text-muted-foreground">
          What you can read in this matter, as it is now. Your access is checked again when the file
          is produced, and a value starting with = + - or @ is exported as literal text.
        </p>
        <div className="flex flex-wrap gap-2">
          <a
            className={buttonVariants({ variant: 'secondary' })}
            href={`/api/matters/${matterId}/export?format=xlsx`}
          >
            <LocalizedText en="Download XLSX" vi="Tải XLSX" />
          </a>
          <a
            className={buttonVariants({ variant: 'secondary' })}
            href={`/api/matters/${matterId}/export?format=csv`}
          >
            <LocalizedText en="Download CSV" vi="Tải CSV" />
          </a>
        </div>
      </section>
      <BriefSection matterId={matterId} />
    </div>
  )
}
