import Form from 'next/form'
import { ChevronDown, Filter, Search, SlidersHorizontal, X } from 'lucide-react'
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
 * Filters are URL state with client-side navigation: shareable, back-button friendly, usable by keyboard
 * and without scripting. Applying a filter always starts from the first page.
 */
export function WorkFilters({
  basePath,
  query,
  workstreams,
  members,
  density = 'comfortable',
}: {
  basePath: string
  query: GridQuery
  workstreams: Workstream[]
  members: { userId: string; displayName: string }[]
  density?: 'comfortable' | 'compact'
}) {
  const filters = [
    { name: 'kind', label: <LocalizedText en="Type" vi="Loại" />, options: opts(KIND_LABEL) },
    {
      name: 'execution',
      label: <LocalizedText en="Execution" vi="Thực hiện" />,
      options: opts(EXECUTION_LABEL),
    },
    {
      name: 'dependency',
      label: <LocalizedText en="Dependency" vi="Phụ thuộc" />,
      options: opts(DEPENDENCY_LABEL),
    },
    {
      name: 'timing',
      label: <LocalizedText en="Timing" vi="Thời hạn" />,
      options: opts(TIMING_LABEL),
    },
    {
      name: 'attention',
      label: <LocalizedText en="Attention" vi="Mức chú ý" />,
      options: opts(ATTENTION_LABEL),
    },
    {
      name: 'owner',
      label: <LocalizedText en="Owner" vi="Người phụ trách" />,
      options: [
        { value: 'none', label: <LocalizedText en="Unassigned" vi="Chưa phân công" /> },
        ...members.map((m) => ({ value: m.userId, label: m.displayName })),
        ...(query.owner && query.owner !== 'none' && !members.some((m) => m.userId === query.owner)
          ? [
              {
                value: query.owner,
                label: (
                  <LocalizedText
                    en="Selected member (unavailable)"
                    vi="Thành viên đã chọn (không còn trong danh sách)"
                  />
                ),
              },
            ]
          : []),
      ],
    },
    {
      name: 'workstream',
      label: <LocalizedText en="Workstream" vi="Nhóm công việc" />,
      options: [
        ...workstreams.map((w) => ({ value: w.id, label: w.name })),
        ...(query.workstream && !workstreams.some((w) => w.id === query.workstream)
          ? [
              {
                value: query.workstream,
                label: (
                  <LocalizedText
                    en="Selected workstream (unavailable)"
                    vi="Nhóm đã chọn (không còn trong danh sách)"
                  />
                ),
              },
            ]
          : []),
      ],
    },
  ] satisfies {
    name: keyof GridQuery
    label: React.ReactNode
    options: { value: string; label: React.ReactNode }[]
  }[]
  const active = filters.filter((f) => query[f.name])
  const chips = [
    ...(query.q
      ? [{ name: 'q', label: <LocalizedText en="Search" vi="Tìm kiếm" />, value: query.q }]
      : []),
    ...active.map((f) => ({
      name: f.name,
      label: f.label,
      value: f.options.find((o) => o.value === query[f.name])?.label,
    })),
  ]
  const without = (removed: string[]) => {
    const p = new URLSearchParams()
    for (const [name, value] of Object.entries(query)) {
      if (value && name !== 'cursor' && !removed.includes(name)) p.set(name, value)
    }
    if (density === 'compact') p.set('density', density)
    const search = p.toString()
    return search ? `${basePath}?${search}` : basePath
  }
  return (
    <Form
      scroll={false}
      action={basePath}
      role="search"
      aria-label="Filter work items"
      className="flex min-w-0 flex-col gap-3 rounded-lg border bg-card p-3"
    >
      {density === 'compact' && <input type="hidden" name="density" value="compact" />}
      {query.desc && <input type="hidden" name="desc" value={query.desc} />}
      <div className="flex min-w-0 items-end gap-2">
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <Label htmlFor="f-q">
            <LocalizedText en="Search title or outcome" vi="Tìm tiêu đề hoặc kết quả" />
          </Label>
          <div className="relative">
            <Search
              aria-hidden
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              id="f-q"
              name="q"
              type="search"
              className="pl-9"
              defaultValue={query.q ?? ''}
              maxLength={200}
            />
          </div>
        </div>
        <Button type="submit">
          <Search aria-hidden />
          <LocalizedText en="Search" vi="Tìm kiếm" />
        </Button>
      </div>
      <details className="group">
        <summary
          className={`${buttonVariants({ variant: 'outline' })} w-fit cursor-pointer list-none [&::-webkit-details-marker]:hidden`}
        >
          <SlidersHorizontal aria-hidden />
          <LocalizedText en="Advanced filters" vi="Bộ lọc nâng cao" />
          {active.length > 0 && (
            <span className="rounded bg-muted px-1.5 text-xs tabular-nums">{active.length}</span>
          )}
          <ChevronDown aria-hidden className="transition-transform group-open:rotate-180" />
        </summary>
        <fieldset className="mt-3 min-w-0 border-t pt-3">
          <legend className="sr-only">
            <LocalizedText en="Advanced criteria" vi="Tiêu chí nâng cao" />
          </legend>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {filters.map((f) => (
              <Field
                key={f.name}
                id={`f-${f.name}`}
                name={f.name}
                label={f.label}
                value={query[f.name]}
                options={f.options}
              />
            ))}
            <Field
              id="f-sort"
              name="sort"
              label={<LocalizedText en="Sort by" vi="Sắp xếp theo" />}
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
          <Button type="submit" className="mt-3">
            <Filter aria-hidden />
            <LocalizedText en="Apply filters" vi="Áp dụng bộ lọc" />
          </Button>
        </fieldset>
      </details>
      {chips.length > 0 && (
        <div className="flex min-w-0 flex-wrap items-center gap-2" aria-label="Applied filters">
          <span className="text-xs text-muted-foreground">
            <LocalizedText en="Applied:" vi="Đang áp dụng:" />
          </span>
          {chips.map((chip) => (
            <Link
              key={chip.name}
              href={without([chip.name])}
              scroll={false}
              className="inline-flex min-h-9 max-w-full items-center gap-1.5 rounded-full border bg-muted px-3 py-1 text-xs hover:bg-accent"
            >
              <span className="sr-only">
                <LocalizedText en="Remove filter: " vi="Xóa bộ lọc: " />
              </span>{' '}
              <span className="min-w-0 [overflow-wrap:anywhere]">
                {chip.label}: {chip.value}
              </span>
              <X aria-hidden className="size-3.5 shrink-0" />
            </Link>
          ))}
          <Link
            href={without(['q', ...filters.map((f) => f.name)])}
            scroll={false}
            className={buttonVariants({ variant: 'ghost', size: 'sm' })}
          >
            <X aria-hidden />
            <LocalizedText en="Clear filters" vi="Xóa bộ lọc" />
          </Link>
        </div>
      )}
    </Form>
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
