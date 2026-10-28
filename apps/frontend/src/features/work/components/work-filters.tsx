import { LocalizedText } from '@/components/molecules/localized-text'
import Link from 'next/link'

import { Button, buttonVariants } from '@/components/atoms/button'
import { Input } from '@/components/atoms/input'
import { Label } from '@/components/atoms/label'
import { Select } from '@/components/atoms/select'

import {
  WORK_LABEL_VI,
  ATTENTION_LABEL,
  DEPENDENCY_LABEL,
  EXECUTION_LABEL,
  KIND_LABEL,
  TIMING_LABEL,
} from '../labels'
import type { GridQuery, Workstream } from '../schemas'

const opts = (labels: Record<string, string>) =>
  Object.entries(labels).map(([value, label]) => ({
    value,
    label: <LocalizedText en={label} vi={WORK_LABEL_VI[value] ?? label} />,
  }))

/**
 * Filters are URL state in a plain GET form: shareable, back-button friendly, usable by keyboard
 * and without scripting. Applying a filter always starts from the first page.
 */
export function WorkFilters({
  basePath,
  query,
  workstreams,
  members,
}: {
  basePath: string
  query: GridQuery
  workstreams: Workstream[]
  members: { userId: string; displayName: string }[]
}) {
  return (
    <form
      method="get"
      action={basePath}
      role="search"
      aria-label="Filter work items"
      className="flex flex-col gap-3 rounded-lg border p-3"
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor="f-q">
            <LocalizedText en="Search title or outcome" vi="Tìm tiêu đề hoặc kết quả" />
          </Label>
          <Input id="f-q" name="q" defaultValue={query.q ?? ''} maxLength={200} />
        </div>
        <Field
          id="f-kind"
          label={<LocalizedText en="Type" vi="Loại" />}
          name="kind"
          value={query.kind}
          options={opts(KIND_LABEL)}
        />
        <Field
          id="f-exec"
          label={<LocalizedText en="Execution" vi="Thực hiện" />}
          name="execution"
          value={query.execution}
          options={opts(EXECUTION_LABEL)}
        />
        <Field
          id="f-dep"
          label={<LocalizedText en="Dependency" vi="Phụ thuộc" />}
          name="dependency"
          value={query.dependency}
          options={opts(DEPENDENCY_LABEL)}
        />
        <Field
          id="f-timing"
          label={<LocalizedText en="Timing" vi="Thời hạn" />}
          name="timing"
          value={query.timing}
          options={opts(TIMING_LABEL)}
        />
        <Field
          id="f-attn"
          label={<LocalizedText en="Attention" vi="Mức chú ý" />}
          name="attention"
          value={query.attention}
          options={opts(ATTENTION_LABEL)}
        />
        <Field
          id="f-owner"
          label={<LocalizedText en="Owner" vi="Người phụ trách" />}
          name="owner"
          value={query.owner}
          options={[
            { value: 'none', label: <LocalizedText en="Unassigned" vi="Chưa phân công" /> },
            ...members.map((m) => ({ value: m.userId, label: m.displayName })),
          ]}
        />
        <Field
          id="f-ws"
          label={<LocalizedText en="Workstream" vi="Nhóm công việc" />}
          name="workstream"
          value={query.workstream}
          options={workstreams.map((w) => ({ value: w.id, label: w.name }))}
        />
        <Field
          id="f-sort"
          label={<LocalizedText en="Sort by" vi="Sắp xếp theo" />}
          name="sort"
          value={query.sort}
          placeholder={<LocalizedText en="Due date" vi="Hạn chót" />}
          options={[
            { value: 'title', label: <LocalizedText en="Title" vi="Tiêu đề" /> },
            { value: 'execution', label: <LocalizedText en="Execution" vi="Thực hiện" /> },
            {
              value: 'attention',
              label: (
                <LocalizedText
                  en="Attention (most urgent first)"
                  vi="Mức chú ý (khẩn cấp nhất trước)"
                />
              ),
            },
          ]}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="submit">
          <LocalizedText en="Apply filters" vi="Áp dụng bộ lọc" />
        </Button>
        <Link href={basePath} className={buttonVariants({ variant: 'ghost' })}>
          <LocalizedText en="Clear filters" vi="Xóa bộ lọc" />
        </Link>
      </div>
    </form>
  )
}

function Field({
  id,
  label,
  name,
  value,
  options,
  placeholder = <LocalizedText en="Any" vi="Bất kỳ" />,
}: {
  id: string
  label: React.ReactNode
  name: string
  value: string | undefined
  options: { value: string; label: React.ReactNode }[]
  placeholder?: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Select
        id={id}
        name={name}
        defaultValue={value ?? ''}
        options={options}
        placeholder={placeholder}
      />
    </div>
  )
}
