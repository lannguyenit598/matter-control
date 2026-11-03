'use client'

import { useState } from 'react'

import { Badge } from '@/components/atoms/badge'
import { Button } from '@/components/atoms/button'
import { Input } from '@/components/atoms/input'
import { Select } from '@/components/atoms/select'
import { EmptyState } from '@/components/molecules/empty-state'
import { FormField } from '@/components/molecules/form-field'
import { LocalizedText } from '@/components/molecules/localized-text'
import { IntentForm } from '@/components/organisms/intent-form'

import { createPlaybookAction, publishPlaybookAction } from '../actions'
import type { Playbook, PlaybookEntry } from '../schemas'

const EMPTY_ROW: PlaybookEntry = { key: '', kind: 'REQUIREMENT', title: '', outcome: '' }

/**
 * Workspace OWNER authoring (RLF-05): create a playbook container and publish immutable
 * revisions with structured entries — stable keys, kinds, titles, outcomes, optional owner
 * keys and template dependencies. Publication is receipted and the workspace CAS guards
 * concurrent administrative edits. No entry ever executes anything: applying only creates
 * records through the ordinary matter commands.
 */
export function PlaybookPanel({
  workspaceId,
  wsEtag,
  playbooks,
}: {
  workspaceId: string
  wsEtag: string
  playbooks: Playbook[]
}) {
  const [selected, setSelected] = useState<string>('')
  const [entries, setEntries] = useState<PlaybookEntry[]>([{ ...EMPTY_ROW }])
  const chosen = playbooks.find((p) => p.id === selected)
  const update = (i: number, patch: Partial<PlaybookEntry>) =>
    setEntries((rows) => rows.map((r, j) => (j === i ? { ...r, ...patch } : r)))
  return (
    <div className="flex flex-col gap-4">
      {playbooks.length === 0 ? (
        <EmptyState
          title={<LocalizedText en="No playbooks yet" vi="Chưa có playbook nào" />}
          description={
            <LocalizedText
              en="A playbook is a reusable checklist a Workspace OWNER publishes; a Matter OWNER can apply one exact revision to a Matter."
              vi="Playbook là danh sách mẫu do Chủ sở hữu không gian làm việc công bố; Chủ sở hữu hồ sơ có thể áp dụng đúng một phiên bản vào hồ sơ."
            />
          }
        />
      ) : (
        <ul className="flex flex-col divide-y rounded-lg border bg-card">
          {playbooks.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2">
              <button
                type="button"
                className="control-target font-medium underline-offset-2 hover:underline"
                onClick={() => setSelected(p.id)}
              >
                {p.name}
              </button>
              <Badge variant="outline">v{p.revision}</Badge>
            </li>
          ))}
        </ul>
      )}

      {chosen && (
        <PublishEntries
          workspaceId={workspaceId}
          playbookId={chosen.id}
          playbookName={chosen.name}
          wsEtag={wsEtag}
          entries={entries}
          setEntries={setEntries}
          update={update}
        />
      )}
      {!chosen && (
        <IntentForm
          receipted
          draftKey={`playbook:${workspaceId}:new`}
          submitLabel={<LocalizedText en="Create playbook" vi="Tạo playbook" />}
          run={(v, key) =>
            createPlaybookAction({
              workspaceId,
              idempotencyKey: key,
              ifMatch: wsEtag,
              name: v.name ?? '',
            })
          }
        >
          {({ errors }) => (
            <FormField
              label={<LocalizedText en="New playbook name" vi="Tên playbook mới" />}
              required
              error={errors.name?.[0]}
            >
              {(c) => <Input name="name" maxLength={100} autoComplete="off" {...c} />}
            </FormField>
          )}
        </IntentForm>
      )}
    </div>
  )
}

function PublishEntries({
  workspaceId,
  playbookId,
  playbookName,
  wsEtag,
  entries,
  setEntries,
  update,
}: {
  workspaceId: string
  playbookId: string
  playbookName: string
  wsEtag: string
  entries: PlaybookEntry[]
  setEntries: (rows: PlaybookEntry[]) => void
  update: (i: number, patch: Partial<PlaybookEntry>) => void
}) {
  return (
    <section
      aria-label={`Publish a revision of ${playbookName}`}
      className="flex flex-col gap-3 rounded-lg border bg-card p-3"
    >
      <h3 className="text-sm font-semibold">
        <LocalizedText
          en={`Publish a new revision of “${playbookName}”`}
          vi={`Công bố phiên bản mới của “${playbookName}”`}
        />
      </h3>
      {entries.map((row, i) => (
        <fieldset key={i} className="grid gap-2 rounded-md border p-2 sm:grid-cols-2">
          <legend className="px-1 text-xs text-muted-foreground">#{i + 1}</legend>
          <FormField label={<LocalizedText en="Key" vi="Mã" />} required>
            {(c) => (
              <Input
                name={`key-${i}`}
                maxLength={100}
                autoComplete="off"
                value={row.key}
                onChange={(e) => update(i, { key: e.target.value })}
                {...c}
              />
            )}
          </FormField>
          <FormField label={<LocalizedText en="Kind" vi="Loại" />} required>
            {(c) => (
              <Select
                name={`kind-${i}`}
                value={row.kind}
                onChange={(e) => update(i, { kind: e.target.value as PlaybookEntry['kind'] })}
                options={[
                  { value: 'REQUIREMENT', label: 'Requirement' },
                  { value: 'ACTION', label: 'Action' },
                ]}
                {...c}
              />
            )}
          </FormField>
          <FormField label={<LocalizedText en="Title" vi="Tiêu đề" />} required>
            {(c) => (
              <Input
                name={`title-${i}`}
                maxLength={300}
                autoComplete="off"
                value={row.title}
                onChange={(e) => update(i, { title: e.target.value })}
                {...c}
              />
            )}
          </FormField>
          <FormField label={<LocalizedText en="Outcome to reach" vi="Kết quả cần đạt" />} required>
            {(c) => (
              <Input
                name={`outcome-${i}`}
                maxLength={5000}
                autoComplete="off"
                value={row.outcome}
                onChange={(e) => update(i, { outcome: e.target.value })}
                {...c}
              />
            )}
          </FormField>
          <FormField
            label={<LocalizedText en="Owner key (optional)" vi="Mã người phụ trách (tùy chọn)" />}
          >
            {(c) => (
              <Input
                name={`ownerKey-${i}`}
                maxLength={100}
                autoComplete="off"
                value={row.ownerKey ?? ''}
                onChange={(e) => update(i, { ownerKey: e.target.value || undefined })}
                {...c}
              />
            )}
          </FormField>
          <FormField
            label={
              <LocalizedText
                en="Depends on keys (comma-separated)"
                vi="Phụ thuộc các mã (phân cách bởi dấu phẩy)"
              />
            }
          >
            {(c) => (
              <Input
                name={`dependsOn-${i}`}
                autoComplete="off"
                value={(row.dependsOn ?? []).join(', ')}
                onChange={(e) =>
                  update(i, {
                    dependsOn: e.target.value
                      .split(',')
                      .map((s) => s.trim())
                      .filter(Boolean),
                  })
                }
                {...c}
              />
            )}
          </FormField>
        </fieldset>
      ))}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => setEntries([...entries, { ...EMPTY_ROW }])}
        >
          <LocalizedText en="Add step" vi="Thêm bước" />
        </Button>
      </div>
      <IntentForm
        receipted
        draftKey={`playbook:${playbookId}:publish`}
        submitLabel={
          <LocalizedText en="Publish immutable revision" vi="Công bố phiên bản bất biến" />
        }
        run={(_v, key) =>
          publishPlaybookAction({
            workspaceId,
            playbookId,
            idempotencyKey: key,
            ifMatch: wsEtag,
            entries,
          })
        }
      >
        {() => null}
      </IntentForm>
    </section>
  )
}
