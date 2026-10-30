'use client'

import { Download, FileDown, FileText, FileUp, Pencil } from 'lucide-react'
import { useState, type ReactNode } from 'react'

import { buttonVariants } from '@/components/atoms/button'
import { LocalizedText } from '@/components/molecules/localized-text'
import { TaskChoice } from '@/components/molecules/task-choice'
import { UnresolvedReporter } from '@/components/organisms/intent-form'

import { BriefSection } from './brief-section'
import { BulkSection, type BulkChoices } from './bulk-section'
import { ImportSection } from './import-section'
import { RecoveryGate } from './recovery-gate'

type Task = 'import' | 'bulk' | 'export' | 'brief'

/**
 * Data is a dedicated workspace, so it opens as a chooser of tasks (contract §2.7) instead of
 * showing every editor at once. Every task stays mounted and is only hidden while another one
 * shows, so a preview, a frozen attempt, a pending request or an unconfirmed outcome is never lost
 * by switching, and a task that still needs attention says so on its choice. The recovery check and
 * its alerts sit outside the chooser: they cannot be hidden behind an inactive task.
 */
export function DataTransferPanel({
  matterId,
  items,
  members,
}: { matterId: string } & BulkChoices) {
  const [task, setTask] = useState<Task | null>(null)
  const [attention, setAttention] = useState({ import: false, bulk: false })
  const [reportImport] = useState(() => (v: boolean) => setAttention((a) => ({ ...a, import: v })))
  const [reportBulk] = useState(() => (v: boolean) => setAttention((a) => ({ ...a, bulk: v })))

  const choices: { task: Task; icon: ReactNode; title: ReactNode; description: ReactNode }[] = [
    {
      task: 'import',
      icon: <FileUp />,
      title: <LocalizedText en="Import file" vi="Nhập tệp" />,
      description: (
        <LocalizedText
          en="Add or update work from a spreadsheet, after a preview."
          vi="Thêm hoặc cập nhật công việc từ bảng tính, sau khi xem trước."
        />
      ),
    },
    {
      task: 'bulk',
      icon: <Pencil />,
      title: <LocalizedText en="Bulk update" vi="Cập nhật hàng loạt" />,
      description: (
        <LocalizedText
          en="Change several work items at once, after a preview."
          vi="Thay đổi nhiều công việc cùng lúc, sau khi xem trước."
        />
      ),
    },
    {
      task: 'export',
      icon: <Download />,
      title: <LocalizedText en="Export" vi="Xuất dữ liệu" />,
      description: (
        <LocalizedText
          en="Download what you can read in this matter. Changes nothing."
          vi="Tải xuống những gì bạn đọc được trong hồ sơ này. Không thay đổi gì."
        />
      ),
    },
    {
      task: 'brief',
      icon: <FileText />,
      title: <LocalizedText en="Draft status brief" vi="Báo cáo tình trạng (bản nháp)" />,
      description: (
        <LocalizedText
          en="A draft summary of what changed. Read-only, never authoritative."
          vi="Bản nháp tóm tắt thay đổi. Chỉ để đọc, không có giá trị quyết định."
        />
      ),
    },
  ]
  const flagged = (t: Task) => (t === 'import' || t === 'bulk') && attention[t]
  const hidden = (t: Task) => task !== t

  return (
    <div className="flex flex-col gap-6">
      <div role="group" aria-label="Data tasks" className="grid gap-2 sm:grid-cols-2">
        {choices.map((c) => (
          <TaskChoice
            key={c.task}
            icon={c.icon}
            title={c.title}
            description={c.description}
            pressed={task === c.task}
            unfinished={flagged(c.task)}
            onClick={() => setTask(task === c.task ? null : c.task)}
          />
        ))}
      </div>
      <RecoveryGate key={matterId} matterId={matterId}>
        <div hidden={hidden('import')}>
          <UnresolvedReporter.Provider value={reportImport}>
            <ImportSection matterId={matterId} />
          </UnresolvedReporter.Provider>
        </div>
        <div hidden={hidden('bulk')}>
          <UnresolvedReporter.Provider value={reportBulk}>
            <BulkSection matterId={matterId} items={items} members={members} />
          </UnresolvedReporter.Provider>
        </div>
      </RecoveryGate>
      <section
        hidden={hidden('export')}
        className="flex flex-col gap-3"
        aria-labelledby="export-heading"
      >
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
            <FileDown aria-hidden />
            <LocalizedText en="Download XLSX" vi="Tải XLSX" />
          </a>
          <a
            className={buttonVariants({ variant: 'secondary' })}
            href={`/api/matters/${matterId}/export?format=csv`}
          >
            <FileDown aria-hidden />
            <LocalizedText en="Download CSV" vi="Tải CSV" />
          </a>
        </div>
      </section>
      <div hidden={hidden('brief')}>
        <BriefSection matterId={matterId} />
      </div>
    </div>
  )
}
